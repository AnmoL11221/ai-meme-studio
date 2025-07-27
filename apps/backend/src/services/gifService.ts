import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export interface GifTemplate {
  id: string;
  title: string;
  gifUrl: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  duration?: number;
  size?: number;
  tags: string[];
  category: string;
  source: string;
  popularity: number;
  trending?: boolean;
  isAnimated: boolean;
}

interface TenorGif {
  id: string;
  title: string;
  media_formats: {
    gif?: {
      url: string;
      duration: number;
      dims: [number, number];
      size: number;
    };
    mediumgif?: {
      url: string;
      duration: number;
      dims: [number, number];
      size: number;
    };
    tinygif?: {
      url: string;
      duration: number;
      dims: [number, number];
      size: number;
    };
  };
  tags: string[];
  created: number;
  content_description: string;
  itemurl: string;
  url: string;
  hasaudio: boolean;
  flags: string[];
  bg_color: string;
  composite: any;
  hascaption: boolean;
}

interface TenorResponse {
  results: TenorGif[];
  next: string;
}

interface ImgflipTemplate {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  box_count: number;
}

interface ImgflipResponse {
  success: boolean;
  data: {
    memes: ImgflipTemplate[];
  };
}

export class GifService {
  private gifs: GifTemplate[] = [];
  private lastFetch: Date | null = null;
  private readonly CACHE_DURATION = 1000 * 60 * 30; // 30 minutes
  
  private readonly GIPHY_API_KEY = process.env.GIPHY_API_KEY || 'demo_api_key';
  private readonly TENOR_API_KEY = process.env.TENOR_API_KEY || 'AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz';

