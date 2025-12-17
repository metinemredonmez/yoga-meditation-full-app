import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  handleUpdateProgress,
  handleGetProgress,
  handleGetUserProgress,
  handleMarkCompleted,
  handleResetProgress,
} from '../controllers/videoProgressController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @openapi
 * /api/progress/video:
 *   put:
 *     tags:
 *       - Video Progress
 *     summary: Update video watching progress
 *     description: Save or update the current watching position for a lesson. Automatically marks as completed when 90%+ watched.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lessonId
 *               - lessonType
 *               - currentTime
 *               - duration
 *             properties:
 *               lessonId:
 *                 type: string
 *                 description: ID of the program session or class
 *               lessonType:
 *                 type: string
 *                 enum: [PROGRAM_SESSION, CLASS]
 *               currentTime:
 *                 type: integer
 *                 description: Current playback position in seconds
 *                 example: 120
 *               duration:
 *                 type: integer
 *                 description: Total video duration in seconds
 *                 example: 1800
 *     responses:
 *       200:
 *         description: Progress updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 progress:
 *                   $ref: '#/components/schemas/VideoProgress'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 */
router.put('/', handleUpdateProgress);

/**
 * @openapi
 * /api/progress/video:
 *   get:
 *     tags:
 *       - Video Progress
 *     summary: Get all video progress for current user
 *     description: Returns paginated list of all video progress records
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lessonType
 *         schema:
 *           type: string
 *           enum: [PROGRAM_SESSION, CLASS]
 *         description: Filter by lesson type
 *       - in: query
 *         name: completedOnly
 *         schema:
 *           type: boolean
 *         description: Only return completed lessons
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: User progress list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/VideoProgress'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       401:
 *         description: Authentication required
 */
router.get('/', handleGetUserProgress);

/**
 * @openapi
 * /api/progress/video/{lessonId}:
 *   get:
 *     tags:
 *       - Video Progress
 *     summary: Get progress for a specific lesson
 *     description: Returns the watching progress for a specific lesson (resume from where you left)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the program session or class
 *       - in: query
 *         name: lessonType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [PROGRAM_SESSION, CLASS]
 *     responses:
 *       200:
 *         description: Lesson progress
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 progress:
 *                   $ref: '#/components/schemas/VideoProgress'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 */
router.get('/:lessonId', handleGetProgress);

/**
 * @openapi
 * /api/progress/video/{lessonId}/complete:
 *   post:
 *     tags:
 *       - Video Progress
 *     summary: Mark a lesson as completed
 *     description: Manually mark a lesson as completed (100% progress)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lessonType
 *             properties:
 *               lessonType:
 *                 type: string
 *                 enum: [PROGRAM_SESSION, CLASS]
 *     responses:
 *       200:
 *         description: Lesson marked as completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 progress:
 *                   $ref: '#/components/schemas/VideoProgress'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 */
router.post('/:lessonId/complete', handleMarkCompleted);

/**
 * @openapi
 * /api/progress/video/{lessonId}:
 *   delete:
 *     tags:
 *       - Video Progress
 *     summary: Reset progress for a lesson
 *     description: Delete progress record to start fresh
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: lessonType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [PROGRAM_SESSION, CLASS]
 *     responses:
 *       204:
 *         description: Progress reset successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 *       404:
 *         description: No progress found
 */
router.delete('/:lessonId', handleResetProgress);

export default router;

/**
 * @openapi
 * components:
 *   schemas:
 *     VideoProgress:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         lessonId:
 *           type: string
 *         lessonType:
 *           type: string
 *           enum: [PROGRAM_SESSION, CLASS]
 *         currentTime:
 *           type: integer
 *           description: Current position in seconds
 *         duration:
 *           type: integer
 *           description: Total duration in seconds
 *         percentage:
 *           type: number
 *           description: Completion percentage (0-100)
 *         completed:
 *           type: boolean
 *         lastWatchedAt:
 *           type: string
 *           format: date-time
 */
