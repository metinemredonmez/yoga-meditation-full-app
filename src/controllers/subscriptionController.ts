import { Request, Response, NextFunction } from 'express';
import {
  getUserSubscription,
  getSubscriptionById,
  getSubscriptionHistory,
  getSubscriptionStatus,
  hasActiveSubscription,
  getSubscriptionTier,
  createCheckoutSession,
  cancelSubscription,
  resumeSubscription,
  changePlan,
  grantSubscription,
  extendSubscription,
} from '../services/subscriptionService';
import { verifyApplePurchase, restorePurchases as restoreApplePurchases } from '../services/appleIAPService';
import { verifyGooglePurchase, restoreGooglePurchases } from '../services/googlePlayService';
import { logger } from '../utils/logger';

// ==================== User Subscription Endpoints ====================

/**
 * Get current user's subscription
 */
export async function getCurrentSubscriptionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const subscription = await getUserSubscription(userId);

    res.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user's subscription status
 */
export async function getSubscriptionStatusHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const status = await getSubscriptionStatus(userId);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user's subscription history
 */
export async function getSubscriptionHistoryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const subscriptions = await getSubscriptionHistory(userId, page);

    res.json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Check if user has active subscription
 */
export async function checkActiveSubscriptionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const isActive = await hasActiveSubscription(userId);
    const tier = await getSubscriptionTier(userId);

    res.json({
      success: true,
      data: {
        hasActiveSubscription: isActive,
        tier,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ==================== Stripe Checkout ====================

/**
 * Create Stripe checkout session
 */
export async function createCheckoutHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { planId, interval } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        error: 'Plan ID is required',
      });
    }

    const session = await createCheckoutSession(userId, { planId, interval: interval || 'monthly' });

    logger.info({ userId, planId, sessionId: session.sessionId }, 'Checkout session created');

    return res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        url: session.url,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ==================== Apple IAP ====================

/**
 * Verify Apple purchase
 */
