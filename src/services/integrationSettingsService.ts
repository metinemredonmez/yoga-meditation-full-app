import { prisma } from '../utils/database';
import { integrationEncryption } from './integrationEncryptionService';
import { logger } from '../utils/logger';
import { INTEGRATIONS, IntegrationCategory, IntegrationProvider } from '../config/integrations';

interface ProviderConfig {
  [key: string]: string;
}

interface ProviderStatus {
  isActive: boolean;
  isConfigured: boolean;
  lastUpdated: Date | null;
  configuredKeys: string[];
  missingKeys: string[];
}

/**
 * Integration Settings Service
 * Manages encrypted 3rd party service configurations
 */
export const integrationSettingsService = {
  /**
   * Get a single setting value
   */
  async get(
    category: string,
    provider: string,
    key: string
  ): Promise<string | null> {
    const setting = await prisma.integration_settings.findUnique({
      where: {
        category_provider_key: { category, provider, key },
      },
    });

    if (!setting || !setting.isActive) {
      return null;
    }

    try {
      return setting.isEncrypted
        ? integrationEncryption.decrypt(setting.value)
        : setting.value;
    } catch (error) {
      logger.error(
        { err: error, category, provider, key },
        'Failed to decrypt integration setting'
      );
      return null;
    }
  },

  /**
   * Set a single setting value
   */
  async set(
    category: string,
    provider: string,
    key: string,
    value: string,
    userId?: string,
    encrypt: boolean = true
  ): Promise<void> {
    const storedValue = encrypt
      ? integrationEncryption.encrypt(value)
      : value;

    await prisma.integration_settings.upsert({
      where: {
        category_provider_key: { category, provider, key },
      },
      update: {
        value: storedValue,
        isEncrypted: encrypt,
        updatedBy: userId,
        updatedAt: new Date(),
      },
      create: {
        category,
        provider,
        key,
        value: storedValue,
        isEncrypted: encrypt,
        updatedBy: userId,
      },
    });

    logger.info({ category, provider, key }, 'Integration setting updated');
  },

  /**
   * Get all settings for a provider (decrypted)
   */
  async getProviderConfig(
    category: string,
    provider: string
  ): Promise<ProviderConfig> {
    const settings = await prisma.integration_settings.findMany({
      where: { category, provider, isActive: true },
    });

    const config: ProviderConfig = {};

    for (const setting of settings) {
      try {
        config[setting.key] = setting.isEncrypted
          ? integrationEncryption.decrypt(setting.value)
          : setting.value;
      } catch (error) {
        logger.error(
          { err: error, key: setting.key },
          'Failed to decrypt setting'
        );
      }
    }

    return config;
  },

  /**
   * Update multiple settings for a provider
   */
  async updateProviderConfig(
    category: string,
    provider: string,
    settings: Record<string, string>,
    userId?: string
  ): Promise<void> {
    const operations = Object.entries(settings)
      .filter(([_, value]) => value !== undefined && value !== '')
      .map(([key, value]) =>
        prisma.integration_settings.upsert({
          where: {
            category_provider_key: { category, provider, key },
          },
          update: {
            value: integrationEncryption.encrypt(value),
            isEncrypted: true,
            updatedBy: userId,
            updatedAt: new Date(),
          },
          create: {
            category,
            provider,
            key,
            value: integrationEncryption.encrypt(value),
            isEncrypted: true,
            updatedBy: userId,
          },
        })
      );

    await prisma.$transaction(operations);

    // Log the update
    await prisma.integration_logs.create({
      data: {
        category,
        provider,
        action: 'update_config',
        status: 'success',
        message: `Updated ${Object.keys(settings).length} settings`,
        createdBy: userId,
      },
    });

    logger.info(
      { category, provider, keysUpdated: Object.keys(settings) },
      'Provider config updated'
    );
  },

  /**
   * Get provider status (configured keys, missing keys, etc.)
   */
  async getProviderStatus(
    category: string,
    provider: string
  ): Promise<ProviderStatus> {
    const settings = await prisma.integration_settings.findMany({
      where: { category, provider },
      select: {
        key: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Get required fields from integration config
    const integrationDef =
      INTEGRATIONS[category as IntegrationCategory]?.[provider as IntegrationProvider];
    const requiredKeys = integrationDef?.fields
      .filter((f) => f.required)
      .map((f) => f.key) || [];

    const configuredKeys = settings.map((s) => s.key);
    const missingKeys = requiredKeys.filter((k) => !configuredKeys.includes(k));
    const isActive = settings.length > 0 && settings.every((s) => s.isActive);
    const lastUpdated = settings.length > 0
      ? settings.reduce((latest, s) =>
          s.updatedAt > latest ? s.updatedAt : latest,
          settings[0]?.updatedAt || new Date()
        )
      : null;

    return {
      isActive,
      isConfigured: missingKeys.length === 0 && configuredKeys.length > 0,
      lastUpdated,
      configuredKeys,
      missingKeys,
    };
  },

  /**
   * Toggle provider active status
   */
  async toggleProvider(
    category: string,
    provider: string,
    isActive: boolean,
    userId?: string
  ): Promise<void> {
    await prisma.integration_settings.updateMany({
      where: { category, provider },
      data: { isActive },
    });

    await prisma.integration_logs.create({
      data: {
        category,
        provider,
        action: 'toggle_status',
        status: 'success',
        message: isActive ? 'Provider enabled' : 'Provider disabled',
        createdBy: userId,
      },
    });

    logger.info({ category, provider, isActive }, 'Provider status toggled');
  },

  /**
   * Delete all settings for a provider
   */
  async deleteProviderConfig(
    category: string,
    provider: string,
    userId?: string
  ): Promise<void> {
    await prisma.integration_settings.deleteMany({
      where: { category, provider },
    });

    await prisma.integration_logs.create({
      data: {
        category,
        provider,
        action: 'delete_config',
        status: 'success',
        message: 'All provider settings deleted',
        createdBy: userId,
      },
    });

    logger.info({ category, provider }, 'Provider config deleted');
  },

  /**
   * Get all integrations overview (for admin dashboard)
   */
  async getAllIntegrationsOverview(): Promise<
    Record<string, Record<string, ProviderStatus>>
  > {
    const allSettings = await prisma.integration_settings.findMany({
      select: {
        category: true,
        provider: true,
        key: true,
        isActive: true,
        updatedAt: true,
      },
    });

    const overview: Record<string, Record<string, ProviderStatus>> = {};

    // Initialize from INTEGRATIONS config
    for (const [category, providers] of Object.entries(INTEGRATIONS)) {
      overview[category] = {};

      for (const provider of Object.keys(providers)) {
        const providerSettings = allSettings.filter(
          (s) => s.category === category && s.provider === provider
        );

        const integrationDef =
          INTEGRATIONS[category as IntegrationCategory]?.[provider as IntegrationProvider];
        const requiredKeys = integrationDef?.fields
          .filter((f) => f.required)
          .map((f) => f.key) || [];

        const configuredKeys = providerSettings.map((s) => s.key);
        const missingKeys = requiredKeys.filter(
          (k) => !configuredKeys.includes(k)
        );

        overview[category][provider] = {
          isActive:
            providerSettings.length > 0 &&
            providerSettings.every((s) => s.isActive),
          isConfigured:
            missingKeys.length === 0 && configuredKeys.length > 0,
          lastUpdated:
            providerSettings.length > 0
              ? providerSettings.reduce(
                  (latest, s) => (s.updatedAt > latest ? s.updatedAt : latest),
                  providerSettings[0]?.updatedAt || new Date()
                )
              : null,
          configuredKeys,
          missingKeys,
        };
      }
    }

    return overview;
  },

  /**
   * Test connection to a provider
   */
  async testConnection(
    category: string,
    provider: string,
    userId?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const config = await this.getProviderConfig(category, provider);

      let result: { success: boolean; message: string };

      switch (provider) {
        case 'firebase':
          result = await testFirebaseConnection(config);
          break;

        case 'stripe':
          result = await testStripeConnection(config);
          break;

        case 'smtp':
          result = await testSMTPConnection(config);
          break;

        case 'twilio':
          result = await testTwilioConnection(config);
          break;

        case 'aws_s3':
          result = await testS3Connection(config);
          break;

        case 'sendgrid':
          result = await testSendGridConnection(config);
          break;

        case 'elasticsearch':
          result = await testElasticsearchConnection(config);
          break;

        case 'openai':
          result = await testOpenAIConnection(config);
          break;

        case 'elevenlabs':
          result = await testElevenLabsConnection(config);
          break;

        case 'anthropic':
          result = await testAnthropicConnection(config);
          break;

        default:
          result = {
            success: false,
            message: 'Connection test not supported for this provider',
          };
      }

      // Log the test result
      await prisma.integration_logs.create({
        data: {
          category,
          provider,
          action: 'test_connection',
          status: result.success ? 'success' : 'failed',
          message: result.message,
          createdBy: userId,
        },
      });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      await prisma.integration_logs.create({
        data: {
          category,
          provider,
          action: 'test_connection',
          status: 'failed',
          message: errorMessage,
          createdBy: userId,
        },
      });

      return { success: false, message: errorMessage };
    }
  },

  /**
   * Get integration logs
   */
  async getLogs(
    options: {
      category?: string;
      provider?: string;
      action?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const { category, provider, action, limit = 50, offset = 0 } = options;

    const where: any = {};
    if (category) where.category = category;
    if (provider) where.provider = provider;
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      prisma.integration_logs.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.integration_logs.count({ where }),
    ]);

    return { logs, total };
  },
};

// ============================================
// Provider Test Functions
// ============================================

async function testFirebaseConnection(
  config: ProviderConfig
): Promise<{ success: boolean; message: string }> {
  if (!config.project_id || !config.client_email || !config.private_key) {
    return { success: false, message: 'Missing Firebase configuration' };
  }

  try {
    const admin = await import('firebase-admin');

    // Check if already initialized
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.project_id,
          clientEmail: config.client_email,
          privateKey: config.private_key.replace(/\\n/g, '\n'),
        }),
      });
    }

    // Try a dry run
    await admin.messaging().send(
      {
        topic: 'test',
        notification: { title: 'Test', body: 'Test' },
      },
      true // dry run
    );

    return { success: true, message: 'Firebase bağlantısı başarılı' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: `Firebase hatası: ${msg}` };
  }
}

