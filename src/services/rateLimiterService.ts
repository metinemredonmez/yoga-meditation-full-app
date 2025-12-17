import { RateLimiterRedis, RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { getRedisClient, isRedisConnected } from '../utils/redis';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { config } from '../utils/config';

export interface RateLimitTier {
  points: number;
  duration: number;
  blockDuration: number;
}

function getTier(tierName: string): RateLimitTier {
  const tier = rateLimitTiers[tierName];
  // rateLimitTiers.public is guaranteed to exist
  return tier !== undefined ? tier : rateLimitTiers.public!;
}

export const rateLimitTiers: Record<string, RateLimitTier> = {
  public: {
    points: 30,
    duration: 60,
    blockDuration: 300,
  },
  authenticated: {
    points: 100,
    duration: 60,
    blockDuration: 120,
  },
  premium: {
    points: 300,
    duration: 60,
    blockDuration: 60,
  },
  apiKey: {
    points: 60,
    duration: 60,
    blockDuration: 60,
  },
  strict: {
    points: 5,
    duration: 900, // 15 minutes
    blockDuration: 900,
  },
  veryStrict: {
    points: 3,
    duration: 300, // 5 minutes
    blockDuration: 1800, // 30 min block
  },
};

type RateLimiterInstance = RateLimiterRedis | RateLimiterMemory;
const rateLimiters = new Map<string, RateLimiterInstance>();
const inMemoryFallbacks = new Map<string, RateLimiterMemory>();

export function createRateLimiter(
  keyPrefix: string,
  tier: RateLimitTier
): RateLimiterInstance {
  const existingLimiter = rateLimiters.get(keyPrefix);
  if (existingLimiter) {
    return existingLimiter;
  }

  const redisClient = getRedisClient();

  if (redisClient && isRedisConnected()) {
    try {
      const limiter = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix,
        points: tier.points,
        duration: tier.duration,
        blockDuration: tier.blockDuration,
        insuranceLimiter: getInMemoryFallback(keyPrefix, tier),
      });
      rateLimiters.set(keyPrefix, limiter);
      return limiter;
    } catch (error) {
      logger.warn({ error, keyPrefix }, 'Failed to create Redis rate limiter, falling back to in-memory');
      return getInMemoryFallback(keyPrefix, tier);
    }
  }

  logger.warn({ keyPrefix }, 'Redis not available, using in-memory rate limiter');
  return getInMemoryFallback(keyPrefix, tier);
}

function getInMemoryFallback(keyPrefix: string, tier: RateLimitTier): RateLimiterMemory {
  const existingFallback = inMemoryFallbacks.get(keyPrefix);
  if (existingFallback) {
    return existingFallback;
  }

  const fallback = new RateLimiterMemory({
    keyPrefix: `${keyPrefix}_mem`,
    points: tier.points,
    duration: tier.duration,
    blockDuration: tier.blockDuration,
  });
  inMemoryFallbacks.set(keyPrefix, fallback);
  return fallback;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  remainingPoints: number;
  msBeforeNext: number;
  consumedPoints: number;
  isFirstInDuration: boolean;
}

export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  tierName: string = 'public'
): Promise<RateLimitCheckResult> {
  const tier = getTier(tierName);
  const keyPrefix = `rl:${tierName}:${endpoint}`;
  const limiter = createRateLimiter(keyPrefix, tier);

  try {
    const result = await limiter.consume(identifier);
    return {
      allowed: true,
      remainingPoints: result.remainingPoints,
      msBeforeNext: result.msBeforeNext,
      consumedPoints: result.consumedPoints,
      isFirstInDuration: result.isFirstInDuration,
    };
  } catch (error) {
    if (error instanceof RateLimiterRes) {
      return {
        allowed: false,
        remainingPoints: error.remainingPoints,
        msBeforeNext: error.msBeforeNext,
        consumedPoints: error.consumedPoints,
        isFirstInDuration: error.isFirstInDuration,
      };
    }
    logger.error({ error, identifier, endpoint }, 'Rate limiter error');
    // Allow request on error to prevent blocking legitimate users
    return {
      allowed: true,
      remainingPoints: 1,
      msBeforeNext: 0,
      consumedPoints: 0,
      isFirstInDuration: false,
    };
  }
}

