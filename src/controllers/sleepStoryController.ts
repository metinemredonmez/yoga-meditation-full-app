import { Request, Response } from 'express';
import { ZodError } from 'zod';
import {
  sleepStoryFiltersSchema,
  sleepStoryIdParamSchema,
  updateProgressSchema,
  rateStorySchema,
  createSleepStorySchema,
  updateSleepStorySchema,
  sleepTimerSettingsSchema,
} from '../validation/sleepStorySchemas';
import * as sleepStoryService from '../services/sleepStoryService';
import { logger } from '../utils/logger';

// ==================== SLEEP STORIES ====================

/**
 * GET /api/sleep/stories
 * Get sleep stories
 */
export async function getSleepStories(req: Request, res: Response) {
  try {
    const filters = sleepStoryFiltersSchema.parse(req.query);
    const result = await sleepStoryService.getSleepStories(filters);
    return res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to get sleep stories');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/sleep/stories/featured
 * Get featured stories
 */
export async function getFeaturedStories(req: Request, res: Response) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const stories = await sleepStoryService.getFeaturedStories(limit);
    return res.json({ stories });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get featured stories');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/sleep/stories/categories
 * Get story categories
 */
export async function getCategories(req: Request, res: Response) {
  try {
    const categories = await sleepStoryService.getCategories();
    return res.json({ categories });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get categories');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/sleep/stories/category/:category
 * Get stories by category
 */
export async function getStoriesByCategory(req: Request, res: Response) {
  try {
    const { category } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const stories = await sleepStoryService.getStoriesByCategory(category as any, limit);
    return res.json({ stories });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get stories by category');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/sleep/stories/:id
 * Get sleep story by ID
 */
export async function getSleepStory(req: Request, res: Response) {
  try {
    const { id } = sleepStoryIdParamSchema.parse(req.params);
    const story = await sleepStoryService.getSleepStory(id, req.user?.userId);

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    return res.json({ story });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid story id', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to get sleep story');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================== PLAYBACK ====================

/**
 * POST /api/sleep/stories/:id/start
 * Start story playback
 */
export async function startStory(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = sleepStoryIdParamSchema.parse(req.params);
    const progress = await sleepStoryService.startStory(req.user.userId, id);
    return res.json({ progress });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid story id', details: error.flatten() });
    }
    if (error instanceof Error && error.message === 'Story not found') {
      return res.status(404).json({ error: 'Story not found' });
    }
    logger.error({ err: error }, 'Failed to start story');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/sleep/stories/:id/progress
 * Update playback progress
 */
export async function updateProgress(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = sleepStoryIdParamSchema.parse(req.params);
    const input = updateProgressSchema.parse(req.body);
    const progress = await sleepStoryService.updateProgress(req.user.userId, id, input);
    return res.json({ progress });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to update progress');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/sleep/stories/:id/complete
 * Complete story
 */
export async function completeStory(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = sleepStoryIdParamSchema.parse(req.params);
    const progress = await sleepStoryService.completeStory(req.user.userId, id);
    return res.json({ progress });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid story id', details: error.flatten() });
    }
    if (error instanceof Error && error.message === 'Story not found') {
      return res.status(404).json({ error: 'Story not found' });
    }
    logger.error({ err: error }, 'Failed to complete story');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================== RATINGS ====================

/**
 * POST /api/sleep/stories/:id/rate
 * Rate story
 */
export async function rateStory(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = sleepStoryIdParamSchema.parse(req.params);
    const input = rateStorySchema.parse(req.body);
    const rating = await sleepStoryService.rateStory(req.user.userId, id, input);
    return res.json({ rating });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to rate story');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/sleep/stories/:id/ratings
 * Get story ratings
 */
export async function getStoryRatings(req: Request, res: Response) {
  try {
    const { id } = sleepStoryIdParamSchema.parse(req.params);
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const result = await sleepStoryService.getStoryRatings(id, page, limit);
    return res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid story id', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to get story ratings');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================== USER DATA ====================

/**
 * GET /api/sleep/stories/history
 * Get listening history
 */
export async function getListeningHistory(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const result = await sleepStoryService.getListeningHistory(req.user.userId, page, limit);
    return res.json(result);
  } catch (error) {
    logger.error({ err: error }, 'Failed to get listening history');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/sleep/stories/continue
 * Get continue watching
 */
export async function getContinueWatching(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
    const stories = await sleepStoryService.getContinueWatching(req.user.userId, limit);
    return res.json({ stories });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get continue watching');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================== SLEEP TIMER SETTINGS ====================

/**
 * GET /api/sleep/timer/settings
 * Get sleep timer settings
 */
export async function getSleepTimerSettings(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const settings = await sleepStoryService.getSleepTimerSettings(req.user.userId);
    return res.json({ settings });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get sleep timer settings');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PUT /api/sleep/timer/settings
 * Update sleep timer settings
 */
export async function updateSleepTimerSettings(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const input = sleepTimerSettingsSchema.parse(req.body);
    const settings = await sleepStoryService.updateSleepTimerSettings(req.user.userId, input);
    return res.json({ settings });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to update sleep timer settings');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================== ADMIN ENDPOINTS ====================

/**
 * GET /api/admin/sleep/stories
 * Get all sleep stories (admin)
 */
export async function getAdminSleepStories(req: Request, res: Response) {
  try {
    const filters = sleepStoryFiltersSchema.parse(req.query);
    const result = await sleepStoryService.getAdminSleepStories(filters);
    return res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to get admin sleep stories');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/admin/sleep/stories
 * Create sleep story
 */
export async function createSleepStory(req: Request, res: Response) {
  try {
    const input = createSleepStorySchema.parse(req.body);
    const story = await sleepStoryService.createSleepStory(input);
    return res.status(201).json({ story });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to create sleep story');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PUT /api/admin/sleep/stories/:id
 * Update sleep story
 */
export async function updateSleepStory(req: Request, res: Response) {
  try {
    const { id } = sleepStoryIdParamSchema.parse(req.params);
    const input = updateSleepStorySchema.parse(req.body);
    const story = await sleepStoryService.updateSleepStory(id, input);
    return res.json({ story });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    if ((error as any)?.code === 'P2025') {
      return res.status(404).json({ error: 'Story not found' });
    }
    logger.error({ err: error }, 'Failed to update sleep story');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /api/admin/sleep/stories/:id
 * Delete sleep story
 */
export async function deleteSleepStory(req: Request, res: Response) {
  try {
    const { id } = sleepStoryIdParamSchema.parse(req.params);
    await sleepStoryService.deleteSleepStory(id);
    return res.json({ message: 'Story deleted' });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid story id', details: error.flatten() });
    }
    if ((error as any)?.code === 'P2025') {
      return res.status(404).json({ error: 'Story not found' });
    }
    logger.error({ err: error }, 'Failed to delete sleep story');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/admin/sleep/stories/stats
 * Get sleep story stats
 */
export async function getSleepStoryStats(req: Request, res: Response) {
  try {
    const stats = await sleepStoryService.getSleepStoryStats();
    return res.json({ stats });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get sleep story stats');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
