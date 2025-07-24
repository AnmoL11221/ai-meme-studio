import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { GifTemplate } from './gifService.js';
import { GeneratedImage } from '@ai-meme-studio/shared-types';

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
            .gif({ quality: editedGif.quality })
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
            .gif({ quality: editedGif.quality })
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
    const { text, fontSize, color, backgroundColor, strokeColor, strokeWidth, opacity, rotation } = overlay;
    
    const safeText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const transform = rotation ? `rotate(${rotation} ${overlay.x + overlay.width/2} ${overlay.y + overlay.height/2})` : '';
    
    let textElement = `
      <text 
        x="${overlay.x + overlay.width/2}" 
        y="${overlay.y + overlay.height/2 + fontSize/3}"
        font-family="${overlay.fontFamily}" 
        font-size="${fontSize}"
        fill="${color}"
        text-anchor="middle"
        dominant-baseline="middle"
        opacity="${opacity}"
        ${transform ? `transform="${transform}"` : ''}
        ${strokeColor && strokeWidth ? `stroke="${strokeColor}" stroke-width="${strokeWidth}"` : ''}
      >${safeText}</text>
    `;

    if (backgroundColor) {
      textElement = `
        <rect 
          x="${overlay.x}" 
          y="${overlay.y}" 
          width="${overlay.width}" 
          height="${overlay.height}"
          fill="${backgroundColor}"
          opacity="${opacity * 0.8}"
          ${transform ? `transform="${transform}"` : ''}
        />
        ${textElement}
      `;
    }

    return `
      <svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
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
      fontFamily: 'Arial, sans-serif',
      color: '#FFFFFF',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      strokeColor: '#000000',
      strokeWidth: 2,
      opacity: 1,
      rotation: 0,
      animation: 'none'
    };
  }

  async exportGif(gifId: string, format: 'gif' | 'mp4' | 'webm' = 'gif'): Promise<Buffer> {
    const editedGif = await this.renderGif(gifId);
    
    if (!editedGif.data) {
      throw new Error('GIF not rendered');
    }

    console.log(`📦 Exporting GIF ${gifId} as ${format}`);
    return Buffer.from(editedGif.data, 'base64');
  }
} 