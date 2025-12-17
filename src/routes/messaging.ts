import { Router } from 'express';
import * as messagingController from '../controllers/messagingController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validateRequest';
import { sendMessageBodySchema } from '../validation/communitySchemas';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// Conversation Routes
// ============================================

// Get all conversations
router.get('/conversations', messagingController.getConversations);

// Get conversation by ID
router.get('/conversations/:id', messagingController.getConversation);

// Delete conversation
router.delete('/conversations/:id', messagingController.deleteConversation);

// ============================================
// Message Routes
// ============================================

// Send message
router.post(
  '/messages',
  validateBody(sendMessageBodySchema),
  messagingController.sendMessage,
);

// Get messages with user
router.get('/messages/:otherUserId', messagingController.getMessages);

// Get message by ID
router.get('/message/:id', messagingController.getMessage);

// Delete message
router.delete('/messages/:id', messagingController.deleteMessage);

// Mark as read
router.post('/messages/:otherUserId/read', messagingController.markAsRead);

// ============================================
// Unread Count Routes
// ============================================

// Get total unread count
router.get('/unread/total', messagingController.getTotalUnreadCount);

// Get unread counts per conversation
router.get('/unread/all', messagingController.getUnreadCounts);

// ============================================
// Search Routes
// ============================================

// Search messages
router.get('/search', messagingController.searchMessages);

export default router;
