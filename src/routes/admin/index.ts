import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth';

// Import admin sub-routers
import dashboardRoutes from './dashboard';
import usersRoutes from './users';
import contentRoutes from './content';
import financialRoutes from './financial';
import settingsRoutes from './settings';
import analyticsRoutes from './analytics';
import auditRoutes from './audit';
import moderationRoutes from './moderation';
import maintenanceRoutes from './maintenance';
import exportsRoutes from './exports';
import bulkRoutes from './bulk';
import notesRoutes from './notes';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin);

// Mount sub-routers
// Dashboard routes are mounted at root level since parent is already /api/admin/dashboard
router.use('/', dashboardRoutes);
router.use('/users', usersRoutes);
router.use('/content', contentRoutes);
router.use('/financial', financialRoutes);
router.use('/settings', settingsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/audit', auditRoutes);
router.use('/moderation', moderationRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/exports', exportsRoutes);
router.use('/bulk', bulkRoutes);
router.use('/notes', notesRoutes);

export default router;
