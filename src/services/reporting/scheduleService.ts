import {
  PrismaClient,
  ScheduleFrequency,
  DateRangeType,
  ExportFormat,
  DeliveryMethod,
  ExecutionStatus,
  Prisma,
} from '@prisma/client';
import { generateReport } from './reportService';
import { processExport, createDirectExport } from './exportService';
import { sendEmail } from '../emailService';

const prisma = new PrismaClient();

// Create schedule
export const createSchedule = async (
  definitionId: string,
  config: {
    name: string;
    description?: string;
    frequency: ScheduleFrequency;
    cronExpression?: string;
    timezone?: string;
    hour?: number;
    minute?: number;
    dayOfWeek?: number;
    dayOfMonth?: number;
    filters: Record<string, unknown>;
    columns: string[];
    dateRangeType: DateRangeType;
    exportFormat: ExportFormat;
    deliveryMethod: DeliveryMethod;
    recipients?: string[];
    webhookUrl?: string;
  },
  userId: string
) => {
  const nextRunAt = calculateNextRunTime({
    frequency: config.frequency,
    cronExpression: config.cronExpression,
    timezone: config.timezone || 'UTC',
    hour: config.hour,
    minute: config.minute,
    dayOfWeek: config.dayOfWeek,
    dayOfMonth: config.dayOfMonth,
  });

  return prisma.report_schedules.create({
    data: {
      definitionId,
      name: config.name,
      description: config.description,
      frequency: config.frequency,
      cronExpression: config.cronExpression,
      timezone: config.timezone || 'UTC',
      hour: config.hour,
      minute: config.minute,
      dayOfWeek: config.dayOfWeek,
      dayOfMonth: config.dayOfMonth,
      filters: config.filters as Prisma.InputJsonValue,
      columns: config.columns,
      dateRangeType: config.dateRangeType,
      exportFormat: config.exportFormat,
      deliveryMethod: config.deliveryMethod,
      recipients: config.recipients || [],
      webhookUrl: config.webhookUrl,
      nextRunAt,
      createdById: userId,
    },
    include: {
      report_definitions: true,
    },
  });
};

// Update schedule
export const updateSchedule = async (
  id: string,
  config: Partial<{
    name: string;
    description: string;
    frequency: ScheduleFrequency;
    cronExpression: string;
    timezone: string;
    hour: number;
    minute: number;
    dayOfWeek: number;
    dayOfMonth: number;
    filters: Record<string, unknown>;
    columns: string[];
    dateRangeType: DateRangeType;
    exportFormat: ExportFormat;
    deliveryMethod: DeliveryMethod;
    recipients: string[];
    webhookUrl: string;
    isActive: boolean;
  }>
) => {
  const schedule = await prisma.report_schedules.findUnique({
    where: { id },
  });

  if (!schedule) {
    throw new Error('Schedule not found');
  }

  // Recalculate next run time if schedule parameters changed
  let nextRunAt = schedule.nextRunAt;
  if (
    config.frequency ||
    config.cronExpression ||
    config.hour !== undefined ||
    config.minute !== undefined ||
    config.dayOfWeek !== undefined ||
    config.dayOfMonth !== undefined
  ) {
    nextRunAt = calculateNextRunTime({
      frequency: config.frequency || schedule.frequency,
      cronExpression: config.cronExpression || schedule.cronExpression || undefined,
      timezone: config.timezone || schedule.timezone,
      hour: config.hour ?? schedule.hour ?? undefined,
      minute: config.minute ?? schedule.minute ?? undefined,
      dayOfWeek: config.dayOfWeek ?? schedule.dayOfWeek ?? undefined,
      dayOfMonth: config.dayOfMonth ?? schedule.dayOfMonth ?? undefined,
    });
  }

  return prisma.report_schedules.update({
    where: { id },
    data: {
      ...config,
      filters: config.filters as Prisma.InputJsonValue | undefined,
      nextRunAt,
    },
    include: {
      report_definitions: true,
    },
  });
};

// Delete schedule
export const deleteSchedule = async (id: string) => {
  return prisma.report_schedules.delete({
    where: { id },
  });
};

// Get schedule
export const getSchedule = async (id: string) => {
  return prisma.report_schedules.findUnique({
    where: { id },
    include: {
      report_definitions: true,
      schedule_executions: {
        orderBy: { startedAt: 'desc' },
        take: 10,
      },
    },
  });
};

