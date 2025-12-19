import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Default onboarding configuration
const DEFAULT_ONBOARDING_CONFIG = {
  steps: [
    {
      order: 1,
      title: 'Deneyim Seviyesi',
      question: 'Yoga ve meditasyon deneyiminiz nedir?',
      field: 'experienceLevel',
      type: 'single-select',
      options: [
        { value: 'BEGINNER', label: 'Yeni Başlıyorum', icon: '🌱' },
        { value: 'SOME', label: 'Biraz Deneyimim Var', icon: '🌿' },
        { value: 'INTERMEDIATE', label: 'Orta Seviye', icon: '🌳' },
        { value: 'ADVANCED', label: 'İleri Seviye', icon: '🎋' },
      ],
    },
    {
      order: 2,
      title: 'Hedefler',
      question: 'Hedefleriniz nelerdir?',
      field: 'goals',
      type: 'multi-select',
      options: [
        { value: 'STRESS_RELIEF', label: 'Stres Azaltma', icon: '😌' },
        { value: 'BETTER_SLEEP', label: 'Daha İyi Uyku', icon: '😴' },
        { value: 'FOCUS', label: 'Odaklanma', icon: '🎯' },
        { value: 'FLEXIBILITY', label: 'Esneklik', icon: '🧘' },
        { value: 'ANXIETY', label: 'Kaygı Yönetimi', icon: '🌊' },
        { value: 'ENERGY', label: 'Enerji', icon: '⚡' },
      ],
    },
    {
      order: 3,
      title: 'İlgi Alanları',
      question: 'Hangi alanlara ilgi duyuyorsunuz?',
      field: 'interests',
      type: 'multi-select',
      options: [
        { value: 'MEDITATION', label: 'Meditasyon', icon: '🧘' },
        { value: 'BREATHWORK', label: 'Nefes Egzersizleri', icon: '💨' },
        { value: 'YOGA', label: 'Yoga', icon: '🧘‍♀️' },
        { value: 'SLEEP', label: 'Uyku Hikayeleri', icon: '🌙' },
        { value: 'SOUNDSCAPES', label: 'Doğa Sesleri', icon: '🎵' },
        { value: 'JOURNALING', label: 'Günlük Tutma', icon: '📝' },
      ],
    },
    {
      order: 4,
      title: 'Tercih Edilen Süre',
      question: 'Günde ne kadar zaman ayırabilirsiniz?',
      field: 'preferredDuration',
      type: 'single-select',
      options: [
        { value: '5', label: '5 dakika', icon: '⏱️' },
        { value: '10', label: '10 dakika', icon: '⏱️' },
        { value: '15', label: '15 dakika', icon: '⏱️' },
        { value: '20', label: '20+ dakika', icon: '⏱️' },
      ],
    },
    {
      order: 5,
      title: 'Tercih Edilen Zaman',
      question: 'Pratiğinizi hangi zamanda yapmayı tercih edersiniz?',
      field: 'preferredTime',
      type: 'single-select',
      options: [
        { value: 'MORNING', label: 'Sabah', icon: '🌅' },
        { value: 'AFTERNOON', label: 'Öğlen', icon: '☀️' },
        { value: 'EVENING', label: 'Akşam', icon: '🌆' },
        { value: 'NIGHT', label: 'Gece', icon: '🌙' },
        { value: 'ANYTIME', label: 'Farketmez', icon: '🕐' },
      ],
    },
  ],
  totalSteps: 5,
  isActive: true,
};

// Validation schema for config update
const configUpdateSchema = z.object({
  steps: z.array(z.object({
    order: z.number(),
    title: z.string(),
    question: z.string(),
    field: z.string(),
    type: z.enum(['single-select', 'multi-select', 'text', 'slider']),
    options: z.array(z.object({
      value: z.string(),
      label: z.string(),
      icon: z.string().optional(),
    })).optional(),
  })).optional(),
  isActive: z.boolean().optional(),
});

/**
 * @swagger
 * /api/admin/onboarding/config:
 *   get:
 *     summary: Get onboarding configuration
 *     tags: [Admin - Onboarding]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Onboarding configuration
 */
