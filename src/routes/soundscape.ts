import { Router } from 'express';
import * as soundscapeController from '../controllers/soundscapeController';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/soundscapes:
 *   get:
 *     summary: List soundscapes
 *     tags: [Soundscapes]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [RAIN, THUNDER, OCEAN, FOREST, BIRDS, FIRE, WHITE_NOISE, PINK_NOISE, BROWN_NOISE, CAFE, CITY, WIND, WATER, TIBETAN_BOWLS, MUSIC, OTHER]
 *       - in: query
 *         name: isPremium
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: isMixable
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
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
 *         description: List of soundscapes
 */
router.get('/', optionalAuth, soundscapeController.getSoundscapes);

/**
 * @swagger
 * /api/soundscapes/categories:
 *   get:
 *     summary: Get soundscape categories
 *     tags: [Soundscapes]
 *     responses:
 *       200:
 *         description: List of categories with counts
 */
router.get('/categories', soundscapeController.getCategories);

/**
 * @swagger
 * /api/soundscapes/mixable:
 *   get:
 *     summary: Get mixable soundscapes
 *     tags: [Soundscapes]
 *     responses:
 *       200:
 *         description: List of mixable soundscapes
 */
router.get('/mixable', soundscapeController.getMixableSoundscapes);

/**
 * @swagger
 * /api/soundscapes/search:
 *   get:
 *     summary: Search soundscapes
 *     tags: [Soundscapes]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', soundscapeController.searchSoundscapes);

/**
 * @swagger
 * /api/soundscapes/category/{category}:
 *   get:
 *     summary: Get soundscapes by category
 *     tags: [Soundscapes]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Soundscapes in category
 */
router.get('/category/:category', soundscapeController.getByCategory);

/**
 * @swagger
 * /api/soundscapes/favorites:
 *   get:
 *     summary: Get user's favorite soundscapes
 *     tags: [Soundscapes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's favorites
 */
router.get('/favorites', authenticate, soundscapeController.getFavorites);

/**
 * @swagger
 * /api/soundscapes/mixes:
 *   get:
 *     summary: Get user's sound mixes
 *     tags: [Soundscapes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's mixes
 *   post:
 *     summary: Create a sound mix
 *     tags: [Soundscapes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, items]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     soundscapeId:
 *                       type: string
 *                     volume:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 100
 *     responses:
 *       201:
 *         description: Mix created
 */
router.get('/mixes', authenticate, soundscapeController.getUserMixes);
router.post('/mixes', authenticate, soundscapeController.createMix);

/**
 * @swagger
 * /api/soundscapes/mixes/public:
 *   get:
 *     summary: Get public sound mixes
 *     tags: [Soundscapes]
 *     responses:
 *       200:
 *         description: Public mixes
 */
router.get('/mixes/public', soundscapeController.getPublicMixes);

/**
 * @swagger
 * /api/soundscapes/mixes/{mixId}:
 *   get:
 *     summary: Get mix detail
 *     tags: [Soundscapes]
 *     parameters:
 *       - in: path
 *         name: mixId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mix detail
 *   put:
 *     summary: Update a mix
 *     tags: [Soundscapes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mixId
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *               items:
 *                 type: array
 *     responses:
 *       200:
 *         description: Mix updated
 *   delete:
 *     summary: Delete a mix
 *     tags: [Soundscapes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mixId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mix deleted
 */
router.get('/mixes/:mixId', optionalAuth, soundscapeController.getMix);
router.put('/mixes/:mixId', authenticate, soundscapeController.updateMix);
router.delete('/mixes/:mixId', authenticate, soundscapeController.deleteMix);

/**
 * @swagger
 * /api/soundscapes/mixes/{mixId}/play:
 *   post:
 *     summary: Increment mix play count
 *     tags: [Soundscapes]
 *     parameters:
 *       - in: path
 *         name: mixId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Play count incremented
 */
router.post('/mixes/:mixId/play', soundscapeController.playMix);

/**
 * @swagger
 * /api/soundscapes/{id}:
 *   get:
 *     summary: Get soundscape detail
 *     tags: [Soundscapes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Soundscape detail
 */
router.get('/:id', optionalAuth, soundscapeController.getSoundscape);

/**
 * @swagger
 * /api/soundscapes/{id}/play:
 *   post:
 *     summary: Increment soundscape play count
 *     tags: [Soundscapes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Play count incremented
 */
router.post('/:id/play', soundscapeController.playSoundscape);

/**
 * @swagger
 * /api/soundscapes/{id}/favorite:
 *   post:
 *     summary: Add soundscape to favorites
 *     tags: [Soundscapes]
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
 *         description: Added to favorites
 *   delete:
 *     summary: Remove soundscape from favorites
 *     tags: [Soundscapes]
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
 *         description: Removed from favorites
 */
router.post('/:id/favorite', authenticate, soundscapeController.addFavorite);
router.delete('/:id/favorite', authenticate, soundscapeController.removeFavorite);

export default router;
