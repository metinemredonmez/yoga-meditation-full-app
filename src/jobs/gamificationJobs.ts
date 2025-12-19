import cron from 'node-cron';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

let dailyResetJob: ReturnType<typeof cron.schedule> | null = null;
let weeklyResetJob: ReturnType<typeof cron.schedule> | null = null;
let monthlyResetJob: ReturnType<typeof cron.schedule> | null = null;
let streakCheckJob: ReturnType<typeof cron.schedule> | null = null;
let eventCheckJob: ReturnType<typeof cron.schedule> | null = null;

// ============================================
// Daily Reset Job - Runs at midnight
// ============================================
async function runDailyReset() {
  const startTime = Date.now();
  logger.info('Starting daily gamification reset...');

  try {
    // Reset daily quests for all users
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    // Mark uncompleted daily quests as expired
    const expiredQuests = await prisma.user_quests.updateMany({
      where: {
        quests: {
          type: 'DAILY',
        },
        isCompleted: false,
        createdAt: {
          lt: yesterday,
        },
      },
      data: {
        updatedAt: new Date(),
      },
    });

    logger.info({ count: expiredQuests.count }, 'Daily quests checked');

    // Check streak resets for users who didn't practice yesterday
    const usersToCheck = await prisma.user_levels.findMany({
      where: {
        currentStreak: {
          gt: 0,
        },
        lastActivityDate: {
          lt: yesterday,
        },
      },
      select: { userId: true, currentStreak: true, streakFreezeCount: true },
    });

    let streakResets = 0;
    for (const user of usersToCheck) {
      // Auto-apply streak freeze if available
      if (user.streakFreezeCount > 0) {
        await prisma.user_levels.update({
          where: { userId: user.userId },
          data: {
            streakFreezeCount: { decrement: 1 },
            streakFreezeUsed: new Date(),
          },
        });

        // Record streak freeze usage
        await prisma.streak_freezes.create({
          data: {
            userId: user.userId,
            usedAt: new Date(),
            source: 'AUTO',
          },
        });
      } else {
        // Reset streak
        await prisma.user_levels.update({
          where: { userId: user.userId },
          data: {
            currentStreak: 0,
          },
        });
        streakResets++;
      }
    }

    logger.info({ count: streakResets }, 'Streaks reset for inactive users');

    const duration = Date.now() - startTime;
    logger.info({ durationMs: duration }, 'Daily gamification reset completed');
  } catch (error) {
    logger.error({ err: error }, 'Daily gamification reset failed');
  }
}

// ============================================
// Weekly Reset Job - Runs at midnight on Monday
// ============================================
async function runWeeklyReset() {
  const startTime = Date.now();
  logger.info('Starting weekly gamification reset...');

  try {
    // Reset weekly quests
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const expiredQuests = await prisma.user_quests.updateMany({
      where: {
        quests: {
          type: 'WEEKLY',
        },
        isCompleted: false,
        createdAt: {
          lt: lastWeek,
        },
      },
      data: {
        updatedAt: new Date(),
      },
    });

    logger.info({ count: expiredQuests.count }, 'Weekly quests checked');

    const duration = Date.now() - startTime;
    logger.info({ durationMs: duration }, 'Weekly gamification reset completed');
  } catch (error) {
    logger.error({ err: error }, 'Weekly gamification reset failed');
  }
}

