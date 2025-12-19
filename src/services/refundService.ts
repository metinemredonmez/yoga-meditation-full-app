import { RefundStatus, RefundInitiator, PaymentProvider, Prisma } from '@prisma/client';
import { prisma } from '../utils/database';
import { getStripeClient, isStripeConfigured } from '../utils/stripe';
import { logger } from '../utils/logger';
import { eventEmitter } from '../utils/eventEmitter';

export interface CreateRefundInput {
  paymentId: string;
  amount?: number; // If not provided, full refund
  reason?: string;
  initiatedBy?: RefundInitiator;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  providerRefundId?: string;
  amount?: number;
  error?: string;
}

/**
 * Create a refund for a payment
 */
export async function createRefund(
  input: CreateRefundInput,
  adminUserId?: string
): Promise<RefundResult> {
  const payment = await prisma.payments.findUnique({
    where: { id: input.paymentId },
    include: { subscriptions: true, users: true },
  });

  if (!payment) {
    return { success: false, error: 'Payment not found' };
  }

  if (payment.status !== 'COMPLETED') {
    return { success: false, error: 'Can only refund completed payments' };
  }

  // Calculate refundable amount
  const alreadyRefunded = Number(payment.refundedAmount);
  const paymentAmount = Number(payment.amount);
  const maxRefundable = paymentAmount - alreadyRefunded;

  if (maxRefundable <= 0) {
    return { success: false, error: 'Payment has already been fully refunded' };
  }

  const refundAmount = input.amount
    ? Math.min(input.amount, maxRefundable)
    : maxRefundable;

  // Process refund based on provider
  let providerRefundId: string;

  switch (payment.provider) {
    case 'STRIPE':
      const stripeResult = await processStripeRefund(payment, refundAmount, input.reason);
      if (!stripeResult.success) {
        return stripeResult;
      }
      providerRefundId = stripeResult.providerRefundId!;
      break;

    case 'APPLE':
      // Apple refunds are handled through their system
      // We can only record them when we receive a notification
      providerRefundId = `apple_refund_${Date.now()}`;
      logger.info({ paymentId: payment.id }, 'Apple refund requested - must be processed through Apple');
      break;

    case 'GOOGLE':
      // Google Play refunds through Play Console or API
      providerRefundId = `google_refund_${Date.now()}`;
      logger.info({ paymentId: payment.id }, 'Google refund requested - must be processed through Google Play Console');
      break;

    default:
      providerRefundId = `manual_refund_${Date.now()}`;
  }

  // Create refund record
  const refund = await prisma.refunds.create({
    data: {
      paymentId: payment.id,
      provider: payment.provider,
      providerRefundId,
      amount: new Prisma.Decimal(refundAmount),
      reason: input.reason,
      status: payment.provider === 'STRIPE' ? 'SUCCEEDED' : 'PENDING',
      initiatedBy: input.initiatedBy || (adminUserId ? 'ADMIN' : 'USER'),
    },
  });

  // Update payment's refunded amount
  const isFullRefund = refundAmount >= maxRefundable;
  await prisma.payments.update({
    where: { id: payment.id },
    data: {
      refundedAmount: new Prisma.Decimal(alreadyRefunded + refundAmount),
      status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
    },
  });

  // Emit event
  eventEmitter.emit('payment.refunded', {
    userId: payment.userId,
    subscriptionId: payment.subscriptionId || '',
    amount: refundAmount,
    currency: payment.currency,
    provider: payment.provider,
    transactionId: payment.transactionId,
  });

  logger.info(
    { refundId: refund.id, paymentId: payment.id, amount: refundAmount },
    'Refund created'
  );

  return {
    success: true,
    refundId: refund.id,
    providerRefundId,
    amount: refundAmount,
  };
}

/**
 * Process Stripe refund
 */
async function processStripeRefund(
  payment: { stripePaymentIntentId: string | null; transactionId: string },
  amount: number,
  reason?: string
): Promise<RefundResult> {
  if (!isStripeConfigured()) {
    return { success: false, error: 'Stripe is not configured' };
  }

  const stripe = getStripeClient();
  const paymentIntentId = payment.stripePaymentIntentId || payment.transactionId;

  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: Math.round(amount * 100), // Convert to cents
      reason: reason as 'duplicate' | 'fraudulent' | 'requested_by_customer' | undefined,
    });

    return {
      success: true,
      providerRefundId: refund.id,
      amount: refund.amount / 100,
    };
  } catch (error: any) {
    logger.error({ err: error, paymentIntentId }, 'Stripe refund failed');
    return {
      success: false,
      error: error.message || 'Stripe refund failed',
    };
  }
}

