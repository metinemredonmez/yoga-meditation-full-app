import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { checkoutSchema } from '../validation/paymentSchemas';
import { createCheckoutSession } from '../services/subscriptionService';
import { logger } from '../utils/logger';

export async function startCheckout(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = checkoutSchema.parse(req.body);
    const checkoutInput: { planId: string; interval: 'monthly' | 'yearly'; successUrl?: string; cancelUrl?: string } = {
      planId: payload.plan,
      interval: 'monthly', // Default to monthly, could be added to schema
    };
    if (payload.successUrl) checkoutInput.successUrl = payload.successUrl;
    if (payload.cancelUrl) checkoutInput.cancelUrl = payload.cancelUrl;
    const session = await createCheckoutSession(req.user.userId, checkoutInput);
    return res.status(201).json({ checkout: session });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Checkout initiation failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Note: Stripe webhook handling has been moved to src/webhooks/stripeWebhook.ts
// This is a placeholder that logs and acknowledges - use /webhooks/stripe endpoint instead
export async function handleStripeWebhook(req: Request, res: Response) {
  try {
    logger.info('Stripe webhook received via legacy endpoint - use /webhooks/stripe instead');
    return res.json({ received: true });
  } catch (error) {
    logger.error({ err: error }, 'Stripe webhook processing failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
