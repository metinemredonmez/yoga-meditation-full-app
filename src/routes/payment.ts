import { Router } from 'express';
import { startCheckout, handleStripeWebhook } from '../controllers/paymentController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @openapi
 * /api/payments/checkout:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Start a checkout session for a subscription plan
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CheckoutRequest'
 *     responses:
 *       201:
 *         description: Checkout session created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 checkout:
 *                   $ref: '#/components/schemas/CheckoutResponse'
 */
router.post('/checkout', authenticateToken, startCheckout);

/**
 * @openapi
 * /api/payments/webhook/stripe:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Stripe webhook endpoint
 *     description: Accepts Stripe webhook events (invoice.paid, customer.subscription.updated, payment_failed).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StripeWebhookPayload'
 *     responses:
 *       200:
 *         description: Webhook processed successfully.
 */
router.post('/webhook/stripe', handleStripeWebhook);

export default router;
