import { z } from 'zod';

// ============================================
// XP & Level Schemas
// ============================================

export const addXPBodySchema = z.object({
  amount: z.number().int().positive('Amount must be positive'),
  source: z.enum([
    'CLASS_COMPLETION',
    'PROGRAM_COMPLETION',
    'CHALLENGE_COMPLETION',
    'ACHIEVEMENT_UNLOCK',
    'QUEST_COMPLETION',
    'DAILY_BONUS',
    'STREAK_BONUS',
    'REFERRAL_BONUS',
    'EVENT_REWARD',
    'MILESTONE_REWARD',
    'ADMIN_GRANT',
    'PURCHASE_REFUND',
    'OTHER',
  ]),
  description: z.string().optional(),
  referenceId: z.string().uuid().optional(),
  referenceType: z.string().optional(),
});

export const deductXPBodySchema = z.object({
  amount: z.number().int().positive('Amount must be positive'),
  reason: z.string().min(1, 'Reason is required'),
});

export const xpLeaderboardQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  period: z.enum(['all', 'monthly', 'weekly']).optional(),
});

// ============================================
// Streak Schemas
// ============================================

export const grantStreakFreezeBodySchema = z.object({
  count: z.number().int().min(1).max(10).default(1),
  reason: z.string().optional(),
});

// ============================================
// Achievement Schemas
// ============================================

export const achievementQuerySchema = z.object({
  category: z
    .enum([
      'PRACTICE',
      'STREAK',
      'SOCIAL',
      'CHALLENGE',
      'PROGRAM',
      'MILESTONE',
      'SPECIAL',
      'SEASONAL',
    ])
    .optional(),
  difficulty: z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']).optional(),
  includeSecret: z.enum(['true', 'false']).optional(),
});

export const userAchievementQuerySchema = z.object({
  category: z
    .enum([
      'PRACTICE',
      'STREAK',
      'SOCIAL',
      'CHALLENGE',
      'PROGRAM',
      'MILESTONE',
      'SPECIAL',
      'SEASONAL',
    ])
    .optional(),
  completed: z.enum(['true', 'false']).optional(),
});

export const createAchievementBodySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.enum([
    'PRACTICE',
    'STREAK',
    'SOCIAL',
    'CHALLENGE',
    'PROGRAM',
    'MILESTONE',
    'SPECIAL',
    'SEASONAL',
  ]),
  difficulty: z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']),
  iconUrl: z.string().url().optional(),
  xpReward: z.number().int().min(0).default(0),
  badgeId: z.string().uuid().optional(),
  isSecret: z.boolean().default(false),
  isActive: z.boolean().default(true),
  requirementType: z.enum([
    'CLASS_COUNT',
    'PROGRAM_COUNT',
    'STREAK_DAYS',
    'CHALLENGE_COUNT',
    'XP_EARNED',
    'LEVEL_REACHED',
    'REFERRAL_COUNT',
    'FORUM_POSTS',
    'CUSTOM',
  ]),
  requirementValue: z.number().int().min(1),
  requirementData: z.any().optional(),
  prerequisiteId: z.string().uuid().optional(),
  tiers: z
    .array(
      z.object({
        tier: z.number().int().min(1),
        name: z.string(),
        description: z.string().optional(),
        requirementValue: z.number().int().min(1),
        xpReward: z.number().int().min(0),
        badgeId: z.string().uuid().optional(),
      }),
    )
    .optional(),
});

export const updateAchievementBodySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  category: z
    .enum([
      'PRACTICE',
      'STREAK',
      'SOCIAL',
      'CHALLENGE',
      'PROGRAM',
      'MILESTONE',
      'SPECIAL',
      'SEASONAL',
    ])
    .optional(),
  difficulty: z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']).optional(),
  iconUrl: z.string().url().optional(),
  xpReward: z.number().int().min(0).optional(),
  isSecret: z.boolean().optional(),
  isActive: z.boolean().optional(),
  requirementType: z
    .enum([
      'CLASS_COUNT',
      'PROGRAM_COUNT',
      'STREAK_DAYS',
      'CHALLENGE_COUNT',
      'XP_EARNED',
      'LEVEL_REACHED',
      'REFERRAL_COUNT',
      'FORUM_POSTS',
      'CUSTOM',
    ])
    .optional(),
  requirementValue: z.number().int().min(1).optional(),
  requirementData: z.any().optional(),
});

