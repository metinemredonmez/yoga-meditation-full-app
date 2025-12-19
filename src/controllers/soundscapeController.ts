import { Request, Response } from 'express';
import { ZodError } from 'zod';
import {
  soundscapeFiltersSchema,
  soundscapeIdParamSchema,
  createMixSchema,
  updateMixSchema,
  mixIdParamSchema,
  createSoundscapeSchema,
  updateSoundscapeSchema,
} from '../validation/soundscapeSchemas';
import * as soundscapeService from '../services/soundscapeService';
import { logger } from '../utils/logger';

// ==================== USER ENDPOINTS ====================

/**
 * GET /api/soundscapes
 * List soundscapes with filters and pagination
 */
export async function getSoundscapes(req: Request, res: Response) {
  try {
    const filters = soundscapeFiltersSchema.parse(req.query);
    const result = await soundscapeService.getSoundscapes(filters);
    return res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to list soundscapes');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/soundscapes/categories
 * Get soundscape categories with counts
 */
export async function getCategories(req: Request, res: Response) {
  try {
    const categories = await soundscapeService.getCategories();
    return res.json({ categories });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get categories');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/soundscapes/mixable
 * Get mixable soundscapes for mixer
 */
export async function getMixableSoundscapes(req: Request, res: Response) {
  try {
    const soundscapes = await soundscapeService.getMixableSoundscapes();
    return res.json({ soundscapes });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get mixable soundscapes');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/soundscapes/search
 * Search soundscapes
 */
export async function searchSoundscapes(req: Request, res: Response) {
  try {
    const { q, limit } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query (q) is required' });
    }
    const soundscapes = await soundscapeService.searchSoundscapes(q, limit ? parseInt(limit as string, 10) : 20);
    return res.json({ soundscapes });
  } catch (error) {
    logger.error({ err: error }, 'Failed to search soundscapes');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/soundscapes/category/:category
 * Get soundscapes by category
 */
export async function getByCategory(req: Request, res: Response) {
  try {
    const category = req.params.category as any;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const soundscapes = await soundscapeService.getSoundscapesByCategory(category, limit);
    return res.json({ soundscapes });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get soundscapes by category');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/soundscapes/favorites
 * Get user's favorite soundscapes
 */
export async function getFavorites(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const result = await soundscapeService.getUserFavorites(req.user.userId, page, limit);
    return res.json(result);
  } catch (error) {
    logger.error({ err: error }, 'Failed to get favorites');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/soundscapes/:id
 * Get soundscape detail
 */
export async function getSoundscape(req: Request, res: Response) {
  try {
    const { id } = soundscapeIdParamSchema.parse(req.params);
    const soundscape = await soundscapeService.getSoundscape(id, req.user?.userId);

    if (!soundscape) {
      return res.status(404).json({ error: 'Soundscape not found' });
    }

    return res.json({ soundscape });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid soundscape id', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to get soundscape detail');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/soundscapes/:id/play
 * Increment play count
 */
export async function playSoundscape(req: Request, res: Response) {
  try {
    const { id } = soundscapeIdParamSchema.parse(req.params);
    await soundscapeService.incrementPlayCount(id);
    return res.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid soundscape id', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to increment play count');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/soundscapes/:id/favorite
 * Add soundscape to favorites
 */
export async function addFavorite(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { id } = soundscapeIdParamSchema.parse(req.params);
    await soundscapeService.addFavorite(req.user.userId, id);
    return res.status(201).json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid soundscape id', details: error.flatten() });
    }
    if ((error as any)?.code === 'P2002') {
      return res.status(409).json({ error: 'Already in favorites' });
    }
    logger.error({ err: error }, 'Failed to add favorite');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /api/soundscapes/:id/favorite
 * Remove soundscape from favorites
 */
export async function removeFavorite(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { id } = soundscapeIdParamSchema.parse(req.params);
    await soundscapeService.removeFavorite(req.user.userId, id);
    return res.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid soundscape id', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to remove favorite');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================== MIX ENDPOINTS ====================

/**
 * GET /api/soundscapes/mixes
 * Get user's mixes
 */
export async function getUserMixes(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const result = await soundscapeService.getUserMixes(req.user.userId, page, limit);
    return res.json(result);
  } catch (error) {
    logger.error({ err: error }, 'Failed to get user mixes');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/soundscapes/mixes/public
 * Get public mixes
 */
export async function getPublicMixes(req: Request, res: Response) {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const result = await soundscapeService.getPublicMixes(page, limit);
    return res.json(result);
  } catch (error) {
    logger.error({ err: error }, 'Failed to get public mixes');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/soundscapes/mixes/:mixId
 * Get mix detail
 */
export async function getMix(req: Request, res: Response) {
  try {
    const { mixId } = mixIdParamSchema.parse(req.params);
    const mix = await soundscapeService.getMix(mixId, req.user?.userId);

    if (!mix) {
      return res.status(404).json({ error: 'Mix not found' });
    }

    return res.json({ mix });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid mix id', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to get mix detail');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/soundscapes/mixes
 * Create a new mix
 */
export async function createMix(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const input = createMixSchema.parse(req.body);
    const mix = await soundscapeService.createMix(req.user.userId, input);
    return res.status(201).json({ mix });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to create mix');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PUT /api/soundscapes/mixes/:mixId
 * Update a mix
 */
export async function updateMix(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { mixId } = mixIdParamSchema.parse(req.params);
    const input = updateMixSchema.parse(req.body);
    const mix = await soundscapeService.updateMix(req.user.userId, mixId, input);
    return res.json({ mix });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    if (error instanceof Error && error.message === 'Mix not found') {
      return res.status(404).json({ error: 'Mix not found' });
    }
    logger.error({ err: error }, 'Failed to update mix');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /api/soundscapes/mixes/:mixId
 * Delete a mix
 */
export async function deleteMix(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { mixId } = mixIdParamSchema.parse(req.params);
    await soundscapeService.deleteMix(req.user.userId, mixId);
    return res.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid mix id', details: error.flatten() });
    }
    if (error instanceof Error && error.message === 'Mix not found') {
      return res.status(404).json({ error: 'Mix not found' });
    }
    logger.error({ err: error }, 'Failed to delete mix');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/soundscapes/mixes/:mixId/play
 * Increment mix play count
 */
export async function playMix(req: Request, res: Response) {
  try {
    const { mixId } = mixIdParamSchema.parse(req.params);
    await soundscapeService.incrementMixPlayCount(mixId);
    return res.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid mix id', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to increment mix play count');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================== ADMIN ENDPOINTS ====================

/**
 * GET /api/admin/soundscapes
 * Get all soundscapes (admin)
 */
export async function getAdminSoundscapes(req: Request, res: Response) {
  try {
    const filters = soundscapeFiltersSchema.parse(req.query);
    const result = await soundscapeService.getAdminSoundscapes(filters);
    return res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to list admin soundscapes');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/admin/soundscapes/stats
 * Get soundscape statistics
 */
export async function getSoundscapeStats(req: Request, res: Response) {
  try {
    const stats = await soundscapeService.getSoundscapeStats();
    return res.json({ stats });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get soundscape stats');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/admin/soundscapes
 * Create a new soundscape
 */
export async function createSoundscape(req: Request, res: Response) {
  try {
    const input = createSoundscapeSchema.parse(req.body);
    const soundscape = await soundscapeService.createSoundscape(input);
    return res.status(201).json({ soundscape });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    if ((error as any)?.code === 'P2002') {
      return res.status(409).json({ error: 'Soundscape with this slug already exists' });
    }
    logger.error({ err: error }, 'Failed to create soundscape');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PUT /api/admin/soundscapes/:id
 * Update a soundscape
 */
export async function updateSoundscape(req: Request, res: Response) {
  try {
    const { id } = soundscapeIdParamSchema.parse(req.params);
    const input = updateSoundscapeSchema.parse(req.body);
    const soundscape = await soundscapeService.updateSoundscape(id, input);
    return res.json({ soundscape });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    if ((error as any)?.code === 'P2025') {
      return res.status(404).json({ error: 'Soundscape not found' });
    }
    if ((error as any)?.code === 'P2002') {
      return res.status(409).json({ error: 'Soundscape with this slug already exists' });
    }
    logger.error({ err: error }, 'Failed to update soundscape');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /api/admin/soundscapes/:id
 * Delete a soundscape
 */
export async function deleteSoundscape(req: Request, res: Response) {
  try {
    const { id } = soundscapeIdParamSchema.parse(req.params);
    await soundscapeService.deleteSoundscape(id);
    return res.json({ message: 'Soundscape deleted' });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid soundscape id', details: error.flatten() });
    }
    if ((error as any)?.code === 'P2025') {
      return res.status(404).json({ error: 'Soundscape not found' });
    }
    logger.error({ err: error }, 'Failed to delete soundscape');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
