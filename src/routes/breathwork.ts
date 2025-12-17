import { Router } from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { publicRateLimiter, authenticatedRateLimiter } from '../middleware/rateLimiter';
import * as breathworkController from '../controllers/breathworkController';

const router = Router();

// ==================== PUBLIC ENDPOINTS ====================

/**
 * @openapi
 * /api/breathworks:
 *   get:
 *     tags:
 *       - Breathwork
 *     summary: List breathwork exercises with filters
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [CALM, FOCUS, ENERGY, SLEEP, STRESS, ANXIETY]
 *         description: Filter by category
 *       - in: query
 *         name: pattern
 *         schema:
 *           type: string
 *           enum: [BOX, FOUR_SEVEN_EIGHT, ALTERNATE_NOSTRIL, RELAXATION, ENERGIZING, CUSTOM]
 *         description: Filter by breathing pattern
 *       - in: query
 *         name: instructorId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by instructor
 *       - in: query
 *         name: isFree
 *         schema:
 *           type: boolean
 *         description: Filter by free/premium
 *       - in: query
 *         name: isFeatured
 *         schema:
 *           type: boolean
 *         description: Filter by featured
 *       - in: query
 *         name: minDuration
 *         schema:
 *           type: integer
 *         description: Minimum duration in seconds
 *       - in: query
 *         name: maxDuration
 *         schema:
 *           type: integer
 *         description: Maximum duration in seconds
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
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
 *         description: List of breathwork exercises with pagination
 */
router.get('/', publicRateLimiter, breathworkController.getBreathworks);

/**
 * @openapi
 * /api/breathworks/featured:
 *   get:
 *     tags:
 *       - Breathwork
 *     summary: Get featured breathwork exercises
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of featured breathwork exercises
 */
router.get('/featured', publicRateLimiter, breathworkController.getFeaturedBreathworks);

/**
 * @openapi
 * /api/breathworks/categories:
 *   get:
 *     tags:
 *       - Breathwork
 *     summary: Get breathwork categories with counts
 *     responses:
 *       200:
 *         description: List of categories with exercise counts
 */
router.get('/categories', publicRateLimiter, breathworkController.getCategories);

/**
 * @openapi
 * /api/breathworks/search:
 *   get:
 *     tags:
 *       - Breathwork
 *     summary: Search breathwork exercises
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', publicRateLimiter, breathworkController.searchBreathworks);

/**
 * @openapi
 * /api/breathworks/category/{category}:
 *   get:
 *     tags:
 *       - Breathwork
 *     summary: Get breathwork exercises by category
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [CALM, FOCUS, ENERGY, SLEEP, STRESS, ANXIETY]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of breathwork exercises in category
 */
router.get('/category/:category', publicRateLimiter, breathworkController.getByCategory);

// ==================== AUTHENTICATED USER ENDPOINTS ====================

/**
 * @openapi
 * /api/breathworks/history:
 *   get:
 *     tags:
 *       - Breathwork
 *     summary: Get user's breathwork history
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Practice history
 *       401:
 *         description: Authentication required
 */
router.get('/history', authenticateToken, authenticatedRateLimiter, breathworkController.getHistory);

/**
 * @openapi
 * /api/breathworks/continue:
 *   get:
 *     tags:
 *       - Breathwork
 *     summary: Get breathwork exercises in progress
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Breathwork exercises in progress
 *       401:
 *         description: Authentication required
 */
router.get('/continue', authenticateToken, authenticatedRateLimiter, breathworkController.getContinueBreathworks);

/**
 * @openapi
 * /api/breathworks/stats:
 *   get:
 *     tags:
 *       - Breathwork
 *     summary: Get user's breathwork statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics
 *       401:
 *         description: Authentication required
 */
router.get('/stats', authenticateToken, authenticatedRateLimiter, breathworkController.getUserStats);

/**
 * @openapi
 * /api/breathworks/{id}:
 *   get:
 *     tags:
 *       - Breathwork
 *     summary: Get breathwork detail
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Breathwork detail
 *       404:
 *         description: Breathwork not found
 */
router.get('/:id', optionalAuth, publicRateLimiter, breathworkController.getBreathwork);

/**
 * @openapi
 * /api/breathworks/{id}/start:
 *   post:
 *     tags:
 *       - Breathwork
 *     summary: Start a breathwork session
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
 *       201:
 *         description: Session started
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Breathwork not found
 */
router.post('/:id/start', authenticateToken, authenticatedRateLimiter, breathworkController.startSession);

/**
 * @openapi
 * /api/breathworks/{id}/progress:
 *   put:
 *     tags:
 *       - Breathwork
 *     summary: Update breathwork progress
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
 *             required:
 *               - progressSeconds
 *             properties:
 *               progressSeconds:
 *                 type: integer
 *                 minimum: 0
 *               cyclesCompleted:
 *                 type: integer
 *                 minimum: 0
 *               completed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Progress updated
 *       401:
 *         description: Authentication required
 */
router.put('/:id/progress', authenticateToken, authenticatedRateLimiter, breathworkController.updateProgress);

/**
 * @openapi
 * /api/breathworks/{id}/complete:
 *   post:
 *     tags:
 *       - Breathwork
 *     summary: Complete a breathwork session
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
 *             required:
 *               - sessionId
 *               - practicedSeconds
 *               - cyclesCompleted
 *             properties:
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *               practicedSeconds:
 *                 type: integer
 *                 minimum: 0
 *               cyclesCompleted:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Session completed
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Breathwork not found
 */
router.post('/:id/complete', authenticateToken, authenticatedRateLimiter, breathworkController.completeSession);

export default router;
