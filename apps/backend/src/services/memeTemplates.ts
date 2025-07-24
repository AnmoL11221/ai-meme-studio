import { MemeTemplate } from '@ai-meme-studio/shared-types';
import axios from 'axios';

interface TikTokTemplate {
  id: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  author: string;
  hashtags: string[];
  views: number;
  likes: number;
}

interface InstagramPost {
  id: string;
  caption: string;
  media_url: string;
  media_type: string;
  permalink: string;
  timestamp: string;
  hashtags: string[];
}

interface TwitterPost {
  id: string;
  text: string;
  media?: Array<{
    url: string;
    type: string;
  }>;
  public_metrics: {
    retweet_count: number;
    like_count: number;
  };
  created_at: string;
}

interface NineGagPost {
  id: string;
  title: string;
  url: string;
  images: {
    image700: {
      url: string;
      width: number;
      height: number;
    };
  };
  tags: Array<{ key: string }>;
  upVoteCount: number;
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

export class MemeTemplateService {
  private templates: MemeTemplate[] = [];
  private lastFetch: Date | null = null;
  private readonly CACHE_DURATION = 1000 * 60 * 60;
  
  private readonly IMGFLIP_API_URL = 'https://api.imgflip.com/get_memes';

  private wellKnownMemeTemplates: MemeTemplate[] = [
    {
      id: 'drake-pointing',
      name: 'Drake Pointing',
      imageUrl: 'https://i.imgflip.com/30b1gx.jpg',
      topTextPosition: { x: 640, y: 100, width: 640, height: 200 },
      bottomTextPosition: { x: 640, y: 500, width: 640, height: 200 },
      category: 'reaction',
      tags: ['drake', 'pointing', 'choice', 'preference'],
      popularity: 98
    },
    {
      id: 'distracted-boyfriend',
      name: 'Distracted Boyfriend',
      imageUrl: 'https://i.imgflip.com/1ur9b0.jpg',
      topTextPosition: { x: 50, y: 50, width: 300, height: 100 },
      bottomTextPosition: { x: 400, y: 50, width: 300, height: 100 },
      category: 'relationship',
      tags: ['distracted', 'boyfriend', 'choice', 'temptation'],
      popularity: 95
    },
    {
      id: 'woman-yelling-cat',
      name: 'Woman Yelling at Cat',
      imageUrl: 'https://i.imgflip.com/2kbn1e.jpg',
      topTextPosition: { x: 50, y: 50, width: 300, height: 100 },
      bottomTextPosition: { x: 400, y: 50, width: 300, height: 100 },
      category: 'reaction',
      tags: ['woman', 'cat', 'yelling', 'argument'],
      popularity: 92
    },
    {
      id: 'two-buttons',
      name: 'Two Buttons',
      imageUrl: 'https://i.imgflip.com/1g8my4.jpg',
      topTextPosition: { x: 50, y: 50, width: 300, height: 100 },
      bottomTextPosition: { x: 50, y: 300, width: 300, height: 100 },
      category: 'decision',
      tags: ['choice', 'decision', 'buttons', 'difficult'],
      popularity: 90
    },
    {
      id: 'mocking-spongebob',
      name: 'Mocking SpongeBob',
      imageUrl: 'https://i.imgflip.com/345v97.jpg',
      topTextPosition: { x: 50, y: 50, width: 400, height: 100 },
      bottomTextPosition: { x: 50, y: 350, width: 400, height: 100 },
      category: 'mockery',
      tags: ['spongebob', 'mocking', 'sarcasm', 'imitation'],
      popularity: 88
    },
    {
      id: 'change-my-mind',
      name: 'Change My Mind',
      imageUrl: 'https://i.imgflip.com/26am.jpg',
      topTextPosition: { x: 50, y: 50, width: 400, height: 100 },
      bottomTextPosition: { x: 50, y: 350, width: 400, height: 100 },
      category: 'opinion',
      tags: ['change', 'mind', 'opinion', 'debate'],
      popularity: 85
    },
    {
      id: 'surprised-pikachu',
      name: 'Surprised Pikachu',
      imageUrl: 'https://i.imgflip.com/3lmzyx.jpg',
      topTextPosition: { x: 50, y: 50, width: 400, height: 100 },
      bottomTextPosition: { x: 50, y: 350, width: 400, height: 100 },
      category: 'surprise',
      tags: ['pikachu', 'surprised', 'shock', 'unexpected'],
      popularity: 87
    },
    {
      id: 'expanding-brain',
      name: 'Expanding Brain',
      imageUrl: 'https://i.imgflip.com/2cho6p.jpg',
      topTextPosition: { x: 250, y: 50, width: 300, height: 100 },
      bottomTextPosition: { x: 250, y: 350, width: 300, height: 100 },
      category: 'intelligence',
      tags: ['brain', 'smart', 'evolution', 'levels'],
      popularity: 82
    },
    {
      id: 'this-is-fine',
      name: 'This is Fine',
      imageUrl: 'https://i.imgflip.com/1jwhww.jpg',
      topTextPosition: { x: 50, y: 50, width: 400, height: 100 },
      bottomTextPosition: { x: 50, y: 350, width: 400, height: 100 },
      category: 'disaster',
      tags: ['fire', 'fine', 'disaster', 'denial'],
      popularity: 84
    },
    {
      id: 'stonks',
      name: 'Stonks',
      imageUrl: 'https://i.imgflip.com/30b1gx.jpg',
      topTextPosition: { x: 50, y: 50, width: 400, height: 100 },
      bottomTextPosition: { x: 50, y: 350, width: 400, height: 100 },
      category: 'success',
      tags: ['stonks', 'stocks', 'profit', 'money'],
      popularity: 81
    }
  ];

