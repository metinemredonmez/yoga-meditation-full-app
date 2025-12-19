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

// Sprint 3: Timer/Session + Sleep
import timerRoutes from './timer';
import sleepRoutes from './sleep';

// Sprint 4: Journal
import journalRoutes from './journal';

// Sprint 11: Final Polish - New Routes
import goalTemplatesRoutes from './goalTemplates';
import reminderTemplatesRoutes from './reminderTemplates';
import onboardingRoutes from './onboarding';
import moodTagsRoutes from './moodTags';

// Integration Settings
import integrationsRoutes from './integrations';

// AI Agent System
import aiAgentsRoutes from './aiAgents';

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

// Sprint 3: Timer/Session + Sleep
router.use('/timer', timerRoutes);
router.use('/sleep', sleepRoutes);

// Sprint 4: Journal
router.use('/journal', journalRoutes);

// Sprint 11: Final Polish - New Routes
router.use('/goal-templates', goalTemplatesRoutes);
router.use('/reminder-templates', reminderTemplatesRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/mood-tags', moodTagsRoutes);

// Integration Settings Management
router.use('/integrations', integrationsRoutes);

// AI Agent System
router.use('/ai-agents', aiAgentsRoutes);

export default router;
