import OpenAI from 'openai';
import { PrismaClient, Prisma, AIProvider, AIServiceType, AIRequestStatus } from '@prisma/client';

const prisma = new PrismaClient();

// OpenAI client singleton
let openaiClient: OpenAI | null = null;

// Get OpenAI client
export const getClient = (): OpenAI => {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    openaiClient = new OpenAI({
      apiKey,
      organization: process.env.OPENAI_ORG_ID,
    });
  }

  return openaiClient;
};

// Chat completion
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
}

export const chatCompletion = async (
  messages: ChatMessage[],
  options: ChatCompletionOptions = {},
  userId?: string
): Promise<{
  content: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
}> => {
  const client = getClient();
  const startTime = Date.now();

  const model = options.model || process.env.OPENAI_MODEL_CHAT || 'gpt-4-turbo-preview';

  try {
    const response = await client.chat.completions.create({
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1000,
      top_p: options.topP ?? 1,
      frequency_penalty: options.frequencyPenalty ?? 0,
      presence_penalty: options.presencePenalty ?? 0,
      stop: options.stop,
    });

    const latencyMs = Date.now() - startTime;

    const usage = {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    };

    // Track usage
    await trackUsage(userId, AIServiceType.CHAT_COMPLETION, {
      provider: AIProvider.OPENAI,
      model,
      ...usage,
      latencyMs,
      status: AIRequestStatus.SUCCESS,
    });

    return {
      content: response.choices[0]?.message?.content || '',
      usage,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    await trackUsage(userId, AIServiceType.CHAT_COMPLETION, {
      provider: AIProvider.OPENAI,
      model,
      latencyMs,
      status: AIRequestStatus.FAILED,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
};

// Chat completion with retry
export const chatCompletionWithRetry = async (
  messages: ChatMessage[],
  options: ChatCompletionOptions = {},
  maxRetries: number = 3,
  userId?: string
): Promise<{
  content: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
}> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await chatCompletion(messages, options, userId);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Check if rate limited
      if (isRateLimitError(error)) {
        const waitTime = getRetryAfter(error) || Math.pow(2, attempt) * 1000;
        await sleep(waitTime);
        continue;
      }

      // For other errors, don't retry
      throw error;
    }
  }

  throw lastError || new Error('Max retries exceeded');
};

// Create embedding
export const createEmbedding = async (
  text: string,
  userId?: string
): Promise<number[]> => {
  const client = getClient();
  const model = process.env.OPENAI_MODEL_EMBEDDING || 'text-embedding-ada-002';
  const startTime = Date.now();

  try {
    const response = await client.embeddings.create({
      model,
      input: text,
    });

    const latencyMs = Date.now() - startTime;

    await trackUsage(userId, AIServiceType.EMBEDDING, {
      provider: AIProvider.OPENAI,
      model,
      totalTokens: response.usage?.total_tokens || 0,
      latencyMs,
      status: AIRequestStatus.SUCCESS,
    });

    return response.data[0]!.embedding;
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    await trackUsage(userId, AIServiceType.EMBEDDING, {
      provider: AIProvider.OPENAI,
      model,
      latencyMs,
      status: AIRequestStatus.FAILED,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
};

// Create multiple embeddings
export const createEmbeddings = async (
  texts: string[],
  userId?: string
): Promise<number[][]> => {
  const client = getClient();
  const model = process.env.OPENAI_MODEL_EMBEDDING || 'text-embedding-ada-002';
  const startTime = Date.now();

  try {
    const response = await client.embeddings.create({
      model,
      input: texts,
    });

    const latencyMs = Date.now() - startTime;

    await trackUsage(userId, AIServiceType.EMBEDDING, {
      provider: AIProvider.OPENAI,
      model,
      totalTokens: response.usage?.total_tokens || 0,
      latencyMs,
      status: AIRequestStatus.SUCCESS,
    });

    return response.data.map((d) => d.embedding);
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    await trackUsage(userId, AIServiceType.EMBEDDING, {
      provider: AIProvider.OPENAI,
      model,
      latencyMs,
      status: AIRequestStatus.FAILED,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
};

// Content moderation
export const moderateContent = async (
  text: string,
  userId?: string
): Promise<{
  flagged: boolean;
  categories: Record<string, boolean>;
  categoryScores: Record<string, number>;
}> => {
  const client = getClient();
  const startTime = Date.now();

  try {
    const response = await client.moderations.create({
      input: text,
    });

    const latencyMs = Date.now() - startTime;

    await trackUsage(userId, AIServiceType.MODERATION, {
      provider: AIProvider.OPENAI,
      model: 'text-moderation-latest',
      latencyMs,
      status: AIRequestStatus.SUCCESS,
    });

    const result = response.results[0]!;
    return {
      flagged: result.flagged,
      categories: result.categories as unknown as Record<string, boolean>,
      categoryScores: result.category_scores as unknown as Record<string, number>,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    await trackUsage(userId, AIServiceType.MODERATION, {
      provider: AIProvider.OPENAI,
      model: 'text-moderation-latest',
      latencyMs,
      status: AIRequestStatus.FAILED,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
};

// Track AI usage
export const trackUsage = async (
  userId: string | undefined,
  service: AIServiceType,
  data: {
    provider: AIProvider;
    model: string;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    audioDuration?: number;
    audioCharacters?: number;
    latencyMs?: number;
    status: AIRequestStatus;
    errorMessage?: string;
    metadata?: Record<string, unknown>;
  }
) => {
  // Estimate cost
  const estimatedCost = calculateCost(
    data.provider,
    data.model,
    service,
    {
      promptTokens: data.promptTokens,
      completionTokens: data.completionTokens,
      audioDuration: data.audioDuration,
      audioCharacters: data.audioCharacters,
    }
  );

  await prisma.ai_usage_logs.create({
    data: {
      userId,
      provider: data.provider,
      model: data.model,
      service,
      promptTokens: data.promptTokens,
      completionTokens: data.completionTokens,
      totalTokens: data.totalTokens,
      audioDuration: data.audioDuration,
      audioCharacters: data.audioCharacters,
      estimatedCost,
      latencyMs: data.latencyMs,
      status: data.status,
      errorMessage: data.errorMessage,
      metadata: data.metadata as Prisma.InputJsonValue | undefined,
    },
  });
};

// Calculate cost based on model and usage
const calculateCost = (
  provider: AIProvider,
  model: string,
  service: AIServiceType,
  usage: {
    promptTokens?: number;
    completionTokens?: number;
    audioDuration?: number;
    audioCharacters?: number;
  }
): number => {
  // OpenAI pricing (as of 2024)
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4-turbo-preview': { input: 0.01 / 1000, output: 0.03 / 1000 },
    'gpt-4': { input: 0.03 / 1000, output: 0.06 / 1000 },
    'gpt-3.5-turbo': { input: 0.0005 / 1000, output: 0.0015 / 1000 },
    'text-embedding-ada-002': { input: 0.0001 / 1000, output: 0 },
    'whisper-1': { input: 0.006 / 60, output: 0 }, // Per minute
    'tts-1': { input: 0.015 / 1000, output: 0 }, // Per 1000 characters
    'tts-1-hd': { input: 0.03 / 1000, output: 0 },
  };

  const modelPricing = pricing[model];
  if (!modelPricing) return 0;

  let cost = 0;

  if (service === AIServiceType.TEXT_TO_SPEECH && usage.audioCharacters) {
    cost = (usage.audioCharacters / 1000) * modelPricing.input;
  } else if (service === AIServiceType.SPEECH_TO_TEXT && usage.audioDuration) {
    cost = (usage.audioDuration / 60) * modelPricing.input;
  } else {
    cost =
      (usage.promptTokens || 0) * modelPricing.input +
      (usage.completionTokens || 0) * modelPricing.output;
  }

  return Math.round(cost * 1000000) / 1000000; // Round to 6 decimal places
};

// Rate limit handling
const isRateLimitError = (error: unknown): boolean => {
  if (error instanceof OpenAI.RateLimitError) return true;
  if (error instanceof Error && error.message.includes('rate_limit')) return true;
  return false;
};

const getRetryAfter = (error: unknown): number | null => {
  if (error instanceof OpenAI.RateLimitError) {
    const retryAfter = error.headers?.get?.('retry-after');
    if (retryAfter) {
      return parseInt(retryAfter) * 1000;
    }
  }
  return null;
};

// Utility
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Get AI configuration from database
export const getAIConfiguration = async (
  provider: AIProvider,
  model: string
) => {
  return prisma.ai_configurations.findUnique({
    where: {
      provider_model: { provider, model },
    },
  });
};

// Update AI configuration
export const updateAIConfiguration = async (
  provider: AIProvider,
  model: string,
  data: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    requestsPerMinute?: number;
    tokensPerMinute?: number;
    isActive?: boolean;
    isDefault?: boolean;
  }
) => {
  return prisma.ai_configurations.update({
    where: {
      provider_model: { provider, model },
    },
    data,
  });
};

// Seed default AI configurations
export const seedAIConfigurations = async () => {
  const configurations = [
    {
      provider: AIProvider.OPENAI,
      model: 'gpt-4-turbo-preview',
      temperature: 0.7,
      maxTokens: 1000,
      requestsPerMinute: 60,
      tokensPerMinute: 90000,
      costPerToken: 0.00001,
      isActive: true,
      isDefault: true,
    },
    {
      provider: AIProvider.OPENAI,
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 1000,
      requestsPerMinute: 60,
      tokensPerMinute: 90000,
      costPerToken: 0.0000005,
      isActive: true,
      isDefault: false,
    },
    {
      provider: AIProvider.OPENAI,
      model: 'text-embedding-ada-002',
      temperature: 0,
      maxTokens: 8191,
      requestsPerMinute: 60,
      tokensPerMinute: 350000,
      costPerToken: 0.0000001,
      isActive: true,
      isDefault: true,
    },
    {
      provider: AIProvider.OPENAI,
      model: 'whisper-1',
      temperature: 0,
      maxTokens: 0,
      requestsPerMinute: 50,
      tokensPerMinute: 0,
      costPerMinute: 0.006,
      isActive: true,
      isDefault: true,
    },
    {
      provider: AIProvider.OPENAI,
      model: 'tts-1',
      temperature: 0,
      maxTokens: 0,
      requestsPerMinute: 50,
      tokensPerMinute: 0,
      costPer1000Chars: 0.015,
      isActive: true,
      isDefault: true,
    },
  ];

  for (const config of configurations) {
    await prisma.ai_configurations.upsert({
      where: {
        provider_model: { provider: config.provider, model: config.model },
      },
      update: config,
      create: config,
    });
  }

  return configurations.length;
};
