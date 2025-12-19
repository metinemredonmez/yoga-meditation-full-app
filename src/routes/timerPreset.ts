import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as timerPresetController from '../controllers/timerPresetController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ==================== USER ENDPOINTS ====================

// GET /api/timer/presets - Get timer presets (system + user)
router.get('/', timerPresetController.getTimerPresets);

// POST /api/timer/presets - Create timer preset
router.post('/', timerPresetController.createTimerPreset);

// GET /api/timer/presets/:id - Get timer preset by ID
router.get('/:id', timerPresetController.getTimerPreset);

// PUT /api/timer/presets/:id - Update timer preset
router.put('/:id', timerPresetController.updateTimerPreset);

// DELETE /api/timer/presets/:id - Delete timer preset
router.delete('/:id', timerPresetController.deleteTimerPreset);

// POST /api/timer/presets/:id/default - Set preset as default
router.post('/:id/default', timerPresetController.setDefaultPreset);

export default router;