  private enhancedFallbackGifs: GifTemplate[] = [
    // Popular Reaction GIFs
    {
      id: 'thumbs-up',
      title: 'Thumbs Up',
      gifUrl: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif',
      previewUrl: 'https://media.giphy.com/media/111ebonMs90YLu/200w.gif',
      thumbnailUrl: 'https://media.giphy.com/media/111ebonMs90YLu/100w.gif',
      width: 480,
      height: 270,
      duration: 2000,
      tags: ['thumbs', 'up', 'approval', 'good', 'yes'],
      category: 'reaction',
      source: 'curated',
      popularity: 95,
      trending: true,
      isAnimated: true
    },
    {
      id: 'clapping',
      title: 'Clapping',
      gifUrl: 'https://media.giphy.com/media/7rj2ZgttvgomY/giphy.gif',
      previewUrl: 'https://media.giphy.com/media/7rj2ZgttvgomY/200w.gif',
      thumbnailUrl: 'https://media.giphy.com/media/7rj2ZgttvgomY/100w.gif',
      width: 500,
      height: 375,
      duration: 1500,
      tags: ['clapping', 'applause', 'congratulations', 'bravo'],
      category: 'celebration',
      source: 'curated',
      popularity: 90,
      trending: true,
      isAnimated: true
    },
    {
      id: 'dancing',
      title: 'Dancing',
      gifUrl: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
      previewUrl: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/200w.gif',
      thumbnailUrl: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/100w.gif',
      width: 480,
      height: 270,
      duration: 3000,
      tags: ['dancing', 'happy', 'celebration', 'party', 'fun'],
      category: 'celebration',
      source: 'curated',
      popularity: 88,
      isAnimated: true
    },
    {
      id: 'excited',
      title: 'Excited Reaction',
      gifUrl: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
      previewUrl: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/200w.gif',
      thumbnailUrl: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/100w.gif',
      width: 480,
      height: 360,
      tags: ['excited', 'reaction', 'happy', 'enthusiasm'],
      category: 'reaction',
      source: 'curated',
      popularity: 87,
      isAnimated: true
    },
    {
      id: 'facepalm',
      title: 'Facepalm',
      gifUrl: 'https://media.giphy.com/media/XeLcgh8gT8o0F5SQ8i/giphy.gif',
      previewUrl: 'https://media.giphy.com/media/XeLcgh8gT8o0F5SQ8i/200w.gif',
      thumbnailUrl: 'https://media.giphy.com/media/XeLcgh8gT8o0F5SQ8i/100w.gif',
      width: 480,
      height: 360,
      tags: ['facepalm', 'frustrated', 'annoyed', 'disappointed'],
      category: 'reaction',
      source: 'curated',
      popularity: 85,
      isAnimated: true
    },
    {
      id: 'confused',
      title: 'Confused',
      gifUrl: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif',
      previewUrl: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/200w.gif',
      thumbnailUrl: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/100w.gif',
      width: 480,
      height: 270,
      tags: ['confused', 'puzzled', 'what', 'question'],
      category: 'reaction',
      source: 'curated',
      popularity: 83,
      isAnimated: true
    },
    {
      id: 'laughing',
      title: 'Laughing',
      gifUrl: 'https://media.giphy.com/media/T3Vx6sVAXzuG4/giphy.gif',
      previewUrl: 'https://media.giphy.com/media/T3Vx6sVAXzuG4/200w.gif',
      thumbnailUrl: 'https://media.giphy.com/media/T3Vx6sVAXzuG4/100w.gif',
      width: 500,
      height: 375,
      tags: ['laughing', 'funny', 'hilarious', 'lol'],
      category: 'reaction',
      source: 'curated',
      popularity: 92,
      isAnimated: true
    },
    {
      id: 'crying',
      title: 'Crying',
      gifUrl: 'https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif',
      previewUrl: 'https://media.giphy.com/media/d2lcHJTG5Tscg/200w.gif',
      thumbnailUrl: 'https://media.giphy.com/media/d2lcHJTG5Tscg/100w.gif',
      width: 500,
      height: 375,
      tags: ['crying', 'sad', 'tears', 'emotional'],
      category: 'reaction',
      source: 'curated',
      popularity: 80,
      isAnimated: true
    },
    
    // Animals
    {
      id: 'cute-cat',
      title: 'Cute Cat',
      gifUrl: 'https://media.giphy.com/media/VbnUQpnihPSIgIXuZv/giphy.gif',
      previewUrl: 'https://media.giphy.com/media/VbnUQpnihPSIgIXuZv/200w.gif',
      thumbnailUrl: 'https://media.giphy.com/media/VbnUQpnihPSIgIXuZv/100w.gif',
      width: 480,
      height: 270,
      tags: ['cat', 'cute', 'adorable', 'kitten', 'pet'],
      category: 'animals',
      source: 'curated',
      popularity: 94,
      trending: true,
      isAnimated: true
    },
    {
      id: 'dog-excited',
      title: 'Excited Dog',
      gifUrl: 'https://media.giphy.com/media/4T7e4DmcrP9du/giphy.gif',
      previewUrl: 'https://media.giphy.com/media/4T7e4DmcrP9du/200w.gif',
      thumbnailUrl: 'https://media.giphy.com/media/4T7e4DmcrP9du/100w.gif',
      width: 500,
      height: 281,
      tags: ['dog', 'excited', 'happy', 'puppy', 'pet'],
      category: 'animals',
      source: 'curated',
      popularity: 91,
      isAnimated: true
    },

    // Work/Office
    {
      id: 'typing',
      title: 'Typing Frantically',
      gifUrl: 'https://media.giphy.com/media/13GIgrGdslD9oQ/giphy.gif',
      previewUrl: 'https://media.giphy.com/media/13GIgrGdslD9oQ/200w.gif',
      thumbnailUrl: 'https://media.giphy.com/media/13GIgrGdslD9oQ/100w.gif',
      width: 500,
      height: 375,
      tags: ['typing', 'work', 'busy', 'computer', 'coding'],
      category: 'work',
      source: 'curated',
      popularity: 86,
      isAnimated: true
    },
    {
      id: 'coffee',
      title: 'Need Coffee',
      gifUrl: 'https://media.giphy.com/media/dzaUX7CAG0Ihi/giphy.gif',
      previewUrl: 'https://media.giphy.com/media/dzaUX7CAG0Ihi/200w.gif',
      thumbnailUrl: 'https://media.giphy.com/media/dzaUX7CAG0Ihi/100w.gif',
      width: 500,
      height: 281,
      tags: ['coffee', 'tired', 'morning', 'caffeine', 'work'],
      category: 'work',
      source: 'curated',
      popularity: 84,
      isAnimated: true
    },

    // Sports
    {
      id: 'goal-celebration',
      title: 'Goal Celebration',
      gifUrl: 'https://media.giphy.com/media/26BROccNKgRs5K89i/giphy.gif',
      previewUrl: 'https://media.giphy.com/media/26BROccNKgRs5K89i/200w.gif',
      thumbnailUrl: 'https://media.giphy.com/media/26BROccNKgRs5K89i/100w.gif',
      width: 480,
      height: 270,
      tags: ['goal', 'celebration', 'soccer', 'football', 'victory'],
      category: 'sports',
      source: 'curated',
      popularity: 82,
      isAnimated: true
    },

    // Love
    {
      id: 'heart-eyes',
      title: 'Heart Eyes',
      gifUrl: 'https://media.giphy.com/media/l0MYEqEzwMWFCg8rm/giphy.gif',
      previewUrl: 'https://media.giphy.com/media/l0MYEqEzwMWFCg8rm/200w.gif',
      thumbnailUrl: 'https://media.giphy.com/media/l0MYEqEzwMWFCg8rm/100w.gif',
      width: 480,
      height: 270,
      tags: ['love', 'heart', 'eyes', 'adoration', 'romantic'],
      category: 'love',
      source: 'curated',
      popularity: 89,
      isAnimated: true
    },

    // Food
    {
      id: 'eating',
      title: 'Delicious Food',
      gifUrl: 'https://media.giphy.com/media/Zk9mW5OmXTz9e/giphy.gif',
      previewUrl: 'https://media.giphy.com/media/Zk9mW5OmXTz9e/200w.gif',
      thumbnailUrl: 'https://media.giphy.com/media/Zk9mW5OmXTz9e/100w.gif',
      width: 500,
      height: 375,
      tags: ['eating', 'food', 'delicious', 'hungry', 'yummy'],
      category: 'food',
      source: 'curated',
      popularity: 85,
      isAnimated: true
    },

    // Entertainment
    {
      id: 'mind-blown',
      title: 'Mind Blown',
      gifUrl: 'https://media.giphy.com/media/26ufoFIY3QcTiC8.gif',
      previewUrl: 'https://media.giphy.com/media/26ufoFIY3QcTiC8/200w.gif',
      thumbnailUrl: 'https://media.giphy.com/media/26ufoFIY3QcTiC8/100w.gif',
      width: 480,
      height: 366,
      tags: ['mind', 'blown', 'amazed', 'shocked', 'wow'],
      category: 'entertainment',
      source: 'curated',
      popularity: 88,
      isAnimated: true
    }
  ];

