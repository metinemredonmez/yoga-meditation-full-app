import { Request, Response } from 'express';
import Stripe from 'stripe';
import { SubscriptionStatus } from '@prisma/client';
import { prisma } from '../utils/database';
import { verifyWebhookSignature, isStripeConfigured } from '../utils/stripe';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { eventEmitter } from '../utils/eventEmitter';
import { syncSubscriptionFromStripe } from '../services/subscriptionService';
import { processStripeRefundWebhook } from '../services/refundService';
import { processStripeInvoiceWebhook } from '../services/invoiceService';
import { getPlanById } from '../services/subscriptionPlanService';

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  if (!isStripeConfigured()) {
    logger.warn('Stripe webhook received but Stripe is not configured');
    return res.status(400).json({ error: 'Stripe not configured' });
  }

  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    logger.warn('No Stripe signature in webhook request');
    return res.status(400).json({ error: 'No signature' });
  }

  let event: Stripe.Event;

  try {
    event = verifyWebhookSignature(req.body, signature);
  } catch (err: any) {
    logger.error({ err }, 'Stripe webhook signature verification failed');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  logger.info({ eventType: event.type, eventId: event.id }, 'Stripe webhook received');

  try {
    await processStripeEvent(event);
    res.json({ received: true });
  } catch (error) {
    logger.error({ err: error, eventType: event.type }, 'Error processing Stripe webhook');
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

/**
 * Process Stripe event
 */
async function processStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    // Checkout events
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case 'checkout.session.expired':
      await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
      break;

    // Customer events
    case 'customer.created':
      await handleCustomerCreated(event.data.object as Stripe.Customer);
      break;

    case 'customer.updated':
      await handleCustomerUpdated(event.data.object as Stripe.Customer);
      break;

    case 'customer.deleted':
      await handleCustomerDeleted(event.data.object as Stripe.Customer);
      break;

    // Subscription events
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.trial_will_end':
      await handleTrialWillEnd(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.paused':
      await handleSubscriptionPaused(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.resumed':
      await handleSubscriptionResumed(event.data.object as Stripe.Subscription);
      break;

    // Payment intent events
    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
      break;

    // Invoice events
    case 'invoice.created':
    case 'invoice.finalized':
    case 'invoice.paid':
    case 'invoice.payment_failed':
    case 'invoice.upcoming':
      await handleInvoiceEvent(event.type, event.data.object as Stripe.Invoice);
      break;

    // Refund events
    case 'charge.refunded':
      await handleChargeRefunded(event.data.object as Stripe.Charge);
      break;

    // Dispute events
    case 'charge.dispute.created':
      await handleDisputeCreated(event.data.object as Stripe.Dispute);
      break;

    case 'charge.dispute.closed':
      await handleDisputeClosed(event.data.object as Stripe.Dispute);
      break;

    default:
      logger.info({ eventType: event.type }, 'Unhandled Stripe event type');
  }
}

// ==================== Checkout Handlers ====================

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  logger.info({ sessionId: session.id }, 'Checkout session completed');

  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId;
  const interval = session.metadata?.interval as 'monthly' | 'yearly';

  if (!userId || !planId) {
    logger.warn({ sessionId: session.id }, 'Missing metadata in checkout session');
    return;
  }

  // The subscription will be created via subscription.created webhook
  // Here we just log the successful checkout
  logger.info({ userId, planId, interval }, 'Checkout completed, awaiting subscription creation');
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  logger.info({ sessionId: session.id }, 'Checkout session expired');
}

// ==================== Customer Handlers ====================

async function handleCustomerCreated(customer: Stripe.Customer) {
  logger.info({ customerId: customer.id }, 'Stripe customer created');
}

async function handleCustomerUpdated(customer: Stripe.Customer) {
  logger.info({ customerId: customer.id }, 'Stripe customer updated');
}

async function handleCustomerDeleted(customer: Stripe.Customer) {
  logger.info({ customerId: customer.id }, 'Stripe customer deleted');

  // Clear stripeCustomerId from user
  await prisma.users.updateMany({
    where: { stripeCustomerId: customer.id },
    data: { stripeCustomerId: null },
  });
}

// ==================== Subscription Handlers ====================

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  logger.info({ subscriptionId: subscription.id }, 'Stripe subscription created');

  const userId = subscription.metadata?.userId;
  const planId = subscription.metadata?.planId;
  const interval = subscription.metadata?.interval as 'monthly' | 'yearly';

  if (!userId || !planId) {
    // Try to find user by customer ID
    const user = await prisma.users.findFirst({
      where: { stripeCustomerId: subscription.customer as string },
    });

    if (!user) {
      logger.warn({ subscriptionId: subscription.id }, 'Cannot find user for subscription');
      return;
    }

    // We don't have planId, try to match by price
    logger.warn({ subscriptionId: subscription.id }, 'Missing planId in subscription metadata');
    return;
  }

  const plan = await getPlanById(planId);
  if (!plan) {
    logger.warn({ planId }, 'Plan not found for subscription');
    return;
  }

  // Create local subscription record
  const localSubscription = await prisma.subscriptions.create({
    data: {
      userId,
      planId,
      provider: 'STRIPE',
      status: mapStripeSubscriptionStatus(subscription.status),
      interval: interval === 'yearly' ? 'YEARLY' : 'MONTHLY',
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    },
  });

  // Update user tier
  await prisma.users.update({
    where: { id: userId },
    data: {
      subscriptionTier: plan.tier,
      subscriptionExpiresAt: new Date(subscription.current_period_end * 1000),
    },
  });

  // Emit event
  eventEmitter.emit('subscription.created', {
    subscriptionId: localSubscription.id,
    userId,
    plan: plan.name,
    provider: 'STRIPE',
    status: localSubscription.status,
    currentPeriodEnd: localSubscription.currentPeriodEnd || new Date(),
  });

  logger.info({ localSubscriptionId: localSubscription.id, userId }, 'Local subscription created');
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  logger.info({ subscriptionId: subscription.id }, 'Stripe subscription updated');

  await syncSubscriptionFromStripe(subscription.id);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  logger.info({ subscriptionId: subscription.id }, 'Stripe subscription deleted');

  const localSubscription = await prisma.subscriptions.findFirst({
    where: { stripeSubscriptionId: subscription.id },
    include: { plan: true },
  });

  if (!localSubscription) {
    return;
  }

  await prisma.subscriptions.update({
    where: { id: localSubscription.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    },
  });

  // Update user tier
  await prisma.users.update({
    where: { id: localSubscription.userId },
    data: {
      subscriptionTier: 'FREE',
      subscriptionExpiresAt: null,
    },
  });

  // Emit event
  eventEmitter.emit('subscription.cancelled', {
    subscriptionId: localSubscription.id,
    userId: localSubscription.userId,
    plan: localSubscription.plan.name,
    provider: 'STRIPE',
    cancelledAt: new Date(),
    effectiveEndDate: new Date(),
  });
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  logger.info({ subscriptionId: subscription.id }, 'Stripe subscription trial will end');

  const localSubscription = await prisma.subscriptions.findFirst({
    where: { stripeSubscriptionId: subscription.id },
    include: { users: true },
  });

  if (localSubscription?.users) {
    // Send notification to user about trial ending
    // This would integrate with your notification service
    logger.info(
      { userId: localSubscription.userId, trialEnd: subscription.trial_end },
      'User trial ending soon'
    );
  }
}

