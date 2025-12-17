import OpenAI from 'openai';
import { PrismaClient, AIProvider, AIServiceType, AIRequestStatus, VoiceJobStatus } from '@prisma/client';
import { getClient, trackUsage } from './openaiService';
import { uploadFile, getSignedUrl } from '../storageService';

const prisma = new PrismaClient();

// Available voices
export type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

export interface TTSOptions {
  voice?: OpenAIVoice;
  speed?: number;
  format?: 'mp3' | 'opus' | 'aac' | 'flac';
  model?: 'tts-1' | 'tts-1-hd';
}

// Generate speech
export const generateSpeech = async (
  text: string,
  options: TTSOptions = {},
  userId?: string
): Promise<{
  buffer: Buffer;
  format: string;
  duration: number;
}> => {
  const client = getClient();
  const startTime = Date.now();

  const voice = options.voice || 'nova';
  const model = options.model || 'tts-1';
  const format = options.format || 'mp3';
  const speed = options.speed || 1.0;

  try {
    const response = await client.audio.speech.create({
      model,
      voice,
      input: text,
      speed,
      response_format: format,
    });

    const latencyMs = Date.now() - startTime;
    const buffer = Buffer.from(await response.arrayBuffer());

    // Estimate duration (very rough estimate: ~150 words per minute)
    const wordCount = text.split(/\s+/).length;
    const estimatedDuration = (wordCount / 150) * 60 / speed;

    await trackUsage(userId, AIServiceType.TEXT_TO_SPEECH, {
      provider: AIProvider.OPENAI,
      model,
      audioCharacters: text.length,
      audioDuration: estimatedDuration,
      latencyMs,
      status: AIRequestStatus.SUCCESS,
    });

    return {
      buffer,
      format,
      duration: estimatedDuration,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    await trackUsage(userId, AIServiceType.TEXT_TO_SPEECH, {
      provider: AIProvider.OPENAI,
      model,
      audioCharacters: text.length,
      latencyMs,
      status: AIRequestStatus.FAILED,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
};

// Generate speech and save to storage
export const generateSpeechAndSave = async (
  text: string,
  options: TTSOptions = {},
  userId?: string
): Promise<{
  audioUrl: string;
  format: string;
  duration: number;
  fileSize: number;
}> => {
  const result = await generateSpeech(text, options, userId);

  // Generate unique key
  const timestamp = Date.now();
  const key = `tts/${userId || 'system'}/${timestamp}.${result.format}`;

  // Upload to S3
  const contentType = getContentType(result.format);
  await uploadFile(key, result.buffer, contentType);

  const audioUrl = await getSignedUrl(key, 3600 * 24); // 24 hours

  return {
    audioUrl,
    format: result.format,
    duration: result.duration,
    fileSize: result.buffer.length,
  };
};

// Get available voices
export const getAvailableVoices = () => {
  return [
    {
      id: 'alloy',
      name: 'Alloy',
      description: 'Neutral, balanced voice',
      gender: 'neutral',
    },
    {
      id: 'echo',
      name: 'Echo',
      description: 'Warm, inviting voice',
      gender: 'male',
    },
    {
      id: 'fable',
      name: 'Fable',
      description: 'British accent, storytelling voice',
      gender: 'neutral',
    },
    {
      id: 'onyx',
      name: 'Onyx',
      description: 'Deep, authoritative voice',
      gender: 'male',
    },
    {
      id: 'nova',
      name: 'Nova',
      description: 'Friendly, conversational voice',
      gender: 'female',
    },
    {
      id: 'shimmer',
      name: 'Shimmer',
      description: 'Soft, calming voice',
      gender: 'female',
    },
  ];
};

// Estimate cost
export const estimateCost = (text: string, model: 'tts-1' | 'tts-1-hd' = 'tts-1') => {
  const pricing = {
    'tts-1': 0.015, // per 1000 characters
    'tts-1-hd': 0.03, // per 1000 characters
  };

  const cost = (text.length / 1000) * pricing[model];
  return Math.round(cost * 1000000) / 1000000;
};

// Create voice over job
export const createVoiceOverJob = async (data: {
  text: string;
  languageCode?: string;
  voice?: string;
  speed?: number;
  entityType?: string;
  entityId?: string;
  userId: string;
}) => {
  const estimatedCost = estimateCost(data.text);

  return prisma.voiceOverJob.create({
    data: {
      text: data.text,
      languageCode: data.languageCode || 'en',
      provider: AIProvider.OPENAI,
      voice: data.voice || 'nova',
      speed: data.speed || 1.0,
      characters: data.text.length,
      estimatedCost,
      status: VoiceJobStatus.PENDING,
      entityType: data.entityType,
      entityId: data.entityId,
      createdById: data.userId,
    },
  });
};

// Process voice over job
export const processVoiceOverJob = async (jobId: string) => {
  const job = await prisma.voiceOverJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new Error('Voice over job not found');
  }

  // Update status to processing
  await prisma.voiceOverJob.update({
    where: { id: jobId },
    data: {
      status: VoiceJobStatus.PROCESSING,
      startedAt: new Date(),
    },
  });

  try {
    const result = await generateSpeechAndSave(
      job.text,
      {
        voice: job.voice as OpenAIVoice,
        speed: job.speed,
      },
      job.createdById
    );

    // Update job with result
    await prisma.voiceOverJob.update({
      where: { id: jobId },
      data: {
        status: VoiceJobStatus.COMPLETED,
        audioUrl: result.audioUrl,
        audioFormat: result.format,
        duration: result.duration,
        fileSize: result.fileSize,
        completedAt: new Date(),
      },
    });

    return result;
  } catch (error) {
    await prisma.voiceOverJob.update({
      where: { id: jobId },
      data: {
        status: VoiceJobStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      },
    });

    throw error;
  }
};

// Get voice over job
export const getVoiceOverJob = async (jobId: string) => {
  return prisma.voiceOverJob.findUnique({
    where: { id: jobId },
  });
};

// Get user's voice over jobs
export const getUserVoiceOverJobs = async (
  userId: string,
  status?: VoiceJobStatus
) => {
  return prisma.voiceOverJob.findMany({
    where: {
      createdById: userId,
      ...(status && { status }),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
};

// Process pending voice over jobs (cron job)
export const processPendingVoiceOverJobs = async () => {
  const pendingJobs = await prisma.voiceOverJob.findMany({
    where: { status: VoiceJobStatus.PENDING },
    take: 10, // Process 10 at a time
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
      await processVoiceOverJob(job.id);
      results.succeeded++;
    } catch (error) {
      results.failed++;
      console.error(`Failed to process voice over job ${job.id}:`, error);
    }
  }

  return results;
};

// Get content type for audio format
const getContentType = (format: string): string => {
  const contentTypes: Record<string, string> = {
    mp3: 'audio/mpeg',
    opus: 'audio/opus',
    aac: 'audio/aac',
    flac: 'audio/flac',
  };
  return contentTypes[format] || 'audio/mpeg';
};
