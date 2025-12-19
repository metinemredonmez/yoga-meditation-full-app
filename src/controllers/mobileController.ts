import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { config } from '../utils/config';

// ============================================
// App Configuration
// ============================================

export async function getAppConfig(req: Request, res: Response) {
  try {
    // Get feature flags
    const featureFlags = await prisma.feature_flags.findMany({
      where: { isEnabled: true },
      select: { key: true, isEnabled: true }
    });

    const flags: Record<string, boolean> = {};
    featureFlags.forEach(f => { flags[f.key] = f.isEnabled; });

    // Get system settings
    const settings = await prisma.system_settings.findMany({
      where: {
        key: {
          in: ['maintenance_mode', 'min_app_version_ios', 'min_app_version_android', 'force_update']
        }
      }
    });

    const settingsMap: Record<string, string> = {};
    settings.forEach(s => { settingsMap[s.key] = String(s.value); });

    return res.json({
      success: true,
      config: {
        maintenance: settingsMap['maintenance_mode'] === 'true',
        forceUpdate: settingsMap['force_update'] === 'true',
        minVersion: {
          ios: settingsMap['min_app_version_ios'] || '1.0.0',
          android: settingsMap['min_app_version_android'] || '1.0.0'
        },
        features: flags,
        api: {
          baseUrl: process.env.API_BASE_URL || 'https://api.example.com',
          wsUrl: process.env.WS_URL || 'wss://api.example.com'
        },
        support: {
          email: 'support@example.com',
          whatsapp: '+905551234567'
        }
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get app config');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ============================================
// Home Screen - Single request for all data
// ============================================

export async function getHomeScreen(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    // Parallel queries for better performance
    const [
      featuredPrograms,
      featuredClasses,
      popularInstructors,
      latestPodcasts,
      activeChallenges,
      continueWatching,
      dailyQuote
    ] = await Promise.all([
      // Featured programs
      prisma.programs.findMany({
        where: { isPublished: true },
        take: 6,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          level: true,
          durationWeeks: true
        }
      }),

      // Featured classes
      prisma.classes.findMany({
        where: { status: 'PUBLISHED' },
        take: 10,
        orderBy: { completions: 'desc' },
        select: {
          id: true,
          title: true,
          thumbnailUrl: true,
          duration: true,
          level: true,
          users: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true }
          }
        }
      }),

      // Popular instructors
      prisma.users.findMany({
        where: { role: 'TEACHER' },
        take: 8,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          bio: true
        }
      }),

      // Latest podcasts
      prisma.podcasts.findMany({
        where: { status: 'PUBLISHED' },
        take: 6,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          coverImage: true,
          category: true,
          totalEpisodes: true,
          users: { select: { firstName: true, lastName: true } }
        }
      }),

      // Active challenges
      prisma.challenges.findMany({
        where: {
          isActive: true,
          startAt: { lte: new Date() },
          endAt: { gte: new Date() }
        },
        take: 3,
        select: {
          id: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          startAt: true,
          endAt: true
        }
      }),

      // Continue watching (for logged in users)
      userId ? prisma.video_progress.findMany({
        where: {
          userId,
          completed: false,
          percentage: { gt: 0, lt: 100 }
        },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          lessonId: true,
          lessonType: true,
          percentage: true,
          lastWatchedAt: true,
          updatedAt: true
        }
      }) : Promise.resolve([]),

      // Daily inspirational quote
      prisma.daily_quotes.findFirst({
        where: {
          isActive: true,
          scheduledDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        },
        orderBy: { createdAt: 'desc' }
      }).catch(() => null)
    ]);

    // User-specific data
    let userProgress = null;
    let streak = null;

    if (userId) {
      const todaySession = await prisma.user_activities.findFirst({
        where: {
          userId,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      });

      // Simple progress without gamification
      userProgress = null;
      streak = {
        current: 0,
        completedToday: !!todaySession
      };
    }

    return res.json({
      success: true,
      data: {
        featured: {
          programs: featuredPrograms,
          classes: featuredClasses
        },
        instructors: popularInstructors,
        podcasts: latestPodcasts,
        challenges: activeChallenges,
        continueWatching: continueWatching.map(vp => ({
          lessonId: vp.lessonId,
          lessonType: vp.lessonType,
          progress: vp.percentage,
          lastWatchedAt: vp.lastWatchedAt
        })),
        dailyQuote: dailyQuote || {
          text: 'Her nefes yeni bir başlangıçtır.',
          author: 'Yoga Geleneği'
        },
        userProgress,
        streak
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get home screen data');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ============================================
// Explore Screen
// ============================================

export async function getExploreScreen(req: Request, res: Response) {
  try {
    const [
      categories,
      trendingClasses,
      newPrograms,
      topRatedInstructors,
      podcastCategories
    ] = await Promise.all([
      // Program categories with counts
      prisma.programs.groupBy({
        by: ['level'],
        _count: { id: true },
        where: { isPublished: true }
      }),

      // Trending this week
      prisma.classes.findMany({
        where: {
          status: 'PUBLISHED',
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        },
        take: 10,
        orderBy: { completions: 'desc' },
        select: {
          id: true,
          title: true,
          thumbnailUrl: true,
          duration: true,
          level: true,
          completions: true
        }
      }),

      // New programs
      prisma.programs.findMany({
        where: { isPublished: true },
        take: 6,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          thumbnailUrl: true,
          level: true,
          durationWeeks: true
        }
      }),

      // Top rated instructors
      prisma.users.findMany({
        where: { role: 'TEACHER' },
        take: 6,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true
        }
      }),

      // Podcast categories
      prisma.podcasts.groupBy({
        by: ['category'],
        _count: { id: true },
        where: { status: 'PUBLISHED' }
      })
    ]);

    return res.json({
      success: true,
      data: {
        categories: {
          levels: categories.map(c => ({ level: c.level, count: c._count.id })),
          types: [
            { name: 'Yoga', icon: 'yoga', count: 0 },
            { name: 'Meditasyon', icon: 'meditation', count: 0 },
            { name: 'Pilates', icon: 'pilates', count: 0 },
            { name: 'Nefes', icon: 'breathing', count: 0 }
          ]
        },
        trending: trendingClasses,
        newPrograms,
        topInstructors: topRatedInstructors,
        podcastCategories: podcastCategories.map(c => ({
          category: c.category,
          count: c._count.id
        }))
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get explore screen data');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ============================================
// User Dashboard
// ============================================

export async function getUserDashboard(req: Request, res: Response) {
  try {
    const userId = req.user!.id;

    const [
      userProfile,
      activeSubscription,
      enrolledPrograms,
      activeChallenges,
      recentActivity,
      achievements
    ] = await Promise.all([
      // User profile
      prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
          role: true,
          createdAt: true
        }
      }),

      // Active subscription
      prisma.subscriptions.findFirst({
        where: { userId, status: 'ACTIVE' },
        include: {
          plan: { select: { name: true, tier: true } }
        }
      }),

      // Enrolled programs - Note: No enrollment table exists, returning empty array
      Promise.resolve([]),

      // Active challenge participations
      prisma.challenge_enrollments.findMany({
        where: {
          userId,
          challenges: {
            isActive: true,
            endAt: { gte: new Date() }
          }
        },
        include: {
          challenges: {
            select: { id: true, title: true, endAt: true }
          }
        }
      }),

      // Recent activity
      prisma.user_activities.findMany({
        where: { userId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          activityType: true,
          targetId: true,
          targetType: true,
          createdAt: true
        }
      }),

      // Recent achievements
      prisma.user_achievements.findMany({
        where: { userId, isCompleted: true },
        take: 5,
        orderBy: { completedAt: 'desc' },
        include: {
          achievements: {
            select: { name: true, description: true, icon: true, xpReward: true }
          }
        }
      })
    ]);

    return res.json({
      success: true,
      data: {
        users: userProfile,
        stats: null,
        subscriptions: activeSubscription ? {
          plan: activeSubscription.plan.name,
          tier: activeSubscription.plan.tier,
          expiresAt: activeSubscription.currentPeriodEnd
        } : null,
        programs: enrolledPrograms,
        challenges: activeChallenges.map((cp: any) => ({
          ...cp.challenges,
          joinedAt: cp.joinedAt,
          daysLeft: Math.ceil((new Date(cp.challenges.endAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        })),
        recentActivity,
        achievements: achievements.map((ua: any) => ({
          ...ua.achievements,
          unlockedAt: ua.completedAt
        })),
        dailyQuests: []
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get user dashboard');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ============================================
// Data Sync
// ============================================

export async function syncUserData(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const { lastSyncAt, offlineProgress, offlineFavorites, settings } = req.body;

    const syncTime = new Date();
    const lastSync = lastSyncAt ? new Date(lastSyncAt) : new Date(0);

    // Process offline progress
    if (offlineProgress && Array.isArray(offlineProgress)) {
      for (const progress of offlineProgress) {
        await prisma.video_progress.upsert({
          where: {
            userId_lessonId_lessonType: {
              userId,
              lessonId: progress.lessonId,
              lessonType: progress.lessonType
            }
          },
          update: {
            percentage: progress.percentage,
            currentTime: progress.currentTime,
            duration: progress.duration,
            completed: progress.percentage >= 100,
            lastWatchedAt: new Date(progress.timestamp)
          },
          create: {
            userId,
            lessonId: progress.lessonId,
            lessonType: progress.lessonType,
            percentage: progress.percentage,
            currentTime: progress.currentTime,
            duration: progress.duration,
            completed: progress.percentage >= 100
          }
        });
      }
    }

    // Process offline favorites
    if (offlineFavorites && Array.isArray(offlineFavorites)) {
      for (const fav of offlineFavorites) {
        if (fav.action === 'add') {
          await prisma.favorites.upsert({
            where: {
              userId_itemId_itemType: {
                userId,
                itemType: fav.itemType,
                itemId: fav.itemId
              }
            },
            update: {},
            create: {
              userId,
              itemType: fav.itemType,
              itemId: fav.itemId
            }
          });
        } else if (fav.action === 'remove') {
          await prisma.favorites.deleteMany({
            where: {
              userId,
              itemType: fav.itemType,
              itemId: fav.itemId
            }
          });
        }
      }
    }

    // Update settings if provided - Note: userSettings model doesn't exist
    // Skipping settings update for now
    if (settings) {
      logger.info({ userId, settings }, 'User settings update requested but model not available');
    }

    // Get changes since last sync
    const [
      updatedProgress,
      updatedFavorites,
      newAchievements,
      notifications
    ] = await Promise.all([
      prisma.video_progress.findMany({
        where: { userId, updatedAt: { gt: lastSync } }
      }),
      prisma.favorites.findMany({
        where: { userId, createdAt: { gt: lastSync } }
      }),
      prisma.user_achievements.findMany({
        where: { userId, completedAt: { gt: lastSync } },
        include: { achievements: true }
      }),
      prisma.notification_logs.findMany({
        where: { userId, createdAt: { gt: lastSync } },
        take: 20,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return res.json({
      success: true,
      syncedAt: syncTime,
      updates: {
        progress: updatedProgress,
        favorites: updatedFavorites,
        achievements: newAchievements,
        quests: [],
        notifications
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to sync user data');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ============================================
// Batch Request
// ============================================

export async function batchRequest(req: Request, res: Response) {
  try {
    const { requests } = req.body;

    if (!requests || !Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({ error: 'Invalid batch request' });
    }

    if (requests.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 requests per batch' });
    }

    // Note: In a real implementation, you would internally route these requests
    // For now, return a placeholder response
    const results = requests.map((r: { id: string; method: string; path: string }) => ({
      id: r.id,
      status: 200,
      body: { message: `Batch request for ${r.method} ${r.path} would be processed here` }
    }));

    return res.json({
      success: true,
      responses: results
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to process batch request');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ============================================
// Device Registration
// ============================================

export async function registerDevice(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const { token, platform, deviceName, appVersion } = req.body;

    if (!token || !platform) {
      return res.status(400).json({ error: 'Token and platform are required' });
    }

    // Upsert device
    const device = await prisma.device_tokens.upsert({
      where: {
        token
      },
      update: {
        platform: platform.toUpperCase() as any,
        deviceName,
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        userId,
        token,
        platform: platform.toUpperCase() as any,
        deviceName
      }
    });

    return res.json({
      success: true,
      device: {
        id: device.id,
        platform: device.platform,
        registeredAt: device.createdAt
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to register device');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateDeviceToken(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const { oldToken, newToken } = req.body;

    if (!oldToken || !newToken) {
      return res.status(400).json({ error: 'Old and new tokens are required' });
    }

    await prisma.device_tokens.updateMany({
      where: { userId, token: oldToken },
      data: { token: newToken, updatedAt: new Date() }
    });

    return res.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, 'Failed to update device token');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ============================================
// App Analytics Events
// ============================================

export async function logAppEvent(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { events } = req.body;

    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'Events array is required' });
    }

    // Log events to analytics (could be stored in DB or sent to analytics service)
    const eventLogs = events.map((event: { name: string; properties?: Record<string, unknown>; timestamp?: string }) => ({
      userId,
      eventName: event.name,
      eventProperties: event.properties || {},
      timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
      platform: req.headers['x-platform'] as string || 'unknown',
      appVersion: req.headers['x-app-version'] as string || 'unknown'
    }));

    // In production, batch insert to analytics table or send to analytics service
    logger.info({ events: eventLogs }, 'Mobile app events logged');

    return res.json({
      success: true,
      logged: events.length
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to log app events');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
