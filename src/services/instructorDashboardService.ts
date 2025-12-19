import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import * as instructorEarningsService from './instructorEarningsService';
import * as instructorAnalyticsService from './instructorAnalyticsService';
import * as instructorFollowerService from './instructorFollowerService';
import * as instructorReviewService from './instructorReviewService';

// ============================================
// Dashboard Overview
// ============================================

/**
 * Get comprehensive dashboard overview for instructor
 */
export async function getDashboardOverview(instructorId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get instructor profile
  const instructor = await prisma.instructor_profiles.findUnique({
    where: { id: instructorId },
    select: {
      id: true,
      displayName: true,
      slug: true,
      status: true,
      tier: true,
      isVerified: true,
      averageRating: true,
      totalReviews: true,
      totalStudents: true,
      totalPrograms: true,
      totalClasses: true,
      commissionRate: true,
    },
  });

  if (!instructor) {
    throw new Error('Instructor not found');
  }

  // Get earnings data
  const [
    earningsThisMonth,
    earningsLastMonth,
    earningsAllTime,
    pendingBalance,
  ] = await Promise.all([
    instructorEarningsService.getEarningsSummary(instructorId, {
      start: startOfMonth,
      end: now,
    }),
    instructorEarningsService.getEarningsSummary(instructorId, {
      start: startOfLastMonth,
      end: endOfLastMonth,
    }),
    instructorEarningsService.getEarningsSummary(instructorId),
    instructorEarningsService.getPendingAmount(instructorId),
  ]);

  // Get analytics data
  const analytics = await instructorAnalyticsService.getAggregatedAnalytics(
    instructorId,
    sevenDaysAgo,
    now,
  );

  // Get follower stats
  const followerStats = await instructorFollowerService.getFollowerStats(instructorId);

  // Count active content
  const [programCount, upcomingClassCount] = await Promise.all([
    prisma.programs.count({
      where: {
        OR: [
          { instructorId: instructor.id },
          { coInstructorIds: { has: instructor.id } },
        ],
      },
    }),
    prisma.classes.count({
      where: {
        instructorId: instructor.id,
        schedule: { gte: now },
      },
    }),
  ]);

  return {
    profile: instructor,
    earnings: {
      thisMonth: earningsThisMonth.totalNet,
      lastMonth: earningsLastMonth.totalNet,
      allTime: earningsAllTime.totalNet,
      pendingBalance,
      platformFeeRate: Number(instructor.commissionRate),
    },
    stats: {
      totalStudents: instructor.totalStudents,
      averageRating: Number(instructor.averageRating),
      totalReviews: instructor.totalReviews,
      totalFollowers: followerStats.total,
      newFollowersThisWeek: followerStats.newThisWeek,
    },
    content: {
      totalPrograms: programCount,
      totalClasses: instructor.totalClasses,
      upcomingClasses: upcomingClassCount,
    },
    weeklyAnalytics: {
      views: analytics.totalViews,
      completions: analytics.completions,
      avgWatchTime: analytics.avgWatchTime,
    },
  };
}

// ============================================
// Recent Activity
// ============================================

/**
 * Get recent activity for instructor dashboard
 */
