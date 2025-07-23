import { BaseAIAgent } from './base.js';
import { 
  AgentRole, 
  SetDesignerInput, 
  SetDesignerOutput 
} from '@ai-meme-studio/shared-types';
import { OpenAIService } from '../services/openai.js';
import { StabilityAIService } from '../services/stability.js';

export class SetDesignerAgent extends BaseAIAgent {
  private openaiService: OpenAIService;
  private stabilityService: StabilityAIService;

  constructor() {
    super('Set Designer', AgentRole.SET_DESIGNER);
    this.openaiService = new OpenAIService();
    this.stabilityService = new StabilityAIService();
  }

  async execute(input: SetDesignerInput): Promise<SetDesignerOutput> {
    this.log(`Creating background scene for concept: "${input.concept}"`);

    try {
      const enhancedPrompt = await this.openaiService.improveImagePrompt(
        input.concept, 
        'background'
      );

      this.log(`Enhanced prompt: "${enhancedPrompt}" (length: ${enhancedPrompt?.length || 0})`);

      // Validate prompt before sending to Stability AI
      if (!enhancedPrompt || enhancedPrompt.trim().length === 0) {
        throw new Error('Enhanced prompt is empty or undefined');
      }

      const backgroundImage = await this.stabilityService.generateBackground(enhancedPrompt.trim());

      const sceneDescription = await this.generateSceneDescription(input.concept, enhancedPrompt);

      this.log('Background scene created successfully');

      return {
        backgroundImage,
        sceneDescription
      };
    } catch (error) {
      this.logError(error as Error);
      throw error;
    }
  }

  private async generateSceneDescription(concept: string, prompt: string): Promise<string> {
    const systemPrompt = `You are describing a meme background scene. 
    Keep it concise (2-3 sentences) and focus on the mood and visual elements that will enhance the meme's comedic impact.`;

    const userPrompt = `Describe this meme background scene:
    Original concept: "${concept}"
    Generated scene: "${prompt}"`;

    return await this.openaiService.generateText(userPrompt, systemPrompt);
  }
} 