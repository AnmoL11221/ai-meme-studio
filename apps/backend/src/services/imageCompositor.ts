import sharp from 'sharp';
import { GeneratedImage, MemeTemplate } from '@ai-meme-studio/shared-types';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

export class ImageCompositor {
  async createMemeFromTemplate(
    template: MemeTemplate,
    topText?: string,
    bottomText?: string
  ): Promise<GeneratedImage> {
    try {
      console.log(`🎨 Creating meme from template: ${template.name}`);
      console.log(`📥 Downloading image from: ${template.imageUrl}`);
      
      // Download template image
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

      if (topText && template.topTextPosition.width > 0) {
        console.log(`🔝 Creating top text at position:`, template.topTextPosition);
        const fontSize = Math.max(20, Math.floor(template.topTextPosition.width / 12));
        const topSvg = this.createTextSvg(
          topText,
          template.topTextPosition.width,
          template.topTextPosition.height,
          fontSize
        );
        textOverlays.push({
          input: Buffer.from(topSvg),
          top: template.topTextPosition.y,
          left: template.topTextPosition.x,
        });
        console.log(`✅ Top text SVG created (${fontSize}px font)`);
      }

      if (bottomText && template.bottomTextPosition.width > 0) {
        console.log(`🔽 Creating bottom text at position:`, template.bottomTextPosition);
        const fontSize = Math.max(20, Math.floor(template.bottomTextPosition.width / 12));
        const bottomSvg = this.createTextSvg(
          bottomText,
          template.bottomTextPosition.width,
          template.bottomTextPosition.height,
          fontSize
        );
        textOverlays.push({
          input: Buffer.from(bottomSvg),
          top: template.bottomTextPosition.y,
          left: template.bottomTextPosition.x,
        });
        console.log(`✅ Bottom text SVG created (${fontSize}px font)`);
      }

      console.log(`🔧 Compositing ${textOverlays.length} text overlays onto image`);
      if (textOverlays.length > 0) {
        memeImage = memeImage.composite(textOverlays);
      }

      console.log(`🎯 Generating final meme image...`);
      const finalBuffer = await memeImage.png().toBuffer();
      const base64Image = finalBuffer.toString('base64');
      const dataUrl = `data:image/png;base64,${base64Image}`;

      console.log(`🎉 Meme created successfully! Size: ${finalBuffer.length} bytes`);
      return {
        id: uuidv4(),
        url: dataUrl,
        prompt: `Meme from template: ${template.name}`,
        model: 'template-compositor',
        width,
        height,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('❌ Error creating meme from template:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.stack);
      }
      throw new Error(`Template meme creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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