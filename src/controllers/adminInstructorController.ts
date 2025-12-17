import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as instructorService from '../services/instructorService';
import * as instructorEarningsService from '../services/instructorEarningsService';
import * as instructorPayoutService from '../services/instructorPayoutService';
import * as instructorReviewService from '../services/instructorReviewService';
import * as instructorAnalyticsService from '../services/instructorAnalyticsService';
import { logger } from '../utils/logger';

// ============================================
// Instructor Management
// ============================================

export async function getAllInstructors(req: AuthRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const tier = req.query.tier as string | undefined;
    const isVerified = req.query.verified === 'true' ? true : req.query.verified === 'false' ? false : undefined;

    const instructors = await instructorService.getAllInstructors(
      { status: status as any, tier: tier as any, isVerified },
      { page, limit },
    );

    res.json({ success: true, data: instructors });
  } catch (error) {
    logger.error({ error }, 'Failed to get all instructors');
    res.status(500).json({ success: false, error: 'Failed to get all instructors' });
  }
}

export async function getInstructor(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id!;
    const instructor = await instructorService.getInstructorById(id);

    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor not found' });
    }

    res.json({ success: true, data: instructor });
  } catch (error) {
    logger.error({ error }, 'Failed to get instructor');
    res.status(500).json({ success: false, error: 'Failed to get instructor' });
  }
}

export async function approveInstructor(req: AuthRequest, res: Response) {
  try {
    const adminId = req.user!.id;
    const id = req.params.id!;
    const { tier, commissionRate, notes } = req.body;

    const instructor = await instructorService.approveInstructor(id, adminId, { tier, commissionRate, notes });
    res.json({ success: true, data: instructor });
  } catch (error: any) {
    logger.error({ error }, 'Failed to approve instructor');
    res.status(400).json({ success: false, error: error.message || 'Failed to approve instructor' });
  }
}

export async function rejectInstructor(req: AuthRequest, res: Response) {
  try {
    const adminId = req.user!.id;
    const id = req.params.id!;
    const { reason } = req.body;

    const instructor = await instructorService.rejectInstructor(id, adminId, reason);
    res.json({ success: true, data: instructor });
  } catch (error: any) {
    logger.error({ error }, 'Failed to reject instructor');
    res.status(400).json({ success: false, error: error.message || 'Failed to reject instructor' });
  }
}

export async function suspendInstructor(req: AuthRequest, res: Response) {
  try {
    const adminId = req.user!.id;
    const id = req.params.id!;
    const { reason } = req.body;

    const instructor = await instructorService.suspendInstructor(id, adminId, reason);
    res.json({ success: true, data: instructor });
  } catch (error: any) {
    logger.error({ error }, 'Failed to suspend instructor');
    res.status(400).json({ success: false, error: error.message || 'Failed to suspend instructor' });
  }
}

export async function reactivateInstructor(req: AuthRequest, res: Response) {
  try {
    const adminId = req.user!.id;
    const id = req.params.id!;

    const instructor = await instructorService.approveInstructor(id, adminId, {});
    res.json({ success: true, data: instructor });
  } catch (error: any) {
    logger.error({ error }, 'Failed to reactivate instructor');
    res.status(400).json({ success: false, error: error.message || 'Failed to reactivate instructor' });
  }
}

export async function updateInstructorTier(req: AuthRequest, res: Response) {
  try {
    const adminId = req.user!.id;
    const id = req.params.id!;
    const { tier, commissionRate, reason } = req.body;

    const instructor = await instructorService.updateInstructorTier(id, tier, commissionRate);
    logger.info({ adminId, instructorId: id, tier, reason }, 'Instructor tier updated');
    res.json({ success: true, data: instructor });
  } catch (error: any) {
    logger.error({ error }, 'Failed to update instructor tier');
    res.status(400).json({ success: false, error: error.message || 'Failed to update instructor tier' });
  }
}

export async function updateInstructorProfile(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id!;
    const instructor = await instructorService.updateInstructorProfile(id, req.body);
    res.json({ success: true, data: instructor });
  } catch (error: any) {
    logger.error({ error }, 'Failed to update instructor profile');
    res.status(400).json({ success: false, error: error.message || 'Failed to update instructor profile' });
  }
}

