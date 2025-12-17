import { Router } from 'express';
import chatRoutes from './chat';
import recommendationRoutes from './recommendations';
import insightRoutes from './insights';
import ttsRoutes from './tts';
import sttRoutes from './stt';
import workflowRoutes from './workflow';

const router = Router();

/**
 * AI Services Routes
 * Sprint 26: AI Recommendations & AI Services System
 *
 * Base path: /api/ai
 */

// Chat / Conversation routes
router.use('/chat', chatRoutes);

// Recommendation routes
router.use('/recommendations', recommendationRoutes);

// Daily Insights routes
router.use('/insights', insightRoutes);

// Text-to-Speech routes (OpenAI + ElevenLabs)
router.use('/tts', ttsRoutes);

// Speech-to-Text routes (OpenAI Whisper)
router.use('/stt', sttRoutes);

// Workflow engine routes (LangGraph-like)
router.use('/workflow', workflowRoutes);

export default router;
