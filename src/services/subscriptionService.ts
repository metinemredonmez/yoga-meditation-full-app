import {
  PaymentStatus,
  PaymentProvider,
  SubscriptionStatus,
  SubscriptionTier,
  SubscriptionInterval,
  Prisma,
} from '@prisma/client';
import { prisma } from '../utils/database';
import { getStripeClient, isStripeConfigured, formatAmountToCents } from '../utils/stripe';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { eventEmitter } from '../utils/eventEmitter';
import { getOrCreateCustomer } from './stripeCustomerService';
import { getPlanById } from './subscriptionPlanService';
import type Stripe from 'stripe';

// ==================== Subscription Status ====================

export interface SubscriptionStatusResult {
  isActive: boolean;
  tier: SubscriptionTier;
  expiresAt: Date | null;
  provider: PaymentProvider | null;
  isTrialing: boolean;
  isInGracePeriod: boolean;
  daysRemaining: number | null;
  subscription: Awaited<ReturnType<typeof getUserSubscription>> | null;
}

/**
 * Get user's subscription status
 */
export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatusResult> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return {
      isActive: false,
      tier: 'FREE',
      expiresAt: null,
      provider: null,
      isTrialing: false,
      isInGracePeriod: false,
      daysRemaining: null,
      subscription: null,
    };
  }

  const now = new Date();
  const isActive = ['ACTIVE', 'TRIALING', 'GRACE_PERIOD'].includes(subscription.status);
  const isTrialing = subscription.status === 'TRIALING';
  const isInGracePeriod = subscription.status === 'GRACE_PERIOD';

  let daysRemaining: number | null = null;
  if (subscription.currentPeriodEnd) {
    daysRemaining = Math.ceil(
      (subscription.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  return {
    isActive,
    tier: subscription.plan.tier,
    expiresAt: subscription.currentPeriodEnd,
    provider: subscription.provider,
    isTrialing,
    isInGracePeriod,
    daysRemaining,
    subscription,
  };
}

/**
 * Check if user has active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const status = await getSubscriptionStatus(userId);
  return status.isActive;
}

/**
 * Get user's subscription tier
 */
export async function getSubscriptionTier(userId: string): Promise<SubscriptionTier> {
  const status = await getSubscriptionStatus(userId);
  return status.tier;
}

/**
 * Check if user can access content based on tier
 */
export async function canAccessContent(
  userId: string,
  requiredTier: SubscriptionTier
): Promise<boolean> {
  const userTier = await getSubscriptionTier(userId);
  const tierOrder: SubscriptionTier[] = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'];
  return tierOrder.indexOf(userTier) >= tierOrder.indexOf(requiredTier);
}

/**
 * Check if user is in trial period
 */
export async function isInTrial(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  return subscription?.status === 'TRIALING';
}

/**
 * Check if user is in grace period
 */
export async function isInGracePeriod(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  return subscription?.status === 'GRACE_PERIOD';
}

// ==================== Subscription CRUD ====================

/**
 * Get user's current active subscription with plan details
 */
export async function getUserSubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ['ACTIVE', 'TRIALING', 'GRACE_PERIOD', 'PAST_DUE'] },
    },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get subscription by ID
 */
export async function getSubscriptionById(subscriptionId: string) {
  return prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { plan: true },
  });
}

/**
 * Get user's subscription history
 */