  async fetchAllGifs(): Promise<void> {
    try {
      console.log('🎬 Loading GIF collection with Tenor API integration...');
      
      // Start with enhanced fallback collection
      let allGifs: GifTemplate[] = [...this.enhancedFallbackGifs];
      
      // Try to fetch from Tenor API first (primary source)
      try {
        const tenorResults = await Promise.all([
          this.fetchFromTenor('trending', 50),
          this.fetchFromTenor('reactions', 30),
          this.fetchFromTenor('animals', 20),
          this.fetchFromTenor('celebration', 20),
          this.fetchFromTenor('sports', 15),
          this.fetchFromTenor('work', 15)
        ]);
        
        const tenorGifs = tenorResults.flat();
        if (tenorGifs.length > 0) {
          allGifs = [...allGifs, ...tenorGifs];
          console.log(`✅ Tenor API: ${tenorGifs.length} high-quality GIFs loaded`);
        }
      } catch (error) {
        console.log('⚠️ Tenor API unavailable, trying fallback sources');
      }
      
      // Try to fetch from Imgflip as backup
      try {
        const imgflipResult = await this.fetchFromImgflip();
        if (imgflipResult.length > 0) {
          allGifs = [...allGifs, ...imgflipResult];
          console.log(`✅ Imgflip: ${imgflipResult.length} additional GIFs`);
        }
      } catch (error) {
        console.log('⚠️ Imgflip unavailable, using curated collection');
      }

      // Remove duplicates and sort
      const uniqueGifs = this.removeDuplicateGifs(allGifs);
      this.gifs = uniqueGifs.sort((a, b) => b.popularity - a.popularity);
      this.lastFetch = new Date();
      
      console.log(`🎯 SUCCESS: ${this.gifs.length} HIGH-QUALITY GIFs READY!`);
      console.log(`📊 Categories: ${this.getValidCategories().length} available`);
      console.log(`🔥 Trending: ${this.gifs.filter(g => g.trending).length} trending GIFs`);
      console.log(`🌐 Sources: ${[...new Set(this.gifs.map(g => g.source))].join(', ')}`);
      
    } catch (error) {
      console.error('❌ Failed to load GIFs:', error);
      this.gifs = [...this.enhancedFallbackGifs];
      this.lastFetch = new Date();
      console.log(`📦 Using ${this.gifs.length} curated GIFs`);
    }
  }

