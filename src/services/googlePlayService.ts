import { PaymentProvider, SubscriptionStatus, Prisma } from '@prisma/client';
import { prisma } from '../utils/database';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { eventEmitter } from '../utils/eventEmitter';
import {
  isGoogleConfigured,
  verifySubscription,
  verifyProduct,
  acknowledgeSubscription,
  acknowledgeProduct,
  parseRTDN,
  getSubscriptionStatusString,
  GOOGLE_NOTIFICATION_TYPES,
  type GoogleSubscriptionPurchase,
  type GoogleRTDN,
} from '../utils/googlePlay';
import { getPlanById } from './subscriptionPlanService';

export interface GooglePurchaseVerifyInput {
  purchaseToken: string;
  productId: string;
  isSubscription?: boolean;
}

export interface GooglePurchaseResult {
  success: boolean;
  subscriptionId?: string;
  orderId?: string;
  expiresAt?: Date;
  needsAcknowledgement?: boolean;
  error?: string;
}

/**
 * Verify and process Google Play purchase
 */
export async function verifyGooglePurchase(
  userId: string,
  input: GooglePurchaseVerifyInput
): Promise<GooglePurchaseResult> {
  if (!isGoogleConfigured()) {
    return { success: false, error: 'Google Play is not configured' };
  }

  try {
    const isSubscription = input.isSubscription !== false;

    if (isSubscription) {
      return verifyGoogleSubscription(userId, input.productId, input.purchaseToken);
    } else {
      return verifyGoogleProduct(userId, input.productId, input.purchaseToken);
    }
  } catch (error) {
    logger.error({ err: error, userId }, 'Google purchase verification failed');
    return { success: false, error: 'Verification failed' };
  }
}

/**
 * Verify and process Google subscription
 */
async function verifyGoogleSubscription(
  userId: string,
  subscriptionId: string,
  purchaseToken: string
): Promise<GooglePurchaseResult> {
  const purchase = await verifySubscription(subscriptionId, purchaseToken);

  if (!purchase) {
    return { success: false, error: 'Failed to verify subscription' };
  }

  // Check if cancelled
  if (purchase.cancelReason !== undefined) {
    return {
      success: false,
      error: `Subscription cancelled: ${getSubscriptionStatusString(
        purchase.paymentState,
        purchase.cancelReason,
        purchase.acknowledgementState
      )}`,
    };
  }

  // Find plan by Google product ID
  const plan = await findPlanByGoogleProductId(subscriptionId);
  if (!plan) {
    logger.warn({ subscriptionId }, 'No plan found for Google product ID');
    return { success: false, error: 'Invalid product' };
  }

  // Log the purchase validation
  await logGooglePurchaseValidation(userId, purchaseToken, subscriptionId, purchase);

  // Process the subscription
  const result = await processGoogleSubscription(userId, subscriptionId, purchaseToken, purchase, plan);

  // Acknowledge if needed
  if (purchase.acknowledgementState !== 1) {
    const acknowledged = await acknowledgeSubscription(subscriptionId, purchaseToken);
    if (!acknowledged) {
      logger.warn({ subscriptionId }, 'Failed to acknowledge Google subscription');
    }
    result.needsAcknowledgement = !acknowledged;
  }

  return result;
}

/**
 * Process Google subscription purchase
 */