export async function getSubscriptionHistory(userId: string, limit = 10) {
  return prisma.subscription.findMany({
    where: { userId },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

// ==================== Stripe Checkout ====================

export interface CheckoutInput {
  planId: string;
  interval: 'monthly' | 'yearly';
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Create Stripe checkout session
 */
export async function createCheckoutSession(
  userId: string,
  input: CheckoutInput
): Promise<{ sessionId: string; url: string }> {
  if (!isStripeConfigured()) {
    throw new Error('Stripe is not configured');
  }

  const stripe = getStripeClient();

  // Get plan
  const plan = await getPlanById(input.planId);
  if (!plan) {
    throw new Error('Plan not found');
  }

  // Get price ID based on interval
  const priceId = input.interval === 'monthly'
    ? plan.stripePriceIdMonthly
    : plan.stripePriceIdYearly;

  if (!priceId) {
    throw new Error(`Stripe price not configured for ${input.interval} interval`);
  }

  // Get or create Stripe customer
  const customer = await getOrCreateCustomer(userId);

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: input.successUrl || `${config.payment.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: input.cancelUrl || config.payment.cancelUrl,
    subscription_data: {
      trial_period_days: plan.trialDays > 0 ? plan.trialDays : undefined,
      metadata: {
        userId,
        planId: input.planId,
        interval: input.interval,
      },
    },
    metadata: {
      userId,
      planId: input.planId,
      interval: input.interval,
    },
  });

  logger.info({ userId, sessionId: session.id }, 'Stripe checkout session created');

  return {
    sessionId: session.id,
    url: session.url!,
  };
}

/**
 * Create Stripe subscription directly (with existing payment method)
 */
export async function createStripeSubscription(
  userId: string,
  planId: string,
  interval: 'monthly' | 'yearly',
  paymentMethodId?: string
): Promise<Stripe.Subscription> {
  if (!isStripeConfigured()) {
    throw new Error('Stripe is not configured');
  }

  const stripe = getStripeClient();
  const plan = await getPlanById(planId);

  if (!plan) {
    throw new Error('Plan not found');
  }

  const priceId = interval === 'monthly'
    ? plan.stripePriceIdMonthly
    : plan.stripePriceIdYearly;

  if (!priceId) {
    throw new Error('Stripe price not configured');
  }

  const customer = await getOrCreateCustomer(userId);

  const subscriptionParams: Stripe.SubscriptionCreateParams = {
    customer: customer.id,
    items: [{ price: priceId }],
    trial_period_days: plan.trialDays > 0 ? plan.trialDays : undefined,
    metadata: {
      userId,
      planId,
      interval,
    },
    expand: ['latest_invoice.payment_intent'],
  };

  if (paymentMethodId) {
    subscriptionParams.default_payment_method = paymentMethodId;
    subscriptionParams.payment_behavior = 'default_incomplete';
  }

  const subscription = await stripe.subscriptions.create(subscriptionParams);

  logger.info({ userId, subscriptionId: subscription.id }, 'Stripe subscription created');

  return subscription;
}

// ==================== Subscription Management ====================

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  userId: string,
  reason?: string,
  immediately = false
): Promise<typeof subscription | null> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return null;
  }

  // If Stripe subscription, cancel in Stripe first
  if (subscription.provider === 'STRIPE' && subscription.stripeSubscriptionId && isStripeConfigured()) {
    const stripe = getStripeClient();

    if (immediately) {
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    } else {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }
  }

  // Update local subscription
  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: immediately ? 'CANCELLED' : subscription.status,
      cancelAtPeriodEnd: !immediately,
      cancelledAt: immediately ? new Date() : null,
      cancelReason: reason,
      autoRenew: false,
    },
    include: { plan: true },
  });

  // Update user tier if cancelled immediately
  if (immediately) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: 'FREE',
        subscriptionExpiresAt: null,
      },
    });
  }

  // Emit event
  eventEmitter.emit('subscription.cancelled', {
    subscriptionId: updated.id,
    userId,
    plan: updated.plan.name,
    provider: updated.provider,
    cancelledAt: new Date(),
    effectiveEndDate: updated.currentPeriodEnd || new Date(),
  });

  logger.info({ userId, subscriptionId: updated.id, immediately }, 'Subscription cancelled');

  return updated;
}

/**
 * Resume cancelled subscription
 */
export async function resumeSubscription(userId: string) {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    throw new Error('No active subscription found');
  }

  if (!subscription.cancelAtPeriodEnd) {
    throw new Error('Subscription is not scheduled for cancellation');
  }

  // Resume in Stripe if applicable
  if (subscription.provider === 'STRIPE' && subscription.stripeSubscriptionId && isStripeConfigured()) {
    const stripe = getStripeClient();
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });
  }

  // Update local subscription
  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      cancelAtPeriodEnd: false,
      cancelledAt: null,
      cancelReason: null,
      autoRenew: true,
    },
    include: { plan: true },
  });

  logger.info({ userId, subscriptionId: updated.id }, 'Subscription resumed');

  return updated;
}

/**
 * Change subscription plan
 */
export async function changePlan(
  userId: string,
  newPlanId: string,
  newInterval: 'monthly' | 'yearly'
) {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    throw new Error('No active subscription found');
  }

  const newPlan = await getPlanById(newPlanId);
  if (!newPlan) {
    throw new Error('New plan not found');
  }

  // Change in Stripe if applicable
  if (subscription.provider === 'STRIPE' && subscription.stripeSubscriptionId && isStripeConfigured()) {
    const stripe = getStripeClient();

    const priceId = newInterval === 'monthly'
      ? newPlan.stripePriceIdMonthly
      : newPlan.stripePriceIdYearly;

    if (!priceId) {
      throw new Error('Stripe price not configured for new plan');
    }

    // Get current subscription items
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
    const currentItem = stripeSubscription.items.data[0];
    if (!currentItem) {
      throw new Error('No subscription item found');
    }

    // Update subscription with new price
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [
        {
          id: currentItem.id,
          price: priceId,
        },
      ],
      proration_behavior: 'create_prorations',
      metadata: {
        planId: newPlanId,
        interval: newInterval,
      },
    });
  }

  // Update local subscription
  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      planId: newPlanId,
      interval: newInterval === 'monthly' ? 'MONTHLY' : 'YEARLY',
    },
    include: { plan: true },
  });

  // Update user tier
  await prisma.user.update({
    where: { id: userId },
    data: { subscriptionTier: newPlan.tier },
  });

  logger.info({ userId, oldPlanId: subscription.planId, newPlanId }, 'Subscription plan changed');

  return updated;
}

// ==================== Sync from Provider ====================

/**
 * Sync subscription status from Stripe
 */
export async function syncSubscriptionFromStripe(stripeSubscriptionId: string) {
  if (!isStripeConfigured()) {
    throw new Error('Stripe is not configured');
  }

  const stripe = getStripeClient();
  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId },
    include: { plan: true },
  });

  if (!subscription) {
    logger.warn({ stripeSubscriptionId }, 'Local subscription not found for Stripe sync');
    return null;
  }

  // Map Stripe status to our status
  const statusMap: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
    active: 'ACTIVE',
    past_due: 'PAST_DUE',
    canceled: 'CANCELLED',
    incomplete: 'INCOMPLETE',
    incomplete_expired: 'EXPIRED',
    trialing: 'TRIALING',
    unpaid: 'PAST_DUE',
    paused: 'PAUSED',
  };

  const newStatus = statusMap[stripeSubscription.status] || 'ACTIVE';

  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: newStatus,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      lastVerifiedAt: new Date(),
    },
  });

  // Update user tier based on status
  if (newStatus === 'ACTIVE' || newStatus === 'TRIALING') {
    await prisma.user.update({
      where: { id: subscription.userId },
      data: {
        subscriptionTier: subscription.plan.tier,
        subscriptionExpiresAt: updated.currentPeriodEnd,
      },
    });
  } else if (newStatus === 'CANCELLED' || newStatus === 'EXPIRED') {
    await prisma.user.update({
      where: { id: subscription.userId },
      data: {
        subscriptionTier: 'FREE',
        subscriptionExpiresAt: null,
      },
    });
  }

  logger.info({ subscriptionId: subscription.id, newStatus }, 'Subscription synced from Stripe');

  return updated;
}

// ==================== Admin Functions ====================

/**
 * Grant free subscription to user (admin only)
 */
export async function grantSubscription(
  userId: string,
  planId: string,
  durationDays: number,
  grantedBy: string,
  reason: string
) {
  const plan = await getPlanById(planId);
  if (!plan) {
    throw new Error('Plan not found');
  }

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

  // Cancel any existing subscription
  const existingSubscription = await getUserSubscription(userId);
  if (existingSubscription) {
    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
  }

  // Create new subscription
  const subscription = await prisma.subscription.create({
    data: {
      userId,
      planId,
      provider: 'STRIPE', // Use STRIPE as default for granted subscriptions
      status: 'ACTIVE',
      interval: 'MONTHLY',
      currentPeriodStart: startDate,
      currentPeriodEnd: endDate,
      autoRenew: false,
    },
    include: { plan: true },
  });

  // Update user
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: plan.tier,
      subscriptionExpiresAt: endDate,
    },
  });

  logger.info(
    { userId, planId, durationDays, grantedBy, reason },
    'Subscription granted by admin'
  );

  return subscription;
}

/**
 * Extend subscription period (admin only)
 */
export async function extendSubscription(
  subscriptionId: string,
  days: number,
  extendedBy: string,
  reason: string
) {
  const subscription = await getSubscriptionById(subscriptionId);
  if (!subscription) {
    throw new Error('Subscription not found');
  }

  const currentEnd = subscription.currentPeriodEnd || new Date();
  const newEnd = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000);

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { currentPeriodEnd: newEnd },
    include: { plan: true },
  });

  // Update user expiration
  await prisma.user.update({
    where: { id: subscription.userId },
    data: { subscriptionExpiresAt: newEnd },
  });

  logger.info(
    { subscriptionId, days, extendedBy, reason, newEnd },
    'Subscription extended by admin'
  );

  return updated;
}
