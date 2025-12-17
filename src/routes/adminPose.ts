import { Router } from 'express';
import {
  postPose,
  putPose,
  deletePoseHandler,
  getPoses,
  getPose,
} from '../controllers/poseController';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.use(requireRoles('ADMIN'));

/**
 * @openapi
 * /api/admin/poses:
 *   get:
 *     tags:
 *       - Admin Poses
 *     summary: List poses (admin view)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of poses.
 */
router.get('/', getPoses);

/**
 * @openapi
 * /api/admin/poses:
 *   post:
 *     tags:
 *       - Admin Poses
 *     summary: Create a pose
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PoseUpsertRequest'
 *     responses:
 *       201:
 *         description: Pose created.
 */
router.post('/', postPose);

/**
 * @openapi
 * /api/admin/poses/{poseId}:
 *   get:
 *     tags:
 *       - Admin Poses
 *     summary: Get pose detail (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: poseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pose detail.
 */
router.get('/:poseId', getPose);

/**
 * @openapi
 * /api/admin/poses/{poseId}:
 *   put:
 *     tags:
 *       - Admin Poses
 *     summary: Update a pose
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: poseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PoseUpsertRequest'
 *     responses:
 *       200:
 *         description: Pose updated.
 */
router.put('/:poseId', putPose);

/**
 * @openapi
 * /api/admin/poses/{poseId}:
 *   delete:
 *     tags:
 *       - Admin Poses
 *     summary: Delete a pose
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: poseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Pose deleted.
 */
router.delete('/:poseId', deletePoseHandler);

export default router;
