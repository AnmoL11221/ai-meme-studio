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
      console.warn('⚠️  Stability AI API key not configured. Image generation will fail without a valid API key.');
    }
  }

  async generateImage(
    prompt: string,
    options: {
      width?: number;
      height?: number;
      steps?: number;
      cfg_scale?: number;
      negativePrompt?: string;
    } = {}
  ): Promise<GeneratedImage> {
    const {
      width = 512,
      height = 512,
      steps = 30,
      cfg_scale = 7,
      negativePrompt = ''
    } = options;

    if (!this.apiKey) {
      throw new Error('Stability AI API key not configured. Please set STABILITY_AI_API_KEY environment variable.');
    }

    try {
      const textPrompts = [
        {
          text: prompt,
          weight: 1
        }
      ];

      if (negativePrompt) {
        textPrompts.push({
          text: negativePrompt,
          weight: -1
        });
      }

      const response = await axios.post<StabilityResponse>(
        `${this.baseURL}/generation/stable-diffusion-xl-1024-v1-0/text-to-image`,
        {
          text_prompts: textPrompts,
          cfg_scale,
          height,
          width,
          steps,
          samples: 1,
          style_preset: "photographic",
          seed: Math.floor(Math.random() * 1000000),
          sampler: "K_DPMPP_2M"
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

      const imageBuffer = Buffer.from(artifact.base64, 'base64');
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
      
      if (error.response?.status === 429 || error.response?.data?.name === 'insufficient_balance') {
        const balanceError = error.response?.data?.message || 'Insufficient API balance';
        throw new Error(`Stability AI API Error: ${balanceError}. Please add credits to your Stability AI account to continue generating images.`);
      }
      
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
    
    const enhancedPrompt = `${prompt.trim()}, simple clean composition, plain background, focused subject, high quality, professional photography, sharp focus, no text, perfect for meme overlay, minimalist design`;
    
    const negativePrompt = `blurry, low quality, pixelated, text, words, letters, watermarks, signatures, complex background, busy scene, cluttered, multiple subjects, landscape, environment, scene, setting, background details, objects, furniture, buildings, nature, trees, sky, clouds, detailed background, busy composition, multiple elements, complex scene`;
    
    console.log(`🎭 Generating simple meme image with prompt: "${enhancedPrompt}" (${enhancedPrompt.length} chars)`);
    
    return this.generateImage(enhancedPrompt, {
      width: 1024,
      height: 1024,
      steps: 40,
      cfg_scale: 8.0,
      negativePrompt
    });
  }
} 