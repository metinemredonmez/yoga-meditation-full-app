import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { config } from '../utils/config';
import { eventEmitter } from '../utils/eventEmitter';

// ============================================
// Types
// ============================================

interface IyzicoWebhookPayload {
  iyziEventType: string;
  iyziEventTime: number;
  iyziReferenceCode: string;
  token: string;
  paymentId?: string;
  paymentConversationId?: string;
  status?: string;
  paymentStatus?: string;
  merchantId?: string;
}

interface Iyzico3DSecureCallback {
  status: string;
  paymentId: string;
  conversationId: string;
  mdStatus: string;
  token: string;
}

type IyzicoEventType =
  | 'CREDIT_PAYMENT_PENDING'
  | 'CREDIT_PAYMENT_SUCCESS'
  | 'CREDIT_PAYMENT_FAILURE'
  | 'REFUND_SUCCESS'
  | 'REFUND_FAILURE'
  | 'SUBSCRIPTION_ORDER_SUCCESS'
  | 'SUBSCRIPTION_ORDER_FAILURE'
  | 'SUBSCRIPTION_RENEWED'
  | 'SUBSCRIPTION_CANCELLED'
  | 'SUBSCRIPTION_UPGRADED'
  | 'SUBSCRIPTION_DOWNGRADED'
  | 'CHECKOUT_FORM_AUTH';

// ============================================
// Webhook Handlers
// ============================================

/**
 * Verify Iyzico webhook signature
 */
function verifySignature(payload: string, signature: string): boolean {
  const secretKey = config.IYZICO_SECRET_KEY;
  if (!secretKey) {
    logger.warn('Iyzico secret key not configured');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(payload)
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Handle Iyzico webhook events
 */
export async function handleIyzicoWebhook(req: Request, res: Response) {
  try {
    const payload = req.body as IyzicoWebhookPayload;
    const signature = req.headers['x-iyzico-signature'] as string;

    // Verify signature if present
    if (signature && !verifySignature(JSON.stringify(payload), signature)) {
      logger.warn('Invalid Iyzico webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const eventType = payload.iyziEventType as IyzicoEventType;
    logger.info({ eventType, referenceCode: payload.iyziReferenceCode }, 'Iyzico webhook received');

    switch (eventType) {
      case 'CREDIT_PAYMENT_SUCCESS':
        await handlePaymentSuccess(payload);
        break;

      case 'CREDIT_PAYMENT_FAILURE':
        await handlePaymentFailure(payload);
        break;

      case 'REFUND_SUCCESS':
        await handleRefundSuccess(payload);
        break;

      case 'REFUND_FAILURE':
        await handleRefundFailure(payload);
        break;

      case 'SUBSCRIPTION_ORDER_SUCCESS':
        await handleSubscriptionCreated(payload);
        break;

      case 'SUBSCRIPTION_RENEWED':
        await handleSubscriptionRenewed(payload);
        break;

      case 'SUBSCRIPTION_CANCELLED':
        await handleSubscriptionCancelled(payload);
        break;

      case 'SUBSCRIPTION_UPGRADED':
      case 'SUBSCRIPTION_DOWNGRADED':
        await handleSubscriptionChanged(payload);
        break;

      default:
        logger.info({ eventType }, 'Unhandled Iyzico event type');
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error({ err: error }, 'Iyzico webhook processing failed');
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

/**
 * Handle 3D Secure callback
 */
export async function handle3DSecureCallback(req: Request, res: Response) {
  try {
    const callbackData = req.body as Iyzico3DSecureCallback;

    logger.info({ paymentId: callbackData.paymentId, status: callbackData.status }, '3D Secure callback received');

    // Find pending payment
    const payment = await prisma.payments.findFirst({
      where: {
        transactionId: callbackData.paymentId,
        status: 'PENDING'
      },
      include: { users: true, subscriptions: true }
    });

    if (!payment) {
      logger.warn({ paymentId: callbackData.paymentId }, 'Payment not found for 3D callback');
      return res.redirect(`${config.FRONTEND_URL}/payment/error?reason=not_found`);
    }

    if (callbackData.status === 'success' && callbackData.mdStatus === '1') {
      // Payment successful
      await prisma.payments.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          paidAt: new Date(),
          metadata: {
            ...(payment.metadata as object || {}),
            mdStatus: callbackData.mdStatus,
            threeDSecure: true
          }
        }
      });

      // If subscription payment, activate subscription
      if (payment.subscriptionId) {
        await prisma.subscriptions.update({
          where: { id: payment.subscriptionId },
          data: {
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 days
          }
        });

        // Update user tier
        const subscription = await prisma.subscriptions.findUnique({
          where: { id: payment.subscriptionId },
          include: { plan: true }
        });

        if (subscription) {
          await prisma.users.update({
            where: { id: payment.userId },
            data: {
              subscriptionTier: subscription.plan.tier,
              subscriptionExpiresAt: subscription.currentPeriodEnd
            }
          });
        }
      }

      // Emit success event
      eventEmitter.emit('payment.succeeded', {
        userId: payment.userId,
        subscriptionId: payment.subscriptionId || '',
        amount: Number(payment.amount),
        currency: payment.currency,
        provider: 'IYZICO',
        transactionId: payment.transactionId || undefined
      });

      return res.redirect(`${config.FRONTEND_URL}/payment/success?payment_id=${payment.id}`);
    } else {
      // Payment failed
      const failureMessage = get3DSecureFailureReason(callbackData.mdStatus);

      await prisma.payments.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          failureMessage,
          metadata: {
            ...(payment.metadata as object || {}),
            mdStatus: callbackData.mdStatus,
            threeDSecure: true
          }
        }
      });

      // Emit failure event
      eventEmitter.emit('payment.failed', {
        userId: payment.userId,
        subscriptionId: payment.subscriptionId || '',
        amount: Number(payment.amount),
        currency: payment.currency,
        provider: 'IYZICO',
        transactionId: payment.transactionId || undefined,
        reason: failureMessage
      });

      return res.redirect(`${config.FRONTEND_URL}/payment/error?reason=${encodeURIComponent(failureMessage)}`);
    }
  } catch (error) {
    logger.error({ err: error }, '3D Secure callback processing failed');
    res.redirect(`${config.FRONTEND_URL}/payment/error?reason=processing_error`);
  }
}

// ============================================
// Event Handlers
// ============================================

async function handlePaymentSuccess(payload: IyzicoWebhookPayload) {
  const payment = await prisma.payments.findFirst({
    where: { transactionId: payload.paymentId }
  });

  if (payment) {
    await prisma.payments.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        paidAt: new Date()
      }
    });

    eventEmitter.emit('payment.succeeded', {
      userId: payment.userId,
      subscriptionId: payment.subscriptionId || '',
      amount: Number(payment.amount),
      currency: payment.currency,
      provider: 'IYZICO',
      transactionId: payment.transactionId || undefined
    });

    logger.info({ paymentId: payment.id }, 'Iyzico payment marked as completed');
  }
}

