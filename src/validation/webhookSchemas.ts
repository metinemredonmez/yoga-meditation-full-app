import { z } from 'zod';
import { WebhookEvent, WebhookDeliveryStatus } from '@prisma/client';

// Get all webhook events as an array
const webhookEvents = Object.values(WebhookEvent) as [WebhookEvent, ...WebhookEvent[]];
const deliveryStatuses = Object.values(WebhookDeliveryStatus) as [
  WebhookDeliveryStatus,
  ...WebhookDeliveryStatus[],
];

/**
 * Validate HTTPS URL (allow localhost in development)
 */
const httpsUrlSchema = z
  .string()
  .url('Invalid URL format')
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        // Allow localhost for development
        if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
          return true;
        }
        return parsed.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'HTTPS is required for webhook URLs (localhost allowed in development)' }
  );

/**
 * Create endpoint body schema
 */
export const createEndpointBodySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  url: httpsUrlSchema,
  events: z
    .array(z.enum(webhookEvents))
    .min(1, 'At least one event must be selected')
    .max(webhookEvents.length, `Maximum ${webhookEvents.length} events allowed`),
});

export type CreateEndpointBody = z.infer<typeof createEndpointBodySchema>;

/**
 * Update endpoint body schema
 */
export const updateEndpointBodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: httpsUrlSchema.optional(),
  events: z.array(z.enum(webhookEvents)).min(1).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateEndpointBody = z.infer<typeof updateEndpointBodySchema>;

/**
 * Endpoint ID params schema
 */
export const endpointIdParamsSchema = z.object({
  endpointId: z.string().min(1, 'Endpoint ID is required'),
});

export type EndpointIdParams = z.infer<typeof endpointIdParamsSchema>;

/**
 * Delivery ID params schema
 */
export const deliveryIdParamsSchema = z.object({
  deliveryId: z.string().min(1, 'Delivery ID is required'),
});

export type DeliveryIdParams = z.infer<typeof deliveryIdParamsSchema>;

/**
 * List deliveries query schema
 */
export const listDeliveriesQuerySchema = z.object({
  status: z.enum(deliveryStatuses).optional(),
  event: z.enum(webhookEvents).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type ListDeliveriesQuery = z.infer<typeof listDeliveriesQuerySchema>;

/**
 * Admin list deliveries query schema (more options)
 */
export const adminListDeliveriesQuerySchema = listDeliveriesQuerySchema.extend({
  endpointId: z.string().optional(),
  userId: z.string().optional(),
});

export type AdminListDeliveriesQuery = z.infer<typeof adminListDeliveriesQuerySchema>;

/**
 * Purge old deliveries body schema
 */
export const purgeDeliveriesBodySchema = z.object({
  daysOld: z.coerce.number().int().positive().min(1).max(365).default(30),
});

export type PurgeDeliveriesBody = z.infer<typeof purgeDeliveriesBodySchema>;

/**
 * Get available events response
 */
export const availableEventsSchema = z.array(
  z.object({
    event: z.enum(webhookEvents),
    description: z.string(),
  })
);

// Event descriptions for documentation
export const eventDescriptions: Record<WebhookEvent, string> = {
  USER_CREATED: 'Triggered when a new user registers',
  USER_UPDATED: 'Triggered when user profile is updated',
  USER_DELETED: 'Triggered when a user account is deleted',
  SUBSCRIPTION_CREATED: 'Triggered when a new subscription is created',
  SUBSCRIPTION_UPDATED: 'Triggered when a subscription is modified',
  SUBSCRIPTION_CANCELLED: 'Triggered when a subscription is cancelled',
  SUBSCRIPTION_EXPIRED: 'Triggered when a subscription expires',
  PAYMENT_SUCCEEDED: 'Triggered when a payment is successful',
  PAYMENT_FAILED: 'Triggered when a payment fails',
  PAYMENT_REFUNDED: 'Triggered when a payment is refunded',
  CHALLENGE_CREATED: 'Triggered when a new challenge is created',
  CHALLENGE_STARTED: 'Triggered when a challenge starts',
  CHALLENGE_COMPLETED: 'Triggered when a user completes a challenge',
  CHALLENGE_ENROLLMENT: 'Triggered when a user enrolls in a challenge',
  CHALLENGE_CHECKIN: 'Triggered when a user checks in for a challenge day',
  PROGRESS_UPDATED: 'Triggered when user progress is updated',
  PROGRAM_COMPLETED: 'Triggered when a user completes a program',
};

export const webhookSchemas = {
  createEndpointBodySchema,
  updateEndpointBodySchema,
  endpointIdParamsSchema,
  deliveryIdParamsSchema,
  listDeliveriesQuerySchema,
  adminListDeliveriesQuerySchema,
  purgeDeliveriesBodySchema,
  availableEventsSchema,
  eventDescriptions,
};