// ============================================
// Quest Schemas
// ============================================

export const questQuerySchema = z.object({
  type: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'SPECIAL']).optional(),
});

export const createQuestBodySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'SPECIAL']),
  requirementType: z.enum([
    'COMPLETE_CLASSES',
    'PRACTICE_MINUTES',
    'COMPLETE_PROGRAM_DAY',
    'MAINTAIN_STREAK',
    'EARN_XP',
    'FORUM_ACTIVITY',
    'CUSTOM',
  ]),
  requirementValue: z.number().int().min(1),
  requirementData: z.any().optional(),
  xpReward: z.number().int().min(0),
  bonusRewardType: z
    .enum(['XP_MULTIPLIER', 'STREAK_FREEZE', 'BADGE', 'TITLE', 'FRAME', 'SHOP_DISCOUNT'])
    .optional(),
  bonusRewardValue: z.string().optional(),
  resetPeriod: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'NEVER']).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
});

export const updateQuestBodySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  type: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'SPECIAL']).optional(),
  requirementType: z
    .enum([
      'COMPLETE_CLASSES',
      'PRACTICE_MINUTES',
      'COMPLETE_PROGRAM_DAY',
      'MAINTAIN_STREAK',
      'EARN_XP',
      'FORUM_ACTIVITY',
      'CUSTOM',
    ])
    .optional(),
  requirementValue: z.number().int().min(1).optional(),
  requirementData: z.any().optional(),
  xpReward: z.number().int().min(0).optional(),
  bonusRewardType: z
    .enum(['XP_MULTIPLIER', 'STREAK_FREEZE', 'BADGE', 'TITLE', 'FRAME', 'SHOP_DISCOUNT'])
    .optional(),
  bonusRewardValue: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// Event Schemas
// ============================================

export const eventQuerySchema = z.object({
  upcoming: z.enum(['true', 'false']).optional(),
  past: z.enum(['true', 'false']).optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

export const createEventBodySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.string().min(1, 'Type is required'),
  imageUrl: z.string().url().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  goalType: z.string().min(1),
  goalValue: z.number().int().min(1),
  tierRewards: z.any(),
  isActive: z.boolean().default(true),
});

export const updateEventBodySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  imageUrl: z.string().url().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  goalType: z.string().min(1).optional(),
  goalValue: z.number().int().min(1).optional(),
  tierRewards: z.any().optional(),
  isActive: z.boolean().optional(),
});

export const leaderboardQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

// ============================================
// Referral Schemas
// ============================================

export const applyReferralCodeBodySchema = z.object({
  code: z.string().min(1, 'Code is required'),
});

export const updateReferralCodeSettingsBodySchema = z.object({
  maxUsage: z.number().int().min(1).optional(),
  bonusXP: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

// ============================================
// Shop Schemas
// ============================================

export const shopQuerySchema = z.object({
  type: z
    .enum(['XP_BOOST', 'STREAK_FREEZE', 'BADGE', 'TITLE', 'FRAME', 'THEME', 'SPECIAL'])
    .optional(),
  available: z.enum(['true', 'false']).optional(),
});

export const createShopItemBodySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['XP_BOOST', 'STREAK_FREEZE', 'BADGE', 'TITLE', 'FRAME', 'THEME', 'SPECIAL']),
  imageUrl: z.string().url().optional(),
  xpCost: z.number().int().min(0),
  itemData: z.any().optional(),
  requiredLevel: z.number().int().min(1).optional(),
  requiredBadgeId: z.string().uuid().optional(),
  maxPurchases: z.number().int().min(1).optional(),
  availableFrom: z.string().datetime().optional(),
  availableUntil: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().optional(),
});

