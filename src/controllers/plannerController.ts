import { Request, Response } from 'express';
import { ZodError } from 'zod';
import {
  createPlannerEntrySchema,
  plannerEntryIdParamSchema,
  plannerQuerySchema,
} from '../validation/plannerSchemas';
import {
  getPlannerEntries,
  createPlannerEntry,
  deletePlannerEntry,
} from '../services/plannerService';
import { logger } from '../utils/logger';

export async function getPlanner(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const query = plannerQuerySchema.parse(req.query);
    const entries = await getPlannerEntries(req.user.userId, query);
    return res.json({ entries });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to fetch planner');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createPlannerEntryHandler(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = createPlannerEntrySchema.parse(req.body);
    const entry = await createPlannerEntry(req.user.userId, payload);
    return res.status(201).json({ entry });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    if (error instanceof Error) {
      if (error.name === 'ProgramSessionNotFound') {
        return res.status(404).json({ error: 'Program session not found' });
      }
      if (error.name === 'ClassNotFound') {
        return res.status(404).json({ error: 'Class not found' });
      }
    }

    logger.error({ err: error }, 'Failed to create planner entry');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deletePlannerEntryHandler(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { entryId } = plannerEntryIdParamSchema.parse(req.params);
    await deletePlannerEntry(req.user.userId, entryId);
    return res.status(204).send();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid entry id', details: error.flatten() });
    }

    if (error instanceof Error) {
      if (error.name === 'NotFoundError') {
        return res.status(404).json({ error: 'Planner entry not found' });
      }
      if (error.name === 'Forbidden') {
        return res.status(403).json({ error: 'You can only delete your own planner entries' });
      }
    }

    logger.error({ err: error }, 'Failed to delete planner entry');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
