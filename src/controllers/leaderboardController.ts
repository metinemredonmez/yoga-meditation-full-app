import type { Request, Response, NextFunction } from 'express';
import * as leaderboardService from '../services/leaderboardService';
import type { LeaderboardPeriod } from '@prisma/client';

// ============================================
// Leaderboard Controllers
// ============================================

export async function getLeaderboard(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { period = 'WEEKLY', page, limit } = req.query;

    const result = await leaderboardService.getLeaderboard(
      period as LeaderboardPeriod,
      {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      },
    );

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getMyRank(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user.userId;
    const { period = 'WEEKLY' } = req.query;

    const rank = await leaderboardService.getUserRank(
      userId,
      period as LeaderboardPeriod,
    );

    if (!rank) {
      res.json({
        success: true,
        data: null,
        message: 'No ranking data for this period',
      });
      return;
    }

    res.json({ success: true, data: rank });
  } catch (error) {
    next(error);
  }
}

export async function getUserRank(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.params.userId!;
    const { period = 'WEEKLY' } = req.query;

    const rank = await leaderboardService.getUserRank(
      userId,
      period as LeaderboardPeriod,
    );

    if (!rank) {
      res.json({
        success: true,
        data: null,
        message: 'No ranking data for this period',
      });
      return;
    }

    res.json({ success: true, data: rank });
  } catch (error) {
    next(error);
  }
}

export async function getMyHistory(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user.userId;
    const { period = 'WEEKLY', limit } = req.query;

    const history = await leaderboardService.getUserLeaderboardHistory(
      userId,
      period as LeaderboardPeriod,
      limit ? parseInt(limit as string, 10) : undefined,
    );

    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Category Leaderboards
// ============================================

export async function getTopByMinutes(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { period = 'WEEKLY', limit } = req.query;

    const entries = await leaderboardService.getTopByMinutes(
      period as LeaderboardPeriod,
      limit ? parseInt(limit as string, 10) : undefined,
    );

    res.json({ success: true, data: entries });
  } catch (error) {
    next(error);
  }
}

export async function getTopByStreaks(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { period = 'WEEKLY', limit } = req.query;

    const entries = await leaderboardService.getTopByStreaks(
      period as LeaderboardPeriod,
      limit ? parseInt(limit as string, 10) : undefined,
    );

    res.json({ success: true, data: entries });
  } catch (error) {
    next(error);
  }
}

export async function getTopBySessions(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { period = 'WEEKLY', limit } = req.query;

    const entries = await leaderboardService.getTopBySessions(
      period as LeaderboardPeriod,
      limit ? parseInt(limit as string, 10) : undefined,
    );

    res.json({ success: true, data: entries });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Statistics
// ============================================

export async function getLeaderboardStats(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { period = 'WEEKLY' } = req.query;

    const stats = await leaderboardService.getLeaderboardStats(
      period as LeaderboardPeriod,
    );

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Admin Controllers
// ============================================

export async function recalculateRanks(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { period = 'WEEKLY' } = req.body;

    await leaderboardService.recalculateRanks(period as LeaderboardPeriod);

    res.json({ success: true, message: 'Ranks recalculated' });
  } catch (error) {
    next(error);
  }
}
