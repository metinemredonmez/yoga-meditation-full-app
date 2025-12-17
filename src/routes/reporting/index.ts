import { Router } from 'express';
import reportsRouter from './reports';
import exportsRouter from './exports';
import schedulesRouter from './schedules';
import dashboardRouter from './dashboard';
import analyticsRouter from './analytics';
import alertsRouter from './alerts';

const router = Router();

// Report definitions and instances
router.use('/', reportsRouter);

// Export management
router.use('/exports', exportsRouter);

// Schedule management
router.use('/schedules', schedulesRouter);

// Dashboard and widgets
router.use('/dashboard', dashboardRouter);

// Analytics endpoints
router.use('/analytics', analyticsRouter);

// Alerts management
router.use('/alerts', alertsRouter);

export default router;