async function testStripeConnection(
  config: ProviderConfig
): Promise<{ success: boolean; message: string }> {
  if (!config.secret_key) {
    return { success: false, message: 'Missing Stripe secret key' };
  }

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(config.secret_key, { apiVersion: '2024-12-18.acacia' } as any);
    await stripe.balance.retrieve();
    return { success: true, message: 'Stripe bağlantısı başarılı' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: `Stripe hatası: ${msg}` };
  }
}

async function testSMTPConnection(
  config: ProviderConfig
): Promise<{ success: boolean; message: string }> {
  if (!config.host || !config.port || !config.user || !config.password) {
    return { success: false, message: 'Missing SMTP configuration' };
  }

  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: parseInt(config.port, 10),
      secure: parseInt(config.port, 10) === 465,
      auth: {
        user: config.user,
        pass: config.password,
      },
    });

    await transporter.verify();
    return { success: true, message: 'SMTP bağlantısı başarılı' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: `SMTP hatası: ${msg}` };
  }
}

async function testTwilioConnection(
  config: ProviderConfig
): Promise<{ success: boolean; message: string }> {
  if (!config.account_sid || !config.auth_token) {
    return { success: false, message: 'Missing Twilio configuration' };
  }

  try {
    const twilio = await import('twilio');
    const client = twilio.default(config.account_sid, config.auth_token);
    await client.api.accounts(config.account_sid).fetch();
    return { success: true, message: 'Twilio bağlantısı başarılı' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: `Twilio hatası: ${msg}` };
  }
}

