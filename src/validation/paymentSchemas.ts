import { z } from 'zod';

export const providerEnum = z.enum(['stripe', 'iyzico']);

export const checkoutSchema = z.object({
  plan: z.string().min(1, 'Plan identifier is required'),
  provider: providerEnum.default('stripe'),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export const stripeWebhookSchema = z.object({
  type: z.string().min(1),
  data: z.object({
    userId: z.string().min(1),
    plan: z.string().optional(),
    amount: z.number().int().optional(),
    currency: z.string().optional(),
    transactionId: z.string().optional(),
    currentPeriodEnd: z.string().datetime().optional(),
    cancelAtPeriodEnd: z.boolean().optional(),
    status: z.string().optional(),
  }),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type StripeWebhookPayload = z.infer<typeof stripeWebhookSchema>;
