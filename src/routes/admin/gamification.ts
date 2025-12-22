import { Router, Request, Response } from 'express';
import { prisma } from '../../utils/database';
import { logger } from '../../utils/logger';
import { authenticate, requireAdmin } from '../../middleware/auth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// ==================== ADMIN GAMIFICATION ====================
// Frontend expects: /api/admin/gamification
// Sub-routes: /daily-rewards, /config

const DAILY_REWARDS_KEY = 'daily_rewards_config';

// Default daily rewards configuration
const DEFAULT_DAILY_REWARDS = [
  { day: 1, xp: 10, coins: 5, description: 'Day 1 Reward' },
  { day: 2, xp: 15, coins: 8, description: 'Day 2 Reward' },
  { day: 3, xp: 20, coins: 10, description: 'Day 3 Reward' },
  { day: 4, xp: 25, coins: 12, description: 'Day 4 Reward' },
  { day: 5, xp: 35, coins: 15, description: 'Day 5 Reward' },
  { day: 6, xp: 45, coins: 20, description: 'Day 6 Reward' },
  { day: 7, xp: 100, coins: 50, bonusItem: 'streak_freeze', description: 'Week Completion Bonus!' },
];

// ==================== DAILY REWARDS ====================

// GET /api/admin/gamification/daily-rewards - Get daily rewards config
router.get('/daily-rewards', async (_req: Request, res: Response) => {
  try {
    const config = await prisma.gamification_config.findUnique({
      where: { key: DAILY_REWARDS_KEY },
    });

    const rewards = config?.value || DEFAULT_DAILY_REWARDS;
    res.json({ rewards });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get daily rewards config');
    res.status(500).json({ error: 'Failed to get daily rewards' });
  }
});

// POST /api/admin/gamification/daily-rewards - Create/Update daily rewards config
router.post('/daily-rewards', async (req: Request, res: Response) => {
  try {
    const { day, xp, coins, bonusItem, description } = req.body;

    // Get current config
    let config = await prisma.gamification_config.findUnique({
      where: { key: DAILY_REWARDS_KEY },
    });

    const rewards = (config?.value as any[]) || [...DEFAULT_DAILY_REWARDS];

    // Find existing day or add new
    const existingIndex = rewards.findIndex((r: any) => r.day === day);
    const newReward = { day, xp, coins, bonusItem, description };

    if (existingIndex >= 0) {
      rewards[existingIndex] = newReward;
    } else {
      rewards.push(newReward);
      rewards.sort((a: any, b: any) => a.day - b.day);
    }

    // Save config
    config = await prisma.gamification_config.upsert({
      where: { key: DAILY_REWARDS_KEY },
      update: { value: rewards },
      create: {
        key: DAILY_REWARDS_KEY,
        value: rewards,
        description: 'Daily login rewards configuration',
      },
    });

    res.json({ success: true, reward: newReward });
  } catch (error) {
    logger.error({ err: error }, 'Failed to create/update daily reward');
    res.status(500).json({ error: 'Failed to create/update daily reward' });
  }
});

// PUT /api/admin/gamification/daily-rewards/:id - Update specific day reward
router.put('/daily-rewards/:id', async (req: Request, res: Response) => {
  try {
    const day = parseInt(req.params.id || '0');
    const { xp, coins, bonusItem, description } = req.body;

    const config = await prisma.gamification_config.findUnique({
      where: { key: DAILY_REWARDS_KEY },
    });

    const rewards = (config?.value as any[]) || [...DEFAULT_DAILY_REWARDS];
    const existingIndex = rewards.findIndex((r: any) => r.day === day);

    if (existingIndex < 0) {
      return res.status(404).json({ error: 'Day reward not found' });
    }

    rewards[existingIndex] = {
      ...rewards[existingIndex],
      xp: xp ?? rewards[existingIndex].xp,
      coins: coins ?? rewards[existingIndex].coins,
      bonusItem: bonusItem !== undefined ? bonusItem : rewards[existingIndex].bonusItem,
      description: description ?? rewards[existingIndex].description,
    };

    await prisma.gamification_config.upsert({
      where: { key: DAILY_REWARDS_KEY },
      update: { value: rewards },
      create: {
        key: DAILY_REWARDS_KEY,
        value: rewards,
        description: 'Daily login rewards configuration',
      },
    });

    res.json({ success: true, reward: rewards[existingIndex] });
  } catch (error) {
    logger.error({ err: error }, 'Failed to update daily reward');
    res.status(500).json({ error: 'Failed to update daily reward' });
  }
});

