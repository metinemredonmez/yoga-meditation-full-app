import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import {
  challengeIdParamSchema,
  createChallengeSchema,
  updateChallengeSchema,
  challengeCheckSchema,
} from '../validation/challengeSchemas';
import {
  createChallenge,
  updateChallenge,
  deleteChallenge,
  joinChallenge,
  logChallengeDailyCheck,
} from '../services/challengeService';
import {
  getCachedChallenge,
  getCachedChallengeList,
} from '../services/cachedChallengeService';
import { logger } from '../utils/logger';

export async function getChallenges(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const challenges = await getCachedChallengeList(userId);
    return res.json({ challenges });
  } catch (error) {
    logger.error({ err: error }, 'Failed to list challenges');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getChallenge(req: Request, res: Response) {
  try {
    const { challengeId } = challengeIdParamSchema.parse(req.params);
    const challenge = await getCachedChallenge(challengeId, req.user?.userId);

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    return res.json({ challenge });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid challenge id', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to fetch challenge');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function postChallenge(req: Request, res: Response) {
  try {
    const payload = createChallengeSchema.parse(req.body);
    const challenge = await createChallenge(payload);
    return res.status(201).json({ challenge });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to create challenge');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function putChallenge(req: Request, res: Response) {
  try {
    const { challengeId } = challengeIdParamSchema.parse(req.params);
    const payload = updateChallengeSchema.parse(req.body);
    const challenge = await updateChallenge(challengeId, payload);
    return res.json({ challenge });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    logger.error({ err: error }, 'Failed to update challenge');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteChallengeHandler(req: Request, res: Response) {
  try {
    const { challengeId } = challengeIdParamSchema.parse(req.params);
    await deleteChallenge(challengeId);
    return res.status(204).send();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid challenge id', details: error.flatten() });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    logger.error({ err: error }, 'Failed to delete challenge');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function joinChallengeHandler(req: Request, res: Response) {
  try {
    const { challengeId } = challengeIdParamSchema.parse(req.params);
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await joinChallenge(req.user.userId, challengeId);
    return res.status(204).send();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid challenge id', details: error.flatten() });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'Already joined challenge' });
    }

    if (error instanceof Error) {
      if (error.name === 'NotFoundError') {
        return res.status(404).json({ error: 'Challenge not found' });
      }
      if (error.message === 'Challenge has not started yet') {
        return res.status(400).json({ error: error.message });
      }
    }

    logger.error({ err: error }, 'Failed to join challenge');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function logChallengeCheckHandler(req: Request, res: Response) {
  try {
    const { challengeId } = challengeIdParamSchema.parse(req.params);
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = challengeCheckSchema.parse(req.body ?? {});
    const check = await logChallengeDailyCheck(req.user.userId, challengeId, payload);
    return res.status(200).json({ check });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    if (error instanceof Error) {
      if (error.name === 'NotFoundError') {
        return res.status(404).json({ error: 'Challenge not found' });
      }
      if (error.name === 'NotEnrolledError') {
        return res.status(403).json({ error: 'Join the challenge before logging progress' });
      }
      if (error.name === 'ProgramSessionNotFound') {
        return res.status(404).json({ error: 'Program session not found' });
      }
    }

    logger.error({ err: error }, 'Failed to log daily challenge check');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
