import { Router } from 'express';
import * as bulkActionController from '../../controllers/admin/bulkActionController';

const router = Router();

// Async bulk action jobs
router.get('/jobs', bulkActionController.getBulkActionJobs);
router.post('/jobs', bulkActionController.createBulkActionJob);
router.get('/jobs/:id', bulkActionController.getBulkActionJob);
router.post('/jobs/:id/cancel', bulkActionController.cancelBulkActionJob);

// Quick bulk actions (sync)
router.post('/users/delete', bulkActionController.bulkDeleteUsers);
router.post('/users/ban', bulkActionController.bulkBanUsers);
router.post('/users/unban', bulkActionController.bulkUnbanUsers);
router.post('/notifications/send', bulkActionController.bulkSendNotification);
router.post('/subscriptions/update', bulkActionController.bulkUpdateSubscriptions);

export default router;