  private async fetchFromTenor(query: string, limit: number = 20): Promise<GifTemplate[]> {
    try {
      if (!this.TENOR_API_KEY || this.TENOR_API_KEY === 'demo_api_key') {
        console.log(`⚠️ Tenor API key not configured, skipping ${query} search`);
        return [];
      }

      const response = await axios.get<TenorResponse>(
        `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${this.TENOR_API_KEY}&limit=${limit}&media_filter=gif`,
        {
          timeout: 10000,
          headers: {
            'User-Agent': 'AI-Meme-Studio-GIF-Service/1.0'
          }
        }
      );

      if (!response.data.results) {
        return [];
      }

      return response.data.results
        .filter(gif => this.isGoodTenorGif(gif))
        .map((gif, index) => this.convertTenorGif(gif, query, index));
    } catch (error) {
      console.error(`Failed to fetch Tenor GIFs for "${query}":`, error);
      return [];
    }
  }

  private async fetchFromImgflip(): Promise<GifTemplate[]> {
    try {
      const response = await axios.get<ImgflipResponse>('https://api.imgflip.com/get_memes', {
        timeout: 5000
      });

      if (!response.data.success || !response.data.data?.memes) {
        return [];
      }

      // Convert static meme templates to "GIF-like" entries for variety
      return response.data.data.memes
        .filter(meme => this.isGoodMemeTemplate(meme))
        .slice(0, 20)
        .map((meme, index) => ({
          id: `imgflip-${meme.id}`,
          title: meme.name,
          gifUrl: meme.url,
          previewUrl: meme.url,
          thumbnailUrl: meme.url,
          width: meme.width,
          height: meme.height,
          tags: this.generateTags(meme.name),
          category: this.categorizeGif(meme.name),
          source: 'imgflip',
          popularity: 70 - index,
          isAnimated: false // These are static templates
        }));
    } catch (error) {
      return [];
    }
  }

  private isGoodTenorGif(gif: TenorGif): boolean {
    // Filter out inappropriate content
    const invalidFlags = ['nsfw', 'adult', 'explicit', 'inappropriate'];
    const hasInvalidFlag = gif.flags.some(flag => invalidFlags.includes(flag.toLowerCase()));
    
    if (hasInvalidFlag) return false;
    
    // Check if GIF has proper media formats
    const hasGifFormat = gif.media_formats.gif || gif.media_formats.mediumgif;
    if (!hasGifFormat) return false;
    
    // Check dimensions (avoid very small or very large GIFs)
    const format = gif.media_formats.gif || gif.media_formats.mediumgif;
    if (!format) return false;
    
    const [width, height] = format.dims;
    return width >= 200 && height >= 200 && width <= 1920 && height <= 1080;
  }

