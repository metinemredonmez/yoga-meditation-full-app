import type { Request, Response } from 'express';

type AuthenticatedRequest = Request;
import * as onboardingService from '../services/onboardingService';
import {
  saveOnboardingAnswerSchema,
  completeOnboardingSchema,
  updateOnboardingSchema,
} from '../validation/onboardingSchemas';

// ==================== ONBOARDING ====================

export async function getOnboarding(req: AuthenticatedRequest, res: Response) {
  try {
    const onboarding = await onboardingService.getOnboarding(req.user!.id);

    if (!onboarding) {
      return res.json({ isCompleted: false, currentStep: 0 });
    }

    res.json(onboarding);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function startOnboarding(req: AuthenticatedRequest, res: Response) {
  try {
    const onboarding = await onboardingService.startOnboarding(req.user!.id);
    res.status(201).json(onboarding);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function saveAnswer(req: AuthenticatedRequest, res: Response) {
  try {
    const input = saveOnboardingAnswerSchema.parse(req.body);
    const onboarding = await onboardingService.saveAnswer(req.user!.id, input);
    res.json(onboarding);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function updateOnboarding(req: AuthenticatedRequest, res: Response) {
  try {
    const input = updateOnboardingSchema.parse(req.body);
    const onboarding = await onboardingService.updateOnboarding(req.user!.id, input);
    res.json(onboarding);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    if (error.message === 'Onboarding not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function skipOnboarding(req: AuthenticatedRequest, res: Response) {
  try {
    const onboarding = await onboardingService.skipOnboarding(req.user!.id);
    res.json(onboarding);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function completeOnboarding(req: AuthenticatedRequest, res: Response) {
  try {
    const input = completeOnboardingSchema.parse(req.body);
    const onboarding = await onboardingService.completeOnboarding(req.user!.id, input);
    res.json(onboarding);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function resetOnboarding(req: AuthenticatedRequest, res: Response) {
  try {
    const onboarding = await onboardingService.resetOnboarding(req.user!.id);
    res.json(onboarding);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// ==================== RECOMMENDATIONS ====================

export async function getRecommendations(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await onboardingService.getRecommendations(req.user!.id);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
