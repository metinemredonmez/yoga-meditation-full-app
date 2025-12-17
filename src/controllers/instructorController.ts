import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as instructorService from '../services/instructorService';
import * as instructorEarningsService from '../services/instructorEarningsService';
import * as instructorPayoutService from '../services/instructorPayoutService';
import * as instructorAnalyticsService from '../services/instructorAnalyticsService';
import * as instructorDashboardService from '../services/instructorDashboardService';
import * as instructorReviewService from '../services/instructorReviewService';
import * as instructorFollowerService from '../services/instructorFollowerService';
import { logger } from '../utils/logger';

// ============================================
// Profile Management
// ============================================

/**
 * Get my instructor profile
 */
export async function getMyProfile(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const instructor = await instructorService.getInstructorByUserId(userId);

    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    res.json({ success: true, data: instructor });
  } catch (error) {
    logger.error({ error }, 'Failed to get instructor profile');
    res.status(500).json({ success: false, error: 'Failed to get instructor profile' });
  }
}

/**
 * Create instructor profile
 */
export async function createProfile(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const instructor = await instructorService.createInstructorProfile(userId, req.body);
    res.status(201).json({ success: true, data: instructor });
  } catch (error: any) {
    logger.error({ error }, 'Failed to create instructor profile');
    res.status(400).json({ success: false, error: error.message || 'Failed to create instructor profile' });
  }
}

/**
 * Update my instructor profile
 */
export async function updateMyProfile(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const updatedInstructor = await instructorService.updateInstructorProfile(instructor.id, req.body);
    res.json({ success: true, data: updatedInstructor });
  } catch (error: any) {
    logger.error({ error }, 'Failed to update instructor profile');
    res.status(400).json({ success: false, error: error.message || 'Failed to update instructor profile' });
  }
}

/**
 * Submit profile for verification
 */
export async function submitForVerification(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const updatedInstructor = await instructorService.submitForVerification(instructor.id);
    res.json({ success: true, data: updatedInstructor });
  } catch (error: any) {
    logger.error({ error }, 'Failed to submit for verification');
    res.status(400).json({ success: false, error: error.message || 'Failed to submit for verification' });
  }
}

// ============================================
// Dashboard
// ============================================

/**
 * Get dashboard overview
 */
export async function getDashboardOverview(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const dashboard = await instructorDashboardService.getDashboardOverview(instructor.id);
    res.json({ success: true, data: dashboard });
  } catch (error) {
    logger.error({ error }, 'Failed to get dashboard overview');
    res.status(500).json({ success: false, error: 'Failed to get dashboard overview' });
  }
}

/**
 * Get quick stats for widget
 */
export async function getQuickStats(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const stats = await instructorDashboardService.getQuickStats(instructor.id);
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error({ error }, 'Failed to get quick stats');
    res.status(500).json({ success: false, error: 'Failed to get quick stats' });
  }
}

/**
 * Get recent activity
 */
export async function getRecentActivity(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const limit = parseInt(req.query.limit as string) || 10;
    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const activity = await instructorDashboardService.getRecentActivity(instructor.id, limit);
    res.json({ success: true, data: activity });
  } catch (error) {
    logger.error({ error }, 'Failed to get recent activity');
    res.status(500).json({ success: false, error: 'Failed to get recent activity' });
  }
}

/**
 * Get performance metrics
 */
export async function getPerformanceMetrics(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const period = (req.query.period as 'week' | 'month' | 'quarter' | 'year') || 'month';
    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const metrics = await instructorDashboardService.getPerformanceMetrics(instructor.id, period);
    res.json({ success: true, data: metrics });
  } catch (error) {
    logger.error({ error }, 'Failed to get performance metrics');
    res.status(500).json({ success: false, error: 'Failed to get performance metrics' });
  }
}

// ============================================
// Content Management
// ============================================

/**
 * Get my content (programs and classes)
 */
export async function getMyContent(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const content = await instructorService.getInstructorContent(instructor.id);
    res.json({ success: true, data: content });
  } catch (error) {
    logger.error({ error }, 'Failed to get instructor content');
    res.status(500).json({ success: false, error: 'Failed to get instructor content' });
  }
}

/**
 * Get content performance
 */
export async function getContentPerformance(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const performance = await instructorDashboardService.getContentPerformance(instructor.id);
    res.json({ success: true, data: performance });
  } catch (error) {
    logger.error({ error }, 'Failed to get content performance');
    res.status(500).json({ success: false, error: 'Failed to get content performance' });
  }
}

// ============================================
// Earnings
// ============================================

/**
 * Get my earnings summary
 */
export async function getMyEarnings(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const period = startDate && endDate ? { start: startDate, end: endDate } : undefined;
    const summary = await instructorEarningsService.getEarningsSummary(instructor.id, period);
    res.json({ success: true, data: summary });
  } catch (error) {
    logger.error({ error }, 'Failed to get earnings summary');
    res.status(500).json({ success: false, error: 'Failed to get earnings summary' });
  }
}

/**
 * Get earnings history
 */
export async function getEarningsHistory(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const history = await instructorEarningsService.getEarningsHistory(instructor.id, {}, { page, limit });
    res.json({ success: true, data: history });
  } catch (error) {
    logger.error({ error }, 'Failed to get earnings history');
    res.status(500).json({ success: false, error: 'Failed to get earnings history' });
  }
}

/**
 * Get earnings breakdown
 */
