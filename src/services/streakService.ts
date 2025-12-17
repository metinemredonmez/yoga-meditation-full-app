import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { StreakFreezeSource } from '@prisma/client';
import * as xpService from './xpService';
import * as milestoneService from './milestoneService';

// ============================================
// Streak Management
// ============================================

export async function updateStreak(userId: string) {
  const userLevel = await xpService.getOrCreateUserLevel(userId);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Check if already logged today
  if (userLevel.lastActivityDate) {
    const lastActivity = new Date(userLevel.lastActivityDate);
    const lastActivityDay = new Date(
      lastActivity.getFullYear(),
      lastActivity.getMonth(),
      lastActivity.getDate(),
    );

    if (lastActivityDay.getTime() === today.getTime()) {
      // Already logged today
      return {
        currentStreak: userLevel.currentStreak,
        longestStreak: userLevel.longestStreak,
        streakMaintained: true,
        isNewDay: false,
      };
    }

    // Check if streak is still valid (yesterday or freeze used)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastActivityDay.getTime() < yesterday.getTime()) {
      // Streak broken - check for freeze
      const freeze = await useAvailableFreeze(userId);
      if (!freeze) {
        // Reset streak
        await prisma.userLevel.update({
          where: { userId },
          data: {
            currentStreak: 1,
            lastActivityDate: now,
          },
        });

        logger.info({ userId }, 'Streak broken and reset');

        return {
          currentStreak: 1,
          longestStreak: userLevel.longestStreak,
          streakMaintained: false,
          streakBroken: true,
          isNewDay: true,
        };
      }
    }
  }

  // Increment streak
  const newStreak = userLevel.currentStreak + 1;
  const newLongestStreak = Math.max(newStreak, userLevel.longestStreak);

  await prisma.userLevel.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastActivityDate: now,
    },
  });

  // Check streak milestones
  await checkStreakMilestones(userId, newStreak);

  logger.info({ userId, newStreak }, 'Streak updated');

  return {
    currentStreak: newStreak,
    longestStreak: newLongestStreak,
    streakMaintained: true,
    isNewDay: true,
    previousStreak: userLevel.currentStreak,
  };
}

export async function getStreakInfo(userId: string) {
  const userLevel = await xpService.getOrCreateUserLevel(userId);

  // Get available freezes
  const freezeCount = await prisma.streakFreeze.count({
    where: {
      userId,
      usedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  // Check if activity needed today
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let activityNeededToday = true;

  if (userLevel.lastActivityDate) {
    const lastActivity = new Date(userLevel.lastActivityDate);
    const lastActivityDay = new Date(
      lastActivity.getFullYear(),
      lastActivity.getMonth(),
      lastActivity.getDate(),
    );
    activityNeededToday = lastActivityDay.getTime() < today.getTime();
  }

  // Calculate next milestone
  const streakMilestones = [7, 14, 30, 60, 100, 200, 365];
  const nextMilestone =
    streakMilestones.find((m) => m > userLevel.currentStreak) || null;

  return {
    currentStreak: userLevel.currentStreak,
    longestStreak: userLevel.longestStreak,
    lastActivityDate: userLevel.lastActivityDate,
    activityNeededToday,
    availableFreezes: freezeCount,
    streakFreezeUsed: userLevel.streakFreezeUsed,
    nextMilestone,
    daysToNextMilestone: nextMilestone
      ? nextMilestone - userLevel.currentStreak
      : null,
  };
}

// ============================================
// Streak Freeze
// ============================================

export async function grantStreakFreeze(
  userId: string,
  source: StreakFreezeSource,
  expiresAt?: Date,
) {
  const freeze = await prisma.streakFreeze.create({
    data: {
      userId,
      source,
      expiresAt,
    },
  });

  // Update user freeze count
  await prisma.userLevel.update({
    where: { userId },
    data: {
      streakFreezeCount: { increment: 1 },
    },
  });

  logger.info({ userId, source }, 'Streak freeze granted');

  return freeze;
}

export async function useStreakFreeze(userId: string) {
  // Find available freeze
  const freeze = await prisma.streakFreeze.findFirst({
    where: {
      userId,
      usedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: 'asc' },
  });

  if (!freeze) {
    return { success: false, message: 'No freeze available' };
  }

  // Use the freeze
  await prisma.streakFreeze.update({
    where: { id: freeze.id },
    data: { usedAt: new Date() },
  });

  await prisma.userLevel.update({
    where: { userId },
    data: {
      streakFreezeUsed: new Date(),
      streakFreezeCount: { decrement: 1 },
    },
  });

  logger.info({ userId, freezeId: freeze.id }, 'Streak freeze used');

  return { success: true, freeze };
}

async function useAvailableFreeze(userId: string): Promise<boolean> {
  const result = await useStreakFreeze(userId);
  return result.success;
}

export async function getAvailableFreezes(userId: string) {
  const freezes = await prisma.streakFreeze.findMany({
    where: {
      userId,
      usedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: 'asc' },
  });

  return freezes;
}

// ============================================
// Streak Milestones
// ============================================

const STREAK_MILESTONES = [
  { days: 7, xp: 100, milestone: 'STREAK_7_DAYS' as const },
  { days: 30, xp: 500, milestone: 'STREAK_30_DAYS' as const },
  { days: 100, xp: 2000, milestone: 'STREAK_100_DAYS' as const },
  { days: 365, xp: 10000, milestone: 'STREAK_365_DAYS' as const },
];

async function checkStreakMilestones(userId: string, streak: number) {
  for (const { days, xp, milestone } of STREAK_MILESTONES) {
    if (streak === days) {
      // Award XP bonus
      await xpService.awardXP(
        userId,
        xp,
        'STREAK_MILESTONE',
        undefined,
        `${days} day streak milestone`,
        'STREAK_BONUS',
      );

      // Create milestone
      await milestoneService.createMilestone(
        userId,
        milestone,
        days,
        `${days} Day Streak!`,
        `You've maintained a ${days} day streak!`,
      );

      logger.info({ userId, days }, 'Streak milestone achieved');
    }
  }
}

// ============================================
// Streak Reset (Cron Job)
// ============================================

export async function checkExpiredStreaks() {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  // Find users who haven't been active since yesterday and don't have freeze used
  const usersToReset = await prisma.userLevel.findMany({
    where: {
      currentStreak: { gt: 0 },
      lastActivityDate: { lt: yesterday },
      streakFreezeUsed: null,
    },
  });

  for (const user of usersToReset) {
    // Check for auto-use freeze
    const hasFreeze = await useAvailableFreeze(user.userId);

    if (!hasFreeze) {
      await prisma.userLevel.update({
        where: { userId: user.userId },
        data: {
          currentStreak: 0,
        },
      });

      logger.info({ userId: user.userId }, 'Streak reset due to inactivity');
    }
  }

  return { processed: usersToReset.length };
}

// ============================================
// Streak Leaderboard
// ============================================

export async function getStreakLeaderboard(
  pagination: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 50 } = pagination;
  const skip = (page - 1) * limit;

  const [entries, total] = await Promise.all([
    prisma.userLevel.findMany({
      where: { currentStreak: { gt: 0 } },
      orderBy: { currentStreak: 'desc' },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.userLevel.count({ where: { currentStreak: { gt: 0 } } }),
  ]);

  const leaderboard = entries.map((entry, index) => ({
    rank: skip + index + 1,
    userId: entry.userId,
    userName:
      `${entry.user.firstName || ''} ${entry.user.lastName || ''}`.trim() ||
      'Yogi',
    currentStreak: entry.currentStreak,
    longestStreak: entry.longestStreak,
  }));

  return {
    leaderboard,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
