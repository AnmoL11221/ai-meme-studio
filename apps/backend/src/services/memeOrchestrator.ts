import { 
  MemeCreationState, 
  MemeCreationStatus, 
  MemeCreationStep,
  WebSocketEvent
} from '@ai-meme-studio/shared-types';
import { SetDesignerAgent } from '../agents/setDesigner.js';
import { CastingDirectorAgent } from '../agents/castingDirector.js';
import { GagWriterAgent } from '../agents/gagWriter.js';
import { ImageCompositor } from './imageCompositor.js';
import { DatabaseService } from './database.js';
import { FileStorageService } from './fileStorage.js';

export class MemeOrchestrator {
  private setDesigner: SetDesignerAgent;
  private castingDirector: CastingDirectorAgent;
  private gagWriter: GagWriterAgent;
  private compositor: ImageCompositor;
  private database: DatabaseService;
  private fileStorage: FileStorageService;

  constructor() {
    this.setDesigner = new SetDesignerAgent();
    this.castingDirector = new CastingDirectorAgent();
    this.gagWriter = new GagWriterAgent();
    this.compositor = new ImageCompositor();
    this.database = new DatabaseService();
    this.fileStorage = new FileStorageService();
  }

  async createMeme(
    memeState: MemeCreationState,
    onProgress?: (event: WebSocketEvent) => void
  ): Promise<MemeCreationState> {
    try {
      // Validate that concept exists for AI generation
      if (!memeState.concept) {
        throw new Error('Concept is required for AI-generated memes');
      }

      memeState.status = MemeCreationStatus.GENERATING_BACKGROUND;
      memeState.currentStep = MemeCreationStep.SET_DESIGN;
      memeState.updatedAt = new Date();
      
      this.emitProgress(memeState, onProgress);

      const setDesignerResult = await this.setDesigner.execute({
        concept: memeState.concept
      });

      const backgroundPath = await this.fileStorage.saveBackground(setDesignerResult.backgroundImage);
      // Store background in character field for compatibility
      memeState.character = { 
        ...setDesignerResult.backgroundImage, 
        url: backgroundPath 
      };
      memeState.updatedAt = new Date();
      this.database.saveMeme(memeState);
      this.emitProgress(memeState, onProgress);

      memeState.status = MemeCreationStatus.GENERATING_CHARACTER;
      memeState.currentStep = MemeCreationStep.CASTING;
      memeState.updatedAt = new Date();
      
      this.emitProgress(memeState, onProgress);

      const castingResult = await this.castingDirector.execute({
        concept: memeState.concept,
        background: setDesignerResult.backgroundImage
      });

      const characterPath = await this.fileStorage.saveCharacter(castingResult.characterImage);
      memeState.character = { 
        ...castingResult.characterImage, 
        url: characterPath 
      };
      memeState.updatedAt = new Date();
      this.database.saveMeme(memeState);

      memeState.status = MemeCreationStatus.COMPOSITING;
      memeState.currentStep = MemeCreationStep.FINAL_COMPOSITION;
      memeState.updatedAt = new Date();
      
      this.emitProgress(memeState, onProgress);

      const baseComposite = castingResult.compositedImage;

      memeState.status = MemeCreationStatus.GENERATING_CAPTIONS;
      memeState.currentStep = MemeCreationStep.GAG_WRITING;
      memeState.updatedAt = new Date();
      
      this.emitProgress(memeState, onProgress);

      const gagResult = await this.gagWriter.execute({
        concept: memeState.concept,
        finalImage: baseComposite
      });

      memeState.captions = gagResult.captions;

      if (gagResult.captions.length > 0) {
        const finalMemeWithText = await this.compositor.addTextToImage(
          baseComposite,
          gagResult.captions[0]
        );
        const finalMemePath = await this.fileStorage.saveFinalMeme(finalMemeWithText);
        memeState.finalMeme = { 
          ...finalMemeWithText, 
          url: finalMemePath 
        };
      } else {
        const finalMemePath = await this.fileStorage.saveFinalMeme(baseComposite);
        memeState.finalMeme = { 
          ...baseComposite, 
          url: finalMemePath 
        };
      }

      memeState.status = MemeCreationStatus.COMPLETED;
      memeState.updatedAt = new Date();
      this.database.saveMeme(memeState);
      
      this.emitProgress(memeState, onProgress);

      return memeState;
    } catch (error) {
      console.error('Meme creation failed:', error);
      
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

  private emitProgress(
    memeState: MemeCreationState, 
    onProgress?: (event: WebSocketEvent) => void
  ): void {
    if (onProgress) {
      onProgress({
        type: 'progress',
        memeId: memeState.id,
        status: memeState.status,
        step: memeState.currentStep,
        data: {
          character: memeState.character,
          captions: memeState.captions,
          finalMeme: memeState.finalMeme
        }
      });
    }
  }
} 