import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  getCurrentSubscriptionHandler,
  getSubscriptionStatusHandler,
  getSubscriptionHistoryHandler,
  checkActiveSubscriptionHandler,
  createCheckoutHandler,
  verifyApplePurchaseHandler,
  restoreApplePurchasesHandler,
  verifyGooglePurchaseHandler,
  restoreGooglePurchasesHandler,
  cancelSubscriptionHandler,
  resumeSubscriptionHandler,
  changePlanHandler,
  grantSubscriptionHandler,
  extendSubscriptionHandler,
  getSubscriptionByIdHandler,
} from '../controllers/subscriptionController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Subscription
 *   description: Subscription management
 */

// ==================== User Routes ====================

/**
 * @swagger
 * /api/subscription:
 *   get:
 *     summary: Get current user's subscription
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current subscription
 */
router.get('/', authenticate, getCurrentSubscriptionHandler);

/**
 * @swagger
 * /api/subscription/status:
 *   get:
 *     summary: Get subscription status
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription status details
 */
router.get('/status', authenticate, getSubscriptionStatusHandler);

/**
 * @swagger
 * /api/subscription/history:
 *   get:
 *     summary: Get subscription history
 *     tags: [Subscription]
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
 *     responses:
 *       200:
 *         description: Subscription history
 */
router.get('/history', authenticate, getSubscriptionHistoryHandler);

/**
 * @swagger
 * /api/subscription/check:
 *   get:
 *     summary: Check if user has active subscription
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active subscription check result
 */
router.get('/check', authenticate, checkActiveSubscriptionHandler);

// ==================== Stripe Checkout ====================

/**
 * @swagger
 * /api/subscription/checkout:
 *   post:
 *     summary: Create Stripe checkout session
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *               interval:
 *                 type: string
 *                 enum: [monthly, yearly]
 *     responses:
 *       200:
 *         description: Checkout session created
 */
router.post('/checkout', authenticate, createCheckoutHandler);

// ==================== Apple IAP ====================

/**
 * @swagger
 * /api/subscription/apple/verify:
 *   post:
 *     summary: Verify Apple purchase
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiptData
 *               - productId
 *             properties:
 *               receiptData:
 *                 type: string
 *               productId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Purchase verified
 *       400:
 *         description: Verification failed
 */
router.post('/apple/verify', authenticate, verifyApplePurchaseHandler);

/**
 * @swagger
 * /api/subscription/apple/restore:
 *   post:
 *     summary: Restore Apple purchases
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiptData
 *             properties:
 *               receiptData:
 *                 type: string
 *     responses:
 *       200:
 *         description: Purchases restored
 */
router.post('/apple/restore', authenticate, restoreApplePurchasesHandler);

// ==================== Google Play ====================

/**
 * @swagger
 * /api/subscription/google/verify:
 *   post:
 *     summary: Verify Google Play purchase
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - purchaseToken
 *               - productId
 *             properties:
 *               purchaseToken:
 *                 type: string
 *               productId:
 *                 type: string
 *               isSubscription:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Purchase verified
 *       400:
 *         description: Verification failed
 */
router.post('/google/verify', authenticate, verifyGooglePurchaseHandler);

/**
 * @swagger
 * /api/subscription/google/restore:
 *   post:
 *     summary: Restore Google Play purchases
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - purchases
 *             properties:
 *               purchases:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     purchaseToken:
 *                       type: string
 *                     productId:
 *                       type: string
 *     responses:
 *       200:
 *         description: Purchases restored
 */
router.post('/google/restore', authenticate, restoreGooglePurchasesHandler);

// ==================== Subscription Management ====================

/**
 * @swagger
 * /api/subscription/cancel:
 *   post:
 *     summary: Cancel subscription
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscriptionId
 *             properties:
 *               subscriptionId:
 *                 type: string
 *               reason:
 *                 type: string
 *               immediate:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Subscription cancelled
 */
router.post('/cancel', authenticate, cancelSubscriptionHandler);

/**
 * @swagger
 * /api/subscription/resume:
 *   post:
 *     summary: Resume cancelled subscription
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscriptionId
 *             properties:
 *               subscriptionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subscription resumed
 */
router.post('/resume', authenticate, resumeSubscriptionHandler);

/**
 * @swagger
 * /api/subscription/change-plan:
 *   post:
 *     summary: Change subscription plan
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscriptionId
 *               - newPlanId
 *             properties:
 *               subscriptionId:
 *                 type: string
 *               newPlanId:
 *                 type: string
 *               immediate:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Plan changed
 */
router.post('/change-plan', authenticate, changePlanHandler);

// ==================== Admin Routes ====================

/**
 * @swagger
 * /api/subscription/admin/{subscriptionId}:
 *   get:
 *     summary: Get subscription by ID (admin)
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subscription details
 */
router.get('/admin/:subscriptionId', authenticate, requireAdmin, getSubscriptionByIdHandler);

/**
 * @swagger
 * /api/subscription/admin/grant:
 *   post:
 *     summary: Grant subscription to user (admin)
 *     tags: [Subscription]
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
 *               - planId
 *               - durationDays
 *             properties:
 *               userId:
 *                 type: string
 *               planId:
 *                 type: string
 *               durationDays:
 *                 type: integer
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Subscription granted
 */
router.post('/admin/grant', authenticate, requireAdmin, grantSubscriptionHandler);

/**
 * @swagger
 * /api/subscription/admin/extend:
 *   post:
 *     summary: Extend subscription (admin)
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscriptionId
 *               - additionalDays
 *             properties:
 *               subscriptionId:
 *                 type: string
 *               additionalDays:
 *                 type: integer
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subscription extended
 */
router.post('/admin/extend', authenticate, requireAdmin, extendSubscriptionHandler);

export default router;
