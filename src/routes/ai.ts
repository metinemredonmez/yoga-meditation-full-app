import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { aiService } from '../services/aiService';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// All AI routes require authentication
router.use(authenticate);

// ============================================
// Validation Schemas
// ============================================

const chatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string().min(1),
    })
  ),
  systemPrompt: z.string().optional(),
  maxTokens: z.number().min(1).max(4000).optional(),
  temperature: z.number().min(0).max(2).optional(),
});

const meditationSchema = z.object({
  type: z.enum(['breathing', 'body_scan', 'mindfulness', 'sleep', 'stress_relief']),
  durationMinutes: z.number().min(1).max(60).optional(),
  language: z.string().optional(),
});

const ttsSchema = z.object({
  text: z.string().min(1).max(5000),
  voiceId: z.string().optional(),
});

const moodAnalysisSchema = z.object({
  entry: z.string().min(10).max(5000),
});

const recommendationSchema = z.object({
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  goals: z.array(z.string()),
  preferences: z.array(z.string()).optional(),
  recentSessions: z.array(z.string()).optional(),
});

// ============================================
// Routes
// ============================================

/**
 * GET /api/ai/status
 * Get AI service availability status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const capabilities = await aiService.getAvailableCapabilities();

    res.json({
      success: true,
      data: capabilities,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get AI status');
    res.status(500).json({
      success: false,
      error: 'Failed to get AI status',
    });
  }
});

/**
 * POST /api/ai/chat
 * Chat with AI (uses available provider)
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: parsed.error.issues,
      });
    }

    const { messages, systemPrompt, maxTokens, temperature } = parsed.data;

    const result = await aiService.chat(messages, {
      systemPrompt,
      maxTokens,
      temperature,
    });

    res.json({
      success: true,
      data: {
        response: result.response,
        provider: result.provider,
      },
    });
  } catch (error: any) {
    logger.error({ err: error }, 'AI chat failed');
    res.status(500).json({
      success: false,
      error: error.message || 'AI chat failed',
    });
  }
});

/**
 * POST /api/ai/meditation/generate
 * Generate meditation guidance text
 */
router.post('/meditation/generate', async (req: Request, res: Response) => {
  try {
    const parsed = meditationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: parsed.error.issues,
      });
    }

    const { type, durationMinutes, language } = parsed.data;

    const text = await aiService.generateMeditationGuidance(
      type,
      durationMinutes || 10,
      language || 'tr'
    );

    res.json({
      success: true,
      data: {
        text,
        type,
        durationMinutes: durationMinutes || 10,
      },
    });
  } catch (error: any) {
    logger.error({ err: error }, 'Meditation generation failed');
    res.status(500).json({
      success: false,
      error: error.message || 'Meditation generation failed',
    });
  }
});

/**
 * POST /api/ai/tts
 * Text-to-Speech conversion
 */
router.post('/tts', async (req: Request, res: Response) => {
  try {
    const parsed = ttsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: parsed.error.issues,
      });
    }

    const { text, voiceId } = parsed.data;

    const audioBuffer = await aiService.textToSpeech(text, { voiceId });

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
    });
    res.send(audioBuffer);
  } catch (error: any) {
    logger.error({ err: error }, 'TTS failed');
    res.status(500).json({
      success: false,
      error: error.message || 'TTS failed',
    });
  }
});

/**
 * POST /api/ai/mood/analyze
 * Analyze mood from journal entry
 */
router.post('/mood/analyze', async (req: Request, res: Response) => {
  try {
    const parsed = moodAnalysisSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: parsed.error.issues,
      });
    }

    const { entry } = parsed.data;
    const analysis = await aiService.analyzeMood(entry);

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error: any) {
    logger.error({ err: error }, 'Mood analysis failed');
    res.status(500).json({
      success: false,
      error: error.message || 'Mood analysis failed',
    });
  }
});

/**
 * POST /api/ai/recommend
 * Get personalized yoga recommendation
 */
router.post('/recommend', async (req: Request, res: Response) => {
  try {
    const parsed = recommendationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: parsed.error.issues,
      });
    }

    const recommendation = await aiService.generateYogaRecommendation({
      level: parsed.data.level,
      goals: parsed.data.goals,
      preferences: parsed.data.preferences || [],
      recentSessions: parsed.data.recentSessions,
    });

    res.json({
      success: true,
      data: recommendation,
    });
  } catch (error: any) {
    logger.error({ err: error }, 'Recommendation failed');
    res.status(500).json({
      success: false,
      error: error.message || 'Recommendation failed',
    });
  }
});

export default router;
