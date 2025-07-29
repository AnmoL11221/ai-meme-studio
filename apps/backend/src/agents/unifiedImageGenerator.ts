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
    const prompt = `Create a simple, clean image generation prompt for a meme based on this description: "${description}" with concept: "${concept}".

    The prompt must create:
    - Simple, clean composition with minimal background
    - Clear, focused subject in the center
    - Plain, solid background (white, light gray, or simple color)
    - High quality, sharp focus on the main subject
    - No complex backgrounds, scenes, or environments
    - No text, words, or letters anywhere in the image
    - Perfect for text overlay with clear space at top and bottom
    - Professional photography quality
    - Clean, uncluttered design
    
    Style requirements:
    - Minimalist approach
    - Simple, clean aesthetic
    - Focus on the main subject only
    - Plain background that doesn't distract
    - High contrast for text readability
    
    Return only the optimized prompt, no explanations or formatting.`;

    try {
      const response = await this.openaiService.generateText(prompt);
      return response || `${description}, simple clean composition, plain background, focused subject, high quality, no text, perfect for meme overlay`;
    } catch (error) {
      this.log('Falling back to simplified description due to OpenAI error');
      return `${description}, simple clean composition, plain background, focused subject, high quality, no text, perfect for meme overlay`;
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