import { WebhookEvent, WebhookDeliveryStatus, Prisma } from '@prisma/client';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { config } from '../utils/config';
import { createSignature } from '../utils/webhookCrypto';

const MAX_CONSECUTIVE_FAILURES = 10;

interface DeliveryFilters {
  status?: WebhookDeliveryStatus;
  event?: WebhookEvent;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

/**
 * Create a new delivery record
 */
export async function createDelivery(
  endpointId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>
) {
  const delivery = await prisma.webhookDelivery.create({
    data: {
      endpointId,
      event,
      payload: payload as Prisma.InputJsonValue,
      status: 'PENDING',
      attempts: 0,
      maxAttempts: config.webhook.maxRetries,
    },
  });

  return delivery;
}

/**
 * Queue a delivery for processing
 */
export async function queueDelivery(
  endpointId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>
) {
  return createDelivery(endpointId, event, payload);
}

/**
 * Send a webhook delivery
 */
export async function sendDelivery(deliveryId: string): Promise<boolean> {
  const delivery = await prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: { endpoint: true },
  });

  if (!delivery) {
    logger.error({ deliveryId }, 'Delivery not found');
    return false;
  }

  if (!delivery.endpoint.isActive) {
    logger.warn({ deliveryId, endpointId: delivery.endpointId }, 'Endpoint is disabled, skipping delivery');
    return false;
  }

  // Update status to SENDING
  await prisma.webhookDelivery.update({
    where: { id: deliveryId },
    data: {
      status: 'SENDING',
      attempts: { increment: 1 },
    },
  });

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const body = JSON.stringify({
      id: deliveryId,
      event: delivery.event,
      created_at: new Date().toISOString(),
      data: delivery.payload,
    });

    // Create signature using the stored (hashed) secret
    // Note: In production, you'd store the plain secret encrypted, not hashed
    // For now, we use the hashed secret as the signing key
    const signature = createSignature(body, delivery.endpoint.secret, timestamp);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.webhook.timeoutMs);

    const response = await fetch(delivery.endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [config.webhook.signatureHeader]: signature,
        'X-Webhook-Event': delivery.event,
        'X-Webhook-Delivery-Id': deliveryId,
        'User-Agent': 'YogaApp-Webhook/1.0',
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseBody = await response.text().catch(() => '');
    const truncatedBody = responseBody.substring(0, 1000);

    if (response.ok) {
      // Success
      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'DELIVERED',
          responseStatus: response.status,
          responseBody: truncatedBody,
          deliveredAt: new Date(),
        },
      });

      // Update endpoint success status
      await prisma.webhookEndpoint.update({
        where: { id: delivery.endpointId },
        data: {
          lastSuccessAt: new Date(),
          failureCount: 0, // Reset on success
        },
      });

      logger.info(
        { deliveryId, endpointId: delivery.endpointId, status: response.status },
        'Webhook delivered successfully'
      );

      return true;
    } else {
      // HTTP error
      await handleDeliveryFailure(
        deliveryId,
        delivery.endpointId,
        delivery.attempts + 1,
        delivery.maxAttempts,
        response.status,
        truncatedBody,
        `HTTP ${response.status}`
      );

      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await handleDeliveryFailure(
      deliveryId,
      delivery.endpointId,
      delivery.attempts + 1,
      delivery.maxAttempts,
      null,
      null,
      errorMessage
    );

    return false;
  }
}

/**
 * Handle delivery failure
 */
async function handleDeliveryFailure(
  deliveryId: string,
  endpointId: string,
  currentAttempts: number,
  maxAttempts: number,
  responseStatus: number | null,
  responseBody: string | null,
  errorMessage: string
) {
  const shouldRetry = currentAttempts < maxAttempts;
  const retryDelays = config.webhook.retryDelays;
  const delayIndex = Math.min(currentAttempts - 1, retryDelays.length - 1);
  const nextRetryDelay = retryDelays[delayIndex] ?? 60;

  await prisma.webhookDelivery.update({
    where: { id: deliveryId },
    data: {
      status: shouldRetry ? 'PENDING' : 'FAILED',
      responseStatus,
      responseBody,
      errorMessage,
      nextRetryAt: shouldRetry ? new Date(Date.now() + nextRetryDelay * 1000) : null,
    },
  });

  // Update endpoint failure count
  const endpoint = await prisma.webhookEndpoint.update({
    where: { id: endpointId },
    data: {
      lastFailureAt: new Date(),
      failureCount: { increment: 1 },
    },
  });

  // Auto-disable after too many consecutive failures
  if (endpoint.failureCount >= MAX_CONSECUTIVE_FAILURES) {
    await prisma.webhookEndpoint.update({
      where: { id: endpointId },
      data: { isActive: false },
    });

    logger.warn(
      { endpointId, failureCount: endpoint.failureCount },
      'Webhook endpoint auto-disabled due to consecutive failures'
    );
  }

  logger.warn(
    { deliveryId, endpointId, attempts: currentAttempts, maxAttempts, shouldRetry, errorMessage },
    'Webhook delivery failed'
  );
}

