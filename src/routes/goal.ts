import { Router } from 'express';
import * as goalController from '../controllers/goalController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Templates & Suggestions
router.get('/templates', goalController.getTemplates);
router.get('/suggestions', goalController.getSuggestions);

// Goals CRUD
router.get('/', goalController.getGoals);
router.get('/:id', goalController.getGoal);
router.post('/', goalController.createGoal);
router.put('/:id', goalController.updateGoal);
router.delete('/:id', goalController.deleteGoal);
router.post('/:id/toggle', goalController.toggleGoal);
router.post('/:id/complete', goalController.completeGoal);

// Progress
router.post('/:id/progress', goalController.addProgress);
router.get('/:id/progress', goalController.getProgress);

export default router;
