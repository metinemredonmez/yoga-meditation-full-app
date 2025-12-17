import { Router } from 'express';
import {
  getPlanner,
  createPlannerEntryHandler,
  deletePlannerEntryHandler,
} from '../controllers/plannerController';
import { authenticateToken } from '../middleware/auth';
import { requireActiveSubscription } from '../middleware/entitlement';

const router = Router();

router.use(authenticateToken);
router.use(requireActiveSubscription);

/**
 * @openapi
 * /api/planner:
 *   get:
 *     tags:
 *       - Planner
 *     summary: Get planner entries for the current week
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: weekStart
 *         schema:
 *           type: string
 *           format: date-time
 *         description: ISO date representing the start of the week (defaults to today)
 *     responses:
 *       200:
 *         description: Planner entries for the specified week.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 entries:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PlannerEntry'
 */
router.get('/', getPlanner);

/**
 * @openapi
 * /api/planner/entries:
 *   post:
 *     tags:
 *       - Planner
 *     summary: Create a planner entry
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlannerEntryCreateRequest'
 *     responses:
 *       201:
 *         description: Planner entry created.
 */
router.post('/entries', createPlannerEntryHandler);

/**
 * @openapi
 * /api/planner/entries/{entryId}:
 *   delete:
 *     tags:
 *       - Planner
 *     summary: Delete a planner entry
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Planner entry deleted.
 */
router.delete('/entries/:entryId', deletePlannerEntryHandler);

export default router;
