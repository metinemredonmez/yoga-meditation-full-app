import { Router } from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { publicRateLimiter, authenticatedRateLimiter } from '../middleware/rateLimiter';
import * as meditationController from '../controllers/meditationController';

const router = Router();

// ==================== PUBLIC ENDPOINTS ====================

/**
 * @openapi
 * /api/meditations:
 *   get:
 *     tags:
 *       - Meditations
 *     summary: List meditations with filters
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category
 *       - in: query
 *         name: instructorId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by instructor
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [BEGINNER, INTERMEDIATE, ADVANCED]
 *         description: Filter by difficulty level
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
 *           enum: [createdAt, title, durationSeconds, playCount, averageRating]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: List of meditations with pagination
 */
router.get('/', publicRateLimiter, meditationController.getMeditations);

/**
 * @openapi
 * /api/meditations/featured:
 *   get:
 *     tags:
 *       - Meditations
 *     summary: Get featured meditations
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of featured meditations
 */
router.get('/featured', publicRateLimiter, meditationController.getFeaturedMeditations);

/**
 * @openapi
 * /api/meditations/categories:
 *   get:
 *     tags:
 *       - Meditations
 *     summary: Get all meditation categories
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/categories', publicRateLimiter, meditationController.getCategories);

/**
 * @openapi
 * /api/meditations/search:
 *   get:
 *     tags:
 *       - Meditations
 *     summary: Search meditations
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
router.get('/search', publicRateLimiter, meditationController.searchMeditations);

// ==================== AUTHENTICATED USER ENDPOINTS ====================

/**
 * @openapi
 * /api/meditations/for-you:
 *   get:
 *     tags:
 *       - Meditations
 *     summary: Get personalized meditation recommendations
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
 *         description: Personalized meditation recommendations
 *       401:
 *         description: Authentication required
 */
router.get('/for-you', authenticateToken, authenticatedRateLimiter, meditationController.getForYouMeditations);

/**
 * @openapi
 * /api/meditations/favorites:
 *   get:
 *     tags:
 *       - Meditations
 *     summary: Get user's favorite meditations
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
 *         description: List of favorite meditations
 *       401:
 *         description: Authentication required
 */
router.get('/favorites', authenticateToken, authenticatedRateLimiter, meditationController.getFavorites);

/**
 * @openapi
 * /api/meditations/history:
 *   get:
 *     tags:
 *       - Meditations
 *     summary: Get user's listening history
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
 *         description: Listening history
 *       401:
 *         description: Authentication required
 */
router.get('/history', authenticateToken, authenticatedRateLimiter, meditationController.getHistory);

/**
 * @openapi
 * /api/meditations/continue:
 *   get:
 *     tags:
 *       - Meditations
 *     summary: Get meditations in progress
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
 *         description: Meditations in progress
 *       401:
 *         description: Authentication required
 */
router.get('/continue', authenticateToken, authenticatedRateLimiter, meditationController.getContinueMeditations);

/**
 * @openapi
 * /api/meditations/{id}:
 *   get:
 *     tags:
 *       - Meditations
 *     summary: Get meditation detail
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Meditation detail
 *       404:
 *         description: Meditation not found
 */
router.get('/:id', optionalAuth, publicRateLimiter, meditationController.getMeditation);

/**
 * @openapi
 * /api/meditations/{id}/related:
 *   get:
 *     tags:
 *       - Meditations
 *     summary: Get related meditations
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *     responses:
 *       200:
 *         description: Related meditations
 */
router.get('/:id/related', publicRateLimiter, meditationController.getRelatedMeditations);

/**
 * @openapi
 * /api/meditations/{id}/ratings:
 *   get:
 *     tags:
 *       - Meditations
 *     summary: Get meditation ratings
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *         description: Meditation ratings
 */
router.get('/:id/ratings', publicRateLimiter, meditationController.getMeditationRatings);

/**
 * @openapi
 * /api/meditations/{id}/start:
 *   post:
 *     tags:
 *       - Meditations
 *     summary: Start a meditation session
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
 *         description: Meditation not found
 */
router.post('/:id/start', authenticateToken, authenticatedRateLimiter, meditationController.startSession);

/**
 * @openapi
 * /api/meditations/{id}/progress:
 *   put:
 *     tags:
 *       - Meditations
 *     summary: Update meditation progress
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
 *               completed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Progress updated
 *       401:
 *         description: Authentication required
 */
router.put('/:id/progress', authenticateToken, authenticatedRateLimiter, meditationController.updateProgress);

/**
 * @openapi
 * /api/meditations/{id}/complete:
 *   post:
 *     tags:
 *       - Meditations
 *     summary: Complete a meditation session
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
 *               - listenedSeconds
 *             properties:
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *               listenedSeconds:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Session completed
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Meditation not found
 */
router.post('/:id/complete', authenticateToken, authenticatedRateLimiter, meditationController.completeSession);

/**
 * @openapi
 * /api/meditations/{id}/rate:
 *   post:
 *     tags:
 *       - Meditations
 *     summary: Rate a meditation
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
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               review:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Rating saved
 *       401:
 *         description: Authentication required
 */
router.post('/:id/rate', authenticateToken, authenticatedRateLimiter, meditationController.rateMeditation);

/**
 * @openapi
 * /api/meditations/{id}/favorite:
 *   post:
 *     tags:
 *       - Meditations
 *     summary: Add meditation to favorites
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
 *         description: Added to favorites
 *       401:
 *         description: Authentication required
 *       409:
 *         description: Already in favorites
 */
router.post('/:id/favorite', authenticateToken, authenticatedRateLimiter, meditationController.addToFavorites);

/**
 * @openapi
 * /api/meditations/{id}/favorite:
 *   delete:
 *     tags:
 *       - Meditations
 *     summary: Remove meditation from favorites
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
 *         description: Removed from favorites
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Not in favorites
 */
router.delete('/:id/favorite', authenticateToken, authenticatedRateLimiter, meditationController.removeFromFavorites);

export default router;
