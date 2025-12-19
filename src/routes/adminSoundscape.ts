import { Router } from 'express';
import * as soundscapeController from '../controllers/soundscapeController';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken, requireRoles('ADMIN'));

/**
 * @swagger
 * /api/admin/soundscapes:
 *   get:
 *     summary: List all soundscapes (admin)
 *     tags: [Admin - Soundscapes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: isPremium
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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of soundscapes
 *   post:
 *     summary: Create a soundscape
 *     tags: [Admin - Soundscapes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [slug, title, audioUrl, category]
 *             properties:
 *               slug:
 *                 type: string
 *               title:
 *                 type: string
 *               titleEn:
 *                 type: string
 *               audioUrl:
 *                 type: string
 *               coverImage:
 *                 type: string
 *               duration:
 *                 type: integer
 *               isLoop:
 *                 type: boolean
 *               category:
 *                 type: string
 *               isPremium:
 *                 type: boolean
 *               isMixable:
 *                 type: boolean
 *               defaultVolume:
 *                 type: integer
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Soundscape created
 */
router.get('/', soundscapeController.getAdminSoundscapes);
router.post('/', soundscapeController.createSoundscape);

/**
 * @swagger
 * /api/admin/soundscapes/stats:
 *   get:
 *     summary: Get soundscape statistics
 *     tags: [Admin - Soundscapes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Soundscape statistics
 */
router.get('/stats', soundscapeController.getSoundscapeStats);

/**
 * @swagger
 * /api/admin/soundscapes/{id}:
 *   put:
 *     summary: Update a soundscape
 *     tags: [Admin - Soundscapes]
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
 *     responses:
 *       200:
 *         description: Soundscape updated
 *   delete:
 *     summary: Delete a soundscape
 *     tags: [Admin - Soundscapes]
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
 *         description: Soundscape deleted
 */
router.put('/:id', soundscapeController.updateSoundscape);
router.delete('/:id', soundscapeController.deleteSoundscape);

export default router;
