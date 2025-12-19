import { z } from 'zod';

// Date range type enum
const dateRangeTypeEnum = z.enum([
  'TODAY',
  'YESTERDAY',
  'LAST_7_DAYS',
  'LAST_30_DAYS',
  'LAST_90_DAYS',
  'THIS_MONTH',
  'LAST_MONTH',
  'THIS_QUARTER',
  'LAST_QUARTER',
  'THIS_YEAR',
  'LAST_YEAR',
  'CUSTOM',
  'ALL_TIME',
]);

// Export format enum
const exportFormatEnum = z.enum(['CSV', 'EXCEL', 'PDF', 'JSON', 'XML']);

// Schedule frequency enum
const scheduleFrequencyEnum = z.enum([
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'CUSTOM',
]);

// Delivery method enum
const deliveryMethodEnum = z.enum(['EMAIL', 'WEBHOOK', 'STORAGE', 'SLACK']);

// Alert condition enum
const alertConditionEnum = z.enum([
  'GREATER_THAN',
  'LESS_THAN',
  'EQUALS',
  'NOT_EQUALS',
  'GREATER_THAN_OR_EQUAL',
  'LESS_THAN_OR_EQUAL',
  'PERCENTAGE_INCREASE',
  'PERCENTAGE_DECREASE',
  'ANOMALY',
]);

// Aggregation type enum
const aggregationTypeEnum = z.enum([
  'SUM',
  'AVG',
  'MIN',
  'MAX',
  'COUNT',
  'DISTINCT_COUNT',
]);

// Alert severity enum
const alertSeverityEnum = z.enum(['INFO', 'WARNING', 'CRITICAL']);

// Report generation schema
export const reportGenerateBodySchema = z
  .object({
    definitionId: z.string().optional(),
    definitionSlug: z.string().optional(),
    filters: z.record(z.string(), z.any()).optional(),
    columns: z.array(z.string()).optional(),
    groupBy: z.array(z.string()).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    dateRangeType: dateRangeTypeEnum.optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    page: z.number().int().min(1).default(1).optional(),
    limit: z.number().int().min(1).max(10000).default(100).optional(),
  })
  .refine((data) => data.definitionId || data.definitionSlug, {
    message: 'Either definitionId or definitionSlug is required',
  });

// Report instance schema
export const reportInstanceBodySchema = z.object({
  definitionId: z.string(),
  name: z.string().optional(),
  filters: z.record(z.string(), z.any()).optional(),
  columns: z.array(z.string()).optional(),
  groupBy: z.array(z.string()).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  dateRangeType: dateRangeTypeEnum.optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  chartType: z.string().optional(),
  chartConfig: z.record(z.string(), z.any()).optional(),
});

// Export schema
export const exportBodySchema = z
  .object({
    instanceId: z.string().optional(),
    reportType: z.string().optional(),
    filters: z.record(z.string(), z.any()).optional(),
    format: exportFormatEnum,
  })
  .refine((data) => data.instanceId || data.reportType, {
    message: 'Either instanceId or reportType is required',
  });

// Schedule schema
export const scheduleBodySchema = z.object({
  definitionId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  frequency: scheduleFrequencyEnum,
  cronExpression: z.string().optional(),
  timezone: z.string().default('UTC'),
  hour: z.number().int().min(0).max(23).optional(),
  minute: z.number().int().min(0).max(59).optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  filters: z.record(z.string(), z.any()).default({}),
  columns: z.array(z.string()).default([]),
  dateRangeType: dateRangeTypeEnum,
  exportFormat: exportFormatEnum,
  deliveryMethod: deliveryMethodEnum,
  recipients: z.array(z.string().email()).optional(),
  webhookUrl: z.string().url().optional(),
});

// Schedule update schema
export const scheduleUpdateBodySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  frequency: scheduleFrequencyEnum.optional(),
  cronExpression: z.string().optional(),
  timezone: z.string().optional(),
  hour: z.number().int().min(0).max(23).optional(),
  minute: z.number().int().min(0).max(59).optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  filters: z.record(z.string(), z.any()).optional(),
  columns: z.array(z.string()).optional(),
  dateRangeType: dateRangeTypeEnum.optional(),
  exportFormat: exportFormatEnum.optional(),
  deliveryMethod: deliveryMethodEnum.optional(),
  recipients: z.array(z.string().email()).optional(),
  webhookUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

// Alert rule schema
export const alertRuleBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  metricType: z.string(),
  metricQuery: z.record(z.string(), z.any()).optional(),
  condition: alertConditionEnum,
  threshold: z.number(),
  compareValue: z.number().optional(),
  timeWindow: z.number().int().positive(),
  aggregation: aggregationTypeEnum,
  severity: alertSeverityEnum,
  channels: z.array(z.string()),
  recipients: z.array(z.string()).optional(),
  webhookUrl: z.string().url().optional(),
});

// Alert rule update schema
export const alertRuleUpdateBodySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  metricType: z.string().optional(),
  metricQuery: z.record(z.string(), z.any()).optional(),
  condition: alertConditionEnum.optional(),
  threshold: z.number().optional(),
  compareValue: z.number().optional(),
  timeWindow: z.number().int().positive().optional(),
  aggregation: aggregationTypeEnum.optional(),
  severity: alertSeverityEnum.optional(),
  channels: z.array(z.string()).optional(),
  recipients: z.array(z.string()).optional(),
  webhookUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

// Widget position schema
export const widgetPositionBodySchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  width: z.number().int().min(1).max(12),
  height: z.number().int().min(1).max(10),
});

// Dashboard update schema
export const dashboardUpdateBodySchema = z.object({
  widgets: z.array(
    z.object({
      widgetId: z.string(),
      positionX: z.number().int().min(0),
      positionY: z.number().int().min(0),
      width: z.number().int().min(1).max(12),
      height: z.number().int().min(1).max(10),
    })
  ),
});

// Analytics filter schema
export const analyticsFilterSchema = z.object({
  query: z.object({
    dateRangeType: dateRangeTypeEnum.optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    granularity: z
      .enum(['hour', 'day', 'week', 'month', 'quarter', 'year'])
      .optional(),
    filters: z.string().optional(), // JSON string
  }),
});

// Custom query schema
export const customQuerySchema = z.object({
  body: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    queryType: z.enum(['SQL', 'PRISMA', 'AGGREGATION']),
    query: z.string().min(1),
    parameters: z.record(z.string(), z.any()).optional(),
  }),
});