  private async fetchTemplatesFromAPI(): Promise<void> {
    try {
      console.log('🎭 Fetching REAL meme templates from verified sources...');
      
      const [imgflipTemplates, classicMemes] = await Promise.allSettled([
        this.fetchImgflipTemplates(),
        this.getClassicMemeTemplates()
      ]);

      let allTemplates: MemeTemplate[] = [...this.wellKnownMemeTemplates];
      
      if (imgflipTemplates.status === 'fulfilled') {
        const filteredImgflip = this.filterRealMemes(imgflipTemplates.value);
        allTemplates = [...allTemplates, ...filteredImgflip];
        console.log(`✅ Imgflip: ${filteredImgflip.length} verified meme templates`);
      } else {
        console.log(`❌ Imgflip failed: ${imgflipTemplates.reason}`);
      }

      if (classicMemes.status === 'fulfilled') {
        allTemplates = [...allTemplates, ...classicMemes.value];
        console.log(`✅ Classic Memes: ${classicMemes.value.length} templates`);
      }

      const uniqueTemplates = this.removeDuplicateTemplates(allTemplates);
      this.templates = uniqueTemplates.sort((a, b) => b.popularity - a.popularity);
      this.lastFetch = new Date();
      
      console.log(`🎯 SUCCESS: ${this.templates.length} UNIQUE, VERIFIED MEME TEMPLATES!`);
      console.log(`📊 Categories: ${this.getValidCategories().length} available`);
      
    } catch (error) {
      console.error('❌ Failed to fetch templates:', error);
      console.log('🔄 Using well-known meme templates...');
      this.templates = [...this.wellKnownMemeTemplates];
      this.lastFetch = new Date();
      console.log(`📦 Using ${this.templates.length} verified templates`);
    }
  }

  private async fetchImgflipTemplates(): Promise<MemeTemplate[]> {
    try {
      const response = await axios.get<ImgflipResponse>(this.IMGFLIP_API_URL, {
        timeout: 10000
      });

      if (!response.data.success || !response.data.data?.memes) {
        throw new Error('Invalid Imgflip API response');
      }

      return response.data.data.memes
        .filter(template => this.isValidMemeTemplate(template))
        .slice(0, 50)
        .map((template, index) => this.convertImgflipTemplate(template, index));
    } catch (error) {
      console.error('Imgflip API failed:', error);
      return [];
    }
  }

