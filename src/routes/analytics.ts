import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// All analytics routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRoles('ADMIN'));

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get dashboard metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard metrics retrieved successfully
 */
router.get('/dashboard', analyticsController.getDashboardMetrics);

/**
 * @swagger
 * /api/analytics/mrr:
 *   get:
 *     summary: Get MRR and ARR
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: MRR and ARR retrieved successfully
 */
router.get('/mrr', analyticsController.getMRR);

/**
 * @swagger
 * /api/analytics/churn:
 *   get:
 *     summary: Get churn rate
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Churn rate retrieved successfully
 */
router.get('/churn', analyticsController.getChurnRate);

/**
 * @swagger
 * /api/analytics/ltv:
 *   get:
 *     summary: Get LTV metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: LTV metrics retrieved successfully
 */
router.get('/ltv', analyticsController.getLTV);

/**
 * @swagger
 * /api/analytics/revenue/by-provider:
 *   get:
 *     summary: Get revenue breakdown by provider
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Revenue by provider retrieved successfully
 */
router.get('/revenue/by-provider', analyticsController.getRevenueByProvider);

/**
 * @swagger
 * /api/analytics/subscriptions/by-tier:
 *   get:
 *     summary: Get subscription breakdown by tier
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscriptions by tier retrieved successfully
 */
router.get('/subscriptions/by-tier', analyticsController.getSubscriptionsByTier);

/**
 * @swagger
 * /api/analytics/revenue/over-time:
 *   get:
 *     summary: Get revenue over time
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *     responses:
 *       200:
 *         description: Revenue over time retrieved successfully
 */
router.get('/revenue/over-time', analyticsController.getRevenueOverTime);

/**
 * @swagger
 * /api/analytics/users:
 *   get:
 *     summary: Get user metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User metrics retrieved successfully
 */
router.get('/users', analyticsController.getUserMetrics);

/**
 * @swagger
 * /api/analytics/subscriptions:
 *   get:
 *     summary: Get subscription metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription metrics retrieved successfully
 */
router.get('/subscriptions', analyticsController.getSubscriptionMetrics);

/**
 * @swagger
 * /api/analytics/revenue-records:
 *   get:
 *     summary: Get revenue records
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: provider
 *         schema:
 *           type: string
 *       - in: query
 *         name: tier
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Revenue records retrieved successfully
 */
router.get('/revenue-records', analyticsController.getRevenueRecords);

/**
 * @swagger
 * /api/analytics/revenue-records:
 *   post:
 *     summary: Record a revenue event
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - amount
 *             properties:
 *               userId:
 *                 type: string
 *               subscriptionId:
 *                 type: string
 *               paymentId:
 *                 type: string
 *               invoiceId:
 *                 type: string
 *               type:
 *                 type: string
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *               provider:
 *                 type: string
 *               planId:
 *                 type: string
 *               tier:
 *                 type: string
 *               interval:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Revenue recorded successfully
 */
router.post('/revenue-records', analyticsController.recordRevenue);

/**
 * @swagger
 * /api/analytics/snapshots:
 *   get:
 *     summary: Get analytics snapshots
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Snapshots retrieved successfully
 */
router.get('/snapshots', analyticsController.getSnapshots);

/**
 * @swagger
 * /api/analytics/snapshots/latest:
 *   get:
 *     summary: Get latest analytics snapshot
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Latest snapshot retrieved successfully
 */
router.get('/snapshots/latest', analyticsController.getLatestSnapshot);

/**
 * @swagger
 * /api/analytics/snapshots:
 *   post:
 *     summary: Create analytics snapshot
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Snapshot created successfully
 */
router.post('/snapshots', analyticsController.createSnapshot);

// Reports
/**
 * @swagger
 * /api/analytics/reports/revenue:
 *   get:
 *     summary: Generate revenue report
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: provider
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, excel, pdf]
 *       - in: query
 *         name: includeDetails
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Report generated successfully
 */
router.get('/reports/revenue', analyticsController.generateRevenueReport);

/**
 * @swagger
 * /api/analytics/reports/subscriptions:
 *   get:
 *     summary: Generate subscription report
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: tier
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, excel, pdf]
 *       - in: query
 *         name: includeDetails
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Report generated successfully
 */
router.get('/reports/subscriptions', analyticsController.generateSubscriptionReport);

/**
 * @swagger
 * /api/analytics/reports/invoices:
 *   get:
 *     summary: Generate invoice report
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, excel, pdf]
 *       - in: query
 *         name: includeDetails
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Report generated successfully
 */
router.get('/reports/invoices', analyticsController.generateInvoiceReport);

/**
 * @swagger
 * /api/analytics/reports/full:
 *   get:
 *     summary: Generate full analytics report
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, excel, pdf]
 *       - in: query
 *         name: includeDetails
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Report generated successfully
 */
router.get('/reports/full', analyticsController.generateAnalyticsReport);

export default router;
