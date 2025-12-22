import { Router } from 'express';
import * as maintenanceController from '../../controllers/admin/maintenanceController';

const router = Router();

// Maintenance Windows
router.get('/windows', maintenanceController.getMaintenanceWindows);
router.get('/windows/active', maintenanceController.getActiveMaintenanceWindow);
router.get('/windows/upcoming', maintenanceController.getUpcomingMaintenanceWindows);
router.post('/windows', maintenanceController.createMaintenanceWindow);
router.put('/windows/:id', maintenanceController.updateMaintenanceWindow);
router.post('/windows/:id/cancel', maintenanceController.cancelMaintenanceWindow);
router.delete('/windows/:id', maintenanceController.deleteMaintenanceWindow);

// System Maintenance
router.post('/cache/clear', maintenanceController.clearCache);
router.post('/cleanup', maintenanceController.cleanupExpiredData);
router.post('/optimize', maintenanceController.runDatabaseOptimization);
router.get('/metrics', maintenanceController.getSystemMetrics);

// Health & Backup
router.get('/health', maintenanceController.runHealthCheck);
router.get('/backup/status', maintenanceController.getBackupStatus);
router.post('/backup/trigger', maintenanceController.triggerBackup);
router.get('/backups', maintenanceController.getBackups);
router.post('/backups', maintenanceController.createBackup);

export default router;