async function handlePaymentFailure(payload: IyzicoWebhookPayload) {
  const payment = await prisma.payments.findFirst({
    where: { transactionId: payload.paymentId }
  });

  if (payment) {
    await prisma.payments.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        failureMessage: 'Payment failed via webhook'
      }
    });

    eventEmitter.emit('payment.failed', {
      userId: payment.userId,
      subscriptionId: payment.subscriptionId || '',
      amount: Number(payment.amount),
      currency: payment.currency,
      provider: 'IYZICO',
      transactionId: payment.transactionId || undefined,
      reason: 'Payment failed'
    });

    logger.info({ paymentId: payment.id }, 'Iyzico payment marked as failed');
  }
}

async function handleRefundSuccess(payload: IyzicoWebhookPayload) {
  const payment = await prisma.payments.findFirst({
    where: { transactionId: payload.paymentId }
  });

  if (payment) {
    await prisma.payments.update({
      where: { id: payment.id },
      data: { status: 'REFUNDED' }
    });

    eventEmitter.emit('payment.refunded', {
      userId: payment.userId,
      subscriptionId: payment.subscriptionId || '',
      amount: Number(payment.amount),
      currency: payment.currency,
      provider: 'IYZICO',
      transactionId: payment.transactionId || undefined
    });

    logger.info({ paymentId: payment.id }, 'Iyzico refund completed');
  }
}

async function handleRefundFailure(payload: IyzicoWebhookPayload) {
  logger.warn({ paymentId: payload.paymentId }, 'Iyzico refund failed');
  // Could notify admin or retry
}

