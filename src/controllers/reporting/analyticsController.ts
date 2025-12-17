import { Request, Response, NextFunction } from 'express';
import {
  getRealtimeStats,
  getUserAnalytics,
  getRevenueAnalytics,
  getSubscriptionAnalytics,
  getContentAnalytics,
  getEngagementAnalytics,
  getInstructorAnalytics,
  getMRRReport,
  getChurnReport,
  comparePeriods,
  getOverviewDashboard,
} from '../../services/reporting/analyticsService';

// Parse date range from query params
const parseDateRange = (req: Request) => {
  const { dateFrom, dateTo, dateRangeType } = req.query;

  let from: Date;
  let to = new Date();

  if (dateFrom) {
    from = new Date(dateFrom as string);
  } else {
    // Default to last 30 days
    from = new Date();
    from.setDate(from.getDate() - 30);
  }

  if (dateTo) {
    to = new Date(dateTo as string);
  }

  return { from, to };
};

// Get overview dashboard
export const getOverview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const overview = await getOverviewDashboard();

    res.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    next(error);
  }
};

// Get user analytics
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { from, to } = parseDateRange(req);
    const filters = req.query.filters
      ? JSON.parse(req.query.filters as string)
      : undefined;

    const analytics = await getUserAnalytics(from, to, filters);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

// Get revenue analytics
export const getRevenue = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { from, to } = parseDateRange(req);
    const filters = req.query.filters
      ? JSON.parse(req.query.filters as string)
      : undefined;

    const analytics = await getRevenueAnalytics(from, to, filters);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

// Get subscription analytics
export const getSubscriptions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { from, to } = parseDateRange(req);
    const filters = req.query.filters
      ? JSON.parse(req.query.filters as string)
      : undefined;

    const analytics = await getSubscriptionAnalytics(from, to, filters);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

// Get content analytics
export const getContent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { from, to } = parseDateRange(req);
    const filters = req.query.filters
      ? JSON.parse(req.query.filters as string)
      : undefined;

    const analytics = await getContentAnalytics(from, to, filters);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

// Get engagement analytics
export const getEngagement = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { from, to } = parseDateRange(req);
    const filters = req.query.filters
      ? JSON.parse(req.query.filters as string)
      : undefined;

    const analytics = await getEngagementAnalytics(from, to, filters);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

// Get instructor analytics (all or single)
export const getInstructors = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { from, to } = parseDateRange(req);
    const { id } = req.params;

    const analytics = await getInstructorAnalytics(from, to, id);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

// Get realtime stats
export const getRealtime = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await getRealtimeStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// Compare periods
export const compare = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { metric, period1From, period1To, period2From, period2To } = req.query;

    if (!metric || !period1From || !period1To || !period2From || !period2To) {
      return res.status(400).json({
        success: false,
        error:
          'Missing required parameters: metric, period1From, period1To, period2From, period2To',
      });
    }

    const comparison = await comparePeriods(
      metric as string,
      {
        from: new Date(period1From as string),
        to: new Date(period1To as string),
      },
      {
        from: new Date(period2From as string),
        to: new Date(period2To as string),
      }
    );

    res.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    next(error);
  }
};

// Get MRR report
export const getMRR = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const months = req.query.months
      ? parseInt(req.query.months as string)
      : 12;

    const mrr = await getMRRReport(months);

    res.json({
      success: true,
      data: mrr,
    });
  } catch (error) {
    next(error);
  }
};

// Get ARR report
export const getARR = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const mrr = await getMRRReport(12);

    // Convert MRR to ARR
    const arr = mrr.map(m => ({
      ...m,
      arr: m.mrr * 12,
    }));

    res.json({
      success: true,
      data: arr,
    });
  } catch (error) {
    next(error);
  }
};

// Get churn report
export const getChurn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { from, to } = parseDateRange(req);

    const churn = await getChurnReport(from, to);

    res.json({
      success: true,
      data: churn,
    });
  } catch (error) {
    next(error);
  }
};

// Get LTV report (placeholder)
export const getLTV = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // LTV calculation would require more complex analysis
    // This is a simplified placeholder
    const mrr = await getMRRReport(12);
    const churn = await getChurnReport(
      new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      new Date()
    );

    const avgMRR =
      mrr.reduce((sum, m) => sum + m.mrr, 0) / mrr.length;
    const churnRate = churn.churnRate / 100;
    const ltv = churnRate > 0 ? avgMRR / churnRate : avgMRR * 24; // 24 months default

    res.json({
      success: true,
      data: {
        averageLTV: Math.round(ltv * 100) / 100,
        averageMRR: Math.round(avgMRR * 100) / 100,
        churnRate: churn.churnRate,
        calculationMethod: 'simple',
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get retention report (placeholder)
export const getRetention = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { from, to } = parseDateRange(req);

    const analytics = await getUserAnalytics(from, to);

    res.json({
      success: true,
      data: {
        retentionRate: analytics.retentionRate,
        period: { from, to },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get revenue by plan
export const getRevenueByPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { from, to } = parseDateRange(req);

    // This would require joining payments with subscriptions
    // Simplified implementation
    const revenue = await getRevenueAnalytics(from, to);

    res.json({
      success: true,
      data: revenue.revenueByProvider, // Using provider as proxy for now
    });
  } catch (error) {
    next(error);
  }
};

// Get revenue by country (placeholder)
export const getRevenueByCountry = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Would require country data on users/payments
    res.json({
      success: true,
      data: {
        message: 'Country data not available',
        countries: [],
      },
    });
  } catch (error) {
    next(error);
  }
};
