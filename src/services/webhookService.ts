import { WebhookEvent } from '@prisma/client';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { config } from '../utils/config';
import { generateWebhookSecret, hashSecret } from '../utils/webhookCrypto';

interface CreateEndpointInput {
  userId: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  secret?: string;
}

interface UpdateEndpointInput {
  name?: string;
  url?: string;
  events?: WebhookEvent[];
  isActive?: boolean;
}

/**
 * Validate webhook URL (HTTPS required in production)
 */
function validateWebhookUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);

    // Allow localhost in development
    if (config.NODE_ENV === 'development') {
      if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
        return { valid: true };
      }
    }

    // Require HTTPS in production
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'HTTPS is required for webhook URLs' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Create a new webhook endpoint
 */
export async function createEndpoint(input: CreateEndpointInput) {
  const { userId, name, url, events, secret: providedSecret } = input;

  // Validate URL
  const urlValidation = validateWebhookUrl(url);
  if (!urlValidation.valid) {
    throw new Error(urlValidation.error);
  }

  // Generate or use provided secret
  const plainSecret = providedSecret ?? generateWebhookSecret();
  const hashedSecret = hashSecret(plainSecret);

  const endpoint = await prisma.webhook_endpoints.create({
    data: {
      userId,
      name,
      url,
      secret: hashedSecret,
      events,
    },
  });

  logger.info({ endpointId: endpoint.id, userId, events }, 'Webhook endpoint created');

  // Return with plain secret (only shown once!)
  return {
    ...endpoint,
    secret: plainSecret,
  };
}

/**
 * Update an existing webhook endpoint
 */
export async function updateEndpoint(endpointId: string, userId: string, updates: UpdateEndpointInput) {
  // Verify ownership
  const existing = await prisma.webhook_endpoints.findFirst({
    where: { id: endpointId, userId },
  });

  if (!existing) {
    throw new Error('Webhook endpoint not found');
  }

  // Validate URL if provided
  if (updates.url) {
    const urlValidation = validateWebhookUrl(updates.url);
    if (!urlValidation.valid) {
      throw new Error(urlValidation.error);
    }
  }

  const endpoint = await prisma.webhook_endpoints.update({
    where: { id: endpointId },
    data: {
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.url !== undefined && { url: updates.url }),
      ...(updates.events !== undefined && { events: updates.events }),
      ...(updates.isActive !== undefined && { isActive: updates.isActive }),
    },
  });

  logger.info({ endpointId, userId }, 'Webhook endpoint updated');

  return endpoint;
}

/**
 * Delete a webhook endpoint
 */
export async function deleteEndpoint(endpointId: string, userId: string): Promise<void> {
  const existing = await prisma.webhook_endpoints.findFirst({
    where: { id: endpointId, userId },
  });

  if (!existing) {
    throw new Error('Webhook endpoint not found');
  }

  await prisma.webhook_endpoints.delete({
    where: { id: endpointId },
  });

  logger.info({ endpointId, userId }, 'Webhook endpoint deleted');
}

/**
 * Get a single webhook endpoint
 */
export async function getEndpoint(endpointId: string, userId: string) {
  const endpoint = await prisma.webhook_endpoints.findFirst({
    where: { id: endpointId, userId },
    include: {
      _count: {
        select: { webhook_deliveries: true },
      },
    },
  });

  if (!endpoint) {
    return null;
  }

  // Don't expose the hashed secret
  const { secret: _, ...safeEndpoint } = endpoint;
  return {
    ...safeEndpoint,
    deliveryCount: endpoint._count.webhook_deliveries,
  };
}

/**
 * List all webhook endpoints for a user
 */
export async function listEndpoints(userId: string) {
  const endpoints = await prisma.webhook_endpoints.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { webhook_deliveries: true },
      },
    },
  });

  return endpoints.map((endpoint) => {
    const { secret: _, ...safeEndpoint } = endpoint;
    return {
      ...safeEndpoint,
      deliveryCount: endpoint._count.webhook_deliveries,
    };
  });
}

/**
 * Test a webhook endpoint by sending a test event
 */
