import { FastifyInstance } from 'fastify';
import { MemeTemplateService } from '../services/memeTemplates.js';

export async function templateRoutes(fastify: FastifyInstance) {
  const templateService = new MemeTemplateService();

  // Get all templates with pagination
  fastify.get('/api/templates', async (request, reply) => {
    try {
      const query = request.query as { 
        page?: string; 
        limit?: string; 
        sort?: string;
        source?: string;
      };
      
      const page = parseInt(query.page || '1');
      const limit = parseInt(query.limit || '50'); // Default 50 per page
      const sort = query.sort || 'popularity';
      const source = query.source;
      
      // Validate pagination params
      if (page < 1 || limit < 1 || limit > 200) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid pagination parameters. Page must be >= 1, limit must be 1-200'
        });
      }

      const result = await templateService.getTemplatesWithPagination({
        page,
        limit,
        sort,
        source
      });

      reply.send({
        success: true,
        data: result.templates,
        meta: {
          page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
          cache: result.cache
        }
      });
    } catch (error) {
      fastify.log.error('Error fetching templates:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch templates'
      });
    }
  });

  // Search templates with pagination
  fastify.get('/api/templates/search', async (request, reply) => {
    try {
      const query = request.query as { 
        q: string; 
        page?: string; 
        limit?: string;
        category?: string;
        source?: string;
      };
      
      if (!query.q) {
        return reply.status(400).send({
          success: false,
          error: 'Search query is required'
        });
      }

      const page = parseInt(query.page || '1');
      const limit = parseInt(query.limit || '50');
      
      const result = await templateService.searchTemplatesWithPagination({
        query: query.q,
        page,
        limit,
        category: query.category,
        source: query.source
      });

      reply.send({
        success: true,
        data: result.templates,
        meta: {
          query: query.q,
          page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage
        }
      });
    } catch (error) {
      fastify.log.error('Error searching templates:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to search templates'
      });
    }
  });

  // Get templates by category
  fastify.get('/api/templates/category/:category', async (request, reply) => {
    try {
      const params = request.params as { category: string };
      
      const templates = await templateService.getTemplatesByCategory(params.category);

      reply.send({
        success: true,
        data: templates,
        meta: {
          category: params.category,
          total: templates.length
        }
      });
    } catch (error) {
      fastify.log.error('Error fetching templates by category:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch templates by category'
      });
    }
  });

  // Get available categories
  fastify.get('/api/templates/categories', async (request, reply) => {
    try {
      const categories = await templateService.getCategories();
      reply.send({
        success: true,
        data: categories
      });
    } catch (error) {
      fastify.log.error('Error fetching categories:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch categories'
      });
    }
  });

  // Get available sources
  fastify.get('/api/templates/sources', async (request, reply) => {
    try {
      const sources = await templateService.getSources();
      reply.send({
        success: true,
        data: sources
      });
    } catch (error) {
      fastify.log.error('Error fetching sources:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch sources'
      });
    }
  });

  // Get trending templates
  fastify.get('/api/templates/trending', async (request, reply) => {
    try {
      const query = request.query as { limit?: string };
      const limit = parseInt(query.limit || '20');
      
      const templates = await templateService.getTrendingTemplates(limit);
      
      reply.send({
        success: true,
        data: templates,
        meta: {
          count: templates.length,
          type: 'trending'
        }
      });
    } catch (error) {
      fastify.log.error('Error fetching trending templates:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch trending templates'
      });
    }
  });

  // Get popular templates (legacy compatibility)
  fastify.get('/api/templates/popular', async (request, reply) => {
    try {
      const query = request.query as { limit?: string };
      const limit = parseInt(query.limit || '10');
      
      const templates = await templateService.getPopularTemplates(limit);
      
      reply.send({
        success: true,
        data: templates,
        meta: {
          count: templates.length
        }
      });
    } catch (error) {
      fastify.log.error('Error fetching popular templates:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch popular templates'
      });
    }
  });

  // Get single template by ID
  fastify.get('/api/templates/:id', async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const template = await templateService.getTemplateById(params.id);
      
      if (!template) {
        return reply.status(404).send({
          success: false,
          error: 'Template not found'
        });
      }

      reply.send({
        success: true,
        data: template
      });
    } catch (error) {
      fastify.log.error('Error fetching template:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch template'
      });
    }
  });

  // Get cache status and statistics
  fastify.get('/api/templates/cache', async (request, reply) => {
    try {
      const stats = await templateService.getCacheStats();
      reply.send({
        success: true,
        data: stats
      });
    } catch (error) {
      fastify.log.error('Error fetching cache stats:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch cache stats'
      });
    }
  });

  // Force refresh cache (admin endpoint)
  fastify.post('/api/templates/refresh', async (request, reply) => {
    try {
      await templateService.forceRefresh();
      const stats = await templateService.getCacheStats();
      
      reply.send({
        success: true,
        message: 'Templates refreshed successfully',
        data: stats
      });
    } catch (error) {
      fastify.log.error('Error refreshing templates:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to refresh templates'
      });
    }
  });
} 