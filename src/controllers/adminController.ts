import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

const idParamSchema = z.object({
  id: z.string().cuid('Invalid user id'),
});

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT']),
});

export async function listUsers(req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phoneNumber: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json({ users });
  } catch (error) {
    logger.error({ err: error }, 'List users failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateUserRole(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const payload = updateRoleSchema.parse(req.body);

    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin privileges required' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: payload.role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        updatedAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: id,
        actorRole: req.user.role,
        action: 'admin.user.role.update',
        metadata: {
          updatedBy: req.user.userId,
          newRole: payload.role,
        },
      },
    });

    return res.json({
      message: 'Role updated',
      user: updatedUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Update role failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
