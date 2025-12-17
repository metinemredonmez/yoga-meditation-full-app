import { Router } from 'express';
import mediaRoutes from './media';
import contentRoutes from './content';
import bannerRoutes from './banner';
import faqRoutes from './faq';
import navigationRoutes from './navigation';
import announcementRoutes from './announcement';
import publicRoutes from './public';

const router = Router();

// Admin CMS routes
router.use('/media', mediaRoutes);
router.use('/content', contentRoutes);
router.use('/banners', bannerRoutes);
router.use('/faqs', faqRoutes);
router.use('/navigation', navigationRoutes);
router.use('/announcements', announcementRoutes);

// Public CMS routes
router.use('/public', publicRoutes);

export default router;