async function handleSubscriptionPaused(subscription: Stripe.Subscription) {
  logger.info({ subscriptionId: subscription.id }, 'Stripe subscription paused');

  await prisma.subscriptions.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: { status: 'PAUSED' },
  });
}

async function handleSubscriptionResumed(subscription: Stripe.Subscription) {
  logger.info({ subscriptionId: subscription.id }, 'Stripe subscription resumed');

  await syncSubscriptionFromStripe(subscription.id);
}

// ==================== Payment Handlers ====================

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  logger.info({ paymentIntentId: paymentIntent.id }, 'Payment succeeded');

  const userId = paymentIntent.metadata?.userId;

  if (!userId) {
    // Try to find by customer
    const user = await prisma.users.findFirst({
      where: { stripeCustomerId: paymentIntent.customer as string },
    });

    if (!user) {
      logger.warn({ paymentIntentId: paymentIntent.id }, 'Cannot find user for payment');
      return;
    }
  }

  // Payment record is usually created via invoice.paid
  // This is a backup handler
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  logger.info({ paymentIntentId: paymentIntent.id }, 'Payment failed');

  const user = await prisma.users.findFirst({
    where: { stripeCustomerId: paymentIntent.customer as string },
  });

  if (user) {
    eventEmitter.emit('payment.failed', {
      userId: user.id,
      subscriptionId: '',
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      provider: 'STRIPE',
      transactionId: paymentIntent.id,
      reason: paymentIntent.last_payment_error?.message || 'Payment failed',
    });
  }
}

