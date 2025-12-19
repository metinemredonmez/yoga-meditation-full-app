import { Router } from 'express';
import type { Request, Response } from 'express';

type AuthenticatedRequest = Request;
import { authenticate, requireAdmin } from '../../middleware/auth';
import * as journalService from '../../services/journalService';
import {
  promptFiltersSchema,
  createJournalPromptSchema,
  updateJournalPromptSchema,
} from '../../validation/journalSchemas';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// ==================== PROMPTS MANAGEMENT ====================

router.get('/prompts', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = promptFiltersSchema.parse(req.query);
    const result = await journalService.getAdminPrompts(filters);
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

router.post('/prompts', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const input = createJournalPromptSchema.parse(req.body);
    const prompt = await journalService.createPrompt(input);
    res.status(201).json(prompt);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

router.put('/prompts/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Prompt ID is required' });
    }
    const input = updateJournalPromptSchema.parse(req.body);
    const prompt = await journalService.updatePrompt(id, input);
    res.json(prompt);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

router.delete('/prompts/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Prompt ID is required' });
    }
    await journalService.deletePrompt(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