// Get user schedules
export const getUserSchedules = async (userId: string) => {
  return prisma.report_schedules.findMany({
    where: { createdById: userId },
    include: {
      report_definitions: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

// Get active schedules due to run
export const getActiveSchedules = async () => {
  return prisma.report_schedules.findMany({
    where: {
      isActive: true,
      nextRunAt: { lte: new Date() },
    },
    include: {
      report_definitions: true,
    },
  });
};

// Execute schedule
export const executeSchedule = async (scheduleId: string) => {
  const schedule = await prisma.report_schedules.findUnique({
    where: { id: scheduleId },
    include: { report_definitions: true },
  });

  if (!schedule) {
    throw new Error('Schedule not found');
  }

  const startedAt = new Date();

  // Create execution record
  const execution = await prisma.schedule_executions.create({
    data: {
      scheduleId,
      status: 'RUNNING',
      deliveredTo: [],
      startedAt,
    },
  });

  try {
    // Generate report
    const reportData = await generateReport(schedule.definitionId, {
      filters: schedule.filters as Record<string, unknown>,
      columns: schedule.columns,
      dateRangeType: schedule.dateRangeType,
      limit: 10000,
    });

    // Create export
    const exportRecord = await createDirectExport(
      schedule.report_definitions.slug,
      schedule.filters as Record<string, unknown>,
      schedule.exportFormat,
      schedule.createdById
    );

    // Process export
    const exportResult = await processExport(exportRecord.id);

    // Deliver report
    const deliveryResult = await deliverReport(
      schedule,
      exportResult.fileUrl,
      schedule.report_definitions.name
    );

    // Update execution as completed
    await prisma.schedule_executions.update({
      where: { id: execution.id },
      data: {
        status: 'COMPLETED',
        fileUrl: exportResult.fileUrl,
        fileSize: exportResult.fileSize,
        rowCount: reportData.totalCount,
        deliveredTo: deliveryResult.deliveredTo,
        deliveryStatus: deliveryResult.status as Prisma.InputJsonValue,
        executionTime: Date.now() - startedAt.getTime(),
        completedAt: new Date(),
      },
    });

    // Update schedule
    const nextRunAt = calculateNextRunTime({
      frequency: schedule.frequency,
      cronExpression: schedule.cronExpression || undefined,
      timezone: schedule.timezone,
      hour: schedule.hour ?? undefined,
      minute: schedule.minute ?? undefined,
      dayOfWeek: schedule.dayOfWeek ?? undefined,
      dayOfMonth: schedule.dayOfMonth ?? undefined,
    });

    await prisma.report_schedules.update({
      where: { id: scheduleId },
      data: {
        lastRunAt: startedAt,
        lastRunStatus: 'SUCCESS',
        nextRunAt,
        runCount: { increment: 1 },
      },
    });

    return { execution, success: true };
  } catch (error) {
    // Update execution as failed
    await prisma.schedule_executions.update({
      where: { id: execution.id },
      data: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      },
    });

    // Update schedule failure count
    await prisma.report_schedules.update({
      where: { id: scheduleId },
      data: {
        lastRunAt: startedAt,
        lastRunStatus: 'FAILED',
        failureCount: { increment: 1 },
      },
    });

    throw error;
  }
};

// Process all scheduled reports (cron job)
export const processScheduledReports = async () => {
  const dueSchedules = await getActiveSchedules();

  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
  };

  for (const schedule of dueSchedules) {
    results.processed++;
    try {
      await executeSchedule(schedule.id);
      results.succeeded++;
    } catch (error) {
      results.failed++;
      console.error(`Failed to execute schedule ${schedule.id}:`, error);
    }
  }

  return results;
};

// Calculate next run time
export const calculateNextRunTime = (config: {
  frequency: ScheduleFrequency;
  cronExpression?: string;
  timezone: string;
  hour?: number;
  minute?: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
}): Date => {
  const now = new Date();
  const next = new Date(now);

  // Set time
  next.setHours(config.hour ?? 0, config.minute ?? 0, 0, 0);

  switch (config.frequency) {
    case 'DAILY':
      // If time already passed today, schedule for tomorrow
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      break;

    case 'WEEKLY':
      // Find next occurrence of the day
      const targetDay = config.dayOfWeek ?? 1; // Monday default
      let daysUntilTarget = targetDay - now.getDay();
      if (daysUntilTarget <= 0 || (daysUntilTarget === 0 && next <= now)) {
        daysUntilTarget += 7;
      }
      next.setDate(now.getDate() + daysUntilTarget);
      break;

    case 'MONTHLY':
      const targetDate = config.dayOfMonth ?? 1;
      next.setDate(targetDate);
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
      break;

    case 'QUARTERLY':
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3 + 3;
      next.setMonth(quarterMonth, config.dayOfMonth ?? 1);
      if (next <= now) {
        next.setMonth(next.getMonth() + 3);
      }
      break;

    case 'CUSTOM':
      // For custom cron expressions, use next day as default
      // Full cron parsing would require a library
      next.setDate(next.getDate() + 1);
      break;
  }

  return next;
};

// Deliver report
const deliverReport = async (
  schedule: {
    deliveryMethod: DeliveryMethod;
    recipients: string[];
    webhookUrl: string | null;
  },
  fileUrl: string,
  reportName: string
): Promise<{ deliveredTo: string[]; status: Record<string, string> }> => {
  const deliveredTo: string[] = [];
  const status: Record<string, string> = {};

  switch (schedule.deliveryMethod) {
    case 'EMAIL':
      for (const recipient of schedule.recipients) {
        try {
          await sendReportEmail(recipient, fileUrl, reportName);
          deliveredTo.push(recipient);
          status[recipient] = 'delivered';
        } catch (error) {
          status[recipient] = `failed: ${error instanceof Error ? error.message : 'unknown'}`;
        }
      }
      break;

    case 'WEBHOOK':
      if (schedule.webhookUrl) {
        try {
          await sendToWebhook(schedule.webhookUrl, fileUrl, {
            reportName,
            timestamp: new Date().toISOString(),
          });
          deliveredTo.push(schedule.webhookUrl);
          status[schedule.webhookUrl] = 'delivered';
        } catch (error) {
          status[schedule.webhookUrl] = `failed: ${error instanceof Error ? error.message : 'unknown'}`;
        }
      }
      break;

    case 'SLACK':
      for (const channelUrl of schedule.recipients) {
        try {
          await sendToSlack(channelUrl, fileUrl, reportName);
          deliveredTo.push(channelUrl);
          status[channelUrl] = 'delivered';
        } catch (error) {
          status[channelUrl] = `failed: ${error instanceof Error ? error.message : 'unknown'}`;
        }
      }
      break;

    case 'STORAGE':
      // File is already in storage, just mark as delivered
      deliveredTo.push('storage');
      status['storage'] = 'stored';
      break;
  }

  return { deliveredTo, status };
};

// Send report via email
const sendReportEmail = async (
  recipient: string,
  fileUrl: string,
  reportName: string
) => {
  await sendEmail({
    to: recipient,
    subject: `Scheduled Report: ${reportName}`,
    html: `
      <h2>Your scheduled report is ready</h2>
      <p>Report: <strong>${reportName}</strong></p>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <p>
        <a href="${fileUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">
          Download Report
        </a>
      </p>
      <p><small>This link will expire in 48 hours.</small></p>
    `,
  });
};

// Send to webhook
const sendToWebhook = async (
  webhookUrl: string,
  fileUrl: string,
  metadata: Record<string, unknown>
) => {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'scheduled_report',
      fileUrl,
      ...metadata,
    }),
  });

  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.status}`);
  }
};

// Send to Slack
const sendToSlack = async (
  channelUrl: string,
  fileUrl: string,
  reportName: string
) => {
  const response = await fetch(channelUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Scheduled Report Ready*\n${reportName}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Generated: ${new Date().toLocaleString()}`,
          },
          accessory: {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Download',
            },
            url: fileUrl,
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Slack notification failed: ${response.status}`);
  }
};

// Pause schedule
export const pauseSchedule = async (id: string) => {
  return prisma.report_schedules.update({
    where: { id },
    data: { isActive: false },
  });
};

// Resume schedule
export const resumeSchedule = async (id: string) => {
  const schedule = await prisma.report_schedules.findUnique({
    where: { id },
  });

  if (!schedule) {
    throw new Error('Schedule not found');
  }

  const nextRunAt = calculateNextRunTime({
    frequency: schedule.frequency,
    cronExpression: schedule.cronExpression || undefined,
    timezone: schedule.timezone,
    hour: schedule.hour ?? undefined,
    minute: schedule.minute ?? undefined,
    dayOfWeek: schedule.dayOfWeek ?? undefined,
    dayOfMonth: schedule.dayOfMonth ?? undefined,
  });

  return prisma.report_schedules.update({
    where: { id },
    data: {
      isActive: true,
      nextRunAt,
    },
  });
};

// Get schedule execution history
export const getScheduleHistory = async (
  scheduleId: string,
  limit: number = 20
) => {
  return prisma.schedule_executions.findMany({
    where: { scheduleId },
    orderBy: { startedAt: 'desc' },
    take: limit,
  });
};
