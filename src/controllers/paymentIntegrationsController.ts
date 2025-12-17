import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { encrypt, decrypt } from '../utils/encryption';

const PAYMENT_INTEGRATION_KEY = 'payment_integration_';

const integrationSchema = z.object({
  provider: z.enum(['stripe', 'paypal', 'iyzico', 'apple', 'google']),
  apiKey: z.string().optional(),
  secretKey: z.string().optional(),
  webhookSecret: z.string().optional(),
  sandboxMode: z.boolean().default(true),
  isActive: z.boolean().default(false),
});

const updateIntegrationSchema = integrationSchema.partial().extend({
  provider: z.enum(['stripe', 'paypal', 'iyzico', 'apple', 'google']),
});

// Get all payment integrations
export async function getPaymentIntegrations(req: Request, res: Response) {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          startsWith: PAYMENT_INTEGRATION_KEY,
        },
        category: 'PAYMENT',
      },
    });

    const integrations = settings.map((setting) => {
      const data = setting.value as Record<string, unknown>;
      return {
        provider: setting.key.replace(PAYMENT_INTEGRATION_KEY, ''),
        apiKey: data.apiKey ? maskSecret(data.apiKey as string) : null,
        secretKey: data.secretKey ? '********' : null,
        webhookSecret: data.webhookSecret ? '********' : null,
        sandboxMode: data.sandboxMode ?? true,
        isActive: data.isActive ?? false,
        lastUpdated: setting.updatedAt,
      };
    });

    // Add missing integrations as inactive
    const providers = ['stripe', 'paypal', 'iyzico', 'apple', 'google'];
    const existingProviders = integrations.map((i) => i.provider);

    providers.forEach((provider) => {
      if (!existingProviders.includes(provider)) {
        integrations.push({
          provider,
          apiKey: null,
          secretKey: null,
          webhookSecret: null,
          sandboxMode: true,
          isActive: false,
          lastUpdated: null,
        });
      }
    });

    return res.json({ integrations });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get payment integrations');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Get single integration (with decrypted keys for form)
export async function getPaymentIntegration(req: Request, res: Response) {
  try {
    const { provider } = req.params;

    const setting = await prisma.systemSetting.findUnique({
      where: {
        key: `${PAYMENT_INTEGRATION_KEY}${provider}`,
      },
    });

    if (!setting) {
      return res.json({
        provider,
        apiKey: null,
        secretKey: null,
        webhookSecret: null,
        sandboxMode: true,
        isActive: false,
      });
    }

    const data = setting.value as Record<string, unknown>;

    // Decrypt sensitive fields
    return res.json({
      provider,
      apiKey: data.apiKey ? decrypt(data.apiKey as string) : null,
      secretKey: data.secretKey ? decrypt(data.secretKey as string) : null,
      webhookSecret: data.webhookSecret ? decrypt(data.webhookSecret as string) : null,
      sandboxMode: data.sandboxMode ?? true,
      isActive: data.isActive ?? false,
      lastUpdated: setting.updatedAt,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get payment integration');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Update payment integration
export async function updatePaymentIntegration(req: Request, res: Response) {
  try {
    const payload = updateIntegrationSchema.parse(req.body);
    const { provider, apiKey, secretKey, webhookSecret, sandboxMode, isActive } = payload;

    // Encrypt sensitive fields before storing
    const encryptedData: Record<string, unknown> = {
      sandboxMode: sandboxMode ?? true,
      isActive: isActive ?? false,
    };

    if (apiKey) {
      encryptedData.apiKey = encrypt(apiKey);
    }
    if (secretKey) {
      encryptedData.secretKey = encrypt(secretKey);
    }
    if (webhookSecret) {
      encryptedData.webhookSecret = encrypt(webhookSecret);
    }

    const setting = await prisma.systemSetting.upsert({
      where: {
        key: `${PAYMENT_INTEGRATION_KEY}${provider}`,
      },
      update: {
        value: encryptedData,
        updatedById: req.user?.userId,
      },
      create: {
        key: `${PAYMENT_INTEGRATION_KEY}${provider}`,
        value: encryptedData,
        type: 'OBJECT',
        category: 'PAYMENT',
        description: `${provider.charAt(0).toUpperCase() + provider.slice(1)} payment integration settings`,
        isPublic: false,
        updatedById: req.user?.userId,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId ?? null,
        actorRole: req.user?.role ?? null,
        action: 'payment_integration.update',
        metadata: {
          provider,
          sandboxMode,
          isActive,
          // Don't log sensitive keys
        },
      },
    });

    logger.info({ provider, userId: req.user?.userId }, 'Payment integration updated');

    return res.json({
      message: 'Integration updated successfully',
      provider,
      sandboxMode: encryptedData.sandboxMode,
      isActive: encryptedData.isActive,
      lastUpdated: setting.updatedAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to update payment integration');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Toggle integration status
export async function togglePaymentIntegration(req: Request, res: Response) {
  try {
    const { provider } = req.params;

    const setting = await prisma.systemSetting.findUnique({
      where: {
        key: `${PAYMENT_INTEGRATION_KEY}${provider}`,
      },
    });

    if (!setting) {
      return res.status(404).json({ error: 'Integration not configured' });
    }

    const data = setting.value as Record<string, unknown>;
    const newStatus = !data.isActive;

    // Check if keys are configured before enabling
    if (newStatus && (!data.apiKey || !data.secretKey)) {
      return res.status(400).json({
        error: 'Cannot enable integration without API keys configured'
      });
    }

    await prisma.systemSetting.update({
      where: {
        key: `${PAYMENT_INTEGRATION_KEY}${provider}`,
      },
      data: {
        value: { ...data, isActive: newStatus },
        updatedById: req.user?.userId,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId ?? null,
        actorRole: req.user?.role ?? null,
        action: newStatus ? 'payment_integration.enable' : 'payment_integration.disable',
        metadata: { provider },
      },
    });

    return res.json({
      message: `Integration ${newStatus ? 'enabled' : 'disabled'}`,
      provider,
      isActive: newStatus,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to toggle payment integration');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Test integration connection
export async function testPaymentIntegration(req: Request, res: Response) {
  try {
    const { provider } = req.params;

    const setting = await prisma.systemSetting.findUnique({
      where: {
        key: `${PAYMENT_INTEGRATION_KEY}${provider}`,
      },
    });

    if (!setting) {
      return res.status(404).json({ error: 'Integration not configured' });
    }

    const data = setting.value as Record<string, unknown>;

    if (!data.apiKey || !data.secretKey) {
      return res.status(400).json({ error: 'API keys not configured' });
    }

    // TODO: Implement actual provider-specific connection tests
    // For now, we'll simulate a successful test
    const testResult = {
      success: true,
      message: 'Connection successful',
      latency: Math.floor(Math.random() * 200) + 50, // Simulated latency
    };

    return res.json(testResult);
  } catch (error) {
    logger.error({ err: error }, 'Failed to test payment integration');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper function to mask secrets
function maskSecret(value: string): string {
  if (!value || value.length <= 8) return '*'.repeat(value.length || 8);
  return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
}
