import { prisma } from '../utils/database';
import {
  LiveStreamStatus,
  LiveStreamType,
  ParticipantRole,
  ProgramLevel,
  SubscriptionTier,
  Prisma,
} from '@prisma/client';
import { logger } from '../utils/logger';
import * as agoraService from './agoraService';
import { config } from '../utils/config';

// ============================================
// Types
// ============================================

export interface CreateStreamInput {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  type: LiveStreamType;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  maxParticipants?: number;
  isRecorded?: boolean;
  requiresSubscription?: boolean;
  minimumTier?: SubscriptionTier;
  price?: number;
  tags?: string[];
  level?: ProgramLevel;
  equipment?: string[];
  chatEnabled?: boolean;
  handRaiseEnabled?: boolean;
}

export interface UpdateStreamInput {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  type?: LiveStreamType;
  scheduledStartAt?: Date;
  scheduledEndAt?: Date;
  maxParticipants?: number;
  isRecorded?: boolean;
  requiresSubscription?: boolean;
  minimumTier?: SubscriptionTier | null;
  price?: number | null;
  tags?: string[];
  level?: ProgramLevel;
  equipment?: string[];
  chatEnabled?: boolean;
  handRaiseEnabled?: boolean;
}

export interface StreamFilters {
  status?: LiveStreamStatus;
  type?: LiveStreamType;
  level?: ProgramLevel;
  instructorId?: string;
  requiresSubscription?: boolean;
  fromDate?: Date;
  toDate?: Date;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

// ============================================
// Stream CRUD
// ============================================

export async function createStream(instructorId: string, data: CreateStreamInput) {
  const channelName = agoraService.createChannelName(`${instructorId}_${Date.now()}`);

  const stream = await prisma.live_streams.create({
    data: {
      title: data.title,
      description: data.description,
      thumbnailUrl: data.thumbnailUrl,
      instructorId,
      type: data.type,
      scheduledStartAt: data.scheduledStartAt,
      scheduledEndAt: data.scheduledEndAt,
      maxParticipants: data.maxParticipants ?? 100,
      isRecorded: data.isRecorded ?? true,
      requiresSubscription: data.requiresSubscription ?? true,
      minimumTier: data.minimumTier,
      price: data.price,
      tags: data.tags ?? [],
      level: data.level ?? ProgramLevel.BEGINNER,
      equipment: data.equipment ?? [],
      chatEnabled: data.chatEnabled ?? true,
      handRaiseEnabled: data.handRaiseEnabled ?? true,
      agoraChannelName: channelName,
    },
    include: {
      instructor_profiles: {
        include: {
          users: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      },
    },
  });

  logger.info({ streamId: stream.id, instructorId }, 'Created live stream');
  return stream;
}

export async function updateStream(
  streamId: string,
  instructorId: string,
  data: UpdateStreamInput,
) {
  const stream = await prisma.live_streams.findFirst({
    where: { id: streamId, instructorId },
  });

  if (!stream) {
    throw new Error('Stream not found or not authorized');
  }

  if (stream.status === LiveStreamStatus.LIVE) {
    throw new Error('Cannot update a live stream');
  }

  const updated = await prisma.live_streams.update({
    where: { id: streamId },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.thumbnailUrl !== undefined && { thumbnailUrl: data.thumbnailUrl }),
      ...(data.type && { type: data.type }),
      ...(data.scheduledStartAt && { scheduledStartAt: data.scheduledStartAt }),
      ...(data.scheduledEndAt && { scheduledEndAt: data.scheduledEndAt }),
      ...(data.maxParticipants !== undefined && { maxParticipants: data.maxParticipants }),
      ...(data.isRecorded !== undefined && { isRecorded: data.isRecorded }),
      ...(data.requiresSubscription !== undefined && { requiresSubscription: data.requiresSubscription }),
      ...(data.minimumTier !== undefined && { minimumTier: data.minimumTier }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.tags && { tags: data.tags }),
      ...(data.level && { level: data.level }),
      ...(data.equipment && { equipment: data.equipment }),
      ...(data.chatEnabled !== undefined && { chatEnabled: data.chatEnabled }),
      ...(data.handRaiseEnabled !== undefined && { handRaiseEnabled: data.handRaiseEnabled }),
    },
    include: {
      instructor_profiles: {
        include: {
          users: {
            select: { firstName: true, lastName: true },
          },
        },
      },
    },
  });

