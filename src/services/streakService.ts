import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { StreakFreezeSource } from '@prisma/client';
import * as xpService from './xpService';
import * as milestoneService from './milestoneService';

// ============================================
// Streak Management
// ============================================

export async function updateStreak(userId: string) {
  // Placeholder implementation - user_levels removed
  logger.info({ userId }, 'Streak update skipped - user_levels removed');

  return {
    currentStreak: 0,
    longestStreak: 0,
    streakMaintained: true,
    isNewDay: true,
    previousStreak: 0,
  };
}

export async function getStreakInfo(userId: string) {
  // Get available freezes
  const freezeCount = await prisma.streak_freezes.count({
    where: {
      userId,
      usedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  // Placeholder values - user_levels removed
  const currentStreak = 0;
  const longestStreak = 0;

  // Calculate next milestone
  const streakMilestones = [7, 14, 30, 60, 100, 200, 365];
  const nextMilestone =
    streakMilestones.find((m) => m > currentStreak) || null;

  return {
    currentStreak,
    longestStreak,
    lastActivityDate: null,
    activityNeededToday: true,
    availableFreezes: freezeCount,
    streakFreezeUsed: null,
    nextMilestone,
    daysToNextMilestone: nextMilestone
      ? nextMilestone - currentStreak
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
  const freeze = await prisma.streak_freezes.create({
    data: {
      userId,
      source,
      expiresAt,
    },
  });

  logger.info({ userId, source }, 'Streak freeze granted');

  return freeze;
}

export async function useStreakFreeze(userId: string) {
  // Find available freeze
  const freeze = await prisma.streak_freezes.findFirst({
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
  await prisma.streak_freezes.update({
    where: { id: freeze.id },
    data: { usedAt: new Date() },
  });

  logger.info({ userId, freezeId: freeze.id }, 'Streak freeze used');

  return { success: true, freeze };
}

async function useAvailableFreeze(userId: string): Promise<boolean> {
  const result = await useStreakFreeze(userId);
  return result.success;
}

export async function getAvailableFreezes(userId: string) {
  const freezes = await prisma.streak_freezes.findMany({
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
      await xpService.addXP(
        userId,
        xp,
        'STREAK_MILESTONE',
        `${days} day streak milestone`,
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
  // Placeholder implementation - user_levels removed
  logger.info('Streak expiration check skipped - user_levels removed');

  return { processed: 0 };
}

// ============================================
// Streak Leaderboard
// ============================================

export async function getStreakLeaderboard(
  pagination: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 50 } = pagination;

  // Placeholder implementation - user_levels removed
  return {
    leaderboard: [],
    pagination: {
      page,
      limit,
      total: 0,
      totalPages: 0,
    },
  };
}
