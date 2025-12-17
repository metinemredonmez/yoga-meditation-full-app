import { Router } from 'express';
import { dashboardController } from '../../controllers/reporting';
import { validateRequest } from '../../middleware/validateRequest';
import { dashboardUpdateBodySchema, widgetPositionBodySchema } from '../../validation/reportingSchemas';
import { requireAdmin } from '../../middleware/auth';

const router = Router();

// Get user's dashboard
router.get('/', dashboardController.getDashboard);

// Update dashboard layout
router.put('/', validateRequest({ body: dashboardUpdateBodySchema }), dashboardController.updateDashboard);

// Get available widgets
router.get('/widgets', dashboardController.listWidgets);

// Add widget to dashboard
router.post('/widgets', dashboardController.addWidget);

// Update widget position
router.put('/widgets/:widgetId', validateRequest({ body: widgetPositionBodySchema }), dashboardController.updateWidgetPos);

// Remove widget from dashboard
router.delete('/widgets/:widgetId', dashboardController.removeWidget);

// Reset dashboard to defaults
router.post('/reset', dashboardController.reset);

// Get widget data
router.get('/widgets/:widgetId/data', dashboardController.getWidgetDataHandler);

// Admin routes for widget management
router.post('/admin/widgets', requireAdmin, dashboardController.createWidgetAdmin);
router.put('/admin/widgets/:id', requireAdmin, dashboardController.updateWidgetAdmin);
router.delete('/admin/widgets/:id', requireAdmin, dashboardController.deleteWidgetAdmin);

export default router;
