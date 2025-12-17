import type { Request, Response, NextFunction } from 'express';
import * as messagingService from '../services/messagingService';
import { HttpError } from '../middleware/errorHandler';

// ============================================
// Conversation Controllers
// ============================================

export async function getConversations(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user.userId;
    const { page, limit } = req.query;

    const result = await messagingService.getConversations(userId, {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getConversation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user.userId;
    const id = req.params.id!;

    const conversation = await messagingService.getConversationById(id, userId);

    if (!conversation) {
      throw new HttpError(404, 'Conversation not found');
    }

    res.json({ success: true, data: conversation });
  } catch (error) {
    next(error);
  }
}

export async function deleteConversation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user.userId;
    const id = req.params.id!;

    const deleted = await messagingService.deleteConversation(id, userId);

    if (!deleted) {
      throw new HttpError(404, 'Conversation not found or not authorized');
    }

    res.json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Message Controllers
// ============================================

export async function sendMessage(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const senderId = (req as any).user.userId;
    const { receiverId, content } = req.body;

    if (!receiverId) {
      throw new HttpError(400, 'receiverId is required');
    }

    if (!content || content.trim() === '') {
      throw new HttpError(400, 'content is required');
    }

    const result = await messagingService.sendMessage({
      senderId,
      receiverId,
      content: content.trim(),
    });

    if (!result.sent) {
      throw new HttpError(403, result.message as string);
    }

    res.status(201).json({ success: true, data: result.message });
  } catch (error) {
    next(error);
  }
}

export async function getMessages(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user.userId;
    const otherUserId = req.params.otherUserId!;
    const { page, limit } = req.query;

    const result = await messagingService.getMessages(userId, otherUserId, {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getMessage(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user.userId;
    const id = req.params.id!;

    const message = await messagingService.getMessageById(id, userId);

    if (!message) {
      throw new HttpError(404, 'Message not found');
    }

    res.json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
}

export async function deleteMessage(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user.userId;
    const id = req.params.id!;

    const deleted = await messagingService.deleteMessage(id, userId);

    if (!deleted) {
      throw new HttpError(404, 'Message not found or not authorized');
    }

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user.userId;
    const otherUserId = req.params.otherUserId!;

    await messagingService.markMessagesAsRead(userId, otherUserId);
    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Unread Count Controllers
// ============================================

export async function getTotalUnreadCount(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user.userId;
    const count = await messagingService.getTotalUnreadCount(userId);
    res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
}

export async function getUnreadCounts(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user.userId;
    const counts = await messagingService.getUnreadCountPerConversation(userId);
    res.json({ success: true, data: counts });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Search Controllers
// ============================================

export async function searchMessages(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user.userId;
    const { q, page, limit } = req.query;

    if (!q || (q as string).trim() === '') {
      throw new HttpError(400, 'Search query is required');
    }

    const result = await messagingService.searchMessages(userId, q as string, {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}
