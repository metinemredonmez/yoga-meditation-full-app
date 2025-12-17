import { Router } from 'express';
import { getProgram, getPrograms } from '../controllers/programController';
import { publicRateLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * @openapi
 * /api/programs:
 *   get:
 *     tags:
 *       - Programs
 *     summary: List yoga programs
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [BEGINNER, INTERMEDIATE, ADVANCED]
 *         description: Filter programs by level
 *       - in: query
 *         name: durationMax
 *         schema:
 *           type: integer
 *         description: Maximum program duration in minutes
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter by tag slug
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search within program title and description
 *     responses:
 *       200:
 *         description: A list of programs matching the filters.
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
router.get('/', publicRateLimiter, getPrograms);

/**
 * @openapi
 * /api/programs/{id}:
 *   get:
 *     tags:
 *       - Programs
 *     summary: Get program details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detailed information about a program.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 program:
 *                   $ref: '#/components/schemas/ProgramDetail'
 *       404:
 *         description: Program not found.
 */
router.get('/:id', publicRateLimiter, getProgram);

export default router;
