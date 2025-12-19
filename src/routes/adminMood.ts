import { Router } from 'express';
import * as moodController from '../controllers/moodController';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken, requireRoles('ADMIN'));

/**
 * @swagger
 * /api/admin/mood/tags:
 *   get:
 *     summary: List all mood tags (admin)
 *     tags: [Admin - Mood]
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
 *     responses:
 *       200:
 *         description: List of mood tags
 *   post:
 *     summary: Create a mood tag
 *     tags: [Admin - Mood]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, category]
 *             properties:
 *               name:
 *                 type: string
 *               nameEn:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [ACTIVITY, SOCIAL, HEALTH, WEATHER, OTHER]
 *               icon:
 *                 type: string
 *               color:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Mood tag created
 */
router.get('/tags', moodController.getAdminMoodTags);
router.post('/tags', moodController.createMoodTag);

/**
 * @swagger
 * /api/admin/mood/tags/{id}:
 *   put:
 *     summary: Update a mood tag
 *     tags: [Admin - Mood]
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
 *         description: Mood tag updated
 *   delete:
 *     summary: Delete a mood tag
 *     tags: [Admin - Mood]
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
 *         description: Mood tag deleted
 */
router.put('/tags/:id', moodController.updateMoodTag);
router.delete('/tags/:id', moodController.deleteMoodTag);

/**
 * @swagger
 * /api/admin/mood/analytics:
 *   get:
 *     summary: Get mood analytics
 *     tags: [Admin - Mood]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mood analytics data
 */
router.get('/analytics', moodController.getMoodAnalytics);

export default router;