async function processGoogleSubscription(
  userId: string,
  productId: string,
  purchaseToken: string,
  purchase: GoogleSubscriptionPurchase,
  plan: Awaited<ReturnType<typeof findPlanByGoogleProductId>>
): Promise<GooglePurchaseResult> {
  if (!plan) {
    return { success: false, error: 'Plan not found' };
  }

  const orderId = purchase.orderId || '';
  const startTimeMs = purchase.startTimeMillis ? parseInt(purchase.startTimeMillis, 10) : Date.now();
  const expiryTimeMs = purchase.expiryTimeMillis ? parseInt(purchase.expiryTimeMillis, 10) : null;
  const startDate = new Date(startTimeMs);
  const expiresAt = expiryTimeMs ? new Date(expiryTimeMs) : null;
  const isTrialPeriod = purchase.paymentState === 2;
  const isExpired = expiresAt ? expiresAt < new Date() : false;

  const subscriptionStatus: SubscriptionStatus = isExpired
    ? 'EXPIRED'
    : isTrialPeriod
    ? 'TRIALING'
    : purchase.paymentState === 0
    ? 'PAST_DUE'
    : 'ACTIVE';

  // Check if subscription already exists
  let subscription = await prisma.subscriptions.findFirst({
    where: { googlePurchaseToken: purchaseToken },
  });

  if (subscription) {
    // Update existing subscription
    subscription = await prisma.subscriptions.update({
      where: { id: subscription.id },
      data: {
        status: subscriptionStatus,
        currentPeriodEnd: expiresAt,
        googleOrderId: orderId,
        autoRenew: purchase.autoRenewing || false,
        lastVerifiedAt: new Date(),
      },
    });

    logger.info({ subscriptionId: subscription.id, orderId }, 'Google subscription updated');
  } else {
    // Create new subscription
    // First, cancel any existing subscriptions for this user
    await prisma.subscriptions.updateMany({
      where: { userId, status: { in: ['ACTIVE', 'TRIALING'] } },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });

    subscription = await prisma.subscriptions.create({
      data: {
        userId,
        planId: plan.id,
        provider: 'GOOGLE',
        status: subscriptionStatus,
        interval: productId.includes('yearly') ? 'YEARLY' : 'MONTHLY',
        googlePurchaseToken: purchaseToken,
        googleOrderId: orderId,
        currentPeriodStart: startDate,
        currentPeriodEnd: expiresAt,
        trialStart: isTrialPeriod ? startDate : null,
        trialEnd: isTrialPeriod ? expiresAt : null,
        autoRenew: purchase.autoRenewing || false,
        lastVerifiedAt: new Date(),
      },
    });

    // Update user tier
    await prisma.users.update({
      where: { id: userId },
      data: {
        subscriptionTier: plan.tier,
        subscriptionExpiresAt: expiresAt,
      },
    });

    // Emit subscription created event
    eventEmitter.emit('subscription.created', {
      subscriptionId: subscription.id,
      userId,
      plan: plan.name,
      provider: 'GOOGLE',
      status: subscriptionStatus,
      currentPeriodEnd: expiresAt || new Date(),
    });

    logger.info({ subscriptionId: subscription.id, orderId }, 'Google subscription created');
  }

  // Create payment record
  await createGooglePayment(userId, subscription.id, orderId, purchase, plan);

  const result: GooglePurchaseResult = {
    success: true,
    subscriptionId: subscription.id,
    orderId,
  };
  if (expiresAt) result.expiresAt = expiresAt;
  return result;
}

/**
 * Verify one-time product purchase
 */
async function verifyGoogleProduct(
  userId: string,
  productId: string,
  purchaseToken: string
): Promise<GooglePurchaseResult> {
  const purchase = await verifyProduct(productId, purchaseToken);

  if (!purchase) {
    return { success: false, error: 'Failed to verify product' };
  }

  if (purchase.purchaseState !== 0) {
    return { success: false, error: 'Purchase not completed' };
  }

  // Acknowledge if needed
  if (purchase.acknowledgementState !== 1) {
    const acknowledged = await acknowledgeProduct(productId, purchaseToken);
    if (!acknowledged) {
      logger.warn({ productId }, 'Failed to acknowledge Google product');
    }
  }

  // Create payment record for one-time purchase
  const payment = await prisma.payments.create({
    data: {
      userId,
      provider: 'GOOGLE',
      transactionId: purchase.orderId || purchaseToken,
      amount: 0, // Would need to get from product catalog
      currency: 'TRY',
      status: 'COMPLETED',
      paymentMethod: 'GOOGLE_PAY',
      environment: 'PRODUCTION',
      paidAt: purchase.purchaseTimeMillis
        ? new Date(parseInt(purchase.purchaseTimeMillis, 10))
        : new Date(),
    },
  });

  logger.info({ paymentId: payment.id, productId }, 'Google one-time product processed');

  const result: GooglePurchaseResult = {
    success: true,
  };
  if (purchase.orderId) result.orderId = purchase.orderId;
  return result;
}

/**
 * Handle Google Play Real-time Developer Notification
 */
export async function handleGoogleNotification(
  messageData: string
): Promise<{ handled: boolean; notificationType?: number }> {
  const notification = parseRTDN(messageData);

  if (!notification) {
    return { handled: false };
  }

  logger.info({ packageName: notification.packageName }, 'Processing Google notification');

  // Handle subscription notification
  if (notification.subscriptionNotification) {
    const { notificationType, purchaseToken, subscriptionId } = notification.subscriptionNotification;

    await processGoogleSubscriptionNotification(notificationType, purchaseToken, subscriptionId);

    return { handled: true, notificationType };
  }

  // Handle one-time product notification
  if (notification.oneTimeProductNotification) {
    logger.info(
      { notificationType: notification.oneTimeProductNotification.notificationType },
      'Google one-time product notification received'
    );
    return { handled: true, notificationType: notification.oneTimeProductNotification.notificationType };
  }

  // Test notification
  if (notification.testNotification) {
    logger.info('Google test notification received');
    return { handled: true };
  }

  return { handled: false };
}

