import { prisma } from '../utils/database';
import { ChatMessageType } from '@prisma/client';
import { logger } from '../utils/logger';

// ============================================
// Types
// ============================================

export interface SendMessageInput {
  streamId: string;
  userId: string;
  message: string;
  type?: ChatMessageType;
  replyToId?: string;
}

export interface GetMessagesOptions {
  page?: number;
  limit?: number;
  since?: Date;
  before?: Date;
}

// ============================================
// Chat Operations
// ============================================

export async function sendMessage(input: SendMessageInput) {
  const { streamId, userId, message, type = 'MESSAGE', replyToId } = input;

  // Check if chat is enabled for this stream
  const stream = await prisma.live_streams.findUnique({
    where: { id: streamId },
    select: { chatEnabled: true, status: true },
  });

  if (!stream) {
    throw new Error('Stream not found');
  }

  if (!stream.chatEnabled) {
    throw new Error('Chat is disabled for this stream');
  }

  if (stream.status !== 'LIVE' && stream.status !== 'SCHEDULED') {
    throw new Error('Cannot send messages to this stream');
  }

  // Verify replyToId exists if provided
  if (replyToId) {
    const replyTo = await prisma.live_stream_chats.findUnique({
      where: { id: replyToId },
    });
    if (!replyTo || replyTo.streamId !== streamId) {
      throw new Error('Invalid reply message');
    }
  }

  const chatMessage = await prisma.live_stream_chats.create({
    data: {
      streamId,
      userId,
      message,
      type,
      replyToId,
    },
    include: {
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      live_stream_chats: {
        select: {
          id: true,
          message: true,
          users: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  logger.debug({ streamId, userId, type }, 'Chat message sent');
  return chatMessage;
}

export async function getMessages(
  streamId: string,
  options: GetMessagesOptions = {},
) {
  const { page = 1, limit = 50, since, before } = options;

  const where: any = {
    streamId,
    isDeleted: false,
  };

  if (since) {
    where.createdAt = { ...where.createdAt, gte: since };
  }

  if (before) {
    where.createdAt = { ...where.createdAt, lte: before };
  }

  const [items, total] = await Promise.all([
    prisma.live_stream_chats.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        live_stream_chats: {
          select: {
            id: true,
            message: true,
            users: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.live_stream_chats.count({ where }),
  ]);

  return {
    items: items.reverse(), // Return in chronological order
    total,
    page,
    limit,
    hasMore: total > page * limit,
  };
}

export async function deleteMessage(messageId: string, deletedBy: string) {
  const message = await prisma.live_stream_chats.findUnique({
    where: { id: messageId },
    include: {
      live_streams: {
        include: {
          instructor_profiles: true,
        },
      },
    },
  });

  if (!message) {
    throw new Error('Message not found');
  }

  // Check permission: message owner, host, or co-host can delete
  const isOwner = message.userId === deletedBy;
  const isHost = message.live_streams.instructor_profiles.userId === deletedBy;
  const isCoHost = message.live_streams.coHostIds.includes(deletedBy);

  if (!isOwner && !isHost && !isCoHost) {
    throw new Error('Not authorized to delete this message');
  }

  await prisma.live_stream_chats.update({
    where: { id: messageId },
    data: {
      isDeleted: true,
      deletedBy,
    },
  });

  logger.info({ messageId, deletedBy }, 'Chat message deleted');
  return { deleted: true };
}

export async function pinMessage(messageId: string, pinnedBy: string) {
  const message = await prisma.live_stream_chats.findUnique({
    where: { id: messageId },
    include: {
      live_streams: {
        include: {
          instructor_profiles: true,
        },
      },
    },
  });

  if (!message) {
    throw new Error('Message not found');
  }

  // Only host or co-host can pin
  const isHost = message.live_streams.instructor_profiles.userId === pinnedBy;
  const isCoHost = message.live_streams.coHostIds.includes(pinnedBy);

  if (!isHost && !isCoHost) {
    throw new Error('Not authorized to pin messages');
  }

  // Unpin any existing pinned messages (optional: allow multiple pins)
  await prisma.live_stream_chats.updateMany({
    where: { streamId: message.streamId, isPinned: true },
    data: { isPinned: false },
  });

  const updated = await prisma.live_stream_chats.update({
    where: { id: messageId },
    data: { isPinned: true },
    include: {
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  logger.info({ messageId, pinnedBy }, 'Chat message pinned');
  return updated;
}

export async function unpinMessage(messageId: string, unpinnedBy: string) {
  const message = await prisma.live_stream_chats.findUnique({
    where: { id: messageId },
    include: {
      live_streams: {
        include: {
          instructor_profiles: true,
        },
      },
    },
  });

  if (!message) {
    throw new Error('Message not found');
  }

  // Only host or co-host can unpin
  const isHost = message.live_streams.instructor_profiles.userId === unpinnedBy;
  const isCoHost = message.live_streams.coHostIds.includes(unpinnedBy);

  if (!isHost && !isCoHost) {
    throw new Error('Not authorized to unpin messages');
  }

  const updated = await prisma.live_stream_chats.update({
    where: { id: messageId },
    data: { isPinned: false },
  });

  logger.info({ messageId, unpinnedBy }, 'Chat message unpinned');
  return updated;
}

export async function getPinnedMessages(streamId: string) {
  return prisma.live_stream_chats.findMany({
    where: {
      streamId,
      isPinned: true,
      isDeleted: false,
    },
    include: {
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function sendSystemMessage(streamId: string, message: string) {
  // System messages use a null userId (or a special system user)
  // For now, we'll use the stream creator as the "system"
  const stream = await prisma.live_streams.findUnique({
    where: { id: streamId },
    include: { instructor_profiles: true },
  });

  if (!stream) {
    throw new Error('Stream not found');
  }

  return prisma.live_stream_chats.create({
    data: {
      streamId,
      userId: stream.instructor_profiles.userId,
      message,
      type: 'SYSTEM',
    },
  });
}

export async function sendAnnouncement(
  streamId: string,
  userId: string,
  message: string,
) {
  const stream = await prisma.live_streams.findUnique({
    where: { id: streamId },
    include: { instructor_profiles: true },
  });

  if (!stream) {
    throw new Error('Stream not found');
  }

  // Only host or co-host can send announcements
  const isHost = stream.instructor_profiles.userId === userId;
  const isCoHost = stream.coHostIds.includes(userId);

  if (!isHost && !isCoHost) {
    throw new Error('Not authorized to send announcements');
  }

  return prisma.live_stream_chats.create({
    data: {
      streamId,
      userId,
      message,
      type: 'ANNOUNCEMENT',
    },
    include: {
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

export async function askQuestion(streamId: string, userId: string, question: string) {
  return sendMessage({
    streamId,
    userId,
    message: question,
    type: 'QUESTION',
  });
}

export async function getQuestions(streamId: string) {
  return prisma.live_stream_chats.findMany({
    where: {
      streamId,
      type: 'QUESTION',
      isDeleted: false,
    },
    include: {
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function clearChat(streamId: string, clearedBy: string) {
  const stream = await prisma.live_streams.findUnique({
    where: { id: streamId },
    include: { instructor_profiles: true },
  });

  if (!stream) {
    throw new Error('Stream not found');
  }

  // Only host can clear chat
  if (stream.instructor_profiles.userId !== clearedBy) {
    throw new Error('Not authorized to clear chat');
  }

  await prisma.live_stream_chats.updateMany({
    where: { streamId },
    data: {
      isDeleted: true,
      deletedBy: clearedBy,
    },
  });

  logger.info({ streamId, clearedBy }, 'Chat cleared');
  return { cleared: true };
}

export async function getMessageCount(streamId: string) {
  return prisma.live_stream_chats.count({
    where: {
      streamId,
      isDeleted: false,
    },
  });
}
