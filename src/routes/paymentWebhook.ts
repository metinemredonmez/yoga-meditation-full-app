import { Router, raw } from 'express';
import { handleStripeWebhook } from '../webhooks/stripeWebhook';
import { handleAppleWebhook, handleAppleWebhookV1 } from '../webhooks/appleWebhook';
import { handleGoogleWebhook, handleGoogleVoidedPurchases, verifyGooglePubSubAuth } from '../webhooks/googleWebhook';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payment Webhooks
 *   description: Payment provider webhook endpoints
 */

// ==================== Stripe Webhook ====================

/**
 * @swagger
 * /api/payment-webhooks/stripe:
 *   post:
 *     summary: Stripe webhook endpoint
 *     tags: [Payment Webhooks]
 *     description: Receives Stripe webhook events. Requires raw body for signature verification.
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid signature or payload
 *       500:
 *         description: Processing error
 */
// Note: Stripe webhook needs raw body for signature verification
// This is handled in src/index.ts before JSON parsing middleware
router.post('/stripe', raw({ type: 'application/json' }), handleStripeWebhook);

// ==================== Apple Webhook ====================

/**
 * @swagger
 * /api/payment-webhooks/apple:
 *   post:
 *     summary: Apple App Store Server Notifications V2
 *     tags: [Payment Webhooks]
 *     description: Receives App Store Server Notifications V2 for subscription events.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               signedPayload:
 *                 type: string
 *                 description: JWS signed notification payload
 *     responses:
 *       200:
 *         description: Notification processed
 *       400:
 *         description: Invalid payload
 */
router.post('/apple', handleAppleWebhook);

/**
 * @swagger
 * /api/payment-webhooks/apple/v1:
 *   post:
 *     summary: Apple App Store Server Notifications V1 (Legacy)
 *     tags: [Payment Webhooks]
 *     description: Legacy endpoint for V1 notifications. Use V2 for new implementations.
 *     responses:
 *       200:
 *         description: Notification received
 */
router.post('/apple/v1', handleAppleWebhookV1);

// ==================== Google Play Webhook ====================

/**
 * @swagger
 * /api/payment-webhooks/google:
 *   post:
 *     summary: Google Play Real-time Developer Notifications
 *     tags: [Payment Webhooks]
 *     description: Receives Google Play RTDN via Cloud Pub/Sub push subscription.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: object
 *                 properties:
 *                   data:
 *                     type: string
 *                     description: Base64 encoded notification data
 *                   messageId:
 *                     type: string
 *     responses:
 *       200:
 *         description: Notification processed
 *       400:
 *         description: Invalid payload
 */
router.post('/google', verifyGooglePubSubAuth, handleGoogleWebhook);

/**
 * @swagger
 * /api/payment-webhooks/google/voided:
 *   post:
 *     summary: Google Play Voided Purchases
 *     tags: [Payment Webhooks]
 *     description: Endpoint for voided purchases notifications.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               packageName:
 *                 type: string
 *               voidedPurchases:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Voided purchases processed
 */
router.post('/google/voided', verifyGooglePubSubAuth, handleGoogleVoidedPurchases);

export default router;
