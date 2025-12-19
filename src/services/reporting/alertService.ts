import {
  PrismaClient,
  AlertCondition,
  AggregationType,
  AlertSeverity,
  AlertStatus,
  Prisma,
} from '@prisma/client';
import { sendEmail } from '../emailService';

const prisma = new PrismaClient();

// Create alert rule
export const createAlertRule = async (
  data: {
    name: string;
    description?: string;
    metricType: string;
    metricQuery?: Record<string, unknown>;
    condition: AlertCondition;
    threshold: number;
    compareValue?: number;
    timeWindow: number;
    aggregation: AggregationType;
    severity: AlertSeverity;
    channels: string[];
    recipients?: string[];
    webhookUrl?: string;
  },
  userId: string
) => {
  return prisma.alert_rules.create({
    data: {
      ...data,
      metricQuery: data.metricQuery as Prisma.InputJsonValue,
      recipients: data.recipients || [],
      createdById: userId,
    },
  });
};

// Update alert rule
export const updateAlertRule = async (
  id: string,
  data: Partial<{
    name: string;
    description: string;
    metricType: string;
    metricQuery: Record<string, unknown>;
    condition: AlertCondition;
    threshold: number;
    compareValue: number;
    timeWindow: number;
    aggregation: AggregationType;
    severity: AlertSeverity;
    channels: string[];
    recipients: string[];
    webhookUrl: string;
    isActive: boolean;
  }>
) => {
  return prisma.alert_rules.update({
    where: { id },
    data: {
      ...data,
      metricQuery: data.metricQuery as Prisma.InputJsonValue | undefined,
    },
  });
};

// Delete alert rule
export const deleteAlertRule = async (id: string) => {
  return prisma.alert_rules.delete({
    where: { id },
  });
};

// Get alert rules
export const getAlertRules = async (userId?: string) => {
  const where: Prisma.alert_rulesWhereInput = {};
  if (userId) {
    where.createdById = userId;
  }

  return prisma.alert_rules.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
};

// Get single alert rule
export const getAlertRule = async (id: string) => {
  return prisma.alert_rules.findUnique({
    where: { id },
    include: {
      alerts: {
        orderBy: { triggeredAt: 'desc' },
        take: 10,
      },
    },
  });
};

// Mute alert rule
export const muteAlertRule = async (id: string, duration?: number) => {
  const mutedUntil = duration
    ? new Date(Date.now() + duration * 60 * 1000)
    : null;

  return prisma.alert_rules.update({
    where: { id },
    data: {
      isMuted: true,
      mutedUntil,
    },
  });
};

// Unmute alert rule
export const unmuteAlertRule = async (id: string) => {
  return prisma.alert_rules.update({
    where: { id },
    data: {
      isMuted: false,
      mutedUntil: null,
    },
  });
};

// Check all alert rules (cron job)
export const checkAlertRules = async () => {
  const rules = await prisma.alert_rules.findMany({
    where: {
      isActive: true,
      OR: [{ isMuted: false }, { mutedUntil: { lt: new Date() } }],
    },
  });

  const results = {
    checked: 0,
    triggered: 0,
  };

  for (const rule of rules) {
    results.checked++;
    try {
      const triggered = await evaluateRule(rule);
      if (triggered) {
        results.triggered++;
      }

      // Update last checked time
      await prisma.alert_rules.update({
        where: { id: rule.id },
        data: { lastCheckedAt: new Date() },
      });
    } catch (error) {
      console.error(`Error evaluating rule ${rule.id}:`, error);
    }
  }

  return results;
};

// Evaluate a single rule
export const evaluateRule = async (rule: {
  id: string;
  metricType: string;
  metricQuery: Prisma.JsonValue;
  condition: AlertCondition;
  threshold: number;
  compareValue: number | null;
  timeWindow: number;
  aggregation: AggregationType;
}) => {
  const metricValue = await getMetricValue(
    rule.metricType,
    rule.metricQuery as Record<string, unknown>,
    rule.timeWindow,
    rule.aggregation
  );

  const isTriggered = checkCondition(
    metricValue,
    rule.condition,
    rule.threshold,
    rule.compareValue
  );

  if (isTriggered) {
    await triggerAlert(rule.id, metricValue, rule.threshold);
    return true;
  }

  return false;
};

