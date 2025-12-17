import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import * as liveStreamService from '../services/liveStreamService';
import * as liveStreamChatService from '../services/liveStreamChatService';
import * as liveStreamSocketService from '../services/liveStreamSocketService';

// ============================================
// Stream Management
// ============================================

export async function getAllStreams(req: AuthRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const type = req.query.type as string;

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [items, total] = await Promise.all([
      prisma.liveStream.findMany({
        where,
        include: {
          instructor: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
          },
          _count: {
            select: {
              participants: true,
              registrations: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.liveStream.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    logger.error({ error }, 'Failed to get all streams');
    res.status(500).json({ success: false, error: 'Failed to get streams' });
  }
}

export async function getStreamDetails(req: AuthRequest, res: Response) {
  try {
    const streamId = req.params.id!;

    const stream = await prisma.liveStream.findUnique({
      where: { id: streamId },
      include: {
        instructor: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
        participants: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
        registrations: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
        recordings: true,
        _count: {
          select: {
            chatMessages: true,
            reactions: true,
          },
        },
      },
    });

    if (!stream) {
      return res.status(404).json({ success: false, error: 'Stream not found' });
    }

    res.json({ success: true, data: stream });
  } catch (error: any) {
    logger.error({ error }, 'Failed to get stream details');
    res.status(500).json({ success: false, error: 'Failed to get stream details' });
  }
}

export async function forceEndStream(req: AuthRequest, res: Response) {
  try {
    const adminId = req.user!.id;
    const streamId = req.params.id!;
    const { reason } = req.body;

    const stream = await prisma.liveStream.findUnique({
      where: { id: streamId },
    });

    if (!stream) {
      return res.status(404).json({ success: false, error: 'Stream not found' });
    }

    if (stream.status !== 'LIVE') {
      return res.status(400).json({ success: false, error: 'Stream is not live' });
    }

    // End the stream
    const now = new Date();
    await prisma.liveStreamParticipant.updateMany({
      where: { streamId, isActive: true },
      data: { isActive: false, leftAt: now },
    });

    const duration = stream.actualStartAt
      ? Math.round((now.getTime() - stream.actualStartAt.getTime()) / 60000)
      : 0;

    const updated = await prisma.liveStream.update({
      where: { id: streamId },
      data: {
        status: 'ENDED',
        actualEndAt: now,
        recordingDuration: duration,
        currentParticipants: 0,
      },
    });

    // Broadcast
    liveStreamSocketService.broadcastStreamStatusChange(streamId, 'ENDED');
    liveStreamSocketService.broadcastSystemMessage(
      streamId,
      'Stream has been ended by an administrator.',
    );

    logger.info({ adminId, streamId, reason }, 'Admin force ended stream');

    res.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error({ error }, 'Failed to force end stream');
    res.status(500).json({ success: false, error: 'Failed to end stream' });
  }
}

export async function moderateChat(req: AuthRequest, res: Response) {
  try {
    const adminId = req.user!.id;
    const streamId = req.params.id!;
    const messageId = req.params.messageId!;

    await liveStreamChatService.deleteMessage(messageId, adminId);

    // Broadcast
    liveStreamSocketService.broadcastMessageDeleted(streamId, messageId);

    logger.info({ adminId, streamId, messageId }, 'Admin deleted chat message');

    res.json({ success: true, message: 'Message deleted' });
  } catch (error: any) {
    logger.error({ error }, 'Failed to moderate chat');
    res.status(400).json({ success: false, error: error.message });
  }
}

// ============================================
// Analytics
// ============================================

export async function getStreamAnalytics(req: AuthRequest, res: Response) {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    const [
      totalStreams,
      liveStreams,
      totalViews,
      totalParticipants,
      avgDuration,
      topInstructors,
      streamsByType,
      streamsByLevel,
    ] = await Promise.all([
      // Total streams in period
      prisma.liveStream.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),

      // Currently live
      prisma.liveStream.count({
        where: { status: 'LIVE' },
      }),

      // Total views
      prisma.liveStream.aggregate({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { viewCount: true },
      }),

      // Total unique participants
      prisma.liveStreamParticipant.groupBy({
        by: ['userId'],
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }).then(r => r.length),

      // Average duration
      prisma.liveStream.aggregate({
        where: {
          status: 'ENDED',
          recordingDuration: { not: null },
          createdAt: { gte: startDate, lte: endDate },
        },
        _avg: { recordingDuration: true },
      }),

      // Top instructors
      prisma.liveStream.groupBy({
        by: ['instructorId'],
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: { id: true },
        _sum: { viewCount: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      // Streams by type
      prisma.liveStream.groupBy({
        by: ['type'],
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: { id: true },
      }),

      // Streams by level
      prisma.liveStream.groupBy({
        by: ['level'],
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: { id: true },
      }),
    ]);

    // Get instructor details for top instructors
    const instructorIds = topInstructors.map(i => i.instructorId);
    const instructors = await prisma.instructorProfile.findMany({
      where: { id: { in: instructorIds } },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    const instructorMap = new Map(instructors.map(i => [i.id, i]));
    const topInstructorsWithDetails = topInstructors.map(i => ({
      ...i,
      instructor: instructorMap.get(i.instructorId),
    }));

    res.json({
      success: true,
      data: {
        overview: {
          totalStreams,
          liveStreams,
          totalViews: totalViews._sum.viewCount || 0,
          totalParticipants,
          avgDuration: avgDuration._avg.recordingDuration || 0,
        },
        topInstructors: topInstructorsWithDetails,
        streamsByType: streamsByType.reduce((acc, s) => {
          acc[s.type] = s._count.id;
          return acc;
        }, {} as Record<string, number>),
        streamsByLevel: streamsByLevel.reduce((acc, s) => {
          acc[s.level] = s._count.id;
          return acc;
        }, {} as Record<string, number>),
        period: { startDate, endDate },
      },
    });
  } catch (error: any) {
    logger.error({ error }, 'Failed to get stream analytics');
    res.status(500).json({ success: false, error: 'Failed to get analytics' });
  }
}

export async function getDailyStreamStats(req: AuthRequest, res: Response) {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const streams = await prisma.liveStream.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        viewCount: true,
        status: true,
      },
    });

    // Group by date
    const dailyStats: Record<string, { streams: number; views: number }> = {};

    for (const stream of streams) {
      const date = stream.createdAt.toISOString().split('T')[0];
      if (date) {
        if (!dailyStats[date]) {
          dailyStats[date] = { streams: 0, views: 0 };
        }
        dailyStats[date].streams++;
        dailyStats[date].views += stream.viewCount;
      }
    }

    // Fill in missing dates
    const result = [];
    for (let i = 0; i < days; i++) {
      const dateStr = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      if (dateStr) {
        result.unshift({
          date: dateStr,
          streams: dailyStats[dateStr]?.streams || 0,
          views: dailyStats[dateStr]?.views || 0,
        });
      }
    }

    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error({ error }, 'Failed to get daily stream stats');
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
}

// ============================================
// Settings
// ============================================

export async function updateStreamSettings(req: AuthRequest, res: Response) {
  try {
    const adminId = req.user!.id;
    const streamId = req.params.id!;
    const { chatEnabled, handRaiseEnabled, maxParticipants } = req.body;

    const stream = await prisma.liveStream.update({
      where: { id: streamId },
      data: {
        ...(chatEnabled !== undefined && { chatEnabled }),
        ...(handRaiseEnabled !== undefined && { handRaiseEnabled }),
        ...(maxParticipants !== undefined && { maxParticipants }),
      },
    });

    logger.info({ adminId, streamId }, 'Admin updated stream settings');

    res.json({ success: true, data: stream });
  } catch (error: any) {
    logger.error({ error }, 'Failed to update stream settings');
    res.status(400).json({ success: false, error: error.message });
  }
}

// ============================================
// Schedule Management
// ============================================

export async function getAllSchedules(req: AuthRequest, res: Response) {
  try {
    const schedules = await prisma.liveStreamSchedule.findMany({
      include: {
        instructor: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: schedules });
  } catch (error: any) {
    logger.error({ error }, 'Failed to get all schedules');
    res.status(500).json({ success: false, error: 'Failed to get schedules' });
  }
}

export async function toggleScheduleStatus(req: AuthRequest, res: Response) {
  try {
    const adminId = req.user!.id;
    const scheduleId = req.params.scheduleId!;

    const schedule = await prisma.liveStreamSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }

    const updated = await prisma.liveStreamSchedule.update({
      where: { id: scheduleId },
      data: { isActive: !schedule.isActive },
    });

    logger.info({ adminId, scheduleId, isActive: updated.isActive }, 'Admin toggled schedule status');

    res.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error({ error }, 'Failed to toggle schedule status');
    res.status(400).json({ success: false, error: error.message });
  }
}
