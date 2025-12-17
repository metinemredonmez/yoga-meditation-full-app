import { Request, Response } from 'express';
import {
  transcribeAudio,
  createTranscriptionJob,
  processTranscriptionJob,
  getTranscriptionJob,
  getUserTranscriptionJobs,
  detectLanguage,
} from '../../services/ai/sttService';

// Transcribe audio (immediate)
export const transcribe = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { audioUrl, languageCode, timestamps, wordLevel, prompt } = req.body;

    if (!audioUrl) {
      return res.status(400).json({
        success: false,
        error: 'Audio URL is required',
      });
    }

    const result = await transcribeAudio(
      audioUrl,
      { languageCode, timestamps, wordLevel, prompt },
      userId
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Transcribe error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to transcribe audio',
    });
  }
};

// Create transcription job
export const createJob = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { audioUrl, audioFormat, duration, languageCode, entityType, entityId } = req.body;

    if (!audioUrl) {
      return res.status(400).json({
        success: false,
        error: 'Audio URL is required',
      });
    }

    const job = await createTranscriptionJob({
      audioUrl,
      audioFormat,
      duration,
      languageCode,
      entityType,
      entityId,
      userId,
    });

    res.status(201).json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error('Create transcription job error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create transcription job',
    });
  }
};

// Process transcription job
export const processJob = async (req: Request, res: Response) => {
  try {
    const jobId = req.params.jobId as string;

    const result = await processTranscriptionJob(jobId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Process transcription job error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process transcription job',
    });
  }
};

// Get transcription job
export const getJob = async (req: Request, res: Response) => {
  try {
    const jobId = req.params.jobId as string;

    const job = await getTranscriptionJob(jobId);

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
    console.error('Get transcription job error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transcription job',
    });
  }
};

// Get user's transcription jobs
export const getUserSTTJobs = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { status } = req.query;

    const jobs = await getUserTranscriptionJobs(userId, status as any);

    res.json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    console.error('Get user transcription jobs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transcription jobs',
    });
  }
};

// Detect language from audio
export const detectAudioLanguage = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { audioUrl } = req.body;

    if (!audioUrl) {
      return res.status(400).json({
        success: false,
        error: 'Audio URL is required',
      });
    }

    const language = await detectLanguage(audioUrl, userId);

    res.json({
      success: true,
      data: {
        detectedLanguage: language,
      },
    });
  } catch (error) {
    console.error('Detect language error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect language',
    });
  }
};
