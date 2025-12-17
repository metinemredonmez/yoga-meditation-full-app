import { Router } from 'express';
import * as dashboardController from '../../controllers/admin/dashboardController';

const router = Router();

// Dashboard stats
router.get('/stats', dashboardController.getDashboardStats);
router.get('/quick-stats', dashboardController.getQuickStats);
router.get('/activity', dashboardController.getRecentActivity);
router.get('/health', dashboardController.getSystemHealth);
router.get('/charts/:metric', dashboardController.getChartData);

// Dashboard preferences
router.get('/preferences', dashboardController.getDashboardPreference);
router.put('/preferences', dashboardController.setDashboardPreference);

export default router;
