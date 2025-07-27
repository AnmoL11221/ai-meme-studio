import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { GifTemplate } from './gifService.js';
import { GeneratedImage } from '@ai-meme-studio/shared-types';

export interface GifFrame {
  index: number;
  timestamp: number;
  duration: number;
  data: string;
  width: number;
  height: number;
}

export interface PausedGifMeme {
  id: string;
  originalGifId: string;
  selectedFrame: GifFrame;
  textOverlays: GifTextOverlay[];
  effects: GifEffect[];
  outputFormat: 'png' | 'jpg' | 'webp' | 'gif' | 'mp4' | 'webm';
  quality: number;
  width?: number;
  height?: number;
  title: string;
  createdAt: Date;
  data?: string;
  url?: string;
}

export interface ExportOptions {
  format: 'png' | 'jpg' | 'webp' | 'gif' | 'mp4' | 'webm';
  quality: number;
  width?: number;
  height?: number;
  fps?: number;
  loop?: boolean;
  optimize?: boolean;
  metadata?: {
    title?: string;
    description?: string;
    author?: string;
    tags?: string[];
  };
}

export interface GifTextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  opacity: number;
  rotation?: number;
  animation?: 'none' | 'fadeIn' | 'slideIn' | 'bounce' | 'typewriter';
  startTime?: number;
  duration?: number;
  fontWeight?: 'normal' | 'bold' | 'bolder' | 'lighter' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle?: 'normal' | 'italic' | 'oblique';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  letterSpacing?: number;
  lineHeight?: number;
  textShadow?: {
    x: number;
    y: number;
    blur: number;
    color: string;
  };
  backgroundColorOpacity?: number;
  borderRadius?: number;
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  border?: {
    width: number;
    color: string;
    style: 'solid' | 'dashed' | 'dotted';
  };
  gradient?: {
    type: 'linear' | 'radial';
    colors: Array<{ color: string; offset: number }>;
    angle?: number;
  };
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';
}

export interface FontOption {
  name: string;
  family: string;
  category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
  weight: string[];
  style: string[];
  preview?: string;
}

export interface ColorPalette {
  name: string;
  colors: string[];
  category: 'meme' | 'professional' | 'vibrant' | 'pastel' | 'dark' | 'custom';
}

export interface TextPreset {
  id: string;
  name: string;
  description: string;
  category: 'meme' | 'caption' | 'title' | 'subtitle' | 'custom';
  settings: Partial<GifTextOverlay>;
  preview?: string;
}

export interface GifEffect {
  id: string;
  type: 'filter' | 'overlay' | 'animation';
  name: string;
  params: Record<string, any>;
  intensity: number;
  startTime?: number;
  duration?: number;
}

export interface EditedGif {
  id: string;
  originalGif: GifTemplate;
  textOverlays: GifTextOverlay[];
  effects: GifEffect[];
  outputFormat: 'gif' | 'mp4' | 'webm';
  quality: number;
  width?: number;
  height?: number;
  fps?: number;
  duration?: number;
  createdAt: Date;
  title: string;
  data?: string;
  url?: string;
}

export class GifEditor {
  private editedGifs: Map<string, EditedGif> = new Map();
  private pausedGifMemes: Map<string, PausedGifMeme> = new Map();
  private availableFonts: FontOption[] = [];
  private colorPalettes: ColorPalette[] = [];
  private textPresets: TextPreset[] = [];

  constructor() {
    this.initializeFonts();
    this.initializeColorPalettes();
    this.initializeTextPresets();
  }

  private initializeFonts(): void {
    this.availableFonts = [
      { name: 'Impact', family: 'Impact, Charcoal, sans-serif', category: 'display', weight: ['normal'], style: ['normal'], preview: 'IMPACT' },
      { name: 'Arial', family: 'Arial, Helvetica, sans-serif', category: 'sans-serif', weight: ['normal', 'bold'], style: ['normal', 'italic'], preview: 'Arial' },
      { name: 'Helvetica', family: 'Helvetica, Arial, sans-serif', category: 'sans-serif', weight: ['normal', 'bold'], style: ['normal', 'italic'], preview: 'Helvetica' },
      { name: 'Times New Roman', family: 'Times New Roman, Times, serif', category: 'serif', weight: ['normal', 'bold'], style: ['normal', 'italic'], preview: 'Times' },
      { name: 'Georgia', family: 'Georgia, Times, serif', category: 'serif', weight: ['normal', 'bold'], style: ['normal', 'italic'], preview: 'Georgia' },
      { name: 'Verdana', family: 'Verdana, Geneva, sans-serif', category: 'sans-serif', weight: ['normal', 'bold'], style: ['normal', 'italic'], preview: 'Verdana' },
      { name: 'Comic Sans MS', family: 'Comic Sans MS, cursive', category: 'handwriting', weight: ['normal', 'bold'], style: ['normal', 'italic'], preview: 'Comic' },
      { name: 'Courier New', family: 'Courier New, Courier, monospace', category: 'monospace', weight: ['normal', 'bold'], style: ['normal', 'italic'], preview: 'Courier' },
      { name: 'Trebuchet MS', family: 'Trebuchet MS, sans-serif', category: 'sans-serif', weight: ['normal', 'bold'], style: ['normal', 'italic'], preview: 'Trebuchet' },
      { name: 'Lucida Console', family: 'Lucida Console, Monaco, monospace', category: 'monospace', weight: ['normal', 'bold'], style: ['normal', 'italic'], preview: 'Console' },
      { name: 'Brush Script MT', family: 'Brush Script MT, cursive', category: 'handwriting', weight: ['normal'], style: ['normal', 'italic'], preview: 'Brush' },
      { name: 'Papyrus', family: 'Papyrus, fantasy', category: 'display', weight: ['normal'], style: ['normal'], preview: 'Papyrus' },
      { name: 'Chalkduster', family: 'Chalkduster, fantasy', category: 'display', weight: ['normal'], style: ['normal'], preview: 'Chalk' },
      { name: 'Marker Felt', family: 'Marker Felt, fantasy', category: 'display', weight: ['normal'], style: ['normal'], preview: 'Marker' },
      { name: 'Futura', family: 'Futura, Trebuchet MS, Arial, sans-serif', category: 'sans-serif', weight: ['normal', 'bold'], style: ['normal', 'italic'], preview: 'Futura' }
    ];
  }

