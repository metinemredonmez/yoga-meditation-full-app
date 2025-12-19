import { Router } from 'express';
import * as moodController from '../controllers/moodController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/mood:
 *   get:
 *     summary: Get user's mood entries
 *     tags: [Mood Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: mood
 *         schema:
 *           type: string
 *           enum: [GREAT, GOOD, OKAY, LOW, BAD]
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
 *         description: User's mood entries
 *   post:
 *     summary: Create a mood entry
 *     tags: [Mood Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mood, moodScore]
 *             properties:
 *               mood:
 *                 type: string
 *                 enum: [GREAT, GOOD, OKAY, LOW, BAD]
 *               moodScore:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               energy:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               stress:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               notes:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Mood entry created
 */
router.get('/', authenticate, moodController.getMoodEntries);
router.post('/', authenticate, moodController.createMoodEntry);

/**
 * @swagger
 * /api/mood/today:
 *   get:
 *     summary: Get today's mood entry
 *     tags: [Mood Tracking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's mood entry (null if not logged)
 */
router.get('/today', authenticate, moodController.getTodayMoodEntry);

/**
 * @swagger
 * /api/mood/stats:
 *   get:
 *     summary: Get mood statistics
 *     tags: [Mood Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *           default: week
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Mood statistics
 */
router.get('/stats', authenticate, moodController.getMoodStats);

/**
 * @swagger
 * /api/mood/streak:
 *   get:
 *     summary: Get mood tracking streak
 *     tags: [Mood Tracking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current and longest streak
 */
router.get('/streak', authenticate, moodController.getMoodStreak);

/**
 * @swagger
 * /api/mood/tags:
 *   get:
 *     summary: Get available mood tags
 *     tags: [Mood Tracking]
 *     responses:
 *       200:
 *         description: List of mood tags
 */
router.get('/tags', moodController.getMoodTags);

/**
 * @swagger
 * /api/mood/tags/{category}:
 *   get:
 *     summary: Get mood tags by category
 *     tags: [Mood Tracking]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [ACTIVITY, SOCIAL, HEALTH, WEATHER, OTHER]
 *     responses:
 *       200:
 *         description: Mood tags in category
 */
router.get('/tags/:category', moodController.getMoodTagsByCategory);

/**
 * @swagger
 * /api/mood/{id}:
 *   get:
 *     summary: Get mood entry by id
 *     tags: [Mood Tracking]
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
 *         description: Mood entry detail
 *   put:
 *     summary: Update a mood entry
 *     tags: [Mood Tracking]
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
 *             properties:
 *               mood:
 *                 type: string
 *               moodScore:
 *                 type: integer
 *               energy:
 *                 type: integer
 *               stress:
 *                 type: integer
 *               notes:
 *                 type: string
 *               tags:
 *                 type: array
 *     responses:
 *       200:
 *         description: Mood entry updated
 *   delete:
 *     summary: Delete a mood entry
 *     tags: [Mood Tracking]
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
 *         description: Mood entry deleted
 */
router.get('/:id', authenticate, moodController.getMoodEntry);
router.put('/:id', authenticate, moodController.updateMoodEntry);
router.delete('/:id', authenticate, moodController.deleteMoodEntry);

export default router;
