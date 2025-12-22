import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { SubscriptionTier } from '@prisma/client';

// RevenueCat webhook event types
type RevenueCatEventType =
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'CANCELLATION'
  | 'UNCANCELLATION'
  | 'NON_RENEWING_PURCHASE'
  | 'SUBSCRIPTION_PAUSED'
  | 'EXPIRATION'
  | 'BILLING_ISSUE'
  | 'PRODUCT_CHANGE'
  | 'TRANSFER';

interface RevenueCatEvent {
  event: {
    type: RevenueCatEventType;
    id: string;
    app_user_id: string;
    product_id: string;
    entitlement_ids: string[];
    period_type: 'TRIAL' | 'INTRO' | 'NORMAL';
    purchased_at_ms: number;
    expiration_at_ms: number;
    store: 'APP_STORE' | 'PLAY_STORE' | 'STRIPE' | 'PROMOTIONAL';
    environment: 'SANDBOX' | 'PRODUCTION';
    is_family_share: boolean;
    country_code: string;
    currency: string;
    price: number;
    price_in_purchased_currency: number;
    original_app_user_id: string;
    aliases: string[];
    transaction_id: string;
    original_transaction_id: string;
    subscriber_attributes?: Record<string, { value: string; updated_at_ms: number }>;
  };
  api_version: string;
}

// Map RevenueCat product IDs to subscription tiers
const productToTier: Record<string, SubscriptionTier> = {
  // iOS products
  'com.yogaapp.premium.monthly': 'PREMIUM',
  'com.yogaapp.premium.yearly': 'PREMIUM',
  'com.yogaapp.family.monthly': 'FAMILY',
  'com.yogaapp.family.yearly': 'FAMILY',
  // Android products
  'premium_monthly': 'PREMIUM',
  'premium_yearly': 'PREMIUM',
  'family_monthly': 'FAMILY',
  'family_yearly': 'FAMILY',
  // RevenueCat entitlements
  'yoga-app Pro': 'PREMIUM',
  'pro': 'PREMIUM',
};

// Get tier from product ID or entitlement
const getTierFromProduct = (productId: string, entitlements: string[]): SubscriptionTier => {
  // First check product ID
  if (productToTier[productId]) {
    return productToTier[productId];
  }

  // Then check entitlements
  for (const entitlement of entitlements) {
    if (productToTier[entitlement]) {
      return productToTier[entitlement];
    }
  }

  // Default to PREMIUM if product is recognized
  if (productId.toLowerCase().includes('premium') || productId.toLowerCase().includes('pro')) {
    return 'PREMIUM';
  }
  if (productId.toLowerCase().includes('family')) {
    return 'FAMILY';
  }

  return 'PREMIUM';
};

/**
 * RevenueCat Webhook Handler
 * POST /api/webhooks/revenuecat
 */
export const handleRevenueCatWebhook = async (req: Request, res: Response) => {
  try {
    const event = req.body as RevenueCatEvent;

    console.log('RevenueCat webhook received:', {
      type: event.event?.type,
      appUserId: event.event?.app_user_id,
      productId: event.event?.product_id,
      environment: event.event?.environment,
    });

    if (!event.event) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    const {
      type,
      app_user_id,
      product_id,
      entitlement_ids,
      expiration_at_ms,
      store,
      environment,
      transaction_id,
      original_transaction_id,
      price,
      currency,
    } = event.event;

    // Find user by RevenueCat app_user_id (should match our user ID)
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { id: app_user_id },
          { revenuecatUserId: app_user_id },
        ],
      },
    });

    if (!user) {
      console.log('User not found for RevenueCat ID:', app_user_id);
      // Return 200 to acknowledge receipt even if user not found
      return res.status(200).json({
        success: false,
        message: 'User not found',
        app_user_id
      });
    }

    const tier = getTierFromProduct(product_id, entitlement_ids || []);
    const expiresAt = expiration_at_ms ? new Date(expiration_at_ms) : null;
    const provider = store === 'APP_STORE' ? 'APPLE' : store === 'PLAY_STORE' ? 'GOOGLE' : 'STRIPE';

    switch (type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'NON_RENEWING_PURCHASE':
      case 'UNCANCELLATION':
        await handleSubscriptionActivation(user.id, {
          tier,
          provider,
          expiresAt,
          transactionId: transaction_id,
          originalTransactionId: original_transaction_id,
          productId: product_id,
          price,
          currency,
          environment,
          eventType: type,
        });
        break;

      case 'CANCELLATION':
        await handleSubscriptionCancellation(user.id, {
          transactionId: transaction_id,
          reason: 'User cancelled subscription',
        });
        break;

      case 'EXPIRATION':
        await handleSubscriptionExpiration(user.id, {
          transactionId: transaction_id,
        });
        break;

      case 'BILLING_ISSUE':
        await handleBillingIssue(user.id, {
          transactionId: transaction_id,
        });
        break;

      case 'PRODUCT_CHANGE':
        await handleProductChange(user.id, {
          tier,
          provider,
          expiresAt,
          transactionId: transaction_id,
          productId: product_id,
        });
        break;

      default:
        console.log('Unhandled RevenueCat event type:', type);
    }

    // Log the webhook event using audit_logs (general log, not admin-specific)
    await prisma.audit_logs.create({
      data: {
        userId: user.id,
        action: 'REVENUECAT_WEBHOOK',
        entityType: 'subscription',
        entityId: transaction_id || 'unknown',
        metadata: {
          eventType: type,
          productId: product_id,
          store,
          environment,
          price,
          currency,
        },
      },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('RevenueCat webhook error:', error);
    // Always return 200 to prevent RevenueCat from retrying
    res.status(200).json({ success: false, error: 'Internal error' });
  }
};

