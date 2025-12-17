import { WebhookEvent } from '@prisma/client';
import { eventEmitter, eventToWebhookMap, type AppEvent, type AppEventPayloads } from '../utils/eventEmitter';
import { dispatchEvent } from './webhookService';
import { logger } from '../utils/logger';
import { config } from '../utils/config';

/**
 * Initialize webhook event listeners
 * This connects application events to webhook dispatching
 */
export function initializeWebhookEventListeners(): void {
  if (!config.webhook.enabled) {
    logger.info('Webhook system is disabled');
    return;
  }

  // User events
  eventEmitter.on('user.created', (payload) => {
    void dispatchWebhookEvent('user.created', payload);
  });

  eventEmitter.on('user.updated', (payload) => {
    void dispatchWebhookEvent('user.updated', payload);
  });

  eventEmitter.on('user.deleted', (payload) => {
    void dispatchWebhookEvent('user.deleted', payload);
  });

  // Subscription events
  eventEmitter.on('subscription.created', (payload) => {
    void dispatchWebhookEvent('subscription.created', payload);
  });

  eventEmitter.on('subscription.updated', (payload) => {
    void dispatchWebhookEvent('subscription.updated', payload);
  });

  eventEmitter.on('subscription.cancelled', (payload) => {
    void dispatchWebhookEvent('subscription.cancelled', payload);
  });

  eventEmitter.on('subscription.expired', (payload) => {
    void dispatchWebhookEvent('subscription.expired', payload);
  });

  // Payment events
  eventEmitter.on('payment.succeeded', (payload) => {
    void dispatchWebhookEvent('payment.succeeded', payload);
  });

  eventEmitter.on('payment.failed', (payload) => {
    void dispatchWebhookEvent('payment.failed', payload);
  });

  eventEmitter.on('payment.refunded', (payload) => {
    void dispatchWebhookEvent('payment.refunded', payload);
  });

  // Challenge events
  eventEmitter.on('challenge.created', (payload) => {
    void dispatchWebhookEvent('challenge.created', payload);
  });

  eventEmitter.on('challenge.started', (payload) => {
    void dispatchWebhookEvent('challenge.started', payload);
  });

  eventEmitter.on('challenge.completed', (payload) => {
    void dispatchWebhookEvent('challenge.completed', payload);
  });

  eventEmitter.on('challenge.enrollment', (payload) => {
    void dispatchWebhookEvent('challenge.enrollment', payload);
  });

  eventEmitter.on('challenge.checkin', (payload) => {
    void dispatchWebhookEvent('challenge.checkin', payload);
  });

  // Progress events
  eventEmitter.on('progress.updated', (payload) => {
    void dispatchWebhookEvent('progress.updated', payload);
  });

  eventEmitter.on('program.completed', (payload) => {
    void dispatchWebhookEvent('program.completed', payload);
  });

  logger.info('Webhook event listeners initialized');
}

/**
 * Dispatch a webhook event
 */
async function dispatchWebhookEvent<K extends AppEvent>(
  appEvent: K,
  payload: AppEventPayloads[K]
): Promise<void> {
  try {
    const webhookEvent = eventToWebhookMap[appEvent] as WebhookEvent;
    if (!webhookEvent) {
      logger.warn({ appEvent }, 'No webhook mapping for app event');
      return;
    }

    // Sanitize payload - remove sensitive fields
    const sanitizedPayload = sanitizePayload(payload as unknown as Record<string, unknown>);

    await dispatchEvent(webhookEvent, sanitizedPayload);
  } catch (error) {
    logger.error({ error, appEvent }, 'Failed to dispatch webhook event');
  }
}

/**
 * Remove sensitive fields from payload before sending
 */
function sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = [
    'password',
    'passwordHash',
    'secret',
    'token',
    'accessToken',
    'refreshToken',
    'apiKey',
    'privateKey',
  ];

  const sanitize = (obj: Record<string, unknown>): Record<string, unknown> => {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
        continue; // Skip sensitive fields
      }

      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        result[key] = sanitize(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }

    return result;
  };

  return sanitize(payload);
}

/**
 * Manually emit an application event
 * This is useful for testing or triggering events programmatically
 */
export function emitAppEvent<K extends AppEvent>(
  event: K,
  payload: Parameters<typeof eventEmitter.emit<K>>[1]
): void {
  eventEmitter.emit(event, payload);
}

export const webhookEventEmitterService = {
  initializeWebhookEventListeners,
  emitAppEvent,
};