export const updateShopItemBodySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  type: z
    .enum(['XP_BOOST', 'STREAK_FREEZE', 'BADGE', 'TITLE', 'FRAME', 'THEME', 'SPECIAL'])
    .optional(),
  imageUrl: z.string().url().optional(),
  xpCost: z.number().int().min(0).optional(),
  itemData: z.any().optional(),
  requiredLevel: z.number().int().min(1).optional(),
  requiredBadgeId: z.string().uuid().optional(),
  maxPurchases: z.number().int().min(1).optional(),
  availableFrom: z.string().datetime().optional(),
  availableUntil: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

// ============================================
// Customization Schemas (Titles & Frames)
// ============================================

export const titleQuerySchema = z.object({
  rarity: z.enum(['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY']).optional(),
  unlockType: z.enum(['LEVEL', 'ACHIEVEMENT', 'PURCHASE', 'EVENT', 'ADMIN']).optional(),
});

export const frameQuerySchema = z.object({
  unlockType: z.enum(['LEVEL', 'ACHIEVEMENT', 'PURCHASE', 'EVENT', 'ADMIN']).optional(),
});

export const createTitleBodySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  displayText: z.string().min(1, 'Display text is required'),
  description: z.string().optional(),
  rarity: z.enum(['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY']),
  unlockType: z.enum(['LEVEL', 'ACHIEVEMENT', 'PURCHASE', 'EVENT', 'ADMIN']),
  unlockRequirement: z.any().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().optional(),
});

export const updateTitleBodySchema = z.object({
  name: z.string().min(1).optional(),
  displayText: z.string().min(1).optional(),
  description: z.string().optional(),
  rarity: z.enum(['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY']).optional(),
  unlockType: z.enum(['LEVEL', 'ACHIEVEMENT', 'PURCHASE', 'EVENT', 'ADMIN']).optional(),
  unlockRequirement: z.any().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const createFrameBodySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  imageUrl: z.string().url('Image URL is required'),
  description: z.string().optional(),
  unlockType: z.enum(['LEVEL', 'ACHIEVEMENT', 'PURCHASE', 'EVENT', 'ADMIN']),
  unlockRequirement: z.any().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().optional(),
});

export const updateFrameBodySchema = z.object({
  name: z.string().min(1).optional(),
  imageUrl: z.string().url().optional(),
  description: z.string().optional(),
  unlockType: z.enum(['LEVEL', 'ACHIEVEMENT', 'PURCHASE', 'EVENT', 'ADMIN']).optional(),
  unlockRequirement: z.any().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const grantTitleBodySchema = z.object({
  titleId: z.string().uuid('Title ID is required'),
});

export const grantFrameBodySchema = z.object({
  frameId: z.string().uuid('Frame ID is required'),
});

// ============================================
// Daily Reward Schemas
// ============================================

export const dailyRewardHistoryQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

export const createDailyRewardBodySchema = z.object({
  day: z.number().int().min(1).max(30),
  xpReward: z.number().int().min(0),
  bonusType: z
    .enum(['XP_MULTIPLIER', 'STREAK_FREEZE', 'BADGE', 'TITLE', 'FRAME', 'SHOP_DISCOUNT'])
    .optional(),
  bonusValue: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateDailyRewardBodySchema = z.object({
  day: z.number().int().min(1).max(30).optional(),
  xpReward: z.number().int().min(0).optional(),
  bonusType: z
    .enum(['XP_MULTIPLIER', 'STREAK_FREEZE', 'BADGE', 'TITLE', 'FRAME', 'SHOP_DISCOUNT'])
    .optional(),
  bonusValue: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// Milestone Schemas
// ============================================

export const celebrateMilestoneBodySchema = z.object({
  milestoneId: z.string().uuid('Milestone ID is required'),
});
