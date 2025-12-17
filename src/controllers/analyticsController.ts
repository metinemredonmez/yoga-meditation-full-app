import { Request, Response, NextFunction } from 'express';
import * as analyticsService from '../services/analyticsService';
import * as reportService from '../services/reportService';
import { PaymentProvider, RevenueType, SubscriptionTier } from '@prisma/client';

/**
 * Get dashboard metrics
 */
export async function getDashboardMetrics(req: Request, res: Response, next: NextFunction) {
  try {
    const metrics = await analyticsService.getDashboardMetrics();
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get MRR
 */
export async function getMRR(req: Request, res: Response, next: NextFunction) {
  try {
    const mrr = await analyticsService.calculateMRR();
    const arr = await analyticsService.calculateARR();
    res.json({
      success: true,
      data: { mrr, arr },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get churn rate
 */
export async function getChurnRate(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const churnData = await analyticsService.calculateChurnRate(start, end);
    res.json({
      success: true,
      data: churnData,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get LTV
 */
export async function getLTV(req: Request, res: Response, next: NextFunction) {
  try {
    const ltv = await analyticsService.calculateLTV();
    const avgSubLength = await analyticsService.calculateAvgSubscriptionLength();
    res.json({
      success: true,
      data: { ltv, avgSubscriptionLengthDays: avgSubLength },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get revenue by provider
 */
export async function getRevenueByProvider(req: Request, res: Response, next: NextFunction) {
  try {
    const breakdown = await analyticsService.getRevenueByProvider();
    res.json({
      success: true,
      data: breakdown,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get subscriptions by tier
 */
export async function getSubscriptionsByTier(req: Request, res: Response, next: NextFunction) {
  try {
    const breakdown = await analyticsService.getSubscriptionsByTier();
    res.json({
      success: true,
      data: breakdown,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get revenue over time
 */
export async function getRevenueOverTime(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate, groupBy } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    const group = (groupBy as 'day' | 'week' | 'month') || 'month';

    const data = await analyticsService.getRevenueOverTime(start, end, group);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user metrics
 */
export async function getUserMetrics(req: Request, res: Response, next: NextFunction) {
  try {
    const metrics = await analyticsService.getUserMetrics();
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get subscription metrics
 */
export async function getSubscriptionMetrics(req: Request, res: Response, next: NextFunction) {
  try {
    const metrics = await analyticsService.getSubscriptionMetrics();
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Record revenue event
 */
export async function recordRevenue(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      userId,
      subscriptionId,
      paymentId,
      invoiceId,
      type,
      amount,
      currency,
      provider,
      planId,
      tier,
      interval,
      metadata,
    } = req.body;

    const record = await analyticsService.recordRevenue({
      userId,
      subscriptionId,
      paymentId,
      invoiceId,
      type: type as RevenueType,
      amount,
      currency,
      provider: provider as PaymentProvider,
      planId,
      tier: tier as SubscriptionTier,
      interval,
      metadata,
    });

    res.status(201).json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get revenue records
 */
export async function getRevenueRecords(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate, type, provider, tier, page, limit } = req.query;

    const result = await analyticsService.getRevenueRecords({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      type: type as RevenueType | undefined,
      provider: provider as PaymentProvider | undefined,
      tier: tier as SubscriptionTier | undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create analytics snapshot
 */
export async function createSnapshot(req: Request, res: Response, next: NextFunction) {
  try {
    const { date } = req.body;
    const snapshot = await analyticsService.createDailySnapshot(date ? new Date(date) : undefined);
    res.status(201).json({
      success: true,
      data: snapshot,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get analytics snapshots
 */
export async function getSnapshots(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const snapshots = await analyticsService.getAnalyticsSnapshots(start, end);
    res.json({
      success: true,
      data: snapshots,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get latest snapshot
 */
export async function getLatestSnapshot(req: Request, res: Response, next: NextFunction) {
  try {
    const snapshot = await analyticsService.getLatestSnapshot();
    res.json({
      success: true,
      data: snapshot,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Generate revenue report
 */
export async function generateRevenueReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate, provider, format, includeDetails } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    const reportFormat = (format as 'excel' | 'pdf' | 'json') || 'json';

    const report = await reportService.generateRevenueReport(
      {
        startDate: start,
        endDate: end,
        provider: provider as PaymentProvider | undefined,
      },
      {
        format: reportFormat,
        includeDetails: includeDetails === 'true',
      }
    );

    if (reportFormat === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=revenue-report.xlsx');
      res.send(report);
    } else if (reportFormat === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=revenue-report.pdf');
      res.send(report);
    } else {
      res.json({
        success: true,
        data: report,
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Generate subscription report
 */
export async function generateSubscriptionReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate, tier, format, includeDetails } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    const reportFormat = (format as 'excel' | 'pdf' | 'json') || 'json';

    const report = await reportService.generateSubscriptionReport(
      {
        startDate: start,
        endDate: end,
        tier: tier as SubscriptionTier | undefined,
      },
      {
        format: reportFormat,
        includeDetails: includeDetails === 'true',
      }
    );

    if (reportFormat === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=subscription-report.xlsx');
      res.send(report);
    } else if (reportFormat === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=subscription-report.pdf');
      res.send(report);
    } else {
      res.json({
        success: true,
        data: report,
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Generate invoice report
 */
export async function generateInvoiceReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate, format, includeDetails } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    const reportFormat = (format as 'excel' | 'pdf' | 'json') || 'json';

    const report = await reportService.generateInvoiceReport(
      {
        startDate: start,
        endDate: end,
      },
      {
        format: reportFormat,
        includeDetails: includeDetails === 'true',
      }
    );

    if (reportFormat === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=invoice-report.xlsx');
      res.send(report);
    } else if (reportFormat === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=invoice-report.pdf');
      res.send(report);
    } else {
      res.json({
        success: true,
        data: report,
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Generate analytics report
 */
export async function generateAnalyticsReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate, format, includeDetails } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    const reportFormat = (format as 'excel' | 'pdf' | 'json') || 'json';

    const report = await reportService.generateAnalyticsReport(
      {
        startDate: start,
        endDate: end,
      },
      {
        format: reportFormat,
        includeDetails: includeDetails === 'true',
      }
    );

    if (reportFormat === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics-report.xlsx');
      res.send(report);
    } else if (reportFormat === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics-report.pdf');
      res.send(report);
    } else {
      res.json({
        success: true,
        data: report,
      });
    }
  } catch (error) {
    next(error);
  }
}