/**
 * Get refund by ID
 */
export async function getRefund(refundId: string) {
  return prisma.refunds.findUnique({
    where: { id: refundId },
    include: { payments: true },
  });
}

/**
 * Get refunds for a payment
 */
export async function getPaymentRefunds(paymentId: string) {
  return prisma.refunds.findMany({
    where: { paymentId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get all refunds with filters
 */
export async function getRefunds(filters: {
  status?: RefundStatus;
  provider?: PaymentProvider;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const where: Prisma.refundsWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.provider) {
    where.provider = filters.provider;
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const [refunds, total] = await Promise.all([
    prisma.refunds.findMany({
      where,
      include: {
        payments: {
          include: { users: { select: { id: true, email: true, firstName: true, lastName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.refunds.count({ where }),
  ]);

  return {
    refunds,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Calculate refundable amount for a payment
 */
export async function calculateRefundableAmount(paymentId: string): Promise<number> {
  const payment = await prisma.payments.findUnique({
    where: { id: paymentId },
  });

  if (!payment || payment.status !== 'COMPLETED') {
    return 0;
  }

  const paymentAmount = Number(payment.amount);
  const refundedAmount = Number(payment.refundedAmount);

  return Math.max(0, paymentAmount - refundedAmount);
}

/**
 * Process Stripe refund webhook
 */
export async function processStripeRefundWebhook(stripeRefund: {
  id: string;
  payment_intent: string;
  amount: number;
  status: string;
  reason: string | null;
}) {
  // Find the payment by Stripe payment intent ID
  const payment = await prisma.payments.findFirst({
    where: {
      OR: [
        { stripePaymentIntentId: stripeRefund.payment_intent },
        { transactionId: stripeRefund.payment_intent },
      ],
    },
  });

  if (!payment) {
    logger.warn({ paymentIntentId: stripeRefund.payment_intent }, 'Payment not found for Stripe refund webhook');
    return;
  }

  // Check if refund already exists
  const existingRefund = await prisma.refunds.findFirst({
    where: { providerRefundId: stripeRefund.id },
  });

  if (existingRefund) {
    // Update status if changed
    if (existingRefund.status !== mapStripeRefundStatus(stripeRefund.status)) {
      await prisma.refunds.update({
        where: { id: existingRefund.id },
        data: { status: mapStripeRefundStatus(stripeRefund.status) },
      });
    }
    return;
  }

  const refundAmount = stripeRefund.amount / 100;

  // Create refund record
  await prisma.refunds.create({
    data: {
      paymentId: payment.id,
      provider: 'STRIPE',
      providerRefundId: stripeRefund.id,
      amount: new Prisma.Decimal(refundAmount),
      reason: stripeRefund.reason,
      status: mapStripeRefundStatus(stripeRefund.status),
      initiatedBy: 'PROVIDER',
    },
  });

  // Update payment's refunded amount
  const currentRefunded = Number(payment.refundedAmount);
  const newRefundedAmount = currentRefunded + refundAmount;
  const isFullRefund = newRefundedAmount >= Number(payment.amount);

  await prisma.payments.update({
    where: { id: payment.id },
    data: {
      refundedAmount: new Prisma.Decimal(newRefundedAmount),
      status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
    },
  });

  // Emit event
  eventEmitter.emit('payment.refunded', {
    userId: payment.userId,
    subscriptionId: payment.subscriptionId || '',
    amount: refundAmount,
    currency: payment.currency,
    provider: 'STRIPE',
    transactionId: payment.transactionId,
  });

  logger.info(
    { paymentId: payment.id, stripeRefundId: stripeRefund.id, amount: refundAmount },
    'Stripe refund webhook processed'
  );
}

function mapStripeRefundStatus(stripeStatus: string): RefundStatus {
  switch (stripeStatus) {
    case 'succeeded':
      return 'SUCCEEDED';
    case 'pending':
      return 'PENDING';
    case 'failed':
      return 'FAILED';
    case 'canceled':
      return 'CANCELLED';
    default:
      return 'PENDING';
  }
}
