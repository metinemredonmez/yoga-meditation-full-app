import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  getPlansHandler,
  getClientPlansHandler,
  getPlanHandler,
  createPlanHandler,
  updatePlanHandler,
  deletePlanHandler,
  hardDeletePlanHandler,
  syncPlanWithStripeHandler,
} from '../controllers/subscriptionPlanController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Subscription Plans
 *   description: Subscription plan management
 */

// ==================== Public Routes ====================

/**
 * @swagger
 * /api/plans:
 *   get:
 *     summary: Get all subscription plans
 *     tags: [Subscription Plans]
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         description: Include inactive plans (admin only)
 *     responses:
 *       200:
 *         description: List of subscription plans
 */
router.get('/', getPlansHandler);

/**
 * @swagger
 * /api/plans/client:
 *   get:
 *     summary: Get plans formatted for client
 *     tags: [Subscription Plans]
 *     parameters:
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *           enum: [ios, android, web]
 *         description: Platform for pricing
 *     responses:
 *       200:
 *         description: Client-formatted plans
 */
router.get('/client', getClientPlansHandler);

/**
 * @swagger
 * /api/plans/{planId}:
 *   get:
 *     summary: Get single plan by ID
 *     tags: [Subscription Plans]
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plan details
 *       404:
 *         description: Plan not found
 */
router.get('/:planId', getPlanHandler);

// ==================== Admin Routes ====================

/**
 * @swagger
 * /api/plans:
 *   post:
 *     summary: Create new subscription plan
 *     tags: [Subscription Plans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - tier
 *               - priceMonthly
 *               - priceYearly
 *             properties:
 *               name:
 *                 type: string
 *               tier:
 *                 type: string
 *                 enum: [FREE, BASIC, PREMIUM, ENTERPRISE]
 *               priceMonthly:
 *                 type: number
 *               priceYearly:
 *                 type: number
 *               description:
 *                 type: string
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Plan created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post('/', authenticate, requireAdmin, createPlanHandler);

/**
 * @swagger
 * /api/plans/{planId}:
 *   put:
 *     summary: Update subscription plan
 *     tags: [Subscription Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               priceMonthly:
 *                 type: number
 *               priceYearly:
 *                 type: number
 *               description:
 *                 type: string
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Plan updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Plan not found
 */
router.put('/:planId', authenticate, requireAdmin, updatePlanHandler);

/**
 * @swagger
 * /api/plans/{planId}:
 *   delete:
 *     summary: Soft delete subscription plan
 *     tags: [Subscription Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plan deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.delete('/:planId', authenticate, requireAdmin, deletePlanHandler);

/**
 * @swagger
 * /api/plans/{planId}/hard-delete:
 *   delete:
 *     summary: Permanently delete subscription plan
 *     tags: [Subscription Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plan permanently deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       400:
 *         description: Plan has active subscriptions
 */
router.delete('/:planId/hard-delete', authenticate, requireAdmin, hardDeletePlanHandler);

/**
 * @swagger
 * /api/plans/{planId}/sync-stripe:
 *   post:
 *     summary: Sync plan with Stripe
 *     tags: [Subscription Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plan synced with Stripe
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post('/:planId/sync-stripe', authenticate, requireAdmin, syncPlanWithStripeHandler);

export default router;
