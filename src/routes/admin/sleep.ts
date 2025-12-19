import { Router } from 'express';
import * as sleepStoryController from '../../controllers/sleepStoryController';

const router = Router();

// ==================== ADMIN SLEEP STORY ENDPOINTS ====================

// GET /api/admin/sleep/stories - Get all sleep stories (admin)
router.get('/stories', sleepStoryController.getAdminSleepStories);

// GET /api/admin/sleep/stories/stats - Get sleep story stats
router.get('/stories/stats', sleepStoryController.getSleepStoryStats);

// POST /api/admin/sleep/stories - Create sleep story
router.post('/stories', sleepStoryController.createSleepStory);

// PUT /api/admin/sleep/stories/:id - Update sleep story
router.put('/stories/:id', sleepStoryController.updateSleepStory);

// DELETE /api/admin/sleep/stories/:id - Delete sleep story
router.delete('/stories/:id', sleepStoryController.deleteSleepStory);

export default router;
