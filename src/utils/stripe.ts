import Stripe from 'stripe';
import { config } from './config';
import { logger } from './logger';

let stripeClient: Stripe | null = null;

/**
 * Get or create Stripe client instance
 */
export function getStripeClient(): Stripe {
  if (!config.stripe.secretKey) {
    throw new Error('STRIPE_SECRET_KEY is required for Stripe operations');
  }

  if (!stripeClient) {
    stripeClient = new Stripe(config.stripe.secretKey, {
      apiVersion: '2023-08-16',
      typescript: true,
    });
    logger.info('Stripe client initialized');
  }

  return stripeClient;
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return !!config.stripe.secretKey;
}

/**
 * Get Stripe publishable key for client-side
 */
export function getStripePublishableKey(): string | undefined {
  return config.stripe.publishableKey;
}

/**
 * Log missing Stripe configuration warning
 */
export function logMissingStripeConfig(): void {
  logger.warn('Stripe secret key missing. Payment operations will fail.');
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const stripe = getStripeClient();

  if (!config.stripe.webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is required for webhook verification');
  }

  return stripe.webhooks.constructEvent(
    payload,
    signature,
    config.stripe.webhookSecret
  );
}

/**
 * Format amount from decimal to cents/kuruş
 */
export function formatAmountToCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Format amount from cents/kuruş to decimal
 */
export function formatAmountFromCents(cents: number): number {
  return cents / 100;
}
