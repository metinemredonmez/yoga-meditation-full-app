import { Request, Response } from 'express';
import { ConversationType } from '@prisma/client';
import {
  createConversation,
  getConversation,
  getUserConversations,
  sendMessage,
  sendVoiceMessage,
  deleteConversation,
  getConversationMessages,
} from '../../services/ai/chatService';

// Create new conversation
export const createNewConversation = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { type, contextType, contextId, title } = req.body;

    const conversation = await createConversation(
      userId,
      type as ConversationType,
      { contextType, contextId, title }
    );

    res.status(201).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create conversation',
    });
  }
};

// Get conversation by ID
export const getConversationById = async (req: Request, res: Response) => {
  try {
    const conversationId = req.params.conversationId as string;
    const userId = req.user!.id;

    const conversation = await getConversation(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
    }

    // Check ownership
    if (conversation.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation',
    });
  }
};

// Get user's conversations
export const listUserConversations = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { type } = req.query;

    const conversations = await getUserConversations(
      userId,
      type as ConversationType | undefined
    );

    res.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error('List conversations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list conversations',
    });
  }
};

// Send text message
export const sendTextMessage = async (req: Request, res: Response) => {
  try {
    const conversationId = req.params.conversationId as string;
    const { content } = req.body;
    const userId = req.user!.id;

    // Verify ownership
    const conversation = await getConversation(conversationId);
    if (!conversation || conversation.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const result = await sendMessage(conversationId, content as string);

    res.json({
      success: true,
      data: {
        userMessage: result.userMessage,
        assistantMessage: result.assistantMessage,
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
    });
  }
};

// Send voice message
export const sendVoice = async (req: Request, res: Response) => {
  try {
    const conversationId = req.params.conversationId as string;
    const { audioUrl } = req.body;
    const userId = req.user!.id;

    // Verify ownership
    const conversation = await getConversation(conversationId);
    if (!conversation || conversation.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const result = await sendVoiceMessage(conversationId, audioUrl as string);

    res.json({
      success: true,
      data: {
        transcription: result.transcription,
        userMessage: result.userMessage,
        assistantMessage: result.assistantMessage,
        audioResponse: result.audioResponse,
      },
    });
  } catch (error) {
    console.error('Send voice message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send voice message',
    });
  }
};

// Get conversation messages with pagination
export const getMessages = async (req: Request, res: Response) => {
  try {
    const conversationId = req.params.conversationId as string;
    const { page = '1', limit = '50' } = req.query;
    const userId = req.user!.id;

    // Verify ownership
    const conversation = await getConversation(conversationId);
    if (!conversation || conversation.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const messages = await getConversationMessages(
      conversationId,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get messages',
    });
  }
};

// Delete conversation
export const removeConversation = async (req: Request, res: Response) => {
  try {
    const conversationId = req.params.conversationId as string;
    const userId = req.user!.id;

    // Verify ownership
    const conversation = await getConversation(conversationId);
    if (!conversation || conversation.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    await deleteConversation(conversationId);

    res.json({
      success: true,
      message: 'Conversation deleted',
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete conversation',
    });
  }
};
