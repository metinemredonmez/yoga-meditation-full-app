import { createHash } from 'crypto';
import { getRedisClient, isRedisConnected } from '../utils/redis';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { CACHE_TTL, CACHE_PREFIXES } from '../constants/cacheTTL';

interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  memory: string;
}

// In-memory stats tracking
let cacheStats = {
  hits: 0,
  misses: 0,
};

/**
 * Check if caching is enabled and Redis is connected
 */
function isCacheAvailable(): boolean {
  return config.cache.enabled && isRedisConnected();
}

/**
 * Get value from cache
 */
export async function get<T>(key: string): Promise<T | null> {
  if (!isCacheAvailable()) {
    return null;
  }

  try {
    const redis = getRedisClient();
    if (!redis) return null;

    const value = await redis.get(key);
    if (value === null) {
      cacheStats.misses++;
      if (config.cache.debug) {
        logger.debug({ key }, 'Cache MISS');
      }
      return null;
    }

    cacheStats.hits++;
    if (config.cache.debug) {
      logger.debug({ key }, 'Cache HIT');
    }

    return JSON.parse(value) as T;
  } catch (error) {
    logger.error({ error, key }, 'Cache get error');
    return null;
  }
}

/**
 * Set value in cache with optional TTL
 */
export async function set(
  key: string,
  value: unknown,
  ttlSeconds: number = CACHE_TTL.DEFAULT
): Promise<boolean> {
  if (!isCacheAvailable()) {
    return false;
  }

  try {
    const redis = getRedisClient();
    if (!redis) return false;

    const serialized = JSON.stringify(value);
    await redis.setex(key, ttlSeconds, serialized);

    if (config.cache.debug) {
      logger.debug({ key, ttl: ttlSeconds }, 'Cache SET');
    }

    return true;
  } catch (error) {
    logger.error({ error, key }, 'Cache set error');
    return false;
  }
}

/**
 * Delete a single key from cache
 */
export async function del(key: string): Promise<boolean> {
  if (!isCacheAvailable()) {
    return false;
  }

  try {
    const redis = getRedisClient();
    if (!redis) return false;

    await redis.del(key);

    if (config.cache.debug) {
      logger.debug({ key }, 'Cache DEL');
    }

    return true;
  } catch (error) {
    logger.error({ error, key }, 'Cache del error');
    return false;
  }
}

/**
 * Delete keys matching a pattern
 */
export async function delByPattern(pattern: string): Promise<number> {
  if (!isCacheAvailable()) {
    return 0;
  }

  try {
    const redis = getRedisClient();
    if (!redis) return 0;

    let cursor = '0';
    let deletedCount = 0;

    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;

      if (keys.length > 0) {
        await redis.del(...keys);
        deletedCount += keys.length;
      }
    } while (cursor !== '0');

    if (config.cache.debug) {
      logger.debug({ pattern, deletedCount }, 'Cache DEL by pattern');
    }

    return deletedCount;
  } catch (error) {
    logger.error({ error, pattern }, 'Cache delByPattern error');
    return 0;
  }
}

/**
 * Check if a key exists in cache
 */
export async function exists(key: string): Promise<boolean> {
  if (!isCacheAvailable()) {
    return false;
  }

  try {
    const redis = getRedisClient();
    if (!redis) return false;

    const result = await redis.exists(key);
    return result === 1;
  } catch (error) {
    logger.error({ error, key }, 'Cache exists error');
    return false;
  }
}

/**
 * Get TTL of a key in seconds
 */
export async function ttl(key: string): Promise<number> {
  if (!isCacheAvailable()) {
    return -2;
  }

  try {
    const redis = getRedisClient();
    if (!redis) return -2;

    return await redis.ttl(key);
  } catch (error) {
    logger.error({ error, key }, 'Cache ttl error');
    return -2;
  }
}

/**
 * Increment a counter
 */
export async function incr(key: string): Promise<number> {
  if (!isCacheAvailable()) {
    return 0;
  }

  try {
    const redis = getRedisClient();
    if (!redis) return 0;

    return await redis.incr(key);
  } catch (error) {
    logger.error({ error, key }, 'Cache incr error');
    return 0;
  }
}

/**
 * Decrement a counter
 */