  private isValidMemeTemplate(template: ImgflipTemplate): boolean {
    const name = template.name.toLowerCase();
    
    const validMemeKeywords = [
      'drake', 'distracted', 'woman', 'cat', 'spongebob', 'pikachu', 'brain',
      'stonks', 'fine', 'buttons', 'change', 'mind', 'expanding', 'mocking',
      'yelling', 'pointing', 'surprised', 'disaster', 'success', 'reaction',
      'one does not simply', 'most interesting', 'bad luck', 'success kid',
      'grumpy cat', 'philosoraptor', 'first world', 'college', 'captain',
      'buzz', 'woody', 'matrix', 'morpheus', 'batman', 'joker', 'trump',
      'bernie', 'obama', 'biden', 'putin', 'kim jong', 'epic handshake',
      'roll safe', 'hide the pain', 'harold', 'gru', 'plan', 'presentation',
      'lisa simpson', 'homer', 'bart', 'marge', 'peter griffin', 'lois',
      'stewie', 'brian', 'cleveland', 'quagmire', 'kermit', 'frog', 'tea',
      'arthur', 'fist', 'monkey puppet', 'side eye', 'chloe', 'side eye',
      'disaster girl', 'overly attached', 'girlfriend', 'socially awkward',
      'penguin', 'confession bear', 'advice', 'dog', 'courage wolf',
      'insanity wolf', 'foul bachelor', 'frog', 'good guy greg', 'scumbag',
      'steve', 'boromir', 'condescending wonka', 'x all the y', 'ancient aliens'
    ];

    const invalidKeywords = [
      'custom', 'blank', 'template', 'your text', 'add text', 'photo',
      'picture', 'image', 'upload', 'create', 'make', 'generator',
      'editor', 'tool', 'app', 'website', 'tutorial', 'how to'
    ];

    const hasValidKeyword = validMemeKeywords.some(keyword => name.includes(keyword));
    const hasInvalidKeyword = invalidKeywords.some(keyword => name.includes(keyword));

    return hasValidKeyword && !hasInvalidKeyword && template.width > 200 && template.height > 200;
  }

  private getClassicMemeTemplates(): MemeTemplate[] {
    const classics = [
      {
        id: 'one-does-not-simply',
        name: 'One Does Not Simply',
        imageUrl: 'https://i.imgflip.com/1bij.jpg',
        category: 'reaction',
        tags: ['boromir', 'one', 'does', 'not', 'simply'],
        popularity: 89
      },
      {
        id: 'most-interesting-man',
        name: 'The Most Interesting Man In The World',
        imageUrl: 'https://i.imgflip.com/1bh8.jpg',
        category: 'lifestyle',
        tags: ['interesting', 'man', 'beer', 'dos', 'equis'],
        popularity: 86
      },
      {
        id: 'bad-luck-brian',
        name: 'Bad Luck Brian',
        imageUrl: 'https://i.imgflip.com/1bip.jpg',
        category: 'disaster',
        tags: ['bad', 'luck', 'brian', 'misfortune'],
        popularity: 83
      },
      {
        id: 'success-kid',
        name: 'Success Kid',
        imageUrl: 'https://i.imgflip.com/1bhk.jpg',
        category: 'success',
        tags: ['success', 'kid', 'victory', 'achievement'],
        popularity: 85
      },
      {
        id: 'grumpy-cat',
        name: 'Grumpy Cat',
        imageUrl: 'https://i.imgflip.com/1bh7.jpg',
        category: 'animals',
        tags: ['grumpy', 'cat', 'no', 'angry'],
        popularity: 87
      },
      {
        id: 'first-world-problems',
        name: 'First World Problems',
        imageUrl: 'https://i.imgflip.com/1bhf.jpg',
        category: 'lifestyle',
        tags: ['first', 'world', 'problems', 'privileged'],
        popularity: 80
      }
    ];

    return classics.map(template => ({
      ...template,
      topTextPosition: { x: 50, y: 50, width: 400, height: 100 },
      bottomTextPosition: { x: 50, y: 350, width: 400, height: 100 }
    }));
  }

