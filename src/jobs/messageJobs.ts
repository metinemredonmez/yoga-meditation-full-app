import * as cron from 'node-cron';
import { logger } from '../utils/logger';
import * as automatedMessageService from '../services/automatedMessageService';
import * as digestGeneratorService from '../services/digestGeneratorService';
import * as campaignService from '../services/campaignService';

let scheduledMessagesJob: cron.ScheduledTask | null = null;
let weeklyDigestsJob: cron.ScheduledTask | null = null;
let monthlyDigestsJob: cron.ScheduledTask | null = null;
let inactiveUsersJob: cron.ScheduledTask | null = null;
let trialExpirationsJob: cron.ScheduledTask | null = null;
let renewalRemindersJob: cron.ScheduledTask | null = null;
let campaignsJob: cron.ScheduledTask | null = null;

// ============================================
// Scheduled Messages Job
// ============================================

/**
 * Process scheduled messages (every 5 minutes)
 */
export function startScheduledMessagesJob() {
  if (scheduledMessagesJob) {
    logger.warn('Scheduled messages job is already running');
    return;
  }

  // Every 5 minutes
  scheduledMessagesJob = cron.schedule('*/5 * * * *', async () => {
    logger.debug('Running scheduled messages job');

    try {
      const count = await automatedMessageService.processScheduledMessages();
      if (count > 0) {
        logger.info({ count }, 'Processed scheduled messages');
      }
    } catch (error) {
      logger.error({ error }, 'Failed to process scheduled messages');
    }
  });

  logger.info('Scheduled messages job started (runs every 5 minutes)');
}

// ============================================
// Weekly Digest Job
// ============================================

/**
 * Send weekly digests (Monday at 09:00)
 */
export function startWeeklyDigestsJob() {
  if (weeklyDigestsJob) {
    logger.warn('Weekly digests job is already running');
    return;
  }

  // Monday at 09:00
  weeklyDigestsJob = cron.schedule('0 9 * * 1', async () => {
    logger.info('Running weekly digests job');

    try {
      const recipients = await digestGeneratorService.getWeeklyDigestRecipients();
      let sentCount = 0;

      for (const userId of recipients) {
        try {
          const digestData = await digestGeneratorService.generateWeeklyDigestData(userId);
          await automatedMessageService.sendWeeklyDigest(userId, digestData);
          sentCount++;
        } catch (error) {
          logger.error({ error, userId }, 'Failed to send weekly digest to user');
        }
      }

      logger.info({ sentCount, totalRecipients: recipients.length }, 'Weekly digests sent');
    } catch (error) {
      logger.error({ error }, 'Failed to run weekly digests job');
    }
  });

  logger.info('Weekly digests job scheduled (runs Monday at 09:00)');
}

// ============================================
// Monthly Digest Job
// ============================================

/**
 * Send monthly digests (1st of month at 09:00)
 */
export function startMonthlyDigestsJob() {
  if (monthlyDigestsJob) {
    logger.warn('Monthly digests job is already running');
    return;
  }

  // 1st of each month at 09:00
  monthlyDigestsJob = cron.schedule('0 9 1 * *', async () => {
    logger.info('Running monthly digests job');

    try {
      const recipients = await digestGeneratorService.getMonthlyDigestRecipients();
      let sentCount = 0;

      for (const userId of recipients) {
        try {
          const digestData = await digestGeneratorService.generateMonthlyDigestData(userId);
          await automatedMessageService.sendMonthlyDigest(userId, digestData);
          sentCount++;
        } catch (error) {
          logger.error({ error, userId }, 'Failed to send monthly digest to user');
        }
      }

      logger.info({ sentCount, totalRecipients: recipients.length }, 'Monthly digests sent');
    } catch (error) {
      logger.error({ error }, 'Failed to run monthly digests job');
    }
  });

  logger.info('Monthly digests job scheduled (runs 1st of month at 09:00)');
}

// ============================================
// Inactive Users Job
// ============================================

/**
 * Check and notify inactive users (daily at 10:00)
 */
