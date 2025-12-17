import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  handleRegisterDevice,
  handleUnregisterDevice,
  handleGetDevices,
  handleSendTestNotification,
  handleGetNotificationStatus,
} from '../controllers/pushNotificationController';

const router = Router();

/**
 * @openapi
 * /api/notifications/status:
 *   get:
 *     tags:
 *       - Push Notifications
 *     summary: Get push notification service status
 *     description: Check if Firebase push notifications are configured
 *     responses:
 *       200:
 *         description: Service status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 configured:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.get('/status', handleGetNotificationStatus);

// All other routes require authentication
router.use(authenticateToken);

/**
 * @openapi
 * /api/notifications/devices:
 *   post:
 *     tags:
 *       - Push Notifications
 *     summary: Register a device for push notifications
 *     description: Register a device token to receive push notifications
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - platform
 *             properties:
 *               token:
 *                 type: string
 *                 description: FCM device token
 *               platform:
 *                 type: string
 *                 enum: [IOS, ANDROID, WEB]
 *               deviceName:
 *                 type: string
 *                 description: Optional device name for identification
 *                 example: "iPhone 15 Pro"
 *     responses:
 *       201:
 *         description: Device registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 device:
 *                   $ref: '#/components/schemas/DeviceToken'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 */
router.post('/devices', handleRegisterDevice);

/**
 * @openapi
 * /api/notifications/devices:
 *   delete:
 *     tags:
 *       - Push Notifications
 *     summary: Unregister a device
 *     description: Remove a device from push notification list
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: FCM device token to remove
 *     responses:
 *       204:
 *         description: Device unregistered successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Device not found
 */
router.delete('/devices', handleUnregisterDevice);

/**
 * @openapi
 * /api/notifications/devices:
 *   get:
 *     tags:
 *       - Push Notifications
 *     summary: Get registered devices
 *     description: List all devices registered for push notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of registered devices
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 devices:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DeviceToken'
 *                 count:
 *                   type: integer
 *       401:
 *         description: Authentication required
 */
router.get('/devices', handleGetDevices);

/**
 * @openapi
 * /api/notifications/test:
 *   post:
 *     tags:
 *       - Push Notifications
 *     summary: Send a test notification
 *     description: Send a test push notification to your own registered devices
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - body
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Test Notification"
 *               body:
 *                 type: string
 *                 maxLength: 500
 *                 example: "This is a test push notification"
 *               data:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *                 description: Optional custom data payload
 *     responses:
 *       200:
 *         description: Test notification sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 result:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     successCount:
 *                       type: integer
 *                     failureCount:
 *                       type: integer
 *       400:
 *         description: Validation error or no registered devices
 *       401:
 *         description: Authentication required
 *       503:
 *         description: Push notifications not configured
 */
router.post('/test', handleSendTestNotification);

export default router;

/**
 * @openapi
 * components:
 *   schemas:
 *     DeviceToken:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         platform:
 *           type: string
 *           enum: [IOS, ANDROID, WEB]
 *         deviceName:
 *           type: string
 *           nullable: true
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 */
