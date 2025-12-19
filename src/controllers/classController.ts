import { Request, Response } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

const classLevelEnum = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL']);
const classStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

const createClassSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  schedule: z.string().datetime({ message: 'schedule must be an ISO date string' }),
  instructorId: z.string().cuid('Invalid instructor id'),
  // New media fields
  thumbnailUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  previewUrl: z.string().url().optional(),
  // Class details
  duration: z.number().int().min(1).max(300).optional(),
  level: classLevelEnum.optional(),
  category: z.string().optional(),
  status: classStatusEnum.optional(),
  isFree: z.boolean().optional(),
  isLive: z.boolean().optional(),
});

const updateClassSchema = createClassSchema.partial();

const idParamSchema = z.object({
  id: z.string().cuid('Invalid class id'),
});

const listQuerySchema = z.object({
  status: classStatusEnum.optional(),
  level: classLevelEnum.optional(),
  category: z.string().optional(),
  instructorId: z.string().cuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function listClasses(req: Request, res: Response) {
  try {
    const query = listQuerySchema.parse(req.query);
    const { status, level, category, instructorId, search, page, limit } = query;

    const where: Prisma.classesWhereInput = {};

    if (status) where.status = status;
    if (level) where.level = level;
    if (category) where.category = category;
    if (instructorId) where.instructorId = instructorId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [classes, total] = await Promise.all([
      prisma.classes.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              bookings: true,
            },
          },
        },
      }),
      prisma.classes.count({ where }),
    ]);

    // Calculate average rating for each class
    const classesWithRating = classes.map((cls) => ({
      ...cls,
      rating: cls.ratingCount > 0 ? cls.totalRating / cls.ratingCount : 0,
    }));

    return res.json({
      classes: classesWithRating,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.flatten() });
    }
    logger.error({ err: error }, 'List classes failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createClass(req: Request, res: Response) {
  try {
    const payload = createClassSchema.parse(req.body);

    const instructor = await prisma.users.findUnique({
      where: { id: payload.instructorId },
      select: { id: true, role: true },
    });

    if (!instructor || !['TEACHER', 'ADMIN'].includes(instructor.role)) {
      return res.status(400).json({ error: 'Instructor must be a teacher or admin' });
    }

    const yogaClass = await prisma.classes.create({
      data: {
        title: payload.title,
        description: payload.description ?? null,
        schedule: new Date(payload.schedule),
        instructorId: payload.instructorId,
        thumbnailUrl: payload.thumbnailUrl ?? null,
        videoUrl: payload.videoUrl ?? null,
        previewUrl: payload.previewUrl ?? null,
        duration: payload.duration ?? 30,
        level: payload.level ?? 'BEGINNER',
        category: payload.category ?? null,
        status: payload.status ?? 'DRAFT',
        isFree: payload.isFree ?? false,
        isLive: payload.isLive ?? false,
      },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    await prisma.audit_logs.create({
      data: {
        userId: req.user?.userId ?? null,
        actorRole: req.user?.role ?? null,
        action: 'class.create',
        metadata: {
          classId: yogaClass.id,
        },
      },
    });

    return res.status(201).json({
      message: 'Class created',
      class: yogaClass,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Create class failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getClassById(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params);

    const yogaClass = await prisma.classes.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        bookings: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            bookings: true,
            comments: true,
          },
        },
      },
    });

    if (!yogaClass) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const classWithRating = {
      ...yogaClass,
      rating: yogaClass.ratingCount > 0 ? yogaClass.totalRating / yogaClass.ratingCount : 0,
    };

    return res.json({ class: classWithRating });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid class id', details: error.flatten() });
    }

    logger.error({ err: error }, 'Get class failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateClass(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const payload = updateClassSchema.parse(req.body);

    if (payload.instructorId) {
      const instructor = await prisma.users.findUnique({
        where: { id: payload.instructorId },
        select: { role: true },
      });

      if (!instructor || !['TEACHER', 'ADMIN'].includes(instructor.role)) {
        return res.status(400).json({ error: 'Instructor must be a teacher or admin' });
      }
    }

    const updateData: Prisma.classesUpdateInput = {};

    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.description !== undefined) updateData.description = payload.description ?? null;
    if (payload.schedule !== undefined) updateData.schedule = new Date(payload.schedule);
    if (payload.thumbnailUrl !== undefined) updateData.thumbnailUrl = payload.thumbnailUrl ?? null;
    if (payload.videoUrl !== undefined) updateData.videoUrl = payload.videoUrl ?? null;
    if (payload.previewUrl !== undefined) updateData.previewUrl = payload.previewUrl ?? null;
    if (payload.duration !== undefined) updateData.duration = payload.duration;
    if (payload.level !== undefined) updateData.level = payload.level;
    if (payload.category !== undefined) updateData.category = payload.category ?? null;
    if (payload.status !== undefined) updateData.status = payload.status;
    if (payload.isFree !== undefined) updateData.isFree = payload.isFree;
    if (payload.isLive !== undefined) updateData.isLive = payload.isLive;

    if (payload.instructorId !== undefined) {
      updateData.users = {
        connect: { id: payload.instructorId },
      };
    }

    const yogaClass = await prisma.classes.update({
      where: { id },
      data: updateData,
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    await prisma.audit_logs.create({
      data: {
        userId: req.user?.userId ?? null,
        actorRole: req.user?.role ?? null,
        action: 'class.update',
        metadata: {
          classId: yogaClass.id,
        },
      },
    });

    return res.json({
      message: 'Class updated',
      class: yogaClass,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Update class failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteClass(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params);

    await prisma.bookings.deleteMany({ where: { classId: id } });
    await prisma.classes.delete({ where: { id } });

    await prisma.audit_logs.create({
      data: {
        userId: req.user?.userId ?? null,
        actorRole: req.user?.role ?? null,
        action: 'class.delete',
        metadata: {
          classId: id,
        },
      },
    });

    return res.status(204).send();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid class id', details: error.flatten() });
    }

    logger.error({ err: error }, 'Delete class failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Stats endpoint for admin dashboard
export async function getClassStats(req: Request, res: Response) {
  try {
    const [total, published, draft, archived] = await Promise.all([
      prisma.classes.count(),
      prisma.classes.count({ where: { status: 'PUBLISHED' } }),
      prisma.classes.count({ where: { status: 'DRAFT' } }),
      prisma.classes.count({ where: { status: 'ARCHIVED' } }),
    ]);

    const totalEnrollments = await prisma.classes.aggregate({
      _sum: { enrollments: true },
    });

    const totalCompletions = await prisma.classes.aggregate({
      _sum: { completions: true },
    });

    return res.json({
      stats: {
        total,
        published,
        draft,
        archived,
        totalEnrollments: totalEnrollments._sum.enrollments ?? 0,
        totalCompletions: totalCompletions._sum.completions ?? 0,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Get class stats failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
