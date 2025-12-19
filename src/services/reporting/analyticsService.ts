import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Real-time Stats
export const getRealtimeStats = async () => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const [
    activeUsersLastHour,
    newUsersToday,
    revenueToday,
    activeSubscriptions,
  ] = await Promise.all([
    // Active users in last hour (based on video progress or any activity)
    prisma.video_progress.groupBy({
      by: ['userId'],
      where: { updatedAt: { gte: hourAgo } },
    }).then(r => r.length),

    // New users today
    prisma.users.count({
      where: { createdAt: { gte: todayStart } },
    }),

    // Revenue today
    prisma.payments.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: todayStart },
      },
      _sum: { amount: true },
    }),

    // Active subscriptions
    prisma.subscriptions.count({
      where: { status: 'ACTIVE' },
    }),
  ]);

  return {
    activeUsersLastHour,
    newUsersToday,
    revenueToday: Number(revenueToday._sum.amount || 0) / 100,
    activeSubscriptions,
    timestamp: now,
  };
};

// User Analytics
export const getUserAnalytics = async (
  dateFrom: Date,
  dateTo: Date,
  filters?: Record<string, unknown>
) => {
  const [
    totalUsers,
    newUsers,
    usersByRole,
    usersBySubscription,
    retentionRate,
  ] = await Promise.all([
    prisma.users.count(),
    prisma.users.count({
      where: { createdAt: { gte: dateFrom, lte: dateTo } },
    }),
    prisma.users.groupBy({
      by: ['role'],
      _count: true,
    }),
    prisma.users.groupBy({
      by: ['subscriptionTier'],
      _count: true,
    }),
    calculateRetentionRate(dateFrom, dateTo),
  ]);

  // Daily breakdown
  const dailySignups = await prisma.$queryRaw<{ date: Date; count: bigint }[]>`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM users
    WHERE created_at >= ${dateFrom} AND created_at <= ${dateTo}
    GROUP BY DATE(created_at)
    ORDER BY date
  `;

  return {
    totalUsers,
    newUsers,
    usersByRole: usersByRole.map(u => ({ role: u.role, count: u._count })),
    usersBySubscription: usersBySubscription.map(u => ({
      tier: u.subscriptionTier,
      count: u._count,
    })),
    retentionRate,
    dailySignups: dailySignups.map(d => ({
      date: d.date,
      count: Number(d.count),
    })),
    period: { from: dateFrom, to: dateTo },
  };
};