/**
 * Process Google subscription notification
 */
async function processGoogleSubscriptionNotification(
  notificationType: number,
  purchaseToken: string,
  subscriptionId: string
) {
  // Find subscription by purchase token
  const subscription = await prisma.subscriptions.findFirst({
    where: { googlePurchaseToken: purchaseToken },
    include: { plan: true, users: true },
  });

  if (!subscription) {
    // New subscription - verify and create
    if (notificationType === GOOGLE_NOTIFICATION_TYPES.SUBSCRIPTION_PURCHASED) {
      logger.info({ subscriptionId }, 'New Google subscription notification - needs user context');
    } else {
      logger.warn({ subscriptionId }, 'Subscription not found for Google notification');
    }
    return;
  }

  // Get latest subscription details from Google
  const purchase = await verifySubscription(subscriptionId, purchaseToken);

  switch (notificationType) {
    case GOOGLE_NOTIFICATION_TYPES.SUBSCRIPTION_PURCHASED:
    case GOOGLE_NOTIFICATION_TYPES.SUBSCRIPTION_RENEWED:
    case GOOGLE_NOTIFICATION_TYPES.SUBSCRIPTION_RECOVERED:
    case GOOGLE_NOTIFICATION_TYPES.SUBSCRIPTION_RESTARTED:
      const expiryTime = purchase?.expiryTimeMillis
        ? new Date(parseInt(purchase.expiryTimeMillis, 10))
        : subscription.currentPeriodEnd;

      await prisma.subscriptions.update({
        where: { id: subscription.id },
        data: {
          status: 'ACTIVE',
          currentPeriodEnd: expiryTime,
          autoRenew: purchase?.autoRenewing || true,
          lastVerifiedAt: new Date(),
        },
      });
      await updateUserTier(subscription.userId, subscription.plan.tier, expiryTime);
      logger.info({ subscriptionId: subscription.id, notificationType }, 'Google subscription renewed/recovered');
      break;

    case GOOGLE_NOTIFICATION_TYPES.SUBSCRIPTION_CANCELED:
      await prisma.subscriptions.update({
        where: { id: subscription.id },
        data: {
          cancelAtPeriodEnd: true,
          autoRenew: false,
          lastVerifiedAt: new Date(),
        },
      });
      logger.info({ subscriptionId: subscription.id }, 'Google subscription cancelled');
      break;

    case GOOGLE_NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRED:
      await prisma.subscriptions.update({
        where: { id: subscription.id },
        data: {
          status: 'EXPIRED',
          lastVerifiedAt: new Date(),
        },
      });
      await updateUserTier(subscription.userId, 'FREE', null);
      eventEmitter.emit('subscription.expired', {
        subscriptionId: subscription.id,
        userId: subscription.userId,
        plan: subscription.plan.name,
        provider: 'GOOGLE',
        cancelledAt: new Date(),
        effectiveEndDate: subscription.currentPeriodEnd || new Date(),
      });
      logger.info({ subscriptionId: subscription.id }, 'Google subscription expired');
      break;

    case GOOGLE_NOTIFICATION_TYPES.SUBSCRIPTION_ON_HOLD:
      await prisma.subscriptions.update({
        where: { id: subscription.id },
        data: {
          status: 'PAST_DUE',
          lastVerifiedAt: new Date(),
        },
      });
      eventEmitter.emit('payment.failed', {
        userId: subscription.userId,
        subscriptionId: subscription.id,
        amount: 0,
        currency: 'TRY',
        provider: 'GOOGLE',
        reason: 'Subscription on hold - payment failed',
      });
      break;

    case GOOGLE_NOTIFICATION_TYPES.SUBSCRIPTION_IN_GRACE_PERIOD:
      const gracePeriodEnd = purchase?.expiryTimeMillis
        ? new Date(parseInt(purchase.expiryTimeMillis, 10))
        : new Date(Date.now() + config.payments.gracePeriodDays * 24 * 60 * 60 * 1000);

      await prisma.subscriptions.update({
        where: { id: subscription.id },
        data: {
          status: 'GRACE_PERIOD',
          gracePeriodEnd,
          lastVerifiedAt: new Date(),
        },
      });
      break;

    case GOOGLE_NOTIFICATION_TYPES.SUBSCRIPTION_PAUSED:
      await prisma.subscriptions.update({
        where: { id: subscription.id },
        data: {
          status: 'PAUSED',
          lastVerifiedAt: new Date(),
        },
      });
      break;

    case GOOGLE_NOTIFICATION_TYPES.SUBSCRIPTION_REVOKED:
      await prisma.subscriptions.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelReason: 'Revoked by Google Play',
          lastVerifiedAt: new Date(),
        },
      });
      await updateUserTier(subscription.userId, 'FREE', null);
      eventEmitter.emit('subscription.cancelled', {
        subscriptionId: subscription.id,
        userId: subscription.userId,
        plan: subscription.plan.name,
        provider: 'GOOGLE',
        cancelledAt: new Date(),
        effectiveEndDate: new Date(),
      });
      break;

    case GOOGLE_NOTIFICATION_TYPES.SUBSCRIPTION_PRICE_CHANGE_CONFIRMED:
      logger.info({ subscriptionId: subscription.id }, 'Google subscription price change confirmed');
      break;

    case GOOGLE_NOTIFICATION_TYPES.SUBSCRIPTION_DEFERRED:
      logger.info({ subscriptionId: subscription.id }, 'Google subscription deferred');
      break;

    default:
      logger.info({ notificationType, subscriptionId: subscription.id }, 'Unhandled Google notification type');
  }
}

