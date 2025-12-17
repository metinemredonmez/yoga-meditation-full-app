import { Router } from 'express';
import {
  listClasses,
  createClass,
  getClassById,
  updateClass,
  deleteClass,
  getClassStats,
} from '../controllers/classController';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

/**
 * @openapi
 * /api/classes:
 *   get:
 *     tags:
 *       - Classes
 *     summary: List available classes
 *     responses:
 *       200:
 *         description: A list of yoga classes.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 classes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Class'
 */
router.get('/', listClasses);

/**
 * @openapi
 * /api/classes/{id}:
 *   get:
 *     tags:
 *       - Classes
 *     summary: Get class details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Details for the requested class.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 class:
 *                   $ref: '#/components/schemas/Class'
 *       404:
 *         description: Class not found.
 */
router.get('/:id', getClassById);

/**
 * @openapi
 * /api/classes:
 *   post:
 *     tags:
 *       - Classes
 *     summary: Create a new class
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClassCreateRequest'
 *     responses:
 *       201:
 *         description: Class created successfully.
 *       400:
 *         description: Validation error.
 */
router.post('/', authenticateToken, requireRoles('ADMIN', 'TEACHER'), createClass);

/**
 * @openapi
 * /api/classes/{id}:
 *   put:
 *     tags:
 *       - Classes
 *     summary: Update an existing class
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
 *             $ref: '#/components/schemas/ClassUpdateRequest'
 *     responses:
 *       200:
 *         description: Class updated successfully.
 *       404:
 *         description: Class not found.
 */
router.put('/:id', authenticateToken, requireRoles('ADMIN', 'TEACHER'), updateClass);

/**
 * @openapi
 * /api/classes/{id}:
 *   delete:
 *     tags:
 *       - Classes
 *     summary: Delete a class
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Class deleted successfully.
 */
router.delete('/:id', authenticateToken, requireRoles('ADMIN', 'TEACHER'), deleteClass);

/**
 * @openapi
 * /api/classes/stats:
 *   get:
 *     tags:
 *       - Classes
 *     summary: Get class statistics for admin dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Class statistics
 */
router.get('/stats', authenticateToken, requireRoles('ADMIN', 'TEACHER'), getClassStats);

export default router;
