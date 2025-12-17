import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validateRequest';
import * as gamificationController from '../controllers/gamificationController';
import * as achievementController from '../controllers/achievementController';
import * as questController from '../controllers/questController';
import * as eventController from '../controllers/eventController';
import * as referralController from '../controllers/referralController';
import * as shopController from '../controllers/shopController';
import * as customizationController from '../controllers/customizationController';
import * as dailyRewardController from '../controllers/dailyRewardController';
import {
  addXPBodySchema,
  deductXPBodySchema,
  grantStreakFreezeBodySchema,
  createAchievementBodySchema,
  updateAchievementBodySchema,
  createQuestBodySchema,
  updateQuestBodySchema,
  questQuerySchema,
  createEventBodySchema,
  updateEventBodySchema,
  updateReferralCodeSettingsBodySchema,
  createShopItemBodySchema,
  updateShopItemBodySchema,
  createTitleBodySchema,
  updateTitleBodySchema,
  createFrameBodySchema,
  updateFrameBodySchema,
  grantTitleBodySchema,
  grantFrameBodySchema,
  createDailyRewardBodySchema,
  updateDailyRewardBodySchema,
} from '../validation/gamificationSchemas';

const router = Router();

// All routes require admin authentication
router.use(authenticate, requireAdmin);

// ============================================
// XP Management
// ============================================

// Add XP to user
router.post(
  '/users/:userId/xp/add',
  validateBody(addXPBodySchema),
  gamificationController.adminAddXP,
);

// Deduct XP from user
router.post(
  '/users/:userId/xp/deduct',
  validateBody(deductXPBodySchema),
  gamificationController.adminDeductXP,
);

// ============================================
// Streak Management
// ============================================

// Grant streak freeze to user
router.post(
  '/users/:userId/streak/freeze',
  validateBody(grantStreakFreezeBodySchema),
  gamificationController.adminGrantStreakFreeze,
);

// ============================================
// Achievement Management
// ============================================

// Create achievement
router.post(
  '/achievements',
  validateBody(createAchievementBodySchema),
  achievementController.createAchievement,
);

// Update achievement
router.put(
  '/achievements/:id',
  validateBody(updateAchievementBodySchema),
  achievementController.updateAchievement,
);

// Delete achievement
router.delete('/achievements/:id', achievementController.deleteAchievement);

// ============================================
// Quest Management
// ============================================

// Get all active quests
router.get(
  '/quests',
  validateQuery(questQuerySchema),
  questController.getActiveQuests,
);

// Create quest
router.post(
  '/quests',
  validateBody(createQuestBodySchema),
  questController.createQuest,
);

// Update quest
router.put(
  '/quests/:id',
  validateBody(updateQuestBodySchema),
  questController.updateQuest,
);

// Delete quest
router.delete('/quests/:id', questController.deleteQuest);

// ============================================
// Event Management
// ============================================

// Create event
router.post(
  '/events',
  validateBody(createEventBodySchema),
  eventController.createEvent,
);

// Update event
router.put(
  '/events/:id',
  validateBody(updateEventBodySchema),
  eventController.updateEvent,
);

// Delete event
router.delete('/events/:id', eventController.deleteEvent);

// Get event stats
router.get('/events/:id/stats', eventController.getEventStats);

// ============================================
// Referral Management
// ============================================

// Update user's referral code settings
router.put(
  '/users/:userId/referral',
  validateBody(updateReferralCodeSettingsBodySchema),
  referralController.updateReferralCodeSettings,
);

// ============================================
// Shop Management
// ============================================

// Get shop stats
router.get('/shop/stats', shopController.getShopStats);

// Create shop item
router.post(
  '/shop/items',
  validateBody(createShopItemBodySchema),
  shopController.createShopItem,
);

// Update shop item
router.put(
  '/shop/items/:id',
  validateBody(updateShopItemBodySchema),
  shopController.updateShopItem,
);

// Delete shop item
router.delete('/shop/items/:id', shopController.deleteShopItem);

// ============================================
// Title Management
// ============================================

// Create title
router.post(
  '/titles',
  validateBody(createTitleBodySchema),
  customizationController.createTitle,
);

// Update title
router.put(
  '/titles/:id',
  validateBody(updateTitleBodySchema),
  customizationController.updateTitle,
);

// Delete title
router.delete('/titles/:id', customizationController.deleteTitle);

// Grant title to user
router.post(
  '/users/:userId/titles',
  validateBody(grantTitleBodySchema),
  customizationController.grantTitle,
);

// ============================================
// Frame Management
// ============================================

// Create frame
router.post(
  '/frames',
  validateBody(createFrameBodySchema),
  customizationController.createFrame,
);

// Update frame
router.put(
  '/frames/:id',
  validateBody(updateFrameBodySchema),
  customizationController.updateFrame,
);

// Delete frame
router.delete('/frames/:id', customizationController.deleteFrame);

// Grant frame to user
router.post(
  '/users/:userId/frames',
  validateBody(grantFrameBodySchema),
  customizationController.grantFrame,
);

// ============================================
// Daily Reward Management
// ============================================

// Get all daily rewards config
router.get('/daily-rewards', dailyRewardController.getDailyRewards);

// Create daily reward
router.post(
  '/daily-rewards',
  validateBody(createDailyRewardBodySchema),
  dailyRewardController.createDailyReward,
);

// Update daily reward
router.put(
  '/daily-rewards/:id',
  validateBody(updateDailyRewardBodySchema),
  dailyRewardController.updateDailyReward,
);

// Delete daily reward
router.delete('/daily-rewards/:id', dailyRewardController.deleteDailyReward);

// Seed default daily rewards
router.post('/daily-rewards/seed', dailyRewardController.seedDailyRewards);

// Reset user's daily rewards
router.post('/users/:userId/daily-rewards/reset', dailyRewardController.resetUserDailyRewards);

export default router;
