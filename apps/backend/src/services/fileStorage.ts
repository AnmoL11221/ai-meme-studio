import fs from 'fs-extra';
import path from 'path';
import { GeneratedImage } from '@ai-meme-studio/shared-types';
import { v4 as uuidv4 } from 'uuid';

export class FileStorageService {
  private baseDir: string;
  private backgroundsDir: string;
  private charactersDir: string;
  private finalMemesDir: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), 'data', 'uploads');
    this.backgroundsDir = path.join(this.baseDir, 'backgrounds');
    this.charactersDir = path.join(this.baseDir, 'characters');
    this.finalMemesDir = path.join(this.baseDir, 'final-memes');
  }

  private async ensureDirectories(): Promise<void> {
    await fs.ensureDir(this.backgroundsDir);
    await fs.ensureDir(this.charactersDir);
    await fs.ensureDir(this.finalMemesDir);
  }

  async saveBackground(image: GeneratedImage): Promise<string> {
    return this.saveImage(image, this.backgroundsDir, 'bg');
  }

  async saveCharacter(image: GeneratedImage): Promise<string> {
    return this.saveImage(image, this.charactersDir, 'char');
  }

  async saveFinalMeme(image: GeneratedImage): Promise<string> {
    return this.saveImage(image, this.finalMemesDir, 'meme');
  }

  private async saveImage(image: GeneratedImage, directory: string, prefix: string): Promise<string> {
    // Ensure directory exists before saving
    await this.ensureDirectories();
    
    const filename = `${prefix}_${uuidv4()}.png`;
    const filePath = path.join(directory, filename);
    
    try {
      if (image.url.startsWith('data:image')) {
        const base64Data = image.url.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        await fs.writeFile(filePath, buffer);
        console.log(`✅ Saved image to: ${filePath}`);
      } else {
        const response = await fetch(image.url);
        const buffer = Buffer.from(await response.arrayBuffer());
        await fs.writeFile(filePath, buffer);
        console.log(`✅ Downloaded and saved image to: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Error saving image to ${filePath}:`, error);
      throw error;
    }
    
    return `/uploads/${path.relative(this.baseDir, filePath)}`;
  }

  async getImageBuffer(relativePath: string): Promise<Buffer | null> {
    try {
      const fullPath = path.join(this.baseDir, relativePath.replace('/uploads/', ''));
      return await fs.readFile(fullPath);
    } catch (error) {
      console.error('Error reading image file:', error);
      return null;
    }
  }

  async deleteImage(relativePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.baseDir, relativePath.replace('/uploads/', ''));
      await fs.remove(fullPath);
      return true;
    } catch (error) {
      console.error('Error deleting image file:', error);
      return false;
    }
  }

  async cleanup(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7); // Delete files older than 7 days

    const directories = [this.backgroundsDir, this.charactersDir, this.finalMemesDir];
    
    for (const dir of directories) {
      try {
        const files = await fs.readdir(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < cutoffDate) {
            await fs.remove(filePath);
            console.log(`Cleaned up old file: ${file}`);
          }
        }
      } catch (error) {
        console.error(`Error cleaning up directory ${dir}:`, error);
      }
    }
  }

  getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: string;
    backgroundCount: number;
    characterCount: number;
    finalMemeCount: number;
  }> {
    return this.calculateStorageStats();
  }

  private async calculateStorageStats() {
    let totalFiles = 0;
    let totalSize = 0;
    let backgroundCount = 0;
    let characterCount = 0;
    let finalMemeCount = 0;

    const directories = [
      { path: this.backgroundsDir, counter: () => backgroundCount++ },
      { path: this.charactersDir, counter: () => characterCount++ },
      { path: this.finalMemesDir, counter: () => finalMemeCount++ }
    ];

    for (const { path: dir, counter } of directories) {
      try {
        const files = await fs.readdir(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = await fs.stat(filePath);
          totalFiles++;
          totalSize += stats.size;
          counter();
        }
      } catch (error) {
        console.error(`Error reading directory ${dir}:`, error);
      }
    }

    return {
      totalFiles,
      totalSize: this.formatBytes(totalSize),
      backgroundCount,
      characterCount,
      finalMemeCount
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
} 