export async function getRemainingRequests(
  identifier: string,
  endpoint: string,
  tierName: string = 'public'
): Promise<number> {
  const tier = getTier(tierName);
  const keyPrefix = `rl:${tierName}:${endpoint}`;
  const limiter = createRateLimiter(keyPrefix, tier);

  try {
    const result = await limiter.get(identifier);
    if (result) {
      return Math.max(0, tier.points - result.consumedPoints);
    }
    return tier.points;
  } catch (error) {
    logger.error({ error, identifier, endpoint }, 'Error getting remaining requests');
    return tier.points;
  }
}

export async function resetRateLimit(
  identifier: string,
  endpoint: string,
  tierName: string = 'public'
): Promise<boolean> {
  const tier = getTier(tierName);
  const keyPrefix = `rl:${tierName}:${endpoint}`;
  const limiter = createRateLimiter(keyPrefix, tier);

  try {
    await limiter.delete(identifier);
    logger.info({ identifier, endpoint, tierName }, 'Rate limit reset');
    return true;
  } catch (error) {
    logger.error({ error, identifier, endpoint }, 'Error resetting rate limit');
    return false;
  }
}

// Blocked IP management
const blockedIPCache = new Map<string, { blocked: boolean; expiresAt: Date | null; cachedAt: Date }>();
const BLOCKED_IP_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getBlockedIPs() {
  try {
    const blockedIPs = await prisma.blockedIP.findMany({
      where: { isActive: true },
      orderBy: { blockedAt: 'desc' },
    });
    return blockedIPs;
  } catch (error) {
    logger.error({ error }, 'Error fetching blocked IPs');
    return [];
  }
}

export async function blockIP(
  ipAddress: string,
  reason: string,
  blockedBy: string,
  expiresAt?: Date | null
): Promise<boolean> {
  try {
    await prisma.blockedIP.upsert({
      where: { ipAddress },
      update: {
        reason,
        blockedBy,
        expiresAt: expiresAt ?? null,
        isActive: true,
        blockedAt: new Date(),
      },
      create: {
        ipAddress,
        reason,
        blockedBy,
        expiresAt: expiresAt ?? null,
        isActive: true,
      },
    });

    // Invalidate cache
    blockedIPCache.delete(ipAddress);

    // Also cache in Redis if available
    const redisClient = getRedisClient();
    if (redisClient && isRedisConnected()) {
      const cacheKey = `blocked_ip:${ipAddress}`;
      await redisClient.set(cacheKey, JSON.stringify({ blocked: true, expiresAt }), 'EX', 300);
    }

    logger.info({ ipAddress, reason, blockedBy, expiresAt }, 'IP blocked');
    return true;
  } catch (error) {
    logger.error({ error, ipAddress }, 'Error blocking IP');
    return false;
  }
}

export async function unblockIP(ipAddress: string): Promise<boolean> {
  try {
    await prisma.blockedIP.updateMany({
      where: { ipAddress },
      data: { isActive: false },
    });

    // Invalidate cache
    blockedIPCache.delete(ipAddress);

    // Also remove from Redis cache
    const redisClient = getRedisClient();
    if (redisClient && isRedisConnected()) {
      await redisClient.del(`blocked_ip:${ipAddress}`);
    }

    logger.info({ ipAddress }, 'IP unblocked');
    return true;
  } catch (error) {
    logger.error({ error, ipAddress }, 'Error unblocking IP');
    return false;
  }
}

