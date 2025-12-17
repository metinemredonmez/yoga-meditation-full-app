import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import type { LeaderboardPeriod } from '@prisma/client';

// ============================================
// Leaderboard Service
// ============================================

export function getPeriodDates(period: LeaderboardPeriod): { start: Date; end: Date } {
  const now = new Date();
  let start: Date;
  let end: Date;

  switch (period) {
    case 'DAILY':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(start);
      end.setDate(end.getDate() + 1);
      break;

    case 'WEEKLY':
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      start = new Date(now.getFullYear(), now.getMonth(), diff);
      end = new Date(start);
      end.setDate(end.getDate() + 7);
      break;

    case 'MONTHLY':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;

    case 'ALL_TIME':
      start = new Date(0); // Beginning of time
      end = new Date(now.getFullYear() + 100, 0, 1); // Far future
      break;
  }

  return { start, end };
}

export async function getLeaderboard(
  period: LeaderboardPeriod,
  pagination: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 50 } = pagination;
  const skip = (page - 1) * limit;
  const { start, end } = getPeriodDates(period);

  const [entries, total] = await Promise.all([
    prisma.leaderboardEntry.findMany({
      where: {
        period,
        periodStart: start,
        periodEnd: end,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { points: 'desc' },
      skip,
      take: limit,
    }),
    prisma.leaderboardEntry.count({
      where: {
        period,
        periodStart: start,
        periodEnd: end,
      },
    }),
  ]);

  // Add rank to entries
  const rankedEntries = entries.map((entry, index) => ({
    ...entry,
    rank: skip + index + 1,
  }));

  return {
    entries: rankedEntries,
    period,
    periodStart: start,
    periodEnd: end,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getUserRank(userId: string, period: LeaderboardPeriod) {
  const { start, end } = getPeriodDates(period);

  const userEntry = await prisma.leaderboardEntry.findFirst({
    where: {
      userId,
      period,
      periodStart: start,
      periodEnd: end,
    },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  if (!userEntry) {
    return null;
  }

  // Count entries with more points to determine rank
  const higherCount = await prisma.leaderboardEntry.count({
    where: {
      period,
      periodStart: start,
      periodEnd: end,
      points: { gt: userEntry.points },
    },
  });

  return {
    ...userEntry,
    rank: higherCount + 1,
  };
}

export async function getUserLeaderboardHistory(
  userId: string,
  period: LeaderboardPeriod,
  limit: number = 10,
) {
  const entries = await prisma.leaderboardEntry.findMany({
    where: { userId, period },
    orderBy: { periodStart: 'desc' },
    take: limit,
  });

  return entries;
}

export async function updateUserStats(
  userId: string,
  data: {
    minutes?: number;
    sessions?: number;
    classes?: number;
    points?: number;
  },
) {
  const periods: LeaderboardPeriod[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME'];

  for (const period of periods) {
    const { start, end } = getPeriodDates(period);

    await prisma.leaderboardEntry.upsert({
      where: {
        userId_period_periodStart: {
          userId,
          period,
          periodStart: start,
        },
      },
      create: {
        userId,
        period,
        periodStart: start,
        periodEnd: end,
        totalMinutes: data.minutes || 0,
        totalSessions: data.sessions || 0,
        totalClasses: data.classes || 0,
        points: data.points || 0,
      },
      update: {
        totalMinutes: { increment: data.minutes || 0 },
        totalSessions: { increment: data.sessions || 0 },
        totalClasses: { increment: data.classes || 0 },
        points: { increment: data.points || 0 },
      },
    });
  }

  logger.debug({ userId, data }, 'User leaderboard stats updated');
}

export async function updateStreak(userId: string, streakDays: number) {
  const periods: LeaderboardPeriod[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME'];

  for (const period of periods) {
    const { start, end } = getPeriodDates(period);

    await prisma.leaderboardEntry.upsert({
      where: {
        userId_period_periodStart: {
          userId,
          period,
          periodStart: start,
        },
      },
      create: {
        userId,
        period,
        periodStart: start,
        periodEnd: end,
        streakDays,
      },
      update: {
        streakDays,
      },
    });
  }
}

export async function recalculateRanks(period: LeaderboardPeriod) {
  const { start, end } = getPeriodDates(period);

  // Get all entries ordered by points
  const entries = await prisma.leaderboardEntry.findMany({
    where: {
      period,
      periodStart: start,
      periodEnd: end,
    },
    orderBy: { points: 'desc' },
  });

  // Update ranks
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!;
    const newRank = i + 1;

    if (entry.rank !== newRank) {
      await prisma.leaderboardEntry.update({
        where: { id: entry.id },
        data: {
          previousRank: entry.rank,
          rank: newRank,
        },
      });
    }
  }

  logger.info({ period, count: entries.length }, 'Leaderboard ranks recalculated');
}

// ============================================
// Leaderboard Categories
// ============================================

export async function getTopByMinutes(
  period: LeaderboardPeriod,
  limit: number = 10,
) {
  const { start, end } = getPeriodDates(period);

  return prisma.leaderboardEntry.findMany({
    where: {
      period,
      periodStart: start,
      periodEnd: end,
    },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: { totalMinutes: 'desc' },
    take: limit,
  });
}

export async function getTopByStreaks(
  period: LeaderboardPeriod,
  limit: number = 10,
) {
  const { start, end } = getPeriodDates(period);

  return prisma.leaderboardEntry.findMany({
    where: {
      period,
      periodStart: start,
      periodEnd: end,
    },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: { streakDays: 'desc' },
    take: limit,
  });
}

export async function getTopBySessions(
  period: LeaderboardPeriod,
  limit: number = 10,
) {
  const { start, end } = getPeriodDates(period);

  return prisma.leaderboardEntry.findMany({
    where: {
      period,
      periodStart: start,
      periodEnd: end,
    },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: { totalSessions: 'desc' },
    take: limit,
  });
}

// ============================================
// Leaderboard Statistics
// ============================================

export async function getLeaderboardStats(period: LeaderboardPeriod) {
  const { start, end } = getPeriodDates(period);

  const stats = await prisma.leaderboardEntry.aggregate({
    where: {
      period,
      periodStart: start,
      periodEnd: end,
    },
    _sum: {
      totalMinutes: true,
      totalSessions: true,
      totalClasses: true,
      points: true,
    },
    _avg: {
      totalMinutes: true,
      totalSessions: true,
      streakDays: true,
      points: true,
    },
    _count: true,
  });

  return {
    period,
    periodStart: start,
    periodEnd: end,
    totalParticipants: stats._count,
    totalMinutes: stats._sum.totalMinutes || 0,
    totalSessions: stats._sum.totalSessions || 0,
    totalClasses: stats._sum.totalClasses || 0,
    totalPoints: stats._sum.points || 0,
    avgMinutes: Math.round(stats._avg.totalMinutes || 0),
    avgSessions: Math.round(stats._avg.totalSessions || 0),
    avgStreak: Math.round(stats._avg.streakDays || 0),
    avgPoints: Math.round(stats._avg.points || 0),
  };
}
