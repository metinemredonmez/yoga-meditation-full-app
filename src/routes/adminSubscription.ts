import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';
import {
  grantSubscription,
  revokeSubscription,
  extendSubscription,
  getUserSubscription,
  listSubscriptions,
  getSubscriptionStats,
} from '../controllers/adminSubscriptionController';

const router = Router();

// All routes require authentication and ADMIN role only
router.use(authenticateToken);
router.use(requireRoles('ADMIN', 'SUPER_ADMIN'));
router.use(authRateLimiter);

// ============================================
// Subscription Management
// ============================================

/**
 * @openapi
 * /api/admin/subscriptions:
 *   get:
 *     tags:
 *       - Admin - Subscriptions
 *     summary: List all subscriptions with filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: tier
 *         schema:
 *           type: string
 *           enum: [FREE, PREMIUM, FAMILY]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, CANCELLED, EXPIRED]
 *       - in: query
 *         name: isManual
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: provider
 *         schema:
 *           type: string
 *           enum: [STRIPE, APPLE, GOOGLE, MANUAL]
 *     responses:
 *       200:
 *         description: Subscriptions list
 */
router.get('/', listSubscriptions);

/**
 * @openapi
 * /api/admin/subscriptions/stats:
 *   get:
 *     tags:
 *       - Admin - Subscriptions
 *     summary: Get subscription statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription statistics
 */
router.get('/stats', getSubscriptionStats);

/**
 * @openapi
 * /api/admin/subscriptions/user/{userId}:
 *   get:
 *     tags:
 *       - Admin - Subscriptions
 *     summary: Get user's subscription details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User subscription details
 */
router.get('/user/:userId', getUserSubscription);

/**
 * @openapi
 * /api/admin/subscriptions/grant:
 *   post:
 *     tags:
 *       - Admin - Subscriptions
 *     summary: Grant premium subscription to a user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - tier
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID to grant subscription
 *               tier:
 *                 type: string
 *                 enum: [FREE, PREMIUM, FAMILY]
 *                 description: Subscription tier
 *               durationMonths:
 *                 type: integer
 *                 default: 12
 *                 description: Duration in months
 *               reason:
 *                 type: string
 *                 description: Reason for granting subscription
 *     responses:
 *       200:
 *         description: Subscription granted successfully
 */
router.post('/grant', grantSubscription);

/**
 * @openapi
 * /api/admin/subscriptions/revoke:
 *   post:
 *     tags:
 *       - Admin - Subscriptions
 *     summary: Revoke subscription from a user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID to revoke subscription
 *               reason:
 *                 type: string
 *                 description: Reason for revoking subscription
 *     responses:
 *       200:
 *         description: Subscription revoked successfully
 */
router.post('/revoke', revokeSubscription);

/**
 * @openapi
 * /api/admin/subscriptions/extend:
 *   post:
 *     tags:
 *       - Admin - Subscriptions
 *     summary: Extend subscription duration
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - additionalMonths
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID
 *               additionalMonths:
 *                 type: integer
 *                 description: Additional months to add
 *               reason:
 *                 type: string
 *                 description: Reason for extension
 *     responses:
 *       200:
 *         description: Subscription extended successfully
 */
router.post('/extend', extendSubscription);

export default router;
