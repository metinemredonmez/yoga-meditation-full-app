/**
 * AI Agent Cron Jobs
 * Scheduled jobs for processing AI agents
 */

import cron, { ScheduledTask } from 'node-cron';
import { aiAgentService } from '../services/aiAgentService';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

// Store scheduled tasks for cleanup
const scheduledTasks: ScheduledTask[] = [];

/**
 * Initialize all AI agent cron jobs
 */
export function initializeAIAgentJobs(): void {
  logger.info('Initializing AI Agent cron jobs...');

  // ============================================
  // Hourly Jobs
  // ============================================

  // Process retention agents every hour
  // Checks for inactive users and sends re-engagement messages
  const retentionJob = cron.schedule('0 * * * *', async () => {
    logger.info('Running hourly retention agent job');
    try {
      const results = await aiAgentService.batchProcessAgents(100);
      logger.info({ usersProcessed: results.size }, 'Retention agent job completed');
    } catch (error) {
      logger.error({ err: error }, 'Retention agent job failed');
    }
  });
  scheduledTasks.push(retentionJob);

  // ============================================
  // Daily Jobs
  // ============================================

  // Morning engagement at 9 AM
  // Sends daily personalized content suggestions
  const morningJob = cron.schedule('0 9 * * *', async () => {
    logger.info('Running morning engagement job');
    try {
      // Get active users with push enabled
      const users = await prisma.users.findMany({
        where: {
          isActive: true,
        },
        select: { id: true },
        take: 500,
      });

      let sent = 0;
      for (const user of users) {
        try {
          const message = await aiAgentService.contentSchedulingAgent(user.id);
          if (message) {
            await aiAgentService.saveAgentEvent(user.id, 'CONTENT_SCHEDULING', message);
            sent++;
          }
        } catch (err) {
          // Continue with next user
        }
      }

      logger.info({ userCount: users.length, messagesSent: sent }, 'Morning engagement job completed');
    } catch (error) {
      logger.error({ err: error }, 'Morning engagement job failed');
    }
  });
  scheduledTasks.push(morningJob);

  // Evening sleep reminder at 10 PM
  const sleepJob = cron.schedule('0 22 * * *', async () => {
    logger.info('Running sleep agent job');
    try {
      // Get users who have sleep tracking or stories
      const users = await prisma.users.findMany({
        where: {
          isActive: true,
        },
        select: { id: true },
        take: 500,
      });

      let sent = 0;
      for (const user of users) {
        try {
          const message = await aiAgentService.sleepAgent(user.id);
          if (message) {
            await aiAgentService.saveAgentEvent(user.id, 'SLEEP', message);
            sent++;
          }
        } catch (err) {
          // Continue with next user
        }
      }

      logger.info({ userCount: users.length, messagesSent: sent }, 'Sleep agent job completed');
    } catch (error) {
      logger.error({ err: error }, 'Sleep agent job failed');
    }
  });
  scheduledTasks.push(sleepJob);

  // Streak risk check at 6 PM
  // Alerts users whose streak is about to be lost
  const streakJob = cron.schedule('0 18 * * *', async () => {
    logger.info('Running streak risk agent job');
    try {
      // Get users with active streaks who haven't been active today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const usersAtRisk = await prisma.users.findMany({
        where: {
          isActive: true,
        },
        select: { id: true },
        take: 500,
      });

      let sent = 0;
      for (const user of usersAtRisk) {
        try {
          const message = await aiAgentService.retentionAgent(user.id);
          if (message) {
            await aiAgentService.saveAgentEvent(user.id, 'RETENTION', message);
            sent++;
          }
        } catch (err) {
          // Continue with next user
        }
      }

      logger.info({ usersAtRisk: usersAtRisk.length, messagesSent: sent }, 'Streak risk job completed');
    } catch (error) {
      logger.error({ err: error }, 'Streak risk job failed');
    }
  });
  scheduledTasks.push(streakJob);

  // ============================================
  // Weekly Jobs
  // ============================================

  // Weekly summary on Sundays at 10 AM
  const weeklySummaryJob = cron.schedule('0 10 * * 0', async () => {
    logger.info('Running weekly summary job');
    try {
      const users = await prisma.users.findMany({
        where: { isActive: true },
        select: { id: true },
        take: 1000,
      });

      let sent = 0;
      for (const user of users) {
        try {
          const message = await aiAgentService.streakGamificationAgent(user.id);
          if (message && message.title.includes('Haftalık')) {
            await aiAgentService.saveAgentEvent(user.id, 'STREAK_GAMIFICATION', message);
            sent++;
          }
        } catch (err) {
          // Continue with next user
        }
      }

      logger.info({ userCount: users.length, messagesSent: sent }, 'Weekly summary job completed');
    } catch (error) {
      logger.error({ err: error }, 'Weekly summary job failed');
    }
  });
  scheduledTasks.push(weeklySummaryJob);

  // Instructor weekly report on Mondays at 9 AM
  const instructorReportJob = cron.schedule('0 9 * * 1', async () => {
    logger.info('Running instructor weekly report job');
    try {
      const instructors = await prisma.users.findMany({
        where: {
          role: 'TEACHER',
          isActive: true,
        },
        select: { id: true },
      });

      let sent = 0;
      for (const instructor of instructors) {
        try {
          const message = await aiAgentService.instructorAgent(instructor.id);
          if (message) {
            await aiAgentService.saveAgentEvent(instructor.id, 'INSTRUCTOR', message);
            sent++;
          }
        } catch (err) {
          // Continue with next instructor
        }
      }

      logger.info({ instructorCount: instructors.length, reportsSent: sent }, 'Instructor report job completed');
    } catch (error) {
      logger.error({ err: error }, 'Instructor report job failed');
    }
  });
  scheduledTasks.push(instructorReportJob);

  // ============================================
  // Engagement Score Updates
  // ============================================

  // Update engagement scores every 6 hours
  const engagementScoreJob = cron.schedule('0 */6 * * *', async () => {
    logger.info('Running engagement score update job');
    try {
      const users = await prisma.users.findMany({
        where: { isActive: true },
        select: { id: true },
        take: 500,
      });

      let updated = 0;
      for (const user of users) {
        try {
          const context = await aiAgentService.getUserContext(user.id);
          if (!context) continue;

          // Calculate scores
          const activityScore = Math.max(0, 100 - context.daysSinceActive * 5);
          const streakScore = Math.min(100, context.streakDays * 3);
          const contentScore = Math.min(100, context.totalMinutes / 10);

          let churnRisk = 0;
          if (context.daysSinceActive > 7) churnRisk += 30;
          if (context.daysSinceActive > 14) churnRisk += 30;
          if (context.daysSinceActive > 30) churnRisk += 40;
          if (context.streakDays === 0) churnRisk += 10;
          if (context.subscriptionTier === 'FREE') churnRisk += 10;

          const overallScore = (activityScore + streakScore + contentScore) / 3;

          await prisma.user_engagement_scores.upsert({
            where: { userId: user.id },
            create: {
              userId: user.id,
              overallScore,
              activityScore,
              streakScore,
              contentScore,
              churnRisk: Math.min(100, churnRisk),
              lastCalculatedAt: new Date(),
            },
            update: {
              overallScore,
              activityScore,
              streakScore,
              contentScore,
              churnRisk: Math.min(100, churnRisk),
              lastCalculatedAt: new Date(),
            },
          });

          updated++;
        } catch (err) {
          // Continue with next user
        }
      }

      logger.info({ usersProcessed: users.length, updated }, 'Engagement score update completed');
    } catch (error) {
      logger.error({ err: error }, 'Engagement score update job failed');
    }
  });
  scheduledTasks.push(engagementScoreJob);

  // ============================================
  // Subscription & Trial Reminders
  // ============================================

  // Check for expiring subscriptions daily at 10 AM
  const subscriptionReminderJob = cron.schedule('0 10 * * *', async () => {
    logger.info('Running subscription reminder job');
    try {
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Get expiring subscriptions
      const expiringSubscriptions = await prisma.subscriptions.findMany({
        where: {
          status: 'ACTIVE',
          currentPeriodEnd: {
            gte: now,
            lte: sevenDaysFromNow,
          },
        },
        include: {
          users: { select: { id: true, firstName: true } },
          plan: { select: { tier: true, name: true } },
        },
      });

      let sent = 0;
      for (const sub of expiringSubscriptions) {
        try {
          if (!sub.currentPeriodEnd) continue;

          const daysUntilExpiry = Math.ceil(
            (sub.currentPeriodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
          );

          // Only send for 7 days or 1 day before
          if (daysUntilExpiry === 7 || daysUntilExpiry === 1) {
            const message = await aiAgentService.subscriptionAgent(sub.userId);
            if (message) {
              await aiAgentService.saveAgentEvent(sub.userId, 'SUBSCRIPTION', message);
              sent++;
            }
          }
        } catch (err) {
          // Continue with next subscription
        }
      }

      logger.info({ expiring: expiringSubscriptions.length, remindersSent: sent }, 'Subscription reminder job completed');
    } catch (error) {
      logger.error({ err: error }, 'Subscription reminder job failed');
    }
  });
  scheduledTasks.push(subscriptionReminderJob);

  // ============================================
  // Analytics Aggregation
  // ============================================

  // Aggregate daily analytics at midnight
  const analyticsJob = cron.schedule('5 0 * * *', async () => {
    logger.info('Running analytics aggregation job');
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all events from yesterday
      const events = await prisma.ai_agent_events.groupBy({
        by: ['agentType', 'channel', 'status'],
        where: {
          createdAt: { gte: yesterday, lt: today },
        },
        _count: true,
      });

      // Aggregate by agentType and channel
      const aggregated: Record<string, Record<string, any>> = {};

      for (const event of events) {
        const key = `${event.agentType}_${event.channel}`;
        if (!aggregated[key]) {
          aggregated[key] = {
            agentType: event.agentType,
            channel: event.channel,
            totalSent: 0,
            totalDelivered: 0,
            totalOpened: 0,
            totalClicked: 0,
            totalDismissed: 0,
            totalFailed: 0,
          };
        }

        switch (event.status) {
          case 'SENT':
            aggregated[key].totalSent += event._count;
            break;
          case 'DELIVERED':
            aggregated[key].totalDelivered += event._count;
            break;
          case 'OPENED':
            aggregated[key].totalOpened += event._count;
            break;
          case 'CLICKED':
            aggregated[key].totalClicked += event._count;
            break;
          case 'DISMISSED':
            aggregated[key].totalDismissed += event._count;
            break;
          case 'FAILED':
            aggregated[key].totalFailed += event._count;
            break;
        }
      }

      // Save analytics
      for (const data of Object.values(aggregated)) {
        const { agentType, channel, totalSent, totalDelivered, totalOpened, totalClicked, totalDismissed, totalFailed } = data;

        await prisma.ai_agent_analytics.upsert({
          where: {
            date_agentType_channel: {
              date: yesterday,
              agentType,
              channel,
            },
          },
          create: {
            date: yesterday,
            agentType,
            channel,
            totalSent,
            totalDelivered,
            totalOpened,
            totalClicked,
            totalDismissed,
            totalFailed,
          },
          update: {
            totalSent,
            totalDelivered,
            totalOpened,
            totalClicked,
            totalDismissed,
            totalFailed,
          },
        });
      }

      logger.info({ aggregatedKeys: Object.keys(aggregated).length }, 'Analytics aggregation completed');
    } catch (error) {
      logger.error({ err: error }, 'Analytics aggregation job failed');
    }
  });
  scheduledTasks.push(analyticsJob);

  // ============================================
  // Cleanup Jobs
  // ============================================

  // Clean old events (older than 90 days) weekly on Sundays at 3 AM
  const cleanupJob = cron.schedule('0 3 * * 0', async () => {
    logger.info('Running AI agent cleanup job');
    try {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      const deleted = await prisma.ai_agent_events.deleteMany({
        where: {
          createdAt: { lt: ninetyDaysAgo },
        },
      });

      logger.info({ deletedCount: deleted.count }, 'AI agent cleanup completed');
    } catch (error) {
      logger.error({ err: error }, 'AI agent cleanup job failed');
    }
  });
  scheduledTasks.push(cleanupJob);

  logger.info(`AI Agent jobs initialized: ${scheduledTasks.length} jobs scheduled`);
}

/**
 * Stop all AI agent cron jobs
 */
export function stopAIAgentJobs(): void {
  logger.info('Stopping AI Agent cron jobs...');
  for (const task of scheduledTasks) {
    task.stop();
  }
  scheduledTasks.length = 0;
  logger.info('AI Agent cron jobs stopped');
}

/**
 * Get status of all AI agent jobs
 */
export function getAIAgentJobsStatus(): { name: string; running: boolean }[] {
  return scheduledTasks.map((task, index) => ({
    name: `AI Agent Job ${index + 1}`,
    running: scheduledTasks.length > 0,
  }));
}
