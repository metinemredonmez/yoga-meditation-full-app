import { Router } from 'express';
const router: Router = Router();

/**
 * @openapi
 * /api/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check
 *     description: Returns the current health status of the API.
 *     responses:
 *       200:
 *         description: API is operating normally.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
router.get('/', async (req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default router;
