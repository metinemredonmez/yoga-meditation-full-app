import { Router } from 'express';
import { getProgressSummaryHandler } from '../controllers/progressController';
import { authenticateToken } from '../middleware/auth';
import { authenticatedRateLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * @openapi
 * /api/progress/summary:
 *   get:
 *     tags:
 *       - Progress
 *     summary: Get a summary of the current user's progress
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Progress summary including total minutes and streak.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   $ref: '#/components/schemas/ProgressSummary'
 */
router.get('/summary', authenticateToken, authenticatedRateLimiter, getProgressSummaryHandler);

export default router;
