import { z } from 'zod';

// ================== Dashboard Schemas ==================

export const dashboardPreferenceSchema = z.object({
  widgetOrder: z.array(z.string()).optional(),
  hiddenWidgets: z.array(z.string()).optional(),
  refreshInterval: z.number().min(10).max(3600).optional(),
  defaultDateRange: z.enum(['today', 'week', 'month', 'quarter', 'year']).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
});

export const chartMetricSchema = z.object({
  params: z.object({
    metric: z.enum(['users', 'revenue', 'sessions', 'content', 'subscriptions']),
  }),
  query: z.object({
    period: z.enum(['day', 'week', 'month', 'quarter', 'year']).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

// ================== User Management Schemas ==================

export const userSearchSchema = z.object({
  search: z.string().optional(),
  role: z.enum(['USER', 'INSTRUCTOR', 'ADMIN']).optional(),
  status: z.enum(['active', 'banned', 'inactive']).optional(),
  subscriptionStatus: z.enum(['FREE', 'BASIC', 'PREMIUM', 'LIFETIME']).optional(),
  sortBy: z.enum(['createdAt', 'lastActiveAt', 'email', 'name']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

export const userBanSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(10).max(1000),
  expiresAt: z.string().datetime().optional(),
  sendNotification: z.boolean().optional(),
});

export const userUnbanSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(5).max(500).optional(),
});

export const userWarningSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(10).max(1000),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  sendNotification: z.boolean().optional(),
});

export const userRoleChangeSchema = z.object({
  userId: z.string().uuid(),
  newRole: z.enum(['USER', 'INSTRUCTOR', 'ADMIN']),
  reason: z.string().min(5).max(500).optional(),
});

// ================== Content Management Schemas ==================

export const contentSearchSchema = z.object({
  search: z.string().optional(),
  type: z.enum(['program', 'class', 'pose', 'challenge']).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  instructorId: z.string().uuid().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'viewCount']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

export const contentApproveSchema = z.object({
  contentId: z.string().uuid(),
  contentType: z.enum(['program', 'class', 'pose', 'challenge']),
  notes: z.string().max(1000).optional(),
});

export const contentRejectSchema = z.object({
  contentId: z.string().uuid(),
  contentType: z.enum(['program', 'class', 'pose', 'challenge']),
  reason: z.string().min(10).max(1000),
  sendNotification: z.boolean().optional(),
});

export const contentFeatureSchema = z.object({
  contentId: z.string().uuid(),
  contentType: z.enum(['program', 'class', 'pose', 'challenge']),
  featuredUntil: z.string().datetime().optional(),
  position: z.number().min(1).max(100).optional(),
});

// ================== Financial Schemas ==================

export const refundSchema = z.object({
  paymentId: z.string().uuid(),
  amount: z.number().positive().optional(),
  reason: z.string().min(10).max(1000),
  notifyUser: z.boolean().optional(),
});

export const couponSchema = z.object({
  code: z.string().min(3).max(50).regex(/^[A-Z0-9_-]+$/),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_TRIAL']),
  value: z.number().min(0),
  description: z.string().max(500).optional(),
  minPurchaseAmount: z.number().min(0).optional(),
  maxDiscountAmount: z.number().min(0).optional(),
  maxUses: z.number().min(1).optional(),
  maxUsesPerUser: z.number().min(1).optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  applicablePlans: z.array(z.string().uuid()).optional(),
  isActive: z.boolean().optional(),
});

export const couponUpdateSchema = couponSchema.partial();

export const subscriptionAdjustSchema = z.object({
  subscriptionId: z.string().uuid(),
  action: z.enum(['extend', 'reduce', 'upgrade', 'downgrade', 'cancel']),
  days: z.number().min(1).max(365).optional(),
  newPlanId: z.string().uuid().optional(),
  reason: z.string().min(5).max(500),
  notifyUser: z.boolean().optional(),
});

// ================== Settings Schemas ==================

export const systemSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string(),
  type: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'ENCRYPTED']),
  category: z.enum(['GENERAL', 'SECURITY', 'EMAIL', 'PAYMENT', 'NOTIFICATION', 'FEATURE', 'LIMIT']),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
});

