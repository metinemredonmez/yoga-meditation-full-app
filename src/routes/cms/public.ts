import { Router } from 'express';
import * as contentController from '../../controllers/cms/contentController';
import * as bannerController from '../../controllers/cms/bannerController';
import * as faqController from '../../controllers/cms/faqController';
import * as navigationController from '../../controllers/cms/navigationController';
import * as announcementController from '../../controllers/cms/announcementController';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Public Content (no auth required)
router.get('/content', contentController.getPublishedContents);
router.get('/content/:slug', contentController.getPublishedContent);

// Public Banners (no auth required)
router.get('/banners', bannerController.getActiveBanners);

// Public FAQs (no auth required)
router.get('/faqs', faqController.getPublicFaqs);
router.get('/faqs/search', faqController.searchFaqs);

// Public Navigation (no auth required)
router.get('/navigation/:slug', navigationController.getPublicMenu);
router.get('/navigation/location/:location', navigationController.getMenusByLocation);

// Public Announcements (no auth required for viewing, auth optional for dismissal)
router.get('/announcements', announcementController.getActiveAnnouncements);
router.post('/announcements/:id/dismiss', authenticate, announcementController.dismissAnnouncement);

export default router;