export async function getRecentActivity(instructorId: string, limit: number = 10) {
  const instructor = await prisma.instructor_profiles.findUnique({
    where: { id: instructorId },
  });

  if (!instructor) {
    throw new Error('Instructor not found');
  }

  // Get recent enrollments/bookings
  const recentBookings = await prisma.bookings.findMany({
    where: {
      classes: {
        instructorId: instructor.userId,
      },
      status: 'CONFIRMED',
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      users: {
        select: { id: true, firstName: true, lastName: true },
      },
      classes: {
        select: { id: true, title: true },
      },
    },
  });

  // Get recent reviews
  const recentReviews = await prisma.instructor_reviews.findMany({
    where: {
      instructorId,
      status: 'APPROVED',
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      users: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  // Get recent earnings
  const recentEarnings = await prisma.instructor_earnings.findMany({
    where: {
      instructorId,
      status: { not: 'CANCELLED' },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  // Get recent followers
  const recentFollowers = await prisma.instructor_followers.findMany({
    where: { instructorId },
    orderBy: { followedAt: 'desc' },
    take: limit,
    include: {
      users: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  // Combine and sort by date
  const activities: Array<{
    type: 'booking' | 'review' | 'earning' | 'follower';
    date: Date;
    data: unknown;
  }> = [
    ...recentBookings.map((b) => ({
      type: 'booking' as const,
      date: b.createdAt,
      data: {
        users: b.users,
        classes: b.classes,
      },
    })),
    ...recentReviews.map((r) => ({
      type: 'review' as const,
      date: r.createdAt,
      data: {
        id: r.id,
        rating: r.rating,
        title: r.title,
        users: r.users,
      },
    })),
    ...recentEarnings.map((e) => ({
      type: 'earning' as const,
      date: e.createdAt,
      data: {
        type: e.type,
        netAmount: Number(e.netAmount),
        description: e.description,
      },
    })),
    ...recentFollowers.map((f) => ({
      type: 'follower' as const,
      date: f.followedAt,
      data: {
        users: f.users,
      },
    })),
  ];

  // Sort by date and limit
  activities.sort((a, b) => b.date.getTime() - a.date.getTime());

  return activities.slice(0, limit);
}

// ============================================
// Performance Metrics
// ============================================

/**
 * Get performance metrics for a period
 */
export async function getPerformanceMetrics(
  instructorId: string,
  period: 'week' | 'month' | 'quarter' | 'year' = 'month',
) {
  const now = new Date();
  let startDate: Date;
  let previousStartDate: Date;
  let previousEndDate: Date;

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      previousEndDate = new Date(startDate);
      previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      previousEndDate = new Date(startDate);
      previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      break;
    case 'quarter':
      const currentQuarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
      previousEndDate = new Date(startDate);
      previousStartDate = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      previousEndDate = new Date(startDate);
      previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
      break;
  }

  // Get current period analytics
  const currentAnalytics = await instructorAnalyticsService.getAggregatedAnalytics(
    instructorId,
    startDate,
    now,
  );

  // Get previous period analytics
  const previousAnalytics = await instructorAnalyticsService.getAggregatedAnalytics(
    instructorId,
    previousStartDate,
    previousEndDate,
  );

  // Get current period earnings
  const currentEarnings = await instructorEarningsService.getEarningsSummary(
    instructorId,
    { start: startDate, end: now },
  );

  // Get previous period earnings
  const previousEarnings = await instructorEarningsService.getEarningsSummary(
    instructorId,
    { start: previousStartDate, end: previousEndDate },
  );

  // Calculate completion rate
  const completionRate =
    currentAnalytics.totalViews > 0
      ? (currentAnalytics.completions / currentAnalytics.totalViews) * 100
      : 0;

  // Calculate growth percentages
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return {
    period,
    current: {
      views: currentAnalytics.totalViews,
      completions: currentAnalytics.completions,
      completionRate: Math.round(completionRate * 100) / 100,
      newFollowers: currentAnalytics.newFollowers,
      earnings: currentEarnings.totalNet,
      avgWatchTime: currentAnalytics.avgWatchTime,
    },
    previous: {
      views: previousAnalytics.totalViews,
      completions: previousAnalytics.completions,
      newFollowers: previousAnalytics.newFollowers,
      earnings: previousEarnings.totalNet,
    },
    growth: {
      views: calculateGrowth(currentAnalytics.totalViews, previousAnalytics.totalViews),
      completions: calculateGrowth(currentAnalytics.completions, previousAnalytics.completions),
      followers: calculateGrowth(currentAnalytics.newFollowers, previousAnalytics.newFollowers),
      earnings: calculateGrowth(currentEarnings.totalNet, previousEarnings.totalNet),
    },
  };
}

// ============================================
// Content Performance
// ============================================

/**
 * Get content performance metrics
 */
export async function getContentPerformance(instructorId: string) {
  const instructor = await prisma.instructor_profiles.findUnique({
    where: { id: instructorId },
  });

  if (!instructor) {
    throw new Error('Instructor not found');
  }

  // Get programs with stats
  const programs = await prisma.programs.findMany({
    where: {
      OR: [
        { instructorId: instructor.userId },
        { coInstructorIds: { has: instructor.userId } },
      ],
    },
    include: {
      sessions: {
        select: { id: true },
      },
      tags: true,
    },
  });

  // Get earnings by content
  const earningsByProgram = await instructorEarningsService.getEarningsByContent(
    instructorId,
    'PROGRAM',
  );

  // Map earnings to programs
  const programPerformance = programs.map((program) => {
    const earnings = earningsByProgram.find((e) => e.sourceId === program.id);
    return {
      id: program.id,
      title: program.title,
      level: program.level,
      sessionCount: program.sessions.length,
      earnings: earnings?.totalNet || 0,
      purchaseCount: earnings?.count || 0,
    };
  });

  // Get upcoming classes
  const upcomingClasses = await prisma.classes.findMany({
    where: {
      instructorId: instructor.userId,
      schedule: { gte: new Date() },
    },
    orderBy: { schedule: 'asc' },
    take: 10,
    include: {
      _count: {
        select: { bookings: true },
      },
    },
  });

  return {
    programs: programPerformance.sort((a, b) => b.earnings - a.earnings),
    upcomingClasses: upcomingClasses.map((c) => ({
      id: c.id,
      title: c.title,
      schedule: c.schedule,
      bookings: c._count.bookings,
    })),
  };
}

// ============================================
// Quick Stats
// ============================================

/**
 * Get quick stats for instructor widget
 */
export async function getQuickStats(instructorId: string) {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const [
    todayEarnings,
    pendingReviews,
    newFollowersToday,
    upcomingClassesCount,
  ] = await Promise.all([
    prisma.instructor_earnings.aggregate({
      where: {
        instructorId,
        createdAt: { gte: startOfDay },
        status: { not: 'CANCELLED' },
      },
      _sum: { netAmount: true },
    }),
    prisma.instructor_reviews.count({
      where: {
        instructorId,
        instructorReply: null,
        status: 'APPROVED',
      },
    }),
    prisma.instructor_followers.count({
      where: {
        instructorId,
        followedAt: { gte: startOfDay },
      },
    }),
    prisma.classes.count({
      where: {
        users: {
          instructor_profiles: {
            id: instructorId,
          },
        },
        schedule: {
          gte: now,
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  return {
    todayEarnings: Number(todayEarnings._sum.netAmount || 0),
    pendingReviewsToReply: pendingReviews,
    newFollowersToday,
    upcomingClassesThisWeek: upcomingClassesCount,
  };
}

// ============================================
// Earnings Breakdown
// ============================================

/**
 * Get detailed earnings breakdown
 */
export async function getEarningsBreakdown(
  instructorId: string,
  period: { start: Date; end: Date },
) {
  const summary = await instructorEarningsService.getEarningsSummary(
    instructorId,
    period,
  );

  const topContent = await instructorEarningsService.getTopEarningContent(
    instructorId,
    5,
  );

  return {
    summary,
    topContent,
  };
}
