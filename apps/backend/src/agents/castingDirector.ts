import { BaseAIAgent } from './base.js';
import { 
  AgentRole, 
  CastingDirectorInput, 
  CastingDirectorOutput,
  GeneratedImage
} from '@ai-meme-studio/shared-types';
import { OpenAIService } from '../services/openai.js';
import { StabilityAIService } from '../services/stability.js';
import { ImageCompositor } from '../services/imageCompositor.js';

export class CastingDirectorAgent extends BaseAIAgent {
  private openaiService: OpenAIService;
  private stabilityService: StabilityAIService;
  private compositor: ImageCompositor;

  constructor() {
    super('Casting Director', AgentRole.CASTING_DIRECTOR);
    this.openaiService = new OpenAIService();
    this.stabilityService = new StabilityAIService();
    this.compositor = new ImageCompositor();
  }

  async execute(input: CastingDirectorInput): Promise<CastingDirectorOutput> {
    this.log(`Creating character for concept: "${input.concept}"`);

    try {
      const characterPrompt = await this.openaiService.improveImagePrompt(
        input.concept, 
        'character'
      );

      this.log(`Character prompt: ${characterPrompt}`);

      const characterImage = await this.stabilityService.generateCharacter(characterPrompt);

      this.log('Compositing character onto background...');
      
      const compositedImage = await this.compositor.compositeImages(
        input.background,
        characterImage
      );

      const characterDescription = await this.generateCharacterDescription(
        input.concept, 
        characterPrompt
      );

      this.log('Character casting completed successfully');

      return {
        characterImage,
        compositedImage,
        characterDescription
      };
    } catch (error) {
      this.logError(error as Error);
      throw error;
    }
  }

  private async generateCharacterDescription(concept: string, prompt: string): Promise<string> {
    const systemPrompt = `You are describing a meme character. 
    Keep it concise (2-3 sentences) and focus on how the character fits the meme concept and their comedic potential.`;

    const userPrompt = `Describe this meme character:
    Original concept: "${concept}"
    Character details: "${prompt}"`;

    return await this.openaiService.generateText(userPrompt, systemPrompt);
  }
} 