async function testS3Connection(
  config: ProviderConfig
): Promise<{ success: boolean; message: string }> {
  if (!config.access_key || !config.secret_key || !config.region) {
    return { success: false, message: 'Missing AWS S3 configuration' };
  }

  try {
    const { S3Client, ListBucketsCommand } = await import('@aws-sdk/client-s3');
    const s3 = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.access_key,
        secretAccessKey: config.secret_key,
      },
    });

    await s3.send(new ListBucketsCommand({}));
    return { success: true, message: 'AWS S3 bağlantısı başarılı' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: `S3 hatası: ${msg}` };
  }
}

async function testSendGridConnection(
  config: ProviderConfig
): Promise<{ success: boolean; message: string }> {
  if (!config.api_key) {
    return { success: false, message: 'Missing SendGrid API key' };
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
      headers: {
        Authorization: `Bearer ${config.api_key}`,
      },
    });

    if (response.ok) {
      return { success: true, message: 'SendGrid bağlantısı başarılı' };
    } else {
      return { success: false, message: `SendGrid hatası: ${response.statusText}` };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: `SendGrid hatası: ${msg}` };
  }
}

async function testElasticsearchConnection(
  config: ProviderConfig
): Promise<{ success: boolean; message: string }> {
  if (!config.url) {
    return { success: false, message: 'Missing Elasticsearch URL' };
  }

  try {
    const { Client } = await import('@elastic/elasticsearch');
    const client = new Client({
      node: config.url,
      auth: config.username && config.password
        ? { username: config.username, password: config.password }
        : undefined,
    });

    await client.ping();
    return { success: true, message: 'Elasticsearch bağlantısı başarılı' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: `Elasticsearch hatası: ${msg}` };
  }
}

