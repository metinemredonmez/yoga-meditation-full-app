import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as liveStreamService from '../services/liveStreamService';
import * as liveStreamChatService from '../services/liveStreamChatService';
import * as liveStreamScheduleService from '../services/liveStreamScheduleService';
import * as liveStreamSocketService from '../services/liveStreamSocketService';
import { logger } from '../utils/logger';
import { prisma } from '../utils/database';

// ============================================
// Stream CRUD
// ============================================

export async function createStream(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    // Get instructor profile
    const instructor = await prisma.instructor_profiles.findUnique({
      where: { userId },
    });

    if (!instructor) {
      return res.status(403).json({
        success: false,
        error: 'Only instructors can create live streams',
      });
    }

    if (instructor.status !== 'APPROVED') {
      return res.status(403).json({
        success: false,
        error: 'Instructor must be approved to create live streams',
      });
    }

    const stream = await liveStreamService.createStream(instructor.id, req.body);
    res.status(201).json({ success: true, data: stream });
  } catch (error: any) {
    logger.error({ error }, 'Failed to create stream');
    res.status(400).json({ success: false, error: error.message });
  }
}

export async function updateStream(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const streamId = req.params.id!;

    const instructor = await prisma.instructor_profiles.findUnique({
      where: { userId },
    });

    if (!instructor) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const stream = await liveStreamService.updateStream(streamId, instructor.id, req.body);
    res.json({ success: true, data: stream });
  } catch (error: any) {
    logger.error({ error }, 'Failed to update stream');
    res.status(400).json({ success: false, error: error.message });
  }
}

export async function deleteStream(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const streamId = req.params.id!;

    const instructor = await prisma.instructor_profiles.findUnique({
      where: { userId },
    });

    if (!instructor) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    await liveStreamService.deleteStream(streamId, instructor.id);
    res.json({ success: true, message: 'Stream deleted' });
  } catch (error: any) {
    logger.error({ error }, 'Failed to delete stream');
    res.status(400).json({ success: false, error: error.message });
  }
}

export async function getStream(req: AuthRequest, res: Response) {
  try {
    const streamId = req.params.id!;
    const stream = await liveStreamService.getStreamById(streamId);

    if (!stream) {
      return res.status(404).json({ success: false, error: 'Stream not found' });
    }

    res.json({ success: true, data: stream });
  } catch (error: any) {
    logger.error({ error }, 'Failed to get stream');
    res.status(500).json({ success: false, error: 'Failed to get stream' });
  }
}

export async function getUpcomingStreams(req: AuthRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string;
    const level = req.query.level as string;

    const streams = await liveStreamService.getUpcomingStreams(
      {
        type: type as any,
        level: level as any,
      },
      { page, limit },
    );

    res.json({ success: true, data: streams });
  } catch (error: any) {
    logger.error({ error }, 'Failed to get upcoming streams');
    res.status(500).json({ success: false, error: 'Failed to get upcoming streams' });
  }
}

export async function getLiveStreams(req: AuthRequest, res: Response) {
  try {
    const streams = await liveStreamService.getLiveStreams();
    res.json({ success: true, data: streams });
  } catch (error: any) {
    logger.error({ error }, 'Failed to get live streams');
    res.status(500).json({ success: false, error: 'Failed to get live streams' });
  }
}

export async function searchStreams(req: AuthRequest, res: Response) {
  try {
    const query = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters',
      });
    }

    const streams = await liveStreamService.searchStreams(query, {}, { page, limit });
    res.json({ success: true, data: streams });
  } catch (error: any) {
    logger.error({ error }, 'Failed to search streams');
    res.status(500).json({ success: false, error: 'Failed to search streams' });
  }
}

// ============================================
// Stream Lifecycle
// ============================================

