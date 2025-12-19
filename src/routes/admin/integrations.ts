import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { integrationSettingsService } from '../../services/integrationSettingsService';
import { INTEGRATIONS, IntegrationCategory, IntegrationProvider } from '../../config/integrations';
import { integrationEncryption } from '../../services/integrationEncryptionService';
import { logger } from '../../utils/logger';

const router = Router();

// ============================================
// Validation Schemas
// ============================================

const updateProviderSchema = z.object({
  settings: z.record(z.string(), z.string()),
});

const toggleProviderSchema = z.object({
  isActive: z.boolean(),
});

// ============================================
// Helper Functions
// ============================================

function validateCategory(category: string): category is IntegrationCategory {
  return category in INTEGRATIONS;
}

function validateProvider(
  category: IntegrationCategory,
  provider: string
): provider is IntegrationProvider {
  return provider in (INTEGRATIONS[category] || {});
}

// ============================================
// Routes
// ============================================

/**
 * GET /admin/integrations
 * Get all integrations overview with status
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const overview = await integrationSettingsService.getAllIntegrationsOverview();

    // Add integration metadata from config
    const result: Record<string, any> = {};

    for (const [category, providers] of Object.entries(INTEGRATIONS)) {
      result[category] = {
        providers: {},
      };

      for (const [providerKey, providerDef] of Object.entries(providers)) {
        const status = overview[category]?.[providerKey] || {
          isActive: false,
          isConfigured: false,
          lastUpdated: null,
          configuredKeys: [],
          missingKeys: providerDef.fields.filter((f) => f.required).map((f) => f.key),
        };

        result[category].providers[providerKey] = {
          ...providerDef,
          status,
        };
      }
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get integrations overview');
    res.status(500).json({
      success: false,
      error: 'Failed to get integrations',
    });
  }
});

/**
 * GET /admin/integrations/categories
 * Get all available integration categories
 */
router.get('/categories', async (req: Request, res: Response) => {
  const categories = Object.keys(INTEGRATIONS).map((key) => ({
    key,
    label: getCategoryLabel(key),
    providerCount: Object.keys(INTEGRATIONS[key as IntegrationCategory]).length,
  }));

  res.json({
    success: true,
    data: categories,
  });
});

/**
 * GET /admin/integrations/:category
 * Get all providers for a category
 */
router.get('/:category', async (req: Request, res: Response) => {
  const { category } = req.params;

  if (!validateCategory(category)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid category',
    });
  }

  try {
    const providers = INTEGRATIONS[category];
    const result: Record<string, any> = {};

    for (const [providerKey, providerDef] of Object.entries(providers)) {
      const status = await integrationSettingsService.getProviderStatus(
        category,
        providerKey
      );

      result[providerKey] = {
        ...providerDef,
        status,
      };
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error({ err: error, category }, 'Failed to get category providers');
    res.status(500).json({
      success: false,
      error: 'Failed to get providers',
    });
  }
});

/**
 * GET /admin/integrations/:category/:provider
 * Get provider configuration (masked values)
 */
router.get('/:category/:provider', async (req: Request, res: Response) => {
  const { category, provider } = req.params;

  if (!validateCategory(category)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid category',
    });
  }

  if (!validateProvider(category, provider)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid provider',
    });
  }

  try {
    const providerDef = INTEGRATIONS[category][provider as IntegrationProvider];
    const config = await integrationSettingsService.getProviderConfig(category, provider);
    const status = await integrationSettingsService.getProviderStatus(category, provider);

    // Mask sensitive values for display
    const maskedConfig: Record<string, string> = {};
    for (const field of providerDef.fields) {
      const value = config[field.key];
      if (value) {
        maskedConfig[field.key] =
          field.type === 'password' || field.type === 'secret'
            ? integrationEncryption.maskValue(value)
            : value;
      } else {
        maskedConfig[field.key] = '';
      }
    }

    res.json({
      success: true,
      data: {
        ...providerDef,
        config: maskedConfig,
        status,
      },
    });
  } catch (error) {
    logger.error({ err: error, category, provider }, 'Failed to get provider config');
    res.status(500).json({
      success: false,
      error: 'Failed to get provider configuration',
    });
  }
});

/**
 * PUT /admin/integrations/:category/:provider
 * Update provider configuration
 */