// ==================== Helper Functions ====================

async function findPlanByGoogleProductId(productId: string) {
  return prisma.subscription_plans.findFirst({
    where: {
      OR: [
        { googleProductIdMonthly: productId },
        { googleProductIdYearly: productId },
      ],
      isActive: true,
    },
  });
}

async function updateUserTier(
  userId: string,
  tier: string,
  expiresAt: Date | null
) {
  await prisma.users.update({
    where: { id: userId },
    data: {
      subscriptionTier: tier as any,
      subscriptionExpiresAt: expiresAt,
    },
  });
}

async function logGooglePurchaseValidation(
  userId: string,
  purchaseToken: string,
  productId: string,
  purchase: GoogleSubscriptionPurchase
) {
  const purchaseTimeMs = purchase.startTimeMillis
    ? parseInt(purchase.startTimeMillis, 10)
    : Date.now();
  const expiryTimeMs = purchase.expiryTimeMillis
    ? parseInt(purchase.expiryTimeMillis, 10)
    : null;

  await prisma.purchase_receipts.create({
    data: {
      userId,
      provider: 'GOOGLE',
      receiptData: purchaseToken,
      validationStatus: 'VALID',
      validationResponse: purchase as any,
      productId,
      transactionId: purchase.orderId || purchaseToken,
      purchaseDate: new Date(purchaseTimeMs),
      expiresDate: expiryTimeMs ? new Date(expiryTimeMs) : null,
      isTrialPeriod: purchase.paymentState === 2,
      isSandbox: false, // Google doesn't have sandbox in the same way
    },
  });
}

async function createGooglePayment(
  userId: string,
  subscriptionId: string,
  orderId: string,
  purchase: GoogleSubscriptionPurchase,
  plan: { priceMonthly: Prisma.Decimal; priceYearly: Prisma.Decimal }
) {
  // Determine if yearly based on product ID or price
  const priceMicros = purchase.priceAmountMicros
    ? parseInt(purchase.priceAmountMicros, 10)
    : 0;
  const amount = priceMicros > 0 ? priceMicros / 1000000 : Number(plan.priceMonthly);
  const currency = purchase.priceCurrencyCode || 'TRY';

  await prisma.payments.create({
    data: {
      userId,
      subscriptionId,
      provider: 'GOOGLE',
      transactionId: orderId,
      amount: new Prisma.Decimal(amount),
      currency,
      status: purchase.paymentState === 1 ? 'COMPLETED' : 'PENDING',
      paymentMethod: 'GOOGLE_PAY',
      environment: 'PRODUCTION',
      paidAt: purchase.startTimeMillis
        ? new Date(parseInt(purchase.startTimeMillis, 10))
        : new Date(),
    },
  });
}

/**
 * Restore purchases for a user
 */
export async function restoreGooglePurchases(
  userId: string,
  purchaseToken: string,
  subscriptionId: string
): Promise<GooglePurchaseResult> {
  if (!isGoogleConfigured()) {
    return { success: false, error: 'Google Play is not configured' };
  }

  try {
    return verifyGoogleSubscription(userId, subscriptionId, purchaseToken);
  } catch (error) {
    logger.error({ err: error, userId }, 'Google restore purchases failed');
    return { success: false, error: 'Restore failed' };
  }
}