// Get metric value based on type
const getMetricValue = async (
  metricType: string,
  metricQuery: Record<string, unknown> | null,
  timeWindow: number,
  aggregation: AggregationType
): Promise<number> => {
  const windowStart = new Date(Date.now() - timeWindow * 60 * 1000);

  switch (metricType) {
    case 'new_users':
      return prisma.users.count({
        where: { createdAt: { gte: windowStart } },
      });

    case 'revenue':
      const revenueResult = await prisma.payments.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: windowStart },
        },
        _sum: { amount: true },
        _avg: { amount: true },
        _count: true,
      });
      return applyAggregation(
        {
          sum: Number(revenueResult._sum.amount || 0) / 100,
          avg: Number(revenueResult._avg.amount || 0) / 100,
          count: revenueResult._count,
        },
        aggregation
      );

    case 'failed_payments':
      return prisma.payments.count({
        where: {
          status: 'FAILED',
          createdAt: { gte: windowStart },
        },
      });

    case 'cancelled_subscriptions':
      return prisma.subscriptions.count({
        where: {
          status: { in: ['CANCELLED', 'CANCELED'] },
          updatedAt: { gte: windowStart },
        },
      });

    case 'error_rate':
      // This would require an error logging system
      return 0;

    case 'active_users':
      const activeUsers = await prisma.video_progress.groupBy({
        by: ['userId'],
        where: { updatedAt: { gte: windowStart } },
      });
      return activeUsers.length;

    default:
      throw new Error(`Unknown metric type: ${metricType}`);
  }
};

// Apply aggregation
const applyAggregation = (
  values: { sum: number; avg: number; count: number; min?: number; max?: number },
  aggregation: AggregationType
): number => {
  switch (aggregation) {
    case 'SUM':
      return values.sum;
    case 'AVG':
      return values.avg;
    case 'COUNT':
      return values.count;
    case 'MIN':
      return values.min ?? 0;
    case 'MAX':
      return values.max ?? 0;
    case 'DISTINCT_COUNT':
      return values.count;
    default:
      return values.sum;
  }
};

// Check condition
const checkCondition = (
  value: number,
  condition: AlertCondition,
  threshold: number,
  compareValue: number | null
): boolean => {
  switch (condition) {
    case 'GREATER_THAN':
      return value > threshold;
    case 'LESS_THAN':
      return value < threshold;
    case 'EQUALS':
      return value === threshold;
    case 'NOT_EQUALS':
      return value !== threshold;
    case 'GREATER_THAN_OR_EQUAL':
      return value >= threshold;
    case 'LESS_THAN_OR_EQUAL':
      return value <= threshold;
    case 'PERCENTAGE_INCREASE':
      if (compareValue === null || compareValue === 0) return false;
      return ((value - compareValue) / compareValue) * 100 >= threshold;
    case 'PERCENTAGE_DECREASE':
      if (compareValue === null || compareValue === 0) return false;
      return ((compareValue - value) / compareValue) * 100 >= threshold;
    case 'ANOMALY':
      // Simplified anomaly detection - would use statistical methods
      return false;
    default:
      return false;
  }
};

// Trigger alert
export const triggerAlert = async (
  ruleId: string,
  metricValue: number,
  threshold: number
) => {
  const rule = await prisma.alert_rules.findUnique({
    where: { id: ruleId },
  });

  if (!rule) return;

  // Create alert
  const alert = await prisma.alerts.create({
    data: {
      ruleId,
      metricValue,
      threshold,
      status: 'TRIGGERED',
    },
  });

  // Update rule
  await prisma.alert_rules.update({
    where: { id: ruleId },
    data: {
      lastTriggeredAt: new Date(),
      triggerCount: { increment: 1 },
    },
  });

  // Send notifications
  await notifyAlert(alert, rule);

  return alert;
};

// Notify about alert
const notifyAlert = async (
  alert: { id: string; metricValue: number; threshold: number },
  rule: {
    name: string;
    description: string | null;
    severity: AlertSeverity;
    channels: string[];
    recipients: string[];
    webhookUrl: string | null;
  }
) => {
  const notificationStatus: Record<string, string> = {};

  for (const channel of rule.channels) {
    switch (channel) {
      case 'email':
        for (const recipient of rule.recipients) {
          try {
            await sendAlertEmail(recipient, rule, alert);
            notificationStatus[`email:${recipient}`] = 'sent';
          } catch (error) {
            notificationStatus[`email:${recipient}`] = 'failed';
          }
        }
        break;

      case 'webhook':
        if (rule.webhookUrl) {
          try {
            await sendAlertWebhook(rule.webhookUrl, rule, alert);
            notificationStatus['webhook'] = 'sent';
          } catch (error) {
            notificationStatus['webhook'] = 'failed';
          }
        }
        break;

      case 'slack':
        // Slack integration
        break;
    }
  }

  // Update alert with notification status
  await prisma.alerts.update({
    where: { id: alert.id },
    data: {
      notifiedAt: new Date(),
      notificationStatus: notificationStatus as Prisma.InputJsonValue,
    },
  });
};