// DELETE /api/admin/gamification/daily-rewards/:id - Delete specific day reward
router.delete('/daily-rewards/:id', async (req: Request, res: Response) => {
  try {
    const day = parseInt(req.params.id || '0');

    const config = await prisma.gamification_config.findUnique({
      where: { key: DAILY_REWARDS_KEY },
    });

    const rewards = (config?.value as any[]) || [...DEFAULT_DAILY_REWARDS];
    const filtered = rewards.filter((r: any) => r.day !== day);

    if (filtered.length === rewards.length) {
      return res.status(404).json({ error: 'Day reward not found' });
    }

    await prisma.gamification_config.upsert({
      where: { key: DAILY_REWARDS_KEY },
      update: { value: filtered },
      create: {
        key: DAILY_REWARDS_KEY,
        value: filtered,
        description: 'Daily login rewards configuration',
      },
    });

    res.json({ success: true, message: 'Day reward deleted' });
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete daily reward');
    res.status(500).json({ error: 'Failed to delete daily reward' });
  }
});

// POST /api/admin/gamification/daily-rewards/seed - Seed default rewards
router.post('/daily-rewards/seed', async (_req: Request, res: Response) => {
  try {
    await prisma.gamification_config.upsert({
      where: { key: DAILY_REWARDS_KEY },
      update: { value: DEFAULT_DAILY_REWARDS },
      create: {
        key: DAILY_REWARDS_KEY,
        value: DEFAULT_DAILY_REWARDS,
        description: 'Daily login rewards configuration',
      },
    });

    res.json({ success: true, message: 'Default rewards seeded', rewards: DEFAULT_DAILY_REWARDS });
  } catch (error) {
    logger.error({ err: error }, 'Failed to seed daily rewards');
    res.status(500).json({ error: 'Failed to seed daily rewards' });
  }
});

// POST /api/admin/gamification/users/:userId/daily-rewards/reset - Reset user's daily reward streak
router.post('/users/:userId/daily-rewards/reset', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Reset user's streak and daily reward progress
    await prisma.users.update({
      where: { id: userId },
      data: {
        streak: 0,
      },
    });

    res.json({ success: true, message: 'User daily reward streak reset' });
  } catch (error) {
    logger.error({ err: error }, 'Failed to reset user daily rewards');
    res.status(500).json({ error: 'Failed to reset user daily rewards' });
  }
});

// ==================== ACHIEVEMENTS ====================

// GET /api/admin/gamification/achievements - Get all achievements
router.get('/achievements', async (_req: Request, res: Response) => {
  try {
    const achievements = await prisma.achievements.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ achievements });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get achievements');
    res.status(500).json({ error: 'Failed to get achievements' });
  }
});

// POST /api/admin/gamification/achievements - Create new achievement
router.post('/achievements', async (req: Request, res: Response) => {
  try {
    const { key, name, description, iconUrl, xpReward, coinReward, requirement, category, isActive } = req.body;

    // Generate slug from name
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();

    const achievement = await prisma.achievements.create({
      data: {
        key,
        name,
        slug,
        description,
        icon: iconUrl || 'default-icon',
        iconUrl,
        xpReward: xpReward || 0,
        coinReward: coinReward || 0,
        requirement,
        category: (category as any) || 'GENERAL',
        difficulty: 'EASY',
        requirementType: 'COUNT',
        requirementValue: 1,
        isActive: isActive ?? true,
      },
    });

    res.status(201).json({ success: true, achievement });
  } catch (error) {
    logger.error({ err: error }, 'Failed to create achievement');
    res.status(500).json({ error: 'Failed to create achievement' });
  }
});

// PUT /api/admin/gamification/achievements/:id - Update achievement
router.put('/achievements/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { key, name, description, iconUrl, xpReward, coinReward, requirement, category, isActive } = req.body;

    const achievement = await prisma.achievements.update({
      where: { id },
      data: {
        ...(key && { key }),
        ...(name && { name }),
        ...(description && { description }),
        ...(iconUrl !== undefined && { iconUrl }),
        ...(xpReward !== undefined && { xpReward }),
        ...(coinReward !== undefined && { coinReward }),
        ...(requirement !== undefined && { requirement }),
        ...(category && { category: category as any }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({ success: true, achievement });
  } catch (error) {
    logger.error({ err: error }, 'Failed to update achievement');
    res.status(500).json({ error: 'Failed to update achievement' });
  }
});

// DELETE /api/admin/gamification/achievements/:id - Delete achievement
router.delete('/achievements/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.achievements.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Achievement deleted' });
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete achievement');
    res.status(500).json({ error: 'Failed to delete achievement' });
  }
});

