import { Router } from 'express';
import * as adminLiveStreamController from '../controllers/adminLiveStreamController';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRoles('ADMIN'));

// ============================================
// Stream Management
// ============================================

/**
 * @swagger
 * /api/admin/live-streams:
 *   get:
 *     summary: Get all streams
 *     tags: [Admin Live Streams]
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
 *           enum: [SCHEDULED, LIVE, ENDED, CANCELLED]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of all streams
 */
router.get('/', adminLiveStreamController.getAllStreams);

/**
 * @swagger
 * /api/admin/live-streams/analytics:
 *   get:
 *     summary: Get stream analytics
 *     tags: [Admin Live Streams]
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
 *         description: Stream analytics
 */
router.get('/analytics', adminLiveStreamController.getStreamAnalytics);

/**
 * @swagger
 * /api/admin/live-streams/analytics/daily:
 *   get:
 *     summary: Get daily stream stats
 *     tags: [Admin Live Streams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Daily stream statistics
 */
router.get('/analytics/daily', adminLiveStreamController.getDailyStreamStats);

/**
 * @swagger
 * /api/admin/live-streams/schedules:
 *   get:
 *     summary: Get all schedules
 *     tags: [Admin Live Streams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all schedules
 */
router.get('/schedules', adminLiveStreamController.getAllSchedules);

/**
 * @swagger
 * /api/admin/live-streams/schedules/{scheduleId}/toggle:
 *   post:
 *     summary: Toggle schedule active status
 *     tags: [Admin Live Streams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Schedule status toggled
 */
router.post('/schedules/:scheduleId/toggle', adminLiveStreamController.toggleScheduleStatus);

/**
 * @swagger
 * /api/admin/live-streams/{id}:
 *   get:
 *     summary: Get stream details
 *     tags: [Admin Live Streams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stream details
 */
router.get('/:id', adminLiveStreamController.getStreamDetails);

/**
 * @swagger
 * /api/admin/live-streams/{id}/end:
 *   post:
 *     summary: Force end stream
 *     tags: [Admin Live Streams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stream ended
 */
router.post('/:id/end', adminLiveStreamController.forceEndStream);

/**
 * @swagger
 * /api/admin/live-streams/{id}/settings:
 *   put:
 *     summary: Update stream settings
 *     tags: [Admin Live Streams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chatEnabled:
 *                 type: boolean
 *               handRaiseEnabled:
 *                 type: boolean
 *               maxParticipants:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.put('/:id/settings', adminLiveStreamController.updateStreamSettings);

/**
 * @swagger
 * /api/admin/live-streams/{id}/chat/{messageId}:
 *   delete:
 *     summary: Moderate chat (delete message)
 *     tags: [Admin Live Streams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message deleted
 */
router.delete('/:id/chat/:messageId', adminLiveStreamController.moderateChat);

export default router;
