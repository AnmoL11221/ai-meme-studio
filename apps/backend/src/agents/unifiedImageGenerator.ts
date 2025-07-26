import { BaseAIAgent } from './base.js';
import { 
  AgentRole, 
  GeneratedImage
} from '@ai-meme-studio/shared-types';
import { OpenAIService } from '../services/openai.js';
import { StabilityAIService } from '../services/stability.js';

interface UnifiedImageInput {
  concept: string;
  description: string;
}

interface UnifiedImageOutput {
  memeImage: GeneratedImage;
  enhancedDescription: string;
  suggestedCaptions: string[];
}

export class UnifiedImageGenerator extends BaseAIAgent {
  private openaiService: OpenAIService;
  private stabilityService: StabilityAIService;

  constructor() {
    super('Unified Image Generator', AgentRole.SET_DESIGNER);
    this.openaiService = new OpenAIService();
    this.stabilityService = new StabilityAIService();
  }

  async execute(input: UnifiedImageInput): Promise<UnifiedImageOutput> {
    this.log(`Creating unified meme image for: "${input.description}"`);

    try {
      const optimizedPrompt = await this.createOptimizedPrompt(input.description, input.concept);
      
      this.log(`Optimized prompt: "${optimizedPrompt}"`);

      const memeImage = await this.stabilityService.generateMemeImage(optimizedPrompt);
      
      const suggestedCaptions = await this.generateSuggestedCaptions(input.concept, input.description);

      this.log('Unified meme image created successfully');

      return {
        memeImage,
        enhancedDescription: optimizedPrompt,
        suggestedCaptions
      };
    } catch (error) {
      this.logError(error as Error);
      throw error;
    }
  }

  private async createOptimizedPrompt(description: string, concept: string): Promise<string> {
    const prompt = `Create an optimized image generation prompt for a meme based on this description: "${description}" with concept: "${concept}".

    The prompt should:
    - Create a single, cohesive image perfect for meme text overlay
    - Be visually clear and uncluttered with good composition
    - Have strong contrast areas at top and bottom for text placement
    - Be immediately recognizable and relatable
    - Capture the essence of the meme concept
    - Use professional photography style with good lighting
    - Avoid text in the image (text will be added later)
    - Create a scene that tells a story or conveys emotion
    - Use vibrant colors and clear subjects
    - Ensure the image works well with white text overlay
    
    Return only the optimized prompt, no explanations.`;

    try {
      const response = await this.openaiService.generateText(prompt);
      return response || description;
    } catch (error) {
      this.log('Falling back to original description due to OpenAI error');
      return `${description}, clear background for text, high contrast, meme-style image, professional photography, good lighting`;
    }
  }

  private async generateSuggestedCaptions(concept: string, description: string): Promise<string[]> {
    const prompt = `Based on this meme concept: "${concept}" and image description: "${description}", generate 3 funny, witty caption suggestions that would work well with this image.

    Guidelines:
    - Keep captions short and punchy (under 50 characters each)
    - Make them relatable and shareable
    - Use current internet humor styles and meme language
    - Each caption should be different in tone (sarcastic, wholesome, absurd)
    - Focus on the core emotion or situation
    - Use simple, impactful language
    - Avoid complex sentences or explanations
    
    Return only the 3 captions, one per line, no numbering or formatting.`;

    try {
      const response = await this.openaiService.generateText(prompt);
      if (response) {
        return response.split('\n').filter(line => line.trim()).slice(0, 3);
      }
    } catch (error) {
      this.log('Failed to generate captions, using fallbacks');
    }

    return [
      "When you realize it's true",
      "This hit different",
      "Why is this so accurate?"
    ];
  }
} 