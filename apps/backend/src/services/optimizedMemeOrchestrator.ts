import { 
  MemeCreationState, 
  MemeCreationStatus, 
  MemeCreationStep,
  WebSocketEvent
} from '@ai-meme-studio/shared-types';
import { UnifiedImageGenerator } from '../agents/unifiedImageGenerator.js';
import { DatabaseService } from './database.js';
import { FileStorageService } from './fileStorage.js';

export class OptimizedMemeOrchestrator {
  private unifiedGenerator: UnifiedImageGenerator;
  private database: DatabaseService;
  private fileStorage: FileStorageService;

  constructor() {
    this.unifiedGenerator = new UnifiedImageGenerator();
    this.database = new DatabaseService();
    this.fileStorage = new FileStorageService();
  }

  async createOptimizedMeme(
    memeState: MemeCreationState,
    onProgress?: (event: WebSocketEvent) => void
  ): Promise<MemeCreationState> {
    try {
      if (!memeState.concept) {
        throw new Error('Concept is required for AI-generated memes');
      }

      memeState.status = MemeCreationStatus.GENERATING_BACKGROUND;
      memeState.currentStep = MemeCreationStep.SET_DESIGN;
      memeState.updatedAt = new Date();
      
      this.emitProgress(memeState, onProgress, 'Generating optimized meme image...');

      const userDescription = memeState.customText || `A meme about: ${memeState.concept}`;
      
      const generationResult = await this.unifiedGenerator.execute({
        concept: memeState.concept,
        description: userDescription
      });

      const imagePath = await this.fileStorage.saveFinalMeme(generationResult.memeImage);
      
      memeState.finalMeme = { 
        ...generationResult.memeImage, 
        url: imagePath 
      };
      
      memeState.captions = generationResult.suggestedCaptions;
      memeState.status = MemeCreationStatus.COMPLETED;
      memeState.currentStep = MemeCreationStep.COMPLETED;
      memeState.updatedAt = new Date();
      
      this.database.saveMeme(memeState);
      this.emitProgress(memeState, onProgress, 'Meme generated successfully! You can now add text.');

      return memeState;
    } catch (error) {
      console.error('Optimized meme creation failed:', error);
      
      memeState.status = MemeCreationStatus.FAILED;
      memeState.error = (error as Error).message;
      memeState.updatedAt = new Date();
      this.database.saveMeme(memeState);
      
      if (onProgress) {
        onProgress({
          type: 'error',
          memeId: memeState.id,
          error: (error as Error).message
        });
      }
      
      throw error;
    }
  }

  async addTextToMeme(
    memeId: string,
    texts: Array<{
      content: string;
      x: number;
      y: number;
      fontSize: number;
      color: string;
      fontWeight?: string;
    }>
  ): Promise<MemeCreationState> {
    const memeState = this.database.getMemeById(memeId);
    if (!memeState) {
      throw new Error('Meme not found');
    }

    if (!memeState.finalMeme) {
      throw new Error('No base image found for this meme');
    }

    try {
      // Use the image compositor to add text overlays
      const { ImageCompositor } = await import('./imageCompositor.js');
      const compositor = new ImageCompositor();
      
      let imageWithText = memeState.finalMeme;
      
      // Add each text element one by one
      for (const text of texts) {
        imageWithText = await compositor.addCustomTextToImage(imageWithText, {
          text: text.content,
          position: { x: text.x, y: text.y },
          style: {
            fontSize: text.fontSize,
            color: text.color,
            fontWeight: text.fontWeight || 'bold',
            fontFamily: 'Impact, Arial Black, sans-serif'
          }
        });
      }

      // Save the new image with text
      const finalImagePath = await this.fileStorage.saveFinalMeme(imageWithText);
      
      memeState.finalMeme = {
        ...imageWithText,
        url: finalImagePath
      };
      
      memeState.updatedAt = new Date();
      this.database.saveMeme(memeState);
      
      return memeState;
    } catch (error) {
      console.error('Failed to add text to meme:', error);
      throw new Error('Failed to add text to meme: ' + (error as Error).message);
    }
  }

  private emitProgress(
    memeState: MemeCreationState,
    onProgress?: (event: WebSocketEvent) => void,
    message?: string
  ): void {
    if (onProgress) {
      onProgress({
        type: 'progress',
        memeId: memeState.id,
        status: memeState.status,
        currentStep: memeState.currentStep,
        message: message || `Step: ${memeState.currentStep}`
      });
    }
  }

  async getMemeHistory(): Promise<MemeCreationState[]> {
    return this.database.getAllMemes();
  }

  async deleteMeme(memeId: string): Promise<boolean> {
    try {
      const meme = this.database.getMemeById(memeId);
      if (meme?.finalMeme?.url) {
        await this.fileStorage.deleteImage(meme.finalMeme.url);
      }
      this.database.deleteMeme(memeId);
      return true;
    } catch (error) {
      console.error('Failed to delete meme:', error);
      return false;
    }
  }
} 