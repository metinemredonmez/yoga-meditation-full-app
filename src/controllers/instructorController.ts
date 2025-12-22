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
// Dashboard
// ============================================

/**
 * Get instructor dashboard data
 */
export async function getDashboard(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const { prisma } = await import('../utils/database');

    // Get instructor's classes
    const classes = await prisma.classes.findMany({
      where: { instructorId: userId },
    });

    // Get instructor's programs
    const programs = await prisma.programs.findMany({
      where: { instructorId: userId },
    });

    // Get bookings for instructor's classes
    const classIds = classes.map(c => c.id);
    const bookings = classIds.length > 0 ? await prisma.bookings.findMany({
      where: {
        classId: { in: classIds },
        status: 'CONFIRMED',
      },
      distinct: ['userId'],
    }) : [];

    // Get this month's data
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newClassesThisMonth = classes.filter(c => new Date(c.createdAt) >= startOfMonth).length;
    const pendingPrograms = programs.filter(p => p.status === 'PENDING').length;

    res.json({
      success: true,
      data: {
        totalClasses: classes.length,
        newClassesThisMonth,
        totalPrograms: programs.length,
        pendingPrograms,
        totalStudents: bookings.length,
        newStudentsThisMonth: 0,
        totalViews: 0,
        totalEarnings: 0,
        monthlyEarnings: 0,
        averageRating: parseFloat(instructor.averageRating?.toString() || '0'),
        totalReviews: instructor.totalReviews || 0,
        watchTime: 0,
        growth: 12,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get instructor dashboard');
    res.status(500).json({ success: false, error: 'Failed to get dashboard data' });
  }
}

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

// ============================================
// Classes Management
// ============================================

/**
 * Get my classes
 */
export async function getMyClasses(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const classes = await instructorService.getInstructorClasses(instructor.id);

    // Filter by status if provided
    let filteredClasses = classes;
    if (status) {
      filteredClasses = classes.filter((c: any) => c.status === status);
    }

    // Filter by search if provided
    if (search) {
      const searchLower = search.toLowerCase();
      filteredClasses = filteredClasses.filter((c: any) =>
        c.title?.toLowerCase().includes(searchLower) ||
        c.description?.toLowerCase().includes(searchLower)
      );
    }

    // Paginate
    const start = (page - 1) * limit;
    const paginatedClasses = filteredClasses.slice(start, start + limit);

    res.json({
      success: true,
      items: paginatedClasses,
      total: filteredClasses.length,
      page,
      limit,
      totalPages: Math.ceil(filteredClasses.length / limit),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get my classes');
    res.status(500).json({ success: false, error: 'Failed to get classes' });
  }
}

/**
 * Get single class by ID
 */
export async function getMyClassById(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const classId = req.params.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const classes = await instructorService.getInstructorClasses(instructor.id);
    const classItem = classes.find((c: any) => c.id === classId);

    if (!classItem) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }

    res.json({ success: true, data: classItem });
  } catch (error) {
    logger.error({ error }, 'Failed to get class');
    res.status(500).json({ success: false, error: 'Failed to get class' });
  }
}

/**
 * Create a new class
 */
export async function createMyClass(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const { title, description, duration, level, videoUrl, thumbnailUrl, programId, poseIds } = req.body;

    const { prisma } = await import('../utils/database');
    const newClass = await prisma.classes.create({
      data: {
        title,
        description,
        duration: duration || 30,
        level: level || 'BEGINNER',
        videoUrl,
        thumbnailUrl,
        instructorId: userId,
        programId,
        status: 'DRAFT',
        poseIds: poseIds || [],
      },
    });

    res.status(201).json({ success: true, data: newClass });
  } catch (error: any) {
    logger.error({ error }, 'Failed to create class');
    res.status(400).json({ success: false, error: error.message || 'Failed to create class' });
  }
}

/**
 * Update a class
 */