router.get('/config', async (_req: Request, res: Response) => {
  try {
    // Try to get from system_settings table
    const setting = await prisma.system_settings.findFirst({
      where: { key: 'onboarding_config' },
    });

    if (setting && setting.value) {
      return res.json(JSON.parse(setting.value as string));
    }

    // Return default config if not found
    res.json(DEFAULT_ONBOARDING_CONFIG);
  } catch (error) {
    console.error('Error fetching onboarding config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/onboarding/config:
 *   put:
 *     summary: Update onboarding configuration
 *     tags: [Admin - Onboarding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Configuration updated
 */
router.put('/config', async (req: Request, res: Response) => {
  try {
    const validated = configUpdateSchema.parse(req.body);

    const config = {
      ...DEFAULT_ONBOARDING_CONFIG,
      ...validated,
      totalSteps: validated.steps?.length || DEFAULT_ONBOARDING_CONFIG.totalSteps,
    };

    // Upsert to system_settings
    await prisma.system_settings.upsert({
      where: { key: 'onboarding_config' },
      update: { value: JSON.stringify(config) },
      create: {
        key: 'onboarding_config',
        value: JSON.stringify(config),
        description: 'Onboarding flow configuration',
      },
    });

    res.json(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error updating onboarding config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/onboarding/stats:
 *   get:
 *     summary: Get onboarding statistics
 *     tags: [Admin - Onboarding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, all]
 *     responses:
 *       200:
 *         description: Onboarding statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { period = '30d' } = req.query;

    // Calculate date range
    let dateFilter: Date | undefined;
    switch (period) {
      case '7d':
        dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        dateFilter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFilter = undefined;
    }

    const where = dateFilter ? { createdAt: { gte: dateFilter } } : {};

    // Get onboarding records
    const [totalStarted, completed, onboardingData] = await Promise.all([
      prisma.user_onboarding.count({ where }),
      prisma.user_onboarding.count({
        where: { ...where, isCompleted: true },
      }),
      prisma.user_onboarding.findMany({
        where,
        select: {
          experienceLevel: true,
          goals: true,
          interests: true,
          preferredDuration: true,
          preferredTime: true,
          currentStep: true,
          isCompleted: true,
          createdAt: true,
          completedAt: true,
        },
      }),
    ]);

    // Calculate completion rate
    const completionRate = totalStarted > 0 ? Math.round((completed / totalStarted) * 100) : 0;

    // Calculate average duration (in seconds)
    const completedWithDuration = onboardingData.filter(o => o.isCompleted && o.completedAt && o.createdAt);
    const avgDuration = completedWithDuration.length > 0
      ? Math.round(
          completedWithDuration.reduce((sum, o) => {
            const duration = (new Date(o.completedAt!).getTime() - new Date(o.createdAt).getTime()) / 1000;
            return sum + duration;
          }, 0) / completedWithDuration.length
        )
      : 0;

    // Calculate step dropoffs
    const stepCounts = [0, 0, 0, 0, 0, 0]; // 5 steps + completed
    onboardingData.forEach(o => {
      if (o.isCompleted) {
        stepCounts[5]++;
      } else if (o.currentStep) {
        stepCounts[o.currentStep - 1]++;
      }
    });

    const stepDropoffs = [
      { step: 1, label: 'Deneyim', count: totalStarted, dropoffRate: 0 },
      { step: 2, label: 'Hedefler', count: totalStarted - stepCounts[0], dropoffRate: Math.round((stepCounts[0] / totalStarted) * 100) || 0 },
      { step: 3, label: 'İlgi Alanları', count: totalStarted - stepCounts[0] - stepCounts[1], dropoffRate: Math.round((stepCounts[1] / totalStarted) * 100) || 0 },
      { step: 4, label: 'Süre', count: totalStarted - stepCounts[0] - stepCounts[1] - stepCounts[2], dropoffRate: Math.round((stepCounts[2] / totalStarted) * 100) || 0 },
      { step: 5, label: 'Zaman', count: totalStarted - stepCounts[0] - stepCounts[1] - stepCounts[2] - stepCounts[3], dropoffRate: Math.round((stepCounts[3] / totalStarted) * 100) || 0 },
      { step: 6, label: 'Tamamlama', count: completed, dropoffRate: Math.round((stepCounts[4] / totalStarted) * 100) || 0 },
    ];

    // Calculate popular answers
    const experienceLevelCounts: Record<string, number> = {};
    const goalCounts: Record<string, number> = {};
    const interestCounts: Record<string, number> = {};
    const durationCounts: Record<string, number> = {};
    const timeCounts: Record<string, number> = {};

    onboardingData.forEach(o => {
      if (o.experienceLevel) {
        experienceLevelCounts[o.experienceLevel] = (experienceLevelCounts[o.experienceLevel] || 0) + 1;
      }
      if (o.goals && Array.isArray(o.goals)) {
        (o.goals as string[]).forEach(g => {
          goalCounts[g] = (goalCounts[g] || 0) + 1;
        });
      }
      if (o.interests && Array.isArray(o.interests)) {
        (o.interests as string[]).forEach(i => {
          interestCounts[i] = (interestCounts[i] || 0) + 1;
        });
      }
      if (o.preferredDuration) {
        durationCounts[o.preferredDuration.toString()] = (durationCounts[o.preferredDuration.toString()] || 0) + 1;
      }
      if (o.preferredTime) {
        timeCounts[o.preferredTime] = (timeCounts[o.preferredTime] || 0) + 1;
      }
    });

    res.json({
      totalStarted,
      totalCompleted: completed,
      completionRate,
      avgDuration,
      stepDropoffs,
      popularAnswers: {
        experienceLevel: experienceLevelCounts,
        goals: goalCounts,
        interests: interestCounts,
        preferredDuration: durationCounts,
        preferredTime: timeCounts,
      },
    });
  } catch (error) {
    console.error('Error fetching onboarding stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
