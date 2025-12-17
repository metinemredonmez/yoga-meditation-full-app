import { Request, Response } from 'express';
import { ZodError } from 'zod';
import {
  programFiltersSchema,
  programDetailParamSchema,
} from '../validation/programSchemas';
import {
  searchPrograms,
} from '../services/programService';
import {
  getCachedProgram,
  getCachedProgramList,
  getCachedTags,
} from '../services/cachedProgramService';
import { logger } from '../utils/logger';

export async function getPrograms(req: Request, res: Response) {
  try {
    const filters = programFiltersSchema.parse(req.query);
    const programs = await getCachedProgramList(filters);
    return res.json({ programs });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to list programs');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getProgram(req: Request, res: Response) {
  try {
    const { id } = programDetailParamSchema.parse(req.params);
    const program = await getCachedProgram(id);

    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }

    return res.json({ program });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid program id', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to fetch program detail');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getTagsGrouped(_req: Request, res: Response) {
  try {
    const tags = await getCachedTags();
    return res.json({ tags });
  } catch (error) {
    logger.error({ err: error }, 'Failed to list tags');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function searchProgramsHandler(req: Request, res: Response) {
  try {
    const filters = programFiltersSchema.parse(req.query);
    const programs = await searchPrograms(filters);
    return res.json({ programs });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to search programs');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