// ============================================
// Payout Management
// ============================================

export async function getPendingPayouts(req: AuthRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const payouts = await instructorPayoutService.getPendingPayouts({ page, limit });
    res.json({ success: true, data: payouts });
  } catch (error) {
    logger.error({ error }, 'Failed to get pending payouts');
    res.status(500).json({ success: false, error: 'Failed to get pending payouts' });
  }
}

export async function getProcessingPayouts(req: AuthRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const payouts = await instructorPayoutService.getProcessingPayouts({ page, limit });
    res.json({ success: true, data: payouts });
  } catch (error) {
    logger.error({ error }, 'Failed to get processing payouts');
    res.status(500).json({ success: false, error: 'Failed to get processing payouts' });
  }
}

export async function processPayout(req: AuthRequest, res: Response) {
  try {
    const adminId = req.user!.id;
    const payoutId = req.params.payoutId!;

    const payout = await instructorPayoutService.processPayout(payoutId, adminId);
    res.json({ success: true, data: payout });
  } catch (error: any) {
    logger.error({ error }, 'Failed to process payout');
    res.status(400).json({ success: false, error: error.message || 'Failed to process payout' });
  }
}

export async function completePayout(req: AuthRequest, res: Response) {
  try {
    const adminId = req.user!.id;
    const payoutId = req.params.payoutId!;
    const { transactionId, notes } = req.body;

    const payout = await instructorPayoutService.completePayout(payoutId, adminId, transactionId, notes);
    res.json({ success: true, data: payout });
  } catch (error: any) {
    logger.error({ error }, 'Failed to complete payout');
    res.status(400).json({ success: false, error: error.message || 'Failed to complete payout' });
  }
}

export async function failPayout(req: AuthRequest, res: Response) {
  try {
    const adminId = req.user!.id;
    const payoutId = req.params.payoutId!;
    const { reason, failedReason } = req.body;

    const payout = await instructorPayoutService.failPayout(payoutId, adminId, reason || failedReason);
    res.json({ success: true, data: payout });
  } catch (error: any) {
    logger.error({ error }, 'Failed to fail payout');
    res.status(400).json({ success: false, error: error.message || 'Failed to fail payout' });
  }
}

export async function cancelPayout(req: AuthRequest, res: Response) {
  try {
    const adminId = req.user!.id;
    const payoutId = req.params.payoutId!;
    const { reason } = req.body;

    const payout = await instructorPayoutService.cancelPayout(payoutId, adminId, reason);
    res.json({ success: true, data: payout });
  } catch (error: any) {
    logger.error({ error }, 'Failed to cancel payout');
    res.status(400).json({ success: false, error: error.message || 'Failed to cancel payout' });
  }
}

export async function runAutomaticPayouts(req: AuthRequest, res: Response) {
  try {
    const adminId = req.user!.id;
    const result = await instructorPayoutService.processAutomaticPayouts();
    logger.info({ adminId, result }, 'Automatic payouts triggered manually');
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error({ error }, 'Failed to run automatic payouts');
    res.status(500).json({ success: false, error: 'Failed to run automatic payouts' });
  }
}

// ============================================
// Review Moderation
// ============================================

export async function getPendingReviews(req: AuthRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const reviews = await instructorReviewService.getPendingReviews({ page, limit });
    res.json({ success: true, data: reviews });
  } catch (error) {
    logger.error({ error }, 'Failed to get pending reviews');
    res.status(500).json({ success: false, error: 'Failed to get pending reviews' });
  }
}

export async function getReview(req: AuthRequest, res: Response) {
  try {
    const reviewId = req.params.reviewId!;
    const review = await instructorReviewService.getReviewById(reviewId);

    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    res.json({ success: true, data: review });
  } catch (error) {
    logger.error({ error }, 'Failed to get review');
    res.status(500).json({ success: false, error: 'Failed to get review' });
  }
}