export async function getEarningsBreakdown(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const startDate = new Date(req.query.startDate as string || new Date().setMonth(new Date().getMonth() - 1));
    const endDate = new Date(req.query.endDate as string || new Date());

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const breakdown = await instructorDashboardService.getEarningsBreakdown(instructor.id, { start: startDate, end: endDate });
    res.json({ success: true, data: breakdown });
  } catch (error) {
    logger.error({ error }, 'Failed to get earnings breakdown');
    res.status(500).json({ success: false, error: 'Failed to get earnings breakdown' });
  }
}

// ============================================
// Analytics
// ============================================

/**
 * Get my analytics
 */
export async function getMyAnalytics(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const analytics = await instructorAnalyticsService.getAnalyticsSummary(instructor.id);
    res.json({ success: true, data: analytics });
  } catch (error) {
    logger.error({ error }, 'Failed to get analytics');
    res.status(500).json({ success: false, error: 'Failed to get analytics' });
  }
}

/**
 * Get audience insights
 */
export async function getAudienceInsights(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const insights = await instructorAnalyticsService.getAudienceInsights(instructor.id);
    res.json({ success: true, data: insights });
  } catch (error) {
    logger.error({ error }, 'Failed to get audience insights');
    res.status(500).json({ success: false, error: 'Failed to get audience insights' });
  }
}

// ============================================
// Payouts
// ============================================

/**
 * Get payout settings
 */
export async function getPayoutSettings(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const settings = await instructorPayoutService.getPayoutSettings(instructor.id);
    res.json({ success: true, data: settings });
  } catch (error) {
    logger.error({ error }, 'Failed to get payout settings');
    res.status(500).json({ success: false, error: 'Failed to get payout settings' });
  }
}

/**
 * Update payout settings
 */
export async function updatePayoutSettings(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const settings = await instructorPayoutService.updatePayoutSettings(instructor.id, req.body);
    res.json({ success: true, data: settings });
  } catch (error: any) {
    logger.error({ error }, 'Failed to update payout settings');
    res.status(400).json({ success: false, error: error.message || 'Failed to update payout settings' });
  }
}

/**
 * Setup Stripe Connect
 */
export async function setupStripeConnect(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const result = await instructorPayoutService.setupStripeConnect(instructor.id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error({ error }, 'Failed to setup Stripe Connect');
    res.status(400).json({ success: false, error: error.message || 'Failed to setup Stripe Connect' });
  }
}

/**
 * Request a payout
 */
export async function requestPayout(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { amount, method, notes } = req.body;
    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const payout = await instructorPayoutService.requestPayout({
      instructorId: instructor.id,
      amount,
      method,
      notes,
    });
    res.status(201).json({ success: true, data: payout });
  } catch (error: any) {
    logger.error({ error }, 'Failed to request payout');
    res.status(400).json({ success: false, error: error.message || 'Failed to request payout' });
  }
}

/**
 * Get my payouts
 */
export async function getMyPayouts(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const payouts = await instructorPayoutService.getPayoutHistory(instructor.id, {}, { page, limit });
    res.json({ success: true, data: payouts });
  } catch (error) {
    logger.error({ error }, 'Failed to get payouts');
    res.status(500).json({ success: false, error: 'Failed to get payouts' });
  }
}

/**
 * Get payout stats
 */
export async function getPayoutStats(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const payouts = await instructorPayoutService.getPayoutHistory(instructor.id, {}, { page: 1, limit: 100 });
    const stats = {
      totalPayouts: payouts.total,
      pendingPayouts: payouts.items.filter(p => p.status === 'PENDING').length,
      completedPayouts: payouts.items.filter(p => p.status === 'COMPLETED').length,
    };
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error({ error }, 'Failed to get payout stats');
    res.status(500).json({ success: false, error: 'Failed to get payout stats' });
  }
}

// ============================================
// Reviews
// ============================================

/**
 * Get my reviews
 */
export async function getMyReviews(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const hasReply = req.query.hasReply === 'true' ? true : req.query.hasReply === 'false' ? false : undefined;

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const reviews = await instructorReviewService.getInstructorReviews(instructor.id, { hasReply }, { page, limit });
    res.json({ success: true, data: reviews });
  } catch (error) {
    logger.error({ error }, 'Failed to get reviews');
    res.status(500).json({ success: false, error: 'Failed to get reviews' });
  }
}

/**
 * Reply to a review
 */
export async function replyToReview(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const reviewId = req.params.reviewId!;
    const { reply } = req.body;

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const review = await instructorReviewService.replyToReview(reviewId, instructor.id, reply);
    res.json({ success: true, data: review });
  } catch (error: any) {
    logger.error({ error }, 'Failed to reply to review');
    res.status(400).json({ success: false, error: error.message || 'Failed to reply to review' });
  }
}

/**
 * Get review stats
 */
export async function getReviewStats(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const stats = await instructorReviewService.getReviewStats(instructor.id);
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error({ error }, 'Failed to get review stats');
    res.status(500).json({ success: false, error: 'Failed to get review stats' });
  }
}

// ============================================
// Followers
// ============================================

/**
 * Get my followers
 */
export async function getMyFollowers(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const followers = await instructorFollowerService.getFollowers(instructor.id, { page, limit });
    res.json({ success: true, data: followers });
  } catch (error) {
    logger.error({ error }, 'Failed to get followers');
    res.status(500).json({ success: false, error: 'Failed to get followers' });
  }
}

/**
 * Get follower stats
 */
export async function getFollowerStats(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const stats = await instructorFollowerService.getFollowerStats(instructor.id);
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error({ error }, 'Failed to get follower stats');
    res.status(500).json({ success: false, error: 'Failed to get follower stats' });
  }
}
