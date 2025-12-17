import { Router } from 'express';
import {
  postChallenge,
  putChallenge,
  deleteChallengeHandler,
  getChallenge,
  getChallenges,
} from '../controllers/challengeController';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.use(requireRoles('ADMIN'));

/**
 * @openapi
 * /api/admin/challenges:
 *   get:
 *     tags:
 *       - Admin Challenges
 *     summary: List challenges for administration
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of challenges.
 */
router.get('/', getChallenges);

/**
 * @openapi
 * /api/admin/challenges:
 *   post:
 *     tags:
 *       - Admin Challenges
 *     summary: Create a new challenge
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChallengeCreateRequest'
 *     responses:
 *       201:
 *         description: Challenge created.
 */
router.post('/', postChallenge);

/**
 * @openapi
 * /api/admin/challenges/{challengeId}:
 *   put:
 *     tags:
 *       - Admin Challenges
 *     summary: Update a challenge
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: challengeId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChallengeUpdateRequest'
 *     responses:
 *       200:
 *         description: Challenge updated.
 */
router.put('/:challengeId', putChallenge);

/**
 * @openapi
 * /api/admin/challenges/{challengeId}:
 *   delete:
 *     tags:
 *       - Admin Challenges
 *     summary: Delete a challenge
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
 *         description: Challenge deleted.
 */
router.delete('/:challengeId', deleteChallengeHandler);

/**
 * @openapi
 * /api/admin/challenges/{challengeId}:
 *   get:
 *     tags:
 *       - Admin Challenges
 *     summary: Get challenge details (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: challengeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Challenge detail including user progress if authenticated.
 */
router.get('/:challengeId', getChallenge);

export default router;
