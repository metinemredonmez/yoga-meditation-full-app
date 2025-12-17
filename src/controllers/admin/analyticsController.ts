import { Request, Response, NextFunction } from 'express';
import * as analyticsService from '../../services/admin/analyticsService';

export async function getUserAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await analyticsService.getUserAnalytics({
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    });
    res.json({ success: true, analytics: result });
  } catch (error) { next(error); }
}

export async function getContentAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await analyticsService.getContentAnalytics({});
    res.json({ success: true, analytics: result });
  } catch (error) { next(error); }
}

export async function getRevenueAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await analyticsService.getRevenueAnalytics({
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    });
    res.json({ success: true, analytics: result });
  } catch (error) { next(error); }
}

export async function getEngagementAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await analyticsService.getEngagementAnalytics({});
    res.json({ success: true, analytics: result });
  } catch (error) { next(error); }
}

export async function getRealTimeStats(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await analyticsService.getRealTimeStats();
    res.json({ success: true, stats: result });
  } catch (error) { next(error); }
}

export async function getGrowthTrends(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await analyticsService.getGrowthTrends(req.query.period as 'week' | 'month' | 'quarter' | 'year');
    res.json({ success: true, trends: result });
  } catch (error) { next(error); }
}

export async function getChallengeAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await analyticsService.getChallengeAnalytics({});
    res.json({ success: true, analytics: result });
  } catch (error) { next(error); }
}

export async function getRetentionAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await analyticsService.getRetentionAnalytics({});
    res.json({ success: true, analytics: result });
  } catch (error) { next(error); }
}
