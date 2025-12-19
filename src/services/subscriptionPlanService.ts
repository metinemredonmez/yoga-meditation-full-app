import { SubscriptionTier, Prisma } from '@prisma/client';
import { prisma } from '../utils/database';
import { getStripeClient, isStripeConfigured } from '../utils/stripe';
import { logger } from '../utils/logger';

export interface CreatePlanInput {
  name: string;
  description?: string;
  tier: SubscriptionTier;
  priceMonthly: number;
  priceYearly: number;
  currency?: string;
  features: string[];
  trialDays?: number;
  sortOrder?: number;
  maxDevices?: number;
  offlineDownloads?: boolean;
  // Provider-specific product IDs (if they already exist)
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  appleProductIdMonthly?: string;
  appleProductIdYearly?: string;
  googleProductIdMonthly?: string;
  googleProductIdYearly?: string;
}

export interface UpdatePlanInput {
  name?: string;
  description?: string;
  priceMonthly?: number;
  priceYearly?: number;
  currency?: string;
  features?: string[];
  isActive?: boolean;
  trialDays?: number;
  sortOrder?: number;
  maxDevices?: number;
  offlineDownloads?: boolean;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  appleProductIdMonthly?: string;
  appleProductIdYearly?: string;
  googleProductIdMonthly?: string;
  googleProductIdYearly?: string;
}

/**
 * Get all active subscription plans
 */
export async function getPlans(includeInactive = false) {
  const where = includeInactive ? {} : { isActive: true };

  return prisma.subscription_plans.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
  });
}

/**
 * Get subscription plan by ID
 */
export async function getPlanById(planId: string) {
  return prisma.subscription_plans.findUnique({
    where: { id: planId },
  });
}

/**
 * Get subscription plan by tier
 */
export async function getPlanByTier(tier: SubscriptionTier) {
  return prisma.subscription_plans.findFirst({
    where: { tier, isActive: true },
  });
}

/**
 * Create a new subscription plan
 */
export async function createPlan(input: CreatePlanInput) {
  const plan = await prisma.subscription_plans.create({
    data: {
      name: input.name,
      description: input.description,
      tier: input.tier,
      priceMonthly: new Prisma.Decimal(input.priceMonthly),
      priceYearly: new Prisma.Decimal(input.priceYearly),
      currency: input.currency || 'TRY',
      features: input.features,
      trialDays: input.trialDays || 0,
      sortOrder: input.sortOrder || 0,
      maxDevices: input.maxDevices || 1,
      offlineDownloads: input.offlineDownloads || false,
      stripePriceIdMonthly: input.stripePriceIdMonthly,
      stripePriceIdYearly: input.stripePriceIdYearly,
      appleProductIdMonthly: input.appleProductIdMonthly,
      appleProductIdYearly: input.appleProductIdYearly,
      googleProductIdMonthly: input.googleProductIdMonthly,
      googleProductIdYearly: input.googleProductIdYearly,
    },
  });

  logger.info({ planId: plan.id, name: plan.name }, 'Subscription plan created');
  return plan;
}

/**
 * Update a subscription plan
 */
export async function updatePlan(planId: string, input: UpdatePlanInput) {
  const updateData: Prisma.subscription_plansUpdateInput = {};

  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.priceMonthly !== undefined) updateData.priceMonthly = new Prisma.Decimal(input.priceMonthly);
  if (input.priceYearly !== undefined) updateData.priceYearly = new Prisma.Decimal(input.priceYearly);
  if (input.currency !== undefined) updateData.currency = input.currency;
  if (input.features !== undefined) updateData.features = input.features;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;
  if (input.trialDays !== undefined) updateData.trialDays = input.trialDays;
  if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;
  if (input.maxDevices !== undefined) updateData.maxDevices = input.maxDevices;
  if (input.offlineDownloads !== undefined) updateData.offlineDownloads = input.offlineDownloads;
  if (input.stripePriceIdMonthly !== undefined) updateData.stripePriceIdMonthly = input.stripePriceIdMonthly;
  if (input.stripePriceIdYearly !== undefined) updateData.stripePriceIdYearly = input.stripePriceIdYearly;
  if (input.appleProductIdMonthly !== undefined) updateData.appleProductIdMonthly = input.appleProductIdMonthly;
  if (input.appleProductIdYearly !== undefined) updateData.appleProductIdYearly = input.appleProductIdYearly;
  if (input.googleProductIdMonthly !== undefined) updateData.googleProductIdMonthly = input.googleProductIdMonthly;
  if (input.googleProductIdYearly !== undefined) updateData.googleProductIdYearly = input.googleProductIdYearly;

  const plan = await prisma.subscription_plans.update({
    where: { id: planId },
    data: updateData,
  });

  logger.info({ planId: plan.id }, 'Subscription plan updated');
  return plan;
}

/**
 * Delete a subscription plan (soft delete by setting isActive = false)
 */
export async function deletePlan(planId: string) {
  // Check if any active subscriptions use this plan
  const activeSubscriptions = await prisma.subscriptions.count({
    where: {
      planId,
      status: { in: ['ACTIVE', 'TRIALING', 'GRACE_PERIOD'] },
    },
  });

  if (activeSubscriptions > 0) {
    throw new Error(`Cannot delete plan with ${activeSubscriptions} active subscriptions`);
  }

  const plan = await prisma.subscription_plans.update({
    where: { id: planId },
    data: { isActive: false },
  });

  logger.info({ planId }, 'Subscription plan deleted (soft)');
  return plan;
}