async function handleSubscriptionActivation(
  userId: string,
  data: {
    tier: SubscriptionTier;
    provider: string;
    expiresAt: Date | null;
    transactionId: string;
    originalTransactionId: string;
    productId: string;
    price: number;
    currency: string;
    environment: string;
    eventType: string;
  }
) {
  // Find or create subscription plan
  let plan = await prisma.subscription_plans.findFirst({
    where: { tier: data.tier },
  });

  if (!plan) {
    plan = await prisma.subscription_plans.create({
      data: {
        name: data.tier === 'PREMIUM' ? 'Premium Plan' : 'Family Plan',
        tier: data.tier,
        priceMonthly: data.tier === 'PREMIUM' ? 9.99 : 14.99,
        priceYearly: data.tier === 'PREMIUM' ? 99.99 : 149.99,
        features: ['all_content', 'offline_access', 'no_ads'],
        description: `${data.tier} subscription plan`,
        isActive: true,
      },
    });
  }

  // Deactivate existing subscriptions
  await prisma.subscriptions.updateMany({
    where: {
      userId,
      status: 'ACTIVE',
    },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelReason: 'New subscription activated via RevenueCat',
    },
  });

  // Check if subscription already exists
  const existingSubscription = await prisma.subscriptions.findFirst({
    where: {
      userId,
      providerSubscriptionId: data.originalTransactionId,
    },
  });

  if (existingSubscription) {
    // Update existing subscription
    await prisma.subscriptions.update({
      where: { id: existingSubscription.id },
      data: {
        status: 'ACTIVE',
        currentPeriodEnd: data.expiresAt,
        providerData: {
          transactionId: data.transactionId,
          productId: data.productId,
          price: data.price,
          currency: data.currency,
          environment: data.environment,
          lastEventType: data.eventType,
        },
      },
    });
  } else {
    // Create new subscription
    await prisma.subscriptions.create({
      data: {
        userId,
        planId: plan.id,
        provider: data.provider as any,
        status: 'ACTIVE',
        interval: data.productId.includes('yearly') ? 'YEARLY' : 'MONTHLY',
        currentPeriodStart: new Date(),
        currentPeriodEnd: data.expiresAt,
        providerSubscriptionId: data.originalTransactionId,
        autoRenew: true,
        providerData: {
          transactionId: data.transactionId,
          productId: data.productId,
          price: data.price,
          currency: data.currency,
          environment: data.environment,
        },
      },
    });
  }

  // Update user's subscription tier
  await prisma.users.update({
    where: { id: userId },
    data: {
      subscriptionTier: data.tier,
      subscriptionExpiresAt: data.expiresAt,
      revenuecatUserId: userId, // Store RevenueCat user ID
    },
  });

  console.log(`Subscription activated for user ${userId}: ${data.tier}`);
}

async function handleSubscriptionCancellation(
  userId: string,
  data: { transactionId: string; reason: string }
) {
  const subscription = await prisma.subscriptions.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
    },
  });

  if (subscription) {
    await prisma.subscriptions.update({
      where: { id: subscription.id },
      data: {
        autoRenew: false,
        cancelledAt: new Date(),
        cancelReason: data.reason,
      },
    });
  }

  console.log(`Subscription cancelled for user ${userId}`);
}

async function handleSubscriptionExpiration(
  userId: string,
  data: { transactionId: string }
) {
  // Update subscription status
  await prisma.subscriptions.updateMany({
    where: {
      userId,
      status: 'ACTIVE',
    },
    data: {
      status: 'EXPIRED',
    },
  });

  // Downgrade user to FREE tier
  await prisma.users.update({
    where: { id: userId },
    data: {
      subscriptionTier: 'FREE',
      subscriptionExpiresAt: null,
    },
  });

  console.log(`Subscription expired for user ${userId}`);
}

async function handleBillingIssue(
  userId: string,
  data: { transactionId: string }
) {
  const subscription = await prisma.subscriptions.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
    },
  });

  if (subscription) {
    await prisma.subscriptions.update({
      where: { id: subscription.id },
      data: {
        status: 'PAST_DUE',
      },
    });
  }

  console.log(`Billing issue for user ${userId}`);
}

async function handleProductChange(
  userId: string,
  data: {
    tier: SubscriptionTier;
    provider: string;
    expiresAt: Date | null;
    transactionId: string;
    productId: string;
  }
) {
  // Find the new plan
  let plan = await prisma.subscription_plans.findFirst({
    where: { tier: data.tier },
  });

  if (!plan) {
    plan = await prisma.subscription_plans.create({
      data: {
        name: data.tier === 'PREMIUM' ? 'Premium Plan' : 'Family Plan',
        tier: data.tier,
        priceMonthly: data.tier === 'PREMIUM' ? 9.99 : 14.99,
        priceYearly: data.tier === 'PREMIUM' ? 99.99 : 149.99,
        features: ['all_content', 'offline_access', 'no_ads'],
        description: `${data.tier} subscription plan`,
        isActive: true,
      },
    });
  }

  // Update active subscription
  const subscription = await prisma.subscriptions.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
    },
  });

  if (subscription) {
    await prisma.subscriptions.update({
      where: { id: subscription.id },
      data: {
        planId: plan.id,
        currentPeriodEnd: data.expiresAt,
      },
    });
  }

  // Update user tier
  await prisma.users.update({
    where: { id: userId },
    data: {
      subscriptionTier: data.tier,
      subscriptionExpiresAt: data.expiresAt,
    },
  });

  console.log(`Product changed for user ${userId} to ${data.tier}`);
}