export async function testEndpoint(endpointId: string, userId: string) {
  const endpoint = await prisma.webhook_endpoints.findFirst({
    where: { id: endpointId, userId },
  });

  if (!endpoint) {
    throw new Error('Webhook endpoint not found');
  }

  // Import delivery service to avoid circular dependency
  const { queueDelivery } = await import('./webhookDeliveryService');

  // Queue a test delivery
  const delivery = await queueDelivery(
    endpoint.id,
    'USER_CREATED' as WebhookEvent, // Use a common event type for testing
    {
      test: true,
      message: 'This is a test webhook delivery',
      timestamp: new Date().toISOString(),
    }
  );

  return delivery;
}

/**
 * Rotate the secret for a webhook endpoint
 */
export async function rotateSecret(endpointId: string, userId: string) {
  const existing = await prisma.webhook_endpoints.findFirst({
    where: { id: endpointId, userId },
  });

  if (!existing) {
    throw new Error('Webhook endpoint not found');
  }

  const newSecret = generateWebhookSecret();
  const hashedSecret = hashSecret(newSecret);

  await prisma.webhook_endpoints.update({
    where: { id: endpointId },
    data: { secret: hashedSecret },
  });

  logger.info({ endpointId, userId }, 'Webhook secret rotated');

  // Return new plain secret (only shown once!)
  return { secret: newSecret };
}

/**
 * Enable a webhook endpoint
 */
export async function enableEndpoint(endpointId: string, userId: string) {
  const existing = await prisma.webhook_endpoints.findFirst({
    where: { id: endpointId, userId },
  });

  if (!existing) {
    throw new Error('Webhook endpoint not found');
  }

  const endpoint = await prisma.webhook_endpoints.update({
    where: { id: endpointId },
    data: {
      isActive: true,
      failureCount: 0, // Reset failure count
    },
  });

  logger.info({ endpointId, userId }, 'Webhook endpoint enabled');

  return endpoint;
}

/**
 * Disable a webhook endpoint
 */
export async function disableEndpoint(endpointId: string, userId: string) {
  const existing = await prisma.webhook_endpoints.findFirst({
    where: { id: endpointId, userId },
  });

  if (!existing) {
    throw new Error('Webhook endpoint not found');
  }

  const endpoint = await prisma.webhook_endpoints.update({
    where: { id: endpointId },
    data: { isActive: false },
  });

  logger.info({ endpointId, userId }, 'Webhook endpoint disabled');

  return endpoint;
}

/**
 * Get all active endpoints subscribed to a specific event
 */
export async function getEndpointsForEvent(event: WebhookEvent) {
  const endpoints = await prisma.webhook_endpoints.findMany({
    where: {
      isActive: true,
      events: { has: event },
    },
  });

  return endpoints;
}

/**
 * Dispatch an event to all subscribed endpoints
 */
export async function dispatchEvent(
  event: WebhookEvent,
  payload: Record<string, unknown>,
  userId?: string
) {
  if (!config.webhook.enabled) {
    return;
  }

  const endpoints = await getEndpointsForEvent(event);

  if (endpoints.length === 0) {
    return;
  }

  const { queueDelivery } = await import('./webhookDeliveryService');

  const deliveries = await Promise.all(
    endpoints.map((endpoint) =>
      queueDelivery(endpoint.id, event, payload).catch((error) => {
        logger.error({ error, endpointId: endpoint.id, event }, 'Failed to queue webhook delivery');
        return null;
      })
    )
  );

  const successCount = deliveries.filter(Boolean).length;
  logger.info({ event, totalEndpoints: endpoints.length, queued: successCount, userId }, 'Event dispatched');

  return deliveries.filter(Boolean);
}

/**
 * Get all available webhook events
 */
export function getAvailableEvents(): WebhookEvent[] {
  return Object.values(WebhookEvent);
}

export const webhookService = {
  createEndpoint,
  updateEndpoint,
  deleteEndpoint,
  getEndpoint,
  listEndpoints,
  testEndpoint,
  rotateSecret,
  enableEndpoint,
  disableEndpoint,
  getEndpointsForEvent,
  dispatchEvent,
  getAvailableEvents,
  validateWebhookUrl,
};
