import { Request, Response, NextFunction } from 'express';
import { SubscriptionTier } from '@prisma/client';
import {
  hasActiveSubscription,
  getSubscriptionTier,
  canAccessContent,
  getSubscriptionStatus,
} from '../services/subscriptionService';
import { logger } from '../utils/logger';

/**
 * Middleware to require an active subscription
 */
export function requireSubscription(req: Request, res: Response, next: NextFunction) {
  return requireTier('MEDITATION')(req, res, next);
}

/**
 * Middleware to require a specific subscription tier or higher
 */
export function requireTier(minimumTier: SubscriptionTier) {
  const tierOrder: Record<SubscriptionTier, number> = {
    FREE: 0,
    MEDITATION: 1,
    YOGA: 2,
    PREMIUM: 3,
    FAMILY: 4,
    ENTERPRISE: 5,
  };

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const userTier = await getSubscriptionTier(req.user.userId);
      const userTierLevel = tierOrder[userTier as SubscriptionTier] || 0;
      const requiredTierLevel = tierOrder[minimumTier];

      if (userTierLevel < requiredTierLevel) {
        return res.status(403).json({
          success: false,
          error: 'Subscription required',
          requiredTier: minimumTier,
          currentTier: userTier,
          message: `This feature requires a ${minimumTier} subscription or higher`,
        });
      }

      // Attach subscription info to request for downstream use
      (req as any).subscriptionTier = userTier;

      next();
    } catch (error) {
      logger.error({ err: error }, 'Error checking subscription tier');
      return res.status(500).json({
        success: false,
        error: 'Failed to verify subscription',
      });
    }
  };
}

/**
 * Middleware to require Premium tier
 */
export function requirePremium(req: Request, res: Response, next: NextFunction) {
  return requireTier('PREMIUM')(req, res, next);
}

/**
 * Middleware to require Enterprise tier
 */
export function requireEnterprise(req: Request, res: Response, next: NextFunction) {
  return requireTier('ENTERPRISE')(req, res, next);
}

/**
 * Middleware to check content access
 * Pass through if user can access, otherwise return 403
 */
export function checkContentAccess(contentTier: SubscriptionTier) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const hasAccess = await canAccessContent(req.user.userId, contentTier);

      if (!hasAccess) {
        const userTier = await getSubscriptionTier(req.user.userId);
        return res.status(403).json({
          success: false,
          error: 'Premium content',
          requiredTier: contentTier,
          currentTier: userTier,
          message: `This content requires a ${contentTier} subscription`,
        });
      }

      next();
    } catch (error) {
      logger.error({ err: error }, 'Error checking content access');
      return res.status(500).json({
        success: false,
        error: 'Failed to verify content access',
      });
    }
  };
}

/**
 * Middleware to attach subscription status to request
 * Does not block - just adds subscription info
 */
export async function attachSubscriptionStatus(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user?.userId) {
      const status = await getSubscriptionStatus(req.user.userId);
      (req as any).subscription = status;
    }
    next();
  } catch (error) {
    // Don't fail the request, just log and continue
    logger.error({ err: error }, 'Error attaching subscription status');
    next();
  }
}

/**
 * Middleware to check if user is in grace period
 * Allows access but adds warning header
 */
export async function checkGracePeriod(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user?.userId) {
      const status = await getSubscriptionStatus(req.user.userId);

      if (status.isInGracePeriod) {
        res.set('X-Subscription-Warning', 'grace-period');
        res.set('X-Grace-Period-Ends', status.subscriptions?.gracePeriodEnd?.toISOString() || '');
      }

      if (status.subscriptions?.status === 'PAST_DUE') {
        res.set('X-Subscription-Warning', 'payment-past-due');
      }
    }
    next();
  } catch (error) {
    // Don't fail the request
    next();
  }
}

/**
 * Rate limiting based on subscription tier
 * Higher tiers get more requests
 */
export function tierBasedRateLimit() {
  const tierLimits: Record<SubscriptionTier, number> = {
    FREE: 100, // 100 requests per hour
    MEDITATION: 500, // 500 requests per hour
    YOGA: 500, // 500 requests per hour
    PREMIUM: 2000, // 2000 requests per hour
    FAMILY: 2000, // 2000 requests per hour
    ENTERPRISE: 10000, // 10000 requests per hour
  };

  // Simple in-memory rate limiter (for production, use Redis)
  const requestCounts = new Map<string, { count: number; resetAt: number }>();

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return next(); // Let auth middleware handle this
      }

      const userTier = await getSubscriptionTier(userId);
      const limit = tierLimits[userTier as SubscriptionTier] || tierLimits.FREE;
      const now = Date.now();
      const hourInMs = 60 * 60 * 1000;

      let userRequests = requestCounts.get(userId);

      if (!userRequests || userRequests.resetAt < now) {
        userRequests = { count: 0, resetAt: now + hourInMs };
        requestCounts.set(userId, userRequests);
      }

      userRequests.count++;

      // Set rate limit headers
      res.set('X-RateLimit-Limit', limit.toString());
      res.set('X-RateLimit-Remaining', Math.max(0, limit - userRequests.count).toString());
      res.set('X-RateLimit-Reset', Math.ceil(userRequests.resetAt / 1000).toString());

      if (userRequests.count > limit) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          currentTier: userTier,
          message: `Upgrade your subscription for higher rate limits`,
          retryAfter: Math.ceil((userRequests.resetAt - now) / 1000),
        });
      }

      next();
    } catch (error) {
      // Don't fail the request on rate limit errors
      next();
    }
  };
}

/**
 * Feature flag middleware based on subscription tier
 */
export function requireFeature(featureName: string) {
  // Feature availability by tier
  const features: Record<string, SubscriptionTier[]> = {
    'offline-download': ['PREMIUM', 'FAMILY', 'ENTERPRISE'],
    'hd-video': ['MEDITATION', 'YOGA', 'PREMIUM', 'FAMILY', 'ENTERPRISE'],
    'live-classes': ['PREMIUM', 'FAMILY', 'ENTERPRISE'],
    'personal-instructor': ['ENTERPRISE'],
    'unlimited-programs': ['PREMIUM', 'FAMILY', 'ENTERPRISE'],
    'analytics': ['MEDITATION', 'YOGA', 'PREMIUM', 'FAMILY', 'ENTERPRISE'],
    'api-access': ['ENTERPRISE'],
    'white-label': ['ENTERPRISE'],
  };

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const userTier = await getSubscriptionTier(req.user.userId);
      const allowedTiers = features[featureName] || [];

      if (!allowedTiers.includes(userTier as SubscriptionTier)) {
        return res.status(403).json({
          success: false,
          error: 'Feature not available',
          feature: featureName,
          currentTier: userTier,
          requiredTiers: allowedTiers,
          message: `This feature is available for ${allowedTiers.join(', ')} subscribers`,
        });
      }

      next();
    } catch (error) {
      logger.error({ err: error, feature: featureName }, 'Error checking feature access');
      return res.status(500).json({
        success: false,
        error: 'Failed to verify feature access',
      });
    }
  };
}
