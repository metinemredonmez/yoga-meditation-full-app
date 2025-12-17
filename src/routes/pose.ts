import { Router } from 'express';
import { getPoses, getPose } from '../controllers/poseController';
import { publicRateLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * @openapi
 * /api/poses:
 *   get:
 *     tags:
 *       - Poses
 *     summary: List poses with optional filters
 *     parameters:
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [BEGINNER, INTERMEDIATE, ADVANCED]
 *       - in: query
 *         name: bodyArea
 *         schema:
 *           type: string
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search term across english/sanskrit names and description
 *     responses:
 *       200:
 *         description: List of poses matching filters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 poses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Pose'
 */
router.get('/', publicRateLimiter, getPoses);

/**
 * @openapi
 * /api/poses/{poseId}:
 *   get:
 *     tags:
 *       - Poses
 *     summary: Get pose details
 *     parameters:
 *       - in: path
 *         name: poseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pose detail.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pose:
 *                   $ref: '#/components/schemas/Pose'
 *       404:
 *         description: Pose not found.
 */
router.get('/:poseId', publicRateLimiter, getPose);

export default router;
