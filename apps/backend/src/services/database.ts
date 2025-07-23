import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { MemeCreationState, MemeCreationStatus, MemeCreationStep } from '@ai-meme-studio/shared-types';

export class DatabaseService {
  private db: Database.Database;

  constructor() {
    const dataDir = path.join(process.cwd(), 'data');
    const dbPath = path.join(dataDir, 'memes.db');
    
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.db = new Database(dbPath);
    this.initializeSchema();
  }

  private initializeSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memes (
        id TEXT PRIMARY KEY,
        concept TEXT,
        template_id TEXT,
        top_text TEXT,
        bottom_text TEXT,
        custom_text TEXT,
        status TEXT NOT NULL,
        current_step INTEGER NOT NULL,
        background_path TEXT,
        character_path TEXT,
        final_meme_path TEXT,
        captions TEXT,
        error_message TEXT,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_memes_status ON memes(status);
      CREATE INDEX IF NOT EXISTS idx_memes_created_at ON memes(created_at);
    `);
  }

  saveMeme(meme: MemeCreationState): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO memes (
        id, concept, template_id, top_text, bottom_text, custom_text, status, current_step, 
        background_path, character_path, final_meme_path, captions, error_message, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      meme.id,
      meme.concept || null,
      meme.templateId || null,
      meme.topText || null,
      meme.bottomText || null,
      meme.customText || null,
      meme.status,
      meme.currentStep,
      null, // background_path (legacy)
      meme.character?.url || null,
      meme.finalMeme?.url || null,
      meme.captions ? JSON.stringify(meme.captions) : null,
      meme.error || null,
      meme.createdAt.toISOString(),
      meme.updatedAt.toISOString()
    );
  }

  getMeme(id: string): MemeCreationState | null {
    const stmt = this.db.prepare('SELECT * FROM memes WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) return null;

    return {
      id: row.id,
      concept: row.concept || undefined,
      templateId: row.template_id || undefined,
      topText: row.top_text || undefined,
      bottomText: row.bottom_text || undefined,
      customText: row.custom_text || undefined,
      status: row.status as MemeCreationStatus,
      currentStep: row.current_step as MemeCreationStep,
      character: row.character_path ? { 
        id: '', url: row.character_path, prompt: '', model: '', 
        width: 768, height: 1344, generatedAt: new Date() 
      } : undefined,
      finalMeme: row.final_meme_path ? { 
        id: '', url: row.final_meme_path, prompt: '', model: '', 
        width: 1344, height: 768, generatedAt: new Date() 
      } : undefined,
      captions: row.captions ? JSON.parse(row.captions) : undefined,
      error: row.error_message || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  getAllMemes(): MemeCreationState[] {
    const stmt = this.db.prepare('SELECT * FROM memes ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    
    return rows.map(row => ({
      id: row.id,
      concept: row.concept || undefined,
      templateId: row.template_id || undefined,
      topText: row.top_text || undefined,
      bottomText: row.bottom_text || undefined,
      customText: row.custom_text || undefined,
      status: row.status as MemeCreationStatus,
      currentStep: row.current_step as MemeCreationStep,
      character: row.character_path ? { 
        id: '', url: row.character_path, prompt: '', model: '', 
        width: 768, height: 1344, generatedAt: new Date() 
      } : undefined,
      finalMeme: row.final_meme_path ? { 
        id: '', url: row.final_meme_path, prompt: '', model: '', 
        width: 1344, height: 768, generatedAt: new Date() 
      } : undefined,
      captions: row.captions ? JSON.parse(row.captions) : undefined,
      error: row.error_message || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  }

  getMemesCount(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM memes');
    const result = stmt.get() as { count: number };
    return result.count;
  }

  close(): void {
    this.db.close();
  }
} 