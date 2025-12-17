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
    const featureFlags = await prisma.featureFlag.findMany({
      where: { isEnabled: true },
      select: { key: true, isEnabled: true }
    });

    const flags: Record<string, boolean> = {};
    featureFlags.forEach(f => { flags[f.key] = f.isEnabled; });

    // Get system settings
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ['maintenance_mode', 'min_app_version_ios', 'min_app_version_android', 'force_update']
        }
      }
    });

    const settingsMap: Record<string, string> = {};
    settings.forEach(s => { settingsMap[s.key] = s.value; });

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
      prisma.program.findMany({
        where: { isPublished: true },
        take: 6,
        orderBy: { enrollmentCount: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          level: true,
          durationWeeks: true,
          enrollmentCount: true
        }
      }),

      // Featured classes
      prisma.class.findMany({
        where: { isPublished: true },
        take: 10,
        orderBy: { viewCount: 'desc' },
        select: {
          id: true,
          title: true,
          thumbnailUrl: true,
          duration: true,
          level: true,
          instructor: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true }
          }
        }
      }),

      // Popular instructors
      prisma.user.findMany({
        where: { role: 'TEACHER', isActive: true },
        take: 8,
        orderBy: { followerCount: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          bio: true,
          followerCount: true
        }
      }),

      // Latest podcasts
      prisma.podcast.findMany({
        where: { status: 'PUBLISHED' },
        take: 6,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          coverImage: true,
          category: true,
          totalEpisodes: true,
          host: { select: { firstName: true, lastName: true } }
        }
      }),

      // Active challenges
      prisma.challenge.findMany({
        where: {
          isActive: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        },
        take: 3,
        select: {
          id: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          startDate: true,
          endDate: true,
          participantCount: true
        }
      }),

      // Continue watching (for logged in users)
      userId ? prisma.videoProgress.findMany({
        where: {
          userId,
          completedAt: null,
          progress: { gt: 0, lt: 100 }
        },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: {
          class: {
            select: {
              id: true,
              title: true,
              thumbnailUrl: true,
              duration: true
            }
          }
        }
      }) : Promise.resolve([]),

      // Daily inspirational quote
      prisma.dailyQuote?.findFirst({
        where: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      }).catch(() => null)
    ]);

    // User-specific data
    let userProgress = null;
    let streak = null;

    if (userId) {
      const [gamificationProfile, todaySession] = await Promise.all([
        prisma.gamificationProfile.findUnique({
          where: { userId },
          select: {
            currentXp: true,
            level: true,
            currentStreak: true,
            longestStreak: true,
            coins: true
          }
        }),
        prisma.sessionLog.findFirst({
          where: {
            userId,
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
          }
        })
      ]);

      userProgress = gamificationProfile;
      streak = {
        current: gamificationProfile?.currentStreak || 0,
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
          ...vp.class,
          progress: vp.progress,
          lastWatchedAt: vp.updatedAt
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
      prisma.program.groupBy({
        by: ['level'],
        _count: { id: true },
        where: { isPublished: true }
      }),

      // Trending this week
      prisma.class.findMany({
        where: {
          isPublished: true,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        },
        take: 10,
        orderBy: { viewCount: 'desc' },
        select: {
          id: true,
          title: true,
          thumbnailUrl: true,
          duration: true,
          level: true,
          viewCount: true
        }
      }),

      // New programs
      prisma.program.findMany({
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
      prisma.user.findMany({
        where: { role: 'TEACHER', isActive: true },
        take: 6,
        orderBy: { averageRating: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          averageRating: true,
          totalReviews: true
        }
      }),

      // Podcast categories
      prisma.podcast.groupBy({
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
      gamification,
      activeSubscription,
      enrolledPrograms,
      activeChallenges,
      recentActivity,
      achievements,
      dailyQuests
    ] = await Promise.all([
      // User profile
      prisma.user.findUnique({
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

      // Gamification stats
      prisma.gamificationProfile.findUnique({
        where: { userId },
        select: {
          currentXp: true,
          totalXp: true,
          level: true,
          currentStreak: true,
          longestStreak: true,
          coins: true,
          gems: true,
          totalMinutes: true,
          totalSessions: true
        }
      }),

      // Active subscription
      prisma.userSubscription.findFirst({
        where: { userId, status: 'ACTIVE' },
        include: {
          plan: { select: { name: true, tier: true } }
        }
      }),

      // Enrolled programs with progress
      prisma.enrollment.findMany({
        where: { userId, status: 'ACTIVE' },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: {
          program: {
            select: {
              id: true,
              title: true,
              thumbnailUrl: true,
              durationWeeks: true,
              _count: { select: { classes: true } }
            }
          }
        }
      }),

      // Active challenge participations
      prisma.challengeParticipation.findMany({
        where: {
          userId,
          challenge: {
            isActive: true,
            endDate: { gte: new Date() }
          }
        },
        include: {
          challenge: {
            select: { id: true, title: true, endDate: true }
          }
        }
      }),

      // Recent activity
      prisma.sessionLog.findMany({
        where: { userId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          duration: true,
          xpEarned: true,
          createdAt: true
        }
      }),

      // Recent achievements
      prisma.userAchievement.findMany({
        where: { userId },
        take: 5,
        orderBy: { unlockedAt: 'desc' },
        include: {
          achievement: {
            select: { name: true, description: true, icon: true, xpReward: true }
          }
        }
      }),

      // Today's quests
      prisma.userQuest.findMany({
        where: {
          userId,
          quest: { isActive: true, type: 'DAILY' }
        },
        include: {
          quest: { select: { title: true, xpReward: true, conditionValue: true } }
        }
      })
    ]);

    // Calculate XP for next level
    const currentLevel = gamification?.level || 1;
    const xpForNextLevel = currentLevel * 1000;
    const xpProgress = gamification ? (gamification.currentXp / xpForNextLevel) * 100 : 0;

    return res.json({
      success: true,
      data: {
        user: userProfile,
        stats: {
          ...gamification,
          xpForNextLevel,
          xpProgress: Math.min(xpProgress, 100)
        },
        subscription: activeSubscription ? {
          plan: activeSubscription.plan.name,
          tier: activeSubscription.plan.tier,
          expiresAt: activeSubscription.endDate
        } : null,
        programs: enrolledPrograms.map(e => ({
          ...e.program,
          progress: e.progress,
          lastAccessedAt: e.updatedAt
        })),
        challenges: activeChallenges.map(cp => ({
          ...cp.challenge,
          progress: cp.progress,
          daysLeft: Math.ceil((new Date(cp.challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        })),
        recentActivity,
        achievements: achievements.map(ua => ({
          ...ua.achievement,
          unlockedAt: ua.unlockedAt
        })),
        dailyQuests: dailyQuests.map(uq => ({
          ...uq.quest,
          currentProgress: uq.progress,
          completed: uq.completedAt !== null
        }))
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
        await prisma.videoProgress.upsert({
          where: {
            userId_classId: { userId, classId: progress.classId }
          },
          update: {
            progress: progress.progress,
            watchedSeconds: progress.watchedSeconds,
            updatedAt: new Date(progress.timestamp)
          },
          create: {
            userId,
            classId: progress.classId,
            progress: progress.progress,
            watchedSeconds: progress.watchedSeconds
          }
        });
      }
    }

    // Process offline favorites
    if (offlineFavorites && Array.isArray(offlineFavorites)) {
      for (const fav of offlineFavorites) {
        if (fav.action === 'add') {
          await prisma.favorite.upsert({
            where: {
              userId_contentType_contentId: {
                userId,
                contentType: fav.contentType,
                contentId: fav.contentId
              }
            },
            update: {},
            create: {
              userId,
              contentType: fav.contentType,
              contentId: fav.contentId
            }
          });
        } else if (fav.action === 'remove') {
          await prisma.favorite.deleteMany({
            where: {
              userId,
              contentType: fav.contentType,
              contentId: fav.contentId
            }
          });
        }
      }
    }

    // Update settings if provided
    if (settings) {
      await prisma.userSettings.upsert({
        where: { userId },
        update: settings,
        create: { userId, ...settings }
      });
    }

    // Get changes since last sync
    const [
      updatedProgress,
      updatedFavorites,
      newAchievements,
      questProgress,
      notifications
    ] = await Promise.all([
      prisma.videoProgress.findMany({
        where: { userId, updatedAt: { gt: lastSync } }
      }),
      prisma.favorite.findMany({
        where: { userId, createdAt: { gt: lastSync } }
      }),
      prisma.userAchievement.findMany({
        where: { userId, unlockedAt: { gt: lastSync } },
        include: { achievement: true }
      }),
      prisma.userQuest.findMany({
        where: { userId, updatedAt: { gt: lastSync } },
        include: { quest: true }
      }),
      prisma.notification.findMany({
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
        quests: questProgress,
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
    const device = await prisma.userDevice.upsert({
      where: {
        userId_token: { userId, token }
      },
      update: {
        platform: platform.toUpperCase(),
        deviceName,
        appVersion,
        lastActiveAt: new Date()
      },
      create: {
        userId,
        token,
        platform: platform.toUpperCase(),
        deviceName,
        appVersion
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

    await prisma.userDevice.updateMany({
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