  private filterRealMemes(templates: MemeTemplate[]): MemeTemplate[] {
    return templates.filter(template => {
      const name = template.name.toLowerCase();
      
      const nonMemePatterns = [
        /trend\s*\d+/, /meme\s*\d+/, /template\s*\d+/, /viral\s*\d+/,
        /\d+\s*templates?/, /custom/, /blank/, /generator/,
        /photo\s*dump/, /aesthetic/, /story/, /highlight/,
        /feed/, /boomerang/, /fit\s*check/, /soft\s*launch/,
        /that\s*girl/, /main\s*character/, /ratio/, /spaces/,
        /fresh\s*meme/, /wholesome\s*meme/, /dark\s*humor/,
        /regional.*\d+/, /\w+\s*meme\s*\d+/, /extra.*\d+/
      ];

      const isGenerated = nonMemePatterns.some(pattern => pattern.test(name));
      
      const realMemeNames = [
        'drake', 'distracted', 'woman', 'cat', 'spongebob', 'pikachu',
        'brain', 'stonks', 'fine', 'buttons', 'change', 'mind',
        'surprised', 'expanding', 'mocking', 'yelling', 'pointing',
        'one does not simply', 'most interesting', 'bad luck brian',
        'success kid', 'grumpy cat', 'first world', 'boromir',
        'morpheus', 'batman', 'joker', 'roll safe', 'harold',
        'gru', 'lisa simpson', 'homer', 'kermit', 'arthur',
        'monkey puppet', 'disaster girl', 'overly attached'
      ];

      const isRealMeme = realMemeNames.some(memeName => name.includes(memeName));
      
      return isRealMeme && !isGenerated;
    });
  }

  private convertImgflipTemplate(imgflipTemplate: ImgflipTemplate, index: number): MemeTemplate {
    const { width, height, box_count } = imgflipTemplate;
    
    let topTextPosition = { x: 0, y: 0, width: 0, height: 0 };
    let bottomTextPosition = { x: 0, y: 0, width: 0, height: 0 };

    if (box_count >= 1) {
      topTextPosition = {
        x: Math.floor(width * 0.05),
        y: Math.floor(height * 0.05),
        width: Math.floor(width * 0.9),
        height: Math.floor(height * 0.2)
      };
    }

    if (box_count >= 2) {
      bottomTextPosition = {
        x: Math.floor(width * 0.05),
        y: Math.floor(height * 0.75),
        width: Math.floor(width * 0.9),
        height: Math.floor(height * 0.2)
      };
    }

    const category = this.categorizeTemplate(imgflipTemplate.name);
    const tags = this.generateTags(imgflipTemplate.name);
    const popularity = Math.max(50, 100 - index * 2);

    return {
      id: imgflipTemplate.id,
      name: imgflipTemplate.name,
      imageUrl: imgflipTemplate.url,
      topTextPosition,
      bottomTextPosition,
      category,
      tags,
      popularity
    };
  }

  private categorizeTemplate(name: string): string {
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes('drake') || nameLower.includes('pointing') || 
        nameLower.includes('woman') || nameLower.includes('cat') || nameLower.includes('yelling') ||
        nameLower.includes('surprised') || nameLower.includes('pikachu') ||
        nameLower.includes('monkey') || nameLower.includes('puppet') ||
        nameLower.includes('roll') || nameLower.includes('safe')) return 'reaction';
    
    if (nameLower.includes('distracted') || nameLower.includes('boyfriend') || 
        nameLower.includes('overly') || nameLower.includes('attached')) return 'relationship';
    
