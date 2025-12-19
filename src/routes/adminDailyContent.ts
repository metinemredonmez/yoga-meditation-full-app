import { Router } from 'express';
import * as dailyContentController from '../controllers/dailyContentController';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken, requireRoles('ADMIN'));

// ==================== QUOTES ====================

/**
 * @swagger
 * /api/admin/quotes:
 *   get:
 *     summary: List all quotes (admin)
 *     tags: [Admin - Daily Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
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
 *         description: List of quotes
 *   post:
 *     summary: Create a quote
 *     tags: [Admin - Daily Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *               textEn:
 *                 type: string
 *               author:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [MOTIVATION, MINDFULNESS, HAPPINESS, PEACE, SELF_LOVE, YOGA, SUFI, GRATITUDE]
 *               language:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Quote created
 */
router.get('/quotes', dailyContentController.getQuotes);
router.post('/quotes', dailyContentController.createQuote);

/**
 * @swagger
 * /api/admin/quotes/{id}:
 *   get:
 *     summary: Get quote by id
 *     tags: [Admin - Daily Content]
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
 *         description: Quote detail
 *   put:
 *     summary: Update a quote
 *     tags: [Admin - Daily Content]
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
 *         description: Quote updated
 *   delete:
 *     summary: Delete a quote
 *     tags: [Admin - Daily Content]
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
 *         description: Quote deleted
 */
router.get('/quotes/:id', dailyContentController.getQuote);
router.put('/quotes/:id', dailyContentController.updateQuote);
router.delete('/quotes/:id', dailyContentController.deleteQuote);

// ==================== DAILY CONTENT ====================

/**
 * @swagger
 * /api/admin/daily-content:
 *   get:
 *     summary: List all daily content (admin)
 *     tags: [Admin - Daily Content]
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
 *         description: List of daily content
 *   post:
 *     summary: Create daily content
 *     tags: [Admin - Daily Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date]
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               quoteId:
 *                 type: string
 *               meditationId:
 *                 type: string
 *               breathworkId:
 *                 type: string
 *               tip:
 *                 type: string
 *               challenge:
 *                 type: string
 *               isPublished:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Daily content created
 */
router.get('/daily-content', dailyContentController.getAdminDailyContent);
router.post('/daily-content', dailyContentController.createDailyContent);

/**
 * @swagger
 * /api/admin/daily-content/stats:
 *   get:
 *     summary: Get daily content statistics
 *     tags: [Admin - Daily Content]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daily content statistics
 */
router.get('/daily-content/stats', dailyContentController.getDailyContentStats);

/**
 * @swagger
 * /api/admin/daily-content/{id}:
 *   put:
 *     summary: Update daily content
 *     tags: [Admin - Daily Content]
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
 *         description: Daily content updated
 *   delete:
 *     summary: Delete daily content
 *     tags: [Admin - Daily Content]
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
 *         description: Daily content deleted
 */
router.put('/daily-content/:id', dailyContentController.updateDailyContent);
router.delete('/daily-content/:id', dailyContentController.deleteDailyContent);

export default router;
