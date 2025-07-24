import axios from 'axios';
import { config } from '../config/index.js';
import { GeneratedImage } from '@ai-meme-studio/shared-types';
import { v4 as uuidv4 } from 'uuid';

export interface StabilityResponse {
  artifacts: Array<{
    base64: string;
    seed: number;
    finishReason: string;
  }>;
}

export class StabilityAIService {
  private apiKey: string;
  private baseURL = 'https://api.stability.ai/v1';

  constructor() {
    this.apiKey = config.STABILITY_AI_API_KEY;
    if (!this.apiKey) {
      console.warn('⚠️  Stability AI API key not configured. Image generation will use mock placeholder images.');
    }
  }

  async generateImage(
    prompt: string,
    options: {
      width?: number;
      height?: number;
      steps?: number;
      cfg_scale?: number;
    } = {}
  ): Promise<GeneratedImage> {
    const {
      width = 512,
      height = 512,
      steps = 30,
      cfg_scale = 7
    } = options;

    if (!this.apiKey) {
      console.log('🖼️  Mock image generation for:', prompt.substring(0, 50) + '...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockImageUrl = `https://picsum.photos/${width}/${height}?random=${Date.now()}`;
      
      return {
        id: uuidv4(),
        url: mockImageUrl,
        prompt,
        model: 'mock-generator',
        width,
        height,
        generatedAt: new Date()
      };
    }

    try {
      const response = await axios.post<StabilityResponse>(
        `${this.baseURL}/generation/stable-diffusion-xl-1024-v1-0/text-to-image`,
        {
          text_prompts: [
            {
              text: prompt,
              weight: 1
            }
          ],
          cfg_scale,
          height,
          width,
          steps,
          samples: 1,
        },
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      const artifact = response.data.artifacts[0];
      if (!artifact) {
        throw new Error('No image generated');
      }

      const imageUrl = `data:image/png;base64,${artifact.base64}`;

      return {
        id: uuidv4(),
        url: imageUrl,
        prompt,
        model: 'stable-diffusion-xl-1024-v1-0',
        width,
        height,
        generatedAt: new Date()
      };
    } catch (error: any) {
      console.error('Stability AI error:', error.response?.data || error.message);
      throw new Error(`Image generation failed: ${error.message}`);
    }
  }

  async generateBackground(prompt: string): Promise<GeneratedImage> {
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Background prompt cannot be empty');
    }
    
    const enhancedPrompt = `${prompt.trim()}, detailed background scene, high quality, professional lighting, cinematic composition`;
    console.log(`🎨 Generating background with prompt: "${enhancedPrompt}" (${enhancedPrompt.length} chars)`);
    
    return this.generateImage(enhancedPrompt, {
      width: 1344,
      height: 768,
      cfg_scale: 8
    });
  }

  async generateCharacter(prompt: string): Promise<GeneratedImage> {
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Character prompt cannot be empty');
    }
    
    const enhancedPrompt = `${prompt.trim()}, character focus, clear details, expressive, high quality, transparent background preferred`;
    console.log(`👤 Generating character with prompt: "${enhancedPrompt}" (${enhancedPrompt.length} chars)`);
    
    return this.generateImage(enhancedPrompt, {
      width: 768,
      height: 1344,
      cfg_scale: 9
    });
  }

  async generateMemeImage(prompt: string): Promise<GeneratedImage> {
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Meme image prompt cannot be empty');
    }
    
    const optimizedPrompt = `${prompt.trim()}, high quality, clear composition, good contrast for text overlay, professional photography, detailed, sharp focus, meme-style image, no text in image, clean background`;
    console.log(`🎭 Generating unified meme image with prompt: "${optimizedPrompt}" (${optimizedPrompt.length} chars)`);
    
    return this.generateImage(optimizedPrompt, {
      width: 1024,
      height: 1024,
      steps: 50,
      cfg_scale: 8.0
    });
  }
} 