import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validateRequest';
import { z } from 'zod';
import {
  transcribe,
  createJob,
  processJob,
  getJob,
  getUserSTTJobs,
  detectAudioLanguage,
} from '../../controllers/ai/sttController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const transcribeBodySchema = z.object({
  audioUrl: z.string().url(),
  languageCode: z.string().length(2).optional(),
  timestamps: z.boolean().optional(),
  wordLevel: z.boolean().optional(),
  prompt: z.string().optional(),
});

const createJobBodySchema = z.object({
  audioUrl: z.string().url(),
  audioFormat: z.string().optional(),
  duration: z.number().optional(),
  languageCode: z.string().length(2).optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
});

const detectLanguageBodySchema = z.object({
  audioUrl: z.string().url(),
});

// Routes

/**
 * @route POST /api/ai/stt/transcribe
 * @desc Transcribe audio immediately
 * @access Private
 */
router.post('/transcribe', validateRequest({ body: transcribeBodySchema }), transcribe);

/**
 * @route POST /api/ai/stt/jobs
 * @desc Create transcription job
 * @access Private
 */
router.post('/jobs', validateRequest({ body: createJobBodySchema }), createJob);

/**
 * @route POST /api/ai/stt/jobs/:jobId/process
 * @desc Process transcription job
 * @access Private
 */
router.post('/jobs/:jobId/process', processJob);

/**
 * @route GET /api/ai/stt/jobs/:jobId
 * @desc Get transcription job status
 * @access Private
 */
router.get('/jobs/:jobId', getJob);

/**
 * @route GET /api/ai/stt/jobs
 * @desc Get user's transcription jobs
 * @access Private
 */
router.get('/jobs', getUserSTTJobs);

/**
 * @route POST /api/ai/stt/detect-language
 * @desc Detect language from audio
 * @access Private
 */
router.post(
  '/detect-language',
  validateRequest({ body: detectLanguageBodySchema }),
  detectAudioLanguage
);

export default router;
