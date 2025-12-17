import { Request, Response } from 'express';
import { ZodError } from 'zod';
import {
  poseFiltersSchema,
  poseIdParamSchema,
  createPoseSchema,
  updatePoseSchema,
} from '../validation/poseSchemas';
import {
  createPose,
  updatePose,
  deletePose,
} from '../services/poseService';
import {
  getCachedPose,
  getCachedPoseList,
} from '../services/cachedPoseService';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';

export async function getPoses(req: Request, res: Response) {
  try {
    const filters = poseFiltersSchema.parse(req.query);
    const poses = await getCachedPoseList(filters);
    return res.json({ poses });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to list poses');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getPose(req: Request, res: Response) {
  try {
    const { poseId } = poseIdParamSchema.parse(req.params);
    const pose = await getCachedPose(poseId);

    if (!pose) {
      return res.status(404).json({ error: 'Pose not found' });
    }

    return res.json({ pose });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid pose id', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to fetch pose detail');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function postPose(req: Request, res: Response) {
  try {
    const payload = createPoseSchema.parse(req.body);
    const pose = await createPose(payload);
    return res.status(201).json({ pose });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to create pose');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function putPose(req: Request, res: Response) {
  try {
    const { poseId } = poseIdParamSchema.parse(req.params);
    const payload = updatePoseSchema.parse(req.body);
    const pose = await updatePose(poseId, payload);
    return res.json({ pose });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Pose not found' });
    }

    logger.error({ err: error }, 'Failed to update pose');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deletePoseHandler(req: Request, res: Response) {
  try {
    const { poseId } = poseIdParamSchema.parse(req.params);
    await deletePose(poseId);
    return res.status(204).send();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid pose id', details: error.flatten() });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Pose not found' });
    }

    logger.error({ err: error }, 'Failed to delete pose');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