export async function startStream(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const streamId = req.params.id!;

    const instructor = await prisma.instructor_profiles.findUnique({
      where: { userId },
    });

    if (!instructor) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const stream = await liveStreamService.startStream(streamId, instructor.id);

    // Broadcast status change
    liveStreamSocketService.broadcastStreamStatusChange(streamId, 'LIVE');

    if (stream.isRecorded) {
      liveStreamSocketService.broadcastRecordingStarted(streamId);
    }

    res.json({ success: true, data: stream });
  } catch (error: any) {
    logger.error({ error }, 'Failed to start stream');
    res.status(400).json({ success: false, error: error.message });
  }
}

export async function endStream(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const streamId = req.params.id!;

    const instructor = await prisma.instructor_profiles.findUnique({
      where: { userId },
    });

    if (!instructor) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const stream = await liveStreamService.endStream(streamId, instructor.id);

    // Broadcast status change
    liveStreamSocketService.broadcastStreamStatusChange(streamId, 'ENDED');
    liveStreamSocketService.broadcastRecordingStopped(streamId);

    res.json({ success: true, data: stream });
  } catch (error: any) {
    logger.error({ error }, 'Failed to end stream');
    res.status(400).json({ success: false, error: error.message });
  }
}

export async function cancelStream(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const streamId = req.params.id!;
    const { reason } = req.body;

    const instructor = await prisma.instructor_profiles.findUnique({
      where: { userId },
    });

    if (!instructor) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const stream = await liveStreamService.cancelStream(streamId, instructor.id, reason);

    // Broadcast status change
    liveStreamSocketService.broadcastStreamStatusChange(streamId, 'CANCELLED');

    res.json({ success: true, data: stream });
  } catch (error: any) {
    logger.error({ error }, 'Failed to cancel stream');
    res.status(400).json({ success: false, error: error.message });
  }
}

export async function getStreamToken(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const streamId = req.params.id!;

    const tokenData = await liveStreamService.getStreamToken(streamId, userId);
    res.json({ success: true, data: tokenData });
  } catch (error: any) {
    logger.error({ error }, 'Failed to get stream token');
    res.status(400).json({ success: false, error: error.message });
  }
}

// ============================================
// Participant Management
// ============================================

export async function joinStream(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const streamId = req.params.id!;
    const { agoraUid } = req.body;

    const participant = await liveStreamService.joinStream(streamId, userId, agoraUid);
    res.json({ success: true, data: participant });
  } catch (error: any) {
    logger.error({ error }, 'Failed to join stream');
    res.status(400).json({ success: false, error: error.message });
  }
}

export async function leaveStream(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const streamId = req.params.id!;

    await liveStreamService.leaveStream(streamId, userId);
    res.json({ success: true, message: 'Left stream' });
  } catch (error: any) {
    logger.error({ error }, 'Failed to leave stream');
    res.status(400).json({ success: false, error: error.message });
  }
}

export async function getParticipants(req: AuthRequest, res: Response) {
  try {
    const streamId = req.params.id!;
    const participants = await liveStreamService.getParticipants(streamId);
    res.json({ success: true, data: participants });
  } catch (error: any) {
    logger.error({ error }, 'Failed to get participants');
    res.status(500).json({ success: false, error: 'Failed to get participants' });
  }
}

export async function raiseHand(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const streamId = req.params.id!;

    await liveStreamService.raiseHand(streamId, userId);
    res.json({ success: true, message: 'Hand raised' });
  } catch (error: any) {
    logger.error({ error }, 'Failed to raise hand');
    res.status(400).json({ success: false, error: error.message });
  }
}

export async function lowerHand(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const streamId = req.params.id!;

    await liveStreamService.lowerHand(streamId, userId);
    res.json({ success: true, message: 'Hand lowered' });
  } catch (error: any) {
    logger.error({ error }, 'Failed to lower hand');
    res.status(400).json({ success: false, error: error.message });
  }
}

// ============================================
// Registration
// ============================================

