import { Request, Response, NextFunction } from 'express';
import {
  getBlockedIPs,
  blockIP,
  unblockIP,
  getRateLimitStats,
  resetUserRateLimit,
} from '../services/rateLimiterService';
import { logger } from '../utils/logger';

export async function handleGetBlockedIPs(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const blockedIPs = await getBlockedIPs();

    res.json({
      success: true,
      data: blockedIPs,
      count: blockedIPs.length,
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching blocked IPs');
    next(error);
  }
}

export async function handleBlockIP(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { ipAddress, reason, expiresAt } = req.body;
    const adminId = req.user?.userId;

    if (!adminId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    const success = await blockIP(
      ipAddress,
      reason,
      adminId,
      expiresAt ? new Date(expiresAt) : null
    );

    if (success) {
      logger.info({ ipAddress, reason, adminId }, 'IP blocked by admin');
      res.json({
        success: true,
        message: `IP ${ipAddress} has been blocked.`,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to block IP address.',
      });
    }
  } catch (error) {
    logger.error({ error }, 'Error blocking IP');
    next(error);
  }
}

export async function handleUnblockIP(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { ipAddress } = req.params;
    const adminId = req.user?.userId;

    if (!ipAddress) {
      res.status(400).json({
        success: false,
        error: 'IP address is required',
      });
      return;
    }

    const success = await unblockIP(ipAddress);

    if (success) {
      logger.info({ ipAddress, adminId }, 'IP unblocked by admin');
      res.json({
        success: true,
        message: `IP ${ipAddress} has been unblocked.`,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to unblock IP address.',
      });
    }
  } catch (error) {
    logger.error({ error }, 'Error unblocking IP');
    next(error);
  }
}

export async function handleGetRateLimitStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { startDate, endDate } = req.query;

    const stats = await getRateLimitStats(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching rate limit stats');
    next(error);
  }
}

export async function handleResetUserRateLimit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId } = req.params;
    const adminId = req.user?.userId;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
      return;
    }

    const success = await resetUserRateLimit(userId);

    if (success) {
      logger.info({ userId, adminId }, 'User rate limit reset by admin');
      res.json({
        success: true,
        message: `Rate limits for user ${userId} have been reset.`,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to reset user rate limits. Redis may not be available.',
      });
    }
  } catch (error) {
    logger.error({ error }, 'Error resetting user rate limit');
    next(error);
  }
}