  private initializeColorPalettes(): void {
    this.colorPalettes = [
      {
        name: 'Meme Classic',
        category: 'meme',
        colors: ['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF']
      },
      {
        name: 'Professional',
        category: 'professional',
        colors: ['#2C3E50', '#34495E', '#7F8C8D', '#95A5A6', '#BDC3C7', '#ECF0F1', '#FFFFFF', '#000000']
      },
      {
        name: 'Vibrant',
        category: 'vibrant',
        colors: ['#E74C3C', '#E67E22', '#F1C40F', '#2ECC71', '#3498DB', '#9B59B6', '#1ABC9C', '#E91E63']
      },
      {
        name: 'Pastel',
        category: 'pastel',
        colors: ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFB3F7', '#B3FFE6', '#F7B3FF', '#E6B3FF']
      },
      {
        name: 'Dark Theme',
        category: 'dark',
        colors: ['#1A1A1A', '#2D2D2D', '#404040', '#666666', '#999999', '#CCCCCC', '#FFFFFF', '#FF6B6B']
      },
      {
        name: 'Neon',
        category: 'vibrant',
        colors: ['#FF0080', '#00FF80', '#8000FF', '#FF8000', '#0080FF', '#80FF00', '#FF0080', '#00FFFF']
      }
    ];
  }

  private initializeTextPresets(): void {
    this.textPresets = [
      {
        id: 'meme-top',
        name: 'Meme Top Text',
        description: 'Classic meme top text style',
        category: 'meme',
        settings: {
          fontFamily: 'Impact, Charcoal, sans-serif',
          fontSize: 48,
          color: '#FFFFFF',
          strokeColor: '#000000',
          strokeWidth: 3,
          textAlign: 'center',
          fontWeight: 'bold',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backgroundColorOpacity: 0.5,
          padding: { top: 10, right: 20, bottom: 10, left: 20 },
          borderRadius: 5
        }
      },
      {
        id: 'meme-bottom',
        name: 'Meme Bottom Text',
        description: 'Classic meme bottom text style',
        category: 'meme',
        settings: {
          fontFamily: 'Impact, Charcoal, sans-serif',
          fontSize: 48,
          color: '#FFFFFF',
          strokeColor: '#000000',
          strokeWidth: 3,
          textAlign: 'center',
          fontWeight: 'bold',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backgroundColorOpacity: 0.5,
          padding: { top: 10, right: 20, bottom: 10, left: 20 },
          borderRadius: 5
        }
      },
      {
        id: 'caption',
        name: 'Caption Style',
        description: 'Clean caption text',
        category: 'caption',
        settings: {
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: 24,
          color: '#FFFFFF',
          strokeColor: '#000000',
          strokeWidth: 2,
          textAlign: 'center',
          fontWeight: 'normal',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backgroundColorOpacity: 0.7,
          padding: { top: 8, right: 16, bottom: 8, left: 16 },
          borderRadius: 8
        }
      },
      {
        id: 'title',
        name: 'Title Style',
        description: 'Bold title text',
        category: 'title',
        settings: {
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontSize: 36,
          color: '#FFFFFF',
          strokeColor: '#000000',
          strokeWidth: 2,
          textAlign: 'center',
          fontWeight: 'bold',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backgroundColorOpacity: 0.6,
          padding: { top: 12, right: 24, bottom: 12, left: 24 },
          borderRadius: 10
        }
      },
      {
        id: 'subtitle',
        name: 'Subtitle Style',
        description: 'Elegant subtitle text',
        category: 'subtitle',
        settings: {
          fontFamily: 'Georgia, Times, serif',
          fontSize: 20,
          color: '#FFFFFF',
          strokeColor: '#000000',
          strokeWidth: 1,
          textAlign: 'center',
          fontWeight: 'normal',
          fontStyle: 'italic',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backgroundColorOpacity: 0.4,
          padding: { top: 6, right: 12, bottom: 6, left: 12 },
          borderRadius: 6
        }
      }
    ];
  }

