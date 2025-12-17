import { Router } from 'express';
import * as reportingController from '../controllers/reportingController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validateBody } from '../middleware/validateRequest';
import {
  createReportBodySchema,
  resolveReportBodySchema,
  updateReportStatusBodySchema,
} from '../validation/communitySchemas';

const router = Router();

// ============================================
// User Report Routes
// ============================================

// Create report (generic)
router.post(
  '/',
  authenticate,
  validateBody(createReportBodySchema),
  reportingController.reportContent,
);

// Report specific content types
router.post('/topics/:topicId', authenticate, reportingController.reportTopic);
router.post('/posts/:postId', authenticate, reportingController.reportPost);
router.post('/comments/:commentId', authenticate, reportingController.reportComment);
router.post('/users/:userId', authenticate, reportingController.reportUser);

// ============================================
// Admin Report Routes
// ============================================

// Get all reports
router.get('/admin', authenticate, requireAdmin, reportingController.getReports);

// Get report stats
router.get('/admin/stats', authenticate, requireAdmin, reportingController.getReportStats);

// Get report by ID
router.get('/admin/:id', authenticate, requireAdmin, reportingController.getReportById);

// Resolve report
router.post(
  '/admin/:id/resolve',
  authenticate,
  requireAdmin,
  validateBody(resolveReportBodySchema),
  reportingController.resolveReport,
);

// Dismiss report
router.post('/admin/:id/dismiss', authenticate, requireAdmin, reportingController.dismissReport);

// Update report status
router.put(
  '/admin/:id/status',
  authenticate,
  requireAdmin,
  validateBody(updateReportStatusBodySchema),
  reportingController.updateReportStatus,
);

// Get user report history
router.get(
  '/admin/users/:userId/history',
  authenticate,
  requireAdmin,
  reportingController.getUserReportHistory,
);

export default router;