export async function updateMyClass(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const classId = req.params.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const { prisma } = await import('../utils/database');

    // Verify ownership
    const existingClass = await prisma.classes.findUnique({ where: { id: classId } });
    if (!existingClass || existingClass.instructorId !== userId) {
      return res.status(404).json({ success: false, error: 'Class not found or access denied' });
    }

    const { title, description, duration, level, videoUrl, thumbnailUrl, programId, poseIds } = req.body;

    const updatedClass = await prisma.classes.update({
      where: { id: classId },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(duration && { duration }),
        ...(level && { level }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl }),
        ...(programId !== undefined && { programId }),
        ...(poseIds && { poseIds }),
      },
    });

    res.json({ success: true, data: updatedClass });
  } catch (error: any) {
    logger.error({ error }, 'Failed to update class');
    res.status(400).json({ success: false, error: error.message || 'Failed to update class' });
  }
}

/**
 * Delete a class
 */
export async function deleteMyClass(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const classId = req.params.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const { prisma } = await import('../utils/database');

    // Verify ownership
    const existingClass = await prisma.classes.findUnique({ where: { id: classId } });
    if (!existingClass || existingClass.instructorId !== userId) {
      return res.status(404).json({ success: false, error: 'Class not found or access denied' });
    }

    await prisma.classes.delete({ where: { id: classId } });

    res.json({ success: true, message: 'Class deleted successfully' });
  } catch (error: any) {
    logger.error({ error }, 'Failed to delete class');
    res.status(400).json({ success: false, error: error.message || 'Failed to delete class' });
  }
}

/**
 * Submit class for review
 */
export async function submitClassForReview(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const classId = req.params.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const { prisma } = await import('../utils/database');

    // Verify ownership
    const existingClass = await prisma.classes.findUnique({ where: { id: classId } });
    if (!existingClass || existingClass.instructorId !== userId) {
      return res.status(404).json({ success: false, error: 'Class not found or access denied' });
    }

    const updatedClass = await prisma.classes.update({
      where: { id: classId },
      data: { status: 'PENDING' },
    });

    res.json({ success: true, data: updatedClass });
  } catch (error: any) {
    logger.error({ error }, 'Failed to submit class for review');
    res.status(400).json({ success: false, error: error.message || 'Failed to submit class for review' });
  }
}

// ============================================
// Programs Management
// ============================================

/**
 * Get my programs
 */
export async function getMyPrograms(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const programs = await instructorService.getInstructorPrograms(instructor.id);

    // Filter by status if provided
    let filteredPrograms = programs;
    if (status) {
      filteredPrograms = programs.filter((p: any) => p.status === status);
    }

    // Filter by search if provided
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPrograms = filteredPrograms.filter((p: any) =>
        p.title?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      );
    }

    // Paginate
    const start = (page - 1) * limit;
    const paginatedPrograms = filteredPrograms.slice(start, start + limit);

    res.json({
      success: true,
      items: paginatedPrograms,
      total: filteredPrograms.length,
      page,
      limit,
      totalPages: Math.ceil(filteredPrograms.length / limit),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get my programs');
    res.status(500).json({ success: false, error: 'Failed to get programs' });
  }
}

/**
 * Get single program by ID
 */
export async function getMyProgramById(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const programId = req.params.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const programs = await instructorService.getInstructorPrograms(instructor.id);
    const program = programs.find((p: any) => p.id === programId);

    if (!program) {
      return res.status(404).json({ success: false, error: 'Program not found' });
    }

    res.json({ success: true, data: program });
  } catch (error) {
    logger.error({ error }, 'Failed to get program');
    res.status(500).json({ success: false, error: 'Failed to get program' });
  }
}

/**
 * Create a new program
 */
export async function createMyProgram(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const { title, description, level, durationWeeks, thumbnailUrl, coverImageUrl, tagIds } = req.body;

    const { prisma } = await import('../utils/database');
    const newProgram = await prisma.programs.create({
      data: {
        title,
        description,
        level: level || 'BEGINNER',
        durationWeeks: durationWeeks || 4,
        thumbnailUrl,
        imageUrl: coverImageUrl,
        instructorId: userId,
        status: 'DRAFT',
        tagIds: tagIds || [],
      },
    });

    res.status(201).json({ success: true, data: newProgram });
  } catch (error: any) {
    logger.error({ error }, 'Failed to create program');
    res.status(400).json({ success: false, error: error.message || 'Failed to create program' });
  }
}

