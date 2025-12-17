import { Request, Response, NextFunction } from 'express';
import * as questService from '../services/questService';
import { HttpError } from '../middleware/errorHandler';

// ============================================
// Get Quests
// ============================================

export async function getQuests(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { type } = req.query;

    const quests = await questService.getUserQuests(userId, type as any);

    res.json({
      success: true,
      quests,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDailyQuests(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const quests = await questService.getDailyQuests(userId);

    res.json({
      success: true,
      quests,
    });
  } catch (error) {
    next(error);
  }
}

export async function getWeeklyQuests(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const quests = await questService.getWeeklyQuests(userId);

    res.json({
      success: true,
      quests,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMonthlyQuests(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const quests = await questService.getMonthlyQuests(userId);

    res.json({
      success: true,
      quests,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Quest Rewards
// ============================================

export async function claimQuestReward(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const questId = req.params.id!;

    const result = await questService.claimQuestReward(userId, questId);

    if (!result.success) {
      throw new HttpError(400, result.message || 'Failed to claim reward');
    }

    res.json({
      success: true,
      message: 'Quest reward claimed',
      xpAwarded: result.xpAwarded,
      bonusReward: result.bonusReward,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Quest Stats
// ============================================

export async function getQuestStats(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const stats = await questService.getUserQuestStats(userId);

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

export async function getActiveQuests(req: Request, res: Response, next: NextFunction) {
  try {
    const { type } = req.query;
    const quests = await questService.getActiveQuests(type as any);

    res.json({
      success: true,
      quests,
    });
  } catch (error) {
    next(error);
  }
}

export async function createQuest(req: Request, res: Response, next: NextFunction) {
  try {
    const quest = await questService.createQuest(req.body);

    res.status(201).json({
      success: true,
      quest,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateQuest(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id!;
    const quest = await questService.updateQuest(id, req.body);

    res.json({
      success: true,
      quest,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteQuest(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id!;
    await questService.deleteQuest(id);

    res.json({
      success: true,
      message: 'Quest deleted',
    });
  } catch (error) {
    next(error);
  }
}
