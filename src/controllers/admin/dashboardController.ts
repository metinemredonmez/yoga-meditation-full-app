import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../../services/admin/dashboardService';
import * as auditService from '../../services/admin/auditService';

export async function getDashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await dashboardService.getDashboardStats();
    res.json({ success: true, stats });
  } catch (error) {
    next(error);
  }
}

export async function getQuickStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await dashboardService.getQuickStats();
    res.json({ success: true, stats });
  } catch (error) {
    next(error);
  }
}

export async function getRecentActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const activities = await dashboardService.getRecentActivity(limit);
    res.json({ success: true, activities });
  } catch (error) {
    next(error);
  }
}

export async function getDashboardPreference(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const preference = await dashboardService.getDashboardPreference(adminId);
    res.json({ success: true, preference });
  } catch (error) {
    next(error);
  }
}

export async function setDashboardPreference(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const { widgets } = req.body;

    const preference = await dashboardService.setDashboardPreference(adminId, widgets);

    res.json({ success: true, preference });
  } catch (error) {
    next(error);
  }
}

export async function getSystemHealth(req: Request, res: Response, next: NextFunction) {
  try {
    const health = await dashboardService.getSystemHealth();
    res.json({ success: true, health });
  } catch (error) {
    next(error);
  }
}

export async function getChartData(req: Request, res: Response, next: NextFunction) {
  try {
    const metric = req.params.metric!;
    const days = parseInt(req.query.days as string) || 30;

    const data = await dashboardService.getChartData(metric, days);
    res.json({ success: true, metric, data });
  } catch (error) {
    next(error);
  }
}
