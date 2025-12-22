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
    const { page = 1, limit = 20, tier, status, role, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    // Filter by subscription tier
    if (tier && tier !== 'all') {
      where.subscriptionTier = tier;
    }

    // Filter by status (based on isActive field)
    if (status === 'ACTIVE') {
      where.isActive = true;
    } else if (status === 'INACTIVE') {
      where.isActive = false;
    }

    // Filter by role
    if (role && role !== 'all') {
      where.role = role;
    }

    // Search by name or email
    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          phoneNumber: true,
          bio: true,
          isActive: true,
          subscriptionTier: true,
          subscriptionExpiresAt: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          subscriptions: {
            where: { status: 'ACTIVE' },
            select: {
              id: true,
              provider: true,
              isManual: true,
              grantedAt: true,
              grantReason: true,
              currentPeriodEnd: true,
              plan: {
                select: {
                  tier: true,
                  name: true,
                },
              },
            },
            take: 1,
          },
        },
      }),
      prisma.users.count({ where }),
    ]);

    const formattedUsers = users.map(user => ({
      ...user,
      activeSubscription: user.subscriptions[0] || null,
      subscriptions: undefined,
    }));

    return res.json({
      success: true,
      users: formattedUsers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'List users failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateUserRole(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const payload = updateRoleSchema.parse(req.body);

    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
      return res.status(403).json({ error: 'Admin privileges required' });
    }

    const updatedUser = await prisma.users.update({
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

    await prisma.audit_logs.create({
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
      users: updatedUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Update role failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
