import cron from 'node-cron';
import { logger } from '../utils/logger';
import * as instructorAnalyticsService from '../services/instructorAnalyticsService';
import * as instructorPayoutService from '../services/instructorPayoutService';
import * as instructorService from '../services/instructorService';
import * as instructorReviewService from '../services/instructorReviewService';
import { prisma } from '../utils/database';

// ============================================
// Daily Analytics Snapshot Job
// ============================================

/**
 * Generate daily analytics snapshots for all instructors
 * Runs at 1:00 AM every day
 */
export function scheduleDailyAnalyticsJob() {
  cron.schedule('0 1 * * *', async () => {
    logger.info('Starting daily analytics snapshot job');

    try {
      await instructorAnalyticsService.generateAllDailySnapshots();
      logger.info('Daily analytics snapshot job completed');
    } catch (error) {
      logger.error({ error }, 'Daily analytics snapshot job failed');
    }
  });

  logger.info('Daily analytics snapshot job scheduled (1:00 AM daily)');
}

// ============================================
// Instructor Stats Update Job
// ============================================

/**
 * Update instructor stats (total students, programs, etc.)
 * Runs at 2:00 AM every day
 */
export function scheduleStatsUpdateJob() {
  cron.schedule('0 2 * * *', async () => {
    logger.info('Starting instructor stats update job');

    try {
      await instructorService.updateAllInstructorStats();
      logger.info('Instructor stats update job completed');
    } catch (error) {
      logger.error({ error }, 'Instructor stats update job failed');
    }
  });

  logger.info('Instructor stats update job scheduled (2:00 AM daily)');
}

// ============================================
// Auto Payout Job
// ============================================

/**
 * Process automatic payouts for instructors
 * Runs at 10:00 AM on the 1st and 15th of each month
 */
export function scheduleAutoPayoutJob() {
  cron.schedule('0 10 1,15 * *', async () => {
    logger.info('Starting automatic payout job');

    try {
      const result = await instructorPayoutService.processAutomaticPayouts();
      logger.info({ result }, 'Automatic payout job completed');
    } catch (error) {
      logger.error({ error }, 'Automatic payout job failed');
    }
  });

  logger.info('Auto payout job scheduled (10:00 AM on 1st and 15th)');
}

// ============================================
// Stale Payout Check Job
// ============================================

/**
 * Check for stale pending payouts
 * Runs at 9:00 AM every day
 */
export function scheduleStalePayoutCheckJob() {
  cron.schedule('0 9 * * *', async () => {
    logger.info('Starting stale payout check job');

    try {
      const stalePayouts = await instructorPayoutService.checkStalePendingPayouts();

      if (stalePayouts.length > 0) {
        logger.warn(
          { count: stalePayouts.length, payoutIds: stalePayouts.map(p => p.id) },
          'Stale pending payouts detected',
        );

        // Here you would typically send notifications to admins
        // await notifyAdminsAboutStalePayouts(stalePayouts);
      }

      logger.info('Stale payout check job completed');
    } catch (error) {
      logger.error({ error }, 'Stale payout check job failed');
    }
  });

  logger.info('Stale payout check job scheduled (9:00 AM daily)');
}

// ============================================
// Rating Recalculation Job
// ============================================

/**
 * Recalculate all instructor ratings
 * Runs at 3:00 AM every Sunday
 */
export function scheduleRatingRecalculationJob() {
  cron.schedule('0 3 * * 0', async () => {
    logger.info('Starting rating recalculation job');

    try {
      const instructors = await prisma.instructor_profiles.findMany({
        where: { status: 'APPROVED' },
        select: { id: true },
      });

      for (const instructor of instructors) {
        try {
          await instructorReviewService.calculateAverageRating(instructor.id);
        } catch (error) {
          logger.error(
            { instructorId: instructor.id, error },
            'Failed to recalculate rating for instructor',
          );
        }
      }

      logger.info({ count: instructors.length }, 'Rating recalculation job completed');
    } catch (error) {
      logger.error({ error }, 'Rating recalculation job failed');
    }
  });

  logger.info('Rating recalculation job scheduled (3:00 AM every Sunday)');
}

// ============================================
// Pending Earnings Confirmation Job
// ============================================

/**
 * Auto-confirm pending earnings after 14 days
 * Runs at 4:00 AM every day
 */
