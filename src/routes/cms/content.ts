import { Router } from 'express';
import * as contentController from '../../controllers/cms/contentController';
import { authenticate, requireRoles } from '../../middleware/auth';

const router = Router();

// Admin routes - require authentication and ADMIN role
router.use(authenticate, requireRoles('ADMIN'));

// Content
router.get('/', contentController.getContents);
router.get('/:id', contentController.getContent);
router.get('/slug/:slug', contentController.getContentBySlug);
router.post('/', contentController.createContent);
router.patch('/:id', contentController.updateContent);
router.patch('/:id/status', contentController.updateContentStatus);
router.delete('/:id', contentController.deleteContent);

// Content Versions
router.get('/:contentId/versions', contentController.getContentVersions);
router.post('/:contentId/versions', contentController.createContentVersion);
router.get('/versions/:versionId', contentController.getContentVersion);
router.post('/versions/:versionId/restore', contentController.restoreContentVersion);

// Categories
router.get('/categories/list', contentController.getCategories);
router.get('/categories/:id', contentController.getCategory);
router.post('/categories', contentController.createCategory);
router.patch('/categories/:id', contentController.updateCategory);
router.delete('/categories/:id', contentController.deleteCategory);

// Tags
router.get('/tags/list', contentController.getTags);
router.get('/tags/:id', contentController.getTag);
router.post('/tags', contentController.createTag);
router.patch('/tags/:id', contentController.updateTag);
router.delete('/tags/:id', contentController.deleteTag);

// Templates
router.get('/templates/list', contentController.getTemplates);
router.get('/templates/:id', contentController.getTemplate);
router.post('/templates', contentController.createTemplate);
router.patch('/templates/:id', contentController.updateTemplate);
router.delete('/templates/:id', contentController.deleteTemplate);

export default router;
