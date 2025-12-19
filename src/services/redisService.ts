/**
 * Redis Service
 * Caching, rate limiting, pub/sub, session management
 */

import Redis from 'ioredis';
import { logger } from '../utils/logger';

// Redis client singleton
let redis: Redis | null = null;
let subscriber: Redis | null = null;

/**
 * Get Redis client
 */
export function getRedisClient(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redis.on('connect', () => {
      logger.info('Redis connected');
    });

    redis.on('error', (err) => {
      logger.error({ err }, 'Redis connection error');
    });
  }
  return redis;
}

/**
 * Get Redis subscriber client (for pub/sub)
 */
export function getRedisSubscriber(): Redis {
  if (!subscriber) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    subscriber = new Redis(redisUrl);
  }
  return subscriber;
}

export const redisService = {
  // ============================================
  // Basic Operations
  // ============================================

  /**
   * Get value by key
   */
  async get(key: string): Promise<string | null> {
    return getRedisClient().get(key);
  },

  /**
   * Set value with optional TTL
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const client = getRedisClient();
    if (ttlSeconds) {
      await client.setex(key, ttlSeconds, value);
    } else {
      await client.set(key, value);
    }
  },

  /**
   * Delete key
   */
  async del(key: string): Promise<void> {
    await getRedisClient().del(key);
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const result = await getRedisClient().exists(key);
    return result === 1;
  },

  /**
   * Increment value
   */
  async incr(key: string): Promise<number> {
    return getRedisClient().incr(key);
  },

  /**
   * Set expiration on existing key
   */
  async expire(key: string, seconds: number): Promise<void> {
    await getRedisClient().expire(key, seconds);
  },

  /**
   * Get TTL of key
   */
  async ttl(key: string): Promise<number> {
    return getRedisClient().ttl(key);
  },

  // ============================================
  // JSON Operations
  // ============================================

  /**
   * Get JSON value
   */
  async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },

  /**
   * Set JSON value
   */
  async setJSON<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  },

  // ============================================
  // Cache Helpers
  // ============================================

  /**
   * Get or set cache with fetcher function
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number
  ): Promise<T> {
    const cached = await this.getJSON<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    await this.setJSON(key, data, ttlSeconds);
    return data;
  },

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length === 0) return 0;
    return client.del(...keys);
  },

  // ============================================
  // Rate Limiting
  // ============================================

  /**
   * Check rate limit using sliding window
   */
  async checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const client = getRedisClient();
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    // Use sorted set for sliding window
    const multi = client.multi();
    multi.zremrangebyscore(key, 0, windowStart);
    multi.zadd(key, now, `${now}`);
    multi.zcard(key);
    multi.expire(key, windowSeconds);

    const results = await multi.exec();
    const count = (results?.[2]?.[1] as number) || 0;

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetAt: now + windowSeconds * 1000,
    };
  },

  /**
   * Simple rate limit check
   */
  async isRateLimited(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<boolean> {
    const result = await this.checkRateLimit(key, limit, windowSeconds);
    return !result.allowed;
  },

  // ============================================
  // Session Management
  // ============================================

  /**
   * Store user session
   */
  async setSession(
    sessionId: string,
    data: Record<string, any>,
    ttlSeconds: number = 86400 // 24 hours
  ): Promise<void> {
    await this.setJSON(`session:${sessionId}`, data, ttlSeconds);
  },

  /**
   * Get user session
   */
  async getSession<T = Record<string, any>>(sessionId: string): Promise<T | null> {
    return this.getJSON<T>(`session:${sessionId}`);
  },

  /**
   * Delete user session
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.del(`session:${sessionId}`);
  },

  /**
   * Extend session TTL
   */
  async extendSession(sessionId: string, ttlSeconds: number = 86400): Promise<void> {
    await this.expire(`session:${sessionId}`, ttlSeconds);
  },

  // ============================================
  // Pub/Sub
  // ============================================

  /**
   * Publish message to channel
   */
  async publish(channel: string, message: any): Promise<void> {
    await getRedisClient().publish(channel, JSON.stringify(message));
  },

  /**
   * Subscribe to channel
   */
  async subscribe(
    channel: string,
    callback: (message: any) => void
  ): Promise<void> {
    const sub = getRedisSubscriber();
    await sub.subscribe(channel);

    sub.on('message', (ch, msg) => {
      if (ch === channel) {
        try {
          callback(JSON.parse(msg));
        } catch {
          callback(msg);
        }
      }
    });
  },

  /**
   * Unsubscribe from channel
   */
  async unsubscribe(channel: string): Promise<void> {
    await getRedisSubscriber().unsubscribe(channel);
  },

  // ============================================
  // Hash Operations
  // ============================================

  /**
   * Set hash field
   */
  async hset(key: string, field: string, value: string): Promise<void> {
    await getRedisClient().hset(key, field, value);
  },

  /**
   * Get hash field
   */
  async hget(key: string, field: string): Promise<string | null> {
    return getRedisClient().hget(key, field);
  },

  /**
   * Get all hash fields
   */
  async hgetall(key: string): Promise<Record<string, string>> {
    return getRedisClient().hgetall(key);
  },

  /**
   * Delete hash field
   */
  async hdel(key: string, field: string): Promise<void> {
    await getRedisClient().hdel(key, field);
  },

  // ============================================
  // List Operations
  // ============================================

  /**
   * Push to list (left)
   */
  async lpush(key: string, ...values: string[]): Promise<number> {
    return getRedisClient().lpush(key, ...values);
  },

  /**
   * Pop from list (right)
   */
  async rpop(key: string): Promise<string | null> {
    return getRedisClient().rpop(key);
  },

  /**
   * Get list range
   */
  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return getRedisClient().lrange(key, start, stop);
  },

  /**
   * Get list length
   */
  async llen(key: string): Promise<number> {
    return getRedisClient().llen(key);
  },

  // ============================================
  // Utility
  // ============================================

  /**
   * Flush all keys (DANGEROUS - only for testing)
   */
  async flushAll(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot flush Redis in production');
    }
    await getRedisClient().flushall();
  },

  /**
   * Close connections
   */
  async close(): Promise<void> {
    if (redis) {
      await redis.quit();
      redis = null;
    }
    if (subscriber) {
      await subscriber.quit();
      subscriber = null;
    }
  },

  /**
   * Health check
   */
  async ping(): Promise<boolean> {
    try {
      const result = await getRedisClient().ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  },
};

// ============================================
// Cache Key Builders
// ============================================

export const CacheKeys = {
  // User cache
  users: (userId: string) => `user:${userId}`,
  userProfile: (userId: string) => `user:profile:${userId}`,
  userSubscription: (userId: string) => `user:subscription:${userId}`,
  userPreferences: (userId: string) => `user:preferences:${userId}`,

  // Content cache
  meditation: (id: string) => `meditation:${id}`,
  meditationList: (page: number, limit: number) => `meditations:list:${page}:${limit}`,
  video: (id: string) => `video:${id}`,
  videoList: (category: string, page: number) => `videos:${category}:${page}`,

  // Session cache
  session: (sessionId: string) => `session:${sessionId}`,

  // Rate limiting
  rateLimit: (type: string, identifier: string) => `ratelimit:${type}:${identifier}`,

  // Real-time
  onlineUsers: () => 'online:users',
  liveStreamViewers: (streamId: string) => `live:viewers:${streamId}`,

  // Leaderboard
  leaderboard: (type: string, period: string) => `leaderboard:${type}:${period}`,

  // Search
  searchSuggestions: (query: string) => `search:suggestions:${query}`,
};

export default redisService;
