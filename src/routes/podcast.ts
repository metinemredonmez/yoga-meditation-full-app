import { Router } from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { publicRateLimiter, authRateLimiter } from '../middleware/rateLimiter';
import {
  listPublicPodcasts,
  getPublicPodcast,
  listPublicEpisodes,
  getPublicEpisode,
  getFeatured,
  getLatest,
  getPopular,
  subscribe,
  unsubscribe,
  getMySubscriptions,
  recordProgress,
  getMyListenHistory,
  like,
  unlike,
  getMyLikedEpisodes,
  getRssFeed,
} from '../controllers/podcastController';

const router = Router();

// ============================================
// Public Endpoints (no auth required)
// ============================================

/**
 * @openapi
 * /api/podcasts:
 *   get:
 *     tags:
 *       - Podcasts
 *     summary: List all published podcasts
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
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [WELLNESS, MEDITATION, YOGA_INSTRUCTION, BREATHWORK, PHILOSOPHY, INTERVIEWS, MUSIC, STORIES, GUIDED_PRACTICE, MINDFULNESS]
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: List of podcasts with pagination
 */
router.get('/', publicRateLimiter, optionalAuth, listPublicPodcasts);

/**
 * @openapi
 * /api/podcasts/featured:
 *   get:
 *     tags:
 *       - Podcasts
 *     summary: Get featured podcasts
 *     responses:
 *       200:
 *         description: Featured podcasts list
 */
router.get('/featured', publicRateLimiter, getFeatured);

/**
 * @openapi
 * /api/podcasts/latest-episodes:
 *   get:
 *     tags:
 *       - Podcasts
 *     summary: Get latest episodes across all podcasts
 *     responses:
 *       200:
 *         description: Latest episodes list
 */
router.get('/latest-episodes', publicRateLimiter, getLatest);

/**
 * @openapi
 * /api/podcasts/popular-episodes:
 *   get:
 *     tags:
 *       - Podcasts
 *     summary: Get most popular episodes
 *     responses:
 *       200:
 *         description: Popular episodes list
 */
router.get('/popular-episodes', publicRateLimiter, getPopular);

/**
 * @openapi
 * /api/podcasts/{slug}:
 *   get:
 *     tags:
 *       - Podcasts
 *     summary: Get podcast details by slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Podcast details
 *       404:
 *         description: Podcast not found
 */
router.get('/:slug', publicRateLimiter, optionalAuth, getPublicPodcast);

/**
 * @openapi
 * /api/podcasts/{slug}/episodes:
 *   get:
 *     tags:
 *       - Podcasts
 *     summary: List episodes for a podcast
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Episodes list with pagination
 */
router.get('/:slug/episodes', publicRateLimiter, listPublicEpisodes);

/**
 * @openapi
 * /api/podcasts/{podcastSlug}/episodes/{episodeSlug}:
 *   get:
 *     tags:
 *       - Podcasts
 *     summary: Get episode details
 *     parameters:
 *       - in: path
 *         name: podcastSlug
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: episodeSlug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Episode details with progress if authenticated
 */
router.get('/:podcastSlug/episodes/:episodeSlug', publicRateLimiter, optionalAuth, getPublicEpisode);

/**
 * @openapi
 * /api/podcasts/{slug}/rss:
 *   get:
 *     tags:
 *       - Podcasts
 *     summary: Get RSS feed for a podcast
 *     description: Returns an RSS 2.0 compatible feed for podcast apps and directories
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: RSS XML feed
 *         content:
 *           application/rss+xml:
 *             schema:
 *               type: string
 *       404:
 *         description: Podcast not found or RSS not enabled
 */
router.get('/:slug/rss', publicRateLimiter, getRssFeed);

// ============================================
// Authenticated User Endpoints
// ============================================

/**
 * @openapi
 * /api/podcasts/me/subscriptions:
 *   get:
 *     tags:
 *       - Podcasts
 *     summary: Get user's podcast subscriptions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's subscriptions
 */
router.get('/me/subscriptions', authenticateToken, authRateLimiter, getMySubscriptions);

/**
 * @openapi
 * /api/podcasts/me/history:
 *   get:
 *     tags:
 *       - Podcasts
 *     summary: Get user's listen history
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Listen history
 */
router.get('/me/history', authenticateToken, authRateLimiter, getMyListenHistory);

/**
 * @openapi
 * /api/podcasts/me/liked:
 *   get:
 *     tags:
 *       - Podcasts
 *     summary: Get user's liked episodes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liked episodes
 */
router.get('/me/liked', authenticateToken, authRateLimiter, getMyLikedEpisodes);

/**
 * @openapi
 * /api/podcasts/{podcastId}/subscribe:
 *   post:
 *     tags:
 *       - Podcasts
 *     summary: Subscribe to a podcast
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: podcastId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Subscription created
 */
router.post('/:podcastId/subscribe', authenticateToken, authRateLimiter, subscribe);

/**
 * @openapi
 * /api/podcasts/{podcastId}/unsubscribe:
 *   delete:
 *     tags:
 *       - Podcasts
 *     summary: Unsubscribe from a podcast
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
 *         description: Unsubscribed successfully
 */
router.delete('/:podcastId/unsubscribe', authenticateToken, authRateLimiter, unsubscribe);

/**
 * @openapi
 * /api/podcasts/episodes/{episodeId}/progress:
 *   post:
 *     tags:
 *       - Podcasts
 *     summary: Record listen progress for an episode
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
 *             type: object
 *             properties:
 *               progress:
 *                 type: integer
 *               duration:
 *                 type: integer
 *               completed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Progress recorded
 */
router.post('/episodes/:episodeId/progress', optionalAuth, authRateLimiter, recordProgress);

/**
 * @openapi
 * /api/podcasts/episodes/{episodeId}/like:
 *   post:
 *     tags:
 *       - Podcasts
 *     summary: Like an episode
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: episodeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Episode liked
 */
router.post('/episodes/:episodeId/like', authenticateToken, authRateLimiter, like);

/**
 * @openapi
 * /api/podcasts/episodes/{episodeId}/unlike:
 *   delete:
 *     tags:
 *       - Podcasts
 *     summary: Unlike an episode
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
 *         description: Episode unliked
 */
router.delete('/episodes/:episodeId/unlike', authenticateToken, authRateLimiter, unlike);

export default router;