export function schedulePendingEarningsJob() {
  cron.schedule('0 4 * * *', async () => {
    logger.info('Starting pending earnings confirmation job');

    try {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      const pendingEarnings = await prisma.instructor_earnings.findMany({
        where: {
          status: 'PENDING',
          createdAt: { lte: fourteenDaysAgo },
        },
      });

      let confirmed = 0;

      for (const earning of pendingEarnings) {
        try {
          await prisma.instructor_earnings.update({
            where: { id: earning.id },
            data: { status: 'CONFIRMED' },
          });
          confirmed++;
        } catch (error) {
          logger.error(
            { earningId: earning.id, error },
            'Failed to confirm earning',
          );
        }
      }

      logger.info(
        { total: pendingEarnings.length, confirmed },
        'Pending earnings confirmation job completed',
      );
    } catch (error) {
      logger.error({ error }, 'Pending earnings confirmation job failed');
    }
  });

  logger.info('Pending earnings confirmation job scheduled (4:00 AM daily)');
}

// ============================================
// Instructor Tier Evaluation Job
// ============================================

/**
 * Evaluate instructors for tier upgrades/downgrades
 * Runs at 5:00 AM on the 1st of each month
 */
export function scheduleTierEvaluationJob() {
  cron.schedule('0 5 1 * *', async () => {
    logger.info('Starting tier evaluation job');

    try {
      const instructors = await prisma.instructor_profiles.findMany({
        where: {
          status: 'APPROVED',
          tier: { not: 'PLATFORM_OWNER' }, // Don't touch platform owners
        },
        include: {
          instructor_earnings: {
            where: {
              status: 'CONFIRMED',
              createdAt: {
                gte: new Date(new Date().setMonth(new Date().getMonth() - 3)),
              },
            },
          },
        },
      });

      for (const instructor of instructors) {
        try {
          // Calculate total earnings in last 3 months
          const totalEarnings = instructor.instructor_earnings.reduce(
            (sum, e) => sum + Number(e.netAmount),
            0,
          );

          // Tier thresholds (configurable)
          const ELITE_THRESHOLD = 10000;   // $10,000 in 3 months
          const PRO_THRESHOLD = 3000;      // $3,000 in 3 months

          let newTier = instructor.tier;

          if (totalEarnings >= ELITE_THRESHOLD && instructor.tier !== 'ELITE') {
            newTier = 'ELITE';
          } else if (totalEarnings >= PRO_THRESHOLD && instructor.tier === 'STARTER') {
            newTier = 'PRO';
          } else if (totalEarnings < PRO_THRESHOLD && instructor.tier === 'PRO') {
            // Only downgrade if they've been PRO for at least 6 months
            // This prevents immediate downgrade after upgrade
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            if (instructor.verifiedAt && instructor.verifiedAt < sixMonthsAgo) {
              // Don't auto-downgrade, just log for admin review
              logger.warn(
                { instructorId: instructor.id, totalEarnings },
                'Instructor may need tier review',
              );
            }
          }

          if (newTier !== instructor.tier) {
            await instructorService.updateInstructorTier(instructor.id, newTier as any);

            logger.info(
              { instructorId: instructor.id, oldTier: instructor.tier, newTier },
              'Instructor tier updated',
            );
          }
        } catch (error) {
          logger.error(
            { instructorId: instructor.id, error },
            'Failed to evaluate instructor tier',
          );
        }
      }

      logger.info({ count: instructors.length }, 'Tier evaluation job completed');
    } catch (error) {
      logger.error({ error }, 'Tier evaluation job failed');
    }
  });

  logger.info('Tier evaluation job scheduled (5:00 AM on 1st of month)');
}

// ============================================
// Initialize All Jobs
// ============================================

/**
 * Initialize all instructor-related cron jobs
 */
export function initializeInstructorJobs() {
  logger.info('Initializing instructor cron jobs...');

  scheduleDailyAnalyticsJob();
  scheduleStatsUpdateJob();
  scheduleAutoPayoutJob();
  scheduleStalePayoutCheckJob();
  scheduleRatingRecalculationJob();
  schedulePendingEarningsJob();
  scheduleTierEvaluationJob();

  logger.info('All instructor cron jobs initialized');
}

// ============================================
// Manual Triggers (for testing/admin)
// ============================================

export async function runDailyAnalyticsNow() {
  logger.info('Manually triggering daily analytics snapshot');
  await instructorAnalyticsService.generateAllDailySnapshots();
}

export async function runStatsUpdateNow() {
  logger.info('Manually triggering stats update');
  await instructorService.updateAllInstructorStats();
}

export async function runAutoPayoutsNow() {
  logger.info('Manually triggering auto payouts');
  return await instructorPayoutService.processAutomaticPayouts();
}
