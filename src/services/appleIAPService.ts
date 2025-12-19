import { PaymentProvider, SubscriptionStatus, Prisma } from '@prisma/client';
import { prisma } from '../utils/database';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { eventEmitter } from '../utils/eventEmitter';
import {
  isAppleConfigured,
  verifyReceipt,
  getSubscriptionStatus as getAppleSubscriptionStatus,
  decodeNotificationV2,
  decodeSignedTransaction,
  decodeSignedRenewalInfo,
  type AppleReceiptResponse,
  type AppleInAppPurchase,
  type AppleNotificationV2Payload,
  type AppleNotificationType,
} from '../utils/appleIAP';
import { getPlanById } from './subscriptionPlanService';

export interface ApplePurchaseVerifyInput {
  receiptData: string;
  productId: string;
}

export interface ApplePurchaseResult {
  success: boolean;
  subscriptionId?: string;
  transactionId?: string;
  expiresAt?: Date;
  isTrialPeriod?: boolean;
  error?: string;
}

/**
 * Verify and process Apple receipt
 */
export async function verifyApplePurchase(
  userId: string,
  input: ApplePurchaseVerifyInput
): Promise<ApplePurchaseResult> {
  if (!isAppleConfigured()) {
    return { success: false, error: 'Apple IAP is not configured' };
  }

  try {
    // Verify receipt with Apple
    const receiptResponse = await verifyReceipt(input.receiptData);

    if (receiptResponse.status !== 0) {
      const errorMessage = getAppleReceiptError(receiptResponse.status);
      logger.warn({ userId, status: receiptResponse.status }, `Apple receipt verification failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }

    // Get the latest transaction for the requested product
    const latestReceipt = receiptResponse.latest_receipt_info || [];
    const transaction = latestReceipt.find((t) => t.product_id === input.productId);

    if (!transaction) {
      return { success: false, error: 'Product not found in receipt' };
    }

    // Log the receipt validation
    await logReceiptValidation(userId, input.receiptData, receiptResponse, transaction);

    // Process the subscription
    const result = await processAppleTransaction(userId, transaction, input.receiptData);

    return result;
  } catch (error) {
    logger.error({ err: error, userId }, 'Apple purchase verification failed');
    return { success: false, error: 'Verification failed' };
  }
}

/**
 * Process Apple transaction and create/update subscription
 */
async function processAppleTransaction(
  userId: string,
  transaction: AppleInAppPurchase,
  receiptData: string
): Promise<ApplePurchaseResult> {
  const originalTransactionId = transaction.original_transaction_id;
  const transactionId = transaction.transaction_id;
  const productId = transaction.product_id;
  const expiresDateMs = transaction.expires_date_ms ? parseInt(transaction.expires_date_ms, 10) : null;
  const expiresAt = expiresDateMs ? new Date(expiresDateMs) : null;
  const isTrialPeriod = transaction.is_trial_period === 'true';
  const purchaseDate = new Date(parseInt(transaction.purchase_date_ms, 10));

  // Find plan by Apple product ID
  const plan = await findPlanByAppleProductId(productId);
  if (!plan) {
    logger.warn({ productId }, 'No plan found for Apple product ID');
    return { success: false, error: 'Invalid product' };
  }

  // Check if subscription already exists
  let subscription = await prisma.subscriptions.findFirst({
    where: { appleOriginalTransactionId: originalTransactionId },
  });

  const isExpired = expiresAt ? expiresAt < new Date() : false;
  const subscriptionStatus: SubscriptionStatus = isExpired
    ? 'EXPIRED'
    : isTrialPeriod
    ? 'TRIALING'
    : 'ACTIVE';

  if (subscription) {
    // Update existing subscription
    subscription = await prisma.subscriptions.update({
      where: { id: subscription.id },
      data: {
        status: subscriptionStatus,
        currentPeriodEnd: expiresAt,
        appleLatestReceiptData: receiptData,
        lastVerifiedAt: new Date(),
      },
    });

    logger.info({ subscriptionId: subscription.id, transactionId }, 'Apple subscription updated');
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
        provider: 'APPLE',
        status: subscriptionStatus,
        interval: productId.includes('yearly') ? 'YEARLY' : 'MONTHLY',
        appleOriginalTransactionId: originalTransactionId,
        appleLatestReceiptData: receiptData,
        currentPeriodStart: purchaseDate,
        currentPeriodEnd: expiresAt,
        trialStart: isTrialPeriod ? purchaseDate : null,
        trialEnd: isTrialPeriod ? expiresAt : null,
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
      provider: 'APPLE',
      status: subscriptionStatus,
      currentPeriodEnd: expiresAt || new Date(),
    });

    logger.info({ subscriptionId: subscription.id, transactionId }, 'Apple subscription created');
  }

  // Create payment record
  await createApplePayment(userId, subscription.id, transaction, plan);

  const result: ApplePurchaseResult = {
    success: true,
    subscriptionId: subscription.id,
    transactionId,
    isTrialPeriod,
  };
  if (expiresAt) result.expiresAt = expiresAt;
  return result;
}

/**
 * Handle App Store Server Notification V2
 */
export async function handleAppleNotification(
  signedPayload: string
): Promise<{ handled: boolean; notificationType?: string }> {
  const payload = decodeNotificationV2(signedPayload);

  if (!payload) {
    return { handled: false };
  }

  const { notificationType, data } = payload;

  logger.info({ notificationType }, 'Processing Apple notification');

  // Decode transaction info
  const transactionInfo = decodeSignedTransaction(data.signedTransactionInfo);
  if (!transactionInfo) {
    logger.warn({ notificationType }, 'Could not decode transaction info');
    return { handled: false };
  }

  const renewalInfo = data.signedRenewalInfo
    ? decodeSignedRenewalInfo(data.signedRenewalInfo)
    : null;

  // Find subscription by original transaction ID
  const subscription = await prisma.subscriptions.findFirst({
    where: { appleOriginalTransactionId: transactionInfo.originalTransactionId },
    include: { plan: true, users: true },
  });

  if (!subscription) {
    logger.warn(
      { originalTransactionId: transactionInfo.originalTransactionId },
      'Subscription not found for Apple notification'
    );
    return { handled: false };
  }

  // Handle notification based on type
  await processAppleNotificationType(notificationType, subscription, transactionInfo, renewalInfo);

  return { handled: true, notificationType };
}

/**
 * Process Apple notification by type
 */
async function processAppleNotificationType(
  notificationType: AppleNotificationType,
  subscription: Awaited<ReturnType<typeof prisma.subscriptions.findFirst>> & { plan: any; users: any },
  transactionInfo: any,
  renewalInfo: any
) {
  const expiresAt = transactionInfo.expiresDate
    ? new Date(transactionInfo.expiresDate)
    : subscription.currentPeriodEnd;

  switch (notificationType) {
    case 'DID_RENEW':
    case 'SUBSCRIBED':
      await prisma.subscriptions.update({
        where: { id: subscription.id },
        data: {
          status: 'ACTIVE',
          currentPeriodEnd: expiresAt,
          lastVerifiedAt: new Date(),
        },
      });
      await updateUserTier(subscription.userId, subscription.plan.tier, expiresAt);
      logger.info({ subscriptionId: subscription.id }, 'Apple subscription renewed');
      break;

    case 'DID_FAIL_TO_RENEW':
      await prisma.subscriptions.update({
        where: { id: subscription.id },
        data: {
          status: 'PAST_DUE',
          lastVerifiedAt: new Date(),
        },
      });
      // Send notification to user about failed renewal
      eventEmitter.emit('payment.failed', {
        userId: subscription.userId,
        subscriptionId: subscription.id,
        amount: 0,
        currency: 'TRY',
        provider: 'APPLE',
        reason: 'Apple renewal failed',
      });
      break;

    case 'EXPIRED':
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
        provider: 'APPLE',
        cancelledAt: new Date(),
        effectiveEndDate: expiresAt || new Date(),
      });
      break;

    case 'GRACE_PERIOD_EXPIRED':
      await prisma.subscriptions.update({
        where: { id: subscription.id },
        data: {
          status: 'EXPIRED',
          gracePeriodEnd: new Date(),
          lastVerifiedAt: new Date(),
        },
      });
      await updateUserTier(subscription.userId, 'FREE', null);
      break;

    case 'REFUND':
    case 'REVOKE':
      await prisma.subscriptions.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelReason: notificationType === 'REFUND' ? 'Refunded by Apple' : 'Revoked by Apple',
          lastVerifiedAt: new Date(),
        },
      });
      await updateUserTier(subscription.userId, 'FREE', null);
      eventEmitter.emit('subscription.cancelled', {
        subscriptionId: subscription.id,
        userId: subscription.userId,
        plan: subscription.plan.name,
        provider: 'APPLE',
        cancelledAt: new Date(),
        effectiveEndDate: new Date(),
      });
      break;

    case 'DID_CHANGE_RENEWAL_STATUS':
      const autoRenew = renewalInfo?.autoRenewStatus === 1;
      await prisma.subscriptions.update({
        where: { id: subscription.id },
        data: {
          autoRenew,
          cancelAtPeriodEnd: !autoRenew,
          lastVerifiedAt: new Date(),
        },
      });
      break;

    case 'DID_CHANGE_RENEWAL_PREF':
      // User changed to a different product
      if (renewalInfo?.autoRenewProductId) {
        const newPlan = await findPlanByAppleProductId(renewalInfo.autoRenewProductId);
        if (newPlan) {
          await prisma.subscriptions.update({
            where: { id: subscription.id },
            data: {
              planId: newPlan.id,
              lastVerifiedAt: new Date(),
            },
          });
        }
      }
      break;

    default:
      logger.info({ notificationType }, 'Unhandled Apple notification type');
  }
}

// ==================== Helper Functions ====================

async function findPlanByAppleProductId(productId: string) {
  return prisma.subscription_plans.findFirst({
    where: {
      OR: [
        { appleProductIdMonthly: productId },
        { appleProductIdYearly: productId },
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

async function logReceiptValidation(
  userId: string,
  receiptData: string,
  response: AppleReceiptResponse,
  transaction: AppleInAppPurchase
) {
  const expiresDateMs = transaction.expires_date_ms
    ? parseInt(transaction.expires_date_ms, 10)
    : null;

  await prisma.purchase_receipts.create({
    data: {
      userId,
      provider: 'APPLE',
      receiptData,
      validationStatus: response.status === 0 ? 'VALID' : 'INVALID',
      validationResponse: response as any,
      productId: transaction.product_id,
      transactionId: transaction.transaction_id,
      purchaseDate: new Date(parseInt(transaction.purchase_date_ms, 10)),
      expiresDate: expiresDateMs ? new Date(expiresDateMs) : null,
      isTrialPeriod: transaction.is_trial_period === 'true',
      isSandbox: response.environment === 'Sandbox',
    },
  });
}

async function createApplePayment(
  userId: string,
  subscriptionId: string,
  transaction: AppleInAppPurchase,
  plan: { priceMonthly: Prisma.Decimal; priceYearly: Prisma.Decimal }
) {
  const isYearly = transaction.product_id.includes('yearly');
  const amount = isYearly ? plan.priceYearly : plan.priceMonthly;

  await prisma.payments.create({
    data: {
      userId,
      subscriptionId,
      provider: 'APPLE',
      transactionId: transaction.transaction_id,
      amount,
      currency: 'TRY',
      status: 'COMPLETED',
      paymentMethod: 'APPLE_PAY',
      environment: transaction.original_transaction_id.startsWith('1000000')
        ? 'SANDBOX'
        : 'PRODUCTION',
      paidAt: new Date(parseInt(transaction.purchase_date_ms, 10)),
    },
  });
}

function getAppleReceiptError(status: number): string {
  const errors: Record<number, string> = {
    21000: 'The request to the App Store was not made using HTTP POST',
    21001: 'This status code is no longer sent by the App Store',
    21002: 'The data in the receipt-data property was malformed',
    21003: 'The receipt could not be authenticated',
    21004: 'The shared secret you provided does not match',
    21005: 'The receipt server is not currently available',
    21006: 'This receipt is valid but the subscription has expired',
    21007: 'This receipt is from the test environment',
    21008: 'This receipt is from the production environment',
    21009: 'Internal data access error',
    21010: 'The user account cannot be found or has been deleted',
  };

  return errors[status] || `Unknown error (status: ${status})`;
}

/**
 * Restore purchases for a user
 */
export async function restorePurchases(
  userId: string,
  receiptData: string
): Promise<ApplePurchaseResult> {
  if (!isAppleConfigured()) {
    return { success: false, error: 'Apple IAP is not configured' };
  }

  try {
    const receiptResponse = await verifyReceipt(receiptData, false); // Include old transactions

    if (receiptResponse.status !== 0) {
      return { success: false, error: getAppleReceiptError(receiptResponse.status) };
    }

    const latestReceipt = receiptResponse.latest_receipt_info || [];

    if (latestReceipt.length === 0) {
      return { success: false, error: 'No purchases found' };
    }

    // Find the most recent active subscription
    const now = Date.now();
    const activeTransaction = latestReceipt
      .filter((t) => t.expires_date_ms && parseInt(t.expires_date_ms, 10) > now)
      .sort((a, b) => parseInt(b.expires_date_ms!, 10) - parseInt(a.expires_date_ms!, 10))[0];

    if (!activeTransaction) {
      return { success: false, error: 'No active subscriptions found' };
    }

    return processAppleTransaction(userId, activeTransaction, receiptData);
  } catch (error) {
    logger.error({ err: error, userId }, 'Apple restore purchases failed');
    return { success: false, error: 'Restore failed' };
  }
}
