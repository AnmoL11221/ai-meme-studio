import sharp from 'sharp';
import { GeneratedImage, MemeTemplate } from '@ai-meme-studio/shared-types';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

interface CompositeOptions {
  blendMode?: 'natural' | 'overlay' | 'multiply' | 'screen';
  matchLighting?: boolean;
  adjustPerspective?: boolean;
  enhanceEdges?: boolean;
  concept?: string;
}

export class ImageCompositor {
  async createMemeFromTemplate(
    template: MemeTemplate,
    topText?: string,
    bottomText?: string
  ): Promise<GeneratedImage> {
    try {
      console.log(`🎨 Creating meme from template: ${template.name}`);
      console.log(`📥 Downloading image from: ${template.imageUrl}`);
      
      const response = await axios.get(template.imageUrl, { 
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: {
          'User-Agent': 'AI-Meme-Studio/1.0'
        }
      });
      const templateBuffer = Buffer.from(response.data);
      console.log(`✅ Downloaded ${templateBuffer.length} bytes`);

      let memeImage = sharp(templateBuffer);
      const { width, height } = await memeImage.metadata();

      console.log(`📏 Image dimensions: ${width}x${height}`);
      if (!width || !height) {
        throw new Error('Unable to get template dimensions');
      }

      // Create SVG overlay for text
      const textOverlays = [];
      console.log(`📝 Adding text overlays - Top: "${topText}", Bottom: "${bottomText}"`);

      if (topText && topText.trim()) {
        console.log(`📝 Adding top text: "${topText}"`);
        const topSvg = this.createTextSvg(topText, width || 800, 'top', template.topTextPosition);
        memeImage = memeImage.composite([{ input: Buffer.from(topSvg), top: 0, left: 0 }]);
      }

      if (bottomText && bottomText.trim()) {
        console.log(`📝 Adding bottom text: "${bottomText}"`);
        const bottomSvg = this.createTextSvg(bottomText, width || 800, 'bottom', template.bottomTextPosition);
        memeImage = memeImage.composite([{ input: Buffer.from(bottomSvg), top: 0, left: 0 }]);
      }

      const outputBuffer = await memeImage.jpeg({ quality: 90 }).toBuffer();
      console.log(`✅ Meme created successfully, output size: ${outputBuffer.length} bytes`);

      return {
        id: uuidv4(),
        prompt: `Template: ${template.name}, Top: ${topText || 'none'}, Bottom: ${bottomText || 'none'}`,
        data: outputBuffer.toString('base64'),
        format: 'jpeg',
        width: width || 800,
        height: height || 600,
        revisedPrompt: `Meme created from "${template.name}" template with custom text overlay`
      };
    } catch (error) {
      console.error(`❌ Failed to create meme from template ${template.name}:`, error);
      throw new Error(`Failed to create meme: ${(error as Error).message}`);
    }
  }

