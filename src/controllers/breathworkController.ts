import { Request, Response } from 'express';
import { ZodError } from 'zod';
import {
  breathworkFiltersSchema,
  breathworkIdParamSchema,
  updateBreathworkProgressSchema,
  completeBreathworkSessionSchema,
  createBreathworkSchema,
  updateBreathworkSchema,
} from '../validation/breathworkSchemas';
import * as breathworkService from '../services/breathworkService';
import { logger } from '../utils/logger';

// ==================== USER ENDPOINTS ====================

/**
 * GET /api/breathworks
 * List breathwork exercises with filters and pagination
 */
export async function getBreathworks(req: Request, res: Response) {
  try {
    const filters = breathworkFiltersSchema.parse(req.query);
    const result = await breathworkService.getBreathworks(filters);
    return res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to list breathworks');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/breathworks/featured
 * Get featured breathwork exercises
 */
export async function getFeaturedBreathworks(req: Request, res: Response) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const breathworks = await breathworkService.getFeaturedBreathworks(limit);
    return res.json({ breathworks });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get featured breathworks');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/breathworks/categories
 * Get breathwork categories with counts
 */
export async function getCategories(req: Request, res: Response) {
  try {
    const categories = await breathworkService.getBreathworkCategories();
    return res.json({ categories });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get categories');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/breathworks/search
 * Search breathwork exercises
 */
export async function searchBreathworks(req: Request, res: Response) {
  try {
    const { q, limit } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query (q) is required' });
    }
    const breathworks = await breathworkService.searchBreathworks(q, limit ? parseInt(limit as string, 10) : 20);
    return res.json({ breathworks });
  } catch (error) {
    logger.error({ err: error }, 'Failed to search breathworks');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/breathworks/category/:category
 * Get breathwork exercises by category
 */
export async function getByCategory(req: Request, res: Response) {
  try {
    const category = req.params.category;
    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const breathworks = await breathworkService.getBreathworksByCategory(category, limit);
    return res.json({ breathworks });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get breathworks by category');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/breathworks/history
 * Get user's breathwork history
 */
export async function getHistory(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const result = await breathworkService.getHistory(req.user.userId, page, limit);
    return res.json(result);
  } catch (error) {
    logger.error({ err: error }, 'Failed to get history');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/breathworks/continue
 * Get breathwork exercises in progress
 */
export async function getContinueBreathworks(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const breathworks = await breathworkService.getContinueBreathworks(req.user.userId, limit);
    return res.json({ breathworks });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get continue breathworks');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/breathworks/stats
 * Get user's breathwork statistics
 */
export async function getUserStats(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const stats = await breathworkService.getUserStats(req.user.userId);
    return res.json({ stats });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get user stats');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/breathworks/:id
 * Get breathwork detail
 */
export async function getBreathwork(req: Request, res: Response) {
  try {
    const { id } = breathworkIdParamSchema.parse(req.params);
    const breathwork = await breathworkService.getBreathwork(id, req.user?.userId);

    if (!breathwork) {
      return res.status(404).json({ error: 'Breathwork not found' });
    }

    return res.json({ breathwork });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid breathwork id', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to get breathwork detail');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/breathworks/:id/start
 * Start a breathwork session
 */
export async function startSession(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = breathworkIdParamSchema.parse(req.params);
    const result = await breathworkService.startSession(req.user.userId, id);
    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid breathwork id', details: error.flatten() });
    }
    if (error instanceof Error && error.message === 'Breathwork not found') {
      return res.status(404).json({ error: 'Breathwork not found' });
    }
    logger.error({ err: error }, 'Failed to start breathwork session');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PUT /api/breathworks/:id/progress
 * Update breathwork progress
 */
export async function updateProgress(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = breathworkIdParamSchema.parse(req.params);
    const input = updateBreathworkProgressSchema.parse(req.body);
    const progress = await breathworkService.updateProgress(req.user.userId, id, input);
    return res.json({ progress });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to update breathwork progress');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/breathworks/:id/complete
 * Complete a breathwork session
 */
export async function completeSession(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = breathworkIdParamSchema.parse(req.params);
    const input = completeBreathworkSessionSchema.parse(req.body);
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const result = await breathworkService.completeSession(req.user.userId, id, sessionId, input);
    return res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    if (error instanceof Error && error.message === 'Breathwork not found') {
      return res.status(404).json({ error: 'Breathwork not found' });
    }
    logger.error({ err: error }, 'Failed to complete breathwork session');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================== ADMIN ENDPOINTS ====================

/**
 * GET /api/admin/breathworks
 * Get all breathworks (admin)
 */
export async function getAdminBreathworks(req: Request, res: Response) {
  try {
    const filters = breathworkFiltersSchema.parse(req.query);
    const result = await breathworkService.getAdminBreathworks(filters);
    return res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to list admin breathworks');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/admin/breathworks/stats
 * Get breathwork statistics
 */
export async function getBreathworkStats(req: Request, res: Response) {
  try {
    const stats = await breathworkService.getBreathworkStats();
    return res.json({ stats });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get breathwork stats');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/admin/breathworks
 * Create a new breathwork
 */
export async function createBreathwork(req: Request, res: Response) {
  try {
    const input = createBreathworkSchema.parse(req.body);
    const breathwork = await breathworkService.createBreathwork(input);
    return res.status(201).json({ breathwork });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    // Handle unique constraint violation
    if ((error as any)?.code === 'P2002') {
      return res.status(409).json({ error: 'Breathwork with this slug already exists' });
    }
    logger.error({ err: error }, 'Failed to create breathwork');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PUT /api/admin/breathworks/:id
 * Update a breathwork
 */
export async function updateBreathwork(req: Request, res: Response) {
  try {
    const { id } = breathworkIdParamSchema.parse(req.params);
    const input = updateBreathworkSchema.parse(req.body);
    const breathwork = await breathworkService.updateBreathwork(id, input);
    return res.json({ breathwork });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    if ((error as any)?.code === 'P2025') {
      return res.status(404).json({ error: 'Breathwork not found' });
    }
    if ((error as any)?.code === 'P2002') {
      return res.status(409).json({ error: 'Breathwork with this slug already exists' });
    }
    logger.error({ err: error }, 'Failed to update breathwork');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /api/admin/breathworks/:id
 * Delete a breathwork (soft delete)
 */
export async function deleteBreathwork(req: Request, res: Response) {
  try {
    const { id } = breathworkIdParamSchema.parse(req.params);
    await breathworkService.deleteBreathwork(id);
    return res.json({ message: 'Breathwork deleted' });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid breathwork id', details: error.flatten() });
    }
    if ((error as any)?.code === 'P2025') {
      return res.status(404).json({ error: 'Breathwork not found' });
    }
    logger.error({ err: error }, 'Failed to delete breathwork');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
