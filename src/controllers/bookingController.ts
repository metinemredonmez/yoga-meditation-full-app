import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

const createBookingSchema = z.object({
  classId: z.string().cuid('Invalid class id'),
});

const updateBookingSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']).optional(),
});

const idParamSchema = z.object({
  id: z.string().cuid('Invalid booking id'),
});

export async function createBooking(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = createBookingSchema.parse(req.body);

    const yogaClass = await prisma.class.findUnique({
      where: { id: payload.classId },
      select: {
        id: true,
        schedule: true,
      },
    });

    if (!yogaClass) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const existingBooking = await prisma.booking.findFirst({
      where: {
        userId: req.user.userId,
        classId: payload.classId,
      },
    });

    if (existingBooking) {
      return res.status(409).json({ error: 'You already booked this class' });
    }

    const booking = await prisma.booking.create({
      data: {
        userId: req.user.userId,
        classId: payload.classId,
        status: 'PENDING',
      },
      include: {
        class: {
          select: {
            id: true,
            title: true,
            schedule: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        actorRole: req.user.role,
        action: 'booking.create',
        metadata: {
          bookingId: booking.id,
          classId: payload.classId,
        },
      },
    });

    return res.status(201).json({
      message: 'Booking created',
      booking,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Create booking failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMyBookings(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        class: {
          select: {
            id: true,
            title: true,
            schedule: true,
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            provider: true,
            transactionId: true,
          },
        },
      },
    });

    return res.json({ bookings });
  } catch (error) {
    logger.error({ err: error }, 'List my bookings failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function cancelBooking(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params);

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.userId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        actorRole: req.user.role,
        action: 'booking.cancel',
        metadata: {
          bookingId: id,
        },
      },
    });

    return res.json({
      message: 'Booking cancelled',
      booking: updatedBooking,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid booking id', details: error.flatten() });
    }

    logger.error({ err: error }, 'Cancel booking failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateBooking(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const payload = updateBookingSchema.parse(req.body);

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const isOwner = booking.userId === req.user.userId;
    const isPrivileged = ['ADMIN', 'TEACHER'].includes(req.user.role);

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: payload.status ?? booking.status,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        actorRole: req.user.role,
        action: 'booking.update',
        metadata: {
          bookingId: id,
          status: updatedBooking.status,
        },
      },
    });

    return res.json({
      message: 'Booking updated',
      booking: updatedBooking,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Update booking failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
