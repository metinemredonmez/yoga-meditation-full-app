import { Router } from 'express';
import { getTagsGrouped } from '../controllers/programController';

const router = Router();

/**
 * @openapi
 * /api/tags:
 *   get:
 *     tags:
 *       - Tags
 *     summary: List available tags grouped by kind
 *     responses:
 *       200:
 *         description: Tags grouped by LEVEL, FOCUS, and EQUIPMENT.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tags:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Tag'
 */
router.get('/', getTagsGrouped);

export default router;
