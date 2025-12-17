import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validateParams, validateQuery, validateBody } from '../middleware/validateRequest';
import {
  handleAdminListEndpoints,
  handleAdminGetEndpoint,
  handleAdminDisableEndpoint,
  handleAdminEnableEndpoint,
  handleAdminDeleteEndpoint,
  handleAdminListDeliveries,
  handleAdminGetStats,
  handleAdminPurgeDeliveries,
  handleAdminTriggerProcessing,
  handleAdminTriggerRetry,
  handleAdminGetProcessorStatus,
} from '../controllers/adminWebhookController';
import {
  endpointIdParamsSchema,
  adminListDeliveriesQuerySchema,
  purgeDeliveriesBodySchema,
} from '../validation/webhookSchemas';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

/**
 * @swagger
 * /api/admin/webhooks/stats:
 *   get:
 *     summary: Get webhook system statistics
 *     tags: [Admin - Webhooks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Webhook statistics
 */
router.get('/stats', handleAdminGetStats);

/**
 * @swagger
 * /api/admin/webhooks/processor/status:
 *   get:
 *     summary: Get processor status
 *     tags: [Admin - Webhooks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Processor status
 */
router.get('/processor/status', handleAdminGetProcessorStatus);

/**
 * @swagger
 * /api/admin/webhooks/processor/trigger:
 *   post:
 *     summary: Manually trigger queue processing
 *     tags: [Admin - Webhooks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Processing triggered
 */
router.post('/processor/trigger', handleAdminTriggerProcessing);

/**
 * @swagger
 * /api/admin/webhooks/processor/retry:
 *   post:
 *     summary: Manually trigger retry processing
 *     tags: [Admin - Webhooks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Retry processing triggered
 */
router.post('/processor/retry', handleAdminTriggerRetry);

/**
 * @swagger
 * /api/admin/webhooks/endpoints:
 *   get:
 *     summary: List all webhook endpoints (admin)
 *     tags: [Admin - Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
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
 *         description: List of endpoints
 */
router.get('/endpoints', handleAdminListEndpoints);

/**
 * @swagger
 * /api/admin/webhooks/endpoints/{endpointId}:
 *   get:
 *     summary: Get a specific endpoint (admin)
 *     tags: [Admin - Webhooks]
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
 *         description: Endpoint details
 */
router.get(
  '/endpoints/:endpointId',
  validateParams(endpointIdParamsSchema),
  handleAdminGetEndpoint
);

/**
 * @swagger
 * /api/admin/webhooks/endpoints/{endpointId}:
 *   delete:
 *     summary: Delete an endpoint (admin)
 *     tags: [Admin - Webhooks]
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
 *         description: Endpoint deleted
 */
router.delete(
  '/endpoints/:endpointId',
  validateParams(endpointIdParamsSchema),
  handleAdminDeleteEndpoint
);

/**
 * @swagger
 * /api/admin/webhooks/endpoints/{endpointId}/enable:
 *   post:
 *     summary: Force enable an endpoint (admin)
 *     tags: [Admin - Webhooks]
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
  handleAdminEnableEndpoint
);

/**
 * @swagger
 * /api/admin/webhooks/endpoints/{endpointId}/disable:
 *   post:
 *     summary: Force disable an endpoint (admin)
 *     tags: [Admin - Webhooks]
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
  handleAdminDisableEndpoint
);

/**
 * @swagger
 * /api/admin/webhooks/deliveries:
 *   get:
 *     summary: List all deliveries (admin)
 *     tags: [Admin - Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: endpointId
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
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
  '/deliveries',
  validateQuery(adminListDeliveriesQuerySchema),
  handleAdminListDeliveries
);

/**
 * @swagger
 * /api/admin/webhooks/deliveries/purge:
 *   post:
 *     summary: Purge old deliveries
 *     tags: [Admin - Webhooks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               daysOld:
 *                 type: integer
 *                 default: 30
 *     responses:
 *       200:
 *         description: Deliveries purged
 */
router.post(
  '/deliveries/purge',
  validateBody(purgeDeliveriesBodySchema),
  handleAdminPurgeDeliveries
);

export default router;