export const systemSettingUpdateSchema = z.object({
  value: z.string(),
  description: z.string().max(500).optional(),
});

export const featureFlagSchema = z.object({
  key: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  isEnabled: z.boolean(),
  rolloutPercentage: z.number().min(0).max(100).optional(),
  allowedUserIds: z.array(z.string().uuid()).optional(),
  allowedRoles: z.array(z.enum(['USER', 'INSTRUCTOR', 'ADMIN'])).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const featureFlagUpdateSchema = featureFlagSchema.partial().omit({ key: true });

// ================== Analytics Schemas ==================

export const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  granularity: z.enum(['hour', 'day', 'week', 'month']).optional(),
  metrics: z.array(z.string()).optional(),
  dimensions: z.array(z.string()).optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
});

export const reportGenerateSchema = z.object({
  type: z.enum(['users', 'revenue', 'content', 'engagement', 'custom']),
  format: z.enum(['json', 'csv', 'pdf']).optional(),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }),
  filters: z.record(z.string(), z.unknown()).optional(),
  includeCharts: z.boolean().optional(),
});

// ================== Audit Schemas ==================

export const auditLogSearchSchema = z.object({
  adminId: z.string().uuid().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  ipAddress: z.string().optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

// ================== Moderation Schemas ==================

export const reportActionSchema = z.object({
  reportId: z.string().uuid(),
  action: z.enum(['approve', 'reject', 'escalate', 'resolve']),
  resolution: z.string().min(5).max(1000).optional(),
  actionTaken: z.enum(['none', 'warning', 'content_removed', 'user_banned']).optional(),
  notifyReporter: z.boolean().optional(),
  notifyReported: z.boolean().optional(),
});

export const contentModerationSchema = z.object({
  contentId: z.string().uuid(),
  contentType: z.enum(['comment', 'forumPost', 'forumThread', 'review']),
  action: z.enum(['approve', 'reject', 'flag', 'delete']),
  reason: z.string().max(1000).optional(),
  notifyUser: z.boolean().optional(),
});

// ================== Maintenance Schemas ==================

export const maintenanceWindowSchema = z.object({
  type: z.enum(['SCHEDULED', 'EMERGENCY', 'ROLLING']),
  title: z.string().min(5).max(200),
  description: z.string().max(2000).optional(),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime(),
  affectedServices: z.array(z.string()).optional(),
  notifyUsers: z.boolean().optional(),
  allowedRoles: z.array(z.enum(['ADMIN'])).optional(),
});

export const maintenanceWindowUpdateSchema = maintenanceWindowSchema.partial();

export const cacheControlSchema = z.object({
  keys: z.array(z.string()).optional(),
  patterns: z.array(z.string()).optional(),
  all: z.boolean().optional(),
});

// ================== Export Schemas ==================

export const exportJobSchema = z.object({
  type: z.enum(['USERS', 'PAYMENTS', 'CONTENT', 'ANALYTICS', 'AUDIT_LOGS', 'CUSTOM']),
  format: z.enum(['CSV', 'JSON', 'XLSX', 'PDF']),
  filters: z.record(z.string(), z.unknown()).optional(),
  columns: z.array(z.string()).optional(),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }).optional(),
  notifyOnComplete: z.boolean().optional(),
});

// ================== Bulk Action Schemas ==================

export const bulkActionJobSchema = z.object({
  type: z.string().min(1).max(100),
  targetIds: z.array(z.string().uuid()).min(1).max(10000),
  parameters: z.record(z.string(), z.unknown()).optional(),
  dryRun: z.boolean().optional(),
  notifyOnComplete: z.boolean().optional(),
});