export async function isIPBlocked(ipAddress: string): Promise<boolean> {
  // Check in-memory cache first
  const cached = blockedIPCache.get(ipAddress);
  if (cached && Date.now() - cached.cachedAt.getTime() < BLOCKED_IP_CACHE_TTL) {
    // Check if block has expired
    if (cached.expiresAt && new Date() > cached.expiresAt) {
      blockedIPCache.delete(ipAddress);
      return false;
    }
    return cached.blocked;
  }

  // Check Redis cache
  const redisClient = getRedisClient();
  if (redisClient && isRedisConnected()) {
    try {
      const cacheKey = `blocked_ip:${ipAddress}`;
      const redisResult = await redisClient.get(cacheKey);
      if (redisResult) {
        const data = JSON.parse(redisResult);
        blockedIPCache.set(ipAddress, {
          blocked: data.blocked,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          cachedAt: new Date(),
        });
        return data.blocked;
      }
    } catch (error) {
      logger.warn({ error, ipAddress }, 'Error checking Redis IP block cache');
    }
  }

  // Check database
  try {
    const blockedIP = await prisma.blockedIP.findFirst({
      where: {
        ipAddress,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    const isBlocked = !!blockedIP;
    const expiresAt = blockedIP?.expiresAt || null;

    // Cache the result
    blockedIPCache.set(ipAddress, {
      blocked: isBlocked,
      expiresAt,
      cachedAt: new Date(),
    });

    // Also cache in Redis
    if (redisClient && isRedisConnected()) {
      const cacheKey = `blocked_ip:${ipAddress}`;
      await redisClient.set(
        cacheKey,
        JSON.stringify({ blocked: isBlocked, expiresAt }),
        'EX',
        300
      );
    }

    return isBlocked;
  } catch (error) {
    logger.error({ error, ipAddress }, 'Error checking if IP is blocked');
    return false; // Allow on error
  }
}

export async function logRateLimitEvent(
  identifier: string,
  endpoint: string,
  method: string,
  requestCount: number,
  blocked: boolean,
  blockedReason?: string | null
): Promise<void> {
  // Only log blocked events to database
  if (!blocked) {
    return;
  }

  try {
    await prisma.rateLimitLog.create({
      data: {
        identifier,
        endpoint,
        method,
        requestCount,
        windowStart: new Date(),
        blocked,
        blockedReason: blockedReason ?? null,
      },
    });
  } catch (error) {
    logger.error({ error, identifier, endpoint }, 'Error logging rate limit event');
  }
}

export async function getRateLimitStats(
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalBlocked: number;
  blockedByEndpoint: { endpoint: string; count: number }[];
  blockedByIdentifier: { identifier: string; count: number }[];
}> {
  try {
    const where = {
      blocked: true,
      ...(startDate && endDate
        ? { createdAt: { gte: startDate, lte: endDate } }
        : {}),
    };

    const [totalBlocked, byEndpoint, byIdentifier] = await Promise.all([
      prisma.rateLimitLog.count({ where }),
      prisma.rateLimitLog.groupBy({
        by: ['endpoint'],
        where,
        _count: { endpoint: true },
        orderBy: { _count: { endpoint: 'desc' } },
        take: 10,
      }),
      prisma.rateLimitLog.groupBy({
        by: ['identifier'],
        where,
        _count: { identifier: true },
        orderBy: { _count: { identifier: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      totalBlocked,
      blockedByEndpoint: byEndpoint.map((e) => ({
        endpoint: e.endpoint,
        count: e._count.endpoint,
      })),
      blockedByIdentifier: byIdentifier.map((e) => ({
        identifier: e.identifier,
        count: e._count.identifier,
      })),
    };
  } catch (error) {
    logger.error({ error }, 'Error fetching rate limit stats');
    return {
      totalBlocked: 0,
      blockedByEndpoint: [],
      blockedByIdentifier: [],
    };
  }
}

export async function resetUserRateLimit(userId: string): Promise<boolean> {
  const redisClient = getRedisClient();

  if (redisClient && isRedisConnected()) {
    try {
      // Find all rate limit keys for this user
      const keys = await redisClient.keys(`rl:*:${userId}`);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
      logger.info({ userId, keysCleared: keys.length }, 'User rate limits reset');
      return true;
    } catch (error) {
      logger.error({ error, userId }, 'Error resetting user rate limits');
      return false;
    }
  }

  // For in-memory, we can't easily reset by user
  logger.warn({ userId }, 'Cannot reset user rate limits without Redis');
  return false;
}
