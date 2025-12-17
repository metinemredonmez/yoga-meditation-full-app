import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validateRequest';
import {
  handleGetBlockedIPs,
  handleBlockIP,
  handleUnblockIP,
  handleGetRateLimitStats,
  handleResetUserRateLimit,
} from '../controllers/rateLimitController';
import {
  blockIPBodySchema,
  unblockIPParamsSchema,
  resetUserRateLimitParamsSchema,
  rateLimitStatsQuerySchema,
} from '../validation/rateLimitSchemas';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Rate Limit
 *   description: Rate limit management (Admin only)
 */

/**
 * @swagger
 * /api/admin/rate-limit/blocked-ips:
 *   get:
 *     summary: Get list of blocked IPs
 *     tags: [Rate Limit]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of blocked IPs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       ipAddress:
 *                         type: string
 *                       reason:
 *                         type: string
 *                       blockedBy:
 *                         type: string
 *                       blockedAt:
 *                         type: string
 *                         format: date-time
 *                       expiresAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       isActive:
 *                         type: boolean
 *                 count:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get(
  '/blocked-ips',
  authenticateToken,
  requireRoles('ADMIN'),
  handleGetBlockedIPs
);

/**
 * @swagger
 * /api/admin/rate-limit/block-ip:
 *   post:
 *     summary: Block an IP address
 *     tags: [Rate Limit]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ipAddress
 *               - reason
 *             properties:
 *               ipAddress:
 *                 type: string
 *                 description: IP address to block
 *                 example: "192.168.1.100"
 *               reason:
 *                 type: string
 *                 description: Reason for blocking
 *                 example: "Suspicious activity detected"
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: When the block expires (optional, null = permanent)
 *                 example: "2024-12-31T23:59:59Z"
 *     responses:
 *       200:
 *         description: IP blocked successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.post(
  '/block-ip',
  authenticateToken,
  requireRoles('ADMIN'),
  validateBody(blockIPBodySchema),
  handleBlockIP
);

/**
 * @swagger
 * /api/admin/rate-limit/block-ip/{ipAddress}:
 *   delete:
 *     summary: Unblock an IP address
 *     tags: [Rate Limit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ipAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: IP address to unblock
 *     responses:
 *       200:
 *         description: IP unblocked successfully
 *       400:
 *         description: Invalid IP address
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.delete(
  '/block-ip/:ipAddress',
  authenticateToken,
  requireRoles('ADMIN'),
  validateParams(unblockIPParamsSchema),
  handleUnblockIP
);

/**
 * @swagger
 * /api/admin/rate-limit/stats:
 *   get:
 *     summary: Get rate limit statistics
 *     tags: [Rate Limit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering
 *     responses:
 *       200:
 *         description: Rate limit statistics
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
 *                     totalBlocked:
 *                       type: integer
 *                     blockedByEndpoint:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           endpoint:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     blockedByIdentifier:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           identifier:
 *                             type: string
 *                           count:
 *                             type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get(
  '/stats',
  authenticateToken,
  requireRoles('ADMIN'),
  validateQuery(rateLimitStatsQuerySchema),
  handleGetRateLimitStats
);

/**
 * @swagger
 * /api/admin/rate-limit/reset/{userId}:
 *   post:
 *     summary: Reset rate limits for a user
 *     tags: [Rate Limit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID whose rate limits should be reset
 *     responses:
 *       200:
 *         description: Rate limits reset successfully
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       500:
 *         description: Failed to reset (Redis may not be available)
 */
router.post(
  '/reset/:userId',
  authenticateToken,
  requireRoles('ADMIN'),
  validateParams(resetUserRateLimitParamsSchema),
  handleResetUserRateLimit
);

export default router;
