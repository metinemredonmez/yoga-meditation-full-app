import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as sleepTrackingController from '../controllers/sleepTrackingController';
import * as sleepStoryController from '../controllers/sleepStoryController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ==================== SLEEP TRACKING ====================

// GET /api/sleep/tracking - Get sleep tracking records
router.get('/', sleepTrackingController.getSleepTracking);

// GET /api/sleep/tracking/stats - Get sleep statistics
router.get('/stats', sleepTrackingController.getSleepStats);

// GET /api/sleep/tracking/today - Get today's sleep record
router.get('/today', sleepTrackingController.getTodaySleep);

// GET /api/sleep/tracking/last-night - Get last night's sleep record
router.get('/last-night', sleepTrackingController.getLastNightSleep);

// POST /api/sleep/tracking - Create sleep tracking record
router.post('/', sleepTrackingController.createSleepTracking);

// GET /api/sleep/tracking/:id - Get sleep tracking by ID
router.get('/:id', sleepTrackingController.getSleepTrackingById);

// PUT /api/sleep/tracking/:id - Update sleep tracking record
router.put('/:id', sleepTrackingController.updateSleepTracking);

// DELETE /api/sleep/tracking/:id - Delete sleep tracking record
router.delete('/:id', sleepTrackingController.deleteSleepTracking);

// ==================== SLEEP TIMER SETTINGS ====================

// GET /api/sleep/timer/settings - Get sleep timer settings
router.get('/timer/settings', sleepStoryController.getSleepTimerSettings);

// PUT /api/sleep/timer/settings - Update sleep timer settings
router.put('/timer/settings', sleepStoryController.updateSleepTimerSettings);

export default router;
