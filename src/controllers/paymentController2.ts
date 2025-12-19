import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/database';
import { createRefund, getPaymentRefunds, calculateRefundableAmount } from '../services/refundService';
import {
  getOrCreateCustomer,
  listPaymentMethods,
  attachPaymentMethod,
  detachPaymentMethod,
  setDefaultPaymentMethod,
  createSetupIntent,
} from '../services/stripeCustomerService';
import { logger } from '../utils/logger';

// ==================== Payment History ====================

/**
 * Get user's payment history
 */
export async function getPaymentHistoryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      prisma.payments.findMany({
        where: { userId },
        include: {
          subscriptions: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payments.count({ where: { userId } }),
    ]);

    res.json({
      success: true,
      data: payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single payment by ID
 */
export async function getPaymentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const paymentId = req.params.paymentId;

    if (!paymentId) {
      return res.status(400).json({ success: false, error: 'Payment ID required' });
    }

    const payment = await prisma.payments.findFirst({
      where: {
        id: paymentId,
        userId,
      },
      include: {
        subscriptions: true,
        refunds: true,
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
    }

    return res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
}

// ==================== Payment Methods ====================

/**
 * Get user's payment methods
 */
export async function getPaymentMethodsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user?.stripeCustomerId) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const paymentMethods = await listPaymentMethods(user.stripeCustomerId);

    return res.json({
      success: true,
      data: paymentMethods.map((pm) => ({
        id: pm.id,
        type: pm.type,
        card: pm.card
          ? {
              brand: pm.card.brand,
              last4: pm.card.last4,
              expMonth: pm.card.exp_month,
              expYear: pm.card.exp_year,
            }
          : null,
        isDefault: pm.metadata?.default === 'true',
      })),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Add a new payment method
 */
export async function addPaymentMethodHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { paymentMethodId } = req.body;

    if (!paymentMethodId) {
      return res.status(400).json({
        success: false,
        error: 'Payment method ID is required',
      });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Get or create Stripe customer
    const customer = await getOrCreateCustomer(userId);

    // Attach payment method to customer
    const paymentMethod = await attachPaymentMethod(customer.id, paymentMethodId);

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        error: 'Failed to attach payment method',
      });
    }

    logger.info({ userId, paymentMethodId }, 'Payment method added');

    return res.json({
      success: true,
      data: {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: paymentMethod.card
          ? {
              brand: paymentMethod.card.brand,
              last4: paymentMethod.card.last4,
              expMonth: paymentMethod.card.exp_month,
              expYear: paymentMethod.card.exp_year,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Remove a payment method
 */
export async function removePaymentMethodHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const paymentMethodId = req.params.paymentMethodId;

    if (!paymentMethodId) {
      return res.status(400).json({ success: false, error: 'Payment method ID required' });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user?.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        error: 'No payment methods found',
      });
    }

    await detachPaymentMethod(paymentMethodId);

    logger.info({ userId, paymentMethodId }, 'Payment method removed');

    return res.json({
      success: true,
      message: 'Payment method removed successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Set default payment method
 */
export async function setDefaultPaymentMethodHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { paymentMethodId } = req.body;

    if (!paymentMethodId) {
      return res.status(400).json({
        success: false,
        error: 'Payment method ID is required',
      });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user?.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        error: 'No Stripe customer found',
      });
    }

    await setDefaultPaymentMethod(user.stripeCustomerId, paymentMethodId);

    logger.info({ userId, paymentMethodId }, 'Default payment method set');

    return res.json({
      success: true,
      message: 'Default payment method updated',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create setup intent for adding payment method
 */
export async function createSetupIntentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Get or create Stripe customer
    const customer = await getOrCreateCustomer(userId);

    // Create setup intent
    const setupIntent = await createSetupIntent(customer.id);

    if (!setupIntent) {
      return res.status(400).json({
        success: false,
        error: 'Failed to create setup intent',
      });
    }

    return res.json({
      success: true,
      data: {
        clientSecret: setupIntent.client_secret,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ==================== Refunds ====================

/**
 * Request a refund for a payment
 */
export async function requestRefundHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { paymentId, reason } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: 'Payment ID is required',
      });
    }

    // Verify the payment belongs to the user
    const payment = await prisma.payments.findFirst({
      where: {
        id: paymentId,
        userId,
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
    }

    // Calculate refundable amount
    const refundableAmount = await calculateRefundableAmount(paymentId);
    if (refundableAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'This payment is not eligible for refund',
      });
    }

    // Create refund request
    const result = await createRefund({
      paymentId,
      reason,
      initiatedBy: 'USER',
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    logger.info({ userId, paymentId, refundId: result.refundId }, 'Refund requested');

    return res.json({
      success: true,
      data: {
        refundId: result.refundId,
        amount: result.amount,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get refunds for a payment
 */
export async function getPaymentRefundsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const paymentId = req.params.paymentId;

    if (!paymentId) {
      return res.status(400).json({ success: false, error: 'Payment ID required' });
    }

    // Verify the payment belongs to the user
    const payment = await prisma.payments.findFirst({
      where: {
        id: paymentId,
        userId,
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
    }

    const refunds = await getPaymentRefunds(paymentId);

    return res.json({
      success: true,
      data: refunds,
    });
  } catch (error) {
    next(error);
  }
}

// ==================== Admin Endpoints ====================

/**
 * Get all payments (admin)
 */
export async function getAllPaymentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string | undefined;
    const provider = req.query.provider as string | undefined;

    const where: any = {};
    if (status) where.status = status;
    if (provider) where.provider = provider;

    const [payments, total] = await Promise.all([
      prisma.payments.findMany({
        where,
        include: {
          users: { select: { id: true, email: true, firstName: true, lastName: true } },
          subscriptions: true,
          refunds: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payments.count({ where }),
    ]);

    res.json({
      success: true,
      data: payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Process refund (admin)
 */
export async function processRefundHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const adminUserId = req.user!.userId;
    const { paymentId, amount, reason } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: 'Payment ID is required',
      });
    }

    const result = await createRefund(
      {
        paymentId,
        amount,
        reason,
        initiatedBy: 'ADMIN',
      },
      adminUserId
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    logger.info({ adminUserId, paymentId, refundId: result.refundId, amount: result.amount }, 'Refund processed by admin');

    return res.json({
      success: true,
      data: {
        refundId: result.refundId,
        amount: result.amount,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get payment statistics (admin)
 */
export async function getPaymentStatsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [
      totalPayments,
      completedPayments,
      refundedPayments,
      totalRevenue,
      paymentsByProvider,
    ] = await Promise.all([
      prisma.payments.count({ where }),
      prisma.payments.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.payments.count({ where: { ...where, status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] } } }),
      prisma.payments.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.payments.groupBy({
        by: ['provider'],
        where: { ...where, status: 'COMPLETED' },
        _count: true,
        _sum: { amount: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalPayments,
        completedPayments,
        refundedPayments,
        totalRevenue: Number(totalRevenue._sum.amount) || 0,
        byProvider: paymentsByProvider.map((p) => ({
          provider: p.provider,
          count: p._count,
          amount: Number(p._sum.amount) || 0,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}
