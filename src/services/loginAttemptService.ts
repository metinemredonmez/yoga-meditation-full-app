import { prisma } from '../utils/database';
import { getRedisClient } from '../utils/redis';
import { logger } from '../utils/logger';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_SECONDS = 15 * 60; // 15 minutes

interface LoginAttemptResult {
  locked: boolean;
  remainingAttempts: number;
  lockoutSeconds?: number;
}

/**
 * Record a failed login attempt
 */
export async function recordFailedAttempt(email: string, ip: string): Promise<LoginAttemptResult> {
  const redis = getRedisClient();
  const key = `login_attempts:${email.toLowerCase()}`;

  try {
    // Try Redis first (faster)
    if (redis) {
      const attempts = await redis.incr(key);

      if (attempts === 1) {
        await redis.expire(key, LOCKOUT_DURATION_SECONDS);
      }

      if (attempts >= MAX_ATTEMPTS) {
        const ttl = await redis.ttl(key);
        logger.warn({ email: email.slice(0, 3) + '***', ip, attempts }, 'Account locked due to failed attempts');
        return { locked: true, remainingAttempts: 0, lockoutSeconds: ttl };
      }

      return { locked: false, remainingAttempts: MAX_ATTEMPTS - attempts };
    }

    // Fallback to database if Redis unavailable
    const recentAttempts = await prisma.auditLog.count({
      where: {
        action: 'login.failed',
        metadata: {
          path: ['email'],
          equals: email.toLowerCase(),
        },
        createdAt: {
          gte: new Date(Date.now() - LOCKOUT_DURATION_SECONDS * 1000),
        },
      },
    });

    // Record this attempt
    await prisma.auditLog.create({
      data: {
        action: 'login.failed',
        metadata: { email: email.toLowerCase(), ip },
      },
    });

    const totalAttempts = recentAttempts + 1;

    if (totalAttempts >= MAX_ATTEMPTS) {
      logger.warn({ email: email.slice(0, 3) + '***', ip, attempts: totalAttempts }, 'Account locked due to failed attempts');
      return { locked: true, remainingAttempts: 0, lockoutSeconds: LOCKOUT_DURATION_SECONDS };
    }

    return { locked: false, remainingAttempts: MAX_ATTEMPTS - totalAttempts };
  } catch (error) {
    logger.error({ err: error }, 'Failed to record login attempt');
    // Don't block login on error
    return { locked: false, remainingAttempts: MAX_ATTEMPTS };
  }
}

/**
 * Check if account is locked
 */
export async function isAccountLocked(email: string): Promise<{ locked: boolean; lockoutSeconds?: number }> {
  const redis = getRedisClient();
  const key = `login_attempts:${email.toLowerCase()}`;

  try {
    if (redis) {
      const attempts = await redis.get(key);
      const attemptCount = parseInt(attempts || '0', 10);

      if (attemptCount >= MAX_ATTEMPTS) {
        const ttl = await redis.ttl(key);
        return { locked: true, lockoutSeconds: ttl > 0 ? ttl : LOCKOUT_DURATION_SECONDS };
      }

      return { locked: false };
    }

    // Fallback to database
    const recentAttempts = await prisma.auditLog.count({
      where: {
        action: 'login.failed',
        metadata: {
          path: ['email'],
          equals: email.toLowerCase(),
        },
        createdAt: {
          gte: new Date(Date.now() - LOCKOUT_DURATION_SECONDS * 1000),
        },
      },
    });

    if (recentAttempts >= MAX_ATTEMPTS) {
      return { locked: true, lockoutSeconds: LOCKOUT_DURATION_SECONDS };
    }

    return { locked: false };
  } catch (error) {
    logger.error({ err: error }, 'Failed to check account lock status');
    return { locked: false };
  }
}

/**
 * Clear login attempts after successful login
 */
export async function clearLoginAttempts(email: string): Promise<void> {
  const redis = getRedisClient();
  const key = `login_attempts:${email.toLowerCase()}`;

  try {
    if (redis) {
      await redis.del(key);
    }

    // Also record successful login for audit
    await prisma.auditLog.create({
      data: {
        action: 'login.success',
        metadata: { email: email.toLowerCase() },
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to clear login attempts');
  }
}

/**
 * Get remaining lockout time
 */
export async function getLockoutRemaining(email: string): Promise<number> {
  const redis = getRedisClient();
  const key = `login_attempts:${email.toLowerCase()}`;

  try {
    if (redis) {
      const ttl = await redis.ttl(key);
      return ttl > 0 ? ttl : 0;
    }

    // For database fallback, calculate from last attempt
    const lastAttempt = await prisma.auditLog.findFirst({
      where: {
        action: 'login.failed',
        metadata: {
          path: ['email'],
          equals: email.toLowerCase(),
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (lastAttempt) {
      const elapsed = (Date.now() - lastAttempt.createdAt.getTime()) / 1000;
      const remaining = LOCKOUT_DURATION_SECONDS - elapsed;
      return remaining > 0 ? Math.ceil(remaining) : 0;
    }

    return 0;
  } catch (error) {
    logger.error({ err: error }, 'Failed to get lockout remaining');
    return 0;
  }
}
