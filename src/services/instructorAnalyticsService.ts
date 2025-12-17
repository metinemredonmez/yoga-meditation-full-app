import { Prisma } from '@prisma/client';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

// ============================================
// View/Completion Recording
// ============================================

/**
 * Record a view for instructor content
 */
export async function recordView(
  instructorId: string,
  contentType: 'PROGRAM' | 'CLASS',
  contentId: string,
  viewerId?: string,
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Upsert daily analytics
  const analytics = await prisma.instructorAnalytics.upsert({
    where: {
      instructorId_date: {
        instructorId,
        date: today,
      },
    },
    update: {
      views: { increment: 1 },
      programViews: contentType === 'PROGRAM'
        ? await incrementProgramView(instructorId, today, contentId)
        : undefined,
    },
    create: {
      instructorId,
      date: today,
      views: 1,
      programViews: contentType === 'PROGRAM'
        ? { [contentId]: 1 }
        : undefined,
    },
  });

  // Track unique viewers (simplified - in production use Redis HyperLogLog)
  if (viewerId) {
    // Check if this viewer was already counted today
    // For simplicity, we'll just increment unique viewers
    // In production, you'd use a more sophisticated approach
    await prisma.instructorAnalytics.update({
      where: { id: analytics.id },
      data: { uniqueViewers: { increment: 1 } },
    });
  }

  logger.debug(
    { instructorId, contentType, contentId, viewerId },
    'View recorded',
  );
}

async function incrementProgramView(
  instructorId: string,
  date: Date,
  programId: string,
): Promise<Prisma.InputJsonValue> {
  const existing = await prisma.instructorAnalytics.findUnique({
    where: {
      instructorId_date: {
        instructorId,
        date,
      },
    },
    select: { programViews: true },
  });

  const programViews = (existing?.programViews as Record<string, number>) || {};
  programViews[programId] = (programViews[programId] || 0) + 1;

  return programViews;
}

/**
 * Record a completion for instructor content
 */
export async function recordCompletion(
  instructorId: string,
  contentType: 'PROGRAM' | 'CLASS',
  contentId: string,
  userId: string,
  watchTimeSeconds?: number,
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.instructorAnalytics.upsert({
    where: {
      instructorId_date: {
        instructorId,
        date: today,
      },
    },
    update: {
      completions: { increment: 1 },
      avgWatchTime: watchTimeSeconds
        ? { increment: Math.round(watchTimeSeconds / 60) }
        : undefined,
    },
    create: {
      instructorId,
      date: today,
      completions: 1,
      avgWatchTime: watchTimeSeconds ? Math.round(watchTimeSeconds / 60) : 0,
    },
  });

  logger.debug(
    { instructorId, contentType, contentId, userId },
    'Completion recorded',
  );
}

/**
 * Record a class booking
 */
export async function recordClassBooking(instructorId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.instructorAnalytics.upsert({
    where: {
      instructorId_date: {
        instructorId,
        date: today,
      },
    },
    update: {
      classBookings: { increment: 1 },
    },
    create: {
      instructorId,
      date: today,
      classBookings: 1,
    },
  });

  logger.debug({ instructorId }, 'Class booking recorded');
}

// ============================================
// Analytics Queries
// ============================================

/**
 * Get daily analytics for a specific date
 */
export async function getDailyAnalytics(instructorId: string, date: Date) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  return prisma.instructorAnalytics.findUnique({
    where: {
      instructorId_date: {
        instructorId,
        date: dayStart,
      },
    },
  });
}

/**
 * Get analytics for a date range
 */
export async function getAnalyticsRange(
  instructorId: string,
  startDate: Date,
  endDate: Date,
) {
  return prisma.instructorAnalytics.findMany({
    where: {
      instructorId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: 'asc' },
  });
}

/**
 * Get aggregated analytics for a period
 */
export async function getAggregatedAnalytics(
  instructorId: string,
  startDate: Date,
  endDate: Date,
) {
  const result = await prisma.instructorAnalytics.aggregate({
    where: {
      instructorId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      views: true,
      uniqueViewers: true,
      completions: true,
      newFollowers: true,
      classBookings: true,
      newReviews: true,
      earnings: true,
    },
    _avg: {
      avgWatchTime: true,
      rating: true,
    },
  });

  return {
    totalViews: result._sum.views || 0,
    uniqueViewers: result._sum.uniqueViewers || 0,
    completions: result._sum.completions || 0,
    newFollowers: result._sum.newFollowers || 0,
    classBookings: result._sum.classBookings || 0,
    newReviews: result._sum.newReviews || 0,
    totalEarnings: Number(result._sum.earnings || 0),
    avgWatchTime: Math.round(result._avg.avgWatchTime || 0),
    avgRating: Number(result._avg.rating || 0),
  };
}

/**
 * Get top performing content
 */
