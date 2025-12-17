import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { authenticatedRateLimiter } from '../middleware/rateLimiter';
import * as breathworkController from '../controllers/breathworkController';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

/**
 * @openapi
 * /api/admin/breathworks:
 *   get:
 *     tags:
 *       - Admin - Breathwork
 *     summary: Get all breathwork exercises (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title
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
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, title, durationSeconds, playCount]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: List of all breathwork exercises
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
router.get('/', authenticatedRateLimiter, breathworkController.getAdminBreathworks);

/**
 * @openapi
 * /api/admin/breathworks/stats:
 *   get:
 *     tags:
 *       - Admin - Breathwork
 *     summary: Get breathwork statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Breathwork statistics
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
router.get('/stats', authenticatedRateLimiter, breathworkController.getBreathworkStats);

/**
 * @openapi
 * /api/admin/breathworks:
 *   post:
 *     tags:
 *       - Admin - Breathwork
 *     summary: Create a new breathwork exercise
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
 *               - slug
 *               - description
 *               - category
 *               - pattern
 *               - durationSeconds
 *               - inhaleSeconds
 *               - exhaleSeconds
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               titleTr:
 *                 type: string
 *                 maxLength: 200
 *               slug:
 *                 type: string
 *                 maxLength: 200
 *               description:
 *                 type: string
 *               descriptionTr:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [CALM, FOCUS, ENERGY, SLEEP, STRESS, ANXIETY]
 *               pattern:
 *                 type: string
 *                 enum: [BOX, FOUR_SEVEN_EIGHT, ALTERNATE_NOSTRIL, RELAXATION, ENERGIZING, CUSTOM]
 *               animation:
 *                 type: string
 *                 enum: [CIRCLE, WAVE, LUNG, MINIMAL]
 *                 default: CIRCLE
 *               instructorId:
 *                 type: string
 *                 format: uuid
 *               durationSeconds:
 *                 type: integer
 *                 minimum: 1
 *               inhaleSeconds:
 *                 type: integer
 *                 minimum: 1
 *               holdInSeconds:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *               exhaleSeconds:
 *                 type: integer
 *                 minimum: 1
 *               holdOutSeconds:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *               cycles:
 *                 type: integer
 *                 minimum: 1
 *                 default: 4
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *               thumbnailUrl:
 *                 type: string
 *                 format: uri
 *               audioUrl:
 *                 type: string
 *                 format: uri
 *               backgroundMusicUrl:
 *                 type: string
 *                 format: uri
 *               voiceGuidanceUrl:
 *                 type: string
 *                 format: uri
 *               isFree:
 *                 type: boolean
 *                 default: false
 *               isPremium:
 *                 type: boolean
 *                 default: false
 *               isFeatured:
 *                 type: boolean
 *                 default: false
 *               sortOrder:
 *                 type: integer
 *                 default: 0
 *               benefits:
 *                 type: array
 *                 items:
 *                   type: string
 *               benefitsTr:
 *                 type: array
 *                 items:
 *                   type: string
 *               instructions:
 *                 type: array
 *                 items:
 *                   type: string
 *               instructionsTr:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Breathwork created
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       409:
 *         description: Slug already exists
 */
router.post('/', authenticatedRateLimiter, breathworkController.createBreathwork);

/**
 * @openapi
 * /api/admin/breathworks/{id}:
 *   put:
 *     tags:
 *       - Admin - Breathwork
 *     summary: Update a breathwork exercise
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               titleTr:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               pattern:
 *                 type: string
 *               animation:
 *                 type: string
 *               durationSeconds:
 *                 type: integer
 *               inhaleSeconds:
 *                 type: integer
 *               holdInSeconds:
 *                 type: integer
 *               exhaleSeconds:
 *                 type: integer
 *               holdOutSeconds:
 *                 type: integer
 *               cycles:
 *                 type: integer
 *               isFree:
 *                 type: boolean
 *               isPremium:
 *                 type: boolean
 *               isFeatured:
 *                 type: boolean
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Breathwork updated
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Breathwork not found
 */
router.put('/:id', authenticatedRateLimiter, breathworkController.updateBreathwork);

/**
 * @openapi
 * /api/admin/breathworks/{id}:
 *   delete:
 *     tags:
 *       - Admin - Breathwork
 *     summary: Delete a breathwork exercise (soft delete)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Breathwork deleted
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Breathwork not found
 */
router.delete('/:id', authenticatedRateLimiter, breathworkController.deleteBreathwork);

export default router;
