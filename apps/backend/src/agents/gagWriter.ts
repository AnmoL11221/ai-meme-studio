import { BaseAIAgent } from './base.js';
import { 
  AgentRole, 
  GagWriterInput, 
  GagWriterOutput 
} from '@ai-meme-studio/shared-types';
import { OpenAIService } from '../services/openai.js';

export class GagWriterAgent extends BaseAIAgent {
  private openaiService: OpenAIService;

  constructor() {
    super('Gag Writer', AgentRole.GAG_WRITER);
    this.openaiService = new OpenAIService();
  }

  async execute(input: GagWriterInput): Promise<GagWriterOutput> {
    this.log(`Writing captions for concept: "${input.concept}"`);

    try {
      const imageDescription = await this.analyzeImage(input.finalImage);
      
      this.log(`Image analysis: ${imageDescription}`);

      const captions = await this.openaiService.generateCaptions(
        input.concept,
        imageDescription
      );

      const explanation = await this.generateExplanation(input.concept, captions);

      this.log(`Generated ${captions.length} caption options`);

      return {
        captions,
        explanation
      };
    } catch (error) {
      this.logError(error as Error);
      throw error;
    }
  }

  private async analyzeImage(image: any): Promise<string> {
    const systemPrompt = `You are an expert at analyzing images for meme creation. 
    Describe what you see in a way that helps create funny captions. 
    Focus on visual elements, mood, composition, and comedic potential.
    Keep your description concise but detailed enough for caption writing.`;

    const prompt = `Analyze this meme image for caption writing:
    Image prompt used: "${image.prompt}"
    
    Describe the key visual elements that would be important for writing a funny caption:`;

    return await this.openaiService.generateText(prompt, systemPrompt);
  }

  private async generateExplanation(concept: string, captions: string[]): Promise<string> {
    const systemPrompt = `You are explaining the humor behind meme captions. 
    Keep it brief and insightful, explaining why these captions work for this concept.`;

    const prompt = `Explain why these captions work for the meme concept:
    Concept: "${concept}"
    Captions: ${captions.join(', ')}`;

    return await this.openaiService.generateText(prompt, systemPrompt);
  }
} 