/**
 * Process pending deliveries in the queue
 */
export async function processDeliveryQueue(concurrency: number = 10): Promise<number> {
  const pendingDeliveries = await prisma.webhookDelivery.findMany({
    where: {
      status: 'PENDING',
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
    },
    take: concurrency,
    orderBy: { createdAt: 'asc' },
  });

  if (pendingDeliveries.length === 0) {
    return 0;
  }

  const results = await Promise.allSettled(
    pendingDeliveries.map((delivery) => sendDelivery(delivery.id))
  );

  const successCount = results.filter(
    (r) => r.status === 'fulfilled' && r.value === true
  ).length;

  logger.debug(
    { processed: pendingDeliveries.length, succeeded: successCount },
    'Processed delivery queue'
  );

  return pendingDeliveries.length;
}

/**
 * Retry failed deliveries that are due for retry
 */
export async function retryFailedDeliveries(): Promise<number> {
  const dueForRetry = await prisma.webhookDelivery.findMany({
    where: {
      status: 'PENDING',
      nextRetryAt: { lte: new Date() },
      attempts: { lt: prisma.webhookDelivery.fields.maxAttempts },
    },
    take: 50,
    orderBy: { nextRetryAt: 'asc' },
  });

  if (dueForRetry.length === 0) {
    return 0;
  }

  const results = await Promise.allSettled(
    dueForRetry.map((delivery) => sendDelivery(delivery.id))
  );

  const successCount = results.filter(
    (r) => r.status === 'fulfilled' && r.value === true
  ).length;

  logger.info(
    { retried: dueForRetry.length, succeeded: successCount },
    'Retried failed deliveries'
  );

  return dueForRetry.length;
}

/**
 * Get delivery status
 */
export async function getDeliveryStatus(deliveryId: string) {
  return prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: {
      endpoint: {
        select: { id: true, name: true, url: true },
      },
    },
  });
}

/**
 * List deliveries for an endpoint
 */
export async function listDeliveries(endpointId: string, filters: DeliveryFilters = {}) {
  const { status, event, startDate, endDate, page = 1, limit = 20 } = filters;

  const where = {
    endpointId,
    ...(status && { status }),
    ...(event && { event }),
    ...(startDate && { createdAt: { gte: startDate } }),
    ...(endDate && { createdAt: { lte: endDate } }),
  };

  const [deliveries, total] = await Promise.all([
    prisma.webhookDelivery.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.webhookDelivery.count({ where }),
  ]);

  return {
    deliveries,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Cancel a pending delivery
 */
export async function cancelDelivery(deliveryId: string): Promise<boolean> {
  const delivery = await prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
  });

  if (!delivery || delivery.status !== 'PENDING') {
    return false;
  }

  await prisma.webhookDelivery.update({
    where: { id: deliveryId },
    data: {
      status: 'FAILED',
      errorMessage: 'Cancelled by user',
    },
  });

  return true;
}

/**
 * Retry a specific delivery
 */
export async function retryDelivery(deliveryId: string): Promise<boolean> {
  const delivery = await prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
  });

  if (!delivery) {
    return false;
  }

  // Reset for retry
  await prisma.webhookDelivery.update({
    where: { id: deliveryId },
    data: {
      status: 'PENDING',
      attempts: 0,
      nextRetryAt: null,
      errorMessage: null,
    },
  });

  return sendDelivery(deliveryId);
}

/**
 * Get delivery statistics
 */
export async function getDeliveryStats(endpointId?: string) {
  const where = endpointId ? { endpointId } : {};

  const [total, pending, delivered, failed] = await Promise.all([
    prisma.webhookDelivery.count({ where }),
    prisma.webhookDelivery.count({ where: { ...where, status: 'PENDING' } }),
    prisma.webhookDelivery.count({ where: { ...where, status: 'DELIVERED' } }),
    prisma.webhookDelivery.count({ where: { ...where, status: 'FAILED' } }),
  ]);

  return {
    total,
    pending,
    delivered,
    failed,
    successRate: total > 0 ? Math.round((delivered / total) * 10000) / 100 : 0,
  };
}

/**
 * Purge old delivery records
 */
export async function purgeOldDeliveries(daysOld: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.webhookDelivery.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
      status: { in: ['DELIVERED', 'FAILED'] },
    },
  });

  logger.info({ deleted: result.count, daysOld }, 'Purged old webhook deliveries');

  return result.count;
}

export const webhookDeliveryService = {
  createDelivery,
  queueDelivery,
  sendDelivery,
  processDeliveryQueue,
  retryFailedDeliveries,
  getDeliveryStatus,
  listDeliveries,
  cancelDelivery,
  retryDelivery,
  getDeliveryStats,
  purgeOldDeliveries,
};