/**
 * Update a program
 */
export async function updateMyProgram(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const programId = req.params.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const { prisma } = await import('../utils/database');

    // Verify ownership
    const existingProgram = await prisma.programs.findUnique({ where: { id: programId } });
    if (!existingProgram || existingProgram.instructorId !== userId) {
      return res.status(404).json({ success: false, error: 'Program not found or access denied' });
    }

    const { title, description, level, durationWeeks, thumbnailUrl, coverImageUrl, tagIds } = req.body;

    const updatedProgram = await prisma.programs.update({
      where: { id: programId },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(level && { level }),
        ...(durationWeeks && { durationWeeks }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl }),
        ...(coverImageUrl !== undefined && { imageUrl: coverImageUrl }),
        ...(tagIds && { tagIds }),
      },
    });

    res.json({ success: true, data: updatedProgram });
  } catch (error: any) {
    logger.error({ error }, 'Failed to update program');
    res.status(400).json({ success: false, error: error.message || 'Failed to update program' });
  }
}

/**
 * Delete a program
 */
export async function deleteMyProgram(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const programId = req.params.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const { prisma } = await import('../utils/database');

    // Verify ownership
    const existingProgram = await prisma.programs.findUnique({ where: { id: programId } });
    if (!existingProgram || existingProgram.instructorId !== userId) {
      return res.status(404).json({ success: false, error: 'Program not found or access denied' });
    }

    await prisma.programs.delete({ where: { id: programId } });

    res.json({ success: true, message: 'Program deleted successfully' });
  } catch (error: any) {
    logger.error({ error }, 'Failed to delete program');
    res.status(400).json({ success: false, error: error.message || 'Failed to delete program' });
  }
}

/**
 * Submit program for review
 */
export async function submitProgramForReview(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const programId = req.params.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const { prisma } = await import('../utils/database');

    // Verify ownership
    const existingProgram = await prisma.programs.findUnique({ where: { id: programId } });
    if (!existingProgram || existingProgram.instructorId !== userId) {
      return res.status(404).json({ success: false, error: 'Program not found or access denied' });
    }

    const updatedProgram = await prisma.programs.update({
      where: { id: programId },
      data: { status: 'PENDING' },
    });

    res.json({ success: true, data: updatedProgram });
  } catch (error: any) {
    logger.error({ error }, 'Failed to submit program for review');
    res.status(400).json({ success: false, error: error.message || 'Failed to submit program for review' });
  }
}

// ============================================
// Students
// ============================================

/**
 * Get my students
 */
export async function getMyStudents(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const classId = req.query.classId as string | undefined;
    const programId = req.query.programId as string | undefined;

    const instructor = await instructorService.getInstructorByUserId(userId);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor profile not found' });
    }

    const { prisma } = await import('../utils/database');

    // Get classes created by this instructor
    const instructorClasses = await prisma.classes.findMany({
      where: { instructorId: userId },
      select: { id: true },
    });
    const classIds = instructorClasses.map(c => c.id);

    // Build where clause for bookings
    const whereClause: any = {
      status: 'CONFIRMED',
    };

    if (classId) {
      whereClause.classId = classId;
    } else {
      whereClause.classId = { in: classIds };
    }

    // Get bookings with user details
    const bookings = await prisma.bookings.findMany({
      where: whereClause,
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
          },
        },
      },
      distinct: ['userId'],
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalCount = await prisma.bookings.groupBy({
      by: ['userId'],
      where: whereClause,
    });

    const students = bookings.map(b => ({
      id: b.users.id,
      name: `${b.users.firstName || ''} ${b.users.lastName || ''}`.trim() || 'Unknown',
      email: b.users.email,
      joinedAt: b.createdAt.toISOString(),
      classesCompleted: 0, // Would need more complex query
      lastActive: b.createdAt.toISOString(),
    }));

    res.json({
      success: true,
      items: students,
      total: totalCount.length,
      page,
      limit,
      totalPages: Math.ceil(totalCount.length / limit),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get students');
    res.status(500).json({ success: false, error: 'Failed to get students' });
  }
}

