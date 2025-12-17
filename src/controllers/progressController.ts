import { Request, Response } from 'express';
import { getProgressSummary } from '../services/progressService';
import { logger } from '../utils/logger';

export async function getProgressSummaryHandler(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const summary = await getProgressSummary(req.user.userId);
    return res.json({ summary });
  } catch (error) {
    logger.error({ err: error }, 'Failed to compute progress summary');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