  async createEditableGif(gifTemplate: GifTemplate, title?: string): Promise<EditedGif> {
    const editedGif: EditedGif = {
      id: uuidv4(),
      originalGif: gifTemplate,
      textOverlays: [],
      effects: [],
      outputFormat: 'gif',
      quality: 80,
      width: gifTemplate.width,
      height: gifTemplate.height,
      fps: 15,
      createdAt: new Date(),
      title: title || `Edited ${gifTemplate.title}`
    };

    this.editedGifs.set(editedGif.id, editedGif);
    console.log(`🎬 Created editable GIF: ${editedGif.title}`);
    
    return editedGif;
  }

  async addTextOverlay(
    gifId: string, 
    overlay: Omit<GifTextOverlay, 'id'>
  ): Promise<GifTextOverlay> {
    const editedGif = this.editedGifs.get(gifId);
    if (!editedGif) {
      throw new Error('Edited GIF not found');
    }

    const textOverlay: GifTextOverlay = {
      id: uuidv4(),
      ...overlay
    };

    editedGif.textOverlays.push(textOverlay);
    console.log(`📝 Added text overlay "${textOverlay.text}" to GIF ${gifId}`);
    
    return textOverlay;
  }

  async updateTextOverlay(
    gifId: string, 
    overlayId: string, 
    updates: Partial<Omit<GifTextOverlay, 'id'>>
  ): Promise<GifTextOverlay> {
    const editedGif = this.editedGifs.get(gifId);
    if (!editedGif) {
      throw new Error('Edited GIF not found');
    }

    const overlayIndex = editedGif.textOverlays.findIndex(o => o.id === overlayId);
    if (overlayIndex === -1) {
      throw new Error('Text overlay not found');
    }

    editedGif.textOverlays[overlayIndex] = {
      ...editedGif.textOverlays[overlayIndex],
      ...updates
    };

    console.log(`✏️ Updated text overlay ${overlayId} in GIF ${gifId}`);
    return editedGif.textOverlays[overlayIndex];
  }

  async removeTextOverlay(gifId: string, overlayId: string): Promise<boolean> {
    const editedGif = this.editedGifs.get(gifId);
    if (!editedGif) {
      throw new Error('Edited GIF not found');
    }

    const originalLength = editedGif.textOverlays.length;
    editedGif.textOverlays = editedGif.textOverlays.filter(o => o.id !== overlayId);
    
    const wasRemoved = editedGif.textOverlays.length < originalLength;
    if (wasRemoved) {
      console.log(`🗑️ Removed text overlay ${overlayId} from GIF ${gifId}`);
    }
    
    return wasRemoved;
  }

  async addEffect(
    gifId: string, 
    effect: Omit<GifEffect, 'id'>
  ): Promise<GifEffect> {
    const editedGif = this.editedGifs.get(gifId);
    if (!editedGif) {
      throw new Error('Edited GIF not found');
    }

    const gifEffect: GifEffect = {
      id: uuidv4(),
      ...effect
    };

    editedGif.effects.push(gifEffect);
    console.log(`✨ Added effect "${gifEffect.name}" to GIF ${gifId}`);
    
    return gifEffect;
  }

  async removeEffect(gifId: string, effectId: string): Promise<boolean> {
    const editedGif = this.editedGifs.get(gifId);
    if (!editedGif) {
      throw new Error('Edited GIF not found');
    }

    const originalLength = editedGif.effects.length;
    editedGif.effects = editedGif.effects.filter(e => e.id !== effectId);
    
    const wasRemoved = editedGif.effects.length < originalLength;
    if (wasRemoved) {
      console.log(`🗑️ Removed effect ${effectId} from GIF ${gifId}`);
    }
    
    return wasRemoved;
  }

  async updateGifSettings(
    gifId: string, 
    settings: Partial<Pick<EditedGif, 'outputFormat' | 'quality' | 'width' | 'height' | 'fps' | 'title'>>
  ): Promise<EditedGif> {
    const editedGif = this.editedGifs.get(gifId);
    if (!editedGif) {
      throw new Error('Edited GIF not found');
    }

    Object.assign(editedGif, settings);
    console.log(`⚙️ Updated settings for GIF ${gifId}:`, settings);
    
    return editedGif;
  }

  async renderGif(gifId: string): Promise<EditedGif> {
    const editedGif = this.editedGifs.get(gifId);
    if (!editedGif) {
      throw new Error('Edited GIF not found');
    }

    try {
      console.log(`🎬 Starting to render GIF: ${editedGif.title}`);
      console.log(`📊 Text overlays: ${editedGif.textOverlays.length}, Effects: ${editedGif.effects.length}`);

      const originalGifBuffer = await this.downloadGif(editedGif.originalGif.gifUrl);
      
      if (editedGif.textOverlays.length === 0 && editedGif.effects.length === 0) {
        console.log('📦 No modifications needed, using original GIF');
        editedGif.data = originalGifBuffer.toString('base64');
        editedGif.url = `data:image/gif;base64,${editedGif.data}`;
        return editedGif;
      }

      const processedGif = await this.processGifWithModifications(
        originalGifBuffer,
        editedGif
      );

      editedGif.data = processedGif.toString('base64');
      editedGif.url = `data:image/${editedGif.outputFormat};base64,${editedGif.data}`;
      
      console.log(`✅ GIF rendered successfully: ${editedGif.title}`);
      console.log(`📏 Output: ${editedGif.width}x${editedGif.height}, Format: ${editedGif.outputFormat}`);
      
      return editedGif;
    } catch (error) {
      console.error(`❌ Failed to render GIF ${gifId}:`, error);
      throw new Error(`GIF rendering failed: ${(error as Error).message}`);
    }
  }

