import { Router } from 'express';
import { reportController } from '../../controllers/reporting';
import { validateRequest } from '../../middleware/validateRequest';
import { reportGenerateBodySchema, reportInstanceBodySchema } from '../../validation/reportingSchemas';

const router = Router();

// Get all report definitions
router.get('/definitions', reportController.getDefinitions);

// Get single report definition by slug
router.get('/definitions/:slug', reportController.getDefinition);

// Generate report (without saving)
router.post('/generate', validateRequest({ body: reportGenerateBodySchema }), reportController.generate);

// Report instances
router.post('/instances', validateRequest({ body: reportInstanceBodySchema }), reportController.createInstance);
router.get('/instances', reportController.getInstances);
router.get('/instances/:id', reportController.getInstance);
router.delete('/instances/:id', reportController.removeInstance);
router.post('/instances/:id/refresh', reportController.refresh);

export default router;