/**
 * Hard delete a subscription plan (use with caution)
 */
export async function hardDeletePlan(planId: string) {
  const subscriptionCount = await prisma.subscriptions.count({
    where: { planId },
  });

  if (subscriptionCount > 0) {
    throw new Error(`Cannot hard delete plan with ${subscriptionCount} subscriptions`);
  }

  await prisma.subscription_plans.delete({
    where: { id: planId },
  });

  logger.info({ planId }, 'Subscription plan hard deleted');
}

/**
 * Create Stripe product and prices for a plan
 */
export async function syncPlanWithStripe(planId: string) {
  if (!isStripeConfigured()) {
    throw new Error('Stripe is not configured');
  }

  const plan = await getPlanById(planId);
  if (!plan) {
    throw new Error('Plan not found');
  }

  const stripe = getStripeClient();

  // Create or update Stripe product
  let stripeProduct: { id: string };

  // Check if product already exists by metadata
  const existingProducts = await stripe.products.search({
    query: `metadata['planId']:'${planId}'`,
  });

  const firstProduct = existingProducts.data[0];
  if (existingProducts.data.length > 0 && firstProduct) {
    stripeProduct = firstProduct;
    // Update product
    await stripe.products.update(stripeProduct.id, {
      name: plan.name,
      description: plan.description || undefined,
    });
  } else {
    // Create new product
    stripeProduct = await stripe.products.create({
      name: plan.name,
      description: plan.description || undefined,
      metadata: { planId },
    });
  }

  // Create or get monthly price
  let monthlyPriceId = plan.stripePriceIdMonthly;
  if (!monthlyPriceId && Number(plan.priceMonthly) > 0) {
    const monthlyPrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: Math.round(Number(plan.priceMonthly) * 100), // Convert to kuruş/cents
      currency: plan.currency.toLowerCase(),
      recurring: { interval: 'month' },
      metadata: { planId, interval: 'monthly' },
    });
    monthlyPriceId = monthlyPrice.id;
  }

  // Create or get yearly price
  let yearlyPriceId = plan.stripePriceIdYearly;
  if (!yearlyPriceId && Number(plan.priceYearly) > 0) {
    const yearlyPrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: Math.round(Number(plan.priceYearly) * 100), // Convert to kuruş/cents
      currency: plan.currency.toLowerCase(),
      recurring: { interval: 'year' },
      metadata: { planId, interval: 'yearly' },
    });
    yearlyPriceId = yearlyPrice.id;
  }

  // Update plan with Stripe IDs
  const updatedPlan = await prisma.subscription_plans.update({
    where: { id: planId },
    data: {
      stripePriceIdMonthly: monthlyPriceId,
      stripePriceIdYearly: yearlyPriceId,
    },
  });

  logger.info({ planId, monthlyPriceId, yearlyPriceId }, 'Plan synced with Stripe');
  return updatedPlan;
}

/**
 * Get plan with pricing for specific platform
 */
export async function getPlanWithPlatformPricing(
  planId: string,
  platform: 'web' | 'ios' | 'android'
) {
  const plan = await getPlanById(planId);
  if (!plan) {
    return null;
  }

  let monthlyProductId: string | null = null;
  let yearlyProductId: string | null = null;

  switch (platform) {
    case 'web':
      monthlyProductId = plan.stripePriceIdMonthly;
      yearlyProductId = plan.stripePriceIdYearly;
      break;
    case 'ios':
      monthlyProductId = plan.appleProductIdMonthly;
      yearlyProductId = plan.appleProductIdYearly;
      break;
    case 'android':
      monthlyProductId = plan.googleProductIdMonthly;
      yearlyProductId = plan.googleProductIdYearly;
      break;
  }

  return {
    ...plan,
    monthlyProductId,
    yearlyProductId,
  };
}

/**
 * Get all plans formatted for mobile/web clients
 */
export async function getPlansForClient(platform?: 'web' | 'ios' | 'android') {
  const plans = await getPlans();

  return plans.map((plan) => {
    let monthlyProductId: string | null = null;
    let yearlyProductId: string | null = null;

    if (platform === 'web' || !platform) {
      monthlyProductId = plan.stripePriceIdMonthly;
      yearlyProductId = plan.stripePriceIdYearly;
    } else if (platform === 'ios') {
      monthlyProductId = plan.appleProductIdMonthly;
      yearlyProductId = plan.appleProductIdYearly;
    } else if (platform === 'android') {
      monthlyProductId = plan.googleProductIdMonthly;
      yearlyProductId = plan.googleProductIdYearly;
    }

    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      tier: plan.tier,
      priceMonthly: Number(plan.priceMonthly),
      priceYearly: Number(plan.priceYearly),
      currency: plan.currency,
      features: plan.features as string[],
      trialDays: plan.trialDays,
      maxDevices: plan.maxDevices,
      offlineDownloads: plan.offlineDownloads,
      monthlyProductId,
      yearlyProductId,
    };
  });
}
