import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  getPaymentHistoryHandler,
  getPaymentHandler,
  getPaymentMethodsHandler,
  addPaymentMethodHandler,
  removePaymentMethodHandler,
  setDefaultPaymentMethodHandler,
  createSetupIntentHandler,
  requestRefundHandler,
  getPaymentRefundsHandler,
  getAllPaymentsHandler,
  processRefundHandler,
  getPaymentStatsHandler,
} from '../controllers/paymentController2';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment management
 */

// ==================== User Routes ====================

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Get user's payment history
 *     tags: [Payments]
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
 *         description: Payment history
 */
router.get('/', authenticate, getPaymentHistoryHandler);

/**
 * @swagger
 * /api/payments/{paymentId}:
 *   get:
 *     summary: Get single payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment details
 *       404:
 *         description: Payment not found
 */
router.get('/:paymentId', authenticate, getPaymentHandler);

/**
 * @swagger
 * /api/payments/{paymentId}/refunds:
 *   get:
 *     summary: Get refunds for a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of refunds
 */
router.get('/:paymentId/refunds', authenticate, getPaymentRefundsHandler);

// ==================== Payment Methods ====================

/**
 * @swagger
 * /api/payments/methods:
 *   get:
 *     summary: Get user's payment methods
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payment methods
 */
router.get('/methods', authenticate, getPaymentMethodsHandler);

/**
 * @swagger
 * /api/payments/methods/add:
 *   post:
 *     summary: Add new payment method
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethodId
 *             properties:
 *               paymentMethodId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment method added
 */
router.post('/methods/add', authenticate, addPaymentMethodHandler);

/**
 * @swagger
 * /api/payments/methods/{paymentMethodId}:
 *   delete:
 *     summary: Remove payment method
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentMethodId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment method removed
 */
router.delete('/methods/:paymentMethodId', authenticate, removePaymentMethodHandler);

/**
 * @swagger
 * /api/payments/methods/default:
 *   post:
 *     summary: Set default payment method
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethodId
 *             properties:
 *               paymentMethodId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Default payment method set
 */
router.post('/methods/default', authenticate, setDefaultPaymentMethodHandler);

/**
 * @swagger
 * /api/payments/setup-intent:
 *   post:
 *     summary: Create setup intent for adding payment method
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Setup intent created
 */
router.post('/setup-intent', authenticate, createSetupIntentHandler);

// ==================== Refunds ====================

/**
 * @swagger
 * /api/payments/refund:
 *   post:
 *     summary: Request a refund
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *             properties:
 *               paymentId:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund requested
 */
router.post('/refund', authenticate, requestRefundHandler);

// ==================== Admin Routes ====================

/**
 * @swagger
 * /api/payments/admin/all:
 *   get:
 *     summary: Get all payments (admin)
 *     tags: [Payments]
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
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: provider
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: All payments
 */
router.get('/admin/all', authenticate, requireAdmin, getAllPaymentsHandler);

/**
 * @swagger
 * /api/payments/admin/refund:
 *   post:
 *     summary: Process refund (admin)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *             properties:
 *               paymentId:
 *                 type: string
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund processed
 */
router.post('/admin/refund', authenticate, requireAdmin, processRefundHandler);

/**
 * @swagger
 * /api/payments/admin/stats:
 *   get:
 *     summary: Get payment statistics (admin)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Payment statistics
 */
router.get('/admin/stats', authenticate, requireAdmin, getPaymentStatsHandler);

export default router;
