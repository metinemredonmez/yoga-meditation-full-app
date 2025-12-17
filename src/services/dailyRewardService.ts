import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import * as xpService from './xpService';
import * as streakService from './streakService';

const CYCLE_DAYS = 30;

// ============================================
// Daily Reward Status
// ============================================

export async function getDailyRewardStatus(userId: string) {
  let userReward = await prisma.userDailyReward.findUnique({
    where: { userId },
  });

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Create if doesn't exist
  if (!userReward) {
    userReward = await prisma.userDailyReward.create({
      data: { userId },
    });
  }

  // Check if we need to reset cycle
  const daysSinceCycleStart = Math.floor(
    (today.getTime() - userReward.cycleStart.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (daysSinceCycleStart >= CYCLE_DAYS) {
    // Reset cycle
    userReward = await prisma.userDailyReward.update({
      where: { userId },
      data: {
        currentDay: 1,
        cycleStart: today,
        lastClaimAt: null,
      },
    });
  }

  // Check if already claimed today
  let canClaim = true;
  if (userReward.lastClaimAt) {
    const lastClaim = new Date(userReward.lastClaimAt);
    const lastClaimDay = new Date(
      lastClaim.getFullYear(),
      lastClaim.getMonth(),
      lastClaim.getDate(),
    );
    canClaim = lastClaimDay.getTime() < today.getTime();
  }

  // Get today's reward
  const todayReward = await prisma.dailyReward.findUnique({
    where: { day: userReward.currentDay },
  });

  // Get upcoming rewards
  const upcomingRewards = await prisma.dailyReward.findMany({
    where: {
      day: { gt: userReward.currentDay, lte: userReward.currentDay + 7 },
    },
    orderBy: { day: 'asc' },
  });

  return {
    currentDay: userReward.currentDay,
    cycleStart: userReward.cycleStart,
    lastClaimAt: userReward.lastClaimAt,
    canClaim,
    todayReward,
    upcomingRewards,
    daysUntilReset: CYCLE_DAYS - daysSinceCycleStart,
  };
}

// ============================================
// Claim Daily Reward
// ============================================

export async function claimDailyReward(userId: string) {
  const status = await getDailyRewardStatus(userId);

  if (!status.canClaim) {
    return { success: false, message: 'Daily reward already claimed today' };
  }

  if (!status.todayReward) {
    return { success: false, message: 'No reward available for today' };
  }

  const now = new Date();

  // Award XP
  const xpResult = await xpService.awardXP(
    userId,
    status.todayReward.xpReward,
    'DAILY_LOGIN',
    undefined,
    `Day ${status.currentDay} daily reward`,
  );

  // Process bonus reward if any
  let bonusResult = null;
  if (status.todayReward.bonusType && status.todayReward.bonusValue) {
    bonusResult = await processBonusReward(
      userId,
      status.todayReward.bonusType,
      status.todayReward.bonusValue,
    );
  }

  // Update user's daily reward progress
  const nextDay = status.currentDay >= CYCLE_DAYS ? 1 : status.currentDay + 1;
  const shouldResetCycle = status.currentDay >= CYCLE_DAYS;

  await prisma.userDailyReward.update({
    where: { userId },
    data: {
      currentDay: nextDay,
      lastClaimAt: now,
      ...(shouldResetCycle && { cycleStart: now }),
    },
  });

  logger.info({ userId, day: status.currentDay }, 'Daily reward claimed');

  return {
    success: true,
    day: status.currentDay,
    xpAwarded: status.todayReward.xpReward,
    bonusType: status.todayReward.bonusType,
    bonusResult,
    isSpecial: status.todayReward.isSpecial,
    nextDay,
    xpResult,
  };
}

async function processBonusReward(
  userId: string,
  bonusType: string,
  bonusValue: string,
) {
  switch (bonusType) {
    case 'STREAK_FREEZE':
      await streakService.grantStreakFreeze(userId, 'REWARD');
      return { type: 'streak_freeze', granted: true };

    case 'BADGE':
      await prisma.userBadge.upsert({
        where: { userId_badgeId: { userId, badgeId: bonusValue } },
        create: { userId, badgeId: bonusValue },
        update: {},
      });
      return { type: 'badge', badgeId: bonusValue };

    case 'TITLE':
      await prisma.userTitle.upsert({
        where: { userId_titleId: { userId, titleId: bonusValue } },
        create: { userId, titleId: bonusValue },
        update: {},
      });
      return { type: 'title', titleId: bonusValue };

    case 'AVATAR_FRAME':
      await prisma.userAvatarFrame.upsert({
        where: { userId_frameId: { userId, frameId: bonusValue } },
        create: { userId, frameId: bonusValue },
        update: {},
      });
      return { type: 'avatar_frame', frameId: bonusValue };

    case 'DISCOUNT':
      // Discount codes would need separate handling
      return { type: 'discount', code: bonusValue };

    default:
      return null;
  }
}

// ============================================
// Daily Reward Calendar
// ============================================

export async function getDailyRewardCalendar() {
  return prisma.dailyReward.findMany({
    orderBy: { day: 'asc' },
  });
}

export async function getUserCalendar(userId: string) {
  const [calendar, userReward] = await Promise.all([
    getDailyRewardCalendar(),
    prisma.userDailyReward.findUnique({ where: { userId } }),
  ]);

  return calendar.map((reward) => ({
    ...reward,
    isClaimed: userReward ? reward.day < userReward.currentDay : false,
    isCurrent: userReward ? reward.day === userReward.currentDay : reward.day === 1,
    isUpcoming: userReward ? reward.day > userReward.currentDay : reward.day > 1,
  }));
}

// Get all daily rewards config (for admin)
export async function getAllDailyRewards() {
  return prisma.dailyReward.findMany({
    orderBy: { day: 'asc' },
  });
}

// Get user's claim history
export async function getClaimHistory(userId: string) {
  const userReward = await prisma.userDailyReward.findUnique({
    where: { userId },
  });

  if (!userReward) {
    return [];
  }

  // Return claimed days info based on current cycle
  const claimedDays = [];
  for (let i = 1; i < userReward.currentDay; i++) {
    claimedDays.push({
      day: i,
      claimedAt: userReward.cycleStart, // Approximate
    });
  }

  return claimedDays;
}

// Reset user's daily reward cycle (admin)
export async function resetUserDailyReward(userId: string) {
  return prisma.userDailyReward.upsert({
    where: { userId },
    create: { userId },
    update: {
      currentDay: 1,
      cycleStart: new Date(),
      lastClaimAt: null,
    },
  });
}

// ============================================
// Admin Functions
// ============================================

export async function createDailyReward(data: {
  day: number;
  xpReward: number;
  bonusType?: string;
  bonusValue?: string;
  isSpecial?: boolean;
}) {
  return prisma.dailyReward.create({
    data: {
      ...data,
      bonusType: data.bonusType as any,
    },
  });
}

export async function updateDailyReward(
  day: number,
  data: Partial<{
    xpReward: number;
    bonusType: string;
    bonusValue: string;
    isSpecial: boolean;
  }>,
) {
  return prisma.dailyReward.update({
    where: { day },
    data: {
      ...data,
      bonusType: data.bonusType as any,
    },
  });
}

export async function deleteDailyReward(day: number) {
  return prisma.dailyReward.delete({ where: { day } });
}

// ============================================
// Seed Default Daily Rewards
// ============================================

export async function seedDailyRewards() {
  const existingCount = await prisma.dailyReward.count();
  if (existingCount > 0) {
    return { message: 'Daily rewards already exist' };
  }

  const rewards = Array.from({ length: CYCLE_DAYS }, (_, i) => {
    const day = i + 1;
    const isSpecialDay = [7, 14, 21, 30].includes(day);
    const weekBonus = Math.floor((day - 1) / 7) * 10;

    let bonusType: string | null = null;
    let bonusValue: string | null = null;

    // Day 30 gets a streak freeze
    if (day === 30) {
      bonusType = 'STREAK_FREEZE';
      bonusValue = '1';
    }

    return {
      day,
      xpReward: 10 + day + weekBonus + (isSpecialDay ? 50 : 0),
      bonusType: bonusType as any,
      bonusValue,
      isSpecial: isSpecialDay,
    };
  });

  await prisma.dailyReward.createMany({ data: rewards });

  logger.info('Daily rewards seeded');
  return { message: 'Daily rewards created', count: rewards.length };
}

// ============================================
// Reset Daily Reward Cycles (Cron)
// ============================================

export async function resetExpiredCycles() {
  const now = new Date();
  const cycleExpiry = new Date(now);
  cycleExpiry.setDate(cycleExpiry.getDate() - CYCLE_DAYS);

  const result = await prisma.userDailyReward.updateMany({
    where: {
      cycleStart: { lt: cycleExpiry },
    },
    data: {
      currentDay: 1,
      cycleStart: now,
    },
  });

  if (result.count > 0) {
    logger.info({ count: result.count }, 'Reset expired daily reward cycles');
  }

  return result;
}
