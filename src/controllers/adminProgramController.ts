import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import {
  programFiltersSchema,
  programIdParamSchema,
  programSessionIdParamSchema,
  createProgramSchema,
  updateProgramSchema,
  createProgramSessionSchema,
  updateProgramSessionSchema,
} from '../validation/programSchemas';
import {
  listPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  listProgramSessions,
  createProgramSession,
  updateProgramSession,
  deleteProgramSession,
} from '../services/programService';
import { logger } from '../utils/logger';
import { prisma } from '../utils/database';

function isNotFound(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
}

export async function adminListPrograms(req: Request, res: Response) {
  try {
    const filters = programFiltersSchema.parse(req.query);
    const programs = await listPrograms(filters);
    return res.json({ programs });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.flatten() });
    }

    logger.error({ err: error }, 'Admin list programs failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminGetProgram(req: Request, res: Response) {
  try {
    const { programId } = programIdParamSchema.parse(req.params);
    const program = await getProgramById(programId);

    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }

    return res.json({ program });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid program id', details: error.flatten() });
    }

    logger.error({ err: error }, 'Admin get program failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminCreateProgram(req: Request, res: Response) {
  try {
    const payload = createProgramSchema.parse(req.body);
    const program = await createProgram(payload);
    return res.status(201).json({ program });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Admin create program failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminUpdateProgram(req: Request, res: Response) {
  try {
    const { programId } = programIdParamSchema.parse(req.params);
    const payload = updateProgramSchema.parse(req.body);

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    const program = await updateProgram(programId, payload);
    return res.json({ program });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    if (isNotFound(error)) {
      return res.status(404).json({ error: 'Program not found' });
    }

    logger.error({ err: error }, 'Admin update program failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminDeleteProgram(req: Request, res: Response) {
  try {
    const { programId } = programIdParamSchema.parse(req.params);
    await deleteProgram(programId);
    return res.status(204).send();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid program id', details: error.flatten() });
    }

    if (isNotFound(error)) {
      return res.status(404).json({ error: 'Program not found' });
    }

    logger.error({ err: error }, 'Admin delete program failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminListProgramSessions(req: Request, res: Response) {
  try {
    const { programId } = programIdParamSchema.parse(req.params);
    const sessions = await listProgramSessions(programId);
    return res.json({ sessions });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid program id', details: error.flatten() });
    }

    logger.error({ err: error }, 'Admin list program sessions failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminCreateProgramSession(req: Request, res: Response) {
  try {
    const { programId } = programIdParamSchema.parse(req.params);
    const payload = createProgramSessionSchema.parse(req.body);

    const existingProgram = await prisma.program.findUnique({
      where: { id: programId },
      select: { id: true },
    });

    if (!existingProgram) {
      return res.status(404).json({ error: 'Program not found' });
    }

    const session = await createProgramSession(programId, payload);
    return res.status(201).json({ session });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    if (isNotFound(error)) {
      return res.status(404).json({ error: 'Program not found' });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'Session order must be unique within the program' });
    }

    logger.error({ err: error }, 'Admin create program session failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminUpdateProgramSession(req: Request, res: Response) {
  try {
    const { programId, sessionId } = programIdParamSchema.merge(programSessionIdParamSchema).parse(req.params);
    const payload = updateProgramSessionSchema.parse(req.body);

    const belongsToProgram = await prisma.programSession.findFirst({
      where: {
        id: sessionId,
        programId,
      },
      select: { id: true },
    });

    if (!belongsToProgram) {
      return res.status(404).json({ error: 'Session not found for program' });
    }

    const session = await updateProgramSession(sessionId, payload);

    return res.json({ session });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    if (isNotFound(error)) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'Session order must be unique within the program' });
    }

    logger.error({ err: error }, 'Admin update program session failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminDeleteProgramSession(req: Request, res: Response) {
  try {
    const { programId, sessionId } = programIdParamSchema.merge(programSessionIdParamSchema).parse(req.params);

    const existing = await prisma.programSession.findFirst({
      where: {
        id: sessionId,
        programId,
      },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await deleteProgramSession(sessionId);
    return res.status(204).send();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid parameters', details: error.flatten() });
    }

    if (isNotFound(error)) {
      return res.status(404).json({ error: 'Session not found' });
    }

    logger.error({ err: error }, 'Admin delete program session failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
