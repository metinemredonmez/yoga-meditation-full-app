import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { handleUsageReport, handleRevenueReport } from '../controllers/adminReportController';

const router = Router();

router.use(authenticateToken);
router.use(requireRoles('ADMIN'));

/**
 * @openapi
 * /api/admin/reports/usage:
 *   get:
 *     tags:
 *       - Admin Reports
 *     summary: Get high-level platform usage metrics
 *     description: |
 *       Returns user activity, streak distribution (based on confirmed bookings), and the most popular challenges.
 *       When running against the bundled seed data, the response mirrors typical demo dashboards.
 *
 *       Example curl:
 *       ```bash
 *       curl -X GET \\
 *         -H "Authorization: Bearer <token>" \\
 *         http://localhost:3000/api/admin/reports/usage
 *       ```
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usage report generated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminUsageReportResponse'
 *             examples:
 *               demo:
 *                 summary: Demo seed response
 *                 value:
 *                   report:
 *                     generatedAt: '2024-07-01T12:00:00.000Z'
 *                     totalUsers: 1280
 *                     activeUsersLast7d: 312
 *                     streakDistribution:
 *                       - length: 1
 *                         count: 420
 *                       - length: 3
 *                         count: 158
 *                       - length: 7
 *                         count: 36
 *                     topChallenges:
 *                       - id: 'chlg_seed_1'
 *                         title: 'Spring Detox Challenge'
 *                         enrollmentCount: 87
 *                       - id: 'chlg_seed_2'
 *                         title: 'Mindful Morning Reset'
 *                         enrollmentCount: 76
 *       403:
 *         description: Admin role required.
 */
router.get('/usage', handleUsageReport);

/**
 * @openapi
 * /api/admin/reports/revenue:
 *   get:
 *     tags:
 *       - Admin Reports
 *     summary: Get revenue and subscription insights
 *     description: |
 *       Aggregates subscription payments to surface key revenue metrics (MRR/ARR),
 *       active subscription counts, and recent failed payments. Seeded data showcases
 *       a representative demo snapshot.
 *
 *       Example curl:
 *       ```bash
 *       curl -X GET \\
 *         -H "Authorization: Bearer <token>" \\
 *         http://localhost:3000/api/admin/reports/revenue
 *       ```
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Revenue report generated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminRevenueReportResponse'
 *             examples:
 *               demo:
 *                 summary: Demo seed response
 *                 value:
 *                   report:
 *                     generatedAt: '2024-07-01T12:00:00.000Z'
 *                     mrr: 4280.5
 *                     arr: 51366
 *                     activeSubscriptions: 640
 *                     failedPayments:
 *                       countLast30d: 12
 *                       totalAmountLast30d: 599.88
 *                       recent:
 *                         - id: 'pay_seed_1'
 *                           userId: 'usr_seed_42'
 *                           amount: 49.99
 *                           createdAt: '2024-06-28T09:20:00.000Z'
 *                         - id: 'pay_seed_2'
 *                           userId: 'usr_seed_51'
 *                           amount: 49.99
 *                           createdAt: '2024-06-26T16:45:00.000Z'
 *       403:
 *         description: Admin role required.
 */
router.get('/revenue', handleRevenueReport);

export default router;