  private convertTenorGif(tenorGif: TenorGif, query: string, index: number): GifTemplate {
    const gifFormat = tenorGif.media_formats.gif || tenorGif.media_formats.mediumgif;
    const previewFormat = tenorGif.media_formats.mediumgif || tenorGif.media_formats.tinygif;
    
    if (!gifFormat) {
      throw new Error('No valid GIF format found');
    }
    
    const [width, height] = gifFormat.dims;
    const popularity = this.calculateTenorPopularity(tenorGif, index);
    
    return {
      id: `tenor-${tenorGif.id}`,
      title: tenorGif.title || tenorGif.content_description || query,
      gifUrl: gifFormat.url,
      previewUrl: previewFormat?.url || gifFormat.url,
      thumbnailUrl: tenorGif.media_formats.tinygif?.url || previewFormat?.url || gifFormat.url,
      width,
      height,
      duration: gifFormat.duration,
      size: gifFormat.size,
      tags: [...tenorGif.tags, query],
      category: this.categorizeTenorGif(tenorGif, query),
      source: 'tenor',
      popularity,
      trending: query === 'trending',
      isAnimated: true
    };
  }

  private calculateTenorPopularity(gif: TenorGif, index: number): number {
    // Base popularity on creation date and position
    const ageInDays = (Date.now() - gif.created * 1000) / (1000 * 60 * 60 * 24);
    const recencyBonus = Math.max(0, 30 - ageInDays) * 2; // Newer GIFs get bonus
    const positionBonus = Math.max(0, 20 - index) * 3; // Higher position gets bonus
    
    return Math.min(100, Math.max(60, 70 + recencyBonus + positionBonus));
  }

  private categorizeTenorGif(gif: TenorGif, query: string): string {
    const title = gif.title.toLowerCase();
    const tags = gif.tags.map(tag => tag.toLowerCase());
    const allText = [...tags, title, query.toLowerCase()].join(' ');
    
    if (allText.includes('react') || allText.includes('emotion') || 
        allText.includes('feel') || allText.includes('mood') ||
        allText.includes('surprised') || allText.includes('confused') ||
        allText.includes('excited') || allText.includes('laugh') ||
        allText.includes('cry') || allText.includes('angry')) return 'reaction';
    
    if (allText.includes('dance') || allText.includes('party') || 
        allText.includes('celebrate') || allText.includes('happy') ||
        allText.includes('clap') || allText.includes('victory') ||
        allText.includes('cheer')) return 'celebration';
    
    if (allText.includes('cute') || allText.includes('animal') || 
        allText.includes('cat') || allText.includes('dog') ||
        allText.includes('pet') || allText.includes('kitten') ||
        allText.includes('puppy')) return 'animals';
    
    if (allText.includes('sport') || allText.includes('game') || 
        allText.includes('goal') || allText.includes('win') ||
        allText.includes('basketball') || allText.includes('football') ||
        allText.includes('soccer')) return 'sports';
    
    if (allText.includes('love') || allText.includes('heart') || 
        allText.includes('kiss') || allText.includes('romance') ||
        allText.includes('couple')) return 'love';
    
    if (allText.includes('work') || allText.includes('office') || 
        allText.includes('type') || allText.includes('coffee') ||
        allText.includes('computer') || allText.includes('meeting')) return 'work';
    
    if (allText.includes('food') || allText.includes('eating') || 
        allText.includes('cook') || allText.includes('hungry') ||
        allText.includes('delicious') || allText.includes('pizza')) return 'food';
    
    if (allText.includes('cartoon') || allText.includes('anime') || 
        allText.includes('character') || allText.includes('mind') ||
        allText.includes('blown') || allText.includes('funny')) return 'entertainment';
    
    return 'general';
  }