export async function decr(key: string): Promise<number> {
  if (!isCacheAvailable()) {
    return 0;
  }

  try {
    const redis = getRedisClient();
    if (!redis) return 0;

    return await redis.decr(key);
  } catch (error) {
    logger.error({ error, key }, 'Cache decr error');
    return 0;
  }
}

/**
 * Get multiple values at once
 */
export async function mget<T>(keys: string[]): Promise<(T | null)[]> {
  if (!isCacheAvailable() || keys.length === 0) {
    return keys.map(() => null);
  }

  try {
    const redis = getRedisClient();
    if (!redis) return keys.map(() => null);

    const values = await redis.mget(...keys);
    return values.map((v) => {
      if (v === null) {
        cacheStats.misses++;
        return null;
      }
      cacheStats.hits++;
      return JSON.parse(v) as T;
    });
  } catch (error) {
    logger.error({ error, keys }, 'Cache mget error');
    return keys.map(() => null);
  }
}

/**
 * Set multiple key-value pairs at once
 */
export async function mset(
  keyValuePairs: Array<{ key: string; value: unknown; ttl?: number }>
): Promise<boolean> {
  if (!isCacheAvailable() || keyValuePairs.length === 0) {
    return false;
  }

  try {
    const redis = getRedisClient();
    if (!redis) return false;

    const pipeline = redis.pipeline();

    for (const { key, value, ttl: itemTtl } of keyValuePairs) {
      const serialized = JSON.stringify(value);
      pipeline.setex(key, itemTtl ?? CACHE_TTL.DEFAULT, serialized);
    }

    await pipeline.exec();
    return true;
  } catch (error) {
    logger.error({ error }, 'Cache mset error');
    return false;
  }
}

/**
 * Flush all cache (use with caution!)
 */
export async function flush(): Promise<boolean> {
  if (!isCacheAvailable()) {
    return false;
  }

  try {
    const redis = getRedisClient();
    if (!redis) return false;

    await redis.flushdb();
    logger.warn('Cache flushed completely');
    return true;
  } catch (error) {
    logger.error({ error }, 'Cache flush error');
    return false;
  }
}

/**
 * Get or set - returns cached value if exists, otherwise fetches and caches
 */
export async function getOrSet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = CACHE_TTL.DEFAULT
): Promise<T> {
  // Try to get from cache first
  const cached = await get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetchFn();

  // Cache the result (don't await - fire and forget)
  void set(key, data, ttlSeconds);

  return data;
}

/**
 * Get cache statistics
 */
export async function getStats(): Promise<CacheStats> {
  const stats: CacheStats = {
    hits: cacheStats.hits,
    misses: cacheStats.misses,
    keys: 0,
    memory: '0 MB',
  };

  if (!isCacheAvailable()) {
    return stats;
  }

  try {
    const redis = getRedisClient();
    if (!redis) return stats;

    const info = await redis.info('memory');
    const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
    if (memoryMatch && memoryMatch[1]) {
      stats.memory = memoryMatch[1];
    }

    const dbSize = await redis.dbsize();
    stats.keys = dbSize;
  } catch (error) {
    logger.error({ error }, 'Cache getStats error');
  }

  return stats;
}

/**
 * Get all keys matching a pattern
 */
export async function getKeys(pattern: string = '*', limit: number = 100): Promise<string[]> {
  if (!isCacheAvailable()) {
    return [];
  }

  try {
    const redis = getRedisClient();
    if (!redis) return [];

    const keys: string[] = [];
    let cursor = '0';

    do {
      const [nextCursor, foundKeys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      keys.push(...foundKeys);

      if (keys.length >= limit) {
        break;
      }
    } while (cursor !== '0');

    return keys.slice(0, limit);
  } catch (error) {
    logger.error({ error, pattern }, 'Cache getKeys error');
    return [];
  }
}

/**
 * Reset stats counters
 */
export function resetStats(): void {
  cacheStats = { hits: 0, misses: 0 };
}

// ============================================================================
// Cache Key Builders
// ============================================================================

/**
 * Create a hash from filter object for cache keys
 */
function hashFilters(filters: Record<string, unknown>): string {
  const sorted = Object.keys(filters)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key] = filters[key];
        return acc;
      },
      {} as Record<string, unknown>
    );

  const hash = createHash('md5').update(JSON.stringify(sorted)).digest('hex');
  return hash.substring(0, 8);
}