export async function verifyApplePurchaseHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { receiptData, productId } = req.body;

    if (!receiptData || !productId) {
      return res.status(400).json({
        success: false,
        error: 'Receipt data and product ID are required',
      });
    }

    const result = await verifyApplePurchase(userId, { receiptData, productId });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    logger.info({ userId, productId, subscriptionId: result.subscriptionId }, 'Apple purchase verified');

    res.json({
      success: true,
      data: {
        subscriptionId: result.subscriptionId,
        transactionId: result.transactionId,
        expiresAt: result.expiresAt,
        isTrialPeriod: result.isTrialPeriod,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Restore Apple purchases
 */
export async function restoreApplePurchasesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { receiptData } = req.body;

    if (!receiptData) {
      return res.status(400).json({
        success: false,
        error: 'Receipt data is required',
      });
    }

    const result = await restoreApplePurchases(userId, receiptData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    logger.info({ userId, subscriptionId: result.subscriptionId }, 'Apple purchases restored');

    res.json({
      success: true,
      data: {
        subscriptionId: result.subscriptionId,
        expiresAt: result.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ==================== Google Play ====================

/**
 * Verify Google Play purchase
 */
export async function verifyGooglePurchaseHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { purchaseToken, productId, isSubscription } = req.body;

    if (!purchaseToken || !productId) {
      return res.status(400).json({
        success: false,
        error: 'Purchase token and product ID are required',
      });
    }

    const result = await verifyGooglePurchase(userId, {
      purchaseToken,
      productId,
      isSubscription: isSubscription !== false,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    logger.info({ userId, productId, subscriptionId: result.subscriptionId }, 'Google purchase verified');

    res.json({
      success: true,
      data: {
        subscriptionId: result.subscriptionId,
        expiresAt: result.expiresAt,
        needsAcknowledgement: result.needsAcknowledgement,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Restore Google Play purchases
 */
export async function restoreGooglePurchasesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { purchaseToken, subscriptionId } = req.body;

    if (!purchaseToken || !subscriptionId) {
      return res.status(400).json({
        success: false,
        error: 'Purchase token and subscription ID are required',
      });
    }

    const result = await restoreGooglePurchases(userId, purchaseToken, subscriptionId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    logger.info({ userId, subscriptionId: result.subscriptionId }, 'Google purchases restored');

    res.json({
      success: true,
      data: {
        subscriptionId: result.subscriptionId,
        expiresAt: result.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ==================== Subscription Management ====================

/**
 * Cancel subscription
 */
export async function cancelSubscriptionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { subscriptionId, reason, immediate } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        error: 'Subscription ID is required',
      });
    }

    // Verify the subscription belongs to the user
    const subscription = await getSubscriptionById(subscriptionId);
    if (!subscription || subscription.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found',
      });
    }

    const result = await cancelSubscription(userId, reason, immediate);

    if (!result) {
      return res.status(400).json({
        success: false,
        error: 'Failed to cancel subscription',
      });
    }

    logger.info({ userId, subscriptionId }, 'Subscription cancelled');

    res.json({
      success: true,
      message: immediate
        ? 'Subscription cancelled immediately'
        : 'Subscription will be cancelled at the end of the billing period',
      data: {
        effectiveEndDate: result.currentPeriodEnd,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Resume cancelled subscription
 */
export async function resumeSubscriptionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        error: 'Subscription ID is required',
      });
    }

    // Verify the subscription belongs to the user
    const subscription = await getSubscriptionById(subscriptionId);
    if (!subscription || subscription.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found',
      });
    }

    const result = await resumeSubscription(userId);

    if (!result) {
      return res.status(400).json({
        success: false,
        error: 'Failed to resume subscription',
      });
    }

    logger.info({ userId, subscriptionId }, 'Subscription resumed');

    res.json({
      success: true,
      message: 'Subscription resumed successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Change subscription plan
 */
export async function changePlanHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { subscriptionId, newPlanId, immediate } = req.body;

    if (!subscriptionId || !newPlanId) {
      return res.status(400).json({
        success: false,
        error: 'Subscription ID and new plan ID are required',
      });
    }

    // Verify the subscription belongs to the user
    const subscription = await getSubscriptionById(subscriptionId);
    if (!subscription || subscription.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found',
      });
    }

    const result = await changePlan(userId, newPlanId, immediate ? 'monthly' : 'yearly');

    if (!result) {
      return res.status(400).json({
        success: false,
        error: 'Failed to change plan',
      });
    }

    logger.info({ userId, subscriptionId, newPlanId }, 'Subscription plan changed');

    res.json({
      success: true,
      message: 'Plan changed successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// ==================== Admin Endpoints ====================

/**
 * Grant subscription to user (admin)
 */
export async function grantSubscriptionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const adminUserId = req.user!.userId;
    const { userId, planId, durationDays, reason } = req.body;

    if (!userId || !planId || !durationDays) {
      return res.status(400).json({
        success: false,
        error: 'User ID, plan ID, and duration days are required',
      });
    }

    const subscription = await grantSubscription(userId, planId, durationDays, adminUserId, reason || '');

    logger.info(
      { adminUserId, userId, planId, durationDays, subscriptionId: subscription.id },
      'Subscription granted by admin'
    );

    res.status(201).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Extend subscription (admin)
 */
export async function extendSubscriptionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const adminUserId = req.user!.userId;
    const { subscriptionId, additionalDays, reason } = req.body;

    if (!subscriptionId || !additionalDays) {
      return res.status(400).json({
        success: false,
        error: 'Subscription ID and additional days are required',
      });
    }

    const subscription = await extendSubscription(subscriptionId, additionalDays, adminUserId, reason || '');

    logger.info(
      { adminUserId, subscriptionId, additionalDays },
      'Subscription extended by admin'
    );

    res.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get subscription by ID (admin)
 */
export async function getSubscriptionByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const subscriptionId = req.params.subscriptionId;
    if (!subscriptionId) {
      return res.status(400).json({ success: false, error: 'Subscription ID required' });
    }
    const subscription = await getSubscriptionById(subscriptionId);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found',
      });
    }

    res.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
}

// Legacy handlers for backwards compatibility
export async function getSubscriptionHandler(req: Request, res: Response, next: NextFunction) {
  return getCurrentSubscriptionHandler(req, res, next);
}
