import axios from 'axios';
import { config } from '../config/index.js';

export interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class OpenAIService {
  private apiKey: string;
  private baseURL = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = config.OPENAI_API_KEY;
    if (!this.apiKey) {
      console.warn('⚠️  OpenAI API key not configured. Meme generation will use mock responses.');
    }
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    if (!this.apiKey) {
      console.log('🔄 Mock OpenAI response for:', prompt.substring(0, 50) + '...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockResponse = this.getMockResponse(prompt, systemPrompt);
      if (!mockResponse || mockResponse.trim().length === 0) {
        throw new Error('Mock response generated empty text');
      }
      return mockResponse;
    }

    try {
      const messages = [];
      
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      
      messages.push({ role: 'user', content: prompt });

      const response = await axios.post<OpenAIResponse>(
        `${this.baseURL}/chat/completions`,
        {
          model: 'gpt-4',
          messages,
          max_tokens: 500,
          temperature: 0.8,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const content = response.data.choices[0]?.message?.content || '';
      if (!content || content.trim().length === 0) {
        throw new Error('OpenAI returned empty response');
      }
      return content.trim();
    } catch (error: any) {
      console.error('OpenAI API error:', error.response?.data || error.message);
      throw new Error(`OpenAI generation failed: ${error.message}`);
    }
  }

  private getMockResponse(prompt: string, systemPrompt?: string): string {
    console.log('🎭 Mock response requested for prompt:', prompt.substring(0, 100));
    console.log('🎭 System prompt includes:', systemPrompt?.substring(0, 100));
    
    if (systemPrompt?.includes('meme writer') || prompt.includes('captions') || prompt.includes('meme')) {
      return 'When you need coffee but the machine is broken\nMe: *internal screaming*\nThis is fine... everything is fine';
    }
    if (systemPrompt?.includes('background') || prompt.includes('background') || prompt.includes('scene')) {
      return 'A cozy coffee shop with warm lighting, wooden tables, and a chalkboard menu. Steam rises from coffee cups while people work on laptops. The atmosphere is busy but comfortable, with exposed brick walls and hanging plants.';
    }
    if (systemPrompt?.includes('character') || prompt.includes('character') || prompt.includes('person')) {
      return 'A person in casual clothes sitting at a table, looking slightly overwhelmed but determined. They have a laptop open and multiple coffee cups around them, with a expression that says "I can do this" mixed with "I need more caffeine".';
    }
    
    // Fallback based on prompt content
    if (prompt.toLowerCase().includes('background') || prompt.toLowerCase().includes('scene')) {
      return 'A warm, inviting indoor scene with soft lighting and comfortable furniture. The setting has a cozy atmosphere with natural elements and modern touches.';
    }
    if (prompt.toLowerCase().includes('character') || prompt.toLowerCase().includes('person')) {
      return 'A friendly character with an expressive face, wearing casual comfortable clothing. They have a warm, approachable appearance that fits well with the scene.';
    }
    
    return 'A detailed, high-quality scene with good lighting and composition. The image should be visually appealing and well-crafted.';
  }

  async generateCaptions(concept: string, imageDescription: string): Promise<string[]> {
    const systemPrompt = `You are a professional meme writer. Create funny, clever captions for memes. 
    Return exactly 3 different caption options, each on a new line. 
    Keep captions short (under 50 characters each) and appropriate for general audiences.
    Make them witty, relatable, and perfect for the described image.`;

    const prompt = `Original concept: "${concept}"
    Image description: "${imageDescription}"
    
    Create 3 hilarious captions for this meme:`;

    const response = await this.generateText(prompt, systemPrompt);
    return response.split('\n').filter(line => line.trim()).slice(0, 3);
  }

  async improveImagePrompt(userConcept: string, role: 'background' | 'character'): Promise<string> {
    const systemPrompt = role === 'background' 
      ? `You are an expert at creating detailed prompts for AI image generation. 
         Transform user concepts into detailed background scene descriptions.
         Focus on environment, setting, mood, lighting, and artistic style.
         Make prompts specific and visually rich.`
      : `You are an expert at creating detailed prompts for AI image generation.
         Transform user concepts into detailed character descriptions.
         Focus on appearance, pose, expression, clothing, and how they fit the scene.
         Make prompts specific and visually compelling.`;

    const prompt = role === 'background'
      ? `Create a detailed background scene prompt for: "${userConcept}"`
      : `Create a detailed character description prompt for: "${userConcept}"`;

    return await this.generateText(prompt, systemPrompt);
  }
} 