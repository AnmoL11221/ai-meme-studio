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
  private readonly TENOR_API_KEY = process.env.TENOR_API_KEY || 'demo_api_key';

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
      console.log('🎬 Loading GIF collection with robust fallbacks...');
      
      // Start with enhanced fallback collection
      let allGifs: GifTemplate[] = [...this.enhancedFallbackGifs];
      
      // Try to fetch from external APIs but don't fail if they're down
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
      
    } catch (error) {
      console.error('❌ Failed to load GIFs:', error);
      this.gifs = [...this.enhancedFallbackGifs];
      this.lastFetch = new Date();
      console.log(`📦 Using ${this.gifs.length} curated GIFs`);
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
    return this.gifs
      .filter(gif => 
        gif.title.toLowerCase().includes(searchLower) ||
        gif.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        gif.category.toLowerCase().includes(searchLower)
      )
      .sort((a, b) => b.popularity - a.popularity);
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