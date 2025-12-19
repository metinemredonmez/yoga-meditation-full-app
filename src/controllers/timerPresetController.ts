import { Request, Response } from 'express';
import { ZodError } from 'zod';
import {
  createTimerPresetSchema,
  updateTimerPresetSchema,
  timerPresetIdParamSchema,
  timerPresetFiltersSchema,
} from '../validation/timerPresetSchemas';
import * as timerPresetService from '../services/timerPresetService';
import { logger } from '../utils/logger';

// ==================== USER ENDPOINTS ====================

/**
 * GET /api/timer/presets
 * Get timer presets (system + user)
 */
export async function getTimerPresets(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const filters = timerPresetFiltersSchema.parse(req.query);
    const result = await timerPresetService.getTimerPresets(req.user.userId, filters);
    return res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to get timer presets');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/timer/presets/:id
 * Get timer preset by ID
 */
export async function getTimerPreset(req: Request, res: Response) {
  try {
    const { id } = timerPresetIdParamSchema.parse(req.params);
    const preset = await timerPresetService.getTimerPreset(id, req.user?.userId);

    if (!preset) {
      return res.status(404).json({ error: 'Preset not found' });
    }

    return res.json({ preset });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid preset id', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to get timer preset');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/timer/presets
 * Create timer preset
 */
export async function createTimerPreset(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const input = createTimerPresetSchema.parse(req.body);
    const preset = await timerPresetService.createTimerPreset(req.user.userId, input);
    return res.status(201).json({ preset });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to create timer preset');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PUT /api/timer/presets/:id
 * Update timer preset
 */
export async function updateTimerPreset(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = timerPresetIdParamSchema.parse(req.params);
    const input = updateTimerPresetSchema.parse(req.body);
    const preset = await timerPresetService.updateTimerPreset(req.user.userId, id, input);
    return res.json({ preset });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Preset not found or cannot be modified' });
    }
    logger.error({ err: error }, 'Failed to update timer preset');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /api/timer/presets/:id
 * Delete timer preset
 */
export async function deleteTimerPreset(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = timerPresetIdParamSchema.parse(req.params);
    await timerPresetService.deleteTimerPreset(req.user.userId, id);
    return res.json({ message: 'Preset deleted' });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid preset id', details: error.flatten() });
    }
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Preset not found or cannot be deleted' });
    }
    logger.error({ err: error }, 'Failed to delete timer preset');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/timer/presets/:id/default
 * Set preset as default
 */
export async function setDefaultPreset(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = timerPresetIdParamSchema.parse(req.params);
    const preset = await timerPresetService.setDefaultPreset(req.user.userId, id);
    return res.json({ preset, message: 'Default preset set' });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid preset id', details: error.flatten() });
    }
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Preset not found' });
    }
    logger.error({ err: error }, 'Failed to set default preset');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================== ADMIN ENDPOINTS ====================

/**
 * GET /api/admin/timer/presets
 * Get all timer presets (admin)
 */
export async function getAllTimerPresets(req: Request, res: Response) {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const result = await timerPresetService.getAllTimerPresets(page, limit);
    return res.json(result);
  } catch (error) {
    logger.error({ err: error }, 'Failed to get all timer presets');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/admin/timer/presets
 * Create system timer preset
 */
export async function createSystemPreset(req: Request, res: Response) {
  try {
    const input = createTimerPresetSchema.parse(req.body);
    const preset = await timerPresetService.createSystemPreset(input);
    return res.status(201).json({ preset });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to create system preset');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PUT /api/admin/timer/presets/:id
 * Update system timer preset
 */
export async function updateSystemPreset(req: Request, res: Response) {
  try {
    const { id } = timerPresetIdParamSchema.parse(req.params);
    const input = updateTimerPresetSchema.parse(req.body);
    const preset = await timerPresetService.updateSystemPreset(id, input);
    return res.json({ preset });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    if ((error as any)?.code === 'P2025') {
      return res.status(404).json({ error: 'System preset not found' });
    }
    logger.error({ err: error }, 'Failed to update system preset');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /api/admin/timer/presets/:id
 * Delete system timer preset
 */
export async function deleteSystemPreset(req: Request, res: Response) {
  try {
    const { id } = timerPresetIdParamSchema.parse(req.params);
    await timerPresetService.deleteSystemPreset(id);
    return res.json({ message: 'System preset deleted' });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid preset id', details: error.flatten() });
    }
    if ((error as any)?.code === 'P2025') {
      return res.status(404).json({ error: 'System preset not found' });
    }
    logger.error({ err: error }, 'Failed to delete system preset');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