// Revenue Analytics
export const getRevenueAnalytics = async (
  dateFrom: Date,
  dateTo: Date,
  filters?: Record<string, unknown>
) => {
  const [totalRevenue, transactionCount, averageOrderValue, revenueByProvider] =
    await Promise.all([
      prisma.payments.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: dateFrom, lte: dateTo },
        },
        _sum: { amount: true },
      }),
      prisma.payments.count({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: dateFrom, lte: dateTo },
        },
      }),
      prisma.payments.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: dateFrom, lte: dateTo },
        },
        _avg: { amount: true },
      }),
      prisma.payments.groupBy({
        by: ['provider'],
        where: {
          status: 'COMPLETED',
          createdAt: { gte: dateFrom, lte: dateTo },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

  // Daily revenue
  const dailyRevenue = await prisma.$queryRaw<{ date: Date; revenue: bigint; count: bigint }[]>`
    SELECT DATE(created_at) as date, SUM(amount) as revenue, COUNT(*) as count
    FROM payments
    WHERE status = 'COMPLETED' AND created_at >= ${dateFrom} AND created_at <= ${dateTo}
    GROUP BY DATE(created_at)
    ORDER BY date
  `;

  return {
    totalRevenue: Number(totalRevenue._sum.amount || 0) / 100,
    transactionCount,
    averageOrderValue: Number(averageOrderValue._avg.amount || 0) / 100,
    revenueByProvider: revenueByProvider.map(r => ({
      provider: r.provider,
      revenue: Number(r._sum.amount || 0) / 100,
      count: r._count,
    })),
    dailyRevenue: dailyRevenue.map(d => ({
      date: d.date,
      revenue: Number(d.revenue) / 100,
      transactions: Number(d.count),
    })),
    period: { from: dateFrom, to: dateTo },
  };
};

// Subscription Analytics
export const getSubscriptionAnalytics = async (
  dateFrom: Date,
  dateTo: Date,
  filters?: Record<string, unknown>
) => {
  const [
    totalSubscriptions,
    activeSubscriptions,
    newSubscriptions,
    cancelledSubscriptions,
    subscriptionsByTier,
    subscriptionsByStatus,
  ] = await Promise.all([
    prisma.subscriptions.count(),
    prisma.subscriptions.count({ where: { status: 'ACTIVE' } }),
    prisma.subscriptions.count({
      where: { createdAt: { gte: dateFrom, lte: dateTo } },
    }),
    prisma.subscriptions.count({
      where: {
        status: { in: ['CANCELLED', 'CANCELED'] },
        updatedAt: { gte: dateFrom, lte: dateTo },
      },
    }),
    prisma.subscriptions.count(),
    prisma.subscriptions.groupBy({
      by: ['status'],
      _count: true,
    }),
  ]);

  const churnRate =
    activeSubscriptions > 0
      ? (cancelledSubscriptions / activeSubscriptions) * 100
      : 0;

  return {
    totalSubscriptions,
    activeSubscriptions,
    newSubscriptions,
    cancelledSubscriptions,
    churnRate: Math.round(churnRate * 100) / 100,
    subscriptionsByTier: [],
    subscriptionsByStatus: subscriptionsByStatus.map(s => ({
      status: s.status,
      count: s._count,
    })),
    period: { from: dateFrom, to: dateTo },
  };
};

// Content Analytics
export const getContentAnalytics = async (
  dateFrom: Date,
  dateTo: Date,
  filters?: Record<string, unknown>
) => {
  const [totalPrograms, totalClasses, totalPoses, programStats] =
    await Promise.all([
      prisma.programs.count(),
      prisma.classes.count(),
      prisma.poses.count(),
      prisma.programs.findMany({
        select: {
          id: true,
          title: true,
          _count: {
            select: {
              sessions: true,
            },
          },
        },
        take: 10,
        orderBy: {
          sessions: { _count: 'desc' },
        },
      }),
    ]);

  // Video progress stats
  const completionStats = await prisma.video_progress.groupBy({
    by: ['completed'],
    _count: true,
    where: {
      updatedAt: { gte: dateFrom, lte: dateTo },
    },
  });

  const totalViews = completionStats.reduce((sum, s) => sum + s._count, 0);
  const completedViews =
    completionStats.find(s => s.completed)?._count || 0;
  const completionRate =
    totalViews > 0 ? (completedViews / totalViews) * 100 : 0;

  return {
    totalPrograms,
    totalClasses,
    totalPoses,
    topPrograms: programStats.map(p => ({
      id: p.id,
      title: p.title,
      sessionsCount: p._count.sessions,
    })),
    totalViews,
    completedViews,
    completionRate: Math.round(completionRate * 100) / 100,
    period: { from: dateFrom, to: dateTo },
  };
};

// Engagement Analytics
export const getEngagementAnalytics = async (
  dateFrom: Date,
  dateTo: Date,
  filters?: Record<string, unknown>
) => {
  const [dailyActiveUsers, videoProgress, plannerEntries, challengeEnrollments] =
    await Promise.all([
      // DAU based on video progress
      prisma.video_progress.groupBy({
        by: ['userId'],
        where: { updatedAt: { gte: dateFrom, lte: dateTo } },
      }).then(r => r.length),

      // Video progress stats
      prisma.video_progress.aggregate({
        where: { updatedAt: { gte: dateFrom, lte: dateTo } },
        _count: true,
        _avg: { percentage: true },
      }),

      // Planner usage
      prisma.planner_entries.count({
        where: { createdAt: { gte: dateFrom, lte: dateTo } },
      }),

      // Challenge participation
      prisma.challenge_enrollments.count({
        where: { joinedAt: { gte: dateFrom, lte: dateTo } },
      }),
    ]);

  return {
    dailyActiveUsers,
    totalSessions: videoProgress._count,
    averageProgress: Math.round((videoProgress._avg.percentage || 0) * 100),
    plannerUsage: plannerEntries,
    challengeParticipation: challengeEnrollments,
    period: { from: dateFrom, to: dateTo },
  };
};

// Instructor Analytics
export const getInstructorAnalytics = async (
  dateFrom: Date,
  dateTo: Date,
  instructorId?: string
) => {
  const where = instructorId ? { userId: instructorId } : {};

  const instructors = await prisma.instructor_profiles.findMany({
    where,
    select: {
      userId: true,
      displayName: true,
      averageRating: true,
      totalStudents: true,
      totalClasses: true,
      totalReviews: true,
    },
  });

  return instructors.map(i => ({
    instructorId: i.userId,
    name: i.displayName,
    totalClasses: i.totalClasses || 0,
    totalReviews: i.totalReviews || 0,
    averageRating: Number(i.averageRating) || 0,
    totalStudents: i.totalStudents,
  }));
};

// MRR Report
export const getMRRReport = async (months: number = 12) => {
  const results: { month: string; mrr: number; growth: number }[] = [];
  let previousMRR = 0;

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const activeSubscriptions = await prisma.subscriptions.count({
      where: {
        status: 'ACTIVE',
        createdAt: { lte: monthEnd },
        OR: [
          { currentPeriodEnd: null },
          { currentPeriodEnd: { gte: monthStart } }
        ],
      },
    });

    // Assuming average subscription value
    const avgSubscriptionValue = 29.99; // This should come from actual pricing
    const mrr = activeSubscriptions * avgSubscriptionValue;
    const growth = previousMRR > 0 ? ((mrr - previousMRR) / previousMRR) * 100 : 0;

    results.push({
      month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      mrr: Math.round(mrr * 100) / 100,
      growth: Math.round(growth * 100) / 100,
    });

    previousMRR = mrr;
  }

  return results;
};

// Churn Report
export const getChurnReport = async (dateFrom: Date, dateTo: Date) => {
  const [startingSubscriptions, endingSubscriptions, churned] = await Promise.all([
    prisma.subscriptions.count({
      where: {
        status: 'ACTIVE',
        createdAt: { lt: dateFrom },
      },
    }),
    prisma.subscriptions.count({
      where: {
        status: 'ACTIVE',
        createdAt: { lt: dateTo },
      },
    }),
    prisma.subscriptions.count({
      where: {
        status: { in: ['CANCELLED', 'CANCELED'] },
        updatedAt: { gte: dateFrom, lte: dateTo },
      },
    }),
  ]);

  const churnRate = startingSubscriptions > 0
    ? (churned / startingSubscriptions) * 100
    : 0;

  return {
    startingSubscriptions,
    endingSubscriptions,
    churned,
    churnRate: Math.round(churnRate * 100) / 100,
    period: { from: dateFrom, to: dateTo },
  };
};

// Retention calculation helper
const calculateRetentionRate = async (dateFrom: Date, dateTo: Date) => {
  const newUsers = await prisma.users.count({
    where: { createdAt: { gte: dateFrom, lte: dateTo } },
  });

  // Users who came back (had activity after registration)
  const activeNewUsers = await prisma.users.count({
    where: {
      createdAt: { gte: dateFrom, lte: dateTo },
      video_progress: {
        some: {
          updatedAt: { gt: dateTo },
        },
      },
    },
  });

  return newUsers > 0 ? Math.round((activeNewUsers / newUsers) * 100) : 0;
};

// Compare periods
export const comparePeriods = async (
  metric: string,
  period1: { from: Date; to: Date },
  period2: { from: Date; to: Date }
) => {
  let value1: number;
  let value2: number;

  switch (metric) {
    case 'revenue':
      const rev1 = await prisma.payments.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: period1.from, lte: period1.to },
        },
        _sum: { amount: true },
      });
      const rev2 = await prisma.payments.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: period2.from, lte: period2.to },
        },
        _sum: { amount: true },
      });
      value1 = Number(rev1._sum.amount || 0) / 100;
      value2 = Number(rev2._sum.amount || 0) / 100;
      break;

    case 'users':
      value1 = await prisma.users.count({
        where: { createdAt: { gte: period1.from, lte: period1.to } },
      });
      value2 = await prisma.users.count({
        where: { createdAt: { gte: period2.from, lte: period2.to } },
      });
      break;

    case 'subscriptions':
      value1 = await prisma.subscriptions.count({
        where: { createdAt: { gte: period1.from, lte: period1.to } },
      });
      value2 = await prisma.subscriptions.count({
        where: { createdAt: { gte: period2.from, lte: period2.to } },
      });
      break;

    default:
      throw new Error(`Unknown metric: ${metric}`);
  }

  const change = value2 > 0 ? ((value1 - value2) / value2) * 100 : 0;

  return {
    metric,
    period1: { ...period1, value: value1 },
    period2: { ...period2, value: value2 },
    change: Math.round(change * 100) / 100,
    direction: value1 > value2 ? 'up' : value1 < value2 ? 'down' : 'same',
  };
};