export async function moderateReview(req: AuthRequest, res: Response) {
  try {
    const adminId = req.user!.id;
    const reviewId = req.params.reviewId!;
    const { status, reason } = req.body;

    const review = await instructorReviewService.moderateReview(reviewId, adminId, status, reason);
    res.json({ success: true, data: review });
  } catch (error: any) {
    logger.error({ error }, 'Failed to moderate review');
    res.status(400).json({ success: false, error: error.message || 'Failed to moderate review' });
  }
}

// ============================================
// Earnings & Analytics
// ============================================

export async function getPlatformEarnings(req: AuthRequest, res: Response) {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    const earnings = await instructorEarningsService.getPlatformEarnings({ start: startDate, end: endDate });
    res.json({ success: true, data: earnings });
  } catch (error) {
    logger.error({ error }, 'Failed to get platform earnings');
    res.status(500).json({ success: false, error: 'Failed to get platform earnings' });
  }
}

export async function getInstructorEarnings(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const earnings = await instructorEarningsService.getEarningsHistory(id, {}, { page, limit });
    res.json({ success: true, data: earnings });
  } catch (error) {
    logger.error({ error }, 'Failed to get instructor earnings');
    res.status(500).json({ success: false, error: 'Failed to get instructor earnings' });
  }
}

export async function getInstructorAnalytics(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id!;
    const analytics = await instructorAnalyticsService.getAnalyticsSummary(id);
    res.json({ success: true, data: analytics });
  } catch (error) {
    logger.error({ error }, 'Failed to get instructor analytics');
    res.status(500).json({ success: false, error: 'Failed to get instructor analytics' });
  }
}

export async function recordEarning(req: AuthRequest, res: Response) {
  try {
    const adminId = req.user!.id;
    const id = req.params.id!;
    const { type, amount, description } = req.body;

    let earning;
    if (type === 'BONUS') {
      earning = await instructorEarningsService.recordBonus(id, amount, description || 'Admin bonus');
    } else {
      earning = await instructorEarningsService.recordEarning({
        instructorId: id,
        type,
        sourceType: 'TIP',
        grossAmount: amount,
        description,
      });
    }

    logger.info({ adminId, instructorId: id, type, amount }, 'Manual earning recorded');
    res.json({ success: true, data: earning });
  } catch (error: any) {
    logger.error({ error }, 'Failed to record earning');
    res.status(400).json({ success: false, error: error.message || 'Failed to record earning' });
  }
}

export async function generateDailySnapshots(req: AuthRequest, res: Response) {
  try {
    const adminId = req.user!.id;
    await instructorAnalyticsService.generateAllDailySnapshots();
    logger.info({ adminId }, 'Daily snapshots generation triggered');
    res.json({ success: true, message: 'Daily snapshots generated' });
  } catch (error) {
    logger.error({ error }, 'Failed to generate daily snapshots');
    res.status(500).json({ success: false, error: 'Failed to generate daily snapshots' });
  }
}

export async function updateAllStats(req: AuthRequest, res: Response) {
  try {
    const adminId = req.user!.id;
    await instructorService.updateAllInstructorStats();
    logger.info({ adminId }, 'Instructor stats update triggered');
    res.json({ success: true, message: 'Instructor stats updated' });
  } catch (error) {
    logger.error({ error }, 'Failed to update instructor stats');
    res.status(500).json({ success: false, error: 'Failed to update instructor stats' });
  }
}

export async function getInstructorPayoutSettings(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id!;
    const settings = await instructorPayoutService.getPayoutSettings(id);
    res.json({ success: true, data: settings });
  } catch (error) {
    logger.error({ error }, 'Failed to get payout settings');
    res.status(500).json({ success: false, error: 'Failed to get payout settings' });
  }
}

export async function getInstructorPayouts(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const payouts = await instructorPayoutService.getPayoutHistory(id, {}, { page, limit });
    res.json({ success: true, data: payouts });
  } catch (error) {
    logger.error({ error }, 'Failed to get instructor payouts');
    res.status(500).json({ success: false, error: 'Failed to get instructor payouts' });
  }
}
