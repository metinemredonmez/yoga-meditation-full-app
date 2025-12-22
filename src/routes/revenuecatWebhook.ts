import { Router } from 'express';
import { handleRevenueCatWebhook } from '../controllers/revenuecatWebhookController';

const router = Router();

/**
 * @swagger
 * /api/webhooks/revenuecat:
 *   post:
 *     summary: Handle RevenueCat webhook events
 *     tags: [Webhooks]
 *     description: |
 *       Receives subscription events from RevenueCat.
 *       Events: INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION, etc.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                   app_user_id:
 *                     type: string
 *                   product_id:
 *                     type: string
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */
router.post('/', handleRevenueCatWebhook);

export default router;