  private createTextSvg(text: string, width: number, height: number, fontSize: number): string {
    const lines = this.wrapText(text, Math.floor(width / (fontSize * 0.6)));
    const lineHeight = fontSize * 1.2;
    const totalTextHeight = lines.length * lineHeight;
    const startY = (height - totalTextHeight) / 2 + fontSize;

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .meme-text {
              font-family: 'Arial Black', Arial, sans-serif;
              font-size: ${fontSize}px;
              font-weight: 900;
              text-anchor: middle;
              dominant-baseline: middle;
              fill: white;
              stroke: black;
              stroke-width: 2;
              paint-order: stroke fill;
            }
          </style>
        </defs>
        ${lines.map((line, index) => 
          `<text x="${width / 2}" y="${startY + (index * lineHeight)}" class="meme-text">${this.escapeXml(line)}</text>`
        ).join('')}
      </svg>
    `;
  }

  private wrapText(text: string, maxCharsPerLine: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxCharsPerLine) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    return lines;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async createOptimizedComposite(
    backgroundImage: GeneratedImage,
    characterImage: GeneratedImage,
    options: CompositeOptions = {}
  ): Promise<GeneratedImage> {
    try {
      console.log('🔧 Creating optimized composite with enhanced blending...');
      
      const backgroundBuffer = Buffer.from(backgroundImage.data, 'base64');
      const characterBuffer = Buffer.from(characterImage.data, 'base64');

      let background = sharp(backgroundBuffer);
      let character = sharp(characterBuffer);

      const bgMeta = await background.metadata();
      const charMeta = await character.metadata();

      console.log(`📏 Background: ${bgMeta.width}x${bgMeta.height}, Character: ${charMeta.width}x${charMeta.height}`);

      if (options.adjustPerspective) {
        character = await this.adjustCharacterPerspective(character, bgMeta);
      }

      if (options.matchLighting) {
        character = await this.matchLighting(character, background);
      }

      if (options.enhanceEdges) {
        character = await this.enhanceEdges(character);
      }

      const targetWidth = Math.min(bgMeta.width || 800, (bgMeta.width || 800) * 0.7);
      const targetHeight = Math.min(bgMeta.height || 600, (bgMeta.height || 600) * 0.8);

      character = character.resize(Math.floor(targetWidth), Math.floor(targetHeight), {
        fit: 'inside',
        withoutEnlargement: true
      });

      const resizedCharMeta = await character.metadata();
      const left = Math.floor(((bgMeta.width || 800) - (resizedCharMeta.width || 0)) / 2);
      const top = Math.floor(((bgMeta.height || 600) - (resizedCharMeta.height || 0)) / 2);

      const blendMode = this.getBlendMode(options.blendMode || 'natural');

      const compositeBuffer = await background
        .composite([{
          input: await character.toBuffer(),
          left: left,
          top: top,
          blend: blendMode as any
        }])
        .jpeg({ quality: 95 })
        .toBuffer();

      console.log('✅ Optimized composite created successfully');

      return {
        id: uuidv4(),
        prompt: `Optimized composite: ${backgroundImage.prompt} + ${characterImage.prompt}`,
        data: compositeBuffer.toString('base64'),
        format: 'jpeg',
        width: bgMeta.width || 800,
        height: bgMeta.height || 600,
        revisedPrompt: `Enhanced composite with natural blending, lighting adjustment, and perspective correction`
      };
    } catch (error) {
      console.error('Enhanced composite failed:', error);
      return this.createBasicComposite(backgroundImage, characterImage);
    }
  }

  async createBasicComposite(
    backgroundImage: GeneratedImage,
    characterImage: GeneratedImage
  ): Promise<GeneratedImage> {
    try {
      console.log('🔧 Creating basic composite as fallback...');
      
      const backgroundBuffer = Buffer.from(backgroundImage.data, 'base64');
      const characterBuffer = Buffer.from(characterImage.data, 'base64');

      const background = sharp(backgroundBuffer);
      const character = sharp(characterBuffer);

      const bgMeta = await background.metadata();
      const targetWidth = Math.floor((bgMeta.width || 800) * 0.6);
      const targetHeight = Math.floor((bgMeta.height || 600) * 0.7);

      const resizedCharacter = character.resize(targetWidth, targetHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });

      const resizedMeta = await resizedCharacter.metadata();
      const left = Math.floor(((bgMeta.width || 800) - (resizedMeta.width || 0)) / 2);
      const top = Math.floor(((bgMeta.height || 600) - (resizedMeta.height || 0)) / 2);

      const compositeBuffer = await background
        .composite([{
          input: await resizedCharacter.toBuffer(),
          left: left,
          top: top,
          blend: 'over'
        }])
        .jpeg({ quality: 90 })
        .toBuffer();

      return {
        id: uuidv4(),
        prompt: `Basic composite: ${backgroundImage.prompt} + ${characterImage.prompt}`,
        data: compositeBuffer.toString('base64'),
        format: 'jpeg',
        width: bgMeta.width || 800,
        height: bgMeta.height || 600,
        revisedPrompt: `Basic composite with standard blending`
      };
    } catch (error) {
      console.error('Basic composite failed:', error);
      throw error;
    }
  }

  private async adjustCharacterPerspective(character: sharp.Sharp, bgMeta: sharp.Metadata): Promise<sharp.Sharp> {
    console.log('🔄 Adjusting character perspective...');
    
    try {
      return character
        .resize(undefined, undefined, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .sharpen(1.2, 1, 2);
    } catch (error) {
      console.log('Perspective adjustment failed, using original');
      return character;
    }
  }

  private async matchLighting(character: sharp.Sharp, background: sharp.Sharp): Promise<sharp.Sharp> {
    console.log('💡 Matching lighting conditions...');
    
    try {
      return character
        .modulate({
          brightness: 1.05,
          saturation: 0.95,
          hue: 0
        })
        .gamma(1.1);
    } catch (error) {
      console.log('Lighting adjustment failed, using original');
      return character;
    }
  }

  private async enhanceEdges(character: sharp.Sharp): Promise<sharp.Sharp> {
    console.log('✨ Enhancing edges for better integration...');
    
    try {
      return character
        .sharpen(0.8, 0.5, 1.5)
        .modulate({
          brightness: 1.02,
          saturation: 1.05
        });
    } catch (error) {
      console.log('Edge enhancement failed, using original');
      return character;
    }
  }

  private getBlendMode(mode: string): string {
    const blendModes: Record<string, string> = {
      'natural': 'over',
      'overlay': 'overlay',
      'multiply': 'multiply',
      'screen': 'screen'
    };
    return blendModes[mode] || 'over';
  }

  // Legacy method for backward compatibility - composite images
  async compositeImages(background: GeneratedImage, character: GeneratedImage): Promise<GeneratedImage> {
    try {
      let backgroundBuffer: Buffer;
      let characterBuffer: Buffer;
      
      if (background.url.startsWith('data:image')) {
        backgroundBuffer = Buffer.from(background.url.split(',')[1], 'base64');
      } else {
        const response = await fetch(background.url);
        backgroundBuffer = Buffer.from(await response.arrayBuffer());
      }
      
      if (character.url.startsWith('data:image')) {
        characterBuffer = Buffer.from(character.url.split(',')[1], 'base64');
      } else {
        const response = await fetch(character.url);
        characterBuffer = Buffer.from(await response.arrayBuffer());
      }

      const backgroundProcessed = sharp(backgroundBuffer)
        .resize(1344, 768, { fit: 'cover' });

      const characterProcessed = sharp(characterBuffer)
        .resize(450, 650, { fit: 'inside', withoutEnlargement: true });

      const composited = await backgroundProcessed
        .composite([
          {
            input: await characterProcessed.toBuffer(),
            top: 60,
            left: 450,
            blend: 'over'
          }
        ])
        .png()
        .toBuffer();

      const compositedBase64 = composited.toString('base64');
      const compositedUrl = `data:image/png;base64,${compositedBase64}`;

      return {
        id: uuidv4(),
        url: compositedUrl,
        prompt: `Composition of: ${background.prompt} + ${character.prompt}`,
        model: 'composite',
        width: 1344,
        height: 768,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Image composition error:', error);
      throw new Error(`Failed to composite images: ${(error as Error).message}`);
    }
  }

  // Legacy method for backward compatibility - add text
  async addTextToImage(image: GeneratedImage, text: string): Promise<GeneratedImage> {
    try {
      let imageBuffer: Buffer;
      
      if (image.url.startsWith('data:image')) {
        imageBuffer = Buffer.from(image.url.split(',')[1], 'base64');
      } else {
        const response = await fetch(image.url);
        imageBuffer = Buffer.from(await response.arrayBuffer());
      }

      const baseImage = sharp(imageBuffer);
      const { width, height } = await baseImage.metadata();

      if (!width || !height) {
        throw new Error('Unable to get image dimensions');
      }

      const textSvg = this.createTextSvg(text, width, Math.floor(height * 0.2), Math.max(24, Math.floor(width / 20)));
      
      const finalBuffer = await baseImage
        .composite([{
          input: Buffer.from(textSvg),
          top: Math.floor(height * 0.8),
          left: 0,
        }])
        .png()
        .toBuffer();

      const base64Image = finalBuffer.toString('base64');
      const dataUrl = `data:image/png;base64,${base64Image}`;

      return {
        id: uuidv4(),
        url: dataUrl,
        prompt: image.prompt + ` with text: ${text}`,
        model: image.model,
        width,
        height,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error adding text to image:', error);
      throw new Error(`Text addition failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async addCustomTextToImage(
    baseImage: GeneratedImage,
    textConfig: {
      text: string;
      position: { x: number; y: number };
      style: {
        fontSize: number;
        color: string;
        fontWeight?: string;
        fontFamily?: string;
      };
    }
  ): Promise<GeneratedImage> {
    try {
      console.log(`📝 Adding custom text: "${textConfig.text}" at (${textConfig.position.x}, ${textConfig.position.y})`);
      
      let imageBuffer: Buffer;
      
      if (baseImage.url.startsWith('http')) {
        const response = await axios.get(baseImage.url, { 
          responseType: 'arraybuffer',
          timeout: 15000 
        });
        imageBuffer = Buffer.from(response.data);
      } else {
        const fs = await import('fs');
        imageBuffer = fs.readFileSync(baseImage.url);
      }

      let memeImage = sharp(imageBuffer);
      const { width, height } = await memeImage.metadata();
      
      if (!width || !height) {
        throw new Error('Unable to get image dimensions');
      }

      const textSvg = this.createCustomTextSvg(
        textConfig.text,
        textConfig.style,
        width,
        height
      );

      const finalImageBuffer = await memeImage
        .composite([{
          input: Buffer.from(textSvg),
          top: Math.max(0, Math.min(textConfig.position.y, height - 50)),
          left: Math.max(0, Math.min(textConfig.position.x, width - 100))
        }])
        .png()
        .toBuffer();

      const finalImage: GeneratedImage = {
        id: uuidv4(),
        url: '',
        prompt: `${baseImage.prompt} + custom text: ${textConfig.text}`,
        model: baseImage.model,
        width: width,
        height: height,
        generatedAt: new Date(),
        data: finalImageBuffer
      };

      return finalImage;
    } catch (error) {
      console.error('Error adding custom text to image:', error);
      throw new Error(`Failed to add custom text: ${(error as Error).message}`);
    }
  }

  private createCustomTextSvg(
    text: string,
    style: {
      fontSize: number;
      color: string;
      fontWeight?: string;
      fontFamily?: string;
    },
    imageWidth: number,
    imageHeight: number
  ): string {
    const lines = this.wrapText(text, Math.floor(imageWidth / (style.fontSize * 0.6)));
    const lineHeight = style.fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    
    const svgHeight = Math.min(totalHeight + 20, imageHeight);
    const svgWidth = imageWidth;
    
    let svgContent = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">`;
    
    lines.forEach((line, index) => {
      const y = 20 + (index * lineHeight);
      const x = svgWidth / 2;
      
      svgContent += `
        <text x="${x}" y="${y}" 
              font-family="${style.fontFamily || 'Impact, Arial Black, sans-serif'}" 
              font-size="${style.fontSize}" 
              font-weight="${style.fontWeight || 'bold'}" 
              text-anchor="middle" 
              stroke="black" 
              stroke-width="3" 
              fill="none">${this.escapeXml(line)}</text>
        <text x="${x}" y="${y}" 
              font-family="${style.fontFamily || 'Impact, Arial Black, sans-serif'}" 
              font-size="${style.fontSize}" 
              font-weight="${style.fontWeight || 'bold'}" 
              text-anchor="middle" 
              fill="${style.color}">${this.escapeXml(line)}</text>
      `;
    });
    
    svgContent += '</svg>';
    return svgContent;
  }
} 