    if (nameLower.includes('button') || nameLower.includes('choice') || 
        nameLower.includes('decision') || nameLower.includes('two')) return 'decision';
    
    if (nameLower.includes('brain') || nameLower.includes('expanding') || 
        nameLower.includes('smart') || nameLower.includes('galaxy')) return 'intelligence';
    
    if (nameLower.includes('spongebob') || nameLower.includes('mocking') || 
        nameLower.includes('sarcasm')) return 'mockery';
    
    if (nameLower.includes('fine') || nameLower.includes('disaster') || 
        nameLower.includes('fire') || nameLower.includes('bad') || nameLower.includes('luck')) return 'disaster';
    
    if (nameLower.includes('stonks') || nameLower.includes('success') || 
        nameLower.includes('profit') || nameLower.includes('achievement')) return 'success';
    
    if (nameLower.includes('trump') || nameLower.includes('bernie') || 
        nameLower.includes('biden') || nameLower.includes('obama')) return 'political';
    
    if (nameLower.includes('cat') || nameLower.includes('dog') || 
        nameLower.includes('grumpy') || nameLower.includes('doge')) return 'animals';
    
    if (nameLower.includes('change') || nameLower.includes('mind') || 
        nameLower.includes('opinion') || nameLower.includes('debate')) return 'opinion';
    
    if (nameLower.includes('homer') || nameLower.includes('simpson') || 
        nameLower.includes('kermit') || nameLower.includes('arthur')) return 'tv';
    
    if (nameLower.includes('work') || nameLower.includes('office') || 
        nameLower.includes('job') || nameLower.includes('boss')) return 'workplace';
    
    return 'general';
  }

  private generateTags(name: string): string[] {
    const words = name.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .slice(0, 5);
    
    const baseTags = [...words, 'meme'];
    return [...new Set(baseTags)];
  }

  private removeDuplicateTemplates(templates: MemeTemplate[]): MemeTemplate[] {
    const seen = new Set<string>();
    return templates.filter(template => {
      const normalizedName = template.name.toLowerCase()
        .replace(/[^\w]/g, '')
        .trim();
      
      if (seen.has(normalizedName)) {
        console.log(`🔄 Removing duplicate: ${template.name}`);
        return false;
      }
      seen.add(normalizedName);
      return true;
    });
  }

  private getValidCategories(): string[] {
    return [
      'reaction', 'relationship', 'decision', 'intelligence', 'mockery',
      'disaster', 'success', 'political', 'animals', 'opinion',
      'tv', 'workplace', 'general'
    ];
  }

  private async ensureTemplatesLoaded(): Promise<void> {
    const now = new Date();
    const needsRefresh = !this.lastFetch || 
      (now.getTime() - this.lastFetch.getTime()) > this.CACHE_DURATION;

    if (needsRefresh || this.templates.length === 0) {
      await this.fetchTemplatesFromAPI();
    }
  }

  async getAllTemplates(): Promise<MemeTemplate[]> {
    await this.ensureTemplatesLoaded();
    return [...this.templates].sort((a, b) => b.popularity - a.popularity);
  }

  async getTemplateById(id: string): Promise<MemeTemplate | undefined> {
    await this.ensureTemplatesLoaded();
    return this.templates.find(template => template.id === id);
  }

  async getTemplatesByCategory(category: string): Promise<MemeTemplate[]> {
    await this.ensureTemplatesLoaded();
    const validCategories = this.getValidCategories();
    
    if (!validCategories.includes(category)) {
      console.log(`⚠️ Invalid category: ${category}. Valid categories:`, validCategories);
      return [];
    }
    
    const filtered = this.templates.filter(template => template.category === category);
    console.log(`📂 Category "${category}": ${filtered.length} templates found`);
    return filtered.sort((a, b) => b.popularity - a.popularity);
  }

