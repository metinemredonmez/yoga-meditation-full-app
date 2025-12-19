import { Request, Response } from 'express';
import { ZodError } from 'zod';
import {
  moodEntryFiltersSchema,
  moodEntryIdParamSchema,
  createMoodEntrySchema,
  updateMoodEntrySchema,
  moodStatsQuerySchema,
  createMoodTagSchema,
  updateMoodTagSchema,
  moodTagIdParamSchema,
} from '../validation/moodSchemas';
import * as moodService from '../services/moodService';
import { logger } from '../utils/logger';

// ==================== USER ENDPOINTS ====================

/**
 * GET /api/mood
 * Get user's mood entries
 */
export async function getMoodEntries(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const filters = moodEntryFiltersSchema.parse(req.query);
    const result = await moodService.getMoodEntries(req.user.userId, filters);
    return res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to list mood entries');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/mood/today
 * Get today's mood entry
 */
export async function getTodayMoodEntry(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const entry = await moodService.getTodayMoodEntry(req.user.userId);
    return res.json({ entry });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get today mood entry');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/mood/stats
 * Get mood statistics
 */
export async function getMoodStats(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const query = moodStatsQuerySchema.parse(req.query);
    const stats = await moodService.getMoodStats(req.user.userId, query);
    return res.json({ stats });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to get mood stats');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/mood/streak
 * Get mood tracking streak
 */
export async function getMoodStreak(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const streak = await moodService.getMoodStreak(req.user.userId);
    return res.json({ streak });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get mood streak');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/mood/tags
 * Get available mood tags
 */
export async function getMoodTags(req: Request, res: Response) {
  try {
    const tags = await moodService.getMoodTags();
    return res.json({ tags });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get mood tags');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/mood/tags/:category
 * Get mood tags by category
 */
export async function getMoodTagsByCategory(req: Request, res: Response) {
  try {
    const category = req.params.category as string;
    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }
    const tags = await moodService.getMoodTagsByCategory(category);
    return res.json({ tags });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get mood tags by category');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/mood/:id
 * Get mood entry by id
 */
export async function getMoodEntry(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = moodEntryIdParamSchema.parse(req.params);
    const entry = await moodService.getMoodEntry(req.user.userId, id);

    if (!entry) {
      return res.status(404).json({ error: 'Mood entry not found' });
    }

    return res.json({ entry });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid mood entry id', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to get mood entry');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/mood
 * Create a mood entry
 */
export async function createMoodEntry(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const input = createMoodEntrySchema.parse(req.body);
    const entry = await moodService.createMoodEntry(req.user.userId, input);
    return res.status(201).json({ entry });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to create mood entry');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PUT /api/mood/:id
 * Update a mood entry
 */
export async function updateMoodEntry(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = moodEntryIdParamSchema.parse(req.params);
    const input = updateMoodEntrySchema.parse(req.body);
    const entry = await moodService.updateMoodEntry(req.user.userId, id, input);
    return res.json({ entry });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    if (error instanceof Error && error.message === 'Mood entry not found') {
      return res.status(404).json({ error: 'Mood entry not found' });
    }
    logger.error({ err: error }, 'Failed to update mood entry');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /api/mood/:id
 * Delete a mood entry
 */
export async function deleteMoodEntry(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = moodEntryIdParamSchema.parse(req.params);
    await moodService.deleteMoodEntry(req.user.userId, id);
    return res.json({ message: 'Mood entry deleted' });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid mood entry id', details: error.flatten() });
    }
    if (error instanceof Error && error.message === 'Mood entry not found') {
      return res.status(404).json({ error: 'Mood entry not found' });
    }
    logger.error({ err: error }, 'Failed to delete mood entry');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================== ADMIN ENDPOINTS ====================

/**
 * GET /api/admin/mood/tags
 * Get all mood tags (admin)
 */
export async function getAdminMoodTags(req: Request, res: Response) {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const result = await moodService.getAdminMoodTags(page, limit);
    return res.json(result);
  } catch (error) {
    logger.error({ err: error }, 'Failed to list mood tags');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/admin/mood/tags
 * Create a mood tag
 */
export async function createMoodTag(req: Request, res: Response) {
  try {
    const input = createMoodTagSchema.parse(req.body);
    const tag = await moodService.createMoodTag(input);
    return res.status(201).json({ tag });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to create mood tag');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PUT /api/admin/mood/tags/:id
 * Update a mood tag
 */
export async function updateMoodTag(req: Request, res: Response) {
  try {
    const { id } = moodTagIdParamSchema.parse(req.params);
    const input = updateMoodTagSchema.parse(req.body);
    const tag = await moodService.updateMoodTag(id, input);
    return res.json({ tag });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    if ((error as any)?.code === 'P2025') {
      return res.status(404).json({ error: 'Mood tag not found' });
    }
    logger.error({ err: error }, 'Failed to update mood tag');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /api/admin/mood/tags/:id
 * Delete a mood tag
 */
export async function deleteMoodTag(req: Request, res: Response) {
  try {
    const { id } = moodTagIdParamSchema.parse(req.params);
    await moodService.deleteMoodTag(id);
    return res.json({ message: 'Mood tag deleted' });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid mood tag id', details: error.flatten() });
    }
    if ((error as any)?.code === 'P2025') {
      return res.status(404).json({ error: 'Mood tag not found' });
    }
    logger.error({ err: error }, 'Failed to delete mood tag');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/admin/mood/analytics
 * Get mood analytics
 */
export async function getMoodAnalytics(req: Request, res: Response) {
  try {
    const analytics = await moodService.getMoodAnalytics();
    return res.json({ analytics });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get mood analytics');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
