import { Request, Response, NextFunction } from 'express';
import {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  hardDeletePlan,
  syncPlanWithStripe,
  getPlansForClient,
} from '../services/subscriptionPlanService';
import { logger } from '../utils/logger';

/**
 * Get all subscription plans (public)
 */
export async function getPlansHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const plans = await getPlans(includeInactive);

    res.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get plans formatted for client (mobile/web)
 */
export async function getClientPlansHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const platform = (req.query.platform as 'ios' | 'android' | 'web') || 'web';
    const plans = await getPlansForClient(platform);

    res.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single plan by ID
 */
export async function getPlanHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const planId = req.params.planId;
    if (!planId) {
      return res.status(400).json({ success: false, error: 'Plan ID required' });
    }
    const plan = await getPlanById(planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found',
      });
    }

    res.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create new subscription plan (admin)
 */
export async function createPlanHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const plan = await createPlan(req.body);

    logger.info({ planId: plan.id, name: plan.name }, 'Subscription plan created');

    res.status(201).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update subscription plan (admin)
 */
export async function updatePlanHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const planId = req.params.planId;
    if (!planId) {
      return res.status(400).json({ success: false, error: 'Plan ID required' });
    }
    const plan = await updatePlan(planId, req.body);

    logger.info({ planId: plan.id, name: plan.name }, 'Subscription plan updated');

    res.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete subscription plan (soft delete - admin)
 */
export async function deletePlanHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const planId = req.params.planId;
    if (!planId) {
      return res.status(400).json({ success: false, error: 'Plan ID required' });
    }
    await deletePlan(planId);

    logger.info({ planId }, 'Subscription plan soft deleted');

    res.json({
      success: true,
      message: 'Plan deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Hard delete subscription plan (admin - use with caution)
 */
export async function hardDeletePlanHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const planId = req.params.planId;
    if (!planId) {
      return res.status(400).json({ success: false, error: 'Plan ID required' });
    }
    await hardDeletePlan(planId);

    logger.info({ planId }, 'Subscription plan hard deleted');

    res.json({
      success: true,
      message: 'Plan permanently deleted',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Sync plan with Stripe (admin)
 */
export async function syncPlanWithStripeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const planId = req.params.planId;
    if (!planId) {
      return res.status(400).json({ success: false, error: 'Plan ID required' });
    }
    const plan = await syncPlanWithStripe(planId);

    logger.info({ planId: plan.id }, 'Plan synced with Stripe');

    res.json({
      success: true,
      data: plan,
      message: 'Plan synced with Stripe successfully',
    });
  } catch (error) {
    next(error);
  }
}
