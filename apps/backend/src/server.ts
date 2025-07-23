import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

import { memeRoutes } from './routes/meme.js';
import { websocketHandler } from './websocket/handler.js';
import { config } from './config/index.js';

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

fastify.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, websocketHandler);
});

fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
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