export function startInactiveUsersJob() {
  if (inactiveUsersJob) {
    logger.warn('Inactive users job is already running');
    return;
  }

  // Daily at 10:00
  inactiveUsersJob = cron.schedule('0 10 * * *', async () => {
    logger.info('Running inactive users job');

    try {
      // 7 days inactive
      const inactive7Days = await digestGeneratorService.getInactiveUsers(7);
      for (const user of inactive7Days) {
        try {
          await automatedMessageService.sendInactivityReminder(user.userId, 7);
        } catch (error) {
          logger.error({ error, userId: user.userId }, 'Failed to send 7-day inactivity reminder');
        }
      }

      // 14 days inactive
      const inactive14Days = await digestGeneratorService.getInactiveUsers(14);
      for (const user of inactive14Days) {
        try {
          await automatedMessageService.sendInactivityReminder(user.userId, 14);
        } catch (error) {
          logger.error({ error, userId: user.userId }, 'Failed to send 14-day inactivity reminder');
        }
      }

      // 30 days inactive
      const inactive30Days = await digestGeneratorService.getInactiveUsers(30);
      for (const user of inactive30Days) {
        try {
          await automatedMessageService.sendInactivityReminder(user.userId, 30);
        } catch (error) {
          logger.error({ error, userId: user.userId }, 'Failed to send 30-day inactivity reminder');
        }
      }

      logger.info(
        {
          inactive7Days: inactive7Days.length,
          inactive14Days: inactive14Days.length,
          inactive30Days: inactive30Days.length,
        },
        'Inactive users check completed',
      );
    } catch (error) {
      logger.error({ error }, 'Failed to run inactive users job');
    }
  });

  logger.info('Inactive users job scheduled (runs daily at 10:00)');
}

// ============================================
// Trial Expirations Job
// ============================================

/**
 * Check trial expirations (daily at 08:00)
 */
export function startTrialExpirationsJob() {
  if (trialExpirationsJob) {
    logger.warn('Trial expirations job is already running');
    return;
  }

  // Daily at 08:00
  trialExpirationsJob = cron.schedule('0 8 * * *', async () => {
    logger.info('Running trial expirations job');

    try {
      // Users with trial ending today
      const expiringToday = await digestGeneratorService.getUsersWithExpiringTrials(0);
      for (const user of expiringToday) {
        // Trial expired message will be sent by scheduled message system
      }

      // Users with trial ending tomorrow
      const expiringTomorrow = await digestGeneratorService.getUsersWithExpiringTrials(1);
      // These should already have reminders scheduled

      // Users with trial ending in 3 days
      const expiring3Days = await digestGeneratorService.getUsersWithExpiringTrials(3);
      // These should already have reminders scheduled

      logger.info(
        {
          expiringToday: expiringToday.length,
          expiringTomorrow: expiringTomorrow.length,
          expiring3Days: expiring3Days.length,
        },
        'Trial expirations check completed',
      );
    } catch (error) {
      logger.error({ error }, 'Failed to run trial expirations job');
    }
  });

  logger.info('Trial expirations job scheduled (runs daily at 08:00)');
}

// ============================================
// Subscription Renewals Job
// ============================================

/**
 * Check subscription renewals (daily at 08:00)
 */
export function startRenewalRemindersJob() {
  if (renewalRemindersJob) {
    logger.warn('Renewal reminders job is already running');
    return;
  }

  // Daily at 08:00
  renewalRemindersJob = cron.schedule('0 8 * * *', async () => {
    logger.info('Running renewal reminders job');

    try {
      // Subscriptions renewing in 7 days
      const renewingIn7Days = await digestGeneratorService.getUsersWithUpcomingRenewals(7);

      for (const sub of renewingIn7Days) {
        try {
          // Check if reminder already sent
          await automatedMessageService.scheduleRenewalReminder(
            sub.userId,
            sub.currentPeriodEnd,
            sub.planName,
            'Plan ücreti', // Amount would come from plan details
          );
        } catch (error) {
          logger.error({ error, userId: sub.userId }, 'Failed to schedule renewal reminder');
        }
      }

      logger.info(
        { renewingIn7Days: renewingIn7Days.length },
        'Renewal reminders check completed',
      );
    } catch (error) {
      logger.error({ error }, 'Failed to run renewal reminders job');
    }
  });

  logger.info('Renewal reminders job scheduled (runs daily at 08:00)');
}

