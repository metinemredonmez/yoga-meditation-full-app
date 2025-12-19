import { PrismaClient, AIProvider, AIServiceType, AIRequestStatus, TranscriptionStatus } from '@prisma/client';
import { getClient, trackUsage } from './openaiService';
import { downloadFile } from '../storageService';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const prisma = new PrismaClient();

export interface TranscriptionOptions {
  languageCode?: string;
  timestamps?: boolean;
  wordLevel?: boolean;
  prompt?: string;
}

export interface TranscriptionResult {
  text: string;
  segments?: TranscriptionSegment[];
  words?: TranscriptionWord[];
  detectedLanguage?: string;
  duration?: number;
}

export interface TranscriptionSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionWord {
  word: string;
  start: number;
  end: number;
}

// Transcribe audio from URL
export const transcribeAudio = async (
  audioUrl: string,
  options: TranscriptionOptions = {},
  userId?: string
): Promise<TranscriptionResult> => {
  const client = getClient();
  const model = 'whisper-1';
  const startTime = Date.now();

  // Download audio file to temp location
  const tempDir = os.tmpdir();
  const tempFile = path.join(tempDir, `audio_${Date.now()}.mp3`);

  try {
    // Download the file
    const audioBuffer = await downloadFile(audioUrl);
    fs.writeFileSync(tempFile, audioBuffer);

    // Create file stream
    const fileStream = fs.createReadStream(tempFile);

    // Build request options
    const requestOptions: {
      file: typeof fileStream;
      model: string;
      language?: string;
      prompt?: string;
      response_format?: 'json' | 'verbose_json' | 'text';
      timestamp_granularities?: ('segment' | 'word')[];
    } = {
      file: fileStream,
      model,
    };

    if (options.languageCode) {
      requestOptions.language = options.languageCode;
    }

    if (options.prompt) {
      requestOptions.prompt = options.prompt;
    }

    // Request verbose JSON for timestamps
    if (options.timestamps || options.wordLevel) {
      requestOptions.response_format = 'verbose_json';
      const granularities: ('segment' | 'word')[] = [];
      if (options.timestamps) granularities.push('segment');
      if (options.wordLevel) granularities.push('word');
      requestOptions.timestamp_granularities = granularities;
    }

    const response = await client.audio.transcriptions.create(requestOptions);

    const latencyMs = Date.now() - startTime;

    // Estimate duration from file size (very rough: ~1MB per minute for MP3)
    const fileStats = fs.statSync(tempFile);
    const estimatedDuration = fileStats.size / (1024 * 1024) * 60;

    await trackUsage(userId, AIServiceType.SPEECH_TO_TEXT, {
      provider: AIProvider.OPENAI,
      model,
      audioDuration: estimatedDuration,
      latencyMs,
      status: AIRequestStatus.SUCCESS,
    });

    // Clean up temp file
    fs.unlinkSync(tempFile);

    // Parse response based on format
    if (typeof response === 'string') {
      return { text: response };
    }

    const result: TranscriptionResult = {
      text: response.text,
      detectedLanguage: (response as { language?: string }).language,
      duration: (response as { duration?: number }).duration,
    };

    const responseWithSegments = response as { segments?: TranscriptionSegment[] };
    if (responseWithSegments.segments) {
      result.segments = responseWithSegments.segments;
    }

    const responseWithWords = response as { words?: TranscriptionWord[] };
    if (responseWithWords.words) {
      result.words = responseWithWords.words;
    }

    return result;
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    await trackUsage(userId, AIServiceType.SPEECH_TO_TEXT, {
      provider: AIProvider.OPENAI,
      model,
      latencyMs,
      status: AIRequestStatus.FAILED,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    // Clean up temp file if exists
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }

    throw error;
  }
};

// Transcribe audio file (Buffer or File)
export const transcribeAudioFile = async (
  file: Buffer | string,
  options: TranscriptionOptions = {},
  userId?: string
): Promise<TranscriptionResult> => {
  const client = getClient();
  const model = 'whisper-1';
  const startTime = Date.now();

  const tempDir = os.tmpdir();
  const tempFile = path.join(tempDir, `audio_${Date.now()}.mp3`);

  try {
    // Write buffer to temp file
    if (Buffer.isBuffer(file)) {
      fs.writeFileSync(tempFile, file);
    } else {
      // Assume it's a path
      fs.copyFileSync(file, tempFile);
    }

    const fileStream = fs.createReadStream(tempFile);

    const requestOptions: {
      file: typeof fileStream;
      model: string;
      language?: string;
      prompt?: string;
    } = {
      file: fileStream,
      model,
    };

    if (options.languageCode) {
      requestOptions.language = options.languageCode;
    }

    if (options.prompt) {
      requestOptions.prompt = options.prompt;
    }

    const response = await client.audio.transcriptions.create(requestOptions);

    const latencyMs = Date.now() - startTime;

    const fileStats = fs.statSync(tempFile);
    const estimatedDuration = fileStats.size / (1024 * 1024) * 60;

    await trackUsage(userId, AIServiceType.SPEECH_TO_TEXT, {
      provider: AIProvider.OPENAI,
      model,
      audioDuration: estimatedDuration,
      latencyMs,
      status: AIRequestStatus.SUCCESS,
    });

    fs.unlinkSync(tempFile);

    return {
      text: typeof response === 'string' ? response : response.text,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    await trackUsage(userId, AIServiceType.SPEECH_TO_TEXT, {
      provider: AIProvider.OPENAI,
      model,
      latencyMs,
      status: AIRequestStatus.FAILED,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }

    throw error;
  }
};

// Create transcription job
export const createTranscriptionJob = async (data: {
  audioUrl: string;
  audioFormat?: string;
  duration?: number;
  languageCode?: string;
  entityType?: string;
  entityId?: string;
  userId: string;
}) => {
  // Estimate cost (~$0.006 per minute)
  const estimatedCost = data.duration ? (data.duration / 60) * 0.006 : 0;

  return prisma.transcription_jobs.create({
    data: {
      audioUrl: data.audioUrl,
      audioFormat: data.audioFormat,
      duration: data.duration,
      languageCode: data.languageCode,
      provider: AIProvider.OPENAI,
      model: 'whisper-1',
      status: TranscriptionStatus.PENDING,
      estimatedCost,
      entityType: data.entityType,
      entityId: data.entityId,
      createdById: data.userId,
    },
  });
};

// Process transcription job
export const processTranscriptionJob = async (jobId: string) => {
  const job = await prisma.transcription_jobs.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new Error('Transcription job not found');
  }

  // Update status to processing
  await prisma.transcription_jobs.update({
    where: { id: jobId },
    data: {
      status: TranscriptionStatus.PROCESSING,
      startedAt: new Date(),
    },
  });

  try {
    const result = await transcribeAudio(
      job.audioUrl,
      {
        languageCode: job.languageCode || undefined,
        timestamps: true,
        wordLevel: true,
      },
      job.createdById
    );

    // Update job with result
    await prisma.transcription_jobs.update({
      where: { id: jobId },
      data: {
        status: TranscriptionStatus.COMPLETED,
        transcription: result.text,
        segments: result.segments as unknown as undefined,
        words: result.words as unknown as undefined,
        detectedLanguage: result.detectedLanguage,
        duration: result.duration,
        completedAt: new Date(),
      },
    });

    return result;
  } catch (error) {
    await prisma.transcription_jobs.update({
      where: { id: jobId },
      data: {
        status: TranscriptionStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      },
    });

    throw error;
  }
};

// Get transcription job
export const getTranscriptionJob = async (jobId: string) => {
  return prisma.transcription_jobs.findUnique({
    where: { id: jobId },
  });
};

// Get user's transcription jobs
export const getUserTranscriptionJobs = async (
  userId: string,
  status?: TranscriptionStatus
) => {
  return prisma.transcription_jobs.findMany({
    where: {
      createdById: userId,
      ...(status && { status }),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
};

// Process pending transcription jobs (cron job)
export const processPendingTranscriptionJobs = async () => {
  const pendingJobs = await prisma.transcription_jobs.findMany({
    where: { status: TranscriptionStatus.PENDING },
    take: 5, // Process 5 at a time
    orderBy: { createdAt: 'asc' },
  });

  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
  };

  for (const job of pendingJobs) {
    results.processed++;
    try {
      await processTranscriptionJob(job.id);
      results.succeeded++;
    } catch (error) {
      results.failed++;
      console.error(`Failed to process transcription job ${job.id}:`, error);
    }
  }

  return results;
};

// Detect language from audio
export const detectLanguage = async (
  audioUrl: string,
  userId?: string
): Promise<string> => {
  const result = await transcribeAudio(audioUrl, {}, userId);
  return result.detectedLanguage || 'unknown';
};

// Extract segments with timestamps
export const extractSegments = (
  transcription: TranscriptionResult
): TranscriptionSegment[] => {
  return transcription.segments || [];
};
