import { FastifyInstance } from 'fastify';
import { GifService } from '../services/gifService.js';
import { GifEditor, GifTextOverlay, ExportOptions } from '../services/gifEditor.js';

export async function gifRoutes(fastify: FastifyInstance) {
  const gifService = new GifService();
  const gifEditor = new GifEditor();

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

  fastify.get('/api/gifs/tenor/search/:query', async (request, reply) => {
    try {
      const params = request.params as { query: string };
      const query = request.query as { limit?: string };
      
      const limit = parseInt(query.limit || '20');
      const gifs = await gifService.searchTenorGifs(params.query, limit);

      reply.send({
        success: true,
        data: gifs,
        meta: {
          query: params.query,
          source: 'tenor',
          total: gifs.length
        }
      });
    } catch (error) {
      fastify.log.error('Error searching Tenor GIFs:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to search Tenor GIFs'
      });
    }
  });

  fastify.get('/api/gifs/tenor/trending', async (request, reply) => {
    try {
      const query = request.query as { limit?: string };
      const limit = parseInt(query.limit || '20');
      
      const gifs = await gifService.searchTenorGifs('trending', limit);

      reply.send({
        success: true,
        data: gifs,
        meta: {
          source: 'tenor',
          type: 'trending',
          total: gifs.length
        }
      });
    } catch (error) {
      fastify.log.error('Error fetching Tenor trending GIFs:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch Tenor trending GIFs'
      });
    }
  });

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
        fontWeight?: string;
        fontStyle?: string;
        textAlign?: string;
        letterSpacing?: number;
        lineHeight?: number;
        textShadow?: {
          x: number;
          y: number;
          blur: number;
          color: string;
        };
        backgroundColorOpacity?: number;
        borderRadius?: number;
        padding?: {
          top: number;
          right: number;
          bottom: number;
          left: number;
        };
        border?: {
          width: number;
          color: string;
          style: string;
        };
        gradient?: {
          type: string;
          colors: Array<{ color: string; offset: number }>;
          angle?: number;
        };
        blendMode?: string;
      };

      const overlay = await gifEditor.addTextOverlay(params.id, {
        text: body.text,
        x: body.x,
        y: body.y,
        width: body.width,
        height: body.height,
        fontSize: body.fontSize || 24,
        fontFamily: body.fontFamily || 'Impact, Charcoal, sans-serif',
        color: body.color || '#FFFFFF',
        backgroundColor: body.backgroundColor,
        strokeColor: body.strokeColor || '#000000',
        strokeWidth: body.strokeWidth || 2,
        opacity: body.opacity || 1,
        rotation: body.rotation || 0,
        animation: 'none',
        fontWeight: (body.fontWeight as any) || 'bold',
        fontStyle: (body.fontStyle as any) || 'normal',
        textAlign: (body.textAlign as any) || 'center',
        letterSpacing: body.letterSpacing || 0,
        lineHeight: body.lineHeight || 1.2,
        textShadow: body.textShadow,
        backgroundColorOpacity: body.backgroundColorOpacity || 0.7,
        borderRadius: body.borderRadius || 5,
        padding: body.padding || { top: 10, right: 20, bottom: 10, left: 20 },
        border: body.border as any,
        gradient: body.gradient as any,
        blendMode: (body.blendMode as any) || 'normal'
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
        fontWeight: string;
        fontStyle: string;
        textAlign: string;
        letterSpacing: number;
        lineHeight: number;
        textShadow: {
          x: number;
          y: number;
          blur: number;
          color: string;
        };
        backgroundColorOpacity: number;
        borderRadius: number;
        padding: {
          top: number;
          right: number;
          bottom: number;
          left: number;
        };
        border: {
          width: number;
          color: string;
          style: string;
        };
        gradient: {
          type: string;
          colors: Array<{ color: string; offset: number }>;
          angle?: number;
        };
        blendMode: string;
      }>;

      const overlay = await gifEditor.updateTextOverlay(params.id, params.overlayId, body as any);

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

  fastify.get('/api/gif-fonts', async (request, reply) => {
    try {
      const fonts = gifEditor.getAvailableFonts();

      reply.send({
        success: true,
        data: fonts
      });
    } catch (error) {
      fastify.log.error('Error fetching available fonts:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch available fonts'
      });
    }
  });

  fastify.get('/api/gif-color-palettes', async (request, reply) => {
    try {
      const palettes = gifEditor.getColorPalettes();

      reply.send({
        success: true,
        data: palettes
      });
    } catch (error) {
      fastify.log.error('Error fetching color palettes:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch color palettes'
      });
    }
  });

  fastify.get('/api/gif-text-presets', async (request, reply) => {
    try {
      const presets = gifEditor.getTextPresets();

      reply.send({
        success: true,
        data: presets
      });
    } catch (error) {
      fastify.log.error('Error fetching text presets:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch text presets'
      });
    }
  });

  fastify.post('/api/edited-gifs/:id/text/:overlayId/preset/:presetId', async (request, reply) => {
    try {
      const params = request.params as { id: string; overlayId: string; presetId: string };
      
      const overlay = await gifEditor.applyTextPreset(params.id, params.overlayId, params.presetId);

      reply.send({
        success: true,
        data: overlay,
        message: 'Text preset applied successfully'
      });
    } catch (error) {
      fastify.log.error('Error applying text preset:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to apply text preset'
      });
    }
  });

  fastify.post('/api/edited-gifs/:id/text/:overlayId/duplicate', async (request, reply) => {
    try {
      const params = request.params as { id: string; overlayId: string };
      
      const duplicatedOverlay = await gifEditor.duplicateTextOverlay(params.id, params.overlayId);

      reply.send({
        success: true,
        data: duplicatedOverlay,
        message: 'Text overlay duplicated successfully'
      });
    } catch (error) {
      fastify.log.error('Error duplicating text overlay:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to duplicate text overlay'
      });
    }
  });

  fastify.put('/api/edited-gifs/:id/text/reorder', async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const body = request.body as { overlayIds: string[] };
      
      if (!Array.isArray(body.overlayIds)) {
        return reply.status(400).send({
          success: false,
          error: 'overlayIds must be an array'
        });
      }

      const success = await gifEditor.reorderTextOverlays(params.id, body.overlayIds);
      
      if (!success) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid overlay IDs provided'
        });
      }

      reply.send({
        success: true,
        message: 'Text overlays reordered successfully'
      });
    } catch (error) {
      fastify.log.error('Error reordering text overlays:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to reorder text overlays'
      });
    }
  });

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

  fastify.get('/api/gifs/:id/frames', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const gifService = new GifService();
      const gif = await gifService.getGifById(id);
      
      if (!gif) {
        return reply.status(404).send({ error: 'GIF not found' });
      }

      const gifEditor = new GifEditor();
      const frames = await gifEditor.extractGifFrames(gif.gifUrl);
      
      reply.send({
        success: true,
        frames: frames.map(frame => ({
          index: frame.index,
          timestamp: frame.timestamp,
          duration: frame.duration,
          width: frame.width,
          height: frame.height
        })),
        totalFrames: frames.length
      });
    } catch (error) {
      fastify.log.error('Error extracting GIF frames:', error);
      reply.status(500).send({ error: 'Failed to extract GIF frames' });
    }
  });

  fastify.post('/api/gifs/:id/pause', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { frameIndex, title } = request.body as { frameIndex: number; title?: string };
      
      if (frameIndex === undefined || frameIndex < 0) {
        return reply.status(400).send({ error: 'Invalid frame index' });
      }

      const gifService = new GifService();
      const gif = await gifService.getGifById(id);
      
      if (!gif) {
        return reply.status(404).send({ error: 'GIF not found' });
      }

      const gifEditor = new GifEditor();
      
      const editableGif = await gifEditor.createEditableGif(gif, title || gif.title);
      
      const pausedMeme = await gifEditor.createPausedGifMeme(editableGif.id, frameIndex, title);
      
      reply.send({
        success: true,
        pausedMeme: {
          id: pausedMeme.id,
          originalGifId: id,
          selectedFrame: {
            index: pausedMeme.selectedFrame.index,
            timestamp: pausedMeme.selectedFrame.timestamp,
            duration: pausedMeme.selectedFrame.duration,
            width: pausedMeme.selectedFrame.width,
            height: pausedMeme.selectedFrame.height
          },
          title: pausedMeme.title,
          createdAt: pausedMeme.createdAt,
          outputFormat: pausedMeme.outputFormat,
          quality: pausedMeme.quality
        }
      });
    } catch (error) {
      fastify.log.error('Error creating paused GIF meme:', error);
      reply.status(500).send({ error: 'Failed to create paused GIF meme' });
    }
  });

  fastify.post('/api/paused-memes/:id/text', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const overlay = request.body as Omit<GifTextOverlay, 'id'>;
      
      const gifEditor = new GifEditor();
      const newOverlay = await gifEditor.addTextToPausedMeme(id, overlay);
      
      reply.send({
        success: true,
        overlay: newOverlay
      });
    } catch (error) {
      fastify.log.error('Error adding text to paused meme:', error);
      reply.status(500).send({ error: 'Failed to add text to paused meme' });
    }
  });

  fastify.put('/api/paused-memes/:id/text/:overlayId', async (request, reply) => {
    try {
      const { id, overlayId } = request.params as { id: string; overlayId: string };
      const updates = request.body as Partial<Omit<GifTextOverlay, 'id'>>;
      
      const gifEditor = new GifEditor();
      const updatedOverlay = await gifEditor.updatePausedMemeText(id, overlayId, updates);
      
      reply.send({
        success: true,
        overlay: updatedOverlay
      });
    } catch (error) {
      fastify.log.error('Error updating paused meme text:', error);
      reply.status(500).send({ error: 'Failed to update paused meme text' });
    }
  });

  fastify.delete('/api/paused-memes/:id/text/:overlayId', async (request, reply) => {
    try {
      const { id, overlayId } = request.params as { id: string; overlayId: string };
      
      const gifEditor = new GifEditor();
      const removed = await gifEditor.removePausedMemeText(id, overlayId);
      
      if (!removed) {
        return reply.status(404).send({ error: 'Text overlay not found' });
      }
      
      reply.send({
        success: true,
        message: 'Text overlay removed successfully'
      });
    } catch (error) {
      fastify.log.error('Error removing paused meme text:', error);
      reply.status(500).send({ error: 'Failed to remove paused meme text' });
    }
  });

  fastify.post('/api/paused-memes/:id/render', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const gifEditor = new GifEditor();
      const renderedMeme = await gifEditor.renderPausedMeme(id);
      
      reply.send({
        success: true,
        meme: {
          id: renderedMeme.id,
          title: renderedMeme.title,
          url: renderedMeme.url,
          outputFormat: renderedMeme.outputFormat,
          width: renderedMeme.width,
          height: renderedMeme.height,
          textOverlays: renderedMeme.textOverlays,
          createdAt: renderedMeme.createdAt
        }
      });
    } catch (error) {
      fastify.log.error('Error rendering paused meme:', error);
      reply.status(500).send({ error: 'Failed to render paused meme' });
    }
  });

  fastify.post('/api/paused-memes/:id/export', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const options = request.body as ExportOptions;
      
      const gifEditor = new GifEditor();
      const exportedBuffer = await gifEditor.exportPausedMeme(id, options);
      
      const filename = `paused-meme-${id}.${options.format}`;
      
      reply
        .header('Content-Type', `image/${options.format}`)
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(exportedBuffer);
    } catch (error) {
      fastify.log.error('Error exporting paused meme:', error);
      reply.status(500).send({ error: 'Failed to export paused meme' });
    }
  });

  fastify.get('/api/paused-memes/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const gifEditor = new GifEditor();
      const meme = gifEditor.getPausedMeme(id);
      
      if (!meme) {
        return reply.status(404).send({ error: 'Paused meme not found' });
      }
      
      reply.send({
        success: true,
        meme: {
          id: meme.id,
          title: meme.title,
          selectedFrame: {
            index: meme.selectedFrame.index,
            timestamp: meme.selectedFrame.timestamp,
            duration: meme.selectedFrame.duration,
            width: meme.selectedFrame.width,
            height: meme.selectedFrame.height
          },
          textOverlays: meme.textOverlays,
          outputFormat: meme.outputFormat,
          quality: meme.quality,
          width: meme.width,
          height: meme.height,
          createdAt: meme.createdAt,
          url: meme.url
        }
      });
    } catch (error) {
      fastify.log.error('Error getting paused meme:', error);
      reply.status(500).send({ error: 'Failed to get paused meme' });
    }
  });

  fastify.get('/api/paused-memes', async (request, reply) => {
    try {
      const gifEditor = new GifEditor();
      const memes = gifEditor.getAllPausedMemes();
      
      reply.send({
        success: true,
        memes: memes.map(meme => ({
          id: meme.id,
          title: meme.title,
          selectedFrame: {
            index: meme.selectedFrame.index,
            timestamp: meme.selectedFrame.timestamp,
            duration: meme.selectedFrame.duration,
            width: meme.selectedFrame.width,
            height: meme.selectedFrame.height
          },
          textOverlays: meme.textOverlays,
          outputFormat: meme.outputFormat,
          quality: meme.quality,
          width: meme.width,
          height: meme.height,
          createdAt: meme.createdAt,
          url: meme.url
        })),
        total: memes.length
      });
    } catch (error) {
      fastify.log.error('Error getting paused memes:', error);
      reply.status(500).send({ error: 'Failed to get paused memes' });
    }
  });

  fastify.delete('/api/paused-memes/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const gifEditor = new GifEditor();
      const deleted = gifEditor.deletePausedMeme(id);
      
      if (!deleted) {
        return reply.status(404).send({ error: 'Paused meme not found' });
      }
      
      reply.send({
        success: true,
        message: 'Paused meme deleted successfully'
      });
    } catch (error) {
      fastify.log.error('Error deleting paused meme:', error);
      reply.status(500).send({ error: 'Failed to delete paused meme' });
    }
  });

  fastify.post('/api/paused-memes/:id/duplicate', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { title } = request.body as { title?: string };
      
      const gifEditor = new GifEditor();
      const duplicated = await gifEditor.duplicatePausedMeme(id, title);
      
      reply.send({
        success: true,
        meme: {
          id: duplicated.id,
          title: duplicated.title,
          selectedFrame: {
            index: duplicated.selectedFrame.index,
            timestamp: duplicated.selectedFrame.timestamp,
            duration: duplicated.selectedFrame.duration,
            width: duplicated.selectedFrame.width,
            height: duplicated.selectedFrame.height
          },
          textOverlays: duplicated.textOverlays,
          outputFormat: duplicated.outputFormat,
          quality: duplicated.quality,
          width: duplicated.width,
          height: duplicated.height,
          createdAt: duplicated.createdAt
        }
      });
    } catch (error) {
      fastify.log.error('Error duplicating paused meme:', error);
      reply.status(500).send({ error: 'Failed to duplicate paused meme' });
    }
  });

  fastify.get('/api/export-formats', async (request, reply) => {
    try {
      const gifEditor = new GifEditor();
      const formats = gifEditor.getExportFormats();
      const defaultOptions = gifEditor.getDefaultExportOptions();
      
      reply.send({
        success: true,
        formats,
        defaultOptions
      });
    } catch (error) {
      fastify.log.error('Error getting export formats:', error);
      reply.status(500).send({ error: 'Failed to get export formats' });
    }
  });
} 