// Send alert email
const sendAlertEmail = async (
  recipient: string,
  rule: { name: string; description: string | null; severity: AlertSeverity },
  alert: { id: string; metricValue: number; threshold: number }
) => {
  const severityColors = {
    INFO: '#3B82F6',
    WARNING: '#F59E0B',
    CRITICAL: '#EF4444',
  };

  await sendEmail({
    to: recipient,
    subject: `[${rule.severity}] Alert: ${rule.name}`,
    html: `
      <div style="border-left: 4px solid ${severityColors[rule.severity]}; padding-left: 16px;">
        <h2 style="color: ${severityColors[rule.severity]};">${rule.severity} Alert</h2>
        <h3>${rule.name}</h3>
        ${rule.description ? `<p>${rule.description}</p>` : ''}
        <p><strong>Metric Value:</strong> ${alert.metricValue}</p>
        <p><strong>Threshold:</strong> ${alert.threshold}</p>
        <p><strong>Triggered At:</strong> ${new Date().toLocaleString()}</p>
      </div>
    `,
  });
};

// Send alert to webhook
const sendAlertWebhook = async (
  webhookUrl: string,
  rule: { name: string; description: string | null; severity: AlertSeverity },
  alert: { id: string; metricValue: number; threshold: number }
) => {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'alert',
      alert: {
        id: alert.id,
        ruleName: rule.name,
        description: rule.description,
        severity: rule.severity,
        metricValue: alert.metricValue,
        threshold: alert.threshold,
        triggeredAt: new Date().toISOString(),
      },
    }),
  });
};

// Get alerts
export const getAlerts = async (filters?: {
  status?: AlertStatus;
  severity?: AlertSeverity;
  ruleId?: string;
  from?: Date;
  to?: Date;
}) => {
  const where: Prisma.alertsWhereInput = {};

  if (filters?.status) {
    where.status = filters.status;
  }
  if (filters?.ruleId) {
    where.ruleId = filters.ruleId;
  }
  if (filters?.from || filters?.to) {
    where.triggeredAt = {};
    if (filters.from) {
      where.triggeredAt.gte = filters.from;
    }
    if (filters.to) {
      where.triggeredAt.lte = filters.to;
    }
  }

  return prisma.alerts.findMany({
    where,
    include: {
      alert_rules: {
        select: {
          name: true,
          severity: true,
        },
      },
    },
    orderBy: { triggeredAt: 'desc' },
  });
};

// Get single alert
export const getAlert = async (id: string) => {
  return prisma.alerts.findUnique({
    where: { id },
    include: {
      alert_rules: true,
      users: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
};

// Acknowledge alert
export const acknowledgeAlert = async (id: string, userId: string) => {
  return prisma.alerts.update({
    where: { id },
    data: {
      status: 'ACKNOWLEDGED',
      acknowledgedById: userId,
      acknowledgedAt: new Date(),
    },
  });
};

// Resolve alert
export const resolveAlert = async (id: string, resolution: string) => {
  return prisma.alerts.update({
    where: { id },
    data: {
      status: 'RESOLVED',
      resolution,
      resolvedAt: new Date(),
    },
  });
};

// Get alert statistics
export const getAlertStats = async () => {
  const [
    totalAlerts,
    triggeredAlerts,
    acknowledgedAlerts,
    resolvedAlerts,
    alertsBySeverity,
    recentAlerts,
  ] = await Promise.all([
    prisma.alerts.count(),
    prisma.alerts.count({ where: { status: 'TRIGGERED' } }),
    prisma.alerts.count({ where: { status: 'ACKNOWLEDGED' } }),
    prisma.alerts.count({ where: { status: 'RESOLVED' } }),
    prisma.alerts.groupBy({
      by: ['status'],
      _count: true,
    }),
    prisma.alerts.count({
      where: {
        triggeredAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  return {
    totalAlerts,
    triggeredAlerts,
    acknowledgedAlerts,
    resolvedAlerts,
    alertsBySeverity: alertsBySeverity.map(a => ({
      status: a.status,
      count: a._count,
    })),
    alertsLast24Hours: recentAlerts,
  };
};
