import Stripe from 'stripe';
import { prisma } from '../utils/database';
import { getStripeClient, isStripeConfigured } from '../utils/stripe';
import { logger } from '../utils/logger';

/**
 * Create a new Stripe customer and save to user
 */
export async function createCustomer(
  userId: string,
  email: string,
  name?: string,
  metadata?: Record<string, string>
): Promise<Stripe.Customer> {
  if (!isStripeConfigured()) {
    throw new Error('Stripe is not configured');
  }

  const stripe = getStripeClient();

  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      userId,
      ...metadata,
    },
  });

  // Update user with Stripe customer ID
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  logger.info({ userId, customerId: customer.id }, 'Stripe customer created');

  return customer;
}

/**
 * Get Stripe customer by ID
 */
export async function getCustomer(stripeCustomerId: string): Promise<Stripe.Customer | null> {
  if (!isStripeConfigured()) {
    return null;
  }

  const stripe = getStripeClient();

  try {
    const customer = await stripe.customers.retrieve(stripeCustomerId);
    if (customer.deleted) {
      return null;
    }
    return customer as Stripe.Customer;
  } catch (error) {
    logger.error({ err: error, stripeCustomerId }, 'Failed to get Stripe customer');
    return null;
  }
}

/**
 * Update Stripe customer
 */
export async function updateCustomer(
  stripeCustomerId: string,
  updates: Stripe.CustomerUpdateParams
): Promise<Stripe.Customer | null> {
  if (!isStripeConfigured()) {
    return null;
  }

  const stripe = getStripeClient();

  try {
    const customer = await stripe.customers.update(stripeCustomerId, updates);
    logger.info({ stripeCustomerId }, 'Stripe customer updated');
    return customer;
  } catch (error) {
    logger.error({ err: error, stripeCustomerId }, 'Failed to update Stripe customer');
    return null;
  }
}

/**
 * Delete Stripe customer
 */
export async function deleteCustomer(stripeCustomerId: string): Promise<boolean> {
  if (!isStripeConfigured()) {
    return false;
  }

  const stripe = getStripeClient();

  try {
    await stripe.customers.del(stripeCustomerId);
    logger.info({ stripeCustomerId }, 'Stripe customer deleted');
    return true;
  } catch (error) {
    logger.error({ err: error, stripeCustomerId }, 'Failed to delete Stripe customer');
    return false;
  }
}

/**
 * Get or create Stripe customer for user
 */
export async function getOrCreateCustomer(userId: string): Promise<Stripe.Customer> {
  if (!isStripeConfigured()) {
    throw new Error('Stripe is not configured');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firstName: true, lastName: true, stripeCustomerId: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // If user already has a Stripe customer ID
  if (user.stripeCustomerId) {
    const customer = await getCustomer(user.stripeCustomerId);
    if (customer) {
      return customer;
    }
    // Customer was deleted in Stripe, create a new one
  }

  // Create new customer
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined;
  return createCustomer(userId, user.email, name);
}

/**
 * Attach payment method to customer
 */
export async function attachPaymentMethod(
  customerId: string,
  paymentMethodId: string
): Promise<Stripe.PaymentMethod | null> {
  if (!isStripeConfigured()) {
    return null;
  }

  const stripe = getStripeClient();

  try {
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
    logger.info({ customerId, paymentMethodId }, 'Payment method attached');
    return paymentMethod;
  } catch (error) {
    logger.error({ err: error, customerId, paymentMethodId }, 'Failed to attach payment method');
    return null;
  }
}

/**
 * Detach payment method from customer
 */
export async function detachPaymentMethod(paymentMethodId: string): Promise<boolean> {
  if (!isStripeConfigured()) {
    return false;
  }

  const stripe = getStripeClient();

  try {
    await stripe.paymentMethods.detach(paymentMethodId);
    logger.info({ paymentMethodId }, 'Payment method detached');
    return true;
  } catch (error) {
    logger.error({ err: error, paymentMethodId }, 'Failed to detach payment method');
    return false;
  }
}

/**
 * List payment methods for customer
 */
export async function listPaymentMethods(
  customerId: string,
  type: Stripe.PaymentMethodListParams.Type = 'card'
): Promise<Stripe.PaymentMethod[]> {
  if (!isStripeConfigured()) {
    return [];
  }

  const stripe = getStripeClient();

  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type,
    });
    return paymentMethods.data;
  } catch (error) {
    logger.error({ err: error, customerId }, 'Failed to list payment methods');
    return [];
  }
}

/**
 * Set default payment method for customer
 */
export async function setDefaultPaymentMethod(
  customerId: string,
  paymentMethodId: string
): Promise<Stripe.Customer | null> {
  if (!isStripeConfigured()) {
    return null;
  }

  const stripe = getStripeClient();

  try {
    const customer = await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
    logger.info({ customerId, paymentMethodId }, 'Default payment method set');
    return customer;
  } catch (error) {
    logger.error({ err: error, customerId, paymentMethodId }, 'Failed to set default payment method');
    return null;
  }
}

/**
 * Create setup intent for adding payment method
 */
export async function createSetupIntent(customerId: string): Promise<Stripe.SetupIntent | null> {
  if (!isStripeConfigured()) {
    return null;
  }

  const stripe = getStripeClient();

  try {
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });
    return setupIntent;
  } catch (error) {
    logger.error({ err: error, customerId }, 'Failed to create setup intent');
    return null;
  }
}
