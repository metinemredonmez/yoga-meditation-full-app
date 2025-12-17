import { Request, Response, NextFunction } from 'express';
import * as xpService from '../services/xpService';
import * as streakService from '../services/streakService';
import * as milestoneService from '../services/milestoneService';
import { HttpError } from '../middleware/errorHandler';

// ============================================
// User Stats
// ============================================

export async function getUserStats(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const stats = await xpService.getUserStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

export async function getLevelInfo(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const levelInfo = await xpService.getLevelInfo(userId);

    res.json({
      success: true,
      data: levelInfo,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// XP History
// ============================================

export async function getXPHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { page, limit, source, type, startDate, endDate } = req.query;

    const result = await xpService.getXPHistory(
      userId,
      {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      },
      {
        source: source as any,
        type: type as any,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      },
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Leaderboard
// ============================================

export async function getXPLeaderboard(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = req.query;

    const result = await xpService.getXPLeaderboard({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    // Add current user's rank if authenticated
    if (req.user) {
      const userRank = await xpService.getUserRank(req.user.id);
      (result as any).currentUserRank = userRank;
    }

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Streak Info
// ============================================

export async function getStreakInfo(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const streakInfo = await streakService.getStreakInfo(userId);

    res.json({
      success: true,
      data: streakInfo,
    });
  } catch (error) {
    next(error);
  }
}

export async function useStreakFreeze(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const result = await streakService.useStreakFreeze(userId);

    if (!result.success) {
      throw new HttpError(400, result.message || 'Failed to use streak freeze');
    }

    res.json({
      success: true,
      message: 'Streak freeze used',
    });
  } catch (error) {
    next(error);
  }
}

export async function getStreakLeaderboard(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = req.query;

    const result = await streakService.getStreakLeaderboard({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Milestones
// ============================================

export async function getMilestones(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { type, celebrated } = req.query;

    const milestones = await milestoneService.getMilestones(userId, {
      type: type as any,
      celebrated: celebrated === 'true' ? true : celebrated === 'false' ? false : undefined,
    });

    res.json({
      success: true,
      milestones,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUpcomingMilestones(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const upcoming = await milestoneService.getUpcomingMilestones(userId);

    res.json({
      success: true,
      milestones: upcoming,
    });
  } catch (error) {
    next(error);
  }
}

export async function celebrateMilestone(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const milestoneId = req.params.id!;

    const result = await milestoneService.celebrateMilestone(userId, milestoneId);

    if (!result.success) {
      throw new HttpError(400, result.message || 'Failed to celebrate milestone');
    }

    res.json({
      success: true,
      message: 'Milestone celebrated',
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Admin: XP Management
// ============================================

export async function adminAddXP(req: Request, res: Response, next: NextFunction) {
  try {
    const targetUserId = req.params.userId!;
    const { amount, description } = req.body;

    const result = await xpService.awardXP(
      targetUserId,
      amount,
      'ADMIN',
      undefined,
      description || 'Admin XP adjustment',
      'ADMIN_ADJUSTMENT',
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function adminDeductXP(req: Request, res: Response, next: NextFunction) {
  try {
    const targetUserId = req.params.userId!;
    const { amount, description } = req.body;

    const result = await xpService.deductXP(targetUserId, amount, description);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function adminGrantStreakFreeze(req: Request, res: Response, next: NextFunction) {
  try {
    const targetUserId = req.params.userId!;

    const freeze = await streakService.grantStreakFreeze(
      targetUserId,
      'ADMIN_GRANTED',
    );

    res.json({
      success: true,
      freeze,
    });
  } catch (error) {
    next(error);
  }
}
