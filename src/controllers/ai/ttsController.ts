import { Request, Response } from 'express';
import {
  generateSpeechAndSave,
  getAvailableVoices,
  createVoiceOverJob,
  processVoiceOverJob,
  getVoiceOverJob,
  getUserVoiceOverJobs,
  estimateCost,
} from '../../services/ai/ttsService';
import {
  getActiveVoices as getActiveElevenLabsVoices,
  generateElevenLabsSpeechAndSave,
  createElevenLabsJob,
  processElevenLabsJob,
  getElevenLabsJob,
  getUserElevenLabsJobs,
  getRecommendedVoice,
  syncElevenLabsVoices,
} from '../../services/ai/elevenLabsService';

// Get available voices (all providers)
export const getVoices = async (req: Request, res: Response) => {
  try {
    const { provider = 'all' } = req.query;

    const voices: {
      openai?: ReturnType<typeof getAvailableVoices>;
      elevenlabs?: Awaited<ReturnType<typeof getActiveElevenLabsVoices>>;
    } = {};

    if (provider === 'all' || provider === 'openai') {
      voices.openai = getAvailableVoices();
    }

    if (provider === 'all' || provider === 'elevenlabs') {
      voices.elevenlabs = await getActiveElevenLabsVoices();
    }

    res.json({
      success: true,
      data: voices,
    });
  } catch (error) {
    console.error('Get voices error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get voices',
    });
  }
};

// Generate speech (OpenAI)
export const generateOpenAISpeech = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { text, voice = 'nova', speed = 1.0, format = 'mp3' } = req.body;

    if (!text || text.length > 4096) {
      return res.status(400).json({
        success: false,
        error: 'Text is required and must be under 4096 characters',
      });
    }

    const result = await generateSpeechAndSave(
      text,
      { voice, speed, format },
      userId
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Generate speech error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate speech',
    });
  }
};

// Generate speech (ElevenLabs)
export const generateElevenLabsSpeech = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { text, voiceId, stability, similarityBoost, style } = req.body;

    if (!text || !voiceId) {
      return res.status(400).json({
        success: false,
        error: 'Text and voiceId are required',
      });
    }

    const result = await generateElevenLabsSpeechAndSave(
      text,
      {
        voiceId,
        voiceSettings: { stability, similarityBoost, style },
      },
      userId
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Generate ElevenLabs speech error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate speech',
    });
  }
};

// Create voice over job (OpenAI)
export const createOpenAIJob = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { text, voice, speed, entityType, entityId } = req.body;

    const job = await createVoiceOverJob({
      text,
      voice,
      speed,
      entityType,
      entityId,
      userId,
    });

    res.status(201).json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create voice over job',
    });
  }
};

// Create ElevenLabs job
export const createElevenLabsJobController = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { text, voiceId, voiceSettings, entityType, entityId } = req.body;

    const job = await createElevenLabsJob({
      text,
      voiceId,
      voiceSettings,
      entityType,
      entityId,
      userId,
    });

    res.status(201).json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error('Create ElevenLabs job error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create ElevenLabs job',
    });
  }
};

// Process job (OpenAI)
export const processOpenAIJob = async (req: Request, res: Response) => {
  try {
    const jobId = req.params.jobId as string;

    const result = await processVoiceOverJob(jobId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Process job error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process job',
    });
  }
};

// Process ElevenLabs job
export const processElevenLabsJobController = async (req: Request, res: Response) => {
  try {
    const jobId = req.params.jobId as string;

    const result = await processElevenLabsJob(jobId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Process ElevenLabs job error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process job',
    });
  }
};

// Get job status (OpenAI)
export const getOpenAIJobStatus = async (req: Request, res: Response) => {
  try {
    const jobId = req.params.jobId as string;

    const job = await getVoiceOverJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    res.json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get job',
    });
  }
};

// Get ElevenLabs job status
export const getElevenLabsJobStatus = async (req: Request, res: Response) => {
  try {
    const jobId = req.params.jobId as string;

    const job = await getElevenLabsJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    res.json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error('Get ElevenLabs job error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get job',
    });
  }
};

// Get user's TTS jobs
export const getUserTTSJobs = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { provider = 'openai', status } = req.query;

    let jobs;

    if (provider === 'elevenlabs') {
      jobs = await getUserElevenLabsJobs(userId, status as any);
    } else {
      jobs = await getUserVoiceOverJobs(userId, status as any);
    }

    res.json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    console.error('Get user jobs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get jobs',
    });
  }
};

// Estimate cost
export const getEstimate = async (req: Request, res: Response) => {
  try {
    const { text, model = 'tts-1' } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required',
      });
    }

    const cost = estimateCost(text, model as 'tts-1' | 'tts-1-hd');

    res.json({
      success: true,
      data: {
        characters: text.length,
        model,
        estimatedCost: cost,
        currency: 'USD',
      },
    });
  } catch (error) {
    console.error('Estimate cost error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to estimate cost',
    });
  }
};

// Get recommended voice for yoga category
export const getRecommended = async (req: Request, res: Response) => {
  try {
    const { category } = req.params;

    const voice = await getRecommendedVoice(
      category as 'meditation' | 'instruction' | 'motivation'
    );

    res.json({
      success: true,
      data: voice,
    });
  } catch (error) {
    console.error('Get recommended voice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recommended voice',
    });
  }
};

// Sync ElevenLabs voices (admin)
export const syncVoices = async (req: Request, res: Response) => {
  try {
    const result = await syncElevenLabsVoices();

    res.json({
      success: true,
      data: result,
      message: 'Voices synced successfully',
    });
  } catch (error) {
    console.error('Sync voices error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync voices',
    });
  }
};
