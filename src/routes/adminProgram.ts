import { Router } from 'express';
import {
  adminListPrograms,
  adminGetProgram,
  adminCreateProgram,
  adminUpdateProgram,
  adminDeleteProgram,
  adminListProgramSessions,
  adminCreateProgramSession,
  adminUpdateProgramSession,
  adminDeleteProgramSession,
} from '../controllers/adminProgramController';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.use(requireRoles('ADMIN'));

/**
 * @openapi
 * /api/admin/programs:
 *   get:
 *     tags:
 *       - Admin Programs
 *     summary: Admin list programs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of programs for administration.
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
router.get('/', adminListPrograms);

/**
 * @openapi
 * /api/admin/programs:
 *   post:
 *     tags:
 *       - Admin Programs
 *     summary: Create a new program
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProgramUpsertRequest'
 *     responses:
 *       201:
 *         description: Program created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 program:
 *                   $ref: '#/components/schemas/ProgramSummary'
 */
router.post('/', adminCreateProgram);

/**
 * @openapi
 * /api/admin/programs/{programId}:
 *   get:
 *     tags:
 *       - Admin Programs
 *     summary: Get program details (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Program detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 program:
 *                   $ref: '#/components/schemas/ProgramDetail'
 */
router.get('/:programId', adminGetProgram);

/**
 * @openapi
 * /api/admin/programs/{programId}:
 *   put:
 *     tags:
 *       - Admin Programs
 *     summary: Update a program
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProgramUpsertRequest'
 *     responses:
 *       200:
 *         description: Program updated
 */
router.put('/:programId', adminUpdateProgram);

/**
 * @openapi
 * /api/admin/programs/{programId}:
 *   delete:
 *     tags:
 *       - Admin Programs
 *     summary: Delete a program
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Program deleted
 */
router.delete('/:programId', adminDeleteProgram);

/**
 * @openapi
 * /api/admin/programs/{programId}/sessions:
 *   get:
 *     tags:
 *       - Admin Program Sessions
 *     summary: List sessions for a program
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sessions belonging to the program
 */
router.get('/:programId/sessions', adminListProgramSessions);

/**
 * @openapi
 * /api/admin/programs/{programId}/sessions:
 *   post:
 *     tags:
 *       - Admin Program Sessions
 *     summary: Create a session for a program
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProgramSessionUpsertRequest'
 *     responses:
 *       201:
 *         description: Session created
 */
router.post('/:programId/sessions', adminCreateProgramSession);

/**
 * @openapi
 * /api/admin/programs/{programId}/sessions/{sessionId}:
 *   put:
 *     tags:
 *       - Admin Program Sessions
 *     summary: Update a program session
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProgramSessionUpsertRequest'
 *     responses:
 *       200:
 *         description: Session updated
 */
router.put('/:programId/sessions/:sessionId', adminUpdateProgramSession);

/**
 * @openapi
 * /api/admin/programs/{programId}/sessions/{sessionId}:
 *   delete:
 *     tags:
 *       - Admin Program Sessions
 *     summary: Delete a program session
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Session deleted
 */
router.delete('/:programId/sessions/:sessionId', adminDeleteProgramSession);

export default router;