export async function getTopContent(
  instructorId: string,
  metric: 'views' | 'completions' | 'earnings',
  period: { start: Date; end: Date },
  limit: number = 10,
) {
  const analytics = await prisma.instructorAnalytics.findMany({
    where: {
      instructorId,
      date: {
        gte: period.start,
        lte: period.end,
      },
    },
    select: { programViews: true },
  });

  // Aggregate program views across the period
  const programViewsMap: Record<string, number> = {};

  for (const record of analytics) {
    const views = record.programViews as Record<string, number> | null;
    if (views) {
      for (const [programId, count] of Object.entries(views)) {
        programViewsMap[programId] = (programViewsMap[programId] || 0) + count;
      }
    }
  }

  // Sort and get top
  const sorted = Object.entries(programViewsMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  // Get program details
  const programIds = sorted.map(([id]) => id);
  const programs = await prisma.program.findMany({
    where: { id: { in: programIds } },
    select: { id: true, title: true, coverUrl: true },
  });

  const programMap = new Map(programs.map((p) => [p.id, p]));

  return sorted.map(([id, count]) => ({
    program: programMap.get(id),
    [metric]: count,
  }));
}

// ============================================
// Audience Insights
// ============================================

/**
 * Get audience insights for instructor
 */
export async function getAudienceInsights(instructorId: string) {
  const instructor = await prisma.instructorProfile.findUnique({
    where: { id: instructorId },
    include: {
      followers: {
        include: {
          user: {
            select: {
              createdAt: true,
              subscriptionTier: true,
            },
          },
        },
      },
    },
  });

  if (!instructor) {
    throw new Error('Instructor not found');
  }

  // Subscription tier distribution
  const tierDistribution: Record<string, number> = {
    FREE: 0,
    BASIC: 0,
    PREMIUM: 0,
    ENTERPRISE: 0,
  };

  // Account age distribution
  const ageDistribution: Record<string, number> = {
    'new': 0,      // < 30 days
    'regular': 0,  // 30-180 days
    'loyal': 0,    // > 180 days
  };

  const now = new Date();

  for (const follower of instructor.followers) {
    const tier = follower.user?.subscriptionTier;
    if (tier && tierDistribution[tier] !== undefined) {
      tierDistribution[tier]++;
    }

    const createdAt = follower.user?.createdAt;
    if (createdAt) {
      const ageMs = now.getTime() - createdAt.getTime();
      const ageDays = ageMs / (24 * 60 * 60 * 1000);

      if (ageDays < 30) {
        ageDistribution['new'] = (ageDistribution['new'] || 0) + 1;
      } else if (ageDays < 180) {
        ageDistribution['regular'] = (ageDistribution['regular'] || 0) + 1;
      } else {
        ageDistribution['loyal'] = (ageDistribution['loyal'] || 0) + 1;
      }
    }
  }

  return {
    totalFollowers: instructor.followers.length,
    tierDistribution,
    ageDistribution,
  };
}

// ============================================
// Daily Snapshot Generation (Cron Job)
// ============================================

/**
 * Generate daily analytics snapshot for an instructor
 */
export async function generateDailySnapshot(instructorId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Get follower count
  const totalFollowers = await prisma.instructorFollower.count({
    where: { instructorId },
  });

  // Get new followers today
  const newFollowers = await prisma.instructorFollower.count({
    where: {
      instructorId,
      followedAt: {
        gte: yesterday,
        lt: today,
      },
    },
  });

  // Get earnings for yesterday
  const earnings = await prisma.instructorEarning.aggregate({
    where: {
      instructorId,
      createdAt: {
        gte: yesterday,
        lt: today,
      },
      status: { not: 'CANCELLED' },
    },
    _sum: { netAmount: true },
  });

  // Get rating info
  const ratingStats = await prisma.instructorReview.aggregate({
    where: {
      instructorId,
      status: 'APPROVED',
    },
    _avg: { rating: true },
  });

  // Get new reviews
  const newReviews = await prisma.instructorReview.count({
    where: {
      instructorId,
      createdAt: {
        gte: yesterday,
        lt: today,
      },
    },
  });

  // Upsert analytics record
  await prisma.instructorAnalytics.upsert({
    where: {
      instructorId_date: {
        instructorId,
        date: yesterday,
      },
    },
    update: {
      totalFollowers,
      newFollowers,
      earnings: Number(earnings._sum.netAmount || 0),
      rating: Number(ratingStats._avg.rating || 0),
      newReviews,
    },
    create: {
      instructorId,
      date: yesterday,
      totalFollowers,
      newFollowers,
      earnings: Number(earnings._sum.netAmount || 0),
      rating: Number(ratingStats._avg.rating || 0),
      newReviews,
    },
  });

  logger.debug({ instructorId, date: yesterday }, 'Daily snapshot generated');
}

/**
 * Generate daily snapshots for all approved instructors
 */
export async function generateAllDailySnapshots() {
  const instructors = await prisma.instructorProfile.findMany({
    where: { status: 'APPROVED' },
    select: { id: true },
  });

  for (const instructor of instructors) {
    try {
      await generateDailySnapshot(instructor.id);
    } catch (error) {
      logger.error(
        { instructorId: instructor.id, error },
        'Failed to generate daily snapshot',
      );
    }
  }

  logger.info({ count: instructors.length }, 'All daily snapshots generated');
}

// ============================================
// Analytics Summary
// ============================================

/**
 * Get analytics summary for instructor dashboard
 */
export async function getAnalyticsSummary(instructorId: string) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const previousThirtyDays = new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    last30Days,
    previous30Days,
    last7Days,
    dailyData,
  ] = await Promise.all([
    getAggregatedAnalytics(instructorId, thirtyDaysAgo, now),
    getAggregatedAnalytics(instructorId, previousThirtyDays, thirtyDaysAgo),
    getAggregatedAnalytics(instructorId, sevenDaysAgo, now),
    getAnalyticsRange(instructorId, thirtyDaysAgo, now),
  ]);

  // Calculate trends
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return {
    last30Days,
    last7Days,
    trends: {
      views: calculateTrend(last30Days.totalViews, previous30Days.totalViews),
      completions: calculateTrend(last30Days.completions, previous30Days.completions),
      followers: calculateTrend(last30Days.newFollowers, previous30Days.newFollowers),
      earnings: calculateTrend(last30Days.totalEarnings, previous30Days.totalEarnings),
    },
    dailyData: dailyData.map((d) => ({
      date: d.date,
      views: d.views,
      completions: d.completions,
      earnings: Number(d.earnings),
    })),
  };
}
