import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { prisma } from '../utils/database';
import * as liveStreamService from './liveStreamService';
import * as liveStreamChatService from './liveStreamChatService';

// Helper to extract token from socket handshake (supports both HttpOnly cookie and auth header)
function extractTokenFromSocket(socket: Socket): string | null {
  // Try HttpOnly cookie first (from headers)
  const cookieHeader = socket.handshake.headers.cookie;
  if (cookieHeader) {
    const cookies = cookie.parse(cookieHeader);
    const cookieToken = cookies[config.cookie.accessTokenName];
    if (cookieToken) {
      return cookieToken;
    }
  }

  // Fallback to auth.token (for mobile apps)
  if (socket.handshake.auth?.token) {
    return socket.handshake.auth.token as string;
  }

  // Fallback to query.token (legacy)
  if (socket.handshake.query?.token) {
    return socket.handshake.query.token as string;
  }

  return null;
}

// ============================================
// Types
// ============================================

interface AuthenticatedSocket extends Socket {
  userId?: string;
  streamId?: string;
}

interface JoinStreamPayload {
  streamId: string;
  agoraUid: number;
}

interface ChatMessagePayload {
  streamId: string;
  message: string;
  type?: 'MESSAGE' | 'QUESTION' | 'ANNOUNCEMENT';
  replyToId?: string;
}

interface ReactionPayload {
  streamId: string;
  type: 'LIKE' | 'HEART' | 'CLAP' | 'NAMASTE' | 'FIRE';
}

interface HandRaisePayload {
  streamId: string;
}

interface HostActionPayload {
  streamId: string;
  targetUserId: string;
  action: 'mute' | 'unmute' | 'kick' | 'promote' | 'demote';
}

// ============================================
// Socket.IO Server
// ============================================

let io: SocketServer | null = null;

export function initializeSocketServer(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: config.CORS_ORIGINS || ['http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = extractTokenFromSocket(socket);

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET) as {
        userId: string;
        email: string;
      };

      socket.userId = decoded.userId;
      next();
    } catch (error) {
      logger.error({ error }, 'Socket authentication failed');
      next(new Error('Invalid token'));
    }
  });

  // Live stream namespace
  const liveStreamNs = io.of('/live-stream');

  liveStreamNs.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = extractTokenFromSocket(socket);

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET) as {
        userId: string;
        email: string;
      };

      socket.userId = decoded.userId;
      next();
    } catch (error) {
      logger.error({ error }, 'Socket authentication failed');
      next(new Error('Invalid token'));
    }
  });

  liveStreamNs.on('connection', (socket: AuthenticatedSocket) => {
    logger.info({ socketId: socket.id, userId: socket.userId }, 'Socket connected to live-stream namespace');

    // Join stream room
    socket.on('stream:join', async (payload: JoinStreamPayload) => {
      try {
        const { streamId, agoraUid } = payload;

        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        // Check access
        const hasAccess = await liveStreamService.checkStreamAccess(streamId, socket.userId);
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Join database and room
        const participant = await liveStreamService.joinStream(streamId, socket.userId, agoraUid);
        socket.join(`stream:${streamId}`);
        socket.streamId = streamId;

        // Get updated participant count
        const participantCount = await liveStreamService.getParticipantCount(streamId);

        // Notify room
        liveStreamNs.to(`stream:${streamId}`).emit('stream:participant_joined', {
          participant: {
            id: participant.id,
            userId: participant.userId,
            user: participant.user,
            role: participant.role,
          },
          participantCount,
        });

        socket.emit('stream:joined', {
          success: true,
          participant,
        });

        logger.info({ socketId: socket.id, streamId, userId: socket.userId }, 'User joined stream');
      } catch (error: any) {
        logger.error({ error, payload }, 'Failed to join stream');
        socket.emit('error', { message: error.message });
      }
    });

    // Leave stream room
    socket.on('stream:leave', async () => {
      try {
        if (!socket.userId || !socket.streamId) {
          return;
        }

        await liveStreamService.leaveStream(socket.streamId, socket.userId);
        socket.leave(`stream:${socket.streamId}`);

        const participantCount = await liveStreamService.getParticipantCount(socket.streamId);

        liveStreamNs.to(`stream:${socket.streamId}`).emit('stream:participant_left', {
          userId: socket.userId,
          participantCount,
        });

        socket.streamId = undefined;
        logger.info({ socketId: socket.id, userId: socket.userId }, 'User left stream');
      } catch (error: any) {
        logger.error({ error }, 'Failed to leave stream');
      }
    });

    // Chat message
    socket.on('stream:chat_message', async (payload: ChatMessagePayload) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const { streamId, message, type, replyToId } = payload;

        const chatMessage = await liveStreamChatService.sendMessage({
          streamId,
          userId: socket.userId,
          message,
          type: type as any,
          replyToId,
        });

        liveStreamNs.to(`stream:${streamId}`).emit('stream:chat_message', chatMessage);
      } catch (error: any) {
        logger.error({ error, payload }, 'Failed to send chat message');
        socket.emit('error', { message: error.message });
      }
    });

    // Reaction
    socket.on('stream:reaction', async (payload: ReactionPayload) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const { streamId, type } = payload;
        await liveStreamService.addReaction(streamId, socket.userId, type);

        liveStreamNs.to(`stream:${streamId}`).emit('stream:reaction', {
          userId: socket.userId,
          type,
        });
      } catch (error: any) {
        logger.error({ error, payload }, 'Failed to add reaction');
      }
    });

    // Hand raise
    socket.on('stream:hand_raise', async (payload: HandRaisePayload) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const { streamId } = payload;
        await liveStreamService.raiseHand(streamId, socket.userId);

        const user = await prisma.user.findUnique({
          where: { id: socket.userId },
          select: { firstName: true, lastName: true },
        });

        liveStreamNs.to(`stream:${streamId}`).emit('stream:hand_raised', {
          userId: socket.userId,
          user,
        });
      } catch (error: any) {
        logger.error({ error, payload }, 'Failed to raise hand');
        socket.emit('error', { message: error.message });
      }
    });

    // Hand lower
    socket.on('stream:hand_lower', async (payload: HandRaisePayload) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const { streamId } = payload;
        await liveStreamService.lowerHand(streamId, socket.userId);

        liveStreamNs.to(`stream:${streamId}`).emit('stream:hand_lowered', {
          userId: socket.userId,
        });
      } catch (error: any) {
        logger.error({ error, payload }, 'Failed to lower hand');
      }
    });

    // Host actions (mute, kick, promote, demote)
    socket.on('stream:host_action', async (payload: HostActionPayload) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const { streamId, targetUserId, action } = payload;

        switch (action) {
          case 'promote':
            await liveStreamService.promoteToCoHost(streamId, targetUserId, socket.userId);
            break;
          case 'demote':
            await liveStreamService.demoteFromCoHost(streamId, targetUserId, socket.userId);
            break;
          case 'kick':
            // Kick is handled via Agora API
            break;
          case 'mute':
          case 'unmute':
            // Mute is handled via client-side Agora SDK
            break;
        }

        liveStreamNs.to(`stream:${streamId}`).emit('stream:host_action', {
          action,
          targetUserId,
          performedBy: socket.userId,
        });
      } catch (error: any) {
        logger.error({ error, payload }, 'Failed to perform host action');
        socket.emit('error', { message: error.message });
      }
    });

    // Disconnect handler
    socket.on('disconnect', async () => {
      try {
        if (socket.userId && socket.streamId) {
          await liveStreamService.leaveStream(socket.streamId, socket.userId);

          const participantCount = await liveStreamService.getParticipantCount(socket.streamId);

          liveStreamNs.to(`stream:${socket.streamId}`).emit('stream:participant_left', {
            userId: socket.userId,
            participantCount,
          });
        }

        logger.info({ socketId: socket.id, userId: socket.userId }, 'Socket disconnected');
      } catch (error) {
        logger.error({ error }, 'Error handling disconnect');
      }
    });
  });

  logger.info('Socket.IO server initialized');
  return io;
}

