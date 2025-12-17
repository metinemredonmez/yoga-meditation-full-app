import { Router } from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { publicRateLimiter, authRateLimiter } from '../middleware/rateLimiter';
import {
  getHomeScreen,
  getExploreScreen,
  getUserDashboard,
  syncUserData,
  batchRequest,
  getAppConfig,
  registerDevice,
  updateDeviceToken,
  logAppEvent
} from '../controllers/mobileController';

const router = Router();

// ============================================
// Public Mobile Endpoints
// ============================================

/**
 * @openapi
 * /api/mobile/config:
 *   get:
 *     tags:
 *       - Mobile
 *     summary: Get app configuration
 *     description: Returns app settings, feature flags, minimum version requirements
 *     responses:
 *       200:
 *         description: App configuration
 */
router.get('/config', publicRateLimiter, getAppConfig);

/**
 * @openapi
 * /api/mobile/home:
 *   get:
 *     tags:
 *       - Mobile
 *     summary: Get home screen data
 *     description: Single endpoint for all home screen data (featured, continue watching, recommendations)
 *     responses:
 *       200:
 *         description: Home screen data
 */
router.get('/home', publicRateLimiter, optionalAuth, getHomeScreen);

/**
 * @openapi
 * /api/mobile/explore:
 *   get:
 *     tags:
 *       - Mobile
 *     summary: Get explore/discover screen data
 *     description: Categories, trending content, popular instructors
 *     responses:
 *       200:
 *         description: Explore screen data
 */
router.get('/explore', publicRateLimiter, optionalAuth, getExploreScreen);

// ============================================
// Authenticated Mobile Endpoints
// ============================================

/**
 * @openapi
 * /api/mobile/dashboard:
 *   get:
 *     tags:
 *       - Mobile
 *     summary: Get user dashboard data
 *     description: User stats, progress, active challenges, upcoming sessions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 */
router.get('/dashboard', authenticateToken, authRateLimiter, getUserDashboard);

/**
 * @openapi
 * /api/mobile/sync:
 *   post:
 *     tags:
 *       - Mobile
 *     summary: Sync user data
 *     description: Sync offline progress, favorites, settings with server
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lastSyncAt:
 *                 type: string
 *                 format: date-time
 *               offlineProgress:
 *                 type: array
 *               offlineFavorites:
 *                 type: array
 *               settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Sync result with updated data
 */
router.post('/sync', authenticateToken, authRateLimiter, syncUserData);

/**
 * @openapi
 * /api/mobile/batch:
 *   post:
 *     tags:
 *       - Mobile
 *     summary: Batch multiple API requests
 *     description: Execute multiple API calls in a single request
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               requests:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     method:
 *                       type: string
 *                       enum: [GET, POST, PUT, DELETE]
 *                     path:
 *                       type: string
 *                     body:
 *                       type: object
 *     responses:
 *       200:
 *         description: Batch response with results for each request
 */
router.post('/batch', authenticateToken, authRateLimiter, batchRequest);

/**
 * @openapi
 * /api/mobile/device:
 *   post:
 *     tags:
 *       - Mobile
 *     summary: Register device for push notifications
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
 *               platform:
 *                 type: string
 *                 enum: [ios, android]
 *               deviceName:
 *                 type: string
 *               appVersion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Device registered
 */
router.post('/device', authenticateToken, authRateLimiter, registerDevice);

/**
 * @openapi
 * /api/mobile/device/token:
 *   put:
 *     tags:
 *       - Mobile
 *     summary: Update device push token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token updated
 */
router.put('/device/token', authenticateToken, authRateLimiter, updateDeviceToken);

/**
 * @openapi
 * /api/mobile/events:
 *   post:
 *     tags:
 *       - Mobile
 *     summary: Log app analytics events
 *     description: Batch log multiple analytics events from mobile app
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               events:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     properties:
 *                       type: object
 *                     timestamp:
 *                       type: string
 *     responses:
 *       200:
 *         description: Events logged
 */
router.post('/events', optionalAuth, authRateLimiter, logAppEvent);

export default router;
