import { Prisma, PodcastStatus, EpisodeStatus } from '@prisma/client';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import {
  PodcastFilters,
  EpisodeFilters,
  CreatePodcastInput,
  UpdatePodcastInput,
  CreateEpisodeInput,
  UpdateEpisodeInput,
  ListenProgressInput,
} from '../validation/podcastSchemas';

// ============================================
// Podcast CRUD
// ============================================

export async function listPodcasts(filters: PodcastFilters) {
  const { page, limit, category, status, hostId, q, tag, sortBy, sortOrder } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.podcastsWhereInput = {
    ...(category && { category }),
    ...(status && { status }),
    ...(hostId && { hostId }),
    ...(q && {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    }),
    ...(tag && { tags: { some: { slug: tag } } }),
  };

  const [podcasts, total] = await Promise.all([
    prisma.podcasts.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        users: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        tags: true,
        _count: {
          select: { podcast_episodes: true, podcast_subscriptions: true },
        },
      },
    }),
    prisma.podcasts.count({ where }),
  ]);

  return {
    podcasts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getPodcastById(podcastId: string) {
  return prisma.podcasts.findUnique({
    where: { id: podcastId },
    include: {
      users: {
        select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
      },
      tags: true,
      podcast_episodes: {
        where: { status: EpisodeStatus.PUBLISHED },
        orderBy: { publishedAt: 'desc' },
        take: 10,
      },
      _count: {
        select: { podcast_episodes: true, podcast_subscriptions: true },
      },
    },
  });
}

export async function getPodcastBySlug(slug: string) {
  return prisma.podcasts.findUnique({
    where: { slug },
    include: {
      users: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      },
      tags: true,
      podcast_episodes: {
        where: { status: EpisodeStatus.PUBLISHED },
        orderBy: { publishedAt: 'desc' },
        take: 10,
      },
      _count: {
        select: { podcast_episodes: true, podcast_subscriptions: true },
      },
    },
  });
}

export async function createPodcast(data: CreatePodcastInput) {
  const { tagIds, ...podcastData } = data;

  return prisma.podcasts.create({
    data: {
      ...podcastData,
      ...(tagIds && {
        tags: { connect: tagIds.map((id) => ({ id })) },
      }),
    },
    include: {
      users: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      },
      tags: true,
    },
  });
}

export async function updatePodcast(podcastId: string, data: UpdatePodcastInput) {
  const { tagIds, ...podcastData } = data;

  return prisma.podcasts.update({
    where: { id: podcastId },
    data: {
      ...podcastData,
      ...(tagIds && {
        tags: { set: tagIds.map((id) => ({ id })) },
      }),
    },
    include: {
      users: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      },
      tags: true,
    },
  });
}

export async function deletePodcast(podcastId: string) {
  // Delete related data first
  await prisma.$transaction([
    prisma.podcast_likes.deleteMany({ where: { podcast_episodes: { podcastId } } }),
    prisma.podcast_listens.deleteMany({ where: { podcast_episodes: { podcastId } } }),
    prisma.podcast_subscriptions.deleteMany({ where: { podcastId } }),
    prisma.podcast_episodes.deleteMany({ where: { podcastId } }),
    prisma.podcasts.delete({ where: { id: podcastId } }),
  ]);
}

// ============================================
// Episode CRUD
// ============================================

