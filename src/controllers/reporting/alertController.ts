import { Request, Response, NextFunction } from 'express';
import {
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  getAlertRules,
  getAlertRule,
  muteAlertRule,
  unmuteAlertRule,
  getAlerts,
  getAlert,
  acknowledgeAlert,
  resolveAlert,
  getAlertStats,
} from '../../services/reporting/alertService';
import {
  AlertCondition,
  AggregationType,
  AlertSeverity,
  AlertStatus,
} from '@prisma/client';

// Get alert rules
export const getRules = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.role === 'ADMIN' ? undefined : req.user!.id;

    const rules = await getAlertRules(userId);

    res.json({
      success: true,
      data: rules,
    });
  } catch (error) {
    next(error);
  }
};

// Create alert rule
export const createRule = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const {
      name,
      description,
      metricType,
      metricQuery,
      condition,
      threshold,
      compareValue,
      timeWindow,
      aggregation,
      severity,
      channels,
      recipients,
      webhookUrl,
    } = req.body;

    const rule = await createAlertRule(
      {
        name,
        description,
        metricType,
        metricQuery,
        condition: condition as AlertCondition,
        threshold,
        compareValue,
        timeWindow,
        aggregation: aggregation as AggregationType,
        severity: severity as AlertSeverity,
        channels,
        recipients,
        webhookUrl,
      },
      userId
    );

    res.status(201).json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

// Get single alert rule
export const getRule = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;

    const rule = await getAlertRule(id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Alert rule not found',
      });
    }

    // Check ownership
    if (rule.createdById !== req.user!.id && req.user!.role !== 'ADMIN' && req.user!.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

// Update alert rule
export const updateRule = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;

    const existingRule = await getAlertRule(id);

    if (!existingRule) {
      return res.status(404).json({
        success: false,
        error: 'Alert rule not found',
      });
    }

    // Check ownership
    if (existingRule.createdById !== req.user!.id && req.user!.role !== 'ADMIN' && req.user!.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const rule = await updateAlertRule(id, req.body);

    res.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

// Delete alert rule
export const deleteRule = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;

    const existingRule = await getAlertRule(id);

    if (!existingRule) {
      return res.status(404).json({
        success: false,
        error: 'Alert rule not found',
      });
    }

    // Check ownership
    if (existingRule.createdById !== req.user!.id && req.user!.role !== 'ADMIN' && req.user!.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    await deleteAlertRule(id);

    res.json({
      success: true,
      message: 'Alert rule deleted',
    });
  } catch (error) {
    next(error);
  }
};

// Mute alert rule
export const mute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const { duration } = req.body; // Duration in minutes

    const existingRule = await getAlertRule(id);

    if (!existingRule) {
      return res.status(404).json({
        success: false,
        error: 'Alert rule not found',
      });
    }

    // Check ownership
    if (existingRule.createdById !== req.user!.id && req.user!.role !== 'ADMIN' && req.user!.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const rule = await muteAlertRule(id, duration);

    res.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

// Unmute alert rule
export const unmute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;

    const existingRule = await getAlertRule(id);

    if (!existingRule) {
      return res.status(404).json({
        success: false,
        error: 'Alert rule not found',
      });
    }

    // Check ownership
    if (existingRule.createdById !== req.user!.id && req.user!.role !== 'ADMIN' && req.user!.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const rule = await unmuteAlertRule(id);

    res.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

// Get alerts
export const listAlerts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, severity, ruleId, from, to } = req.query;

    const alerts = await getAlerts({
      status: status as AlertStatus | undefined,
      severity: severity as AlertSeverity | undefined,
      ruleId: ruleId as string | undefined,
      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined,
    });

    res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
};

// Get single alert
export const getAlertById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;

    const alert = await getAlert(id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found',
      });
    }

    res.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    next(error);
  }
};

// Acknowledge alert
export const acknowledge = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const existingAlert = await getAlert(id);

    if (!existingAlert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found',
      });
    }

    if (existingAlert.status !== 'TRIGGERED') {
      return res.status(400).json({
        success: false,
        error: 'Alert is not in triggered state',
      });
    }

    const alert = await acknowledgeAlert(id, userId);

    res.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    next(error);
  }
};

// Resolve alert
export const resolve = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const { resolution } = req.body;

    const existingAlert = await getAlert(id);

    if (!existingAlert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found',
      });
    }

    if (existingAlert.status === 'RESOLVED') {
      return res.status(400).json({
        success: false,
        error: 'Alert is already resolved',
      });
    }

    const alert = await resolveAlert(id, resolution);

    res.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    next(error);
  }
};

// Get alert statistics
export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await getAlertStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