  async searchTemplates(query: string): Promise<MemeTemplate[]> {
    await this.ensureTemplatesLoaded();
    const searchLower = query.toLowerCase();
    return this.templates
      .filter(template => 
        template.name.toLowerCase().includes(searchLower) ||
        template.tags.some((tag: string) => tag.toLowerCase().includes(searchLower)) ||
        template.category.toLowerCase().includes(searchLower)
      )
      .sort((a, b) => b.popularity - a.popularity);
  }

  async getPopularTemplates(limit: number = 20): Promise<MemeTemplate[]> {
    await this.ensureTemplatesLoaded();
    return this.templates
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }

  async getCategories(): Promise<string[]> {
    await this.ensureTemplatesLoaded();
    return this.getValidCategories();
  }

  async getTemplatesWithPagination(options: {
    page: number;
    limit: number;
    sort?: string;
    source?: string;
  }): Promise<{
    templates: MemeTemplate[];
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    cache: any;
  }> {
    await this.ensureTemplatesLoaded();
    
    let filteredTemplates = [...this.templates];
    
    switch (options.sort) {
      case 'name':
        filteredTemplates.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'popularity':
      default:
        filteredTemplates.sort((a, b) => b.popularity - a.popularity);
        break;
    }
    
    const total = filteredTemplates.length;
    const totalPages = Math.ceil(total / options.limit);
    const startIndex = (options.page - 1) * options.limit;
    const endIndex = startIndex + options.limit;
    
    return {
      templates: filteredTemplates.slice(startIndex, endIndex),
      total,
      totalPages,
      hasNextPage: options.page < totalPages,
      hasPrevPage: options.page > 1,
      cache: this.getCacheInfo()
    };
  }

  async searchTemplatesWithPagination(options: {
    query: string;
    page: number;
    limit: number;
    category?: string;
    source?: string;
  }): Promise<{
    templates: MemeTemplate[];
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }> {
    await this.ensureTemplatesLoaded();
    
    const query = options.query.toLowerCase();
    let filteredTemplates = this.templates.filter(template => 
      template.name.toLowerCase().includes(query) ||
      template.tags.some(tag => tag.toLowerCase().includes(query)) ||
      template.category.toLowerCase().includes(query)
    );
    
    if (options.category && this.getValidCategories().includes(options.category)) {
      filteredTemplates = filteredTemplates.filter(t => t.category === options.category);
    }
    
    filteredTemplates.sort((a, b) => b.popularity - a.popularity);
    
    const total = filteredTemplates.length;
    const totalPages = Math.ceil(total / options.limit);
    const startIndex = (options.page - 1) * options.limit;
    const endIndex = startIndex + options.limit;
    
    return {
      templates: filteredTemplates.slice(startIndex, endIndex),
      total,
      totalPages,
      hasNextPage: options.page < totalPages,
      hasPrevPage: options.page > 1
    };
  }

  async getSources(): Promise<string[]> {
    return ['imgflip', 'classic', 'verified'];
  }

  async getTrendingTemplates(limit: number = 20): Promise<MemeTemplate[]> {
    await this.ensureTemplatesLoaded();
    return this.templates
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }

  async getCacheStats(): Promise<any> {
    return {
      ...this.getCacheInfo(),
      sources: await this.getSources(),
      categories: await this.getCategories()
    };
  }

  async forceRefresh(): Promise<void> {
    this.lastFetch = null;
    await this.fetchTemplatesFromAPI();
  }

  async refreshTemplates(): Promise<void> {
    this.lastFetch = null;
    await this.fetchTemplatesFromAPI();
  }

  getCacheInfo(): { lastFetch: Date | null; templateCount: number; cacheValid: boolean } {
    const now = new Date();
    const cacheValid = this.lastFetch !== null && 
      (now.getTime() - this.lastFetch.getTime()) <= this.CACHE_DURATION;
    
    return {
      lastFetch: this.lastFetch,
      templateCount: this.templates.length,
      cacheValid
    };
  }
} 