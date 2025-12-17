import { Router } from 'express';
import * as exportController from '../../controllers/admin/exportController';

const router = Router();

router.get('/', exportController.getExportJobs);
router.post('/', exportController.createExportJob);
router.get('/:id', exportController.getExportJob);
router.post('/:id/cancel', exportController.cancelExportJob);
router.delete('/:id', exportController.deleteExportJob);
router.post('/cleanup', exportController.cleanupExpiredExports);

export default router;