export async function registerForStream(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const streamId = req.params.id!;
    const { paymentId } = req.body;

    const registration = await liveStreamService.registerForStream(streamId, userId, paymentId);
    res.status(201).json({ success: true, data: registration });
  } catch (error: any) {
    logger.error({ error }, 'Failed to register for stream');
    res.status(400).json({ success: false, error: error.message });
  }
}

export async function unregisterFromStream(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const streamId = req.params.id!;

    await liveStreamService.unregisterFromStream(streamId, userId);
    res.json({ success: true, message: 'Unregistered from stream' });
  } catch (error: any) {
    logger.error({ error }, 'Failed to unregister from stream');
    res.status(400).json({ success: false, error: error.message });
  }
}

export async function getRegistrations(req: AuthRequest, res: Response) {
  try {
    const streamId = req.params.id!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const registrations = await liveStreamService.getRegistrations(streamId, { page, limit });
    res.json({ success: true, data: registrations });
  } catch (error: any) {
    logger.error({ error }, 'Failed to get registrations');
    res.status(500).json({ success: false, error: 'Failed to get registrations' });
  }
}

export async function checkRegistration(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const streamId = req.params.id!;

    const result = await liveStreamService.checkRegistration(streamId, userId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error({ error }, 'Failed to check registration');
    res.status(500).json({ success: false, error: 'Failed to check registration' });
  }
}

// ============================================
// Chat
// ============================================

export async function getChatMessages(req: AuthRequest, res: Response) {
  try {
    const streamId = req.params.id!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const since = req.query.since ? new Date(req.query.since as string) : undefined;

    const messages = await liveStreamChatService.getMessages(streamId, { page, limit, since });
    res.json({ success: true, data: messages });
  } catch (error: any) {
    logger.error({ error }, 'Failed to get chat messages');
    res.status(500).json({ success: false, error: 'Failed to get chat messages' });
  }
}

export async function sendChatMessage(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const streamId = req.params.id!;
    const { message, type, replyToId } = req.body;

    const chatMessage = await liveStreamChatService.sendMessage({
      streamId,
      userId,
      message,
      type,
      replyToId,
    });

    // Broadcast via socket
    liveStreamSocketService.broadcastChatMessage(streamId, chatMessage);

    res.status(201).json({ success: true, data: chatMessage });
  } catch (error: any) {
    logger.error({ error }, 'Failed to send chat message');
    res.status(400).json({ success: false, error: error.message });
  }
}

export async function deleteChatMessage(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const streamId = req.params.id!;
    const messageId = req.params.messageId!;

    await liveStreamChatService.deleteMessage(messageId, userId);

    // Broadcast via socket
    liveStreamSocketService.broadcastMessageDeleted(streamId, messageId);

    res.json({ success: true, message: 'Message deleted' });
  } catch (error: any) {
    logger.error({ error }, 'Failed to delete chat message');
    res.status(400).json({ success: false, error: error.message });
  }
}

export async function pinChatMessage(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const streamId = req.params.id!;
    const messageId = req.params.messageId!;

    const message = await liveStreamChatService.pinMessage(messageId, userId);

    // Broadcast via socket
    liveStreamSocketService.broadcastPinnedMessage(streamId, message);

    res.json({ success: true, data: message });
  } catch (error: any) {
    logger.error({ error }, 'Failed to pin message');
    res.status(400).json({ success: false, error: error.message });
  }
}

export async function getPinnedMessages(req: AuthRequest, res: Response) {
  try {
    const streamId = req.params.id!;
    const messages = await liveStreamChatService.getPinnedMessages(streamId);
    res.json({ success: true, data: messages });
  } catch (error: any) {
    logger.error({ error }, 'Failed to get pinned messages');
    res.status(500).json({ success: false, error: 'Failed to get pinned messages' });
  }
}

// ============================================
// Reactions
// ============================================