// Overview Dashboard Data
export const getOverviewDashboard = async () => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalUsers,
    newUsersThisMonth,
    newUsersLastMonth,
    activeSubscriptions,
    revenueThisMonth,
    revenueLastMonth,
    totalPrograms,
    totalClasses,
  ] = await Promise.all([
    prisma.users.count(),
    prisma.users.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.users.count({
      where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
    }),
    prisma.subscriptions.count({ where: { status: 'ACTIVE' } }),
    prisma.payments.aggregate({
      where: { status: 'COMPLETED', createdAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.payments.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
      },
      _sum: { amount: true },
    }),
    prisma.programs.count(),
    prisma.classes.count(),
  ]);

  const userGrowth =
    newUsersLastMonth > 0
      ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100
      : 0;

  const currentRevenue = Number(revenueThisMonth._sum.amount || 0) / 100;
  const previousRevenue = Number(revenueLastMonth._sum.amount || 0) / 100;
  const revenueGrowth =
    previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

  return {
    totalUsers,
    newUsersThisMonth,
    userGrowth: Math.round(userGrowth * 100) / 100,
    activeSubscriptions,
    revenueThisMonth: currentRevenue,
    revenueGrowth: Math.round(revenueGrowth * 100) / 100,
    totalPrograms,
    totalClasses,
    lastUpdated: now,
  };
};
