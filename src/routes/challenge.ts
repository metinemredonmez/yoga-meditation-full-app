import { Router } from 'express';
import {
  getChallenges,
  getChallenge,
  joinChallengeHandler,
  logChallengeCheckHandler,
} from '../controllers/challengeController';
import { authenticateToken } from '../middleware/auth';
import { publicRateLimiter, authenticatedRateLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * @openapi
 * /api/challenges:
 *   get:
 *     tags:
 *       - Challenges
 *     summary: List available challenges
 *     responses:
 *       200:
 *         description: A list of challenges with enrollment counts.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 challenges:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChallengeSummary'
 */
router.get('/', publicRateLimiter, getChallenges);

/**
 * @openapi
 * /api/challenges/{challengeId}:
 *   get:
 *     tags:
 *       - Challenges
 *     summary: Get challenge details
 *     parameters:
 *       - in: path
 *         name: challengeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Challenge details and user progress if authenticated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 challenge:
 *                   $ref: '#/components/schemas/ChallengeDetail'
 *       404:
 *         description: Challenge not found.
 */
router.get('/:challengeId', publicRateLimiter, getChallenge);

/**
 * @openapi
 * /api/challenges/{challengeId}/join:
 *   post:
 *     tags:
 *       - Challenges
 *     summary: Join a challenge
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: challengeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Challenge joined successfully.
 *       404:
 *         description: Challenge not found.
 *       409:
 *         description: User already joined the challenge.
 */
router.post('/:challengeId/join', authenticateToken, authenticatedRateLimiter, joinChallengeHandler);

/**
 * @openapi
 * /api/challenges/{challengeId}/check:
 *   post:
 *     tags:
 *       - Challenges
 *     summary: Log daily completion for a challenge
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: challengeId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChallengeCheckRequest'
 *     responses:
 *       200:
 *         description: Daily completion recorded.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 check:
 *                   $ref: '#/components/schemas/DailyCheck'
 *       403:
 *         description: User must join challenge before logging progress.
 *       404:
 *         description: Challenge or session not found.
 */
router.post('/:challengeId/check', authenticateToken, authenticatedRateLimiter, logChallengeCheckHandler);

export default router;