export async function listEpisodes(podcastId: string, filters: EpisodeFilters) {
  const { page, limit, status, seasonNumber, isPremium, q, sortBy, sortOrder } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.podcast_episodesWhereInput = {
    podcastId,
    ...(status && { status }),
    ...(seasonNumber && { seasonNumber }),
    ...(isPremium !== undefined && { isPremium }),
    ...(q && {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    }),
  };

  const [episodes, total] = await Promise.all([
    prisma.podcast_episodes.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: {
          select: { podcast_listens: true, podcast_likes: true },
        },
      },
    }),
    prisma.podcast_episodes.count({ where }),
  ]);

  return {
    episodes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getEpisodeById(episodeId: string) {
  return prisma.podcast_episodes.findUnique({
    where: { id: episodeId },
    include: {
      podcasts: {
        select: { id: true, title: true, slug: true, coverImage: true },
      },
      _count: {
        select: { podcast_listens: true, podcast_likes: true },
      },
    },
  });
}

export async function getEpisodeBySlug(podcastSlug: string, episodeSlug: string) {
  const podcast = await prisma.podcasts.findUnique({
    where: { slug: podcastSlug },
    select: { id: true },
  });

  if (!podcast) return null;

  return prisma.podcast_episodes.findFirst({
    where: {
      podcastId: podcast.id,
      slug: episodeSlug,
      status: EpisodeStatus.PUBLISHED,
    },
    include: {
      podcasts: {
        select: { id: true, title: true, slug: true, coverImage: true, hostName: true },
      },
      _count: {
        select: { podcast_listens: true, podcast_likes: true },
      },
    },
  });
}

export async function createEpisode(podcastId: string, data: CreateEpisodeInput) {
  const episode = await prisma.podcast_episodes.create({
    data: {
      ...data,
      podcastId,
      chapters: data.chapters as Prisma.JsonArray,
    },
    include: {
      podcasts: {
        select: { id: true, title: true, slug: true },
      },
    },
  });

  // Update podcast episode count
  await updatePodcastStats(podcastId);

  return episode;
}

export async function updateEpisode(episodeId: string, data: UpdateEpisodeInput) {
  const episode = await prisma.podcast_episodes.update({
    where: { id: episodeId },
    data: {
      ...data,
      ...(data.chapters && { chapters: data.chapters as Prisma.JsonArray }),
    },
    include: {
      podcasts: {
        select: { id: true, title: true, slug: true },
      },
    },
  });

  // Update podcast stats if status changed
  if (data.status) {
    await updatePodcastStats(episode.podcastId);
  }

  return episode;
}

export async function deleteEpisode(episodeId: string) {
  const episode = await prisma.podcast_episodes.findUnique({
    where: { id: episodeId },
    select: { podcastId: true },
  });

  await prisma.$transaction([
    prisma.podcast_likes.deleteMany({ where: { episodeId } }),
    prisma.podcast_listens.deleteMany({ where: { episodeId } }),
    prisma.podcast_episodes.delete({ where: { id: episodeId } }),
  ]);

  if (episode) {
    await updatePodcastStats(episode.podcastId);
  }
}

// ============================================
// Subscription Management
// ============================================

export async function subscribeToPodcast(userId: string, podcastId: string) {
  const subscription = await prisma.podcast_subscriptions.upsert({
    where: {
      userId_podcastId: { userId, podcastId },
    },
    create: { userId, podcastId },
    update: {},
    include: {
      podcasts: {
        select: { id: true, title: true, slug: true, coverImage: true },
      },
    },
  });

  // Update subscriber count
  await updatePodcastSubscriberCount(podcastId);

  return subscription;
}

export async function unsubscribeFromPodcast(userId: string, podcastId: string) {
  await prisma.podcast_subscriptions.delete({
    where: {
      userId_podcastId: { userId, podcastId },
    },
  });

  // Update subscriber count
  await updatePodcastSubscriberCount(podcastId);
}

export async function getUserSubscriptions(userId: string) {
  return prisma.podcast_subscriptions.findMany({
    where: { userId },
    include: {
      podcasts: {
        include: {
          users: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
          _count: {
            select: { podcast_episodes: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function isUserSubscribed(userId: string, podcastId: string) {
  const subscription = await prisma.podcast_subscriptions.findUnique({
    where: {
      userId_podcastId: { userId, podcastId },
    },
  });
  return !!subscription;
}

// ============================================
// Listen Progress & Analytics
// ============================================

export async function recordListenProgress(
  episodeId: string,
  userId: string | null,
  data: ListenProgressInput,
  ipAddress?: string
) {
  // Find existing listen record for this user/episode combination
  const existingListen = await prisma.podcast_listens.findFirst({
    where: userId
      ? { userId, episodeId }
      : { ipHash: ipAddress, episodeId, userId: null },
  });

  let listen;
  if (existingListen) {
    // Update existing
    listen = await prisma.podcast_listens.update({
      where: { id: existingListen.id },
      data: {
        progress: data.progress,
        completed: data.completed ?? existingListen.completed,
        lastPlayedAt: new Date(),
        completedAt: data.completed ? new Date() : existingListen.completedAt,
      },
    });
  } else {
    // Create new
    listen = await prisma.podcast_listens.create({
      data: {
        episodeId,
        userId,
        progress: data.progress,
        duration: data.duration,
        completed: data.completed ?? false,
        source: data.source,
        ipHash: ipAddress,
      },
    });
  }

  // Update episode listen count
  await updateEpisodeListenCount(episodeId);

  return listen;
}

export async function getUserListenHistory(userId: string, limit = 20) {
  return prisma.podcast_listens.findMany({
    where: { userId },
    include: {
      podcast_episodes: {
        include: {
          podcasts: {
            select: { id: true, title: true, slug: true, coverImage: true },
          },
        },
      },
    },
    orderBy: { lastPlayedAt: 'desc' },
    take: limit,
  });
}

export async function getEpisodeProgress(userId: string, episodeId: string) {
  return prisma.podcast_listens.findFirst({
    where: { userId, episodeId },
    select: { progress: true, duration: true, completed: true },
  });
}

// ============================================
// Likes
// ============================================

export async function likeEpisode(userId: string, episodeId: string) {
  const like = await prisma.podcast_likes.upsert({
    where: {
      userId_episodeId: { userId, episodeId },
    },
    create: { userId, episodeId },
    update: {},
  });

  await updateEpisodeLikeCount(episodeId);

  return like;
}

export async function unlikeEpisode(userId: string, episodeId: string) {
  await prisma.podcast_likes.delete({
    where: {
      userId_episodeId: { userId, episodeId },
    },
  });

  await updateEpisodeLikeCount(episodeId);
}

export async function isEpisodeLiked(userId: string, episodeId: string) {
  const like = await prisma.podcast_likes.findUnique({
    where: {
      userId_episodeId: { userId, episodeId },
    },
  });
  return !!like;
}

export async function getUserLikedEpisodes(userId: string) {
  return prisma.podcast_likes.findMany({
    where: { userId },
    include: {
      podcast_episodes: {
        include: {
          podcasts: {
            select: { id: true, title: true, slug: true, coverImage: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ============================================
// Stats Helpers
// ============================================

async function updatePodcastStats(podcastId: string) {
  const stats = await prisma.podcast_episodes.aggregate({
    where: { podcastId, status: EpisodeStatus.PUBLISHED },
    _count: { id: true },
    _sum: { duration: true, listenCount: true },
  });

  await prisma.podcasts.update({
    where: { id: podcastId },
    data: {
      totalEpisodes: stats._count.id,
      totalDuration: stats._sum.duration ?? 0,
      totalListens: stats._sum.listenCount ?? 0,
    },
  });
}

async function updatePodcastSubscriberCount(podcastId: string) {
  const count = await prisma.podcast_subscriptions.count({
    where: { podcastId },
  });

  await prisma.podcasts.update({
    where: { id: podcastId },
    data: { subscriberCount: count },
  });
}

async function updateEpisodeListenCount(episodeId: string) {
  const count = await prisma.podcast_listens.count({
    where: { episodeId },
  });

  const episode = await prisma.podcast_episodes.update({
    where: { id: episodeId },
    data: { listenCount: count },
    select: { podcastId: true },
  });

  // Also update podcast total listens
  await updatePodcastStats(episode.podcastId);
}

async function updateEpisodeLikeCount(episodeId: string) {
  const count = await prisma.podcast_likes.count({
    where: { episodeId },
  });

  await prisma.podcast_episodes.update({
    where: { id: episodeId },
    data: { likeCount: count },
  });
}

// ============================================
// Public API - Featured/Popular
// ============================================

export async function getFeaturedPodcasts(limit = 6) {
  return prisma.podcasts.findMany({
    where: { status: PodcastStatus.PUBLISHED },
    orderBy: { subscriberCount: 'desc' },
    take: limit,
    include: {
      users: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      },
      _count: {
        select: { podcast_episodes: true },
      },
    },
  });
}

export async function getLatestEpisodes(limit = 10) {
  return prisma.podcast_episodes.findMany({
    where: { status: EpisodeStatus.PUBLISHED },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    include: {
      podcasts: {
        select: { id: true, title: true, slug: true, coverImage: true },
      },
    },
  });
}

export async function getPopularEpisodes(limit = 10) {
  return prisma.podcast_episodes.findMany({
    where: { status: EpisodeStatus.PUBLISHED },
    orderBy: { listenCount: 'desc' },
    take: limit,
    include: {
      podcasts: {
        select: { id: true, title: true, slug: true, coverImage: true },
      },
    },
  });
}

// ============================================
// Analytics
// ============================================

export async function getPodcastAnalytics(podcastId: string, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [listensOverTime, topEpisodes, subscriberGrowth] = await Promise.all([
    // Listens per day
    prisma.$queryRaw`
      SELECT DATE(started_at) as date, COUNT(*) as count
      FROM podcast_listens pl
      JOIN podcast_episodes pe ON pl.episode_id = pe.id
      WHERE pe.podcast_id = ${podcastId}
        AND pl.started_at >= ${startDate}
      GROUP BY DATE(started_at)
      ORDER BY date
    `,
    // Top episodes
    prisma.podcast_episodes.findMany({
      where: { podcastId },
      orderBy: { listenCount: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        listenCount: true,
        likeCount: true,
      },
    }),
    // Subscriber growth
    prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM podcast_subscriptions
      WHERE podcast_id = ${podcastId}
        AND created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date
    `,
  ]);

  return {
    listensOverTime,
    topEpisodes,
    subscriberGrowth,
  };
}
