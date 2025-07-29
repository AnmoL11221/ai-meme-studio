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

  async createOptimizedMemeWithDescription(
    memeState: MemeCreationState,
    imageDescription: string,
    onProgress?: (event: WebSocketEvent) => void
  ): Promise<MemeCreationState> {
    try {
      if (!memeState.concept) {
        throw new Error('Concept is required for AI-generated memes');
      }

      memeState.status = MemeCreationStatus.GENERATING_BACKGROUND;
      memeState.currentStep = MemeCreationStep.SET_DESIGN;
      memeState.updatedAt = new Date();
      
      this.emitProgress(memeState, onProgress, 'Generating clean, simple meme image...');
      
      const generationResult = await this.unifiedGenerator.execute({
        concept: memeState.concept,
        description: imageDescription
      });

      this.emitProgress(memeState, onProgress, 'Adding text overlay...');

      const { ImageCompositor } = await import('./imageCompositor.js');
      const compositor = new ImageCompositor();
      
      let finalImage = generationResult.memeImage;
      
      if (memeState.customText && memeState.customText.trim()) {
        const memeText = memeState.customText.trim();
        console.log(`📝 Adding meme text: "${memeText}"`);
        finalImage = await compositor.addTextToImage(generationResult.memeImage, memeText, 'auto');
      }

      const imagePath = await this.fileStorage.saveFinalMeme(finalImage);
      
      memeState.finalMeme = { 
        ...finalImage, 
        url: imagePath 
      };
      
      memeState.captions = generationResult.suggestedCaptions;
      memeState.status = MemeCreationStatus.COMPLETED;
      memeState.currentStep = MemeCreationStep.COMPLETED;
      memeState.updatedAt = new Date();
      
      this.database.saveMeme(memeState);
      this.emitProgress(memeState, onProgress, 'Clean meme generated successfully!');

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
      
      this.emitProgress(memeState, onProgress, 'Generating clean, simple meme image...');

      const imageDescription = `A meme about: ${memeState.concept}`;
      
      const generationResult = await this.unifiedGenerator.execute({
        concept: memeState.concept,
        description: imageDescription
      });

      this.emitProgress(memeState, onProgress, 'Adding text overlay...');

      const { ImageCompositor } = await import('./imageCompositor.js');
      const compositor = new ImageCompositor();
      
      let finalImage = generationResult.memeImage;
      
      if (memeState.customText && memeState.customText.trim()) {
        const memeText = memeState.customText.trim();
        console.log(`📝 Adding meme text: "${memeText}"`);
        finalImage = await compositor.addTextToImage(generationResult.memeImage, memeText, 'auto');
      }

      const imagePath = await this.fileStorage.saveFinalMeme(finalImage);
      
      memeState.finalMeme = { 
        ...finalImage, 
        url: imagePath 
      };
      
      memeState.captions = generationResult.suggestedCaptions;
      memeState.status = MemeCreationStatus.COMPLETED;
      memeState.currentStep = MemeCreationStep.COMPLETED;
      memeState.updatedAt = new Date();
      
      this.database.saveMeme(memeState);
      this.emitProgress(memeState, onProgress, 'Clean meme generated successfully!');

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
      
      let finalImage = memeState.finalMeme;
      
      for (const textElement of texts) {
        finalImage = await compositor.addCustomTextToImage(finalImage, {
          text: textElement.content,
          position: { x: textElement.x, y: textElement.y },
          style: {
            fontSize: textElement.fontSize,
            color: textElement.color,
            fontWeight: textElement.fontWeight,
            fontFamily: 'Impact'
          }
        });
      }

      const imagePath = await this.fileStorage.saveFinalMeme(finalImage);
      
      memeState.finalMeme = {
        ...finalImage,
        url: imagePath
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