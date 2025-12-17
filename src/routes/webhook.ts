import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validateRequest';
import {
  handleCreateEndpoint,
  handleUpdateEndpoint,
  handleDeleteEndpoint,
  handleGetEndpoint,
  handleListEndpoints,
  handleTestEndpoint,
  handleRotateSecret,
  handleEnableEndpoint,
  handleDisableEndpoint,
  handleListDeliveries,
  handleGetDelivery,
  handleRetryDelivery,
  handleCancelDelivery,
  handleGetDeliveryStats,
  handleGetAvailableEvents,
} from '../controllers/webhookController';
import {
  createEndpointBodySchema,
  updateEndpointBodySchema,
  endpointIdParamsSchema,
  deliveryIdParamsSchema,
  listDeliveriesQuerySchema,
} from '../validation/webhookSchemas';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/webhooks/events:
 *   get:
 *     summary: Get available webhook events
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available webhook events
 */
router.get('/events', handleGetAvailableEvents);

/**
 * @swagger
 * /api/webhooks/endpoints:
 *   get:
 *     summary: List all webhook endpoints
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of webhook endpoints
 */
router.get('/endpoints', handleListEndpoints);

/**
 * @swagger
 * /api/webhooks/endpoints:
 *   post:
 *     summary: Create a new webhook endpoint
 *     tags: [Webhooks]
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
 *               - url
 *               - events
 *             properties:
 *               name:
 *                 type: string
 *               url:
 *                 type: string
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Webhook endpoint created
 */
router.post(
  '/endpoints',
  validateBody(createEndpointBodySchema),
  handleCreateEndpoint
);

/**
 * @swagger
 * /api/webhooks/endpoints/{endpointId}:
 *   get:
 *     summary: Get a webhook endpoint
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: endpointId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook endpoint details
 */
router.get(
  '/endpoints/:endpointId',
  validateParams(endpointIdParamsSchema),
  handleGetEndpoint
);

/**
 * @swagger
 * /api/webhooks/endpoints/{endpointId}:
 *   put:
 *     summary: Update a webhook endpoint
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: endpointId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               url:
 *                 type: string
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Webhook endpoint updated
 */
router.put(
  '/endpoints/:endpointId',
  validateParams(endpointIdParamsSchema),
  validateBody(updateEndpointBodySchema),
  handleUpdateEndpoint
);

/**
 * @swagger
 * /api/webhooks/endpoints/{endpointId}:
 *   delete:
 *     summary: Delete a webhook endpoint
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: endpointId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook endpoint deleted
 */
router.delete(
  '/endpoints/:endpointId',
  validateParams(endpointIdParamsSchema),
  handleDeleteEndpoint
);

/**
 * @swagger
 * /api/webhooks/endpoints/{endpointId}/test:
 *   post:
 *     summary: Test a webhook endpoint
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: endpointId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test webhook queued
 */
router.post(
  '/endpoints/:endpointId/test',
  validateParams(endpointIdParamsSchema),
  handleTestEndpoint
);

/**
 * @swagger
 * /api/webhooks/endpoints/{endpointId}/rotate-secret:
 *   post:
 *     summary: Rotate webhook secret
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: endpointId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Secret rotated
 */
router.post(
  '/endpoints/:endpointId/rotate-secret',
  validateParams(endpointIdParamsSchema),
  handleRotateSecret
);

/**
 * @swagger
 * /api/webhooks/endpoints/{endpointId}/enable:
 *   post:
 *     summary: Enable a webhook endpoint
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: endpointId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Endpoint enabled
 */
router.post(
  '/endpoints/:endpointId/enable',
  validateParams(endpointIdParamsSchema),
  handleEnableEndpoint
);

/**
 * @swagger
 * /api/webhooks/endpoints/{endpointId}/disable:
 *   post:
 *     summary: Disable a webhook endpoint
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: endpointId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Endpoint disabled
 */
router.post(
  '/endpoints/:endpointId/disable',
  validateParams(endpointIdParamsSchema),
  handleDisableEndpoint
);

/**
 * @swagger
 * /api/webhooks/endpoints/{endpointId}/stats:
 *   get:
 *     summary: Get delivery statistics for an endpoint
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: endpointId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Delivery statistics
 */
router.get(
  '/endpoints/:endpointId/stats',
  validateParams(endpointIdParamsSchema),
  handleGetDeliveryStats
);

/**
 * @swagger
 * /api/webhooks/endpoints/{endpointId}/deliveries:
 *   get:
 *     summary: List deliveries for an endpoint
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: endpointId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, SENDING, DELIVERED, FAILED]
 *       - in: query
 *         name: event
 *         schema:
 *           type: string
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
 *         description: List of deliveries
 */
router.get(
  '/endpoints/:endpointId/deliveries',
  validateParams(endpointIdParamsSchema),
  validateQuery(listDeliveriesQuerySchema),
  handleListDeliveries
);

/**
 * @swagger
 * /api/webhooks/deliveries/{deliveryId}:
 *   get:
 *     summary: Get delivery details
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deliveryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Delivery details
 */
router.get(
  '/deliveries/:deliveryId',
  validateParams(deliveryIdParamsSchema),
  handleGetDelivery
);

/**
 * @swagger
 * /api/webhooks/deliveries/{deliveryId}/retry:
 *   post:
 *     summary: Retry a failed delivery
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deliveryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Retry initiated
 */
router.post(
  '/deliveries/:deliveryId/retry',
  validateParams(deliveryIdParamsSchema),
  handleRetryDelivery
);

/**
 * @swagger
 * /api/webhooks/deliveries/{deliveryId}/cancel:
 *   post:
 *     summary: Cancel a pending delivery
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deliveryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Delivery cancelled
 */
router.post(
  '/deliveries/:deliveryId/cancel',
  validateParams(deliveryIdParamsSchema),
  handleCancelDelivery
);

export default router;
