import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { LessonType } from '@prisma/client';
import {
  updateProgressBodySchema,
  getProgressParamsSchema,
  getProgressQuerySchema,
  getUserProgressQuerySchema,
  markCompletedParamsSchema,
  markCompletedBodySchema,
  resetProgressParamsSchema,
  resetProgressQuerySchema,
} from '../validation/videoProgressSchemas';
import {
  updateProgress,
  getProgress,
  getUserProgress,
  markAsCompleted,
  resetProgress,
} from '../services/videoProgressService';
import { logger } from '../utils/logger';

export async function handleUpdateProgress(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = updateProgressBodySchema.parse(req.body);

    const result = await updateProgress({
      userId: req.user.userId,
      lessonId: payload.lessonId,
      lessonType: payload.lessonType as LessonType,
      currentTime: payload.currentTime,
      duration: payload.duration,
    });

    return res.json({
      message: 'Progress updated',
      progress: result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to update video progress');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleGetProgress(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { lessonId } = getProgressParamsSchema.parse(req.params);
    const { lessonType } = getProgressQuerySchema.parse(req.query);

    const progress = await getProgress(req.user.userId, lessonId, lessonType as LessonType);

    if (!progress) {
      return res.json({
        progress: null,
        message: 'No progress found for this lesson',
      });
    }

    return res.json({ progress });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to get video progress');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleGetUserProgress(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const query = getUserProgressQuerySchema.parse(req.query);

    const result = await getUserProgress(req.user.userId, {
      lessonType: query.lessonType as LessonType | undefined,
      completedOnly: query.completedOnly,
      page: query.page,
      limit: query.limit,
    });

    return res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to get user progress');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleMarkCompleted(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { lessonId } = markCompletedParamsSchema.parse(req.params);
    const { lessonType } = markCompletedBodySchema.parse(req.body);

    const result = await markAsCompleted(req.user.userId, lessonId, lessonType as LessonType);

    return res.json({
      message: 'Lesson marked as completed',
      progress: result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to mark lesson as completed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleResetProgress(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { lessonId } = resetProgressParamsSchema.parse(req.params);
    const { lessonType } = resetProgressQuerySchema.parse(req.query);

    const deleted = await resetProgress(req.user.userId, lessonId, lessonType as LessonType);

    if (!deleted) {
      return res.status(404).json({ error: 'No progress found for this lesson' });
    }

    return res.status(204).send();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to reset video progress');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
