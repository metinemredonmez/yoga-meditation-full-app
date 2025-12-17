import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import {
  podcastFiltersSchema,
  podcastIdParamSchema,
  episodeIdParamSchema,
  episodeFiltersSchema,
  createPodcastSchema,
  updatePodcastSchema,
  createEpisodeSchema,
  updateEpisodeSchema,
} from '../validation/podcastSchemas';
import {
  listPodcasts,
  getPodcastById,
  createPodcast,
  updatePodcast,
  deletePodcast,
  listEpisodes,
  getEpisodeById,
  createEpisode,
  updateEpisode,
  deleteEpisode,
  getPodcastAnalytics,
} from '../services/podcastService';
import { logger } from '../utils/logger';

function isNotFound(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
}

// ============================================
// Admin Podcast CRUD - Full access for ADMIN
// TEACHER can only manage their own podcasts
// ============================================

export async function adminListPodcasts(req: Request, res: Response) {
  try {
    const filters = podcastFiltersSchema.parse(req.query);

    // If user is TEACHER (not ADMIN), only show their podcasts
    if (req.user?.role === 'TEACHER') {
      filters.hostId = req.user.id;
    }

    const result = await listPodcasts(filters);
    return res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.flatten() });
    }
    logger.error({ err: error }, 'Admin list podcasts failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminGetPodcast(req: Request, res: Response) {
  try {
    const { podcastId } = podcastIdParamSchema.parse(req.params);
    const podcast = await getPodcastById(podcastId);

    if (!podcast) {
      return res.status(404).json({ error: 'Podcast not found' });
    }

    // TEACHER can only view their own podcasts
    if (req.user?.role === 'TEACHER' && podcast.hostId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return res.json({ podcast });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid podcast id', details: error.flatten() });
    }
    logger.error({ err: error }, 'Admin get podcast failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminCreatePodcast(req: Request, res: Response) {
  try {
    const payload = createPodcastSchema.parse(req.body);

    // If TEACHER, automatically set themselves as host
    if (req.user?.role === 'TEACHER') {
      payload.hostId = req.user.id;
    }

    const podcast = await createPodcast(payload);
    return res.status(201).json({ podcast });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }
    logger.error({ err: error }, 'Admin create podcast failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminUpdatePodcast(req: Request, res: Response) {
  try {
    const { podcastId } = podcastIdParamSchema.parse(req.params);
    const payload = updatePodcastSchema.parse(req.body);

    // Check ownership for TEACHER
    if (req.user?.role === 'TEACHER') {
      const existing = await getPodcastById(podcastId);
      if (!existing || existing.hostId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      // TEACHER cannot change the host
      delete payload.hostId;
    }

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    const podcast = await updatePodcast(podcastId, payload);
    return res.json({ podcast });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }
    if (isNotFound(error)) {
      return res.status(404).json({ error: 'Podcast not found' });
    }
    logger.error({ err: error }, 'Admin update podcast failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminDeletePodcast(req: Request, res: Response) {
  try {
    const { podcastId } = podcastIdParamSchema.parse(req.params);

    // Check ownership for TEACHER
    if (req.user?.role === 'TEACHER') {
      const existing = await getPodcastById(podcastId);
      if (!existing || existing.hostId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    await deletePodcast(podcastId);
    return res.status(204).send();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid podcast id', details: error.flatten() });
    }
    if (isNotFound(error)) {
      return res.status(404).json({ error: 'Podcast not found' });
    }
    logger.error({ err: error }, 'Admin delete podcast failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ============================================
// Admin Episode CRUD
// ============================================

export async function adminListEpisodes(req: Request, res: Response) {
  try {
    const { podcastId } = podcastIdParamSchema.parse(req.params);
    const filters = episodeFiltersSchema.parse(req.query);

    // Check ownership for TEACHER
    if (req.user?.role === 'TEACHER') {
      const podcast = await getPodcastById(podcastId);
      if (!podcast || podcast.hostId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const result = await listEpisodes(podcastId, filters);
    return res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.flatten() });
    }
    logger.error({ err: error }, 'Admin list episodes failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminGetEpisode(req: Request, res: Response) {
  try {
    const { episodeId } = episodeIdParamSchema.parse(req.params);
    const episode = await getEpisodeById(episodeId);

    if (!episode) {
      return res.status(404).json({ error: 'Episode not found' });
    }

    // Check ownership for TEACHER
    if (req.user?.role === 'TEACHER') {
      const podcast = await getPodcastById(episode.podcastId);
      if (!podcast || podcast.hostId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    return res.json({ episode });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid episode id', details: error.flatten() });
    }
    logger.error({ err: error }, 'Admin get episode failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminCreateEpisode(req: Request, res: Response) {
  try {
    const { podcastId } = podcastIdParamSchema.parse(req.params);
    const payload = createEpisodeSchema.parse(req.body);

    // Check ownership for TEACHER
    if (req.user?.role === 'TEACHER') {
      const podcast = await getPodcastById(podcastId);
      if (!podcast || podcast.hostId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const episode = await createEpisode(podcastId, payload);
    return res.status(201).json({ episode });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }
    logger.error({ err: error }, 'Admin create episode failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminUpdateEpisode(req: Request, res: Response) {
  try {
    const { episodeId } = episodeIdParamSchema.parse(req.params);
    const payload = updateEpisodeSchema.parse(req.body);

    const episode = await getEpisodeById(episodeId);
    if (!episode) {
      return res.status(404).json({ error: 'Episode not found' });
    }

    // Check ownership for TEACHER
    if (req.user?.role === 'TEACHER') {
      const podcast = await getPodcastById(episode.podcastId);
      if (!podcast || podcast.hostId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    const updated = await updateEpisode(episodeId, payload);
    return res.json({ episode: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }
    if (isNotFound(error)) {
      return res.status(404).json({ error: 'Episode not found' });
    }
    logger.error({ err: error }, 'Admin update episode failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminDeleteEpisode(req: Request, res: Response) {
  try {
    const { episodeId } = episodeIdParamSchema.parse(req.params);

    const episode = await getEpisodeById(episodeId);
    if (!episode) {
      return res.status(404).json({ error: 'Episode not found' });
    }

    // Check ownership for TEACHER
    if (req.user?.role === 'TEACHER') {
      const podcast = await getPodcastById(episode.podcastId);
      if (!podcast || podcast.hostId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    await deleteEpisode(episodeId);
    return res.status(204).send();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid episode id', details: error.flatten() });
    }
    if (isNotFound(error)) {
      return res.status(404).json({ error: 'Episode not found' });
    }
    logger.error({ err: error }, 'Admin delete episode failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ============================================
// Analytics
// ============================================

export async function adminGetPodcastAnalytics(req: Request, res: Response) {
  try {
    const { podcastId } = podcastIdParamSchema.parse(req.params);
    const days = parseInt(req.query.days as string) || 30;

    // Check ownership for TEACHER
    if (req.user?.role === 'TEACHER') {
      const podcast = await getPodcastById(podcastId);
      if (!podcast || podcast.hostId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const analytics = await getPodcastAnalytics(podcastId, days);
    return res.json({ analytics });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid podcast id', details: error.flatten() });
    }
    logger.error({ err: error }, 'Admin get podcast analytics failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