async function handleSubscriptionCreated(payload: IyzicoWebhookPayload) {
  logger.info({ referenceCode: payload.iyziReferenceCode }, 'Iyzico subscription created');

  // Find subscription by reference code
  const subscription = await prisma.subscriptions.findFirst({
    where: {
      // TODO: Add iyzicoSubscriptionReferenceCode field to subscriptions schema
      // iyzicoSubscriptionReferenceCode: payload.iyziReferenceCode
      // For now, using googleOrderId as a workaround to store Iyzico reference
      googleOrderId: payload.iyziReferenceCode
    },
    include: { plan: true, users: true }
  });

  if (subscription) {
    await prisma.subscriptions.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: new Date()
      }
    });

    eventEmitter.emit('subscription.created', {
      subscriptionId: subscription.id,
      userId: subscription.userId,
      plan: subscription.plan.name,
      provider: 'IYZICO',
      status: 'ACTIVE',
      currentPeriodEnd: subscription.currentPeriodEnd || new Date()
    });
  }
}

async function handleSubscriptionRenewed(payload: IyzicoWebhookPayload) {
  logger.info({ referenceCode: payload.iyziReferenceCode }, 'Iyzico subscription renewed');

  const subscription = await prisma.subscriptions.findFirst({
    where: {
      // TODO: Add iyzicoSubscriptionReferenceCode field to subscriptions schema
      // iyzicoSubscriptionReferenceCode: payload.iyziReferenceCode
      // For now, using googleOrderId as a workaround to store Iyzico reference
      googleOrderId: payload.iyziReferenceCode
    },
    include: { plan: true }
  });

  if (subscription) {
    const newPeriodEnd = new Date();
    if (subscription.interval === 'MONTHLY') {
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
    } else {
      newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
    }

    await prisma.subscriptions.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: newPeriodEnd,
        lastVerifiedAt: new Date()
      }
    });

    // Update user expiration
    await prisma.users.update({
      where: { id: subscription.userId },
      data: { subscriptionExpiresAt: newPeriodEnd }
    });

    eventEmitter.emit('subscription.updated', {
      subscriptionId: subscription.id,
      userId: subscription.userId,
      plan: subscription.plan.name,
      status: 'ACTIVE',
      previousStatus: 'ACTIVE',
      provider: 'IYZICO',
      currentPeriodEnd: newPeriodEnd
    });
  }
}

async function handleSubscriptionCancelled(payload: IyzicoWebhookPayload) {
  logger.info({ referenceCode: payload.iyziReferenceCode }, 'Iyzico subscription cancelled');

  const subscription = await prisma.subscriptions.findFirst({
    where: {
      // TODO: Add iyzicoSubscriptionReferenceCode field to subscriptions schema
      // iyzicoSubscriptionReferenceCode: payload.iyziReferenceCode
      // For now, using googleOrderId as a workaround to store Iyzico reference
      googleOrderId: payload.iyziReferenceCode
    },
    include: { plan: true }
  });

  if (subscription) {
    await prisma.subscriptions.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: 'Cancelled via Iyzico'
      }
    });

    // Update user tier to FREE when subscription ends
    await prisma.users.update({
      where: { id: subscription.userId },
      data: {
        subscriptionTier: 'FREE',
        subscriptionExpiresAt: null
      }
    });

    eventEmitter.emit('subscription.cancelled', {
      subscriptionId: subscription.id,
      userId: subscription.userId,
      plan: subscription.plan.name,
      provider: 'IYZICO',
      cancelledAt: new Date(),
      effectiveEndDate: subscription.currentPeriodEnd || new Date()
    });
  }
}

async function handleSubscriptionChanged(payload: IyzicoWebhookPayload) {
  logger.info({ referenceCode: payload.iyziReferenceCode, eventType: payload.iyziEventType }, 'Iyzico subscription changed');
  // Handle upgrade/downgrade - would need to fetch new plan details from Iyzico
}

// ============================================
// Helpers
// ============================================

function get3DSecureFailureReason(mdStatus: string): string {
  const reasons: Record<string, string> = {
    '0': '3D Secure dogrulamasi basarisiz',
    '2': 'Kart sahibi veya bankasi sisteme kayitli degil',
    '3': 'Kartin bankasi sisteme kayitli degil',
    '4': 'Dogrulama denemesi, kart sahibi daha sonra sisteme kayit olmayi secti',
    '5': 'Dogrulama yapilamiyor',
    '6': '3D Secure hatasi',
    '7': 'Sistem hatasi',
    '8': 'Bilinmeyen kart tipi'
  };

  return reasons[mdStatus] || 'Bilinmeyen hata';
}
