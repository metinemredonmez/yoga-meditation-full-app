import { Request, Response, NextFunction } from 'express';
import * as referralService from '../services/referralService';
import { HttpError } from '../middleware/errorHandler';

// ============================================
// Referral Code
// ============================================

export async function getReferralCode(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const referralCode = await referralService.generateReferralCode(userId);

    res.json({
      success: true,
      code: referralCode.code,
      usageCount: referralCode.usageCount,
      maxUsage: referralCode.maxUsage,
      bonusXP: referralCode.bonusXP,
    });
  } catch (error) {
    next(error);
  }
}

export async function validateCode(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = req.params;
    const result = await referralService.validateReferralCode(code!);

    if (!result.valid) {
      throw new HttpError(400, result.message || 'Invalid code');
    }

    res.json({
      success: true,
      valid: true,
      referrerName: result.referrerName,
      bonusXP: result.bonusXP,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Apply Referral Code
// ============================================

export async function applyReferralCode(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { code } = req.body;

    const result = await referralService.applyReferralCode(userId, code);

    if (!result.success) {
      throw new HttpError(400, result.message || 'Failed to apply code');
    }

    res.json({
      success: true,
      message: result.message,
      referrerName: result.referrerName,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Referral Stats
// ============================================

export async function getReferralStats(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const stats = await referralService.getReferralStats(userId);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Leaderboard
// ============================================

export async function getReferralLeaderboard(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = req.query;

    const result = await referralService.getReferralLeaderboard({
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
// Admin Functions
// ============================================

export async function updateReferralCodeSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const targetUserId = req.params.userId!;
    const { maxUsage, bonusXP, isActive, expiresAt } = req.body;

    const code = await referralService.updateReferralCodeSettings(targetUserId, {
      maxUsage,
      bonusXP,
      isActive,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    res.json({
      success: true,
      code,
    });
  } catch (error) {
    next(error);
  }
}
