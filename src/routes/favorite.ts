import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  handleAddFavorite,
  handleRemoveFavorite,
  handleToggleFavorite,
  handleGetFavorites,
  handleGetFavoritesByType,
  handleCheckFavorite,
  handleGetFavoriteCounts,
  handleBulkCheckFavorites,
} from '../controllers/favoriteController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * components:
 *   schemas:
 *     FavoriteType:
 *       type: string
 *       enum: [PROGRAM, POSE, CLASS]
 *     Favorite:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         itemId:
 *           type: string
 *         itemType:
 *           $ref: '#/components/schemas/FavoriteType'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         item:
 *           type: object
 *           description: The favorited item details (Program, Pose, or Class)
 */

/**
 * @swagger
 * /api/favorites:
 *   post:
 *     tags: [Favorites]
 *     summary: Add item to favorites
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemId
 *               - itemType
 *             properties:
 *               itemId:
 *                 type: string
 *               itemType:
 *                 $ref: '#/components/schemas/FavoriteType'
 *     responses:
 *       201:
 *         description: Added to favorites
 *       400:
 *         description: Validation error
 *       404:
 *         description: Item not found
 *       401:
 *         description: Authentication required
 */
router.post('/', handleAddFavorite);

/**
 * @swagger
 * /api/favorites:
 *   delete:
 *     tags: [Favorites]
 *     summary: Remove item from favorites
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemId
 *               - itemType
 *             properties:
 *               itemId:
 *                 type: string
 *               itemType:
 *                 $ref: '#/components/schemas/FavoriteType'
 *     responses:
 *       204:
 *         description: Removed from favorites (or was not in favorites)
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 */
router.delete('/', handleRemoveFavorite);

/**
 * @swagger
 * /api/favorites/toggle:
 *   post:
 *     tags: [Favorites]
 *     summary: Toggle favorite status
 *     description: If favorited, removes. If not favorited, adds.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemId
 *               - itemType
 *             properties:
 *               itemId:
 *                 type: string
 *               itemType:
 *                 $ref: '#/components/schemas/FavoriteType'
 *     responses:
 *       200:
 *         description: Favorite toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isFavorite:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 favorite:
 *                   $ref: '#/components/schemas/Favorite'
 *       404:
 *         description: Item not found
 *       401:
 *         description: Authentication required
 */
router.post('/toggle', handleToggleFavorite);

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     tags: [Favorites]
 *     summary: Get user's favorites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: itemType
 *         schema:
 *           $ref: '#/components/schemas/FavoriteType'
 *         description: Filter by type
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
 *           maximum: 100
 *     responses:
 *       200:
 *         description: List of favorites
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 favorites:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Favorite'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Authentication required
 */
router.get('/', handleGetFavorites);

/**
 * @swagger
 * /api/favorites/counts:
 *   get:
 *     tags: [Favorites]
 *     summary: Get favorite counts by type
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Favorite counts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 counts:
 *                   type: object
 *                   properties:
 *                     programs:
 *                       type: integer
 *                     poses:
 *                       type: integer
 *                     classes:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       401:
 *         description: Authentication required
 */
router.get('/counts', handleGetFavoriteCounts);

/**
 * @swagger
 * /api/favorites/check/{itemType}/{itemId}:
 *   get:
 *     tags: [Favorites]
 *     summary: Check if item is favorited
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemType
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/FavoriteType'
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Favorite status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isFavorite:
 *                   type: boolean
 *       401:
 *         description: Authentication required
 */
router.get('/check/:itemType/:itemId', handleCheckFavorite);

/**
 * @swagger
 * /api/favorites/check-bulk:
 *   post:
 *     tags: [Favorites]
 *     summary: Bulk check favorite status for multiple items
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 maxItems: 100
 *                 items:
 *                   type: object
 *                   required:
 *                     - itemId
 *                     - itemType
 *                   properties:
 *                     itemId:
 *                       type: string
 *                     itemType:
 *                       $ref: '#/components/schemas/FavoriteType'
 *     responses:
 *       200:
 *         description: Favorite status for each item
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 favorites:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       itemId:
 *                         type: string
 *                       itemType:
 *                         type: string
 *                       isFavorite:
 *                         type: boolean
 *       401:
 *         description: Authentication required
 */
router.post('/check-bulk', handleBulkCheckFavorites);

/**
 * @swagger
 * /api/favorites/type/{itemType}:
 *   get:
 *     tags: [Favorites]
 *     summary: Get favorites by type
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemType
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/FavoriteType'
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
 *           maximum: 100
 *     responses:
 *       200:
 *         description: List of favorites by type
 *       401:
 *         description: Authentication required
 */
router.get('/type/:itemType', handleGetFavoritesByType);

export default router;