// ==================== Invoice Handlers ====================

async function handleInvoiceEvent(eventType: string, invoice: Stripe.Invoice) {
  logger.info({ invoiceId: invoice.id, eventType }, 'Invoice event');

  await processStripeInvoiceWebhook({
    id: invoice.id,
    customer: invoice.customer as string,
    subscriptions: invoice.subscription as string | null,
    status: invoice.status || 'draft',
    amount_due: invoice.amount_due,
    amount_paid: invoice.amount_paid,
    currency: invoice.currency,
    invoice_pdf: invoice.invoice_pdf ?? null,
    paid: invoice.paid || false,
    due_date: invoice.due_date,
  });

  // If invoice paid, create payment record
  if (eventType === 'invoice.paid' && invoice.paid) {
    const user = await prisma.users.findFirst({
      where: { stripeCustomerId: invoice.customer as string },
    });

    if (user) {
      const localSubscription = await prisma.subscriptions.findFirst({
        where: { stripeSubscriptionId: invoice.subscription as string },
      });

      // Create payment record
      const existingPayment = await prisma.payments.findFirst({
        where: { stripePaymentIntentId: invoice.payment_intent as string },
      });

      if (!existingPayment && invoice.payment_intent) {
        await prisma.payments.create({
          data: {
            userId: user.id,
            subscriptionId: localSubscription?.id,
            provider: 'STRIPE',
            transactionId: `invoice_${invoice.id}`,
            stripePaymentIntentId: invoice.payment_intent as string,
            stripeInvoiceId: invoice.id,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency.toUpperCase(),
            status: 'COMPLETED',
            paymentMethod: 'CARD',
            environment: 'PRODUCTION',
            paidAt: new Date(),
          },
        });
      }

      eventEmitter.emit('payment.succeeded', {
        userId: user.id,
        subscriptionId: localSubscription?.id || '',
        amount: invoice.amount_paid / 100,
        currency: invoice.currency.toUpperCase(),
        provider: 'STRIPE',
        transactionId: invoice.payment_intent as string,
      });
    }
  }
}

// ==================== Refund & Dispute Handlers ====================

async function handleChargeRefunded(charge: Stripe.Charge) {
  logger.info({ chargeId: charge.id }, 'Charge refunded');

  if (charge.refunds?.data) {
    for (const refund of charge.refunds.data) {
      await processStripeRefundWebhook({
        id: refund.id,
        payment_intent: charge.payment_intent as string,
        amount: refund.amount,
        status: refund.status || 'pending',
        reason: refund.reason,
      });
    }
  }
}

async function handleDisputeCreated(dispute: Stripe.Dispute) {
  logger.warn(
    { disputeId: dispute.id, chargeId: dispute.charge, reason: dispute.reason },
    'Dispute created'
  );

  // Update payment status
  const payment = await prisma.payments.findFirst({
    where: {
      OR: [
        { stripePaymentIntentId: dispute.payment_intent as string },
        { transactionId: dispute.charge as string },
      ],
    },
  });

  if (payment) {
    await prisma.payments.update({
      where: { id: payment.id },
      data: { status: 'DISPUTED' },
    });
  }
}

async function handleDisputeClosed(dispute: Stripe.Dispute) {
  logger.info(
    { disputeId: dispute.id, status: dispute.status },
    'Dispute closed'
  );
}

// ==================== Helper Functions ====================

function mapStripeSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case 'active':
      return 'ACTIVE';
    case 'past_due':
      return 'PAST_DUE';
    case 'canceled':
      return 'CANCELLED';
    case 'incomplete':
      return 'INCOMPLETE';
    case 'incomplete_expired':
      return 'EXPIRED';
    case 'trialing':
      return 'TRIALING';
    case 'unpaid':
      return 'PAST_DUE';
    case 'paused':
      return 'PAUSED';
    default:
      return 'ACTIVE';
  }
}
