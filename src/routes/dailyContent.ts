import { Router } from 'express';
import * as dailyContentController from '../controllers/dailyContentController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/daily:
 *   get:
 *     summary: Get today's daily content
 *     tags: [Daily Content]
 *     responses:
 *       200:
 *         description: Today's content (quote, meditation, breathwork, tip)
 */
router.get('/', optionalAuth, dailyContentController.getTodayContent);

/**
 * @swagger
 * /api/daily/quote:
 *   get:
 *     summary: Get today's quote
 *     tags: [Daily Content]
 *     responses:
 *       200:
 *         description: Today's motivational quote
 */
router.get('/quote', dailyContentController.getTodayQuote);

/**
 * @swagger
 * /api/daily/quote/random:
 *   get:
 *     summary: Get a random quote
 *     tags: [Daily Content]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [MOTIVATION, MINDFULNESS, HAPPINESS, PEACE, SELF_LOVE, YOGA, SUFI, GRATITUDE]
 *     responses:
 *       200:
 *         description: Random quote
 */
router.get('/quote/random', dailyContentController.getRandomQuote);

/**
 * @swagger
 * /api/daily/{date}:
 *   get:
 *     summary: Get daily content for a specific date
 *     tags: [Daily Content]
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date in YYYY-MM-DD format
 *     responses:
 *       200:
 *         description: Daily content for the specified date
 *       404:
 *         description: No content for this date
 */
router.get('/:date', optionalAuth, dailyContentController.getDailyContent);

export default router;
