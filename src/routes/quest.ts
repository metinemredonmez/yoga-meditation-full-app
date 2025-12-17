import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateQuery } from '../middleware/validateRequest';
import * as questController from '../controllers/questController';
import { questQuerySchema } from '../validation/gamificationSchemas';

const router = Router();

// ============================================
// Quest Routes (All require authentication)
// ============================================

// Get all quests for user
router.get('/', authenticate, validateQuery(questQuerySchema), questController.getQuests);

// Get daily quests
router.get('/daily', authenticate, questController.getDailyQuests);

// Get weekly quests
router.get('/weekly', authenticate, questController.getWeeklyQuests);

// Get monthly quests
router.get('/monthly', authenticate, questController.getMonthlyQuests);

// Get quest stats
router.get('/stats', authenticate, questController.getQuestStats);

// Claim quest reward
router.post('/:id/claim', authenticate, questController.claimQuestReward);

export default router;
