import { FastifyPluginAsync } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { 
  MemeCreationState, 
  CreateMemeResponse,
  GetMemeStatusResponse,
  MemeCreationStatus,
  MemeCreationStep
} from '@ai-meme-studio/shared-types';
import { MemeOrchestrator } from '../services/memeOrchestrator.js';
import { OptimizedMemeOrchestrator } from '../services/optimizedMemeOrchestrator.js';
import { wsManager } from '../websocket/handler.js';
import { DatabaseService } from '../services/database.js';
import { FileStorageService } from '../services/fileStorage.js';
import { MemeTemplateService } from '../services/memeTemplates.js';
import { ImageCompositor } from '../services/imageCompositor.js';

export const memeRoutes: FastifyPluginAsync = async function (fastify) {
  const orchestrator = new MemeOrchestrator();
  const optimizedOrchestrator = new OptimizedMemeOrchestrator();
  const database = new DatabaseService();
  const fileStorage = new FileStorageService();
  const templateService = new MemeTemplateService();
  const compositor = new ImageCompositor();

  // Create meme from template (new primary method)
  fastify.post<{
    Body: { templateId: string; topText?: string; bottomText?: string; customText?: string };
    Reply: CreateMemeResponse;
  }>('/create-from-template', async (request, reply) => {
    const { templateId, topText, bottomText, customText } = request.body;
    
    if (!templateId) {
      reply.status(400);
      return {
        success: false,
        error: 'Template ID is required',
        timestamp: new Date()
      };
    }

    const template = await templateService.getTemplateById(templateId);
    if (!template) {
      reply.status(404);
      return {
        success: false,
        error: 'Template not found',
        timestamp: new Date()
      };
    }

    if (!topText && !bottomText && !customText) {
      reply.status(400);
      return {
        success: false,
        error: 'At least one text field (topText, bottomText, or customText) is required',
        timestamp: new Date()
      };
    }
    
    const memeId = uuidv4();
    
    try {
      const finalMeme = await compositor.createMemeFromTemplate(
        template,
        topText || customText,
        bottomText
      );

      // Save to file storage
      const finalMemePath = await fileStorage.saveFinalMeme(finalMeme);
      finalMeme.url = finalMemePath;

      const memeState: MemeCreationState = {
        id: memeId,
        templateId,
        topText,
        bottomText,
        customText,
        status: MemeCreationStatus.COMPLETED,
        currentStep: MemeCreationStep.SET_DESIGN,
        template,
        finalMeme,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      database.saveMeme(memeState);
      
      return {
        success: true,
        data: memeState,
        timestamp: new Date()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      fastify.log.error(`Error creating meme from template ${templateId}:`, error);
      reply.status(500);
      return {
        success: false,
        error: `Failed to create meme: ${errorMessage}`,
        timestamp: new Date()
      };
    }
  });

  // Optimized AI meme generation (single cohesive image)
  fastify.post<{
    Body: { concept: string; description: string; userId?: string };
    Reply: CreateMemeResponse;
  }>('/create-optimized', async (request) => {
    const { concept, description } = request.body;
    
    if (!concept || !description) {
      return {
        success: false,
        error: 'Both concept and description are required',
        timestamp: new Date()
      };
    }
    
    const memeId = uuidv4();
    const now = new Date();
    
    const memeState: MemeCreationState = {
      id: memeId,
      status: MemeCreationStatus.PENDING,
      concept,
      customText: description,
      currentStep: MemeCreationStep.SET_DESIGN,
      createdAt: now,
      updatedAt: now
    };
    
    database.saveMeme(memeState);
    
    optimizedOrchestrator.createOptimizedMeme(memeState, (event) => {
      wsManager.broadcastToMeme(memeId, event);
    }).then(completedState => {
      database.saveMeme(completedState);
      fastify.log.info(`Optimized meme ${memeId} completed successfully`);
    }).catch(error => {
      fastify.log.error(`Error processing optimized meme ${memeId}:`, error);
      const failedState = database.getMeme(memeId);
      if (failedState) {
        failedState.status = MemeCreationStatus.FAILED;
        failedState.error = error.message;
        failedState.updatedAt = new Date();
        database.saveMeme(failedState);
      }
    });
    
    return {
      success: true,
      data: memeState,
      timestamp: new Date()
    };
  });

  // Add text to generated meme
  fastify.post<{
    Body: { 
      memeId: string; 
      texts: Array<{
        content: string;
        x: number;
        y: number;
        fontSize: number;
        color: string;
        fontWeight?: string;
      }>;
    };
  }>('/add-text', async (request, reply) => {
    const { memeId, texts } = request.body;
    
    if (!memeId || !texts || texts.length === 0) {
      reply.status(400);
      return {
        success: false,
        error: 'Meme ID and texts array are required',
        timestamp: new Date()
      };
    }
    
    try {
      const updatedMeme = await optimizedOrchestrator.addTextToMeme(memeId, texts);
      
      return {
        success: true,
        data: updatedMeme,
        timestamp: new Date()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      fastify.log.error(`Error adding text to meme ${memeId}:`, error);
      reply.status(500);
      return {
        success: false,
        error: errorMessage,
        timestamp: new Date()
      };
    }
  });

  // Legacy create method for AI-generated memes
  fastify.post<{
    Body: { concept: string; userId?: string };
    Reply: CreateMemeResponse;
  }>('/create', async (request) => {
    const { concept } = request.body;
    
    const memeId = uuidv4();
    const now = new Date();
    
    const memeState: MemeCreationState = {
      id: memeId,
      status: MemeCreationStatus.PENDING,
      concept,
      currentStep: MemeCreationStep.SET_DESIGN,
      createdAt: now,
      updatedAt: now
    };
    
    database.saveMeme(memeState);
    
    orchestrator.createMeme(memeState, (event) => {
      wsManager.broadcastToMeme(memeId, event);
    }).then(completedState => {
      database.saveMeme(completedState);
      fastify.log.info(`Meme ${memeId} completed successfully`);
    }).catch(error => {
      fastify.log.error(`Error processing meme ${memeId}:`, error);
      const failedState = database.getMeme(memeId);
      if (failedState) {
        failedState.status = MemeCreationStatus.FAILED;
        failedState.error = error.message;
        failedState.updatedAt = new Date();
        database.saveMeme(failedState);
      }
    });
    
    return {
      success: true,
      data: memeState,
      timestamp: now
    };
  });

  fastify.get<{
    Params: { id: string };
    Reply: GetMemeStatusResponse;
  }>('/status/:id', async (request, reply) => {
    const { id } = request.params;
    const memeState = database.getMeme(id);
    
    if (!memeState) {
      reply.status(404);
      return {
        success: false,
        error: 'Meme not found',
        timestamp: new Date()
      };
    }
    
    return {
      success: true,
      data: memeState,
      timestamp: new Date()
    };
  });

  fastify.get('/all', async () => {
    const allMemes = database.getAllMemes();
    return {
      success: true,
      data: allMemes,
      timestamp: new Date()
    };
  });

  fastify.get('/stats', async () => {
    const memesCount = database.getMemesCount();
    const storageStats = await fileStorage.getStorageStats();
    
    return {
      success: true,
      data: {
        totalMemes: memesCount,
        storage: storageStats
      },
      timestamp: new Date()
    };
  });

  fastify.get('/uploads/*', async (request, reply) => {
    const imagePath = (request.params as any)['*'];
    const imageBuffer = await fileStorage.getImageBuffer(`/uploads/${imagePath}`);
    
    if (!imageBuffer) {
      reply.status(404).send({ error: 'Image not found' });
      return;
    }
    
    reply.type('image/png').send(imageBuffer);
  });

  fastify.addHook('onReady', async () => {
    wsManager.initialize(fastify);
  });
}; 