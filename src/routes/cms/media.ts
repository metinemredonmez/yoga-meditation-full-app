import { Router } from 'express';
import * as mediaController from '../../controllers/cms/mediaController';
import { authenticate, requireRoles } from '../../middleware/auth';

const router = Router();

// All routes require authentication and ADMIN role
router.use(authenticate, requireRoles('ADMIN'));

// Media Files
router.get('/files', mediaController.getMediaFiles);
router.get('/files/:id', mediaController.getMediaFile);
router.post('/files', mediaController.createMediaFile);
router.patch('/files/:id', mediaController.updateMediaFile);
router.patch('/files/:id/status', mediaController.updateMediaStatus);
router.delete('/files/:id', mediaController.deleteMediaFile);
router.post('/files/bulk-delete', mediaController.bulkDeleteMediaFiles);

// Media Variants
router.post('/files/:mediaId/variants', mediaController.createMediaVariant);

// Media Folders
router.get('/folders', mediaController.getMediaFolders);
router.get('/folders/:id', mediaController.getMediaFolder);
router.post('/folders', mediaController.createMediaFolder);
router.patch('/folders/:id', mediaController.updateMediaFolder);
router.delete('/folders/:id', mediaController.deleteMediaFolder);

// Media Usage Tracking
router.get('/files/:mediaId/usages', mediaController.getMediaUsages);
router.post('/files/:mediaId/usages', mediaController.trackMediaUsage);
router.delete('/files/:mediaId/usages', mediaController.removeMediaUsage);

export default router;
