import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '../.env' });
dotenv.config({ path: '../../.env' });

interface Config {
  PORT: number;
  LOG_LEVEL: string;
  FRONTEND_URL: string;
  OPENAI_API_KEY: string;
  STABILITY_AI_API_KEY: string;
  NODE_ENV: string;
}

export const config: Config = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  STABILITY_AI_API_KEY: process.env.STABILITY_AI_API_KEY || '',
  NODE_ENV: process.env.NODE_ENV || 'development'
}; 