router.put('/:category/:provider', async (req: Request, res: Response) => {
  const { category, provider } = req.params;

  if (!validateCategory(category)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid category',
    });
  }

  if (!validateProvider(category, provider)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid provider',
    });
  }

  try {
    const parsed = updateProviderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: parsed.error.issues,
      });
    }

    const { settings } = parsed.data;
    const userId = (req as any).user?.id;

    // Filter out empty values and masked values (unchanged)
    const filteredSettings: Record<string, string> = {};
    for (const [key, value] of Object.entries(settings)) {
      if (value && !value.includes('••••')) {
        filteredSettings[key] = value;
      }
    }

    if (Object.keys(filteredSettings).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid settings to update',
      });
    }

    await integrationSettingsService.updateProviderConfig(
      category,
      provider,
      filteredSettings,
      userId
    );

    const status = await integrationSettingsService.getProviderStatus(category, provider);

    res.json({
      success: true,
      message: 'Provider configuration updated',
      data: { status },
    });
  } catch (error) {
    logger.error({ err: error, category, provider }, 'Failed to update provider config');
    res.status(500).json({
      success: false,
      error: 'Failed to update configuration',
    });
  }
});

/**
 * POST /admin/integrations/:category/:provider/test
 * Test provider connection
 */
router.post('/:category/:provider/test', async (req: Request, res: Response) => {
  const { category, provider } = req.params;

  if (!validateCategory(category)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid category',
    });
  }

  if (!validateProvider(category, provider)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid provider',
    });
  }

  const providerDef = INTEGRATIONS[category][provider as IntegrationProvider];
  if (!providerDef.testable) {
    return res.status(400).json({
      success: false,
      error: 'Connection test not supported for this provider',
    });
  }

  try {
    const userId = (req as any).user?.id;
    const result = await integrationSettingsService.testConnection(
      category,
      provider,
      userId
    );

    res.json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    logger.error({ err: error, category, provider }, 'Failed to test connection');
    res.status(500).json({
      success: false,
      error: 'Connection test failed',
    });
  }
});

/**
 * PATCH /admin/integrations/:category/:provider/toggle
 * Toggle provider active status
 */
router.patch('/:category/:provider/toggle', async (req: Request, res: Response) => {
  const { category, provider } = req.params;

  if (!validateCategory(category)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid category',
    });
  }

  if (!validateProvider(category, provider)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid provider',
    });
  }

  try {
    const parsed = toggleProviderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: parsed.error.issues,
      });
    }

    const { isActive } = parsed.data;
    const userId = (req as any).user?.id;

    await integrationSettingsService.toggleProvider(category, provider, isActive, userId);

    res.json({
      success: true,
      message: isActive ? 'Provider enabled' : 'Provider disabled',
    });
  } catch (error) {
    logger.error({ err: error, category, provider }, 'Failed to toggle provider');
    res.status(500).json({
      success: false,
      error: 'Failed to toggle provider status',
    });
  }
});

/**
 * DELETE /admin/integrations/:category/:provider
 * Delete all provider settings
 */
router.delete('/:category/:provider', async (req: Request, res: Response) => {
  const { category, provider } = req.params;

  if (!validateCategory(category)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid category',
    });
  }

  if (!validateProvider(category, provider)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid provider',
    });
  }

  try {
    const userId = (req as any).user?.id;
    await integrationSettingsService.deleteProviderConfig(category, provider, userId);

    res.json({
      success: true,
      message: 'Provider configuration deleted',
    });
  } catch (error) {
    logger.error({ err: error, category, provider }, 'Failed to delete provider config');
    res.status(500).json({
      success: false,
      error: 'Failed to delete configuration',
    });
  }
});

/**
 * GET /admin/integrations/logs
 * Get integration activity logs
 */
router.get('/logs/all', async (req: Request, res: Response) => {
  try {
    const { category, provider, action, limit, offset } = req.query;

    const result = await integrationSettingsService.getLogs({
      category: category as string,
      provider: provider as string,
      action: action as string,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: result.logs,
      pagination: {
        total: result.total,
        limit: limit ? parseInt(limit as string, 10) : 50,
        offset: offset ? parseInt(offset as string, 10) : 0,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get integration logs');
    res.status(500).json({
      success: false,
      error: 'Failed to get logs',
    });
  }
});

// ============================================
// Helper Functions
// ============================================

function getCategoryLabel(key: string): string {
  const labels: Record<string, string> = {
    auth: 'Authentication',
    notification: 'Push Notifications',
    sms: 'SMS Services',
    email: 'Email Services',
    payment: 'Payment Gateways',
    storage: 'Cloud Storage',
    streaming: 'Streaming & Media',
    monitoring: 'Monitoring & Analytics',
  };
  return labels[key] || key;
}

export default router;