// POST /api/admin/gamification/achievements/seed - Seed default achievements
router.post('/achievements/seed', async (_req: Request, res: Response) => {
  try {
    const defaultAchievements = [
      { key: 'first_login', name: 'İlk Giriş', description: 'Uygulamaya ilk kez giriş yaptın', xpReward: 10, coinReward: 5, category: 'beginner' },
      { key: 'week_streak', name: 'Haftalık Seri', description: '7 gün üst üste giriş yaptın', xpReward: 100, coinReward: 50, category: 'streak' },
      { key: 'month_streak', name: 'Aylık Seri', description: '30 gün üst üste giriş yaptın', xpReward: 500, coinReward: 200, category: 'streak' },
      { key: 'first_meditation', name: 'İlk Meditasyon', description: 'İlk meditasyonunu tamamladın', xpReward: 25, coinReward: 10, category: 'meditation' },
      { key: 'meditation_master', name: 'Meditasyon Ustası', description: '100 meditasyon tamamladın', xpReward: 1000, coinReward: 500, category: 'meditation' },
      { key: 'first_workout', name: 'İlk Antrenman', description: 'İlk antrenmanını tamamladın', xpReward: 25, coinReward: 10, category: 'fitness' },
      { key: 'fitness_guru', name: 'Fitness Gurusu', description: '100 antrenman tamamladın', xpReward: 1000, coinReward: 500, category: 'fitness' },
      { key: 'early_bird', name: 'Erken Kuş', description: 'Sabah 6dan önce egzersiz yaptın', xpReward: 50, coinReward: 25, category: 'special' },
      { key: 'night_owl', name: 'Gece Kuşu', description: 'Gece 11den sonra egzersiz yaptın', xpReward: 50, coinReward: 25, category: 'special' },
      { key: 'social_butterfly', name: 'Sosyal Kelebek', description: '10 arkadaş edindin', xpReward: 100, coinReward: 50, category: 'social' },
    ];

    for (const achievement of defaultAchievements) {
      const slug = achievement.key;
      await prisma.achievements.upsert({
        where: { slug },
        update: {
          name: achievement.name,
          description: achievement.description,
          xpReward: achievement.xpReward,
          coinReward: achievement.coinReward,
        },
        create: {
          key: achievement.key,
          slug,
          name: achievement.name,
          description: achievement.description,
          icon: 'default-icon',
          xpReward: achievement.xpReward,
          coinReward: achievement.coinReward,
          category: 'GENERAL',
          difficulty: 'EASY',
          requirementType: 'COUNT',
          requirementValue: 1,
          isActive: true,
        },
      });
    }

    const all = await prisma.achievements.findMany();
    res.json({ success: true, message: 'Default achievements seeded', achievements: all });
  } catch (error) {
    logger.error({ err: error }, 'Failed to seed achievements');
    res.status(500).json({ error: 'Failed to seed achievements' });
  }
});

// ==================== GAMIFICATION STATS ====================

// GET /api/admin/gamification/stats - Get gamification statistics
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      configCount,
      totalAchievements,
      unlockedAchievements,
      dailyChecksCount,
    ] = await Promise.all([
      prisma.users.count(),
      prisma.gamification_config.count(),
      prisma.achievements.count(),
      prisma.user_achievements.count(),
      prisma.daily_checks.count(),
    ]);

    // Get top users by achievements
    const topUsersByAchievements = await prisma.user_achievements.groupBy({
      by: ['userId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    res.json({
      stats: {
        totalUsers,
        configCount,
        totalAchievements,
        unlockedAchievements,
        dailyChecksCount,
        topUsersByAchievements: topUsersByAchievements.map((u) => ({
          userId: u.userId,
          achievementCount: u._count.id,
        })),
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get gamification stats');
    res.status(500).json({ error: 'Failed to get gamification stats' });
  }
});

// ==================== GAMIFICATION CONFIG ====================

// GET /api/admin/gamification/config - Get all gamification configs
router.get('/config', async (_req: Request, res: Response) => {
  try {
    const configs = await prisma.gamification_config.findMany({
      orderBy: { key: 'asc' },
    });
    res.json({ configs });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get gamification configs');
    res.status(500).json({ error: 'Failed to get gamification configs' });
  }
});

// PUT /api/admin/gamification/config/:key - Update a gamification config
router.put('/config/:key', async (req: Request, res: Response) => {
  try {
    const configKey = req.params.key || '';
    const { value, description } = req.body;

    const config = await prisma.gamification_config.upsert({
      where: { key: configKey },
      update: { value, description },
      create: { key: configKey, value, description: description || '' },
    });

    res.json({ success: true, config });
  } catch (error) {
    logger.error({ err: error }, 'Failed to update gamification config');
    res.status(500).json({ error: 'Failed to update gamification config' });
  }
});

export default router;
