import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config();

console.log('🔍 Environment check:');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Loaded' : '❌ Missing');
console.log('STABILITY_AI_API_KEY:', process.env.STABILITY_AI_API_KEY ? '✅ Loaded' : '❌ Missing');

import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

import { memeRoutes } from './routes/meme.js';
import { templateRoutes } from './routes/templates.js';
import { gifRoutes } from './routes/gifs.js';
import { websocketHandler } from './websocket/handler.js';
import { config } from './config/index.js';
import { MemeOrchestrator } from './services/memeOrchestrator.js';
import { MemeTemplateService } from './services/memeTemplates.js';
import { MemeCreationState, MemeCreationStep } from '@ai-meme-studio/shared-types';

const fastify = Fastify({
  logger: {
    level: config.LOG_LEVEL
  }
}).withTypeProvider<TypeBoxTypeProvider>();

await fastify.register(cors, {
  origin: config.FRONTEND_URL,
  credentials: true
});

await fastify.register(websocket);

await fastify.register(swagger, {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'AI Meme Studio API',
      description: 'The Meme Producer - Backend API for AI Meme Studio',
      version: '1.0.0'
    },
    servers: [
      {
        url: `http://localhost:${config.PORT}`,
        description: 'Development server'
      }
    ]
  }
});

await fastify.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false
  }
});

  await fastify.register(memeRoutes, { prefix: '/api/memes' });
  await templateRoutes(fastify);
  await gifRoutes(fastify);

fastify.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, websocketHandler);
});

fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

const orchestrator = new MemeOrchestrator();
const templateService = new MemeTemplateService();

// MCP Protocol Endpoints
fastify.get('/mcp/describe', async (request, reply) => {
  return {
    name: 'AI Meme Studio',
    description: 'Generate AI memes and list meme templates.',
    version: '1.0.0',
    methods: [
      {
        name: 'generateMeme',
        description: 'Generate an AI meme from a concept and description.',
        parameters: {
          type: 'object',
          properties: {
            concept: { type: 'string', description: 'The meme concept or idea.' },
            description: { type: 'string', description: 'A description or custom text for the meme.' }
          },
          required: ['concept', 'description']
        },
        returns: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: { type: 'string' },
            url: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          }
        }
      },
      {
        name: 'listTemplates',
        description: 'List available meme templates.',
        parameters: {
          type: 'object',
          properties: {
            page: { type: 'number', description: 'Page number (optional)' },
            limit: { type: 'number', description: 'Templates per page (optional)' },
            sort: { type: 'string', description: 'Sort order (optional)' },
            source: { type: 'string', description: 'Template source (optional)' }
          }
        },
        returns: {
          type: 'object',
          properties: {
            templates: { type: 'array', items: { type: 'object' } },
            meta: { type: 'object' }
          }
        }
      },
      {
        name: 'createMemeFromTemplate',
        description: 'Create a meme from a template with custom text and optional text placement.',
        parameters: {
          type: 'object',
          properties: {
            templateId: { type: 'string', description: 'ID of the meme template' },
            topText: { type: 'string', description: 'Top text (optional)' },
            bottomText: { type: 'string', description: 'Bottom text (optional)' },
            customText: { type: 'string', description: 'Custom text (optional)' },
            topTextPosition: { type: 'object', description: 'Override for top text position (optional)' },
            bottomTextPosition: { type: 'object', description: 'Override for bottom text position (optional)' }
          },
          required: ['templateId']
        },
        returns: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            url: { type: 'string' },
            createdAt: { type: 'string' },
            templateId: { type: 'string' },
            topText: { type: 'string' },
            bottomText: { type: 'string' },
            customText: { type: 'string' },
            topTextPosition: { type: 'object' },
            bottomTextPosition: { type: 'object' }
          }
        }
      }
    ]
  };
});

fastify.post('/mcp/invoke', async (request, reply) => {
  const { method, arguments: args } = request.body as { method: string; arguments: any };
  if (method === 'generateMeme') {
    const { concept, description } = args || {};
    if (!concept || !description) {
      reply.status(400);
      return { error: 'Missing concept or description' };
    }
    // Mimic /api/memes/create-optimized logic
    const memeId = `mcp-${Date.now()}`;
    const now = new Date();
    const memeState = {
      id: memeId,
      status: 'PENDING',
      concept,
      customText: description,
      currentStep: MemeCreationStep.SET_DESIGN,
      createdAt: now,
      updatedAt: now
    };

    const completed = await orchestrator.createMeme(memeState as unknown as MemeCreationState);
    return {
      id: completed.id,
      status: completed.status,
      url: completed.finalMeme?.url || null,
      createdAt: completed.createdAt,
      updatedAt: completed.updatedAt
    };
  } else if (method === 'listTemplates') {
    const { page = 1, limit = 50, sort = 'popularity', source } = args || {};
    const result = await templateService.getTemplatesWithPagination({ page, limit, sort, source });
    return {
      templates: result.templates,
      meta: {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
        cache: result.cache
      }
    };
  } else if (method === 'createMemeFromTemplate') {
    const { templateId, topText, bottomText, customText, topTextPosition, bottomTextPosition } = args || {};
    if (!templateId) {
      reply.status(400);
      return { error: 'Missing templateId' };
    }
    const template = await templateService.getTemplateById(templateId);
    if (!template) {
      reply.status(404);
      return { error: 'Template not found' };
    }
    if (!topText && !bottomText && !customText) {
      reply.status(400);
      return { error: 'At least one text field (topText, bottomText, or customText) is required' };
    }
    // Override text positions if provided
    const templateOverride = { ...template };
    if (topTextPosition) templateOverride.topTextPosition = topTextPosition;
    if (bottomTextPosition) templateOverride.bottomTextPosition = bottomTextPosition;
    const memeId = `mcp-template-${Date.now()}`;
    try {
      const { ImageCompositor } = await import('./services/imageCompositor.js');
      const compositor = new ImageCompositor();
      const finalMeme = await compositor.createMemeFromTemplate(
        templateOverride,
        topText || customText,
        bottomText
      );
      let finalMemePath = finalMeme.url;
      if (!finalMemePath) {
        const { FileStorageService } = await import('./services/fileStorage.js');
        const fileStorage = new FileStorageService();
        finalMemePath = await fileStorage.saveFinalMeme(finalMeme);
        finalMeme.url = finalMemePath;
      }
      return {
        id: memeId,
        url: finalMeme.url,
        createdAt: new Date(),
        templateId,
        topText,
        bottomText,
        customText,
        topTextPosition: templateOverride.topTextPosition,
        bottomTextPosition: templateOverride.bottomTextPosition
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      reply.status(500);
      return { error: `Failed to create meme: ${errorMessage}` };
    }
  } else {
    reply.status(400);
    return { error: 'Unknown method' };
  }
});

const start = async () => {
  try {
    await fastify.listen({ 
      port: config.PORT, 
      host: '0.0.0.0' 
    });
    
    fastify.log.info(`🚀 AI Meme Studio Backend (The Meme Producer) is running!`);
    fastify.log.info(`📖 API Documentation: http://localhost:${config.PORT}/docs`);
    fastify.log.info(`🔌 WebSocket: ws://localhost:${config.PORT}/ws`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start(); 