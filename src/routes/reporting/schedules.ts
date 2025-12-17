import { Router } from 'express';
import { scheduleController } from '../../controllers/reporting';
import { validateRequest } from '../../middleware/validateRequest';
import { scheduleBodySchema, scheduleUpdateBodySchema } from '../../validation/reportingSchemas';

const router = Router();

// Get user's schedules
router.get('/', scheduleController.list);

// Create schedule
router.post('/', validateRequest({ body: scheduleBodySchema }), scheduleController.create);

// Get single schedule
router.get('/:id', scheduleController.get);

// Update schedule
router.put('/:id', validateRequest({ body: scheduleUpdateBodySchema }), scheduleController.update);

// Delete schedule
router.delete('/:id', scheduleController.remove);

// Pause schedule
router.post('/:id/pause', scheduleController.pause);

// Resume schedule
router.post('/:id/resume', scheduleController.resume);

// Get schedule history
router.get('/:id/history', scheduleController.getHistory);

// Run schedule now
router.post('/:id/run-now', scheduleController.runNow);

export default router;
