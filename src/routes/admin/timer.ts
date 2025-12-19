import { Router } from 'express';
import * as timerPresetController from '../../controllers/timerPresetController';

const router = Router();

// ==================== ADMIN TIMER PRESET ENDPOINTS ====================

// GET /api/admin/timer/presets - Get all timer presets
router.get('/presets', timerPresetController.getAllTimerPresets);

// POST /api/admin/timer/presets - Create system timer preset
router.post('/presets', timerPresetController.createSystemPreset);

// PUT /api/admin/timer/presets/:id - Update system timer preset
router.put('/presets/:id', timerPresetController.updateSystemPreset);

// DELETE /api/admin/timer/presets/:id - Delete system timer preset
router.delete('/presets/:id', timerPresetController.deleteSystemPreset);

export default router;
