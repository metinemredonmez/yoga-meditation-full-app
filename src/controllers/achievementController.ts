import { Request, Response, NextFunction } from 'express';
import * as achievementService from '../services/achievementService';
import { HttpError } from '../middleware/errorHandler';

// ============================================
// Public Queries
// ============================================

export async function getAchievements(req: Request, res: Response, next: NextFunction) {
  try {
    const { category, difficulty, includeSecret } = req.query;

    const achievements = await achievementService.getAchievements({
      category: category as any,
      difficulty: difficulty as any,
      includeSecret: includeSecret === 'true',
    });

    res.json({
      success: true,
      achievements,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAchievementById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id!;
    const achievement = await achievementService.getAchievementById(id);

    if (!achievement) {
      throw new HttpError(404, 'Achievement not found');
    }

    res.json({
      success: true,
      achievement,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAchievementCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await achievementService.getAchievementCategories();

    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// User Achievements
// ============================================

export async function getUserAchievements(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { category, completed } = req.query;

    const achievements = await achievementService.getUserAchievements(userId, {
      category: category as any,
      isCompleted: completed === 'true' ? true : completed === 'false' ? false : undefined,
    });

    res.json({
      success: true,
      achievements,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAchievementProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const achievementId = req.params.id!;

    const progress = await achievementService.getUserAchievementProgress(
      userId,
      achievementId,
    );

    if (!progress) {
      throw new HttpError(404, 'Achievement not found');
    }

    res.json({
      success: true,
      progress,
    });
  } catch (error) {
    next(error);
  }
}

export async function claimAchievementReward(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const achievementId = req.params.id!;

    const result = await achievementService.claimAchievementReward(
      userId,
      achievementId,
    );

    if (!result.success) {
      throw new HttpError(400, result.message || 'Failed to claim reward');
    }

    res.json({
      success: true,
      message: 'Reward claimed',
      xpAwarded: result.xpAwarded,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSecretAchievements(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const secrets = await achievementService.getSecretAchievements(userId);

    res.json({
      success: true,
      ...secrets,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserAchievementStats(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const stats = await achievementService.getUserAchievementStats(userId);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Admin Functions
// ============================================

export async function createAchievement(req: Request, res: Response, next: NextFunction) {
  try {
    const achievement = await achievementService.createAchievement(req.body);

    res.status(201).json({
      success: true,
      achievement,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAchievement(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id!;
    const achievement = await achievementService.updateAchievement(id, req.body);

    res.json({
      success: true,
      achievement,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAchievement(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id!;
    await achievementService.deleteAchievement(id);

    res.json({
      success: true,
      message: 'Achievement deleted',
    });
  } catch (error) {
    next(error);
  }
}
