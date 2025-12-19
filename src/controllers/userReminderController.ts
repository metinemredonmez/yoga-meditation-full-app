import type { Request, Response } from 'express';

type AuthenticatedRequest = Request;
import * as reminderService from '../services/userReminderService';
import {
  userReminderFiltersSchema,
  createUserReminderSchema,
  updateUserReminderSchema,
  userReminderIdParamSchema,
} from '../validation/userReminderSchemas';

// ==================== USER REMINDERS ====================

export async function getReminders(req: AuthenticatedRequest, res: Response) {
  try {
    const filters = userReminderFiltersSchema.parse(req.query);
    const result = await reminderService.getReminders(req.user!.id, filters);
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function getReminder(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = userReminderIdParamSchema.parse(req.params);
    const reminder = await reminderService.getReminder(req.user!.id, id);

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    res.json(reminder);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function createReminder(req: AuthenticatedRequest, res: Response) {
  try {
    const input = createUserReminderSchema.parse(req.body);
    const reminder = await reminderService.createReminder(req.user!.id, input);
    res.status(201).json(reminder);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function updateReminder(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = userReminderIdParamSchema.parse(req.params);
    const input = updateUserReminderSchema.parse(req.body);
    const reminder = await reminderService.updateReminder(req.user!.id, id, input);
    res.json(reminder);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    if (error.message === 'Reminder not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function deleteReminder(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = userReminderIdParamSchema.parse(req.params);
    await reminderService.deleteReminder(req.user!.id, id);
    res.status(204).send();
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    if (error.message === 'Reminder not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function toggleReminder(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = userReminderIdParamSchema.parse(req.params);
    const reminder = await reminderService.toggleReminder(req.user!.id, id);
    res.json(reminder);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    if (error.message === 'Reminder not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

// ==================== TEMPLATES ====================

export async function getTemplates(req: AuthenticatedRequest, res: Response) {
  try {
    const templates = reminderService.getReminderTemplates();
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
