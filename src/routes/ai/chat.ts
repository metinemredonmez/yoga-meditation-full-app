import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validateRequest';
import { z } from 'zod';
import {
  createNewConversation,
  getConversationById,
  listUserConversations,
  sendTextMessage,
  sendVoice,
  getMessages,
  removeConversation,
} from '../../controllers/ai/chatController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const createConversationBodySchema = z.object({
  type: z.enum([
    'YOGA_COACH',
    'MEDITATION_GUIDE',
    'NUTRITION_ADVISOR',
    'GENERAL_ASSISTANT',
    'CLASS_FEEDBACK',
  ]),
  contextType: z.string().optional(),
  contextId: z.string().optional(),
  title: z.string().optional(),
});

const sendMessageBodySchema = z.object({
  content: z.string().min(1).max(4000),
});

const sendVoiceBodySchema = z.object({
  audioUrl: z.string().url(),
});

// Routes

/**
 * @route POST /api/ai/chat/conversations
 * @desc Create new conversation
 * @access Private
 */
router.post(
  '/conversations',
  validateRequest({ body: createConversationBodySchema }),
  createNewConversation
);

/**
 * @route GET /api/ai/chat/conversations
 * @desc List user's conversations
 * @access Private
 */
router.get('/conversations', listUserConversations);

/**
 * @route GET /api/ai/chat/conversations/:conversationId
 * @desc Get conversation by ID
 * @access Private
 */
router.get('/conversations/:conversationId', getConversationById);

/**
 * @route POST /api/ai/chat/conversations/:conversationId/messages
 * @desc Send text message
 * @access Private
 */
router.post(
  '/conversations/:conversationId/messages',
  validateRequest({ body: sendMessageBodySchema }),
  sendTextMessage
);

/**
 * @route POST /api/ai/chat/conversations/:conversationId/voice
 * @desc Send voice message
 * @access Private
 */
router.post(
  '/conversations/:conversationId/voice',
  validateRequest({ body: sendVoiceBodySchema }),
  sendVoice
);

/**
 * @route GET /api/ai/chat/conversations/:conversationId/messages
 * @desc Get conversation messages
 * @access Private
 */
router.get('/conversations/:conversationId/messages', getMessages);

/**
 * @route DELETE /api/ai/chat/conversations/:conversationId
 * @desc Delete conversation
 * @access Private
 */
router.delete('/conversations/:conversationId', removeConversation);

export default router;
