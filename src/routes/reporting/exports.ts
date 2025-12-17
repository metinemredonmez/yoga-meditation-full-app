import { Router } from 'express';
import { exportController } from '../../controllers/reporting';
import { validateRequest } from '../../middleware/validateRequest';
import { exportBodySchema } from '../../validation/reportingSchemas';

const router = Router();

// Create export
router.post('/', validateRequest({ body: exportBodySchema }), exportController.create);

// Get user's exports
router.get('/', exportController.list);

// Get export status
router.get('/:id', exportController.getStatus);

// Download export
router.get('/:id/download', exportController.download);

// Cancel export
router.post('/:id/cancel', exportController.cancel);

// Delete export
router.delete('/:id', exportController.remove);

export default router;
