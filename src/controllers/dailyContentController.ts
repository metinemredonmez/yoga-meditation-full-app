import { Request, Response } from 'express';
import { ZodError } from 'zod';
import {
  quoteFiltersSchema,
  quoteIdParamSchema,
  createQuoteSchema,
  updateQuoteSchema,
  createDailyContentSchema,
  updateDailyContentSchema,
  dailyContentIdParamSchema,
} from '../validation/dailyContentSchemas';
import * as dailyContentService from '../services/dailyContentService';
import { logger } from '../utils/logger';

// ==================== USER ENDPOINTS ====================

/**
 * GET /api/daily
 * Get today's daily content
 */
export async function getTodayContent(req: Request, res: Response) {
  try {
    const content = await dailyContentService.getTodayContent();
    return res.json({ content });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get today content');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/daily/quote
 * Get today's quote
 */
export async function getTodayQuote(req: Request, res: Response) {
  try {
    const quote = await dailyContentService.getTodayQuote();
    return res.json({ quote });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get today quote');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/daily/quote/random
 * Get a random quote
 */
export async function getRandomQuote(req: Request, res: Response) {
  try {
    const category = req.query.category as string | undefined;
    const quote = await dailyContentService.getRandomQuote(category);
    return res.json({ quote });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get random quote');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/daily/:date
 * Get daily content for a specific date
 */
export async function getDailyContent(req: Request, res: Response) {
  try {
    const dateStr = req.params.date;
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    const content = await dailyContentService.getDailyContent(date);

    if (!content) {
      return res.status(404).json({ error: 'No content for this date' });
    }

    return res.json({ content });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get daily content');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================== ADMIN ENDPOINTS ====================

/**
 * GET /api/admin/quotes
 * Get all quotes (admin)
 */
export async function getQuotes(req: Request, res: Response) {
  try {
    const filters = quoteFiltersSchema.parse(req.query);
    const result = await dailyContentService.getQuotes(filters);
    return res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to list quotes');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/admin/quotes/:id
 * Get quote by id
 */
export async function getQuote(req: Request, res: Response) {
  try {
    const { id } = quoteIdParamSchema.parse(req.params);
    const quote = await dailyContentService.getQuote(id);

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    return res.json({ quote });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid quote id', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to get quote');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/admin/quotes
 * Create a new quote
 */
export async function createQuote(req: Request, res: Response) {
  try {
    const input = createQuoteSchema.parse(req.body);
    const quote = await dailyContentService.createQuote(input);
    return res.status(201).json({ quote });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    logger.error({ err: error }, 'Failed to create quote');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PUT /api/admin/quotes/:id
 * Update a quote
 */
export async function updateQuote(req: Request, res: Response) {
  try {
    const { id } = quoteIdParamSchema.parse(req.params);
    const input = updateQuoteSchema.parse(req.body);
    const quote = await dailyContentService.updateQuote(id, input);
    return res.json({ quote });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    if ((error as any)?.code === 'P2025') {
      return res.status(404).json({ error: 'Quote not found' });
    }
    logger.error({ err: error }, 'Failed to update quote');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /api/admin/quotes/:id
 * Delete a quote
 */
export async function deleteQuote(req: Request, res: Response) {
  try {
    const { id } = quoteIdParamSchema.parse(req.params);
    await dailyContentService.deleteQuote(id);
    return res.json({ message: 'Quote deleted' });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid quote id', details: error.flatten() });
    }
    if ((error as any)?.code === 'P2025') {
      return res.status(404).json({ error: 'Quote not found' });
    }
    logger.error({ err: error }, 'Failed to delete quote');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/admin/daily-content
 * Get all daily content (admin)
 */
export async function getAdminDailyContent(req: Request, res: Response) {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const result = await dailyContentService.getAdminDailyContent(page, limit);
    return res.json(result);
  } catch (error) {
    logger.error({ err: error }, 'Failed to list daily content');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/admin/daily-content
 * Create daily content
 */
export async function createDailyContent(req: Request, res: Response) {
  try {
    const input = createDailyContentSchema.parse(req.body);
    const content = await dailyContentService.createDailyContent(input);
    return res.status(201).json({ content });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    if ((error as any)?.code === 'P2002') {
      return res.status(409).json({ error: 'Content for this date already exists' });
    }
    logger.error({ err: error }, 'Failed to create daily content');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PUT /api/admin/daily-content/:id
 * Update daily content
 */
export async function updateDailyContent(req: Request, res: Response) {
  try {
    const { id } = dailyContentIdParamSchema.parse(req.params);
    const input = updateDailyContentSchema.parse(req.body);
    const content = await dailyContentService.updateDailyContent(id, input);
    return res.json({ content });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.flatten() });
    }
    if ((error as any)?.code === 'P2025') {
      return res.status(404).json({ error: 'Daily content not found' });
    }
    logger.error({ err: error }, 'Failed to update daily content');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /api/admin/daily-content/:id
 * Delete daily content
 */
export async function deleteDailyContent(req: Request, res: Response) {
  try {
    const { id } = dailyContentIdParamSchema.parse(req.params);
    await dailyContentService.deleteDailyContent(id);
    return res.json({ message: 'Daily content deleted' });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid id', details: error.flatten() });
    }
    if ((error as any)?.code === 'P2025') {
      return res.status(404).json({ error: 'Daily content not found' });
    }
    logger.error({ err: error }, 'Failed to delete daily content');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/admin/daily-content/stats
 * Get daily content statistics
 */
export async function getDailyContentStats(req: Request, res: Response) {
  try {
    const stats = await dailyContentService.getDailyContentStats();
    return res.json({ stats });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get daily content stats');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
