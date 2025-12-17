import type { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import {
  get,
  set,
  del,
  delByPattern,
  ttl as getTtl,
} from '../services/cacheService';
import { CACHE_TTL } from '../constants/cacheTTL';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

type KeyBuilder = (req: Request) => string;
type InvalidationPattern = string | ((req: Request) => string);

/**
 * Check if request should skip cache
 */
function shouldSkipCache(req: Request): boolean {
  // Check Cache-Control header
  const cacheControl = req.headers['cache-control'];
  if (cacheControl === 'no-cache' || cacheControl === 'no-store') {
    return true;
  }

  // Check X-Skip-Cache header
  const skipCache = req.headers['x-skip-cache'];
  if (skipCache === 'true' || skipCache === '1') {
    return true;
  }

  return false;
}

/**
 * Build a cache key from query parameters
 */
function buildQueryKey(baseKey: string, query: Record<string, unknown>): string {
  const sortedQuery = Object.keys(query)
    .sort()
    .reduce(
      (acc, key) => {
        const value = query[key];
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, unknown>
    );

  if (Object.keys(sortedQuery).length === 0) {
    return baseKey;
  }

  const hash = createHash('md5')
    .update(JSON.stringify(sortedQuery))
    .digest('hex')
    .substring(0, 8);

  return `${baseKey}:${hash}`;
}

/**
 * Middleware to cache response
 */
export function cacheResponse(keyBuilder: KeyBuilder, ttlSeconds: number = CACHE_TTL.DEFAULT) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!config.cache.enabled) {
      next();
      return;
    }

    // Skip cache for non-GET requests
    if (req.method !== 'GET') {
      next();
      return;
    }

    // Check if should skip cache
    if (shouldSkipCache(req)) {
      res.setHeader('X-Cache', 'SKIP');
      next();
      return;
    }

    const cacheKey = keyBuilder(req);

    try {
      // Try to get from cache
      const cached = await get<{ data: unknown; statusCode: number }>(cacheKey);

      if (cached !== null) {
        // Cache hit
        const remainingTtl = await getTtl(cacheKey);
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-TTL', Math.max(0, remainingTtl).toString());

        if (config.cache.debug) {
          res.setHeader('X-Cache-Key', cacheKey);
        }

        res.status(cached.statusCode).json(cached.data);
        return;
      }

      // Cache miss - intercept response
      res.setHeader('X-Cache', 'MISS');

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache the response
      res.json = function (data: unknown): Response {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          void set(cacheKey, { data, statusCode: res.statusCode }, ttlSeconds);
        }

        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error({ error, cacheKey }, 'Cache middleware error');
      next();
    }
  };
}

/**
 * Middleware to cache response with query-based key
 */
export function cacheByQuery(baseKey: string, ttlSeconds: number = CACHE_TTL.DEFAULT) {
  return cacheResponse(
    (req) => buildQueryKey(baseKey, req.query as Record<string, unknown>),
    ttlSeconds
  );
}

/**
 * Middleware to cache user-specific responses
 */
export function cacheByUser(keyBuilder: KeyBuilder, ttlSeconds: number = CACHE_TTL.DEFAULT) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!config.cache.enabled) {
      next();
      return;
    }

    // Skip cache for non-GET requests
    if (req.method !== 'GET') {
      next();
      return;
    }

    // Skip if no user
    const userId = req.user?.userId;
    if (!userId) {
      next();
      return;
    }

    // Check if should skip cache
    if (shouldSkipCache(req)) {
      res.setHeader('X-Cache', 'SKIP');
      next();
      return;
    }

    // Build cache key with user prefix
    const baseCacheKey = keyBuilder(req);
    const cacheKey = `user:${userId}:${baseCacheKey}`;

    try {
      // Try to get from cache
      const cached = await get<{ data: unknown; statusCode: number }>(cacheKey);

      if (cached !== null) {
        const remainingTtl = await getTtl(cacheKey);
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-TTL', Math.max(0, remainingTtl).toString());

        if (config.cache.debug) {
          res.setHeader('X-Cache-Key', cacheKey);
        }

        res.status(cached.statusCode).json(cached.data);
        return;
      }

      // Cache miss
      res.setHeader('X-Cache', 'MISS');

      const originalJson = res.json.bind(res);

      res.json = function (data: unknown): Response {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          void set(cacheKey, { data, statusCode: res.statusCode }, ttlSeconds);
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error({ error, cacheKey }, 'Cache by user middleware error');
      next();
    }
  };
}

/**
 * Middleware to skip cache (force fresh data)
 */
export function skipCache(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Cache', 'SKIP');
  next();
}

/**
 * Middleware to clear cache on successful mutation
 */
export function clearCacheOnSuccess(patterns: InvalidationPattern[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to clear cache after successful response
    res.json = function (data: unknown): Response {
      // Only clear cache on successful mutations
      if (
        res.statusCode >= 200 &&
        res.statusCode < 300 &&
        ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)
      ) {
        // Clear cache patterns asynchronously
        void (async () => {
          for (const pattern of patterns) {
            try {
              const resolvedPattern = typeof pattern === 'function' ? pattern(req) : pattern;

              if (resolvedPattern.includes('*')) {
                await delByPattern(resolvedPattern);
              } else {
                await del(resolvedPattern);
              }

              if (config.cache.debug) {
                logger.debug({ pattern: resolvedPattern }, 'Cache cleared after mutation');
              }
            } catch (error) {
              logger.error({ error, pattern }, 'Error clearing cache after mutation');
            }
          }
        })();
      }

      return originalJson(data);
    };

    next();
  };
}

/**
 * Middleware to set no-cache headers
 */
export function noCache(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
}

/**
 * Middleware to set cache headers for static content
 */
export function staticCache(maxAge: number = 3600) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    res.setHeader('Cache-Control', `public, max-age=${maxAge}, immutable`);
    next();
  };
}

// Export helpers
export const cacheMiddleware = {
  cacheResponse,
  cacheByQuery,
  cacheByUser,
  skipCache,
  clearCacheOnSuccess,
  noCache,
  staticCache,
  shouldSkipCache,
  buildQueryKey,
};