  private isGoodMemeTemplate(meme: ImgflipTemplate): boolean {
    const name = meme.name.toLowerCase();
    const goodTemplates = [
      'drake', 'distracted', 'woman', 'cat', 'spongebob', 'pikachu',
      'brain', 'buttons', 'surprised', 'fine', 'stonks', 'change',
      'mind', 'grumpy', 'success', 'bad luck', 'first world'
    ];
    
    return goodTemplates.some(template => name.includes(template)) &&
           meme.width >= 200 && meme.height >= 200;
  }

  private categorizeGif(title: string): string {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('react') || titleLower.includes('emotion') || 
        titleLower.includes('feel') || titleLower.includes('mood') ||
        titleLower.includes('surprised') || titleLower.includes('confused') ||
        titleLower.includes('excited') || titleLower.includes('laugh')) return 'reaction';
    
    if (titleLower.includes('dance') || titleLower.includes('party') || 
        titleLower.includes('celebrate') || titleLower.includes('happy') ||
        titleLower.includes('clap') || titleLower.includes('victory')) return 'celebration';
    
    if (titleLower.includes('cute') || titleLower.includes('animal') || 
        titleLower.includes('cat') || titleLower.includes('dog') ||
        titleLower.includes('pet') || titleLower.includes('kitten')) return 'animals';
    
    if (titleLower.includes('sport') || titleLower.includes('game') || 
        titleLower.includes('goal') || titleLower.includes('win')) return 'sports';
    
    if (titleLower.includes('cartoon') || titleLower.includes('anime') || 
        titleLower.includes('character') || titleLower.includes('mind') ||
        titleLower.includes('blown')) return 'entertainment';
    
    if (titleLower.includes('love') || titleLower.includes('heart') || 
        titleLower.includes('kiss') || titleLower.includes('romance')) return 'love';
    
    if (titleLower.includes('work') || titleLower.includes('office') || 
        titleLower.includes('type') || titleLower.includes('coffee') ||
        titleLower.includes('computer')) return 'work';
    
    if (titleLower.includes('food') || titleLower.includes('eating') || 
        titleLower.includes('cook') || titleLower.includes('hungry') ||
        titleLower.includes('delicious')) return 'food';
    
