import { Router } from 'express';
import * as announcementController from '../../controllers/cms/announcementController';
import { authenticate, requireRoles } from '../../middleware/auth';

const router = Router();

// Admin routes - require authentication and ADMIN role
router.use(authenticate, requireRoles('ADMIN'));

router.get('/', announcementController.getAnnouncements);
router.get('/:id', announcementController.getAnnouncement);
router.post('/', announcementController.createAnnouncement);
router.patch('/:id', announcementController.updateAnnouncement);
router.delete('/:id', announcementController.deleteAnnouncement);
router.patch('/:id/toggle', announcementController.toggleAnnouncementStatus);

export default router;
