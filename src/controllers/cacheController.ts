import type { Request, Response, NextFunction } from 'express';
import { getStats, getKeys, delByPattern, flush, resetStats } from '../services/cacheService';
import { warmAll } from '../services/cacheWarmingService';
import { invalidateAll } from '../services/cacheInvalidationService';
import { logger } from '../utils/logger';

/**
 * Get cache statistics
 */
export async function handleGetCacheStats(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await getStats();

    const hitRate =
      stats.hits + stats.misses > 0
        ? Math.round((stats.hits / (stats.hits + stats.misses)) * 10000) / 100
        : 0;

    res.json({
      success: true,
      data: {
        ...stats,
        hitRate: `${hitRate}%`,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error getting cache stats');
    next(error);
  }
}

/**
 * Clear cache by pattern
 */
export async function handleClearCache(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { pattern } = req.query;

    if (!pattern || typeof pattern !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Pattern query parameter is required',
      });
      return;
    }

    // Validate pattern for safety
    if (pattern === '*' || pattern === '**') {
      res.status(400).json({
        success: false,
        error: 'Use /clear-all endpoint to clear all cache',
      });
      return;
    }

    const deleted = await delByPattern(pattern);

    logger.info({ pattern, deleted, adminId: req.user?.userId }, 'Cache cleared by pattern');

    res.json({
      success: true,
      data: {
        pattern,
        deletedKeys: deleted,
      },
      message: `Cleared ${deleted} cache entries matching pattern: ${pattern}`,
    });
  } catch (error) {
    logger.error({ error }, 'Error clearing cache');
    next(error);
  }
}

/**
 * Clear all cache
 */
export async function handleClearAllCache(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await invalidateAll();
    resetStats();

    logger.warn({ adminId: req.user?.userId }, 'All cache cleared');

    res.json({
      success: true,
      message: 'All cache cleared successfully',
    });
  } catch (error) {
    logger.error({ error }, 'Error clearing all cache');
    next(error);
  }
}

/**
 * Flush entire Redis database (use with extreme caution!)
 */
export async function handleFlushCache(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { confirm } = req.body;

    if (confirm !== 'FLUSH_ALL_DATA') {
      res.status(400).json({
        success: false,
        error: 'Confirmation required. Send { "confirm": "FLUSH_ALL_DATA" } in request body',
      });
      return;
    }

    const success = await flush();
    resetStats();

    logger.warn({ adminId: req.user?.userId }, 'Redis database flushed');

    res.json({
      success,
      message: success ? 'Redis database flushed' : 'Failed to flush Redis database',
    });
  } catch (error) {
    logger.error({ error }, 'Error flushing cache');
    next(error);
  }
}

/**
 * Warm cache
 */
export async function handleWarmCache(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await warmAll();

    logger.info({ result, adminId: req.user?.userId }, 'Cache warmed');

    res.json({
      success: result.success,
      data: {
        warmed: result.warmed,
        errors: result.errors,
        durationMs: result.duration,
      },
      message: result.success
        ? `Cache warmed successfully in ${result.duration}ms`
        : `Cache warming completed with ${result.errors.length} errors`,
    });
  } catch (error) {
    logger.error({ error }, 'Error warming cache');
    next(error);
  }
}

/**
 * Get cache keys (for debugging)
 */
export async function handleGetCacheKeys(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const pattern = (req.query.pattern as string) || '*';
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);

    const keys = await getKeys(pattern, limit);

    res.json({
      success: true,
      data: {
        pattern,
        limit,
        count: keys.length,
        keys,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error getting cache keys');
    next(error);
  }
}

export const cacheController = {
  handleGetCacheStats,
  handleClearCache,
  handleClearAllCache,
  handleFlushCache,
  handleWarmCache,
  handleGetCacheKeys,
};