    return 'general';
  }

  private generateTags(title: string): string[] {
    const words = title.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .slice(0, 5);
    
    const baseTags = [...words, 'meme', 'gif'];
    return [...new Set(baseTags)];
  }

  private removeDuplicateGifs(gifs: GifTemplate[]): GifTemplate[] {
    const seen = new Set<string>();
    return gifs.filter(gif => {
      const key = gif.gifUrl || `${gif.title.toLowerCase()}-${gif.source}`;
      
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private getValidCategories(): string[] {
    return [
      'reaction', 'celebration', 'animals', 'sports', 'entertainment',
      'love', 'work', 'food', 'general'
    ];
  }

  private async ensureGifsLoaded(): Promise<void> {
    const now = new Date();
    const needsRefresh = !this.lastFetch || 
      (now.getTime() - this.lastFetch.getTime()) > this.CACHE_DURATION;

    if (needsRefresh || this.gifs.length === 0) {
      await this.fetchAllGifs();
    }
  }

  // Public API methods
  async getAllGifs(): Promise<GifTemplate[]> {
    await this.ensureGifsLoaded();
    return [...this.gifs].sort((a, b) => b.popularity - a.popularity);
  }

  async getGifById(id: string): Promise<GifTemplate | undefined> {
    await this.ensureGifsLoaded();
    return this.gifs.find(gif => gif.id === id);
  }

  async getGifsByCategory(category: string): Promise<GifTemplate[]> {
    await this.ensureGifsLoaded();
    const validCategories = this.getValidCategories();
    
    if (!validCategories.includes(category)) {
      console.log(`⚠️ Invalid GIF category: ${category}. Valid categories:`, validCategories);
      return [];
    }
    
    const filtered = this.gifs.filter(gif => gif.category === category);
    console.log(`📂 GIF Category "${category}": ${filtered.length} GIFs found`);
    return filtered.sort((a, b) => b.popularity - a.popularity);
  }

  async searchGifs(query: string): Promise<GifTemplate[]> {
    await this.ensureGifsLoaded();
    const searchLower = query.toLowerCase();
    
    // First search local cache
    let results = this.gifs
      .filter(gif => 
        gif.title.toLowerCase().includes(searchLower) ||
        gif.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        gif.category.toLowerCase().includes(searchLower)
      )
      .sort((a, b) => b.popularity - a.popularity);
    
    // If we have a Tenor API key and local results are limited, search Tenor
    if (this.TENOR_API_KEY && this.TENOR_API_KEY !== 'demo_api_key' && results.length < 20) {
      try {
        const tenorResults = await this.fetchFromTenor(query, 30);
        const uniqueTenorResults = tenorResults.filter(tenorGif => 
          !results.some(existingGif => existingGif.id === tenorGif.id)
        );
        results = [...results, ...uniqueTenorResults];
      } catch (error) {
        console.log('Tenor search failed, using local results only');
      }
    }
    
    return results;
  }

  async searchTenorGifs(query: string, limit: number = 20): Promise<GifTemplate[]> {
    try {
      if (!this.TENOR_API_KEY || this.TENOR_API_KEY === 'demo_api_key') {
        console.log('⚠️ Tenor API key not configured');
        return [];
      }

      return await this.fetchFromTenor(query, limit);
    } catch (error) {
      console.error('Failed to search Tenor GIFs:', error);
      return [];
    }
  }

  async getTrendingGifs(limit: number = 20): Promise<GifTemplate[]> {
    await this.ensureGifsLoaded();
    return this.gifs
      .filter(gif => gif.trending)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }

  async getPopularGifs(limit: number = 20): Promise<GifTemplate[]> {
    await this.ensureGifsLoaded();
    return this.gifs
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }

  async getCategories(): Promise<string[]> {
    await this.ensureGifsLoaded();
    return this.getValidCategories();
  }

  async getGifsWithPagination(options: {
    page: number;
    limit: number;
    sort?: string;
    category?: string;
  }): Promise<{
    gifs: GifTemplate[];
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }> {
    await this.ensureGifsLoaded();
    
    let filteredGifs = [...this.gifs];
    
    if (options.category && this.getValidCategories().includes(options.category)) {
      filteredGifs = filteredGifs.filter(gif => gif.category === options.category);
    }
    
    switch (options.sort) {
      case 'title':
        filteredGifs.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'newest':
        filteredGifs.sort((a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0));
        break;
      case 'popularity':
      default:
        filteredGifs.sort((a, b) => b.popularity - a.popularity);
        break;
    }
    
    const total = filteredGifs.length;
    const totalPages = Math.ceil(total / options.limit);
    const startIndex = (options.page - 1) * options.limit;
    const endIndex = startIndex + options.limit;
    
    return {
      gifs: filteredGifs.slice(startIndex, endIndex),
      total,
      totalPages,
      hasNextPage: options.page < totalPages,
      hasPrevPage: options.page > 1
    };
  }

  async refreshGifs(): Promise<void> {
    this.lastFetch = null;
    await this.fetchAllGifs();
  }

  getCacheInfo(): { lastFetch: Date | null; gifCount: number; cacheValid: boolean } {
    const now = new Date();
    const cacheValid = this.lastFetch !== null && 
      (now.getTime() - this.lastFetch.getTime()) <= this.CACHE_DURATION;
    
    return {
      lastFetch: this.lastFetch,
      gifCount: this.gifs.length,
      cacheValid
    };
  }
} 