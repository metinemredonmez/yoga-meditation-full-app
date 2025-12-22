import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { authenticatedRateLimiter } from '../middleware/rateLimiter';
import * as meditationController from '../controllers/meditationController';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

/**
 * @openapi
 * /api/admin/meditations:
 *   get:
 *     tags:
 *       - Admin - Meditations
 *     summary: Get all meditations (admin)
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
 *         description: List of all meditations
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
router.get('/', authenticatedRateLimiter, meditationController.getAdminMeditations);

/**
 * @openapi
 * /api/admin/meditations/stats:
 *   get:
 *     tags:
 *       - Admin - Meditations
 *     summary: Get meditation statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Meditation statistics
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
router.get('/stats', authenticatedRateLimiter, meditationController.getMeditationStats);

/**
 * @openapi
 * /api/admin/meditations/categories:
 *   get:
 *     tags:
 *       - Admin - Meditations
 *     summary: Get all categories (admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all categories
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
router.get('/categories', authenticatedRateLimiter, meditationController.getAdminCategories);

/**
 * @openapi
 * /api/admin/meditations/categories:
 *   post:
 *     tags:
 *       - Admin - Meditations
 *     summary: Create a new category
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - slug
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               nameTr:
 *                 type: string
 *                 maxLength: 100
 *               slug:
 *                 type: string
 *                 maxLength: 100
 *               description:
 *                 type: string
 *               descriptionTr:
 *                 type: string
 *               iconUrl:
 *                 type: string
 *                 format: uri
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *               color:
 *                 type: string
 *                 pattern: ^#[0-9A-Fa-f]{6}$
 *               sortOrder:
 *                 type: integer
 *                 default: 0
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Category created
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       409:
 *         description: Slug already exists
 */
router.post('/categories', authenticatedRateLimiter, meditationController.createCategory);

/**
 * @openapi
 * /api/admin/meditations/categories/{id}:
 *   put:
 *     tags:
 *       - Admin - Meditations
 *     summary: Update a category
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
 *               name:
 *                 type: string
 *               nameTr:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               iconUrl:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               color:
 *                 type: string
 *               sortOrder:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Category updated
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Category not found
 */
router.put('/categories/:id', authenticatedRateLimiter, meditationController.updateCategory);

/**
 * @openapi
 * /api/admin/meditations/categories/{id}:
 *   delete:
 *     tags:
 *       - Admin - Meditations
 *     summary: Delete a category (soft delete)
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
 *         description: Category deleted
 *       400:
 *         description: Cannot delete category with active meditations
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Category not found
 */
router.delete('/categories/:id', authenticatedRateLimiter, meditationController.deleteCategory);

/**
 * @openapi
 * /api/admin/meditations:
 *   post:
 *     tags:
 *       - Admin - Meditations
 *     summary: Create a new meditation
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryId
 *               - title
 *               - slug
 *               - description
 *               - difficulty
 *               - durationSeconds
 *               - audioUrl
 *             properties:
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               instructorId:
 *                 type: string
 *                 format: uuid
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
 *               difficulty:
 *                 type: string
 *                 enum: [BEGINNER, INTERMEDIATE, ADVANCED]
 *               durationSeconds:
 *                 type: integer
 *                 minimum: 1
 *               audioUrl:
 *                 type: string
 *                 format: uri
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *               thumbnailUrl:
 *                 type: string
 *                 format: uri
 *               backgroundMusicUrl:
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
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               benefits:
 *                 type: array
 *                 items:
 *                   type: string
 *               benefitsTr:
 *                 type: array
 *                 items:
 *                   type: string
 *               prerequisites:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Meditation created
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       409:
 *         description: Slug already exists
 */
router.post('/', authenticatedRateLimiter, meditationController.createMeditation);

/**
 * @openapi
 * /api/admin/meditations/{id}:
 *   get:
 *     tags:
 *       - Admin - Meditations
 *     summary: Get a meditation by ID (admin)
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
 *         description: Meditation details
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Meditation not found
 */
router.get('/:id', authenticatedRateLimiter, meditationController.getAdminMeditationById);

/**
 * @openapi
 * /api/admin/meditations/{id}:
 *   put:
 *     tags:
 *       - Admin - Meditations
 *     summary: Update a meditation
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
 *               categoryId:
 *                 type: string
 *               instructorId:
 *                 type: string
 *               title:
 *                 type: string
 *               titleTr:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               difficulty:
 *                 type: string
 *               durationSeconds:
 *                 type: integer
 *               audioUrl:
 *                 type: string
 *               imageUrl:
 *                 type: string
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
 *         description: Meditation updated
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Meditation not found
 */
router.put('/:id', authenticatedRateLimiter, meditationController.updateMeditation);

/**
 * @openapi
 * /api/admin/meditations/{id}:
 *   delete:
 *     tags:
 *       - Admin - Meditations
 *     summary: Delete a meditation (soft delete)
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
 *         description: Meditation deleted
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Meditation not found
 */
router.delete('/:id', authenticatedRateLimiter, meditationController.deleteMeditation);

export default router;
