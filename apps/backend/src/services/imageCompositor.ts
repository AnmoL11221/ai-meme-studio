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
        url: `data:image/jpeg;base64,${outputBuffer.toString('base64')}`,
        prompt: `Template: ${template.name}, Top: ${topText || 'none'}, Bottom: ${bottomText || 'none'}`,
        model: 'template-compositor',
        width: width || 800,
        height: height || 600,
        generatedAt: new Date()
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

  private createMemeCaptionSvg(text: string, imageWidth: number, imageHeight: number, position: 'top' | 'bottom' = 'bottom'): string {
    const fontSize = Math.max(32, Math.min(120, Math.floor(imageWidth / 15)));
    const strokeWidth = Math.max(2, Math.floor(fontSize / 20));
    const lines = this.wrapText(text, Math.floor(imageWidth / (fontSize * 0.7)));
    const lineHeight = fontSize * 1.3;
    const totalTextHeight = lines.length * lineHeight;
    
    const padding = 80;
    let textY: number;
    
    if (position === 'top') {
      textY = padding;
    } else {
      textY = Math.max(padding, imageHeight - totalTextHeight - padding);
    }
    
    const textX = imageWidth / 2;

    return `
      <svg width="${imageWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="3" dy="3" stdDeviation="4" flood-color="rgba(0,0,0,0.8)"/>
            <feDropShadow dx="1" dy="1" stdDeviation="2" flood-color="rgba(0,0,0,0.6)"/>
          </filter>
          <linearGradient id="textGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#f0f0f0;stop-opacity:1" />
          </linearGradient>
        </defs>
        ${lines.map((line, index) => `
          <text 
            x="${textX}" 
            y="${textY + (index * lineHeight) + fontSize}" 
            font-family="Impact, Arial Black, sans-serif" 
            font-size="${fontSize}px" 
            font-weight="900" 
            text-anchor="middle" 
            dominant-baseline="middle"
            fill="url(#textGradient)"
            stroke="#000000" 
            stroke-width="${strokeWidth}"
            stroke-linejoin="round"
            stroke-linecap="round"
            filter="url(#shadow)"
            style="text-transform: uppercase; letter-spacing: 1px;"
          >${this.escapeXml(line)}</text>
        `).join('')}
      </svg>
    `;
  }

  async createOptimizedComposite(
    backgroundImage: GeneratedImage,
    characterImage: GeneratedImage,
    options: CompositeOptions = {}
  ): Promise<GeneratedImage> {
    try {
      console.log('🔧 Creating optimized composite with enhanced blending...');
      
      const backgroundData = backgroundImage.url.replace(/^data:image\/[a-z]+;base64,/, '');
      const characterData = characterImage.url.replace(/^data:image\/[a-z]+;base64,/, '');
      
      const backgroundBuffer = Buffer.from(backgroundData, 'base64');
      const characterBuffer = Buffer.from(characterData, 'base64');

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
        url: `data:image/jpeg;base64,${compositeBuffer.toString('base64')}`,
        prompt: `Optimized composite: ${backgroundImage.prompt} + ${characterImage.prompt}`,
        model: 'compositor',
        width: bgMeta.width || 800,
        height: bgMeta.height || 600,
        generatedAt: new Date()
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
      
      const backgroundData = backgroundImage.url.replace(/^data:image\/[a-z]+;base64,/, '');
      const characterData = characterImage.url.replace(/^data:image\/[a-z]+;base64,/, '');
      
      const backgroundBuffer = Buffer.from(backgroundData, 'base64');
      const characterBuffer = Buffer.from(characterData, 'base64');

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
        url: `data:image/jpeg;base64,${compositeBuffer.toString('base64')}`,
        prompt: `Basic composite: ${backgroundImage.prompt} + ${characterImage.prompt}`,
        model: 'compositor',
        width: bgMeta.width || 800,
        height: bgMeta.height || 600,
        generatedAt: new Date()
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

  async compositeImages(background: GeneratedImage, character: GeneratedImage): Promise<GeneratedImage> {
    try {
      console.log(`🎨 Compositing background and character images`);
      
      const backgroundData = background.url.startsWith('data:') 
        ? Buffer.from(background.url.split(',')[1], 'base64')
        : await this.downloadImage(background.url);
      
      const characterData = character.url.startsWith('data:') 
        ? Buffer.from(character.url.split(',')[1], 'base64')
        : await this.downloadImage(character.url);

      const backgroundImage = sharp(backgroundData);
      const characterImage = sharp(characterData);

      const bgMetadata = await backgroundImage.metadata();
      const charMetadata = await characterImage.metadata();

      if (!bgMetadata.width || !bgMetadata.height || !charMetadata.width || !charMetadata.height) {
        throw new Error('Unable to get image dimensions');
      }

      const resizedCharacter = characterImage.resize({
        width: Math.floor(bgMetadata.width * 0.4),
        height: Math.floor(bgMetadata.height * 0.6),
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      });

      const compositeImage = backgroundImage.composite([{
        input: await resizedCharacter.toBuffer(),
        top: Math.floor(bgMetadata.height * 0.2),
        left: Math.floor(bgMetadata.width * 0.3)
      }]);

      const outputBuffer = await compositeImage.png({ quality: 100 }).toBuffer();

      return {
        id: uuidv4(),
        url: `data:image/png;base64,${outputBuffer.toString('base64')}`,
        prompt: `Composite: ${background.prompt} + ${character.prompt}`,
        model: 'compositor',
        width: bgMetadata.width,
        height: bgMetadata.height,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error compositing images:', error);
      throw new Error(`Failed to composite images: ${(error as Error).message}`);
    }
  }

  async addTextToImage(image: GeneratedImage, text: string, position: 'top' | 'bottom' | 'auto' = 'auto'): Promise<GeneratedImage> {
    try {
      console.log(`📝 Adding text to image: "${text}" at ${position}`);
      
      const imageData = image.url.startsWith('data:') 
        ? Buffer.from(image.url.split(',')[1], 'base64')
        : await this.downloadImage(image.url);

      let sharpImage = sharp(imageData);
      const metadata = await sharpImage.metadata();
      
      if (!metadata.width || !metadata.height) {
        throw new Error('Unable to get image dimensions');
      }

      let finalPosition: 'top' | 'bottom' = 'bottom';
      if (position === 'auto') {
        finalPosition = this.determineBestTextPosition(metadata.width, metadata.height, text);
      } else {
        finalPosition = position;
      }

      const svgText = this.createMemeCaptionSvg(text, metadata.width, metadata.height, finalPosition);
      
      const compositeImage = sharpImage.composite([{
        input: Buffer.from(svgText),
        top: 0,
        left: 0
      }]);

      const outputBuffer = await compositeImage.png({ quality: 100 }).toBuffer();
      
      console.log(`✅ Text added successfully to image at ${finalPosition}`);

      return {
        ...image,
        id: uuidv4(),
        url: `data:image/png;base64,${outputBuffer.toString('base64')}`,
        prompt: `${image.prompt} + Text: "${text}"`,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error adding text to image:', error);
      throw new Error(`Failed to add text: ${(error as Error).message}`);
    }
  }

  private determineBestTextPosition(width: number, height: number, text: string): 'top' | 'bottom' {
    const textLength = text.length;
    const aspectRatio = width / height;
    
    if (textLength > 20 || aspectRatio > 1.2) {
      return 'bottom';
    } else {
      return 'top';
    }
  }

  private async downloadImage(url: string): Promise<Buffer> {
    const response = await axios.get(url, { 
      responseType: 'arraybuffer',
      timeout: 15000,
      headers: {
        'User-Agent': 'AI-Meme-Studio/1.0'
      }
    });
    return Buffer.from(response.data);
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
        url: `data:image/png;base64,${finalImageBuffer.toString('base64')}`,
        prompt: `${baseImage.prompt} + custom text: ${textConfig.text}`,
        model: baseImage.model,
        width: width,
        height: height,
        generatedAt: new Date()
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