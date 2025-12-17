import * as cron from 'node-cron';
import { logger } from '../utils/logger';
import { createDailySnapshot } from '../services/analyticsService';
import { generateScheduledReports } from '../services/reportService';

let snapshotJob: cron.ScheduledTask | null = null;
let reportJob: cron.ScheduledTask | null = null;

/**
 * Start the daily analytics snapshot job
 * Runs every day at 00:05 (5 minutes after midnight)
 */
export function startAnalyticsSnapshotJob() {
  if (snapshotJob) {
    logger.warn('Analytics snapshot job is already running');
    return;
  }

  // Run at 00:05 every day
  snapshotJob = cron.schedule('5 0 * * *', async () => {
    logger.info('Running daily analytics snapshot job');

    try {
      const snapshot = await createDailySnapshot();
      logger.info({ snapshotId: snapshot.id, date: snapshot.date }, 'Daily analytics snapshot created');
    } catch (error) {
      logger.error({ error }, 'Failed to create daily analytics snapshot');
    }
  });

  logger.info('Analytics snapshot job scheduled (runs daily at 00:05)');
}

/**
 * Start the monthly reports job
 * Runs on the 1st of each month at 01:00
 */
export function startMonthlyReportsJob() {
  if (reportJob) {
    logger.warn('Monthly reports job is already running');
    return;
  }

  // Run at 01:00 on the 1st of each month
  reportJob = cron.schedule('0 1 1 * *', async () => {
    logger.info('Running monthly reports job');

    try {
      const reports = await generateScheduledReports();
      logger.info('Monthly reports generated successfully');

      // Here you could add logic to:
      // - Store reports in cloud storage
      // - Send reports via email to admins
      // - Create notifications for reports
    } catch (error) {
      logger.error({ error }, 'Failed to generate monthly reports');
    }
  });

  logger.info('Monthly reports job scheduled (runs on 1st of each month at 01:00)');
}

/**
 * Stop all analytics jobs
 */
export function stopAnalyticsJobs() {
  if (snapshotJob) {
    snapshotJob.stop();
    snapshotJob = null;
    logger.info('Analytics snapshot job stopped');
  }

  if (reportJob) {
    reportJob.stop();
    reportJob = null;
    logger.info('Monthly reports job stopped');
  }
}

/**
 * Initialize all analytics jobs
 */
export function initializeAnalyticsJobs() {
  startAnalyticsSnapshotJob();
  startMonthlyReportsJob();
}

/**
 * Manually trigger a snapshot (useful for testing or manual runs)
 */
export async function triggerSnapshot(date?: Date) {
  logger.info({ date }, 'Manually triggering analytics snapshot');

  try {
    const snapshot = await createDailySnapshot(date);
    logger.info({ snapshotId: snapshot.id, date: snapshot.date }, 'Manual analytics snapshot created');
    return snapshot;
  } catch (error) {
    logger.error({ error }, 'Failed to create manual analytics snapshot');
    throw error;
  }
}
