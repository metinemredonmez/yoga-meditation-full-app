import { Request, Response, NextFunction } from 'express';
import * as dailyRewardService from '../services/dailyRewardService';
import { HttpError } from '../middleware/errorHandler';

// ============================================
// Daily Rewards
// ============================================

export async function getDailyRewardStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const status = await dailyRewardService.getDailyRewardStatus(userId);

    res.json({
      success: true,
      ...status,
    });
  } catch (error) {
    next(error);
  }
}

export async function claimDailyReward(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const result = await dailyRewardService.claimDailyReward(userId);

    if (!result.success) {
      throw new HttpError(400, result.message || 'Failed to claim reward');
    }

    res.json({
      success: true,
      message: 'Daily reward claimed',
      day: result.day,
      xpAwarded: result.xpAwarded,
      bonusType: result.bonusType,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDailyRewardCalendar(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const calendar = await dailyRewardService.getUserCalendar(userId);

    res.json({
      success: true,
      calendar,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDailyRewardHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const history = await dailyRewardService.getClaimHistory(userId);

    res.json({
      success: true,
      history,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Admin Functions
// ============================================

export async function getDailyRewards(req: Request, res: Response, next: NextFunction) {
  try {
    const rewards = await dailyRewardService.getAllDailyRewards();

    res.json({
      success: true,
      rewards,
    });
  } catch (error) {
    next(error);
  }
}

export async function createDailyReward(req: Request, res: Response, next: NextFunction) {
  try {
    const reward = await dailyRewardService.createDailyReward(req.body);

    res.status(201).json({
      success: true,
      reward,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateDailyReward(req: Request, res: Response, next: NextFunction) {
  try {
    const day = parseInt(req.params.id!, 10);
    const reward = await dailyRewardService.updateDailyReward(day, req.body);

    res.json({
      success: true,
      reward,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteDailyReward(req: Request, res: Response, next: NextFunction) {
  try {
    const day = parseInt(req.params.id!, 10);
    await dailyRewardService.deleteDailyReward(day);

    res.json({
      success: true,
      message: 'Daily reward deleted',
    });
  } catch (error) {
    next(error);
  }
}

export async function seedDailyRewards(req: Request, res: Response, next: NextFunction) {
  try {
    await dailyRewardService.seedDailyRewards();

    res.json({
      success: true,
      message: 'Daily rewards seeded successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function resetUserDailyRewards(req: Request, res: Response, next: NextFunction) {
  try {
    const targetUserId = req.params.userId!;

    await dailyRewardService.resetUserDailyReward(targetUserId);

    res.json({
      success: true,
      message: 'User daily rewards reset',
    });
  } catch (error) {
    next(error);
  }
}
