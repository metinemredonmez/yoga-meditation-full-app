import { Router } from 'express';
import * as faqController from '../../controllers/cms/faqController';
import { authenticate, requireRoles } from '../../middleware/auth';

const router = Router();

// Admin routes - require authentication and ADMIN role
router.use(authenticate, requireRoles('ADMIN'));

// Categories
router.get('/categories', faqController.getFaqCategories);
router.get('/categories/:id', faqController.getFaqCategory);
router.post('/categories', faqController.createFaqCategory);
router.patch('/categories/:id', faqController.updateFaqCategory);
router.delete('/categories/:id', faqController.deleteFaqCategory);
router.post('/categories/reorder', faqController.reorderFaqCategories);

// Items
router.get('/items', faqController.getFaqItems);
router.get('/items/:id', faqController.getFaqItem);
router.post('/items', faqController.createFaqItem);
router.patch('/items/:id', faqController.updateFaqItem);
router.delete('/items/:id', faqController.deleteFaqItem);
router.patch('/items/:id/toggle', faqController.toggleFaqItemStatus);
router.post('/items/reorder', faqController.reorderFaqItems);

export default router;
