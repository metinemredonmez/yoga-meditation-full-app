import * as cron from 'node-cron';
import { logger } from '../utils/logger';
import * as liveStreamJobs from './liveStreamJobs';

let reminderJob: cron.ScheduledTask | null = null;
let recurringJob: cron.ScheduledTask | null = null;
let cleanupJob: cron.ScheduledTask | null = null;
let recordingsJob: cron.ScheduledTask | null = null;
let expireJob: cron.ScheduledTask | null = null;
let statsJob: cron.ScheduledTask | null = null;

export function initializeLiveStreamJobs() {
  logger.info('Initializing live stream cron jobs...');

  // Send stream reminders every 5 minutes
  reminderJob = cron.schedule('*/5 * * * *', async () => {
    try {
      await liveStreamJobs.sendStreamReminders();
    } catch (error) {
      logger.error({ error }, 'Stream reminders job failed');
    }
  });

  // Process recurring streams every hour
  recurringJob = cron.schedule('0 * * * *', async () => {
    try {
      await liveStreamJobs.processRecurringStreams();
    } catch (error) {
      logger.error({ error }, 'Recurring streams job failed');
    }
  });

  // Cleanup ended streams every 10 minutes
  cleanupJob = cron.schedule('*/10 * * * *', async () => {
    try {
      await liveStreamJobs.cleanupEndedStreams();
    } catch (error) {
      logger.error({ error }, 'Cleanup ended streams job failed');
    }
  });

  // Process recordings every 5 minutes
  recordingsJob = cron.schedule('*/5 * * * *', async () => {
    try {
      await liveStreamJobs.processRecordings();
    } catch (error) {
      logger.error({ error }, 'Process recordings job failed');
    }
  });

  // Expire old recordings daily at 3 AM
  expireJob = cron.schedule('0 3 * * *', async () => {
    try {
      await liveStreamJobs.expireOldRecordings();
    } catch (error) {
      logger.error({ error }, 'Expire old recordings job failed');
    }
  });

  // Update stream stats every minute
  statsJob = cron.schedule('* * * * *', async () => {
    try {
      await liveStreamJobs.updateStreamStats();
    } catch (error) {
      logger.error({ error }, 'Update stream stats job failed');
    }
  });

  logger.info('Live stream cron jobs initialized');
}

export function stopLiveStreamJobs() {
  logger.info('Stopping live stream cron jobs...');

  if (reminderJob) {
    reminderJob.stop();
    reminderJob = null;
  }

  if (recurringJob) {
    recurringJob.stop();
    recurringJob = null;
  }

  if (cleanupJob) {
    cleanupJob.stop();
    cleanupJob = null;
  }

  if (recordingsJob) {
    recordingsJob.stop();
    recordingsJob = null;
  }

  if (expireJob) {
    expireJob.stop();
    expireJob = null;
  }

  if (statsJob) {
    statsJob.stop();
    statsJob = null;
  }

  logger.info('Live stream cron jobs stopped');
}