export function buildProgramKey(programId: string): string {
  return `${CACHE_PREFIXES.PROGRAM}:${programId}`;
}

export function buildProgramListKey(filters: Record<string, unknown> = {}): string {
  const filterHash = hashFilters(filters);
  return `${CACHE_PREFIXES.PROGRAM}:${CACHE_PREFIXES.LIST}:${filterHash}`;
}

export function buildPoseKey(poseId: string): string {
  return `${CACHE_PREFIXES.POSE}:${poseId}`;
}

export function buildPoseListKey(filters: Record<string, unknown> = {}): string {
  const filterHash = hashFilters(filters);
  return `${CACHE_PREFIXES.POSE}:${CACHE_PREFIXES.LIST}:${filterHash}`;
}

export function buildChallengeKey(challengeId: string): string {
  return `${CACHE_PREFIXES.CHALLENGE}:${challengeId}`;
}

export function buildChallengeListKey(filters: Record<string, unknown> = {}): string {
  const filterHash = hashFilters(filters);
  return `${CACHE_PREFIXES.CHALLENGE}:${CACHE_PREFIXES.LIST}:${filterHash}`;
}

export function buildClassKey(classId: string): string {
  return `${CACHE_PREFIXES.CLASS}:${classId}`;
}

export function buildClassListKey(filters: Record<string, unknown> = {}): string {
  const filterHash = hashFilters(filters);
  return `${CACHE_PREFIXES.CLASS}:${CACHE_PREFIXES.LIST}:${filterHash}`;
}

export function buildUserKey(userId: string): string {
  return `${CACHE_PREFIXES.USER}:${userId}`;
}

export function buildUserProgressKey(userId: string): string {
  return `${CACHE_PREFIXES.USER}:${userId}:${CACHE_PREFIXES.PROGRESS}`;
}

export function buildUserFavoritesKey(userId: string, type?: string): string {
  if (type) {
    return `${CACHE_PREFIXES.USER}:${userId}:${CACHE_PREFIXES.FAVORITES}:${type}`;
  }
  return `${CACHE_PREFIXES.USER}:${userId}:${CACHE_PREFIXES.FAVORITES}`;
}

export function buildUserPreferencesKey(userId: string): string {
  return `${CACHE_PREFIXES.USER}:${userId}:${CACHE_PREFIXES.PREFERENCES}`;
}

export function buildUserSubscriptionsKey(userId: string): string {
  return `${CACHE_PREFIXES.USER}:${userId}:${CACHE_PREFIXES.SUBSCRIPTIONS}`;
}

export function buildTagsKey(type?: string): string {
  if (type) {
    return `${CACHE_PREFIXES.TAG}:${type}`;
  }
  return `${CACHE_PREFIXES.TAG}:${CACHE_PREFIXES.ALL}`;
}

export function buildStatsKey(type: string): string {
  return `${CACHE_PREFIXES.STATS}:${type}`;
}

export function buildSearchKey(query: string, filters: Record<string, unknown> = {}): string {
  const queryHash = createHash('md5').update(query.toLowerCase().trim()).digest('hex').substring(0, 8);
  const filterHash = hashFilters(filters);
  return `${CACHE_PREFIXES.SEARCH}:${queryHash}:${filterHash}`;
}

export function buildApiKeyValidationKey(keyPrefix: string): string {
  return `${CACHE_PREFIXES.API_KEY}:${keyPrefix}`;
}

export function buildSessionKey(sessionId: string): string {
  return `${CACHE_PREFIXES.SESSION}:${sessionId}`;
}

// Export all as a service object for convenience
export const cacheService = {
  get,
  set,
  del,
  delByPattern,
  exists,
  ttl,
  incr,
  decr,
  mget,
  mset,
  flush,
  getOrSet,
  getStats,
  getKeys,
  resetStats,
  isCacheAvailable,
  // Key builders
  buildProgramKey,
  buildProgramListKey,
  buildPoseKey,
  buildPoseListKey,
  buildChallengeKey,
  buildChallengeListKey,
  buildClassKey,
  buildClassListKey,
  buildUserKey,
  buildUserProgressKey,
  buildUserFavoritesKey,
  buildUserPreferencesKey,
  buildUserSubscriptionsKey,
  buildTagsKey,
  buildStatsKey,
  buildSearchKey,
  buildApiKeyValidationKey,
  buildSessionKey,
};
