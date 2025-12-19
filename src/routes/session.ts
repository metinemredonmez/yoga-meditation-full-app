import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as sessionController from '../controllers/sessionController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ==================== SESSION MANAGEMENT ====================

// POST /api/sessions - Start new session
router.post('/', sessionController.startSession);

// GET /api/sessions/active - Get active session
router.get('/active', sessionController.getActiveSession);

// GET /api/sessions/history - Get session history
router.get('/history', sessionController.getSessionHistory);

// GET /api/sessions/stats - Get session statistics
router.get('/stats', sessionController.getSessionStats);

// GET /api/sessions/:id - Get session by ID
router.get('/:id', sessionController.getSession);

// PUT /api/sessions/:id - Update session
router.put('/:id', sessionController.updateSession);

// POST /api/sessions/:id/pause - Pause session
router.post('/:id/pause', sessionController.pauseSession);

// POST /api/sessions/:id/resume - Resume session
router.post('/:id/resume', sessionController.resumeSession);

// POST /api/sessions/:id/end - End session (abandon)
router.post('/:id/end', sessionController.endSession);

// POST /api/sessions/:id/complete - Complete session
router.post('/:id/complete', sessionController.completeSession);

export default router;