// ============================================
// Campaigns Job
// ============================================

/**
 * Process scheduled campaigns (hourly)
 */
export function startCampaignsJob() {
  if (campaignsJob) {
    logger.warn('Campaigns job is already running');
    return;
  }

  // Every hour
  campaignsJob = cron.schedule('0 * * * *', async () => {
    logger.debug('Running campaigns job');

    try {
      const count = await campaignService.processScheduledCampaigns();
      if (count > 0) {
        logger.info({ count }, 'Processed scheduled campaigns');
      }
    } catch (error) {
      logger.error({ error }, 'Failed to process scheduled campaigns');
    }
  });

  logger.info('Campaigns job scheduled (runs every hour)');
}

// ============================================
// Job Management
// ============================================

/**
 * Initialize all message jobs
 */
export function initializeMessageJobs() {
  startScheduledMessagesJob();
  startWeeklyDigestsJob();
  startMonthlyDigestsJob();
  startInactiveUsersJob();
  startTrialExpirationsJob();
  startRenewalRemindersJob();
  startCampaignsJob();

  logger.info('All message jobs initialized');
}

/**
 * Stop all message jobs
 */
export function stopMessageJobs() {
  if (scheduledMessagesJob) {
    scheduledMessagesJob.stop();
    scheduledMessagesJob = null;
  }

  if (weeklyDigestsJob) {
    weeklyDigestsJob.stop();
    weeklyDigestsJob = null;
  }

  if (monthlyDigestsJob) {
    monthlyDigestsJob.stop();
    monthlyDigestsJob = null;
  }

  if (inactiveUsersJob) {
    inactiveUsersJob.stop();
    inactiveUsersJob = null;
  }

  if (trialExpirationsJob) {
    trialExpirationsJob.stop();
    trialExpirationsJob = null;
  }

  if (renewalRemindersJob) {
    renewalRemindersJob.stop();
    renewalRemindersJob = null;
  }

  if (campaignsJob) {
    campaignsJob.stop();
    campaignsJob = null;
  }

  logger.info('All message jobs stopped');
}

/**
 * Manually trigger specific jobs (for testing)
 */
export async function triggerJob(jobName: string): Promise<void> {
  logger.info({ jobName }, 'Manually triggering job');

  switch (jobName) {
    case 'scheduled_messages':
      await automatedMessageService.processScheduledMessages();
      break;
    case 'weekly_digests':
      const weeklyRecipients = await digestGeneratorService.getWeeklyDigestRecipients();
      for (const userId of weeklyRecipients.slice(0, 10)) { // Limit for manual trigger
        const data = await digestGeneratorService.generateWeeklyDigestData(userId);
        await automatedMessageService.sendWeeklyDigest(userId, data);
      }
      break;
    case 'monthly_digests':
      const monthlyRecipients = await digestGeneratorService.getMonthlyDigestRecipients();
      for (const userId of monthlyRecipients.slice(0, 10)) { // Limit for manual trigger
        const data = await digestGeneratorService.generateMonthlyDigestData(userId);
        await automatedMessageService.sendMonthlyDigest(userId, data);
      }
      break;
    case 'inactive_users':
      const inactive = await digestGeneratorService.getInactiveUsers(7);
      for (const user of inactive.slice(0, 10)) { // Limit for manual trigger
        await automatedMessageService.sendInactivityReminder(user.userId, 7);
      }
      break;
    case 'campaigns':
      await campaignService.processScheduledCampaigns();
      break;
    default:
      throw new Error(`Unknown job: ${jobName}`);
  }

  logger.info({ jobName }, 'Job triggered successfully');
}
