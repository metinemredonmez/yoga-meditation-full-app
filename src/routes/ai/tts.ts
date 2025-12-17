import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validateRequest';
import { z } from 'zod';
import {
  getVoices,
  generateOpenAISpeech,
  generateElevenLabsSpeech,
  createOpenAIJob,
  createElevenLabsJobController,
  processOpenAIJob,
  processElevenLabsJobController,
  getOpenAIJobStatus,
  getElevenLabsJobStatus,
  getUserTTSJobs,
  getEstimate,
  getRecommended,
  syncVoices,
} from '../../controllers/ai/ttsController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const generateOpenAIBodySchema = z.object({
  text: z.string().min(1).max(4096),
  voice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']).optional(),
  speed: z.number().min(0.25).max(4).optional(),
  format: z.enum(['mp3', 'opus', 'aac', 'flac']).optional(),
});

const generateElevenLabsBodySchema = z.object({
  text: z.string().min(1).max(10000),
  voiceId: z.string(),
  stability: z.number().min(0).max(1).optional(),
  similarityBoost: z.number().min(0).max(1).optional(),
  style: z.number().min(0).max(1).optional(),
});

const createJobBodySchema = z.object({
  text: z.string().min(1),
  voice: z.string().optional(),
  speed: z.number().min(0.25).max(4).optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
});

const estimateBodySchema = z.object({
  text: z.string().min(1),
  model: z.enum(['tts-1', 'tts-1-hd']).optional(),
});

// Routes

/**
 * @route GET /api/ai/tts/voices
 * @desc Get available voices
 * @access Private
 */
router.get('/voices', getVoices);

/**
 * @route GET /api/ai/tts/voices/recommended/:category
 * @desc Get recommended voice for yoga category
 * @access Private
 */
router.get('/voices/recommended/:category', getRecommended);

/**
 * @route POST /api/ai/tts/generate/openai
 * @desc Generate speech with OpenAI
 * @access Private
 */
router.post(
  '/generate/openai',
  validateRequest({ body: generateOpenAIBodySchema }),
  generateOpenAISpeech
);

/**
 * @route POST /api/ai/tts/generate/elevenlabs
 * @desc Generate speech with ElevenLabs
 * @access Private
 */
router.post(
  '/generate/elevenlabs',
  validateRequest({ body: generateElevenLabsBodySchema }),
  generateElevenLabsSpeech
);

/**
 * @route POST /api/ai/tts/jobs/openai
 * @desc Create OpenAI voice over job
 * @access Private
 */
router.post(
  '/jobs/openai',
  validateRequest({ body: createJobBodySchema }),
  createOpenAIJob
);

/**
 * @route POST /api/ai/tts/jobs/elevenlabs
 * @desc Create ElevenLabs voice over job
 * @access Private
 */
router.post(
  '/jobs/elevenlabs',
  validateRequest({ body: createJobBodySchema }),
  createElevenLabsJobController
);

/**
 * @route POST /api/ai/tts/jobs/openai/:jobId/process
 * @desc Process OpenAI job
 * @access Private
 */
router.post('/jobs/openai/:jobId/process', processOpenAIJob);

/**
 * @route POST /api/ai/tts/jobs/elevenlabs/:jobId/process
 * @desc Process ElevenLabs job
 * @access Private
 */
router.post('/jobs/elevenlabs/:jobId/process', processElevenLabsJobController);

/**
 * @route GET /api/ai/tts/jobs/openai/:jobId
 * @desc Get OpenAI job status
 * @access Private
 */
router.get('/jobs/openai/:jobId', getOpenAIJobStatus);

/**
 * @route GET /api/ai/tts/jobs/elevenlabs/:jobId
 * @desc Get ElevenLabs job status
 * @access Private
 */
router.get('/jobs/elevenlabs/:jobId', getElevenLabsJobStatus);

/**
 * @route GET /api/ai/tts/jobs
 * @desc Get user's jobs
 * @access Private
 */
router.get('/jobs', getUserTTSJobs);

/**
 * @route POST /api/ai/tts/estimate
 * @desc Estimate TTS cost
 * @access Private
 */
router.post('/estimate', validateRequest({ body: estimateBodySchema }), getEstimate);

/**
 * @route POST /api/ai/tts/sync-voices
 * @desc Sync ElevenLabs voices (Admin)
 * @access Admin
 */
router.post('/sync-voices', authorize('ADMIN'), syncVoices);

export default router;
