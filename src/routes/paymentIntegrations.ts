import { Router } from 'express';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth';
import {
  getPaymentIntegrations,
  getPaymentIntegration,
  updatePaymentIntegration,
  togglePaymentIntegration,
  testPaymentIntegration,
} from '../controllers/paymentIntegrationsController';

const router = Router();

// All routes require SUPER_ADMIN
router.use(authenticateToken, requireSuperAdmin);

/**
 * @openapi
 * /api/admin/payment-integrations:
 *   get:
 *     tags:
 *       - Payment Integrations
 *     summary: Get all payment integrations
 *     description: Returns list of all payment provider integrations (SUPER_ADMIN only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payment integrations
 *       403:
 *         description: Super Admin access required
 */
router.get('/', getPaymentIntegrations);

/**
 * @openapi
 * /api/admin/payment-integrations/{provider}:
 *   get:
 *     tags:
 *       - Payment Integrations
 *     summary: Get single payment integration details
 *     description: Returns full details of a specific provider (SUPER_ADMIN only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [stripe, paypal, iyzico, apple, google]
 *     responses:
 *       200:
 *         description: Integration details
 *       403:
 *         description: Super Admin access required
 */
router.get('/:provider', getPaymentIntegration);

/**
 * @openapi
 * /api/admin/payment-integrations:
 *   put:
 *     tags:
 *       - Payment Integrations
 *     summary: Update payment integration
 *     description: Configure or update a payment provider (SUPER_ADMIN only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [stripe, paypal, iyzico, apple, google]
 *               apiKey:
 *                 type: string
 *               secretKey:
 *                 type: string
 *               webhookSecret:
 *                 type: string
 *               sandboxMode:
 *                 type: boolean
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Integration updated
 *       400:
 *         description: Validation error
 *       403:
 *         description: Super Admin access required
 */
router.put('/', updatePaymentIntegration);

/**
 * @openapi
 * /api/admin/payment-integrations/{provider}/toggle:
 *   post:
 *     tags:
 *       - Payment Integrations
 *     summary: Toggle integration active status
 *     description: Enable or disable a payment provider (SUPER_ADMIN only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status toggled
 *       400:
 *         description: Cannot enable without API keys
 *       403:
 *         description: Super Admin access required
 *       404:
 *         description: Integration not configured
 */
router.post('/:provider/toggle', togglePaymentIntegration);

/**
 * @openapi
 * /api/admin/payment-integrations/{provider}/test:
 *   post:
 *     tags:
 *       - Payment Integrations
 *     summary: Test integration connection
 *     description: Verify that the integration is properly configured (SUPER_ADMIN only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test result
 *       400:
 *         description: API keys not configured
 *       403:
 *         description: Super Admin access required
 *       404:
 *         description: Integration not configured
 */
router.post('/:provider/test', testPaymentIntegration);

export default router;
