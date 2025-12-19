import { Router } from 'express';
import * as journalController from '../controllers/journalController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Journal entries
router.get('/', journalController.getEntries);
router.get('/favorites', journalController.getFavorites);
router.get('/calendar', journalController.getCalendar);
router.get('/stats', journalController.getStats);
router.get('/search', journalController.searchEntries);
router.get('/prompts', journalController.getPrompts);
router.get('/prompts/random', journalController.getRandomPrompt);
router.get('/:id', journalController.getEntry);
router.post('/', journalController.createEntry);
router.put('/:id', journalController.updateEntry);
router.delete('/:id', journalController.deleteEntry);
router.post('/:id/favorite', journalController.toggleFavorite);

export default router;
