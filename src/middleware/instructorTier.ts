import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

// Tier levels for comparison
export const TIER_LEVELS = {
  STARTER: 1,
  PRO: 2,
  ELITE: 3,
  PLATFORM_OWNER: 4,
} as const;

export type InstructorTier = keyof typeof TIER_LEVELS;

// Features available per tier
export const TIER_FEATURES = {
  STARTER: {
    maxStudents: 50,
    canSendNotifications: false,
    canSendEmails: false,
    canCreateCampaigns: false,
    analyticsAccess: 'basic',
    maxClasses: 10,
    maxPrograms: 2,
  },
  PRO: {
    maxStudents: 500,
    canSendNotifications: true,
    canSendEmails: true,
    canCreateCampaigns: false,
    analyticsAccess: 'advanced',
    maxClasses: 50,
    maxPrograms: 10,
  },
  ELITE: {
    maxStudents: -1, // unlimited
    canSendNotifications: true,
    canSendEmails: true,
    canCreateCampaigns: true,
    analyticsAccess: 'full',
    maxClasses: -1,
    maxPrograms: -1,
  },
  PLATFORM_OWNER: {
    maxStudents: -1,
    canSendNotifications: true,
    canSendEmails: true,
    canCreateCampaigns: true,
    analyticsAccess: 'full',
    maxClasses: -1,
    maxPrograms: -1,
  },
};

/**
 * Middleware to require a minimum instructor tier
 */
export function requireTier(minimumTier: InstructorTier) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      // Get instructor profile
      const instructor = await prisma.instructor_profiles.findFirst({
        where: { userId },
        select: { tier: true },
      });

      if (!instructor) {
        return res.status(403).json({
          success: false,
          error: 'Instructor profile not found',
          code: 'INSTRUCTOR_NOT_FOUND',
        });
      }

      const userTierLevel = TIER_LEVELS[instructor.tier as InstructorTier] || TIER_LEVELS.STARTER;
      const requiredTierLevel = TIER_LEVELS[minimumTier];

      if (userTierLevel < requiredTierLevel) {
        return res.status(403).json({
          success: false,
          error: `Bu özellik için ${minimumTier} veya üstü kademe gereklidir`,
          code: 'INSUFFICIENT_TIER',
          currentTier: instructor.tier,
          requiredTier: minimumTier,
          upgradeUrl: '/instructor/billing',
        });
      }

      // Attach tier info to request
      req.instructorTier = instructor.tier as InstructorTier;
      next();
    } catch (error) {
      logger.error({ error }, 'Error checking instructor tier');
      res.status(500).json({ success: false, error: 'Failed to verify instructor tier' });
    }
  };
}

/**
 * Middleware to check if instructor can send notifications
 */
export async function requireNotificationAccess(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const instructor = await prisma.instructor_profiles.findFirst({
      where: { userId },
      select: { tier: true },
    });

    if (!instructor) {
      return res.status(403).json({
        success: false,
        error: 'Instructor profile not found',
      });
    }

    const tierFeatures = TIER_FEATURES[instructor.tier as InstructorTier] || TIER_FEATURES.STARTER;

    if (!tierFeatures.canSendNotifications) {
      return res.status(403).json({
        success: false,
        error: 'Bildirim gönderme özelliği için PRO veya üstü kademe gereklidir',
        code: 'NOTIFICATION_ACCESS_DENIED',
        currentTier: instructor.tier,
        requiredTier: 'PRO',
        upgradeUrl: '/instructor/billing',
      });
    }

    req.instructorTier = instructor.tier as InstructorTier;
    next();
  } catch (error) {
    logger.error({ error }, 'Error checking notification access');
    res.status(500).json({ success: false, error: 'Failed to verify notification access' });
  }
}

// Extend AuthRequest to include instructor tier
declare module './auth' {
  interface AuthRequest {
    instructorTier?: InstructorTier;
  }
}
