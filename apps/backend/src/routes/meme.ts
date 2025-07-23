import { FastifyPluginAsync } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { 
  MemeCreationState, 
  CreateMemeResponse,
  GetMemeStatusResponse,
  MemeCreationStatus,
  MemeCreationStep
} from '@ai-meme-studio/shared-types';

export const memeRoutes: FastifyPluginAsync = async function (fastify) {
  const memeStore = new Map<string, MemeCreationState>();

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
    
    memeStore.set(memeId, memeState);
    
    processMemeConcept(memeId, concept).catch(error => {
      fastify.log.error(`Error processing meme ${memeId}:`, error);
      const failedState = memeStore.get(memeId);
      if (failedState) {
        failedState.status = MemeCreationStatus.FAILED;
        failedState.error = error.message;
        failedState.updatedAt = new Date();
        memeStore.set(memeId, failedState);
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
    const memeState = memeStore.get(id);
    
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
    const allMemes = Array.from(memeStore.values());
    return {
      success: true,
      data: allMemes,
      timestamp: new Date()
    };
  });

  async function processMemeConcept(memeId: string, concept: string): Promise<void> {
    fastify.log.info(`Starting meme creation for ID: ${memeId}, concept: "${concept}"`);
    
    const memeState = memeStore.get(memeId);
    if (!memeState) return;

    const steps = [
      { status: MemeCreationStatus.GENERATING_BACKGROUND, step: MemeCreationStep.SET_DESIGN },
      { status: MemeCreationStatus.GENERATING_CHARACTER, step: MemeCreationStep.CASTING },
      { status: MemeCreationStatus.COMPOSITING, step: MemeCreationStep.FINAL_COMPOSITION },
      { status: MemeCreationStatus.GENERATING_CAPTIONS, step: MemeCreationStep.GAG_WRITING },
      { status: MemeCreationStatus.COMPLETED, step: MemeCreationStep.GAG_WRITING }
    ];

    for (const { status, step } of steps) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      memeState.status = status;
      memeState.currentStep = step;
      memeState.updatedAt = new Date();
      memeStore.set(memeId, memeState);
      
      fastify.log.info(`Meme ${memeId} updated: ${status}`);
    }
    
    fastify.log.info(`Meme creation completed for ID: ${memeId}`);
  }
}; 