  private async downloadGif(url: string): Promise<Buffer> {
    try {
      console.log(`📥 Downloading GIF from: ${url}`);
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent': 'AI-Meme-Studio-GIF-Editor/1.0'
        }
      });
      
      const buffer = Buffer.from(response.data);
      console.log(`✅ Downloaded ${buffer.length} bytes`);
      return buffer;
    } catch (error) {
      console.error('Failed to download GIF:', error);
      throw new Error(`Failed to download GIF: ${(error as Error).message}`);
    }
  }

  private async processGifWithModifications(
    originalBuffer: Buffer,
    editedGif: EditedGif
  ): Promise<Buffer> {
    try {
      console.log('🔧 Processing GIF with modifications...');
      
      let processedImage = sharp(originalBuffer);
      
      if (editedGif.width !== editedGif.originalGif.width || 
          editedGif.height !== editedGif.originalGif.height) {
        console.log(`📏 Resizing to ${editedGif.width}x${editedGif.height}`);
        processedImage = processedImage.resize(editedGif.width, editedGif.height, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        });
      }

      const compositeInputs = [];

      for (const overlay of editedGif.textOverlays) {
        console.log(`📝 Adding text overlay: "${overlay.text}"`);
        const textSvg = this.createTextOverlaySvg(overlay, editedGif.width!, editedGif.height!);
        compositeInputs.push({
          input: Buffer.from(textSvg),
          left: Math.max(0, overlay.x),
          top: Math.max(0, overlay.y),
          blend: 'over' as const
        });
      }

      if (compositeInputs.length > 0) {
        processedImage = processedImage.composite(compositeInputs);
      }

      for (const effect of editedGif.effects) {
        console.log(`✨ Applying effect: ${effect.name}`);
        processedImage = await this.applyEffect(processedImage, effect);
      }

      let outputBuffer: Buffer;
      
      switch (editedGif.outputFormat) {
        case 'gif':
          outputBuffer = await processedImage
            .gif()
            .toBuffer();
          break;
        case 'webm':
        case 'mp4':
          outputBuffer = await processedImage
            .jpeg({ quality: editedGif.quality })
            .toBuffer();
          break;
        default:
          outputBuffer = await processedImage
            .gif()
            .toBuffer();
      }

      console.log(`✅ GIF processing complete, output size: ${outputBuffer.length} bytes`);
      return outputBuffer;
      
    } catch (error) {
      console.error('GIF processing failed:', error);
      throw error;
    }
  }

  private createTextOverlaySvg(overlay: GifTextOverlay, canvasWidth: number, canvasHeight: number): string {
    const {
      text, fontSize, color, backgroundColor, strokeColor, strokeWidth, opacity, rotation,
      fontWeight, fontStyle, textAlign, letterSpacing, lineHeight, textShadow,
      backgroundColorOpacity, borderRadius, padding, border, gradient, blendMode
    } = overlay;
    
    const safeText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const transform = rotation ? `rotate(${rotation} ${overlay.x + overlay.width/2} ${overlay.y + overlay.height/2})` : '';
    
    let textAnchor = 'middle';
    let dominantBaseline = 'middle';
    
    switch (textAlign) {
      case 'left':
        textAnchor = 'start';
        break;
      case 'right':
        textAnchor = 'end';
        break;
      case 'justify':
        textAnchor = 'middle';
        break;
      default:
        textAnchor = 'middle';
    }

    const textAttributes = [
      `font-family="${overlay.fontFamily}"`,
      `font-size="${fontSize}"`,
      `fill="${color}"`,
      `text-anchor="${textAnchor}"`,
      `dominant-baseline="${dominantBaseline}"`,
      `opacity="${opacity}"`,
      fontWeight ? `font-weight="${fontWeight}"` : '',
      fontStyle ? `font-style="${fontStyle}"` : '',
      letterSpacing ? `letter-spacing="${letterSpacing}"` : '',
      lineHeight ? `line-height="${lineHeight}"` : '',
      strokeColor && strokeWidth ? `stroke="${strokeColor}" stroke-width="${strokeWidth}"` : '',
      transform ? `transform="${transform}"` : '',
      blendMode && blendMode !== 'normal' ? `style="mix-blend-mode: ${blendMode}"` : ''
    ].filter(Boolean).join(' ');

    let textElement = `<text x="${overlay.x + overlay.width/2}" y="${overlay.y + overlay.height/2 + fontSize/3}" ${textAttributes}>${safeText}</text>`;

    if (textShadow) {
      const shadowFilter = `filter="url(#shadow-${overlay.id})"`;
      textElement = textElement.replace('>', ` ${shadowFilter}>`);
    }

    let backgroundElement = '';
    const bgOpacity = backgroundColorOpacity !== undefined ? backgroundColorOpacity : 0.8;
    
    if (backgroundColor || border || borderRadius || padding) {
      const paddingValues = padding || { top: 0, right: 0, bottom: 0, left: 0 };
      const borderValues = border || { width: 0, color: 'transparent', style: 'solid' };
      const radius = borderRadius || 0;
      
      const rectX = overlay.x - paddingValues.left;
      const rectY = overlay.y - paddingValues.top;
      const rectWidth = overlay.width + paddingValues.left + paddingValues.right;
      const rectHeight = overlay.height + paddingValues.top + paddingValues.bottom;
      
      let rectAttributes = [
        `x="${rectX}"`,
        `y="${rectY}"`,
        `width="${rectWidth}"`,
        `height="${rectHeight}"`,
        `opacity="${opacity * bgOpacity}"`,
        transform ? `transform="${transform}"` : ''
      ];

      if (backgroundColor) {
        if (gradient) {
          const gradientId = `gradient-${overlay.id}`;
          rectAttributes.push(`fill="url(#${gradientId})"`);
        } else {
          rectAttributes.push(`fill="${backgroundColor}"`);
        }
      } else {
        rectAttributes.push('fill="transparent"');
      }

      if (borderValues.width > 0) {
        rectAttributes.push(`stroke="${borderValues.color}"`);
        rectAttributes.push(`stroke-width="${borderValues.width}"`);
        rectAttributes.push(`stroke-dasharray="${borderValues.style === 'dashed' ? '5,5' : borderValues.style === 'dotted' ? '2,2' : 'none'}"`);
      }

      if (radius > 0) {
        rectAttributes.push(`rx="${radius}"`);
        rectAttributes.push(`ry="${radius}"`);
      }

      backgroundElement = `<rect ${rectAttributes.join(' ')} />`;
    }

    let defs = '';
    if (textShadow) {
      defs = `
        <defs>
          <filter id="shadow-${overlay.id}" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="${textShadow.x}" dy="${textShadow.y}" stdDeviation="${textShadow.blur}" flood-color="${textShadow.color}" flood-opacity="0.8"/>
          </filter>
        </defs>
      `;
    }

    if (gradient) {
      const gradientId = `gradient-${overlay.id}`;
      const gradientElement = gradient.type === 'linear' 
        ? `<linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="0%">`
        : `<radialGradient id="${gradientId}" cx="50%" cy="50%" r="50%">`;
      
      const gradientStops = gradient.colors.map(color => 
        `<stop offset="${color.offset}%" stop-color="${color.color}"/>`
      ).join('');
      
      defs += `
        <defs>
          ${gradientElement}
            ${gradientStops}
          </${gradient.type === 'linear' ? 'linearGradient' : 'radialGradient'}>
        </defs>
      `;
    }

    return `
      <svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
        ${defs}
        ${backgroundElement}
        ${textElement}
      </svg>
    `;
  }

  private async applyEffect(image: sharp.Sharp, effect: GifEffect): Promise<sharp.Sharp> {
    try {
      switch (effect.name) {
        case 'blur':
          return image.blur(effect.intensity);
        
        case 'sharpen':
          return image.sharpen(effect.intensity);
        
        case 'brightness':
          return image.modulate({ brightness: 1 + (effect.intensity / 100) });
        
        case 'contrast':
          return image.modulate({ brightness: 1, saturation: 1 + (effect.intensity / 100) });
        
        case 'saturation':
          return image.modulate({ saturation: 1 + (effect.intensity / 100) });
        
        case 'grayscale':
          return image.grayscale();
        
        case 'sepia':
          return image.tint({ r: 255, g: 240, b: 200 });
        
        case 'vintage':
          return image
            .modulate({ brightness: 0.9, saturation: 1.2 })
            .tint({ r: 255, g: 240, b: 180 });
        
        case 'neon':
          return image
            .modulate({ brightness: 1.2, saturation: 1.5 })
            .sharpen(2);
        
        default:
          console.log(`⚠️ Unknown effect: ${effect.name}`);
          return image;
      }
    } catch (error) {
      console.error(`Failed to apply effect ${effect.name}:`, error);
      return image;
    }
  }

  getEditedGif(gifId: string): EditedGif | undefined {
    return this.editedGifs.get(gifId);
  }

  getAllEditedGifs(): EditedGif[] {
    return Array.from(this.editedGifs.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  deleteEditedGif(gifId: string): boolean {
    const existed = this.editedGifs.has(gifId);
    this.editedGifs.delete(gifId);
    
    if (existed) {
      console.log(`🗑️ Deleted edited GIF: ${gifId}`);
    }
    
    return existed;
  }

  async duplicateEditedGif(gifId: string, newTitle?: string): Promise<EditedGif> {
    const original = this.editedGifs.get(gifId);
    if (!original) {
      throw new Error('Edited GIF not found');
    }

    const duplicate: EditedGif = {
      ...original,
      id: uuidv4(),
      title: newTitle || `${original.title} (Copy)`,
      createdAt: new Date(),
      data: undefined,
      url: undefined,
      textOverlays: original.textOverlays.map(overlay => ({
        ...overlay,
        id: uuidv4()
      })),
      effects: original.effects.map(effect => ({
        ...effect,
        id: uuidv4()
      }))
    };

    this.editedGifs.set(duplicate.id, duplicate);
    console.log(`📋 Duplicated GIF: ${original.title} -> ${duplicate.title}`);
    
    return duplicate;
  }

  getAvailableEffects(): Array<{ name: string; description: string; type: string }> {
    return [
      { name: 'blur', description: 'Blur the image', type: 'filter' },
      { name: 'sharpen', description: 'Sharpen the image', type: 'filter' },
      { name: 'brightness', description: 'Adjust brightness', type: 'filter' },
      { name: 'contrast', description: 'Adjust contrast', type: 'filter' },
      { name: 'saturation', description: 'Adjust color saturation', type: 'filter' },
      { name: 'grayscale', description: 'Convert to grayscale', type: 'filter' },
      { name: 'sepia', description: 'Apply sepia tone', type: 'filter' },
      { name: 'vintage', description: 'Vintage film effect', type: 'filter' },
      { name: 'neon', description: 'Bright neon effect', type: 'filter' }
    ];
  }

  getDefaultTextOverlay(width: number, height: number): Omit<GifTextOverlay, 'id'> {
    return {
      text: 'Your Text Here',
      x: Math.floor(width * 0.1),
      y: Math.floor(height * 0.1),
      width: Math.floor(width * 0.8),
      height: Math.floor(height * 0.2),
      fontSize: Math.max(20, Math.floor(width / 20)),
      fontFamily: 'Impact, Charcoal, sans-serif',
      color: '#FFFFFF',
      backgroundColor: 'transparent',
      strokeColor: '#000000',
      strokeWidth: 2,
      opacity: 1,
      rotation: 0,
      animation: 'none',
      fontWeight: 'bold',
      fontStyle: 'normal',
      textAlign: 'center',
      letterSpacing: 0,
      lineHeight: 1.2,
      backgroundColorOpacity: 0,
      borderRadius: 0,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      blendMode: 'normal'
    };
  }

  getAvailableFonts(): FontOption[] {
    return this.availableFonts;
  }

  getColorPalettes(): ColorPalette[] {
    return this.colorPalettes;
  }

  getTextPresets(): TextPreset[] {
    return this.textPresets;
  }

  async applyTextPreset(gifId: string, overlayId: string, presetId: string): Promise<GifTextOverlay> {
    const editedGif = this.editedGifs.get(gifId);
    if (!editedGif) {
      throw new Error('Edited GIF not found');
    }

    const preset = this.textPresets.find(p => p.id === presetId);
    if (!preset) {
      throw new Error('Text preset not found');
    }

    const overlayIndex = editedGif.textOverlays.findIndex(o => o.id === overlayId);
    if (overlayIndex === -1) {
      throw new Error('Text overlay not found');
    }

    editedGif.textOverlays[overlayIndex] = {
      ...editedGif.textOverlays[overlayIndex],
      ...preset.settings
    };

    console.log(`🎨 Applied text preset "${preset.name}" to overlay ${overlayId}`);
    return editedGif.textOverlays[overlayIndex];
  }

  async duplicateTextOverlay(gifId: string, overlayId: string): Promise<GifTextOverlay> {
    const editedGif = this.editedGifs.get(gifId);
    if (!editedGif) {
      throw new Error('Edited GIF not found');
    }

    const originalOverlay = editedGif.textOverlays.find(o => o.id === overlayId);
    if (!originalOverlay) {
      throw new Error('Text overlay not found');
    }

    const duplicatedOverlay: GifTextOverlay = {
      ...originalOverlay,
      id: uuidv4(),
      x: originalOverlay.x + 20,
      y: originalOverlay.y + 20,
      text: `${originalOverlay.text} (Copy)`
    };

    editedGif.textOverlays.push(duplicatedOverlay);
    console.log(`📋 Duplicated text overlay ${overlayId} -> ${duplicatedOverlay.id}`);
    
    return duplicatedOverlay;
  }

  async reorderTextOverlays(gifId: string, overlayIds: string[]): Promise<boolean> {
    const editedGif = this.editedGifs.get(gifId);
    if (!editedGif) {
      throw new Error('Edited GIF not found');
    }

    const orderedOverlays: GifTextOverlay[] = [];
    const existingOverlays = new Map(editedGif.textOverlays.map(o => [o.id, o]));

    for (const id of overlayIds) {
      const overlay = existingOverlays.get(id);
      if (overlay) {
        orderedOverlays.push(overlay);
      }
    }

    if (orderedOverlays.length !== editedGif.textOverlays.length) {
      return false;
    }

    editedGif.textOverlays = orderedOverlays;
    console.log(`🔄 Reordered text overlays for GIF ${gifId}`);
    return true;
  }

  async exportGif(gifId: string, format: 'gif' | 'mp4' | 'webm' = 'gif'): Promise<Buffer> {
    const editedGif = await this.renderGif(gifId);
    
    if (!editedGif.data) {
      throw new Error('GIF not rendered');
    }

    console.log(`📦 Exporting GIF ${gifId} as ${format}`);
    return Buffer.from(editedGif.data, 'base64');
  }

  async extractGifFrames(gifUrl: string): Promise<GifFrame[]> {
    try {
      console.log(`🎬 Extracting frames from GIF: ${gifUrl}`);
      
      const gifBuffer = await this.downloadGif(gifUrl);
      const frames: GifFrame[] = [];
      
      const gif = sharp(gifBuffer, { animated: true });
      const metadata = await gif.metadata();
      
      if (!metadata.pages || metadata.pages === 0) {
        throw new Error('No frames found in GIF');
      }

      const pageCount = Array.isArray(metadata.pages) ? metadata.pages.length : 1;
      
      for (let i = 0; i < pageCount; i++) {
        const frame = gif.clone();
        const frameBuffer = await frame.toBuffer();
        const frameData = frameBuffer.toString('base64');
        
        frames.push({
          index: i,
          timestamp: i * (Array.isArray(metadata.delay) ? metadata.delay[0] || 100 : metadata.delay || 100),
          duration: Array.isArray(metadata.delay) ? metadata.delay[0] || 100 : metadata.delay || 100,
          data: frameData,
          width: metadata.width || 0,
          height: metadata.height || 0
        });
      }

      console.log(`✅ Extracted ${frames.length} frames from GIF`);
      return frames;
    } catch (error) {
      console.error(`❌ Error extracting GIF frames:`, error);
      throw new Error(`Failed to extract GIF frames: ${error}`);
    }
  }

  async createPausedGifMeme(
    gifId: string, 
    frameIndex: number, 
    title?: string
  ): Promise<PausedGifMeme> {
    const editedGif = this.editedGifs.get(gifId);
    if (!editedGif) {
      throw new Error('Edited GIF not found');
    }

    const frames = await this.extractGifFrames(editedGif.originalGif.gifUrl);
    
    if (frameIndex >= frames.length) {
      throw new Error(`Frame index ${frameIndex} is out of range. GIF has ${frames.length} frames`);
    }

    const selectedFrame = frames[frameIndex];
    const memeId = uuidv4();

    const pausedGifMeme: PausedGifMeme = {
      id: memeId,
      originalGifId: gifId,
      selectedFrame,
      textOverlays: [],
      effects: [],
      outputFormat: 'png',
      quality: 90,
      width: selectedFrame.width,
      height: selectedFrame.height,
      title: title || `Paused GIF Meme - Frame ${frameIndex}`,
      createdAt: new Date()
    };

    this.pausedGifMemes.set(memeId, pausedGifMeme);
    console.log(`⏸️ Created paused GIF meme ${memeId} from frame ${frameIndex}`);
    
    return pausedGifMeme;
  }

  async addTextToPausedMeme(
    memeId: string, 
    overlay: Omit<GifTextOverlay, 'id'>
  ): Promise<GifTextOverlay> {
    const meme = this.pausedGifMemes.get(memeId);
    if (!meme) {
      throw new Error('Paused GIF meme not found');
    }

    const newOverlay: GifTextOverlay = {
      ...overlay,
      id: uuidv4()
    };

    meme.textOverlays.push(newOverlay);
    console.log(`✏️ Added text overlay to paused meme ${memeId}`);
    
    return newOverlay;
  }

  async updatePausedMemeText(
    memeId: string, 
    overlayId: string, 
    updates: Partial<Omit<GifTextOverlay, 'id'>>
  ): Promise<GifTextOverlay> {
    const meme = this.pausedGifMemes.get(memeId);
    if (!meme) {
      throw new Error('Paused GIF meme not found');
    }

    const overlayIndex = meme.textOverlays.findIndex(o => o.id === overlayId);
    if (overlayIndex === -1) {
      throw new Error('Text overlay not found');
    }

    meme.textOverlays[overlayIndex] = {
      ...meme.textOverlays[overlayIndex],
      ...updates
    };

    console.log(`✏️ Updated text overlay ${overlayId} in paused meme ${memeId}`);
    return meme.textOverlays[overlayIndex];
  }

  async removePausedMemeText(memeId: string, overlayId: string): Promise<boolean> {
    const meme = this.pausedGifMemes.get(memeId);
    if (!meme) {
      throw new Error('Paused GIF meme not found');
    }

    const initialLength = meme.textOverlays.length;
    meme.textOverlays = meme.textOverlays.filter(o => o.id !== overlayId);
    
    const removed = meme.textOverlays.length < initialLength;
    if (removed) {
      console.log(`🗑️ Removed text overlay ${overlayId} from paused meme ${memeId}`);
    }
    
    return removed;
  }

  async renderPausedMeme(memeId: string): Promise<PausedGifMeme> {
    const meme = this.pausedGifMemes.get(memeId);
    if (!meme) {
      throw new Error('Paused GIF meme not found');
    }

    try {
      console.log(`🎨 Rendering paused GIF meme ${memeId}`);
      
      const frameBuffer = Buffer.from(meme.selectedFrame.data, 'base64');
      let image = sharp(frameBuffer);

      if (meme.textOverlays.length > 0) {
        const svgOverlays = meme.textOverlays.map(overlay => 
          this.createTextOverlaySvg(overlay, meme.selectedFrame.width, meme.selectedFrame.height)
        );

        const combinedSvg = `
          <svg width="${meme.selectedFrame.width}" height="${meme.selectedFrame.height}" xmlns="http://www.w3.org/2000/svg">
            ${svgOverlays.join('')}
          </svg>
        `;

        image = image.composite([{
          input: Buffer.from(combinedSvg),
          top: 0,
          left: 0
        }]);
      }

      for (const effect of meme.effects) {
        image = await this.applyEffect(image, effect);
      }

      if (meme.width && meme.height) {
        image = image.resize(meme.width, meme.height);
      }

      let outputBuffer: Buffer;
      switch (meme.outputFormat) {
        case 'png':
          outputBuffer = await image.png({ quality: meme.quality }).toBuffer();
          break;
        case 'jpg':
          outputBuffer = await image.jpeg({ quality: meme.quality }).toBuffer();
          break;
        case 'webp':
          outputBuffer = await image.webp({ quality: meme.quality }).toBuffer();
          break;
        case 'gif':
          outputBuffer = await image.gif().toBuffer();
          break;
        default:
          outputBuffer = await image.png({ quality: meme.quality }).toBuffer();
      }

      meme.data = outputBuffer.toString('base64');
      meme.url = `data:image/${meme.outputFormat};base64,${meme.data}`;
      
      console.log(`✅ Rendered paused GIF meme ${memeId} as ${meme.outputFormat}`);
      return meme;
    } catch (error) {
      console.error(`❌ Error rendering paused GIF meme:`, error);
      throw new Error(`Failed to render paused GIF meme: ${error}`);
    }
  }

  async exportPausedMeme(memeId: string, options: ExportOptions): Promise<Buffer> {
    const meme = await this.renderPausedMeme(memeId);
    
    if (!meme.data) {
      throw new Error('Paused meme not rendered');
    }

    try {
      console.log(`📦 Exporting paused meme ${memeId} as ${options.format}`);
      
      let image = sharp(Buffer.from(meme.data, 'base64'));

      if (options.width && options.height) {
        image = image.resize(options.width, options.height);
      }

      let outputBuffer: Buffer;
      switch (options.format) {
        case 'png':
          outputBuffer = await image.png({ 
            quality: options.quality,
            compressionLevel: options.optimize ? 9 : 6
          }).toBuffer();
          break;
        case 'jpg':
          outputBuffer = await image.jpeg({ 
            quality: options.quality,
            progressive: options.optimize
          }).toBuffer();
          break;
        case 'webp':
          outputBuffer = await image.webp({ 
            quality: options.quality,
            effort: options.optimize ? 6 : 4
          }).toBuffer();
          break;
        case 'gif':
          outputBuffer = await image.gif().toBuffer();
          break;
        case 'mp4':
        case 'webm':
          outputBuffer = await image.png().toBuffer();
          break;
        default:
          outputBuffer = await image.png({ quality: options.quality }).toBuffer();
      }

      return outputBuffer;
    } catch (error) {
      console.error(`❌ Error exporting paused meme:`, error);
      throw new Error(`Failed to export paused meme: ${error}`);
    }
  }

  getPausedMeme(memeId: string): PausedGifMeme | undefined {
    return this.pausedGifMemes.get(memeId);
  }

  getAllPausedMemes(): PausedGifMeme[] {
    return Array.from(this.pausedGifMemes.values());
  }

  deletePausedMeme(memeId: string): boolean {
    const deleted = this.pausedGifMemes.delete(memeId);
    if (deleted) {
      console.log(`🗑️ Deleted paused GIF meme ${memeId}`);
    }
    return deleted;
  }

  async duplicatePausedMeme(memeId: string, newTitle?: string): Promise<PausedGifMeme> {
    const original = this.pausedGifMemes.get(memeId);
    if (!original) {
      throw new Error('Paused GIF meme not found');
    }

    const duplicated: PausedGifMeme = {
      ...original,
      id: uuidv4(),
      title: newTitle || `${original.title} (Copy)`,
      createdAt: new Date(),
      data: undefined,
      url: undefined
    };

    this.pausedGifMemes.set(duplicated.id, duplicated);
    console.log(`📋 Duplicated paused GIF meme ${memeId} -> ${duplicated.id}`);
    
    return duplicated;
  }

  getExportFormats(): Array<{ format: string; description: string; supported: boolean }> {
    return [
      { format: 'png', description: 'PNG - Lossless, transparent background', supported: true },
      { format: 'jpg', description: 'JPEG - Compressed, smaller file size', supported: true },
      { format: 'webp', description: 'WebP - Modern format, excellent compression', supported: true },
      { format: 'gif', description: 'GIF - Animated, widely supported', supported: true },
      { format: 'mp4', description: 'MP4 - Video format (basic support)', supported: false },
      { format: 'webm', description: 'WebM - Web video format (basic support)', supported: false }
    ];
  }

  getDefaultExportOptions(): ExportOptions {
    return {
      format: 'png',
      quality: 90,
      optimize: true,
      loop: true,
      metadata: {
        title: 'AI Meme Studio Export',
        author: 'AI Meme Studio',
        tags: ['meme', 'gif', 'ai-generated']
      }
    };
  }
} 