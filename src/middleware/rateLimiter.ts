import { Request, Response, NextFunction } from 'express';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import {
  checkRateLimit,
  rateLimitTiers,
  logRateLimitEvent,
  RateLimitTier,
} from '../services/rateLimiterService';

export interface RateLimitInfo {
  tier: string;
  limit: number;
  remaining: number;
  reset: number;
}

declare global {
  namespace Express {
    interface Request {
      rateLimit?: RateLimitInfo;
    }
  }
}

function getClientIP(req: Request): string {
  if (config.rateLimitConfig.trustProxy) {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor.split(',')[0];
      return ips?.trim() ?? 'unknown';
    }
    const realIP = req.headers['x-real-ip'];
    if (realIP && typeof realIP === 'string') {
      return realIP.trim();
    }
  }
  return req.ip ?? req.socket.remoteAddress ?? 'unknown';
}

function getIdentifier(req: Request, useUserId: boolean = false): string {
  if (useUserId && req.user?.userId) {
    return `user:${req.user.userId}`;
  }
  return `ip:${getClientIP(req)}`;
}

function setRateLimitHeaders(
  res: Response,
  tier: RateLimitTier,
  remaining: number,
  resetMs: number
): void {
  const resetTime = Math.ceil(Date.now() / 1000 + resetMs / 1000);
  res.set({
    'X-RateLimit-Limit': tier.points.toString(),
    'X-RateLimit-Remaining': Math.max(0, remaining).toString(),
    'X-RateLimit-Reset': resetTime.toString(),
  });
}

function createRateLimiter(tierName: string, customTier?: Partial<RateLimitTier>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!config.rateLimitConfig.enabled) {
      next();
      return;
    }

    const lookupTier = rateLimitTiers[tierName];
    // rateLimitTiers.public is guaranteed to exist
    const baseTier: RateLimitTier = lookupTier !== undefined ? lookupTier : rateLimitTiers.public!;
    const tier: RateLimitTier = customTier
      ? {
          points: customTier.points ?? baseTier.points,
          duration: customTier.duration ?? baseTier.duration,
          blockDuration: customTier.blockDuration ?? baseTier.blockDuration,
        }
      : baseTier;

    const useUserId = tierName === 'authenticated' || tierName === 'premium';
    const identifier = getIdentifier(req, useUserId);
    const endpoint = req.path;

    try {
      const result = await checkRateLimit(identifier, endpoint, tierName);

      setRateLimitHeaders(res, tier, result.remainingPoints, result.msBeforeNext);

      req.rateLimit = {
        tier: tierName,
        limit: tier.points,
        remaining: result.remainingPoints,
        reset: Math.ceil(Date.now() / 1000 + result.msBeforeNext / 1000),
      };

      if (!result.allowed) {
        const retryAfter = Math.ceil(result.msBeforeNext / 1000);
        res.set('Retry-After', retryAfter.toString());

        // Log blocked request
        await logRateLimitEvent(
          identifier,
          endpoint,
          req.method,
          result.consumedPoints,
          true,
          `Rate limit exceeded for tier: ${tierName}`
        );

        logger.warn({
          identifier,
          endpoint,
          tier: tierName,
          consumedPoints: result.consumedPoints,
          retryAfter,
        }, 'Rate limit exceeded');

        res.status(429).json({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter,
        });
        return;
      }

      next();
    } catch (error) {
      logger.error({ error, identifier, endpoint }, 'Rate limiter middleware error');
      // Allow request on error
      next();
    }
  };
}

// Pre-configured rate limiters
export const publicRateLimiter = createRateLimiter('public');
export const authenticatedRateLimiter = createRateLimiter('authenticated');
export const premiumRateLimiter = createRateLimiter('premium');
export const strictRateLimiter = createRateLimiter('strict');
export const veryStrictRateLimiter = createRateLimiter('veryStrict');

// Factory function for custom rate limits
export function rateLimiter(tierName: string, customTier?: Partial<RateLimitTier>) {
  return createRateLimiter(tierName, customTier);
}

// API Key rate limiter - uses custom rate limit from the API key
export function apiKeyRateLimiter(customLimit?: number) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!config.rateLimitConfig.enabled) {
      next();
      return;
    }

    // Get rate limit from API key if available
    const apiKeyLimit = (req as any).apiKeyRateLimit || customLimit || 60;
    const customTier: RateLimitTier = {
      points: apiKeyLimit,
      duration: 60,
      blockDuration: 60,
    };

    const identifier = (req as any).apiKeyId
      ? `apikey:${(req as any).apiKeyId}`
      : getIdentifier(req);
    const endpoint = req.path;

    try {
      const result = await checkRateLimit(identifier, endpoint, 'apiKey');

      setRateLimitHeaders(res, customTier, result.remainingPoints, result.msBeforeNext);

      if (!result.allowed) {
        const retryAfter = Math.ceil(result.msBeforeNext / 1000);
        res.set('Retry-After', retryAfter.toString());

        await logRateLimitEvent(
          identifier,
          endpoint,
          req.method,
          result.consumedPoints,
          true,
          'API key rate limit exceeded'
        );

        res.status(429).json({
          error: 'Too many requests',
          message: 'API key rate limit exceeded.',
          retryAfter,
        });
        return;
      }

      next();
    } catch (error) {
      logger.error({ error, identifier, endpoint }, 'API key rate limiter error');
      next();
    }
  };
}

// Legacy compatibility exports
export const globalRateLimiter = publicRateLimiter;
export const authRateLimiter = strictRateLimiter;
