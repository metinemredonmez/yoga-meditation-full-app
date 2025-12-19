import { Request, Response } from 'express';
import { ZodError } from 'zod';
import {
  startSessionSchema,
  updateSessionSchema,
  sessionIdParamSchema,
  sessionFiltersSchema,
  sessionStatsQuerySchema,
} from '../validation/sessionSchemas';
import * as sessionService from '../services/sessionService';
import { logger } from '../utils/logger';

// ==================== SESSION MANAGEMENT ====================

/**
 * POST /api/sessions
 * Start a new session
 */
export async function startSession(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const input = startSessionSchema.parse(req.body);
    const session = await sessionService.startSession(req.user.userId, input);
    return res.status(201).json({ session });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    if (error instanceof Error && error.message.includes('already have')) {
      return res.status(409).json({ error: error.message });
    }
    logger.error({ err: error }, 'Failed to start session');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/sessions/active
 * Get active session
 */
export async function getActiveSession(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const session = await sessionService.getActiveSession(req.user.userId);
    return res.json({ session });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get active session');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/sessions/:id
 * Get session by ID
 */
export async function getSession(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = sessionIdParamSchema.parse(req.params);
    const session = await sessionService.getSession(req.user.userId, id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    return res.json({ session });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid session id', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to get session');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PUT /api/sessions/:id
 * Update session
 */
export async function updateSession(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = sessionIdParamSchema.parse(req.params);
    const input = updateSessionSchema.parse(req.body);
    const session = await sessionService.updateSession(req.user.userId, id, input);
    return res.json({ session });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    if (error instanceof Error && error.message === 'Session not found') {
      return res.status(404).json({ error: 'Session not found' });
    }
    logger.error({ err: error }, 'Failed to update session');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/sessions/:id/pause
 * Pause session
 */
export async function pauseSession(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = sessionIdParamSchema.parse(req.params);
    const session = await sessionService.pauseSession(req.user.userId, id);
    return res.json({ session });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid session id', details: error.flatten() });
    }
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Active session not found' });
    }
    logger.error({ err: error }, 'Failed to pause session');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/sessions/:id/resume
 * Resume session
 */
export async function resumeSession(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = sessionIdParamSchema.parse(req.params);
    const session = await sessionService.resumeSession(req.user.userId, id);
    return res.json({ session });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid session id', details: error.flatten() });
    }
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Paused session not found' });
    }
    logger.error({ err: error }, 'Failed to resume session');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/sessions/:id/end
 * End session (abandon)
 */
export async function endSession(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = sessionIdParamSchema.parse(req.params);
    const { actualDuration } = req.body;
    const session = await sessionService.endSession(req.user.userId, id, actualDuration);
    return res.json({ session });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid session id', details: error.flatten() });
    }
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Active session not found' });
    }
    logger.error({ err: error }, 'Failed to end session');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/sessions/:id/complete
 * Complete session
 */
export async function completeSession(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = sessionIdParamSchema.parse(req.params);
    const { actualDuration, note } = req.body;

    if (typeof actualDuration !== 'number' || actualDuration < 0) {
      return res.status(400).json({ error: 'actualDuration is required and must be a positive number' });
    }

    const session = await sessionService.completeSession(req.user.userId, id, actualDuration, note);
    return res.json({ session });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Active session not found' });
    }
    logger.error({ err: error }, 'Failed to complete session');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================== SESSION HISTORY & STATS ====================

/**
 * GET /api/sessions/history
 * Get session history
 */
export async function getSessionHistory(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const filters = sessionFiltersSchema.parse(req.query);
    const result = await sessionService.getSessionHistory(req.user.userId, filters);
    return res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to get session history');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/sessions/stats
 * Get session statistics
 */
export async function getSessionStats(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const query = sessionStatsQuerySchema.parse(req.query);
    const stats = await sessionService.getSessionStats(req.user.userId, query);
    return res.json({ stats });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to get session stats');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
