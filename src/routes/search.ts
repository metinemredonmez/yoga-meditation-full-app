import { Router } from 'express';
import { searchProgramsHandler } from '../controllers/programController';

const router = Router();

/**
 * @openapi
 * /api/search:
 *   get:
 *     tags:
 *       - Search
 *     summary: Search programs by title and description
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search keyword (case insensitive)
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [BEGINNER, INTERMEDIATE, ADVANCED]
 *         description: Filter by level
 *       - in: query
 *         name: durationMax
 *         schema:
 *           type: integer
 *         description: Maximum duration in minutes
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter by tag slug
 *     responses:
 *       200:
 *         description: Programs that match the search criteria.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 programs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProgramSummary'
 */
router.get('/', searchProgramsHandler);

export default router;
