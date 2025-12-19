import { logger } from '../utils/logger';

// ============================================
// XP System Stubs (XP system removed)
// ============================================
// All functions return placeholder values to maintain compatibility

/**
 * Get default XP amount for different actions
 */
export function getDefaultXPAmount(actionType: string): number {
  return 0;
}

export async function getOrCreateUserLevel(userId: string) {
  return {
    userId,
    currentXP: 0,
    totalXP: 0,
    level: 1,
    currentStreak: 0,
    longestStreak: 0,
    previousLevel: null,
    levelUpAt: null,
    lastActivityDate: null,
  };
}

export async function getUserLevel(userId: string) {
  return {
    userId,
    currentXP: 0,
    totalXP: 0,
    level: 1,
    currentStreak: 0,
    longestStreak: 0,
    previousLevel: null,
    levelUpAt: null,
    lastActivityDate: null,
  };
}

export async function addXP(
  userId: string,
  amount: number,
  source: any,
  description: string
) {
  logger.info({ userId, amount, source, description }, 'XP system disabled - no XP added');

  return {
    success: true,
    newXP: 0,
    newLevel: 1,
    userLevel: {
      userId,
      currentXP: 0,
      totalXP: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0,
      previousLevel: null,
      levelUpAt: null,
      lastActivityDate: null,
    },
    leveledUp: false,
    previousLevel: 1,
  };
}

export async function deductXP(userId: string, amount: number, reason: string) {
  logger.info({ userId, amount, reason }, 'XP system disabled - no XP deducted');

  return {
    userId,
    currentXP: 0,
    totalXP: 0,
    level: 1,
    currentStreak: 0,
    longestStreak: 0,
    previousLevel: null,
    levelUpAt: null,
    lastActivityDate: null,
  };
}

export async function getXPTransactions(
  userId: string,
  pagination: { page?: number; limit?: number } = {}
) {
  const { page = 1, limit = 20 } = pagination;

  return {
    transactions: [],
    pagination: {
      page,
      limit,
      total: 0,
      totalPages: 0,
    },
  };
}

export async function getLeaderboard(limit: number = 50) {
  return [];
}

// ============================================
// Additional XP Functions (Stubs)
// ============================================

/**
 * Get user stats including level, XP, and streaks
 */
export async function getUserStats(userId: string) {
  return {
    userId,
    currentXP: 0,
    totalXP: 0,
    level: 1,
    previousLevel: null,
    levelUpAt: null,
    xpForNextLevel: 1000,
    xpNeeded: 1000,
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
  };
}

/**
 * Get level information including thresholds
 */
export async function getLevelInfo(level: number) {
  return {
    level: 1,
    xpRequired: 0,
    xpForNext: 1000,
    xpNeeded: 1000,
    title: 'Beginner',
  };
}

/**
 * Get XP transaction history for a user
 */
export async function getXPHistory(
  userId: string,
  options: { page?: number; limit?: number; type?: string; source?: string } = {}
) {
  const { page = 1, limit = 20 } = options;

  return {
    transactions: [],
    pagination: {
      page,
      limit,
      total: 0,
      totalPages: 0,
    },
  };
}

/**
 * Get XP leaderboard with pagination
 */
export async function getXPLeaderboard(options: { page?: number; limit?: number } = {}) {
  const { page = 1, limit = 50 } = options;

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

/**
 * Get user's rank on the leaderboard
 */
export async function getUserRank(userId: string) {
  return {
    userId,
    rank: 0,
    level: 1,
    totalXP: 0,
  };
}

// Helper function to get level title
function getLevelTitle(level: number): string {
  return 'Beginner';
}