export async function addReaction(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const streamId = req.params.id!;
    const { type } = req.body;

    const reaction = await liveStreamService.addReaction(streamId, userId, type);
    res.status(201).json({ success: true, data: reaction });
  } catch (error: any) {
    logger.error({ error }, 'Failed to add reaction');
    res.status(400).json({ success: false, error: error.message });
  }
}

export async function getReactionCounts(req: AuthRequest, res: Response) {
  try {
    const streamId = req.params.id!;
    const counts = await liveStreamService.getReactionCounts(streamId);
    res.json({ success: true, data: counts });
  } catch (error: any) {
    logger.error({ error }, 'Failed to get reaction counts');
    res.status(500).json({ success: false, error: 'Failed to get reaction counts' });
  }
}

// ============================================
// Recording
// ============================================

export async function getRecording(req: AuthRequest, res: Response) {
  try {
    const streamId = req.params.id!;
    const recording = await liveStreamService.getRecording(streamId);

    if (!recording) {
      return res.status(404).json({ success: false, error: 'Recording not found' });
    }

    res.json({ success: true, data: recording });
  } catch (error: any) {
    logger.error({ error }, 'Failed to get recording');
    res.status(500).json({ success: false, error: 'Failed to get recording' });
  }
}

// ============================================
// My Streams (Instructor)
// ============================================

export async function getMyStreams(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const instructor = await prisma.instructor_profiles.findUnique({
      where: { userId },
    });

    if (!instructor) {
      return res.status(403).json({ success: false, error: 'Not an instructor' });
    }

    const streams = await liveStreamService.getStreamsByInstructor(instructor.id, { page, limit });
    res.json({ success: true, data: streams });
  } catch (error: any) {
    logger.error({ error }, 'Failed to get my streams');
    res.status(500).json({ success: false, error: 'Failed to get my streams' });
  }
}

// ============================================
// Schedules
// ============================================

export async function createSchedule(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const instructor = await prisma.instructor_profiles.findUnique({
      where: { userId },
    });

    if (!instructor) {
      return res.status(403).json({ success: false, error: 'Not an instructor' });
    }

    const schedule = await liveStreamScheduleService.createSchedule(instructor.id, req.body);
    res.status(201).json({ success: true, data: schedule });
  } catch (error: any) {
    logger.error({ error }, 'Failed to create schedule');
    res.status(400).json({ success: false, error: error.message });
  }
}

export async function getMySchedules(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const instructor = await prisma.instructor_profiles.findUnique({
      where: { userId },
    });

    if (!instructor) {
      return res.status(403).json({ success: false, error: 'Not an instructor' });
    }

    const schedules = await liveStreamScheduleService.getInstructorSchedules(instructor.id);
    res.json({ success: true, data: schedules });
  } catch (error: any) {
    logger.error({ error }, 'Failed to get schedules');
    res.status(500).json({ success: false, error: 'Failed to get schedules' });
  }
}

export async function updateSchedule(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const scheduleId = req.params.scheduleId!;

    const instructor = await prisma.instructor_profiles.findUnique({
      where: { userId },
    });

    if (!instructor) {
      return res.status(403).json({ success: false, error: 'Not an instructor' });
    }

    const schedule = await liveStreamScheduleService.updateSchedule(
      scheduleId,
      instructor.id,
      req.body,
    );
    res.json({ success: true, data: schedule });
  } catch (error: any) {
    logger.error({ error }, 'Failed to update schedule');
    res.status(400).json({ success: false, error: error.message });
  }
}

export async function deleteSchedule(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const scheduleId = req.params.scheduleId!;

    const instructor = await prisma.instructor_profiles.findUnique({
      where: { userId },
    });

    if (!instructor) {
      return res.status(403).json({ success: false, error: 'Not an instructor' });
    }

    await liveStreamScheduleService.deleteSchedule(scheduleId, instructor.id);
    res.json({ success: true, message: 'Schedule deleted' });
  } catch (error: any) {
    logger.error({ error }, 'Failed to delete schedule');
    res.status(400).json({ success: false, error: error.message });
  }
}
