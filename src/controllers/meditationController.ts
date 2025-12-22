import { Request, Response } from 'express';
import { ZodError } from 'zod';
import {
  meditationFiltersSchema,
  meditationIdParamSchema,
  updateProgressSchema,
  completeSessionSchema,
  ratingSchema,
  createMeditationSchema,
  updateMeditationSchema,
  createCategorySchema,
  updateCategorySchema,
} from '../validation/meditationSchemas';
import * as meditationService from '../services/meditationService';
import { logger } from '../utils/logger';

// ==================== USER ENDPOINTS ====================

/**
 * GET /api/meditations
 * List meditations with filters and pagination
 */
export async function getMeditations(req: Request, res: Response) {
  try {
    const filters = meditationFiltersSchema.parse(req.query);
    const result = await meditationService.getMeditations(filters);
    return res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to list meditations');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/meditations/featured
 * Get featured meditations
 */
export async function getFeaturedMeditations(req: Request, res: Response) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const meditations = await meditationService.getFeaturedMeditations(limit);
    return res.json({ meditations });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get featured meditations');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/meditations/categories
 * Get all meditation categories
 */
export async function getCategories(req: Request, res: Response) {
  try {
    const categories = await meditationService.getCategories();
    return res.json({ categories });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get categories');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/meditations/search
 * Search meditations
 */
export async function searchMeditations(req: Request, res: Response) {
  try {
    const { q, limit } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query (q) is required' });
    }
    const meditations = await meditationService.searchMeditations(q, limit ? parseInt(limit as string, 10) : 20);
    return res.json({ meditations });
  } catch (error) {
    logger.error({ err: error }, 'Failed to search meditations');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/meditations/for-you
 * Get personalized meditation recommendations
 */
export async function getForYouMeditations(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const meditations = await meditationService.getForYouMeditations(req.user.userId, limit);
    return res.json({ meditations });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get personalized meditations');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/meditations/:id
 * Get meditation detail
 */
export async function getMeditation(req: Request, res: Response) {
  try {
    const { id } = meditationIdParamSchema.parse(req.params);
    const meditation = await meditationService.getMeditation(id, req.user?.userId);

    if (!meditation) {
      return res.status(404).json({ error: 'Meditation not found' });
    }

    return res.json({ meditation });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid meditation id', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to get meditation detail');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/meditations/:id/related
 * Get related meditations
 */
export async function getRelatedMeditations(req: Request, res: Response) {
  try {
    const { id } = meditationIdParamSchema.parse(req.params);
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 6;
    const meditations = await meditationService.getRelatedMeditations(id, limit);
    return res.json({ meditations });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid meditation id', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to get related meditations');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/meditations/:id/start
 * Start a meditation session
 */
export async function startSession(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = meditationIdParamSchema.parse(req.params);
    const result = await meditationService.startSession(req.user.userId, id);
    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid meditation id', details: error.flatten() });
    }
    if (error instanceof Error && error.message === 'Meditation not found') {
      return res.status(404).json({ error: 'Meditation not found' });
    }
    logger.error({ err: error }, 'Failed to start meditation session');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PUT /api/meditations/:id/progress
 * Update meditation progress
 */
export async function updateProgress(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = meditationIdParamSchema.parse(req.params);
    const input = updateProgressSchema.parse(req.body);
    const progress = await meditationService.updateProgress(req.user.userId, id, input);
    return res.json({ progress });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to update meditation progress');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/meditations/:id/complete
 * Complete a meditation session
 */
export async function completeSession(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = meditationIdParamSchema.parse(req.params);
    const input = completeSessionSchema.parse(req.body);
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const result = await meditationService.completeSession(req.user.userId, id, sessionId, input);
    return res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    if (error instanceof Error && error.message === 'Meditation not found') {
      return res.status(404).json({ error: 'Meditation not found' });
    }
    logger.error({ err: error }, 'Failed to complete meditation session');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/meditations/:id/rate
 * Rate a meditation
 */
export async function rateMeditation(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = meditationIdParamSchema.parse(req.params);
    const input = ratingSchema.parse(req.body);
    const rating = await meditationService.rateMeditation(req.user.userId, id, input);
    return res.json({ rating });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to rate meditation');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/meditations/:id/ratings
 * Get ratings for a meditation
 */
export async function getMeditationRatings(req: Request, res: Response) {
  try {
    const { id } = meditationIdParamSchema.parse(req.params);
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const result = await meditationService.getMeditationRatings(id, page, limit);
    return res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid meditation id', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to get meditation ratings');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/meditations/:id/favorite
 * Add meditation to favorites
 */
export async function addToFavorites(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = meditationIdParamSchema.parse(req.params);
    await meditationService.addToFavorites(req.user.userId, id);
    return res.status(201).json({ message: 'Added to favorites' });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid meditation id', details: error.flatten() });
    }
    // Handle duplicate entry (already favorited)
    if ((error as any)?.code === 'P2002') {
      return res.status(409).json({ error: 'Already in favorites' });
    }
    logger.error({ err: error }, 'Failed to add to favorites');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /api/meditations/:id/favorite
 * Remove meditation from favorites
 */
export async function removeFromFavorites(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = meditationIdParamSchema.parse(req.params);
    await meditationService.removeFromFavorites(req.user.userId, id);
    return res.json({ message: 'Removed from favorites' });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid meditation id', details: error.flatten() });
    }
    // Handle not found
    if ((error as any)?.code === 'P2025') {
      return res.status(404).json({ error: 'Not in favorites' });
    }
    logger.error({ err: error }, 'Failed to remove from favorites');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/meditations/favorites
 * Get user's favorite meditations
 */
export async function getFavorites(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const result = await meditationService.getFavorites(req.user.userId, page, limit);
    return res.json(result);
  } catch (error) {
    logger.error({ err: error }, 'Failed to get favorites');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/meditations/history
 * Get user's listening history
 */
export async function getHistory(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const result = await meditationService.getHistory(req.user.userId, page, limit);
    return res.json(result);
  } catch (error) {
    logger.error({ err: error }, 'Failed to get history');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/meditations/continue
 * Get meditations in progress
 */
export async function getContinueMeditations(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const meditations = await meditationService.getContinueMeditations(req.user.userId, limit);
    return res.json({ meditations });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get continue meditations');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================== ADMIN ENDPOINTS ====================

/**
 * GET /api/admin/meditations
 * Get all meditations (admin)
 */
export async function getAdminMeditations(req: Request, res: Response) {
  try {
    const filters = meditationFiltersSchema.parse(req.query);
    const result = await meditationService.getAdminMeditations(filters);
    return res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to list admin meditations');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/admin/meditations/:id
 * Get a meditation by ID (admin)
 */
export async function getAdminMeditationById(req: Request, res: Response) {
  try {
    const { id } = meditationIdParamSchema.parse(req.params);
    const meditation = await meditationService.getAdminMeditationById(id);

    if (!meditation) {
      return res.status(404).json({ error: 'Meditation not found' });
    }

    return res.json({ meditation });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid meditation id', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to get admin meditation by id');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/admin/meditations
 * Create a new meditation
 */
export async function createMeditation(req: Request, res: Response) {
  try {
    const input = createMeditationSchema.parse(req.body);
    const meditation = await meditationService.createMeditation(input);
    return res.status(201).json({ meditation });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    // Handle unique constraint violation
    if ((error as any)?.code === 'P2002') {
      return res.status(409).json({ error: 'Meditation with this slug already exists' });
    }
    logger.error({ err: error }, 'Failed to create meditation');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PUT /api/admin/meditations/:id
 * Update a meditation
 */
export async function updateMeditation(req: Request, res: Response) {
  try {
    const { id } = meditationIdParamSchema.parse(req.params);
    const input = updateMeditationSchema.parse(req.body);
    const meditation = await meditationService.updateMeditation(id, input);
    return res.json({ meditation });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    if ((error as any)?.code === 'P2025') {
      return res.status(404).json({ error: 'Meditation not found' });
    }
    if ((error as any)?.code === 'P2002') {
      return res.status(409).json({ error: 'Meditation with this slug already exists' });
    }
    logger.error({ err: error }, 'Failed to update meditation');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /api/admin/meditations/:id
 * Delete a meditation (soft delete)
 */
export async function deleteMeditation(req: Request, res: Response) {
  try {
    const { id } = meditationIdParamSchema.parse(req.params);
    await meditationService.deleteMeditation(id);
    return res.json({ message: 'Meditation deleted' });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid meditation id', details: error.flatten() });
    }
    if ((error as any)?.code === 'P2025') {
      return res.status(404).json({ error: 'Meditation not found' });
    }
    logger.error({ err: error }, 'Failed to delete meditation');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/admin/meditations/categories
 * Get all categories (admin)
 */
export async function getAdminCategories(req: Request, res: Response) {
  try {
    const categories = await meditationService.getAdminCategories();
    return res.json({ categories });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get admin categories');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/admin/meditations/categories
 * Create a category
 */
export async function createCategory(req: Request, res: Response) {
  try {
    const input = createCategorySchema.parse(req.body);
    const category = await meditationService.createCategory(input);
    return res.status(201).json({ category });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    if ((error as any)?.code === 'P2002') {
      return res.status(409).json({ error: 'Category with this slug already exists' });
    }
    logger.error({ err: error }, 'Failed to create category');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PUT /api/admin/meditations/categories/:id
 * Update a category
 */
export async function updateCategory(req: Request, res: Response) {
  try {
    const { id } = meditationIdParamSchema.parse(req.params);
    const input = updateCategorySchema.parse(req.body);
    const category = await meditationService.updateCategory(id, input);
    return res.json({ category });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    if ((error as any)?.code === 'P2025') {
      return res.status(404).json({ error: 'Category not found' });
    }
    logger.error({ err: error }, 'Failed to update category');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /api/admin/meditations/categories/:id
 * Delete a category (soft delete)
 */
export async function deleteCategory(req: Request, res: Response) {
  try {
    const { id } = meditationIdParamSchema.parse(req.params);
    await meditationService.deleteCategory(id);
    return res.json({ message: 'Category deleted' });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid category id', details: error.flatten() });
    }
    if ((error as any)?.code === 'P2025') {
      return res.status(404).json({ error: 'Category not found' });
    }
    if (error instanceof Error && error.message.includes('Cannot delete category')) {
      return res.status(400).json({ error: error.message });
    }
    logger.error({ err: error }, 'Failed to delete category');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/admin/meditations/stats
 * Get meditation statistics
 */
export async function getMeditationStats(req: Request, res: Response) {
  try {
    const stats = await meditationService.getMeditationStats();
    return res.json({ stats });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get meditation stats');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
