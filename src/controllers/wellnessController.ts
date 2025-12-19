import type { Request, Response } from 'express';
import * as wellnessService from '../services/wellnessService';
import { recordActivitySchema } from '../validation/wellnessSchemas';

type AuthenticatedRequest = Request & { user?: { id: string } };

// GET /api/wellness/stats - Get user's overall wellness stats
export async function getWellnessStats(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const stats = await wellnessService.getWellnessStats(userId);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// GET /api/wellness/summary - Get wellness summary (dashboard view)
export async function getWellnessSummary(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const summary = await wellnessService.getWellnessSummary(userId);
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// GET /api/wellness/streak - Get streak info
export async function getStreakInfo(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const streakInfo = await wellnessService.getStreakInfo(userId);
    res.json(streakInfo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// POST /api/wellness/activity - Record activity (internal use)
export async function recordActivity(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const input = recordActivitySchema.parse(req.body);
    const stats = await wellnessService.recordActivity(userId, input);
    res.json(stats);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
}
