import type { Request, Response } from 'express';

type AuthenticatedRequest = Request;
import * as journalService from '../services/journalService';
import {
  journalFiltersSchema,
  createJournalEntrySchema,
  updateJournalEntrySchema,
  journalEntryIdParamSchema,
  journalCalendarQuerySchema,
  journalStatsQuerySchema,
  journalSearchQuerySchema,
} from '../validation/journalSchemas';

// ==================== JOURNAL ENTRIES ====================

export async function getEntries(req: AuthenticatedRequest, res: Response) {
  try {
    const filters = journalFiltersSchema.parse(req.query);
    const result = await journalService.getJournalEntries(req.user!.id, filters);
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function getEntry(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = journalEntryIdParamSchema.parse(req.params);
    const entry = await journalService.getJournalEntry(req.user!.id, id);

    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    res.json(entry);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function createEntry(req: AuthenticatedRequest, res: Response) {
  try {
    const input = createJournalEntrySchema.parse(req.body);
    const entry = await journalService.createJournalEntry(req.user!.id, input);
    res.status(201).json(entry);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function updateEntry(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = journalEntryIdParamSchema.parse(req.params);
    const input = updateJournalEntrySchema.parse(req.body);
    const entry = await journalService.updateJournalEntry(req.user!.id, id, input);
    res.json(entry);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    if (error.message === 'Journal entry not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function deleteEntry(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = journalEntryIdParamSchema.parse(req.params);
    await journalService.deleteJournalEntry(req.user!.id, id);
    res.status(204).send();
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    if (error.message === 'Journal entry not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function toggleFavorite(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = journalEntryIdParamSchema.parse(req.params);
    const entry = await journalService.toggleFavorite(req.user!.id, id);
    res.json(entry);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    if (error.message === 'Journal entry not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function getFavorites(req: AuthenticatedRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await journalService.getFavoriteEntries(req.user!.id, page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// ==================== CALENDAR & STATS ====================

export async function getCalendar(req: AuthenticatedRequest, res: Response) {
  try {
    const query = journalCalendarQuerySchema.parse(req.query);
    const result = await journalService.getCalendar(req.user!.id, query);
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function getStats(req: AuthenticatedRequest, res: Response) {
  try {
    const query = journalStatsQuerySchema.parse(req.query);
    const result = await journalService.getStats(req.user!.id, query);
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
}

// ==================== SEARCH ====================

export async function searchEntries(req: AuthenticatedRequest, res: Response) {
  try {
    const query = journalSearchQuerySchema.parse(req.query);
    const result = await journalService.searchEntries(req.user!.id, query);
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
}

// ==================== PROMPTS ====================

export async function getPrompts(req: AuthenticatedRequest, res: Response) {
  try {
    const type = req.query.type as string | undefined;
    const prompts = await journalService.getDailyPrompts(type as any);
    res.json(prompts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getRandomPrompt(req: AuthenticatedRequest, res: Response) {
  try {
    const type = req.query.type as string | undefined;
    const prompt = await journalService.getRandomPrompt(type as any);

    if (!prompt) {
      return res.status(404).json({ error: 'No prompts available' });
    }

    res.json(prompt);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
