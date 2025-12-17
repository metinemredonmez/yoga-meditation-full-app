import { Router } from 'express';
import * as navigationController from '../../controllers/cms/navigationController';
import { authenticate, requireRoles } from '../../middleware/auth';

const router = Router();

// Admin routes - require authentication and ADMIN role
router.use(authenticate, requireRoles('ADMIN'));

// Menus
router.get('/menus', navigationController.getMenus);
router.get('/menus/:id', navigationController.getMenu);
router.get('/menus/slug/:slug', navigationController.getMenuBySlug);
router.post('/menus', navigationController.createMenu);
router.patch('/menus/:id', navigationController.updateMenu);
router.delete('/menus/:id', navigationController.deleteMenu);

// Menu Items
router.get('/menus/:menuId/items', navigationController.getMenuItems);
router.get('/items/:id', navigationController.getMenuItem);
router.post('/items', navigationController.createMenuItem);
router.patch('/items/:id', navigationController.updateMenuItem);
router.delete('/items/:id', navigationController.deleteMenuItem);
router.post('/items/reorder', navigationController.reorderMenuItems);
router.post('/items/:id/move', navigationController.moveMenuItem);

export default router;
