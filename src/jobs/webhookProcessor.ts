import { logger } from '../utils/logger';
import { config } from '../utils/config';
import {
  processDeliveryQueue,
  retryFailedDeliveries,
  purgeOldDeliveries,
} from '../services/webhookDeliveryService';

let queueIntervalId: NodeJS.Timeout | null = null;
let retryIntervalId: NodeJS.Timeout | null = null;
let purgeIntervalId: NodeJS.Timeout | null = null;
let isProcessing = false;
let isRetrying = false;

/**
 * Start the webhook queue processor
 */
export function startWebhookProcessor(): void {
  if (!config.webhook.enabled) {
    logger.info('Webhook processor not started - webhooks are disabled');
    return;
  }

  // Process queue at regular intervals
  queueIntervalId = setInterval(async () => {
    if (isProcessing) {
      return; // Skip if already processing
    }

    isProcessing = true;
    try {
      const processed = await processDeliveryQueue(10);
      if (processed > 0) {
        logger.debug({ processed }, 'Webhook queue processed');
      }
    } catch (error) {
      logger.error({ error }, 'Error processing webhook queue');
    } finally {
      isProcessing = false;
    }
  }, config.webhook.queueIntervalMs);

  // Retry failed deliveries at longer intervals
  retryIntervalId = setInterval(async () => {
    if (isRetrying) {
      return; // Skip if already retrying
    }

    isRetrying = true;
    try {
      const retried = await retryFailedDeliveries();
      if (retried > 0) {
        logger.debug({ retried }, 'Failed webhooks retried');
      }
    } catch (error) {
      logger.error({ error }, 'Error retrying failed webhooks');
    } finally {
      isRetrying = false;
    }
  }, config.webhook.retryIntervalMs);

  // Purge old deliveries daily (at midnight)
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const msUntilMidnight = midnight.getTime() - now.getTime();

  // Schedule first purge at midnight, then every 24 hours
  setTimeout(() => {
    void purgeOldDeliveries(30);

    purgeIntervalId = setInterval(async () => {
      try {
        const purged = await purgeOldDeliveries(30);
        if (purged > 0) {
          logger.info({ purged }, 'Old webhook deliveries purged');
        }
      } catch (error) {
        logger.error({ error }, 'Error purging old deliveries');
      }
    }, 24 * 60 * 60 * 1000); // Every 24 hours
  }, msUntilMidnight);

  logger.info(
    {
      queueIntervalMs: config.webhook.queueIntervalMs,
      retryIntervalMs: config.webhook.retryIntervalMs,
    },
    'Webhook processor started'
  );
}

/**
 * Stop the webhook queue processor
 */
export function stopWebhookProcessor(): void {
  if (queueIntervalId) {
    clearInterval(queueIntervalId);
    queueIntervalId = null;
  }

  if (retryIntervalId) {
    clearInterval(retryIntervalId);
    retryIntervalId = null;
  }

  if (purgeIntervalId) {
    clearInterval(purgeIntervalId);
    purgeIntervalId = null;
  }

  logger.info('Webhook processor stopped');
}

/**
 * Check if processor is running
 */
export function isProcessorRunning(): boolean {
  return queueIntervalId !== null;
}

/**
 * Manually trigger queue processing
 */
export async function triggerQueueProcessing(): Promise<number> {
  if (isProcessing) {
    return 0;
  }

  isProcessing = true;
  try {
    return await processDeliveryQueue(50);
  } finally {
    isProcessing = false;
  }
}

/**
 * Manually trigger retry processing
 */
export async function triggerRetryProcessing(): Promise<number> {
  if (isRetrying) {
    return 0;
  }

  isRetrying = true;
  try {
    return await retryFailedDeliveries();
  } finally {
    isRetrying = false;
  }
}

export const webhookProcessor = {
  startWebhookProcessor,
  stopWebhookProcessor,
  isProcessorRunning,
  triggerQueueProcessing,
  triggerRetryProcessing,
};
