import { FastifyInstance } from 'fastify';
import { GifService } from '../services/gifService.js';
import { GifEditor } from '../services/gifEditor.js';

export async function gifRoutes(fastify: FastifyInstance) {
  const gifService = new GifService();
  const gifEditor = new GifEditor();

  // Get all GIFs with pagination
  fastify.get('/api/gifs', async (request, reply) => {
    try {
      const query = request.query as { 
        page?: string; 
        limit?: string; 
        sort?: string;
        category?: string;
      };
      
      const page = parseInt(query.page || '1');
      const limit = parseInt(query.limit || '24');
      const sort = query.sort || 'popularity';
      const category = query.category;
      
      if (page < 1 || limit < 1 || limit > 100) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid pagination parameters. Page must be >= 1, limit must be 1-100'
        });
      }

      const result = await gifService.getGifsWithPagination({
        page,
        limit,
        sort,
        category
      });

      reply.send({
        success: true,
        data: result.gifs,
        meta: {
          page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
          category: category || 'all'
        }
      });
    } catch (error) {
      fastify.log.error('Error fetching GIFs:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch GIFs'
      });
    }
  });

  // Get GIF by ID
  fastify.get('/api/gifs/:id', async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const gif = await gifService.getGifById(params.id);

      if (!gif) {
        return reply.status(404).send({
          success: false,
          error: 'GIF not found'
        });
      }

      reply.send({
        success: true,
        data: gif
      });
    } catch (error) {
      fastify.log.error('Error fetching GIF by ID:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch GIF'
      });
    }
  });

  // Get GIFs by category
  fastify.get('/api/gifs/category/:category', async (request, reply) => {
    try {
      const params = request.params as { category: string };
      const gifs = await gifService.getGifsByCategory(params.category);

      reply.send({
        success: true,
        data: gifs,
        meta: {
          category: params.category,
          total: gifs.length
        }
      });
    } catch (error) {
      fastify.log.error('Error fetching GIFs by category:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch GIFs by category'
      });
    }
  });

  // Search GIFs
  fastify.get('/api/gifs/search/:query', async (request, reply) => {
    try {
      const params = request.params as { query: string };
      const query = request.query as { limit?: string };
      
      const limit = parseInt(query.limit || '50');
      const gifs = await gifService.searchGifs(params.query);
      
      const limitedGifs = gifs.slice(0, limit);

      reply.send({
        success: true,
        data: limitedGifs,
        meta: {
          query: params.query,
          total: gifs.length,
          returned: limitedGifs.length
        }
      });
    } catch (error) {
      fastify.log.error('Error searching GIFs:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to search GIFs'
      });
    }
  });

  // Get trending GIFs
  fastify.get('/api/gifs/trending', async (request, reply) => {
    try {
      const query = request.query as { limit?: string };
      const limit = parseInt(query.limit || '20');
      
      const gifs = await gifService.getTrendingGifs(limit);

      reply.send({
        success: true,
        data: gifs,
        meta: {
          type: 'trending',
          total: gifs.length
        }
      });
    } catch (error) {
      fastify.log.error('Error fetching trending GIFs:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch trending GIFs'
      });
    }
  });

  // Get popular GIFs
  fastify.get('/api/gifs/popular', async (request, reply) => {
    try {
      const query = request.query as { limit?: string };
      const limit = parseInt(query.limit || '20');
      
      const gifs = await gifService.getPopularGifs(limit);

      reply.send({
        success: true,
        data: gifs,
        meta: {
          type: 'popular',
          total: gifs.length
        }
      });
    } catch (error) {
      fastify.log.error('Error fetching popular GIFs:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch popular GIFs'
      });
    }
  });

  // Get available GIF categories
  fastify.get('/api/gifs/categories', async (request, reply) => {
    try {
      const categories = await gifService.getCategories();

      reply.send({
        success: true,
        data: categories
      });
    } catch (error) {
      fastify.log.error('Error fetching GIF categories:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch categories'
      });
    }
  });

  // Refresh GIF cache
  fastify.post('/api/gifs/refresh', async (request, reply) => {
    try {
      await gifService.refreshGifs();
      const cacheInfo = gifService.getCacheInfo();

      reply.send({
        success: true,
        message: 'GIF cache refreshed successfully',
        data: cacheInfo
      });
    } catch (error) {
      fastify.log.error('Error refreshing GIF cache:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to refresh GIF cache'
      });
    }
  });

  // Create editable GIF
  fastify.post('/api/gifs/:id/edit', async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const body = request.body as { title?: string };
      
      const originalGif = await gifService.getGifById(params.id);
      if (!originalGif) {
        return reply.status(404).send({
          success: false,
          error: 'Original GIF not found'
        });
      }

      const editedGif = await gifEditor.createEditableGif(originalGif, body.title);

      reply.send({
        success: true,
        data: editedGif,
        message: 'Editable GIF created successfully'
      });
    } catch (error) {
      fastify.log.error('Error creating editable GIF:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to create editable GIF'
      });
    }
  });

  // Get edited GIF
  fastify.get('/api/edited-gifs/:id', async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const editedGif = gifEditor.getEditedGif(params.id);

      if (!editedGif) {
        return reply.status(404).send({
          success: false,
          error: 'Edited GIF not found'
        });
      }

      reply.send({
        success: true,
        data: editedGif
      });
    } catch (error) {
      fastify.log.error('Error fetching edited GIF:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch edited GIF'
      });
    }
  });

  // Get all edited GIFs
  fastify.get('/api/edited-gifs', async (request, reply) => {
    try {
      const editedGifs = gifEditor.getAllEditedGifs();

      reply.send({
        success: true,
        data: editedGifs,
        meta: {
          total: editedGifs.length
        }
      });
    } catch (error) {
      fastify.log.error('Error fetching edited GIFs:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch edited GIFs'
      });
    }
  });

  // Add text overlay to edited GIF
  fastify.post('/api/edited-gifs/:id/text', async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const body = request.body as {
        text: string;
        x: number;
        y: number;
        width: number;
        height: number;
        fontSize?: number;
        fontFamily?: string;
        color?: string;
        backgroundColor?: string;
        strokeColor?: string;
        strokeWidth?: number;
        opacity?: number;
        rotation?: number;
      };

      const overlay = await gifEditor.addTextOverlay(params.id, {
        text: body.text,
        x: body.x,
        y: body.y,
        width: body.width,
        height: body.height,
        fontSize: body.fontSize || 24,
        fontFamily: body.fontFamily || 'Arial, sans-serif',
        color: body.color || '#FFFFFF',
        backgroundColor: body.backgroundColor,
        strokeColor: body.strokeColor || '#000000',
        strokeWidth: body.strokeWidth || 2,
        opacity: body.opacity || 1,
        rotation: body.rotation || 0,
        animation: 'none'
      });

      reply.send({
        success: true,
        data: overlay,
        message: 'Text overlay added successfully'
      });
    } catch (error) {
      fastify.log.error('Error adding text overlay:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to add text overlay'
      });
    }
  });

  // Update text overlay
  fastify.put('/api/edited-gifs/:id/text/:overlayId', async (request, reply) => {
    try {
      const params = request.params as { id: string; overlayId: string };
      const body = request.body as Partial<{
        text: string;
        x: number;
        y: number;
        width: number;
        height: number;
        fontSize: number;
        fontFamily: string;
        color: string;
        backgroundColor: string;
        strokeColor: string;
        strokeWidth: number;
        opacity: number;
        rotation: number;
      }>;

      const overlay = await gifEditor.updateTextOverlay(params.id, params.overlayId, body);

      reply.send({
        success: true,
        data: overlay,
        message: 'Text overlay updated successfully'
      });
    } catch (error) {
      fastify.log.error('Error updating text overlay:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to update text overlay'
      });
    }
  });

  // Remove text overlay
  fastify.delete('/api/edited-gifs/:id/text/:overlayId', async (request, reply) => {
    try {
      const params = request.params as { id: string; overlayId: string };
      
      const success = await gifEditor.removeTextOverlay(params.id, params.overlayId);
      
      if (!success) {
        return reply.status(404).send({
          success: false,
          error: 'Text overlay not found'
        });
      }

      reply.send({
        success: true,
        message: 'Text overlay removed successfully'
      });
    } catch (error) {
      fastify.log.error('Error removing text overlay:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to remove text overlay'
      });
    }
  });

  // Add effect to edited GIF
  fastify.post('/api/edited-gifs/:id/effects', async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const body = request.body as {
        type: 'filter' | 'overlay' | 'animation';
        name: string;
        intensity: number;
        params?: Record<string, any>;
      };

      const effect = await gifEditor.addEffect(params.id, {
        type: body.type,
        name: body.name,
        intensity: body.intensity,
        params: body.params || {}
      });

      reply.send({
        success: true,
        data: effect,
        message: 'Effect added successfully'
      });
    } catch (error) {
      fastify.log.error('Error adding effect:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to add effect'
      });
    }
  });

  // Remove effect
  fastify.delete('/api/edited-gifs/:id/effects/:effectId', async (request, reply) => {
    try {
      const params = request.params as { id: string; effectId: string };
      
      const success = await gifEditor.removeEffect(params.id, params.effectId);
      
      if (!success) {
        return reply.status(404).send({
          success: false,
          error: 'Effect not found'
        });
      }

      reply.send({
        success: true,
        message: 'Effect removed successfully'
      });
    } catch (error) {
      fastify.log.error('Error removing effect:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to remove effect'
      });
    }
  });

  // Update GIF settings
  fastify.put('/api/edited-gifs/:id/settings', async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const body = request.body as Partial<{
        outputFormat: 'gif' | 'mp4' | 'webm';
        quality: number;
        width: number;
        height: number;
        fps: number;
        title: string;
      }>;

      const editedGif = await gifEditor.updateGifSettings(params.id, body);

      reply.send({
        success: true,
        data: editedGif,
        message: 'GIF settings updated successfully'
      });
    } catch (error) {
      fastify.log.error('Error updating GIF settings:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to update GIF settings'
      });
    }
  });

  // Render edited GIF
  fastify.post('/api/edited-gifs/:id/render', async (request, reply) => {
    try {
      const params = request.params as { id: string };
      
      const editedGif = await gifEditor.renderGif(params.id);

      reply.send({
        success: true,
        data: editedGif,
        message: 'GIF rendered successfully'
      });
    } catch (error) {
      fastify.log.error('Error rendering GIF:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to render GIF'
      });
    }
  });

  // Export edited GIF
  fastify.get('/api/edited-gifs/:id/export', async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const query = request.query as { format?: 'gif' | 'mp4' | 'webm' };
      
      const format = query.format || 'gif';
      const gifBuffer = await gifEditor.exportGif(params.id, format);
      
      const editedGif = gifEditor.getEditedGif(params.id);
      const filename = editedGif ? 
        `${editedGif.title.replace(/[^a-zA-Z0-9]/g, '-')}.${format}` : 
        `edited-gif.${format}`;

      reply
        .type(`image/${format}`)
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(gifBuffer);
        
    } catch (error) {
      fastify.log.error('Error exporting GIF:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to export GIF'
      });
    }
  });

  // Duplicate edited GIF
  fastify.post('/api/edited-gifs/:id/duplicate', async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const body = request.body as { title?: string };
      
      const duplicateGif = await gifEditor.duplicateEditedGif(params.id, body.title);

      reply.send({
        success: true,
        data: duplicateGif,
        message: 'GIF duplicated successfully'
      });
    } catch (error) {
      fastify.log.error('Error duplicating GIF:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to duplicate GIF'
      });
    }
  });

  // Delete edited GIF
  fastify.delete('/api/edited-gifs/:id', async (request, reply) => {
    try {
      const params = request.params as { id: string };
      
      const success = gifEditor.deleteEditedGif(params.id);
      
      if (!success) {
        return reply.status(404).send({
          success: false,
          error: 'Edited GIF not found'
        });
      }

      reply.send({
        success: true,
        message: 'Edited GIF deleted successfully'
      });
    } catch (error) {
      fastify.log.error('Error deleting edited GIF:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to delete edited GIF'
      });
    }
  });

  // Get available effects
  fastify.get('/api/gif-effects', async (request, reply) => {
    try {
      const effects = gifEditor.getAvailableEffects();

      reply.send({
        success: true,
        data: effects
      });
    } catch (error) {
      fastify.log.error('Error fetching available effects:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch available effects'
      });
    }
  });

  // Get default text overlay settings
  fastify.get('/api/gif-text-defaults/:width/:height', async (request, reply) => {
    try {
      const params = request.params as { width: string; height: string };
      const width = parseInt(params.width);
      const height = parseInt(params.height);
      
      if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid width or height parameters'
        });
      }

      const defaults = gifEditor.getDefaultTextOverlay(width, height);

      reply.send({
        success: true,
        data: defaults
      });
    } catch (error) {
      fastify.log.error('Error getting default text overlay:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to get default text overlay'
      });
    }
  });

  // Get GIF cache info
  fastify.get('/api/gifs/cache/info', async (request, reply) => {
    try {
      const cacheInfo = gifService.getCacheInfo();

      reply.send({
        success: true,
        data: cacheInfo
      });
    } catch (error) {
      fastify.log.error('Error fetching cache info:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch cache info'
      });
    }
  });
} 