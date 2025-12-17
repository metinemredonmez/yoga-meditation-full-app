import { Router } from 'express';
import * as bannerController from '../../controllers/cms/bannerController';
import { authenticate, requireRoles } from '../../middleware/auth';

const router = Router();

// Admin routes - require authentication and ADMIN role
router.use(authenticate, requireRoles('ADMIN'));

router.get('/', bannerController.getBanners);
router.get('/:id', bannerController.getBanner);
router.post('/', bannerController.createBanner);
router.patch('/:id', bannerController.updateBanner);
router.delete('/:id', bannerController.deleteBanner);
router.patch('/:id/toggle', bannerController.toggleBannerStatus);
router.post('/reorder', bannerController.reorderBanners);

export default router;
