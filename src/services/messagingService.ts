import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import * as socialService from './socialService';

// ============================================
// Conversation Service
// ============================================

export async function getOrCreateConversation(userId1: string, userId2: string) {
  // Ensure consistent ordering of participants
  const sorted = [userId1, userId2].sort();
  const participant1Id = sorted[0]!;
  const participant2Id = sorted[1]!;

  let conversation = await prisma.conversation.findUnique({
    where: {
      participant1Id_participant2Id: { participant1Id, participant2Id },
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { participant1Id, participant2Id },
    });
  }

  return conversation;
}

export async function getConversations(
  userId: string,
  pagination: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where: {
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
      },
      include: {
        participant1: {
          select: { id: true, firstName: true, lastName: true },
        },
        participant2: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.conversation.count({
      where: {
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
      },
    }),
  ]);

  // Transform to show other participant
  const transformedConversations = conversations.map((conv) => {
    const otherParticipant =
      conv.participant1Id === userId ? conv.participant2 : conv.participant1;
    const unreadCount =
      conv.participant1Id === userId ? conv.unreadCount1 : conv.unreadCount2;

    return {
      id: conv.id,
      otherParticipant,
      lastMessage: conv.lastMessage,
      lastMessageAt: conv.lastMessageAt,
      unreadCount,
      createdAt: conv.createdAt,
    };
  });

  return {
    conversations: transformedConversations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getConversationById(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participant1: {
        select: { id: true, firstName: true, lastName: true },
      },
      participant2: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  if (!conversation) return null;

  // Check if user is a participant
  if (
    conversation.participant1Id !== userId &&
    conversation.participant2Id !== userId
  ) {
    return null;
  }

  const otherParticipant =
    conversation.participant1Id === userId
      ? conversation.participant2
      : conversation.participant1;

  return {
    id: conversation.id,
    otherParticipant,
    lastMessage: conversation.lastMessage,
    lastMessageAt: conversation.lastMessageAt,
    createdAt: conversation.createdAt,
  };
}

export async function deleteConversation(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) return false;

  // Check if user is a participant
  if (
    conversation.participant1Id !== userId &&
    conversation.participant2Id !== userId
  ) {
    return false;
  }

  // Delete all messages in the conversation
  await prisma.directMessage.deleteMany({
    where: {
      OR: [
        { senderId: conversation.participant1Id, receiverId: conversation.participant2Id },
        { senderId: conversation.participant2Id, receiverId: conversation.participant1Id },
      ],
    },
  });

  // Delete the conversation
  await prisma.conversation.delete({
    where: { id: conversationId },
  });

  logger.info({ conversationId, userId }, 'Conversation deleted');
  return true;
}

// ============================================
// Direct Message Service
// ============================================

export async function sendMessage(data: {
  senderId: string;
  receiverId: string;
  content: string;
}) {
  const { senderId, receiverId, content } = data;

  // Check if blocked
  const isBlocked = await socialService.isBlocked(senderId, receiverId);
  if (isBlocked) {
    return { sent: false, message: 'Cannot send message to this user' };
  }

  // Create or get conversation
  const conversation = await getOrCreateConversation(senderId, receiverId);

  // Create message
  const message = await prisma.directMessage.create({
    data: { senderId, receiverId, content },
    include: {
      sender: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  // Update conversation
  const isParticipant1 = conversation.participant1Id === senderId;
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessage: content.substring(0, 100),
      lastMessageAt: new Date(),
      [isParticipant1 ? 'unreadCount2' : 'unreadCount1']: {
        increment: 1,
      },
    },
  });

  logger.info({ messageId: message.id, senderId, receiverId }, 'Message sent');
  return { sent: true, message };
}

export async function getMessages(
  userId: string,
  otherUserId: string,
  pagination: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 50 } = pagination;
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
        isDeleted: false,
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.directMessage.count({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
        isDeleted: false,
      },
    }),
  ]);

  // Mark messages as read
  await markMessagesAsRead(userId, otherUserId);

  return {
    messages: messages.reverse(), // Return in chronological order
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getMessageById(messageId: string, userId: string) {
  const message = await prisma.directMessage.findUnique({
    where: { id: messageId },
    include: {
      sender: {
        select: { id: true, firstName: true, lastName: true },
      },
      receiver: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  if (!message) return null;

  // Check if user is sender or receiver
  if (message.senderId !== userId && message.receiverId !== userId) {
    return null;
  }

  return message;
}

export async function markMessagesAsRead(userId: string, otherUserId: string) {
  // Update messages
  await prisma.directMessage.updateMany({
    where: {
      senderId: otherUserId,
      receiverId: userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  // Update conversation unread count
  const [participant1Id, participant2Id] = [userId, otherUserId].sort();
  const isParticipant1 = participant1Id === userId;

  await prisma.conversation.updateMany({
    where: {
      participant1Id,
      participant2Id,
    },
    data: {
      [isParticipant1 ? 'unreadCount1' : 'unreadCount2']: 0,
    },
  });
}

export async function deleteMessage(messageId: string, userId: string) {
  const message = await prisma.directMessage.findUnique({
    where: { id: messageId },
  });

  if (!message) return false;

  // Only sender can delete
  if (message.senderId !== userId) {
    return false;
  }

  await prisma.directMessage.update({
    where: { id: messageId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  logger.info({ messageId, userId }, 'Message deleted');
  return true;
}

// ============================================
// Unread Counts
// ============================================

export async function getTotalUnreadCount(userId: string) {
  const result = await prisma.conversation.aggregate({
    where: {
      OR: [
        { participant1Id: userId },
        { participant2Id: userId },
      ],
    },
    _sum: {
      unreadCount1: true,
      unreadCount2: true,
    },
  });

  // Get count for this user specifically
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ participant1Id: userId }, { participant2Id: userId }],
    },
    select: {
      participant1Id: true,
      unreadCount1: true,
      unreadCount2: true,
    },
  });

  const totalUnread = conversations.reduce((sum, conv) => {
    return sum + (conv.participant1Id === userId ? conv.unreadCount1 : conv.unreadCount2);
  }, 0);

  return totalUnread;
}

export async function getUnreadCountPerConversation(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ participant1Id: userId }, { participant2Id: userId }],
    },
    select: {
      id: true,
      participant1Id: true,
      participant2Id: true,
      unreadCount1: true,
      unreadCount2: true,
    },
  });

  return conversations.map((conv) => ({
    conversationId: conv.id,
    otherUserId:
      conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id,
    unreadCount:
      conv.participant1Id === userId ? conv.unreadCount1 : conv.unreadCount2,
  }));
}

// ============================================
// Search Messages
// ============================================

export async function searchMessages(
  userId: string,
  query: string,
  pagination: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    prisma.directMessage.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
        content: { contains: query, mode: 'insensitive' },
        isDeleted: false,
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true },
        },
        receiver: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.directMessage.count({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
        content: { contains: query, mode: 'insensitive' },
        isDeleted: false,
      },
    }),
  ]);

  return {
    messages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