// ============================================
// Monthly Reset Job - Runs at midnight on 1st
// ============================================
async function runMonthlyReset() {
  const startTime = Date.now();
  logger.info('Starting monthly gamification reset...');

  try {
    // Reset monthly quests
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const expiredQuests = await prisma.user_quests.updateMany({
      where: {
        quests: {
          type: 'MONTHLY',
        },
        isCompleted: false,
        createdAt: {
          lt: lastMonth,
        },
      },
      data: {
        updatedAt: new Date(),
      },
    });

    logger.info({ count: expiredQuests.count }, 'Monthly quests checked');

    // Reset daily reward cycles for users who haven't claimed in 30+ days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const staleRewards = await prisma.user_daily_rewards.updateMany({
      where: {
        lastClaimAt: {
          lt: thirtyDaysAgo,
        },
      },
      data: {
        currentDay: 1,
        cycleStart: new Date(),
      },
    });

    logger.info({ count: staleRewards.count }, 'Stale daily reward cycles reset');

    const duration = Date.now() - startTime;
    logger.info({ durationMs: duration }, 'Monthly gamification reset completed');
  } catch (error) {
    logger.error({ err: error }, 'Monthly gamification reset failed');
  }
}

// ============================================
// Streak Check Job - Runs every hour
// ============================================
async function runStreakCheck() {
  logger.debug('Running hourly streak check...');

  try {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    // Find users at risk of losing streak
    const usersAtRisk = await prisma.user_levels.findMany({
      where: {
        currentStreak: {
          gt: 0,
        },
        lastActivityDate: {
          lt: yesterday,
          gte: new Date(yesterday.getTime() - 24 * 60 * 60 * 1000),
        },
        streakFreezeCount: {
          gt: 0,
        },
      },
      select: { userId: true },
    });

    logger.debug({ count: usersAtRisk.length }, 'Users at risk of streak loss');
  } catch (error) {
    logger.error({ err: error }, 'Streak check job failed');
  }
}

// ============================================
// Event Check Job - Runs every 5 minutes
// ============================================
async function runEventCheck() {
  logger.debug('Running event status check...');

  try {
    const now = new Date();

    // Activate events that should start
    const activatedEvents = await prisma.seasonal_events.updateMany({
      where: {
        isActive: false,
        startDate: {
          lte: now,
        },
        endDate: {
          gt: now,
        },
      },
      data: {
        isActive: true,
      },
    });

    if (activatedEvents.count > 0) {
      logger.info({ count: activatedEvents.count }, 'Events activated');
    }

    // Deactivate events that have ended
    const deactivatedEvents = await prisma.seasonal_events.updateMany({
      where: {
        isActive: true,
        endDate: {
          lte: now,
        },
      },
      data: {
        isActive: false,
      },
    });

    if (deactivatedEvents.count > 0) {
      logger.info({ count: deactivatedEvents.count }, 'Events deactivated');
    }
  } catch (error) {
    logger.error({ err: error }, 'Event check job failed');
  }
}

// ============================================
// Initialize and Stop Jobs
// ============================================

export function initializeGamificationJobs() {
  // Daily reset at midnight
  dailyResetJob = cron.schedule('0 0 * * *', runDailyReset);

  // Weekly reset at midnight on Monday
  weeklyResetJob = cron.schedule('0 0 * * 1', runWeeklyReset);

  // Monthly reset at midnight on 1st
  monthlyResetJob = cron.schedule('0 0 1 * *', runMonthlyReset);

  // Streak check every hour
  streakCheckJob = cron.schedule('0 * * * *', runStreakCheck);

  // Event check every 5 minutes
  eventCheckJob = cron.schedule('*/5 * * * *', runEventCheck);

  logger.info('Gamification cron jobs initialized');
}

export function stopGamificationJobs() {
  if (dailyResetJob) {
    dailyResetJob.stop();
    dailyResetJob = null;
  }
  if (weeklyResetJob) {
    weeklyResetJob.stop();
    weeklyResetJob = null;
  }
  if (monthlyResetJob) {
    monthlyResetJob.stop();
    monthlyResetJob = null;
  }
  if (streakCheckJob) {
    streakCheckJob.stop();
    streakCheckJob = null;
  }
  if (eventCheckJob) {
    eventCheckJob.stop();
    eventCheckJob = null;
  }

  logger.info('Gamification cron jobs stopped');
}

// Manual trigger functions for testing/admin
export { runDailyReset, runWeeklyReset, runMonthlyReset, runStreakCheck, runEventCheck };
