import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { listUsers, updateUserRole } from '../controllers/adminController';

const router = Router();

router.use(authenticateToken);
router.use(requireRoles('ADMIN'));

/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     tags:
 *       - Admin
 *     summary: List all users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of users.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       403:
 *         description: Admin role required.
 */
router.get('/users', listUsers);

/**
 * @openapi
 * /api/admin/users/{id}/role:
 *   put:
 *     tags:
 *       - Admin
 *     summary: Update a user's role
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
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: ['ADMIN', 'TEACHER', 'STUDENT']
 *     responses:
 *       200:
 *         description: Role updated successfully.
 *       404:
 *         description: User not found.
 */
router.put('/users/:id/role', updateUserRole);

export default router;