  logger.info({ streamId, instructorId }, 'Updated live stream');
  return updated;
}

export async function deleteStream(streamId: string, instructorId: string) {
  const stream = await prisma.live_streams.findFirst({
    where: { id: streamId, instructorId },
  });

  if (!stream) {
    throw new Error('Stream not found or not authorized');
  }

  if (stream.status === LiveStreamStatus.LIVE) {
    throw new Error('Cannot delete a live stream');
  }

  await prisma.live_streams.delete({ where: { id: streamId } });
  logger.info({ streamId, instructorId }, 'Deleted live stream');
}

export async function getStreamById(streamId: string) {
  return prisma.live_streams.findUnique({
    where: { id: streamId },
    include: {
      instructor_profiles: {
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          live_stream_participants: { where: { isActive: true } },
          live_stream_registrations: true,
          live_stream_chats: true,
        },
      },
    },
  });
}

export async function getUpcomingStreams(
  filters: StreamFilters = {},
  pagination: PaginationOptions = { page: 1, limit: 20 },
) {
  const where: Prisma.live_streamsWhereInput = {
    status: { in: [LiveStreamStatus.SCHEDULED, LiveStreamStatus.LIVE] },
    scheduledStartAt: { gte: filters.fromDate ?? new Date() },
    ...(filters.toDate && { scheduledStartAt: { lte: filters.toDate } }),
    ...(filters.type && { type: filters.type }),
    ...(filters.level && { level: filters.level }),
    ...(filters.instructorId && { instructorId: filters.instructorId }),
    ...(filters.requiresSubscription !== undefined && {
      requiresSubscription: filters.requiresSubscription,
    }),
  };

  const [items, total] = await Promise.all([
    prisma.live_streams.findMany({
      where,
      include: {
        instructor_profiles: {
          include: {
            users: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        _count: {
          select: { live_stream_registrations: true },
        },
      },
      orderBy: { scheduledStartAt: 'asc' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    }),
    prisma.live_streams.count({ where }),
  ]);

  return {
    items,
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.ceil(total / pagination.limit),
  };
}

export async function getLiveStreams() {
  return prisma.live_streams.findMany({
    where: { status: LiveStreamStatus.LIVE },
    include: {
      instructor_profiles: {
        include: {
          users: {
            select: { firstName: true, lastName: true },
          },
        },
      },
      _count: {
        select: {
          live_stream_participants: { where: { isActive: true } },
        },
      },
    },
    orderBy: { actualStartAt: 'desc' },
  });
}

export async function getStreamsByInstructor(
  instructorId: string,
  pagination: PaginationOptions = { page: 1, limit: 20 },
) {
  const where: Prisma.live_streamsWhereInput = { instructorId };

  const [items, total] = await Promise.all([
    prisma.live_streams.findMany({
      where,
      include: {
        _count: {
          select: {
            live_stream_participants: true,
            live_stream_registrations: true,
          },
        },
      },
      orderBy: { scheduledStartAt: 'desc' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    }),
    prisma.live_streams.count({ where }),
  ]);

  return {
    items,
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.ceil(total / pagination.limit),
  };
}

export async function searchStreams(
  query: string,
  filters: StreamFilters = {},
  pagination: PaginationOptions = { page: 1, limit: 20 },
) {
  const where: Prisma.live_streamsWhereInput = {
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { tags: { has: query.toLowerCase() } },
    ],
    ...(filters.status && { status: filters.status }),
    ...(filters.type && { type: filters.type }),
    ...(filters.level && { level: filters.level }),
  };

  const [items, total] = await Promise.all([
    prisma.live_streams.findMany({
      where,
      include: {
        instructor_profiles: {
          include: {
            users: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { scheduledStartAt: 'desc' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    }),
    prisma.live_streams.count({ where }),
  ]);

  return {
    items,
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.ceil(total / pagination.limit),
  };
}

// ============================================
// Stream Lifecycle
// ============================================

export async function startStream(streamId: string, instructorId: string) {
  const stream = await prisma.live_streams.findFirst({
    where: { id: streamId, instructorId },
  });

  if (!stream) {
    throw new Error('Stream not found or not authorized');
  }

  if (stream.status !== LiveStreamStatus.SCHEDULED) {
    throw new Error('Stream cannot be started');
  }

  let resourceId: string | null = null;

  // Start recording if enabled
  if (stream.isRecorded) {
    resourceId = await agoraService.acquireRecordingResource(stream.agoraChannelName);
    if (resourceId) {
      const recordingResult = await agoraService.startRecording(
        stream.agoraChannelName,
        resourceId,
      );
      if (recordingResult) {
        logger.info({ streamId, sid: recordingResult.sid }, 'Started recording');
      }
    }
  }

  const updated = await prisma.live_streams.update({
    where: { id: streamId },
    data: {
      status: LiveStreamStatus.LIVE,
      actualStartAt: new Date(),
      ...(resourceId && { agoraResourceId: resourceId }),
    },
    include: {
      instructor_profiles: {
        include: {
          users: {
            select: { firstName: true, lastName: true },
          },
        },
      },
    },
  });

  logger.info({ streamId, instructorId }, 'Started live stream');
  return updated;
}

export async function endStream(streamId: string, instructorId: string) {
  const stream = await prisma.live_streams.findFirst({
    where: { id: streamId, instructorId },
  });

  if (!stream) {
    throw new Error('Stream not found or not authorized');
  }

  if (stream.status !== LiveStreamStatus.LIVE) {
    throw new Error('Stream is not live');
  }

  // End recording if it was started
  if (stream.isRecorded && stream.agoraResourceId) {
    // Note: We'd need to store the recording SID to properly stop it
    // For now, recordings auto-stop when all hosts leave
    logger.info({ streamId }, 'Recording will auto-stop when channel is empty');
  }

  // Mark all active participants as left
  const now = new Date();
  await prisma.live_stream_participants.updateMany({
    where: { streamId, isActive: true },
    data: {
      isActive: false,
      leftAt: now,
    },
  });

  // Calculate duration
  const duration = stream.actualStartAt
    ? Math.round((now.getTime() - stream.actualStartAt.getTime()) / 60000) // minutes
    : 0;

  const updated = await prisma.live_streams.update({
    where: { id: streamId },
    data: {
      status: LiveStreamStatus.ENDED,
      actualEndAt: now,
      recordingDuration: duration,
      currentParticipants: 0,
    },
  });

  logger.info({ streamId, instructorId, duration }, 'Ended live stream');
  return updated;
}

export async function cancelStream(streamId: string, instructorId: string, reason?: string) {
  const stream = await prisma.live_streams.findFirst({
    where: { id: streamId, instructorId },
  });

  if (!stream) {
    throw new Error('Stream not found or not authorized');
  }

  if (stream.status === LiveStreamStatus.ENDED) {
    throw new Error('Stream has already ended');
  }

  const updated = await prisma.live_streams.update({
    where: { id: streamId },
    data: {
      status: LiveStreamStatus.CANCELLED,
      actualEndAt: new Date(),
    },
  });

  // TODO: Notify registered users about cancellation

  logger.info({ streamId, instructorId, reason }, 'Cancelled live stream');
  return updated;
}

export async function getStreamToken(streamId: string, userId: string) {
  const stream = await prisma.live_streams.findUnique({
    where: { id: streamId },
    include: {
      instructor_profiles: true,
    },
  });

  if (!stream) {
    throw new Error('Stream not found');
  }

  // Check access
  const hasAccess = await checkStreamAccess(streamId, userId);
  if (!hasAccess) {
    throw new Error('You do not have access to this stream');
  }

  // Determine role
  const isHost = stream.instructor_profiles.userId === userId;
  const isCoHost = stream.coHostIds.includes(userId);
  const role = isHost || isCoHost ? agoraService.RtcRole.PUBLISHER : agoraService.RtcRole.SUBSCRIBER;

  // Generate unique UID for this user
  const agoraUid = agoraService.generateUniqueUid();

  const rtcToken = agoraService.generateRtcToken(
    stream.agoraChannelName,
    agoraUid,
    role,
    3600, // 1 hour validity
  );

  const rtmToken = agoraService.generateRtmToken(userId, 3600);

  return {
    channelName: stream.agoraChannelName,
    rtcToken,
    rtmToken,
    uid: agoraUid,
    role: isHost ? 'HOST' : isCoHost ? 'CO_HOST' : 'PARTICIPANT',
    appId: agoraService.getAgoraAppId(),
  };
}

// ============================================
// Stream Registration
// ============================================

export async function registerForStream(streamId: string, userId: string, paymentId?: string) {
  const stream = await prisma.live_streams.findUnique({
    where: { id: streamId },
  });

  if (!stream) {
    throw new Error('Stream not found');
  }

  if (stream.status !== LiveStreamStatus.SCHEDULED) {
    throw new Error('Cannot register for this stream');
  }

  // Check if paid stream requires payment
  if (stream.price && !paymentId) {
    throw new Error('Payment required for this stream');
  }

  const registration = await prisma.live_stream_registrations.upsert({
    where: {
      streamId_userId: { streamId, userId },
    },
    create: {
      streamId,
      userId,
      paymentId,
    },
    update: {
      paymentId,
    },
    include: {
      live_streams: {
        select: { title: true, scheduledStartAt: true },
      },
    },
  });

  logger.info({ streamId, userId }, 'User registered for stream');
  return registration;
}

export async function unregisterFromStream(streamId: string, userId: string) {
  const registration = await prisma.live_stream_registrations.findUnique({
    where: {
      streamId_userId: { streamId, userId },
    },
  });

  if (!registration) {
    throw new Error('Registration not found');
  }

  await prisma.live_stream_registrations.delete({
    where: { id: registration.id },
  });

  logger.info({ streamId, userId }, 'User unregistered from stream');
}

export async function getRegistrations(
  streamId: string,
  pagination: PaginationOptions = { page: 1, limit: 50 },
) {
  const where = { streamId };

  const [items, total] = await Promise.all([
    prisma.live_stream_registrations.findMany({
      where,
      include: {
        users: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { registeredAt: 'desc' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    }),
    prisma.live_stream_registrations.count({ where }),
  ]);

  return {
    items,
    total,
    page: pagination.page,
    limit: pagination.limit,
  };
}

export async function checkRegistration(streamId: string, userId: string) {
  const registration = await prisma.live_stream_registrations.findUnique({
    where: {
      streamId_userId: { streamId, userId },
    },
  });

  return { registered: !!registration, registration };
}

export async function sendReminders(streamId: string) {
  const registrations = await prisma.live_stream_registrations.findMany({
    where: {
      streamId,
      reminderSent: false,
    },
    include: {
      users: {
        select: { id: true, email: true, firstName: true },
      },
      live_streams: {
        select: { title: true, scheduledStartAt: true },
      },
    },
  });

  // TODO: Send actual notifications
  const remindersSent = registrations.length;

  await prisma.live_stream_registrations.updateMany({
    where: {
      streamId,
      reminderSent: false,
    },
    data: { reminderSent: true },
  });

  logger.info({ streamId, remindersSent }, 'Sent stream reminders');
  return { remindersSent };
}

// ============================================
// Participant Management
// ============================================

export async function joinStream(streamId: string, userId: string, agoraUid: number) {
  const stream = await prisma.live_streams.findUnique({
    where: { id: streamId },
    include: { instructor_profiles: true },
  });

  if (!stream) {
    throw new Error('Stream not found');
  }

  if (stream.status !== LiveStreamStatus.LIVE) {
    throw new Error('Stream is not live');
  }

  if (stream.currentParticipants >= stream.maxParticipants) {
    throw new Error('Stream is full');
  }

  // Determine role
  const isHost = stream.instructor_profiles.userId === userId;
  const isCoHost = stream.coHostIds.includes(userId);
  const role = isHost
    ? ParticipantRole.HOST
    : isCoHost
      ? ParticipantRole.CO_HOST
      : ParticipantRole.PARTICIPANT;

  const participant = await prisma.live_stream_participants.upsert({
    where: {
      streamId_userId: { streamId, userId },
    },
    create: {
      streamId,
      userId,
      role,
      agoraUid,
      isActive: true,
    },
    update: {
      isActive: true,
      joinedAt: new Date(),
      leftAt: null,
      agoraUid,
    },
    include: {
      users: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  // Increment participant count
  await prisma.live_streams.update({
    where: { id: streamId },
    data: { currentParticipants: { increment: 1 } },
  });

  // Mark registration as attended
  await prisma.live_stream_registrations.updateMany({
    where: { streamId, userId },
    data: { attended: true },
  });

  logger.info({ streamId, userId, role }, 'User joined stream');
  return participant;
}

export async function leaveStream(streamId: string, userId: string) {
  const participant = await prisma.live_stream_participants.findUnique({
    where: {
      streamId_userId: { streamId, userId },
    },
  });

  if (!participant || !participant.isActive) {
    throw new Error('Participant not found or already left');
  }

  const now = new Date();
  const watchDuration = Math.round(
    (now.getTime() - participant.joinedAt.getTime()) / 1000,
  );

  await prisma.live_stream_participants.update({
    where: { id: participant.id },
    data: {
      isActive: false,
      leftAt: now,
      watchDuration: participant.watchDuration + watchDuration,
      handRaised: false,
      handRaisedAt: null,
    },
  });

  // Decrement participant count
  await prisma.live_streams.update({
    where: { id: streamId },
    data: {
      currentParticipants: { decrement: 1 },
      viewCount: { increment: 1 },
    },
  });

  logger.info({ streamId, userId, watchDuration }, 'User left stream');
}

export async function getParticipants(streamId: string) {
  return prisma.live_stream_participants.findMany({
    where: { streamId, isActive: true },
    include: {
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: [
      { role: 'asc' },
      { joinedAt: 'asc' },
    ],
  });
}

export async function getParticipantCount(streamId: string) {
  return prisma.live_stream_participants.count({
    where: { streamId, isActive: true },
  });
}

export async function raiseHand(streamId: string, userId: string) {
  const participant = await prisma.live_stream_participants.findUnique({
    where: {
      streamId_userId: { streamId, userId },
    },
  });

  if (!participant || !participant.isActive) {
    throw new Error('Participant not found');
  }

  // Check if stream allows hand raising
  const stream = await prisma.live_streams.findUnique({
    where: { id: streamId },
    select: { handRaiseEnabled: true },
  });

  if (!stream?.handRaiseEnabled) {
    throw new Error('Hand raising is disabled for this stream');
  }

  await prisma.live_stream_participants.update({
    where: { id: participant.id },
    data: {
      handRaised: true,
      handRaisedAt: new Date(),
    },
  });

  logger.info({ streamId, userId }, 'User raised hand');
}

export async function lowerHand(streamId: string, userId: string) {
  const participant = await prisma.live_stream_participants.findUnique({
    where: {
      streamId_userId: { streamId, userId },
    },
  });

  if (!participant) {
    throw new Error('Participant not found');
  }

  await prisma.live_stream_participants.update({
    where: { id: participant.id },
    data: {
      handRaised: false,
      handRaisedAt: null,
    },
  });

  logger.info({ streamId, userId }, 'User lowered hand');
}

export async function promoteToCoHost(
  streamId: string,
  userId: string,
  hostId: string,
) {
  const stream = await prisma.live_streams.findUnique({
    where: { id: streamId },
    include: { instructor_profiles: true },
  });

  if (!stream || stream.instructor_profiles.userId !== hostId) {
    throw new Error('Only the host can promote users');
  }

  if (stream.coHostIds.length >= 3) {
    throw new Error('Maximum co-hosts reached');
  }

  await prisma.$transaction([
    prisma.live_streams.update({
      where: { id: streamId },
      data: {
        coHostIds: { push: userId },
      },
    }),
    prisma.live_stream_participants.updateMany({
      where: { streamId, userId },
      data: { role: ParticipantRole.CO_HOST },
    }),
  ]);

  logger.info({ streamId, userId, hostId }, 'Promoted user to co-host');
}

export async function demoteFromCoHost(
  streamId: string,
  userId: string,
  hostId: string,
) {
  const stream = await prisma.live_streams.findUnique({
    where: { id: streamId },
    include: { instructor_profiles: true },
  });

  if (!stream || stream.instructor_profiles.userId !== hostId) {
    throw new Error('Only the host can demote users');
  }

  const newCoHostIds = stream.coHostIds.filter(id => id !== userId);

  await prisma.$transaction([
    prisma.live_streams.update({
      where: { id: streamId },
      data: { coHostIds: newCoHostIds },
    }),
    prisma.live_stream_participants.updateMany({
      where: { streamId, userId },
      data: { role: ParticipantRole.PARTICIPANT },
    }),
  ]);

  logger.info({ streamId, userId, hostId }, 'Demoted user from co-host');
}

// ============================================
// Recording
// ============================================

export async function enableRecording(streamId: string) {
  return prisma.live_streams.update({
    where: { id: streamId },
    data: { isRecorded: true },
  });
}

export async function disableRecording(streamId: string) {
  return prisma.live_streams.update({
    where: { id: streamId },
    data: { isRecorded: false },
  });
}

export async function getRecording(streamId: string) {
  return prisma.live_stream_recordings.findFirst({
    where: {
      streamId,
      status: 'READY',
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function processRecordingComplete(
  streamId: string,
  recordingData: {
    url: string;
    duration: number;
    size: bigint;
    format: string;
  },
) {
  const recording = await prisma.live_stream_recordings.create({
    data: {
      streamId,
      url: recordingData.url,
      duration: recordingData.duration,
      size: recordingData.size,
      format: recordingData.format,
      status: 'READY',
      processedAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    },
  });

  // Update stream with recording URL
  await prisma.live_streams.update({
    where: { id: streamId },
    data: { recordingUrl: recordingData.url },
  });

  logger.info({ streamId, recordingId: recording.id }, 'Recording processed');
  return recording;
}

// ============================================
// Reactions
// ============================================

export async function addReaction(
  streamId: string,
  userId: string,
  type: 'LIKE' | 'HEART' | 'CLAP' | 'NAMASTE' | 'FIRE',
) {
  const reaction = await prisma.live_stream_reactions.create({
    data: {
      streamId,
      userId,
      type,
    },
  });

  // Increment like count if it's a LIKE
  if (type === 'LIKE') {
    await prisma.live_streams.update({
      where: { id: streamId },
      data: { likeCount: { increment: 1 } },
    });
  }

  return reaction;
}

export async function getReactionCounts(streamId: string) {
  const reactions = await prisma.live_stream_reactions.groupBy({
    by: ['type'],
    where: { streamId },
    _count: { type: true },
  });

  return reactions.reduce((acc, r) => {
    acc[r.type] = r._count.type;
    return acc;
  }, {} as Record<string, number>);
}

// ============================================
// Access Control
// ============================================

export async function checkStreamAccess(streamId: string, userId: string): Promise<boolean> {
  const stream = await prisma.live_streams.findUnique({
    where: { id: streamId },
    include: { instructor_profiles: true },
  });

  if (!stream) {
    return false;
  }

  // Instructor always has access
  if (stream.instructor_profiles.userId === userId) {
    return true;
  }

  // Co-hosts have access
  if (stream.coHostIds.includes(userId)) {
    return true;
  }

  // Free streams are accessible to all
  if (!stream.requiresSubscription && !stream.price) {
    return true;
  }

  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true },
  });

  if (!user) {
    return false;
  }

  // Check paid stream
  if (stream.price) {
    const registration = await prisma.live_stream_registrations.findUnique({
      where: { streamId_userId: { streamId, userId } },
    });
    return !!registration?.paymentId;
  }

  // Check subscription tier
  if (stream.minimumTier) {
    const tierOrder: Record<SubscriptionTier, number> = {
      FREE: 0,
      MEDITATION: 1,
      YOGA: 2,
      PREMIUM: 3,
      FAMILY: 4,
      ENTERPRISE: 5,
    };
    return tierOrder[user.subscriptionTier] >= tierOrder[stream.minimumTier];
  }

  // Subscription required, any tier works
  if (stream.requiresSubscription) {
    return user.subscriptionTier !== SubscriptionTier.FREE;
  }

  return true;
}
