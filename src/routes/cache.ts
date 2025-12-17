import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/auth';
import {
  handleGetCacheStats,
  handleClearCache,
  handleClearAllCache,
  handleFlushCache,
  handleWarmCache,
  handleGetCacheKeys,
} from '../controllers/cacheController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Cache
 *   description: Cache management endpoints (Admin only)
 */

/**
 * @swagger
 * /api/admin/cache/stats:
 *   get:
 *     summary: Get cache statistics
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     hits:
 *                       type: integer
 *                       description: Number of cache hits
 *                     misses:
 *                       type: integer
 *                       description: Number of cache misses
 *                     keys:
 *                       type: integer
 *                       description: Total number of cached keys
 *                     memory:
 *                       type: string
 *                       description: Memory used by Redis
 *                     hitRate:
 *                       type: string
 *                       description: Cache hit rate percentage
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get(
  '/stats',
  authenticateToken,
  requireRoles('ADMIN'),
  handleGetCacheStats
);

/**
 * @swagger
 * /api/admin/cache/clear:
 *   delete:
 *     summary: Clear cache by pattern
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pattern
 *         required: true
 *         schema:
 *           type: string
 *         description: Pattern to match cache keys (e.g., "program:*", "user:123:*")
 *         example: "program:*"
 *     responses:
 *       200:
 *         description: Cache cleared
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     pattern:
 *                       type: string
 *                     deletedKeys:
 *                       type: integer
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid pattern
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.delete(
  '/clear',
  authenticateToken,
  requireRoles('ADMIN'),
  handleClearCache
);

/**
 * @swagger
 * /api/admin/cache/clear-all:
 *   delete:
 *     summary: Clear all application cache
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All cache cleared
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.delete(
  '/clear-all',
  authenticateToken,
  requireRoles('ADMIN'),
  handleClearAllCache
);

/**
 * @swagger
 * /api/admin/cache/flush:
 *   post:
 *     summary: Flush entire Redis database (DANGEROUS)
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - confirm
 *             properties:
 *               confirm:
 *                 type: string
 *                 description: Must be "FLUSH_ALL_DATA" to confirm
 *                 example: FLUSH_ALL_DATA
 *     responses:
 *       200:
 *         description: Database flushed
 *       400:
 *         description: Confirmation required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.post(
  '/flush',
  authenticateToken,
  requireRoles('ADMIN'),
  handleFlushCache
);

/**
 * @swagger
 * /api/admin/cache/warm:
 *   post:
 *     summary: Warm cache with frequently accessed data
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache warming result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     warmed:
 *                       type: array
 *                       items:
 *                         type: string
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: string
 *                     durationMs:
 *                       type: integer
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.post(
  '/warm',
  authenticateToken,
  requireRoles('ADMIN'),
  handleWarmCache
);

/**
 * @swagger
 * /api/admin/cache/keys:
 *   get:
 *     summary: List cache keys (for debugging)
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pattern
 *         schema:
 *           type: string
 *           default: "*"
 *         description: Pattern to match keys
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *           maximum: 500
 *         description: Maximum number of keys to return
 *     responses:
 *       200:
 *         description: List of cache keys
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     pattern:
 *                       type: string
 *                     limit:
 *                       type: integer
 *                     count:
 *                       type: integer
 *                     keys:
 *                       type: array
 *                       items:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get(
  '/keys',
  authenticateToken,
  requireRoles('ADMIN'),
  handleGetCacheKeys
);

export default router;