// ============================================
// Broadcast Functions
// ============================================

export function getIO(): SocketServer | null {
  return io;
}

export function broadcastToStream(streamId: string, event: string, data: any) {
  if (!io) {
    logger.warn('Socket.IO not initialized');
    return;
  }

  io.of('/live-stream').to(`stream:${streamId}`).emit(event, data);
}

export function broadcastStreamStatusChange(
  streamId: string,
  status: 'LIVE' | 'ENDED' | 'CANCELLED',
) {
  broadcastToStream(streamId, 'stream:status_change', { streamId, status });
}

export function broadcastRecordingStarted(streamId: string) {
  broadcastToStream(streamId, 'stream:recording_started', { streamId });
}

export function broadcastRecordingStopped(streamId: string) {
  broadcastToStream(streamId, 'stream:recording_stopped', { streamId });
}

export function broadcastParticipantCount(streamId: string, count: number) {
  broadcastToStream(streamId, 'stream:participant_count', { streamId, count });
}

export function broadcastChatMessage(streamId: string, message: any) {
  broadcastToStream(streamId, 'stream:chat_message', message);
}

export function broadcastPinnedMessage(streamId: string, message: any) {
  broadcastToStream(streamId, 'stream:message_pinned', message);
}

export function broadcastMessageDeleted(streamId: string, messageId: string) {
  broadcastToStream(streamId, 'stream:message_deleted', { messageId });
}

export function broadcastSystemMessage(streamId: string, message: string) {
  broadcastToStream(streamId, 'stream:system_message', { message });
}

// ============================================
// Room Management
// ============================================

export async function getStreamRoomSize(streamId: string): Promise<number> {
  if (!io) {
    return 0;
  }

  const room = io.of('/live-stream').adapter.rooms.get(`stream:${streamId}`);
  return room ? room.size : 0;
}

export async function disconnectUserFromStream(streamId: string, userId: string) {
  if (!io) {
    return;
  }

  const namespace = io.of('/live-stream');
  const sockets = await namespace.fetchSockets();

  for (const socket of sockets) {
    const authSocket = socket as any;
    if (authSocket.userId === userId && authSocket.streamId === streamId) {
      authSocket.leave(`stream:${streamId}`);
      authSocket.emit('stream:kicked', { reason: 'Removed by host' });
      authSocket.streamId = undefined;
    }
  }
}

// ============================================
// Shutdown
// ============================================

export function closeSocketServer() {
  if (io) {
    logger.info('Closing Socket.IO server...');
    io.close();
    io = null;
    logger.info('Socket.IO server closed');
  }
}
