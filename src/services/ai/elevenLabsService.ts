import { PrismaClient, VoiceJobStatus, AIProvider, AIServiceType, AIRequestStatus } from '@prisma/client';
import { trackUsage } from './openaiService';
import { uploadFile, getSignedUrl } from '../storageService';

const prisma = new PrismaClient();

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';

export interface ElevenLabsVoiceSettings {
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export interface ElevenLabsTTSOptions {
  voiceId: string;
  modelId?: string;
  voiceSettings?: ElevenLabsVoiceSettings;
  outputFormat?: 'mp3_44100_128' | 'mp3_44100_192' | 'pcm_16000' | 'pcm_22050' | 'pcm_24000' | 'pcm_44100';
}

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  description?: string;
  category?: string;
  labels?: Record<string, string>;
  preview_url?: string;
}

// Get available voices from ElevenLabs
export const getElevenLabsVoices = async () => {
  const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.statusText}`);
  }

  const data = await response.json() as { voices: ElevenLabsVoice[] };
  return data.voices;
};

// Sync voices from ElevenLabs to database
export const syncElevenLabsVoices = async () => {
  const voices = await getElevenLabsVoices();

  const results = {
    added: 0,
    updated: 0,
    total: voices.length,
  };

  for (const voice of voices) {
    const existing = await prisma.elevenlabs_voices.findUnique({
      where: { voiceId: voice.voice_id },
    });

    if (existing) {
      await prisma.elevenlabs_voices.update({
        where: { voiceId: voice.voice_id },
        data: {
          name: voice.name,
          description: voice.description,
          category: voice.category,
          labels: voice.labels,
          previewUrl: voice.preview_url,
        },
      });
      results.updated++;
    } else {
      await prisma.elevenlabs_voices.create({
        data: {
          voiceId: voice.voice_id,
          name: voice.name,
          description: voice.description,
          category: voice.category,
          labels: voice.labels,
          previewUrl: voice.preview_url,
        },
      });
      results.added++;
    }
  }

  return results;
};

// Get voice from database
export const getVoice = async (voiceId: string) => {
  return prisma.elevenlabs_voices.findUnique({
    where: { voiceId },
  });
};

// Get all active voices
export const getActiveVoices = async (yogaCategory?: string) => {
  return prisma.elevenlabs_voices.findMany({
    where: {
      isActive: true,
      ...(yogaCategory && { yogaCategory }),
    },
    orderBy: { name: 'asc' },
  });
};

// Generate speech with ElevenLabs
export const generateElevenLabsSpeech = async (
  text: string,
  options: ElevenLabsTTSOptions,
  userId?: string
): Promise<{
  buffer: Buffer;
  format: string;
  duration: number;
}> => {
  const startTime = Date.now();
  const modelId = options.modelId || 'eleven_multilingual_v2';
  const outputFormat = options.outputFormat || 'mp3_44100_128';

  // Get voice settings from DB or use defaults
  const voice = await getVoice(options.voiceId);

  const voiceSettings = {
    stability: options.voiceSettings?.stability ?? voice?.stability ?? 0.5,
    similarity_boost: options.voiceSettings?.similarityBoost ?? voice?.similarityBoost ?? 0.75,
    style: options.voiceSettings?.style ?? voice?.style ?? 0,
    use_speaker_boost: options.voiceSettings?.useSpeakerBoost ?? voice?.useSpeakerBoost ?? true,
  };

  try {
    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${options.voiceId}?output_format=${outputFormat}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: voiceSettings,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const latencyMs = Date.now() - startTime;
    const buffer = Buffer.from(await response.arrayBuffer());

    // Estimate duration (~150 words per minute)
    const wordCount = text.split(/\s+/).length;
    const estimatedDuration = (wordCount / 150) * 60;

    // Track usage
    await trackUsage(userId, AIServiceType.TEXT_TO_SPEECH, {
      provider: AIProvider.ELEVEN_LABS,
      model: modelId,
      audioCharacters: text.length,
      audioDuration: estimatedDuration,
      latencyMs,
      status: AIRequestStatus.SUCCESS,
    });

    return {
      buffer,
      format: outputFormat.startsWith('mp3') ? 'mp3' : 'pcm',
      duration: estimatedDuration,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    await trackUsage(userId, AIServiceType.TEXT_TO_SPEECH, {
      provider: AIProvider.ELEVEN_LABS,
      model: modelId,
      audioCharacters: text.length,
      latencyMs,
      status: AIRequestStatus.FAILED,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
};

// Generate speech and save to storage
export const generateElevenLabsSpeechAndSave = async (
  text: string,
  options: ElevenLabsTTSOptions,
  userId?: string
): Promise<{
  audioUrl: string;
  format: string;
  duration: number;
  fileSize: number;
}> => {
  const result = await generateElevenLabsSpeech(text, options, userId);

  // Generate unique key
  const timestamp = Date.now();
  const key = `elevenlabs/${userId || 'system'}/${timestamp}.${result.format}`;

  // Upload to S3
  const contentType = result.format === 'mp3' ? 'audio/mpeg' : 'audio/wav';
  await uploadFile(key, result.buffer, contentType);

  const audioUrl = await getSignedUrl(key, 3600 * 24); // 24 hours

  return {
    audioUrl,
    format: result.format,
    duration: result.duration,
    fileSize: result.buffer.length,
  };
};

// Create ElevenLabs job
export const createElevenLabsJob = async (data: {
  text: string;
  voiceId: string;
  modelId?: string;
  voiceSettings?: ElevenLabsVoiceSettings;
  entityType?: string;
  entityId?: string;
  userId: string;
}) => {
  const voice = await getVoice(data.voiceId);
  if (!voice) {
    throw new Error('Voice not found');
  }

  // Estimate cost (~$0.30 per 1000 characters for standard)
  const estimatedCost = (data.text.length / 1000) * 0.30;

  return prisma.elevenlabs_jobs.create({
    data: {
      voiceId: voice.id,
      text: data.text,
      modelId: data.modelId || 'eleven_multilingual_v2',
      stability: data.voiceSettings?.stability ?? voice.stability,
      similarityBoost: data.voiceSettings?.similarityBoost ?? voice.similarityBoost,
      style: data.voiceSettings?.style ?? voice.style,
      useSpeakerBoost: data.voiceSettings?.useSpeakerBoost ?? voice.useSpeakerBoost,
      characters: data.text.length,
      estimatedCost,
      status: VoiceJobStatus.PENDING,
      entityType: data.entityType,
      entityId: data.entityId,
      createdById: data.userId,
    },
  });
};

// Process ElevenLabs job
export const processElevenLabsJob = async (jobId: string) => {
  const job = await prisma.elevenlabs_jobs.findUnique({
    where: { id: jobId },
    include: { elevenlabs_voices: true },
  });

  if (!job) {
    throw new Error('ElevenLabs job not found');
  }

  // Update status to processing
  await prisma.elevenlabs_jobs.update({
    where: { id: jobId },
    data: {
      status: VoiceJobStatus.PROCESSING,
      startedAt: new Date(),
    },
  });

  try {
    const result = await generateElevenLabsSpeechAndSave(
      job.text,
      {
        voiceId: job.elevenlabs_voices.voiceId,
        modelId: job.modelId,
        voiceSettings: {
          stability: job.stability,
          similarityBoost: job.similarityBoost,
          style: job.style || undefined,
          useSpeakerBoost: job.useSpeakerBoost,
        },
      },
      job.createdById
    );

    // Update job with result
    await prisma.elevenlabs_jobs.update({
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
    await prisma.elevenlabs_jobs.update({
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

// Get ElevenLabs job
export const getElevenLabsJob = async (jobId: string) => {
  return prisma.elevenlabs_jobs.findUnique({
    where: { id: jobId },
    include: { elevenlabs_voices: true },
  });
};

// Get user's ElevenLabs jobs
export const getUserElevenLabsJobs = async (
  userId: string,
  status?: VoiceJobStatus
) => {
  return prisma.elevenlabs_jobs.findMany({
    where: {
      createdById: userId,
      ...(status && { status }),
    },
    include: { elevenlabs_voices: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
};

// Process pending ElevenLabs jobs (cron job)
export const processPendingElevenLabsJobs = async () => {
  const pendingJobs = await prisma.elevenlabs_jobs.findMany({
    where: { status: VoiceJobStatus.PENDING },
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
      await processElevenLabsJob(job.id);
      results.succeeded++;
      // Rate limiting - wait between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      results.failed++;
      console.error(`Failed to process ElevenLabs job ${job.id}:`, error);
    }
  }

  return results;
};

// Get usage statistics
export const getElevenLabsUsageStats = async (
  startDate: Date,
  endDate: Date
) => {
  const jobs = await prisma.elevenlabs_jobs.findMany({
    where: {
      status: VoiceJobStatus.COMPLETED,
      completedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      characters: true,
      duration: true,
      estimatedCost: true,
    },
  });

  return {
    totalJobs: jobs.length,
    totalCharacters: jobs.reduce((sum, j) => sum + j.characters, 0),
    totalDuration: jobs.reduce((sum, j) => sum + (j.duration || 0), 0),
    totalCost: jobs.reduce((sum, j) => sum + (j.estimatedCost || 0), 0),
  };
};

// Set voice yoga category
export const setVoiceYogaCategory = async (
  voiceId: string,
  yogaCategory: string
) => {
  return prisma.elevenlabs_voices.update({
    where: { voiceId },
    data: { yogaCategory },
  });
};

// Get recommended voice for yoga context
export const getRecommendedVoice = async (
  yogaCategory: 'meditation' | 'instruction' | 'motivation'
) => {
  // First try to get a voice with matching category
  let voice = await prisma.elevenlabs_voices.findFirst({
    where: {
      isActive: true,
      yogaCategory,
    },
  });

  // If no match, get default voice
  if (!voice) {
    voice = await prisma.elevenlabs_voices.findFirst({
      where: {
        isActive: true,
        isDefault: true,
      },
    });
  }

  // If still no match, get any active voice
  if (!voice) {
    voice = await prisma.elevenlabs_voices.findFirst({
      where: { isActive: true },
    });
  }

  return voice;
};
