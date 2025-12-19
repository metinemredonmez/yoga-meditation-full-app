import { Router } from 'express';
import * as moderationController from '../../controllers/admin/moderationController';

const router = Router();

// Stats & Queue
router.get('/stats', moderationController.getModerationStats);
router.get('/queue', moderationController.getContentReviewQueue);

// Reports
router.get('/reports', moderationController.getReports);
router.get('/reports/:id', moderationController.getReportDetails);
router.post('/reports/:id/resolve', moderationController.resolveReport);
router.post('/reports/bulk-resolve', moderationController.bulkResolveReports);

// Comments
router.get('/comments', moderationController.getComments);
router.delete('/comments/:id', moderationController.deleteComment);
router.post('/comments/:id/hide', moderationController.hideComment);
router.post('/comments/bulk-delete', moderationController.bulkDeleteComments);

// Forum Posts - DISABLED (Forum models removed)
// router.get('/forum-posts', moderationController.getForumPosts);
// router.delete('/forum-posts/:id', moderationController.deleteForumPost);
// router.post('/forum-posts/:id/lock', moderationController.lockForumPost);
// router.post('/forum-posts/:id/pin', moderationController.pinForumPost);

export default router;
