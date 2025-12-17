import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';
import {
  adminListPodcasts,
  adminGetPodcast,
  adminCreatePodcast,
  adminUpdatePodcast,
  adminDeletePodcast,
  adminListEpisodes,
  adminGetEpisode,
  adminCreateEpisode,
  adminUpdateEpisode,
  adminDeleteEpisode,
  adminGetPodcastAnalytics,
} from '../controllers/adminPodcastController';

const router = Router();

// All routes require authentication and ADMIN or TEACHER role
router.use(authenticateToken);
router.use(requireRoles('ADMIN', 'TEACHER'));
router.use(authRateLimiter);

// ============================================
// Podcast CRUD
// ============================================

/**
 * @openapi
 * /api/admin/podcasts:
 *   get:
 *     tags:
 *       - Admin - Podcasts
 *     summary: List all podcasts (admin sees all, teacher sees own)
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
 *           enum: [DRAFT, PUBLISHED, ARCHIVED]
 *     responses:
 *       200:
 *         description: Podcasts list
 */
router.get('/', adminListPodcasts);

/**
 * @openapi
 * /api/admin/podcasts:
 *   post:
 *     tags:
 *       - Admin - Podcasts
 *     summary: Create a new podcast
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePodcast'
 *     responses:
 *       201:
 *         description: Podcast created
 */
router.post('/', adminCreatePodcast);

/**
 * @openapi
 * /api/admin/podcasts/{podcastId}:
 *   get:
 *     tags:
 *       - Admin - Podcasts
 *     summary: Get podcast details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: podcastId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Podcast details
 */
router.get('/:podcastId', adminGetPodcast);

/**
 * @openapi
 * /api/admin/podcasts/{podcastId}:
 *   patch:
 *     tags:
 *       - Admin - Podcasts
 *     summary: Update a podcast
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: podcastId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePodcast'
 *     responses:
 *       200:
 *         description: Podcast updated
 */
router.patch('/:podcastId', adminUpdatePodcast);

/**
 * @openapi
 * /api/admin/podcasts/{podcastId}:
 *   delete:
 *     tags:
 *       - Admin - Podcasts
 *     summary: Delete a podcast
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: podcastId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Podcast deleted
 */
router.delete('/:podcastId', adminDeletePodcast);

// ============================================
// Episode CRUD
// ============================================

/**
 * @openapi
 * /api/admin/podcasts/{podcastId}/episodes:
 *   get:
 *     tags:
 *       - Admin - Podcasts
 *     summary: List episodes for a podcast
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: podcastId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Episodes list
 */
router.get('/:podcastId/episodes', adminListEpisodes);

/**
 * @openapi
 * /api/admin/podcasts/{podcastId}/episodes:
 *   post:
 *     tags:
 *       - Admin - Podcasts
 *     summary: Create a new episode
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: podcastId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEpisode'
 *     responses:
 *       201:
 *         description: Episode created
 */
router.post('/:podcastId/episodes', adminCreateEpisode);

/**
 * @openapi
 * /api/admin/podcasts/episodes/{episodeId}:
 *   get:
 *     tags:
 *       - Admin - Podcasts
 *     summary: Get episode details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: episodeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Episode details
 */
router.get('/episodes/:episodeId', adminGetEpisode);

/**
 * @openapi
 * /api/admin/podcasts/episodes/{episodeId}:
 *   patch:
 *     tags:
 *       - Admin - Podcasts
 *     summary: Update an episode
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: episodeId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateEpisode'
 *     responses:
 *       200:
 *         description: Episode updated
 */
router.patch('/episodes/:episodeId', adminUpdateEpisode);

/**
 * @openapi
 * /api/admin/podcasts/episodes/{episodeId}:
 *   delete:
 *     tags:
 *       - Admin - Podcasts
 *     summary: Delete an episode
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: episodeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Episode deleted
 */
router.delete('/episodes/:episodeId', adminDeleteEpisode);

// ============================================
// Analytics
// ============================================

/**
 * @openapi
 * /api/admin/podcasts/{podcastId}/analytics:
 *   get:
 *     tags:
 *       - Admin - Podcasts
 *     summary: Get podcast analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: podcastId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Podcast analytics data
 */
router.get('/:podcastId/analytics', adminGetPodcastAnalytics);

export default router;
