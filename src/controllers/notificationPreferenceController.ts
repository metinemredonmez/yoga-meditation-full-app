import { Request, Response } from 'express';
import { ZodError } from 'zod';
import {
  updatePreferencesBodySchema,
  unsubscribeParamsSchema,
  unsubscribeQuerySchema,
  resubscribeBodySchema,
} from '../validation/notificationPreferenceSchemas';
import {
  getPreferences,
  updatePreferences,
  resetToDefaults,
  unsubscribeByToken,
  resubscribe,
  getAvailableOptions,
  isQuietHours,
} from '../services/notificationPreferenceService';
import { logger } from '../utils/logger';

/**
 * GET /api/notification-preferences
 * Get user's notification preferences
 */
export async function handleGetPreferences(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const preferences = await getPreferences(userId);
    const inQuietHours = await isQuietHours(userId);

    return res.json({
      success: true,
      data: {
        ...preferences,
        currentlyInQuietHours: inQuietHours,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get notification preferences');
    return res.status(500).json({ error: 'Failed to get notification preferences' });
  }
}

/**
 * PUT /api/notification-preferences
 * Update user's notification preferences
 */
export async function handleUpdatePreferences(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = updatePreferencesBodySchema.parse(req.body);
    // Filter out undefined values for strict types
    const cleanBody = Object.fromEntries(
      Object.entries(body).filter(([, v]) => v !== undefined),
    );
    const preferences = await updatePreferences(userId, cleanBody);

    return res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: preferences,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.issues.map((e) => ({
          field: String(e.path.join('.')),
          message: e.message,
        })),
      });
    }

    if (error instanceof Error && error.message.includes('Invalid')) {
      return res.status(400).json({ error: error.message });
    }

    logger.error({ err: error }, 'Failed to update notification preferences');
    return res.status(500).json({ error: 'Failed to update notification preferences' });
  }
}

/**
 * POST /api/notification-preferences/reset
 * Reset preferences to defaults
 */
export async function handleResetPreferences(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const preferences = await resetToDefaults(userId);

    return res.json({
      success: true,
      message: 'Notification preferences reset to defaults',
      data: preferences,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to reset notification preferences');
    return res.status(500).json({ error: 'Failed to reset notification preferences' });
  }
}

/**
 * GET /api/notification-preferences/options
 * Get available preference options (for frontend)
 */
export async function handleGetAvailableOptions(_req: Request, res: Response) {
  try {
    const options = getAvailableOptions();

    // Group options by category
    const grouped = {
      channels: options.filter((o) => o.category === 'channel'),
      marketing: options.filter((o) => o.category === 'marketing'),
      updates: options.filter((o) => o.category === 'updates'),
      reminders: options.filter((o) => o.category === 'reminders'),
      quietHours: options.filter((o) => o.category === 'quiet_hours'),
    };

    return res.json({
      success: true,
      data: {
        options,
        grouped,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get available options');
    return res.status(500).json({ error: 'Failed to get available options' });
  }
}

/**
 * GET /api/notification-preferences/unsubscribe/:token
 * Unsubscribe via email link (public endpoint)
 */
export async function handleUnsubscribe(req: Request, res: Response) {
  try {
    const { token } = unsubscribeParamsSchema.parse(req.params);
    const { type } = unsubscribeQuerySchema.parse(req.query);

    const result = await unsubscribeByToken(token, type);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message,
      });
    }

    return res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: 'Invalid request',
        details: error.issues.map((e) => ({
          field: String(e.path.join('.')),
          message: e.message,
        })),
      });
    }

    logger.error({ err: error }, 'Failed to process unsubscribe');
    return res.status(500).json({ error: 'Failed to process unsubscribe request' });
  }
}

/**
 * POST /api/notification-preferences/resubscribe
 * Resubscribe to a notification type
 */
export async function handleResubscribe(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { type } = resubscribeBodySchema.parse(req.body);
    const result = await resubscribe(userId, type);

    return res.json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.issues.map((e) => ({
          field: String(e.path.join('.')),
          message: e.message,
        })),
      });
    }

    logger.error({ err: error }, 'Failed to resubscribe');
    return res.status(500).json({ error: 'Failed to resubscribe' });
  }
}

/**
 * GET /api/notification-preferences/quiet-hours/status
 * Check if user is currently in quiet hours
 */
export async function handleGetQuietHoursStatus(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const preferences = await getPreferences(userId);
    const inQuietHours = await isQuietHours(userId);

    return res.json({
      success: true,
      data: {
        quietHoursEnabled: preferences.quietHoursEnabled,
        quietHoursStart: preferences.quietHoursStart,
        quietHoursEnd: preferences.quietHoursEnd,
        timezone: preferences.timezone,
        currentlyInQuietHours: inQuietHours,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get quiet hours status');
    return res.status(500).json({ error: 'Failed to get quiet hours status' });
  }
}
