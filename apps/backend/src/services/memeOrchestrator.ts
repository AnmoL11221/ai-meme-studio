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
      if (!memeState.concept) {
        throw new Error('Concept is required for AI-generated memes');
      }

      console.log(`🎭 Legacy AI: Creating meme for concept "${memeState.concept}"`);

      memeState.status = MemeCreationStatus.GENERATING_BACKGROUND;
      memeState.currentStep = MemeCreationStep.SET_DESIGN;
      memeState.updatedAt = new Date();
      
      this.emitProgress(memeState, onProgress, '🎨 Designing the perfect scene...');

      const enhancedConcept = this.enhanceConceptForLegacyAI(memeState.concept);
      console.log(`📈 Enhanced concept: "${enhancedConcept}"`);

      const setDesignerResult = await this.setDesigner.execute({
        concept: enhancedConcept
      });

      const backgroundPath = await this.fileStorage.saveBackground(setDesignerResult.backgroundImage);
      memeState.character = { 
        ...setDesignerResult.backgroundImage, 
        url: backgroundPath 
      };
      memeState.updatedAt = new Date();
      this.database.saveMeme(memeState);
      this.emitProgress(memeState, onProgress, '✅ Scene created! Now casting the perfect character...');

      memeState.status = MemeCreationStatus.GENERATING_CHARACTER;
      memeState.currentStep = MemeCreationStep.CASTING;
      memeState.updatedAt = new Date();
      
      this.emitProgress(memeState, onProgress, '🎬 Casting the ideal character for your meme...');

      const optimizedCastingPrompt = this.createOptimizedCastingPrompt(enhancedConcept, setDesignerResult.sceneDescription);
      
      const castingResult = await this.castingDirector.execute({
        concept: enhancedConcept,
        background: setDesignerResult.backgroundImage,
        sceneDescription: setDesignerResult.sceneDescription,
        optimizedPrompt: optimizedCastingPrompt
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
      
      this.emitProgress(memeState, onProgress, '🎨 Blending elements with enhanced composition...');

      const enhancedComposite = await this.createEnhancedComposite(
        setDesignerResult.backgroundImage,
        castingResult.characterImage,
        enhancedConcept
      );

      memeState.status = MemeCreationStatus.GENERATING_CAPTIONS;
      memeState.currentStep = MemeCreationStep.GAG_WRITING;
      memeState.updatedAt = new Date();
      
      this.emitProgress(memeState, onProgress, '✍️ Writing the perfect punchline...');

      const gagResult = await this.gagWriter.execute({
        concept: enhancedConcept,
        finalImage: enhancedComposite,
        sceneDescription: setDesignerResult.sceneDescription,
        characterDescription: castingResult.characterDescription
      });

      memeState.captions = gagResult.captions;

      if (gagResult.captions.length > 0) {
        const finalMemeWithText = await this.compositor.addTextToImage(
          enhancedComposite,
          gagResult.captions[0]
        );
        const finalMemePath = await this.fileStorage.saveFinalMeme(finalMemeWithText);
        memeState.finalMeme = { 
          ...finalMemeWithText, 
          url: finalMemePath 
        };
      } else {
        const finalMemePath = await this.fileStorage.saveFinalMeme(enhancedComposite);
        memeState.finalMeme = { 
          ...enhancedComposite, 
          url: finalMemePath 
        };
      }

      memeState.status = MemeCreationStatus.COMPLETED;
      memeState.currentStep = MemeCreationStep.COMPLETED;
      memeState.updatedAt = new Date();
      this.database.saveMeme(memeState);
      
      this.emitProgress(memeState, onProgress, '🎉 Your legacy AI meme is ready!');

      console.log(`✅ Legacy AI meme creation completed for concept: "${memeState.concept}"`);
      return memeState;
    } catch (error) {
      console.error('Legacy AI meme creation failed:', error);
      
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

  private enhanceConceptForLegacyAI(concept: string): string {
    const enhancements = [
      'Create a meme-worthy scene about',
      'Design a humorous situation involving',
      'Generate a comedic scenario featuring',
      'Craft a relatable moment about'
    ];
    
    const randomEnhancement = enhancements[Math.floor(Math.random() * enhancements.length)];
    return `${randomEnhancement} ${concept}. The scene should be perfect for meme text overlay with clear visual hierarchy and good contrast.`;
  }

  private createOptimizedCastingPrompt(concept: string, sceneDescription: string): string {
    return `Based on the concept "${concept}" and scene "${sceneDescription}", create a character that:
    - Fits naturally into the scene with appropriate lighting and perspective
    - Has clear facial expressions that match the meme concept
    - Is positioned to complement the background, not compete with it
    - Has realistic proportions and shadows that match the scene lighting
    - Conveys the emotion or situation relevant to the concept
    - Leaves clear space for text overlay (top and bottom areas)`;
  }

  private async createEnhancedComposite(
    backgroundImage: any,
    characterImage: any,
    concept: string
  ): Promise<any> {
    try {
      console.log('🎨 Creating enhanced composite with improved blending...');
      
      const enhancedCharacter = await this.enhanceCharacterForBlending(characterImage);
      
      const result = await this.compositor.createOptimizedComposite(
        backgroundImage,
        enhancedCharacter,
        {
          blendMode: 'natural',
          matchLighting: true,
          adjustPerspective: true,
          enhanceEdges: true,
          concept: concept
        }
      );

      console.log('✅ Enhanced composite created successfully');
      return result;
    } catch (error) {
      console.error('Enhanced composite failed, using basic composition:', error);
      return this.compositor.createBasicComposite(backgroundImage, characterImage);
    }
  }

  private async enhanceCharacterForBlending(characterImage: any): Promise<any> {
    console.log('🔧 Enhancing character for better blending...');
    return {
      ...characterImage,
      prompt: characterImage.prompt + ', natural lighting, realistic shadows, seamless integration, professional quality'
    };
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