// ============================================
// Settings
// ============================================

/**
 * Get instructor settings
 */
export async function getSettings(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { prisma } = await import('../utils/database');

    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        instructor_profiles: {
          include: {
            instructor_payout_settings: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Get payout settings from instructor_payout_settings table
    const payoutSettings = user.instructor_profiles?.instructor_payout_settings;
    const bankDetails = payoutSettings?.bankDetails as {
      bankCountry?: string;
      bankCountryCode?: string;
      bankName?: string;
      iban?: string;
      swiftCode?: string;
      accountHolderName?: string;
    } | null;

    const settings = {
      // Profile
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      phone: user.phoneNumber || '',
      bio: user.bio || '',
      avatarUrl: user.avatarUrl || '',
      specialties: user.instructor_profiles?.specializations || [],

      // Notifications (from database)
      emailNotifications: user.emailNotifications ?? true,
      pushNotifications: user.pushNotifications ?? true,
      newStudentAlert: user.newStudentAlert ?? true,
      reviewAlert: user.reviewAlert ?? true,
      earningsAlert: user.earningsAlert ?? true,

      // Payout (from instructor_payout_settings table)
      payoutMethod: payoutSettings?.preferredMethod === 'PAYPAL' ? 'paypal' : 'bank',
      bankCountry: bankDetails?.bankCountry || 'turkey',
      bankCountryCode: bankDetails?.bankCountryCode || '',
      bankName: bankDetails?.bankName || '',
      iban: bankDetails?.iban || '',
      swiftCode: bankDetails?.swiftCode || '',
      accountHolderName: bankDetails?.accountHolderName || '',
      paypalEmail: payoutSettings?.paypalEmail || '',

      // Privacy (from database)
      profilePublic: user.profilePublic ?? true,
      showEarnings: user.showEarnings ?? false,
      showStudentCount: user.showStudentCount ?? true,
    };

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get instructor settings');
    res.status(500).json({ success: false, error: 'Failed to get settings' });
  }
}

/**
 * Update instructor settings
 */
export async function updateSettings(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { prisma } = await import('../utils/database');
    const data = req.body;

    // Update user profile with all settings
    await prisma.users.update({
      where: { id: userId },
      data: {
        // Profile
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phone,
        bio: data.bio,
        avatarUrl: data.avatarUrl,
        // Notifications
        emailNotifications: data.emailNotifications,
        pushNotifications: data.pushNotifications,
        newStudentAlert: data.newStudentAlert,
        reviewAlert: data.reviewAlert,
        earningsAlert: data.earningsAlert,
        // Privacy
        profilePublic: data.profilePublic,
        showEarnings: data.showEarnings,
        showStudentCount: data.showStudentCount,
      },
    });

    // Update instructor profile bio if exists
    const instructor = await prisma.instructor_profiles.findUnique({
      where: { userId },
    });

    if (instructor) {
      await prisma.instructor_profiles.update({
        where: { userId },
        data: {
          bio: data.bio,
          shortBio: data.bio?.substring(0, 160),
        },
      });

      // Update or create payout settings
      const payoutMethod = data.payoutMethod === 'paypal' ? 'PAYPAL' : 'BANK_TRANSFER';
      const bankDetails = {
        bankCountry: data.bankCountry || 'turkey',
        bankCountryCode: data.bankCountryCode || '',
        bankName: data.bankName || '',
        iban: data.iban || '',
        swiftCode: data.swiftCode || '',
        accountHolderName: data.accountHolderName || '',
      };

      await prisma.instructor_payout_settings.upsert({
        where: { instructorId: instructor.id },
        create: {
          instructorId: instructor.id,
          preferredMethod: payoutMethod as any,
          bankDetails: bankDetails,
          paypalEmail: data.paypalEmail || null,
        },
        update: {
          preferredMethod: payoutMethod as any,
          bankDetails: bankDetails,
          paypalEmail: data.paypalEmail || null,
        },
      });
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    logger.error({ error }, 'Failed to update instructor settings');
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
}