async function testOpenAIConnection(
  config: ProviderConfig
): Promise<{ success: boolean; message: string }> {
  if (!config.api_key) {
    return { success: false, message: 'Missing OpenAI API key' };
  }

  try {
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({
      apiKey: config.api_key,
      organization: config.organization_id || undefined,
    });

    // Simple models list check
    await openai.models.list();
    return { success: true, message: 'OpenAI bağlantısı başarılı' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: `OpenAI hatası: ${msg}` };
  }
}

async function testElevenLabsConnection(
  config: ProviderConfig
): Promise<{ success: boolean; message: string }> {
  if (!config.api_key) {
    return { success: false, message: 'Missing ElevenLabs API key' };
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/user', {
      headers: {
        'xi-api-key': config.api_key,
      },
    });

    if (response.ok) {
      return { success: true, message: 'ElevenLabs bağlantısı başarılı' };
    } else {
      return { success: false, message: `ElevenLabs hatası: ${response.statusText}` };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: `ElevenLabs hatası: ${msg}` };
  }
}

async function testAnthropicConnection(
  config: ProviderConfig
): Promise<{ success: boolean; message: string }> {
  if (!config.api_key) {
    return { success: false, message: 'Missing Anthropic API key' };
  }

  try {
    // Simple API check with minimal message
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.api_key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model || 'claude-3-5-sonnet-20241022',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });

    if (response.ok) {
      return { success: true, message: 'Anthropic bağlantısı başarılı' };
    } else {
      const error = await response.json().catch(() => ({}));
      return { success: false, message: `Anthropic hatası: ${(error as any).error?.message || response.statusText}` };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: `Anthropic hatası: ${msg}` };
  }
}
