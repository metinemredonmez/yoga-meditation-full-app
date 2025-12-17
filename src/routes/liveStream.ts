import { Router } from 'express';
import * as liveStreamController from '../controllers/liveStreamController';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validateRequest';
import {
  createStreamSchema,
  updateStreamSchema,
  streamIdParamsSchema,
  chatMessageSchema,
  reactionSchema,
  joinStreamSchema,
  scheduleSchema,
  updateScheduleSchema,
} from '../validation/liveStreamSchemas';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ============================================
// Public Stream Routes
// ============================================

/**
 * @swagger
 * /api/live-streams:
 *   get:
 *     summary: Get upcoming streams
 *     tags: [Live Streams]
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [YOGA_CLASS, MEDITATION, Q_AND_A, WORKSHOP, SPECIAL_EVENT]
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [BEGINNER, INTERMEDIATE, ADVANCED]
 *     responses:
 *       200:
 *         description: List of upcoming streams
 */
router.get('/', liveStreamController.getUpcomingStreams);

/**
 * @swagger
 * /api/live-streams/live:
 *   get:
 *     summary: Get currently live streams
 *     tags: [Live Streams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of live streams
 */
router.get('/live', liveStreamController.getLiveStreams);

/**
 * @swagger
 * /api/live-streams/search:
 *   get:
 *     summary: Search streams
 *     tags: [Live Streams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', liveStreamController.searchStreams);

/**
 * @swagger
 * /api/live-streams/{id}:
 *   get:
 *     summary: Get stream details
 *     tags: [Live Streams]
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
router.get('/:id', validateParams(streamIdParamsSchema), liveStreamController.getStream);

/**
 * @swagger
 * /api/live-streams/{id}/token:
 *   get:
 *     summary: Get stream token for joining
 *     tags: [Live Streams]
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
 *         description: Stream token data
 */
router.get('/:id/token', validateParams(streamIdParamsSchema), liveStreamController.getStreamToken);

// ============================================
// Instructor Stream Routes
// ============================================

/**
 * @swagger
 * /api/live-streams:
 *   post:
 *     summary: Create a new stream (Instructor only)
 *     tags: [Live Streams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStreamInput'
 *     responses:
 *       201:
 *         description: Stream created
 */
router.post('/', validateBody(createStreamSchema), liveStreamController.createStream);

/**
 * @swagger
 * /api/live-streams/my:
 *   get:
 *     summary: Get my streams (Instructor only)
 *     tags: [Live Streams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of instructor's streams
 */
router.get('/my/streams', liveStreamController.getMyStreams);

/**
 * @swagger
 * /api/live-streams/{id}:
 *   put:
 *     summary: Update stream (Instructor only)
 *     tags: [Live Streams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStreamInput'
 *     responses:
 *       200:
 *         description: Stream updated
 */
router.put(
  '/:id',
  validateParams(streamIdParamsSchema),
  validateBody(updateStreamSchema),
  liveStreamController.updateStream,
);

/**
 * @swagger
 * /api/live-streams/{id}:
 *   delete:
 *     summary: Delete stream (Instructor only)
 *     tags: [Live Streams]
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
 *         description: Stream deleted
 */
router.delete('/:id', validateParams(streamIdParamsSchema), liveStreamController.deleteStream);

/**
 * @swagger
 * /api/live-streams/{id}/start:
 *   post:
 *     summary: Start streaming (Instructor only)
 *     tags: [Live Streams]
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
 *         description: Stream started
 */
router.post('/:id/start', validateParams(streamIdParamsSchema), liveStreamController.startStream);

/**
 * @swagger
 * /api/live-streams/{id}/end:
 *   post:
 *     summary: End streaming (Instructor only)
 *     tags: [Live Streams]
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
 *         description: Stream ended
 */
router.post('/:id/end', validateParams(streamIdParamsSchema), liveStreamController.endStream);

/**
 * @swagger
 * /api/live-streams/{id}/cancel:
 *   post:
 *     summary: Cancel stream (Instructor only)
 *     tags: [Live Streams]
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
 *         description: Stream cancelled
 */
router.post('/:id/cancel', validateParams(streamIdParamsSchema), liveStreamController.cancelStream);

// ============================================
// Participant Routes
// ============================================

/**
 * @swagger
 * /api/live-streams/{id}/join:
 *   post:
 *     summary: Join stream
 *     tags: [Live Streams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agoraUid:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Joined stream
 */
router.post(
  '/:id/join',
  validateParams(streamIdParamsSchema),
  validateBody(joinStreamSchema),
  liveStreamController.joinStream,
);

/**
 * @swagger
 * /api/live-streams/{id}/leave:
 *   post:
 *     summary: Leave stream
 *     tags: [Live Streams]
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
 *         description: Left stream
 */
router.post('/:id/leave', validateParams(streamIdParamsSchema), liveStreamController.leaveStream);

/**
 * @swagger
 * /api/live-streams/{id}/participants:
 *   get:
 *     summary: Get stream participants
 *     tags: [Live Streams]
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
 *         description: List of participants
 */
router.get(
  '/:id/participants',
  validateParams(streamIdParamsSchema),
  liveStreamController.getParticipants,
);

/**
 * @swagger
 * /api/live-streams/{id}/hand/raise:
 *   post:
 *     summary: Raise hand
 *     tags: [Live Streams]
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
 *         description: Hand raised
 */
router.post('/:id/hand/raise', validateParams(streamIdParamsSchema), liveStreamController.raiseHand);

/**
 * @swagger
 * /api/live-streams/{id}/hand/lower:
 *   post:
 *     summary: Lower hand
 *     tags: [Live Streams]
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
 *         description: Hand lowered
 */
