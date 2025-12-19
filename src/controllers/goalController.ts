import type { Request, Response } from 'express';

type AuthenticatedRequest = Request;
import * as goalService from '../services/goalService';
import {
  goalFiltersSchema,
  createGoalSchema,
  updateGoalSchema,
  goalIdParamSchema,
  addProgressSchema,
  progressFiltersSchema,
} from '../validation/goalSchemas';

// ==================== GOALS ====================

export async function getGoals(req: AuthenticatedRequest, res: Response) {
  try {
    const filters = goalFiltersSchema.parse(req.query);
    const result = await goalService.getGoals(req.user!.id, filters);
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function getGoal(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = goalIdParamSchema.parse(req.params);
    const goal = await goalService.getGoal(req.user!.id, id);

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json(goal);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function createGoal(req: AuthenticatedRequest, res: Response) {
  try {
    const input = createGoalSchema.parse(req.body);
    const goal = await goalService.createGoal(req.user!.id, input);
    res.status(201).json(goal);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function updateGoal(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = goalIdParamSchema.parse(req.params);
    const input = updateGoalSchema.parse(req.body);
    const goal = await goalService.updateGoal(req.user!.id, id, input);
    res.json(goal);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    if (error.message === 'Goal not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function deleteGoal(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = goalIdParamSchema.parse(req.params);
    await goalService.deleteGoal(req.user!.id, id);
    res.status(204).send();
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    if (error.message === 'Goal not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function toggleGoal(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = goalIdParamSchema.parse(req.params);
    const goal = await goalService.toggleGoal(req.user!.id, id);
    res.json(goal);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    if (error.message === 'Goal not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function completeGoal(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = goalIdParamSchema.parse(req.params);
    const goal = await goalService.completeGoal(req.user!.id, id);
    res.json(goal);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    if (error.message === 'Goal not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

// ==================== PROGRESS ====================

export async function addProgress(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = goalIdParamSchema.parse(req.params);
    const input = addProgressSchema.parse(req.body);
    const progress = await goalService.addProgress(req.user!.id, id, input);
    res.status(201).json(progress);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    if (error.message === 'Goal not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function getProgress(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = goalIdParamSchema.parse(req.params);
    const filters = progressFiltersSchema.parse(req.query);
    const result = await goalService.getProgress(req.user!.id, id, filters);
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    if (error.message === 'Goal not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

// ==================== TEMPLATES & SUGGESTIONS ====================

export async function getTemplates(req: AuthenticatedRequest, res: Response) {
  try {
    const templates = goalService.getGoalTemplates();
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getSuggestions(req: AuthenticatedRequest, res: Response) {
  try {
    const suggestions = await goalService.getSuggestions(req.user!.id);
    res.json(suggestions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
