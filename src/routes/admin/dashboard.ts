import { Router } from 'express';
import * as dashboardController from '../../controllers/admin/dashboardController';
import * as userManagementController from '../../controllers/admin/userManagementController';

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

// User management
router.get('/users', userManagementController.getUsers);
router.get('/users/:id', userManagementController.getUserById);
router.post('/users/:id/ban', userManagementController.banUser);
router.post('/users/:id/unban', userManagementController.unbanUser);
router.post('/users/:id/warn', userManagementController.warnUser);
router.patch('/users/:id/role', userManagementController.changeUserRole);
router.post('/users/:id/reset-password', userManagementController.resetUserPassword);
router.get('/users/:id/activity', userManagementController.getUserActivity);

export default router;