router.post('/:id/hand/lower', validateParams(streamIdParamsSchema), liveStreamController.lowerHand);

// ============================================
// Registration Routes
// ============================================

/**
 * @swagger
 * /api/live-streams/{id}/register:
 *   post:
 *     summary: Register for stream
 *     tags: [Live Streams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Registered for stream
 */
router.post(
  '/:id/register',
  validateParams(streamIdParamsSchema),
  liveStreamController.registerForStream,
);

/**
 * @swagger
 * /api/live-streams/{id}/register:
 *   delete:
 *     summary: Unregister from stream
 *     tags: [Live Streams]
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
 *         description: Unregistered from stream
 */
router.delete(
  '/:id/register',
  validateParams(streamIdParamsSchema),
  liveStreamController.unregisterFromStream,
);

/**
 * @swagger
 * /api/live-streams/{id}/registrations:
 *   get:
 *     summary: Get stream registrations
 *     tags: [Live Streams]
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
 *         description: List of registrations
 */
router.get(
  '/:id/registrations',
  validateParams(streamIdParamsSchema),
  liveStreamController.getRegistrations,
);

/**
 * @swagger
 * /api/live-streams/{id}/registration/check:
 *   get:
 *     summary: Check registration status
 *     tags: [Live Streams]
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
 *         description: Registration status
 */
router.get(
  '/:id/registration/check',
  validateParams(streamIdParamsSchema),
  liveStreamController.checkRegistration,
);

// ============================================
// Chat Routes
// ============================================

/**
 * @swagger
 * /api/live-streams/{id}/chat:
 *   get:
 *     summary: Get chat messages
 *     tags: [Live Streams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: since
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Chat messages
 */
router.get('/:id/chat', validateParams(streamIdParamsSchema), liveStreamController.getChatMessages);

/**
 * @swagger
 * /api/live-streams/{id}/chat:
 *   post:
 *     summary: Send chat message
 *     tags: [Live Streams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatMessage'
 *     responses:
 *       201:
 *         description: Message sent
 */
router.post(
  '/:id/chat',
  validateParams(streamIdParamsSchema),
  validateBody(chatMessageSchema),
  liveStreamController.sendChatMessage,
);

/**
 * @swagger
 * /api/live-streams/{id}/chat/{messageId}:
 *   delete:
 *     summary: Delete chat message
 *     tags: [Live Streams]
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
router.delete('/:id/chat/:messageId', liveStreamController.deleteChatMessage);

/**
 * @swagger
 * /api/live-streams/{id}/chat/{messageId}/pin:
 *   post:
 *     summary: Pin chat message
 *     tags: [Live Streams]
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
 *         description: Message pinned
 */
router.post('/:id/chat/:messageId/pin', liveStreamController.pinChatMessage);

/**
 * @swagger
 * /api/live-streams/{id}/chat/pinned:
 *   get:
 *     summary: Get pinned messages
 *     tags: [Live Streams]
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
 *         description: Pinned messages
 */
router.get(
  '/:id/chat/pinned',
  validateParams(streamIdParamsSchema),
  liveStreamController.getPinnedMessages,
);

// ============================================
// Reaction Routes
// ============================================

/**
 * @swagger
 * /api/live-streams/{id}/reactions:
 *   post:
 *     summary: Add reaction
 *     tags: [Live Streams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [LIKE, HEART, CLAP, NAMASTE, FIRE]
 *     responses:
 *       201:
 *         description: Reaction added
 */
router.post(
  '/:id/reactions',
  validateParams(streamIdParamsSchema),
  validateBody(reactionSchema),
  liveStreamController.addReaction,
);

/**
 * @swagger
 * /api/live-streams/{id}/reactions:
 *   get:
 *     summary: Get reaction counts
 *     tags: [Live Streams]
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
 *         description: Reaction counts
 */
router.get(
  '/:id/reactions',
  validateParams(streamIdParamsSchema),
  liveStreamController.getReactionCounts,
);

// ============================================
// Recording Routes
// ============================================

/**
 * @swagger
 * /api/live-streams/{id}/recording:
 *   get:
 *     summary: Get stream recording
 *     tags: [Live Streams]
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
 *         description: Recording data
 */
router.get(
  '/:id/recording',
  validateParams(streamIdParamsSchema),
  liveStreamController.getRecording,
);

// ============================================
// Schedule Routes
// ============================================

/**
 * @swagger
 * /api/live-streams/schedules:
 *   post:
 *     summary: Create recurring schedule (Instructor only)
 *     tags: [Live Streams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScheduleInput'
 *     responses:
 *       201:
 *         description: Schedule created
 */
router.post('/schedules', validateBody(scheduleSchema), liveStreamController.createSchedule);

/**
 * @swagger
 * /api/live-streams/schedules/my:
 *   get:
 *     summary: Get my schedules (Instructor only)
 *     tags: [Live Streams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of schedules
 */
router.get('/schedules/my', liveStreamController.getMySchedules);

/**
 * @swagger
 * /api/live-streams/schedules/{scheduleId}:
 *   put:
 *     summary: Update schedule (Instructor only)
 *     tags: [Live Streams]
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
 *         description: Schedule updated
 */
router.put(
  '/schedules/:scheduleId',
  validateBody(updateScheduleSchema),
  liveStreamController.updateSchedule,
);

/**
 * @swagger
 * /api/live-streams/schedules/{scheduleId}:
 *   delete:
 *     summary: Delete schedule (Instructor only)
 *     tags: [Live Streams]
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
 *         description: Schedule deleted
 */
router.delete('/schedules/:scheduleId', liveStreamController.deleteSchedule);

export default router;
