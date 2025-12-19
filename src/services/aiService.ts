/**
 * AI Service
 * Provides AI capabilities using configured providers (OpenAI, ElevenLabs, Anthropic)
 * Credentials are loaded from integration_settings (encrypted in DB)
 */

import { integrationSettingsService } from './integrationSettingsService';
import { logger } from '../utils/logger';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatCompletionOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

interface TTSOptions {
  voiceId?: string;
  modelId?: string;
  outputFormat?: 'mp3_44100_128' | 'mp3_22050_32' | 'pcm_16000' | 'pcm_22050';
}

interface AIProviderConfig {
  api_key: string;
  organization_id?: string;
  model?: string;
  voice_id?: string;
  model_id?: string;
}

/**
 * AI Service - Chat, Text Generation, TTS
 */
export const aiService = {
  /**
   * Check if AI provider is configured and active
   */
  async isProviderAvailable(provider: 'openai' | 'anthropic' | 'elevenlabs'): Promise<boolean> {
    try {
      const status = await integrationSettingsService.getProviderStatus('ai', provider);
      return status.isConfigured && status.isActive;
    } catch {
      return false;
    }
  },

  /**
   * Get AI provider config from DB
   */
  async getProviderConfig(provider: 'openai' | 'anthropic' | 'elevenlabs'): Promise<AIProviderConfig | null> {
    try {
      const config = await integrationSettingsService.getProviderConfig('ai', provider);
      if (!config.api_key) return null;
      return config as unknown as AIProviderConfig;
    } catch {
      return null;
    }
  },

  /**
   * Chat completion with OpenAI
   */
  async chatWithOpenAI(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {}
  ): Promise<string> {
    const config = await this.getProviderConfig('openai');
    if (!config) {
      throw new Error('OpenAI not configured. Please configure in Admin > Integrations');
    }

    try {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({
        apiKey: config.api_key,
        organization: config.organization_id || undefined,
      });

      const allMessages = options.systemPrompt
        ? [{ role: 'system' as const, content: options.systemPrompt }, ...messages]
        : messages;

      const response = await openai.chat.completions.create({
        model: options.model || config.model || 'gpt-4o-mini',
        messages: allMessages,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      logger.error({ err: error }, 'OpenAI chat completion failed');
      throw error;
    }
  },

  /**
   * Chat completion with Anthropic (Claude)
   */
  async chatWithAnthropic(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {}
  ): Promise<string> {
    const config = await this.getProviderConfig('anthropic');
    if (!config) {
      throw new Error('Anthropic not configured. Please configure in Admin > Integrations');
    }

    try {
      // Filter out system messages and use as system parameter
      const systemMessage = messages.find((m) => m.role === 'system')?.content || options.systemPrompt;
      const chatMessages = messages.filter((m) => m.role !== 'system');

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.api_key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: options.model || config.model || 'claude-3-5-sonnet-20241022',
          max_tokens: options.maxTokens || 1000,
          system: systemMessage,
          messages: chatMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json() as any;
        throw new Error(error.error?.message || 'Anthropic API error');
      }

      const data = await response.json() as any;
      return data.content[0]?.text || '';
    } catch (error) {
      logger.error({ err: error }, 'Anthropic chat completion failed');
      throw error;
    }
  },

  /**
   * Smart chat - uses available provider (prefers OpenAI, falls back to Anthropic)
   */
  async chat(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {}
  ): Promise<{ response: string; provider: string }> {
    // Try OpenAI first
    if (await this.isProviderAvailable('openai')) {
      const response = await this.chatWithOpenAI(messages, options);
      return { response, provider: 'openai' };
    }

    // Fall back to Anthropic
    if (await this.isProviderAvailable('anthropic')) {
      const response = await this.chatWithAnthropic(messages, options);
      return { response, provider: 'anthropic' };
    }

    throw new Error('No AI chat provider configured. Please configure OpenAI or Anthropic in Admin > Integrations');
  },

  /**
   * Text-to-Speech with ElevenLabs
   */
  async textToSpeech(
    text: string,
    options: TTSOptions = {}
  ): Promise<Buffer> {
    const config = await this.getProviderConfig('elevenlabs');
    if (!config) {
      throw new Error('ElevenLabs not configured. Please configure in Admin > Integrations');
    }

    try {
      const voiceId = options.voiceId || config.voice_id || '21m00Tcm4TlvDq8ikWAM'; // Rachel default
      const modelId = options.modelId || config.model_id || 'eleven_multilingual_v2';

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': config.api_key,
          },
          body: JSON.stringify({
            text,
            model_id: modelId,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as any).detail?.message || 'ElevenLabs API error');
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      logger.error({ err: error }, 'ElevenLabs TTS failed');
      throw error;
    }
  },

  /**
   * Generate meditation guidance text
   */
  async generateMeditationGuidance(
    type: 'breathing' | 'body_scan' | 'mindfulness' | 'sleep' | 'stress_relief',
    durationMinutes: number = 10,
    language: string = 'tr'
  ): Promise<string> {
    const prompts: Record<string, string> = {
      breathing: `${durationMinutes} dakikalik bir nefes meditasyonu metni yaz. Sakin, huzurlu ve yonlendirici bir dil kullan. Turkce olsun.`,
      body_scan: `${durationMinutes} dakikalik bir vucut tarama meditasyonu metni yaz. Basdan ayaga kadar butun vucut bolumlerini icersin. Turkce olsun.`,
      mindfulness: `${durationMinutes} dakikalik bir farkindahk meditasyonu metni yaz. Simdi ve burada olmaya odaklan. Turkce olsun.`,
      sleep: `${durationMinutes} dakikalik bir uyku meditasyonu metni yaz. Rahatlatici ve uyku getirici olsun. Turkce olsun.`,
      stress_relief: `${durationMinutes} dakikalik bir stres giderme meditasyonu metni yaz. Kaygıyi azaltan teknikleri icersin. Turkce olsun.`,
    };

    const systemPrompt = `Sen profesyonel bir meditasyon egitmenisin.
Meditasyon metinleri yazarken:
- Sakin ve huzurlu bir ton kullan
- Basit ve anlasilir cumler kur
- Duraklamalar icin "..." kullan
- Nefes direktifleri ver
- Pozitif ve destekleyici ol`;

    const { response } = await this.chat(
      [{ role: 'user', content: prompts[type] || '' }],
      { systemPrompt, maxTokens: 2000 }
    );

    return response;
  },

  /**
   * Generate personalized yoga recommendation
   */
  async generateYogaRecommendation(
    userProfile: {
      level: 'beginner' | 'intermediate' | 'advanced';
      goals: string[];
      preferences: string[];
      recentSessions?: string[];
    }
  ): Promise<{ recommendation: string; suggestedPrograms: string[] }> {
    const systemPrompt = `Sen uzman bir yoga egitmenisin. Kullanicinin profiline gore kisisellestirilmis yoga onerileri ver.
JSON formatinda yanit ver: { "recommendation": "...", "suggestedPrograms": ["program1", "program2"] }`;

    const userMessage = `
Kullanici Profili:
- Seviye: ${userProfile.level}
- Hedefler: ${userProfile.goals.join(', ')}
- Tercihler: ${userProfile.preferences.join(', ')}
${userProfile.recentSessions ? `- Son seanslar: ${userProfile.recentSessions.join(', ')}` : ''}

Bu kullanici icin kisisellestirilmis oneri ver.`;

    const { response } = await this.chat(
      [{ role: 'user', content: userMessage }],
      { systemPrompt, maxTokens: 500 }
    );

    try {
      return JSON.parse(response);
    } catch {
      return { recommendation: response, suggestedPrograms: [] };
    }
  },

  /**
   * Analyze mood from journal entry
   */
  async analyzeMood(journalEntry: string): Promise<{
    mood: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    suggestions: string[];
  }> {
    const systemPrompt = `Kullanicinin gunluk girisini analiz et ve ruh halini belirle.
JSON formatinda yanit ver: { "mood": "mutlu/uzgun/kaygi/huzurlu/vs", "sentiment": "positive/neutral/negative", "suggestions": ["oneri1", "oneri2"] }`;

    const { response } = await this.chat(
      [{ role: 'user', content: `Gunluk girisi: "${journalEntry}"` }],
      { systemPrompt, maxTokens: 300 }
    );

    try {
      return JSON.parse(response);
    } catch {
      return { mood: 'belirsiz', sentiment: 'neutral', suggestions: [] };
    }
  },

  /**
   * Get available AI capabilities based on configured providers
   */
  async getAvailableCapabilities(): Promise<{
    chat: boolean;
    tts: boolean;
    providers: {
      openai: boolean;
      anthropic: boolean;
      elevenlabs: boolean;
    };
  }> {
    const [openai, anthropic, elevenlabs] = await Promise.all([
      this.isProviderAvailable('openai'),
      this.isProviderAvailable('anthropic'),
      this.isProviderAvailable('elevenlabs'),
    ]);

    return {
      chat: openai || anthropic,
      tts: elevenlabs,
      providers: { openai, anthropic, elevenlabs },
    };
  },
};
