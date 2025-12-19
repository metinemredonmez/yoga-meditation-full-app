import { Request, Response } from 'express';
import { ZodError } from 'zod';
import {
  createSleepTrackingSchema,
  updateSleepTrackingSchema,
  sleepTrackingIdParamSchema,
  sleepTrackingFiltersSchema,
  sleepStatsQuerySchema,
} from '../validation/sleepTrackingSchemas';
import * as sleepTrackingService from '../services/sleepTrackingService';
import { logger } from '../utils/logger';

// ==================== SLEEP TRACKING ====================

/**
 * GET /api/sleep/tracking
 * Get sleep tracking records
 */
export async function getSleepTracking(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const filters = sleepTrackingFiltersSchema.parse(req.query);
    const result = await sleepTrackingService.getSleepTracking(req.user.userId, filters);
    return res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to get sleep tracking');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/sleep/tracking/today
 * Get today's sleep record
 */
export async function getTodaySleep(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const record = await sleepTrackingService.getTodaySleep(req.user.userId);
    return res.json({ record });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get today sleep');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/sleep/tracking/last-night
 * Get last night's sleep record
 */
export async function getLastNightSleep(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const record = await sleepTrackingService.getLastNightSleep(req.user.userId);
    return res.json({ record });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get last night sleep');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/sleep/tracking/:id
 * Get sleep tracking record by ID
 */
export async function getSleepTrackingById(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = sleepTrackingIdParamSchema.parse(req.params);
    const record = await sleepTrackingService.getSleepTrackingById(req.user.userId, id);

    if (!record) {
      return res.status(404).json({ error: 'Sleep tracking record not found' });
    }

    return res.json({ record });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid record id', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to get sleep tracking record');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/sleep/tracking
 * Create sleep tracking record
 */
export async function createSleepTracking(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const input = createSleepTrackingSchema.parse(req.body);
    const record = await sleepTrackingService.createSleepTracking(req.user.userId, input);
    return res.status(201).json({ record });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    if (error instanceof Error && error.message.includes('Wake time')) {
      return res.status(400).json({ error: error.message });
    }
    logger.error({ err: error }, 'Failed to create sleep tracking');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PUT /api/sleep/tracking/:id
 * Update sleep tracking record
 */
export async function updateSleepTracking(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = sleepTrackingIdParamSchema.parse(req.params);
    const input = updateSleepTrackingSchema.parse(req.body);
    const record = await sleepTrackingService.updateSleepTracking(req.user.userId, id, input);
    return res.json({ record });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    if (error instanceof Error && error.message === 'Sleep tracking record not found') {
      return res.status(404).json({ error: 'Sleep tracking record not found' });
    }
    if (error instanceof Error && error.message.includes('Wake time')) {
      return res.status(400).json({ error: error.message });
    }
    logger.error({ err: error }, 'Failed to update sleep tracking');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /api/sleep/tracking/:id
 * Delete sleep tracking record
 */
export async function deleteSleepTracking(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = sleepTrackingIdParamSchema.parse(req.params);
    await sleepTrackingService.deleteSleepTracking(req.user.userId, id);
    return res.json({ message: 'Sleep tracking record deleted' });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid record id', details: error.flatten() });
    }
    if (error instanceof Error && error.message === 'Sleep tracking record not found') {
      return res.status(404).json({ error: 'Sleep tracking record not found' });
    }
    logger.error({ err: error }, 'Failed to delete sleep tracking');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================== SLEEP STATS ====================

/**
 * GET /api/sleep/tracking/stats
 * Get sleep statistics
 */
export async function getSleepStats(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const query = sleepStatsQuerySchema.parse(req.query);
    const stats = await sleepTrackingService.getSleepStats(req.user.userId, query);
    return res.json({ stats });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to get sleep stats');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