export const bulkDeleteUsersSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1).max(100),
  reason: z.string().min(10).max(1000),
  sendNotification: z.boolean().optional(),
  hardDelete: z.boolean().optional(),
});

export const bulkBanUsersSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1).max(100),
  reason: z.string().min(10).max(1000),
  expiresAt: z.string().datetime().optional(),
  sendNotification: z.boolean().optional(),
});

export const bulkNotificationSchema = z.object({
  userIds: z.array(z.string().uuid()).optional(),
  userFilters: z.record(z.string(), z.unknown()).optional(),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
  data: z.record(z.string(), z.unknown()).optional(),
  channels: z.array(z.enum(['push', 'email', 'sms', 'in_app'])).min(1),
  scheduledAt: z.string().datetime().optional(),
});

export const bulkSubscriptionUpdateSchema = z.object({
  subscriptionIds: z.array(z.string().uuid()).min(1).max(100),
  action: z.enum(['extend', 'cancel', 'pause', 'resume']),
  days: z.number().min(1).max(365).optional(),
  reason: z.string().min(5).max(500),
  notifyUsers: z.boolean().optional(),
});

// ================== Notes Schemas ==================

export const adminNoteSchema = z.object({
  entityType: z.string().min(1).max(50),
  entityId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  isPinned: z.boolean().optional(),
  isInternal: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export const adminNoteUpdateSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  isPinned: z.boolean().optional(),
  isInternal: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export const savedReportSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: z.string().min(1).max(50),
  config: z.record(z.string(), z.unknown()),
  isShared: z.boolean().optional(),
  scheduleEnabled: z.boolean().optional(),
  scheduleCron: z.string().max(100).optional(),
});

export const savedReportUpdateSchema = savedReportSchema.partial();

// ================== Pagination Schema ==================

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// ================== ID Params Schema ==================

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const entityParamsSchema = z.object({
  entityType: z.string().min(1).max(50),
  entityId: z.string().uuid(),
});

// ================== Export Types ==================

export type DashboardPreferenceInput = z.infer<typeof dashboardPreferenceSchema>;
export type UserSearchInput = z.infer<typeof userSearchSchema>;
export type UserBanInput = z.infer<typeof userBanSchema>;
export type UserWarningInput = z.infer<typeof userWarningSchema>;
export type UserRoleChangeInput = z.infer<typeof userRoleChangeSchema>;
export type ContentSearchInput = z.infer<typeof contentSearchSchema>;
export type RefundInput = z.infer<typeof refundSchema>;
export type CouponInput = z.infer<typeof couponSchema>;
export type SubscriptionAdjustInput = z.infer<typeof subscriptionAdjustSchema>;
export type SystemSettingInput = z.infer<typeof systemSettingSchema>;
export type FeatureFlagInput = z.infer<typeof featureFlagSchema>;
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
export type ReportGenerateInput = z.infer<typeof reportGenerateSchema>;
export type AuditLogSearchInput = z.infer<typeof auditLogSearchSchema>;
export type ReportActionInput = z.infer<typeof reportActionSchema>;
export type ContentModerationInput = z.infer<typeof contentModerationSchema>;
export type MaintenanceWindowInput = z.infer<typeof maintenanceWindowSchema>;
export type CacheControlInput = z.infer<typeof cacheControlSchema>;
export type ExportJobInput = z.infer<typeof exportJobSchema>;
export type BulkActionJobInput = z.infer<typeof bulkActionJobSchema>;
export type BulkDeleteUsersInput = z.infer<typeof bulkDeleteUsersSchema>;
export type BulkBanUsersInput = z.infer<typeof bulkBanUsersSchema>;
export type BulkNotificationInput = z.infer<typeof bulkNotificationSchema>;
export type AdminNoteInput = z.infer<typeof adminNoteSchema>;
export type SavedReportInput = z.infer<typeof savedReportSchema>;
