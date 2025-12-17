import { Request, Response } from 'express';
import { ZodError } from 'zod';
import {
  podcastFiltersSchema,
  podcastIdParamSchema,
  episodeIdParamSchema,
  episodeFiltersSchema,
  listenProgressSchema,
} from '../validation/podcastSchemas';
import {
  listPodcasts,
  getPodcastById,
  getPodcastBySlug,
  listEpisodes,
  getEpisodeById,
  getEpisodeBySlug,
  subscribeToPodcast,
  unsubscribeFromPodcast,
  getUserSubscriptions,
  isUserSubscribed,
  recordListenProgress,
  getUserListenHistory,
  getEpisodeProgress,
  likeEpisode,
  unlikeEpisode,
  isEpisodeLiked,
  getUserLikedEpisodes,
  getFeaturedPodcasts,
  getLatestEpisodes,
  getPopularEpisodes,
} from '../services/podcastService';
import { generatePodcastRssFeed } from '../services/rssFeedService';
import { logger } from '../utils/logger';

// ============================================
// Public Podcast Endpoints
// ============================================

export async function listPublicPodcasts(req: Request, res: Response) {
  try {
    const filters = podcastFiltersSchema.parse(req.query);
    // Only show published podcasts publicly
    const result = await listPodcasts({ ...filters, status: 'PUBLISHED' });
    return res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to list podcasts');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getPublicPodcast(req: Request, res: Response) {
  try {
    const slug = req.params.slug;
    if (!slug) {
      return res.status(400).json({ error: 'Podcast slug is required' });
    }
    const podcast = await getPodcastBySlug(slug);

    if (!podcast || podcast.status !== 'PUBLISHED') {
      return res.status(404).json({ error: 'Podcast not found' });
    }

    // Check if user is subscribed (if authenticated)
    let isSubscribed = false;
    const userId = req.user?.id;
    if (userId) {
      isSubscribed = await isUserSubscribed(userId, podcast.id);
    }

    return res.json({ podcast, isSubscribed });
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch podcast');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listPublicEpisodes(req: Request, res: Response) {
  try {
    const slug = req.params.slug;
    if (!slug) {
      return res.status(400).json({ error: 'Podcast slug is required' });
    }
    const filters = episodeFiltersSchema.parse(req.query);

    const podcast = await getPodcastBySlug(slug);
    if (!podcast || podcast.status !== 'PUBLISHED') {
      return res.status(404).json({ error: 'Podcast not found' });
    }

    // Only show published episodes publicly
    const result = await listEpisodes(podcast.id, { ...filters, status: 'PUBLISHED' });
    return res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to list episodes');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getPublicEpisode(req: Request, res: Response) {
  try {
    const podcastSlug = req.params.podcastSlug;
    const episodeSlug = req.params.episodeSlug;
    if (!podcastSlug || !episodeSlug) {
      return res.status(400).json({ error: 'Podcast and episode slugs are required' });
    }
    const episode = await getEpisodeBySlug(podcastSlug, episodeSlug);

    if (!episode) {
      return res.status(404).json({ error: 'Episode not found' });
    }

    // Get user progress and like status if authenticated
    let progress = null;
    let isLiked = false;
    const userId = req.user?.id;
    if (userId) {
      progress = await getEpisodeProgress(userId, episode.id);
      isLiked = await isEpisodeLiked(userId, episode.id);
    }

    return res.json({ episode, progress, isLiked });
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch episode');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ============================================
// Featured & Discovery
// ============================================

export async function getFeatured(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 6;
    const podcasts = await getFeaturedPodcasts(limit);
    return res.json({ podcasts });
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch featured podcasts');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getLatest(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const episodes = await getLatestEpisodes(limit);
    return res.json({ episodes });
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch latest episodes');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getPopular(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const episodes = await getPopularEpisodes(limit);
    return res.json({ episodes });
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch popular episodes');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ============================================
// User Subscription Endpoints
// ============================================

export async function subscribe(req: Request, res: Response) {
  try {
    const { podcastId } = podcastIdParamSchema.parse(req.params);
    const userId = req.user!.id;

    const subscription = await subscribeToPodcast(userId, podcastId);
    return res.status(201).json({ subscription });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid podcast id', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to subscribe to podcast');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function unsubscribe(req: Request, res: Response) {
  try {
    const { podcastId } = podcastIdParamSchema.parse(req.params);
    const userId = req.user!.id;

    await unsubscribeFromPodcast(userId, podcastId);
    return res.status(204).send();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid podcast id', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to unsubscribe from podcast');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMySubscriptions(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const subscriptions = await getUserSubscriptions(userId);
    return res.json({ subscriptions });
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch subscriptions');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ============================================
// Listen Progress Endpoints
// ============================================

export async function recordProgress(req: Request, res: Response) {
  try {
    const { episodeId } = episodeIdParamSchema.parse(req.params);
    const data = listenProgressSchema.parse(req.body);
    const userId = req.user?.id || null;
    const ipAddress = req.ip;

    const listen = await recordListenProgress(episodeId, userId, data, ipAddress);
    return res.json({ listen });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to record listen progress');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMyListenHistory(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const history = await getUserListenHistory(userId, limit);
    return res.json({ history });
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch listen history');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ============================================
// Like Endpoints
// ============================================

export async function like(req: Request, res: Response) {
  try {
    const { episodeId } = episodeIdParamSchema.parse(req.params);
    const userId = req.user!.id;

    const result = await likeEpisode(userId, episodeId);
    return res.status(201).json({ like: result });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid episode id', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to like episode');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function unlike(req: Request, res: Response) {
  try {
    const { episodeId } = episodeIdParamSchema.parse(req.params);
    const userId = req.user!.id;

    await unlikeEpisode(userId, episodeId);
    return res.status(204).send();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid episode id', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to unlike episode');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMyLikedEpisodes(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const liked = await getUserLikedEpisodes(userId);
    return res.json({ liked });
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch liked episodes');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ============================================
// RSS Feed Endpoint
// ============================================

export async function getRssFeed(req: Request, res: Response) {
  try {
    const slug = req.params.slug;
    if (!slug) {
      return res.status(400).json({ error: 'Podcast slug is required' });
    }

    const rssFeed = await generatePodcastRssFeed(slug);

    if (!rssFeed) {
      return res.status(404).json({ error: 'Podcast not found or RSS not enabled' });
    }

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    return res.send(rssFeed);
  } catch (error) {
    logger.error({ err: error }, 'Failed to generate RSS feed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
