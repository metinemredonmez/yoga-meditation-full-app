import { prisma } from '../../utils/database';
import { AdminAction, Prisma } from '@prisma/client';

export interface AuditLogFilters {
  adminId?: string;
  action?: AdminAction;
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

// Log admin action
export async function logAdminAction(
  adminId: string,
  action: AdminAction,
  entityType: string,
  entityId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await prisma.admin_audit_logs.create({
    data: {
      adminId,
      action,
      entityType,
      entityId: entityId || null,
      metadata: metadata ? (metadata as Prisma.JsonObject) : undefined,
    },
  });
}

// Transform log to frontend format
function transformLog(log: any) {
  return {
    id: log.id,
    adminId: log.adminId,
    adminEmail: log.users?.email || '',
    adminName: log.users ? `${log.users.firstName || ''} ${log.users.lastName || ''}`.trim() : '',
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId || '',
    details: log.metadata || {},
    ipAddress: log.ipAddress || '',
    userAgent: log.userAgent || '',
    createdAt: log.createdAt,
  };
}

// Get audit logs with pagination
export async function getAuditLogs(filters: AuditLogFilters) {
  const { adminId, action, entityType, entityId, startDate, endDate, page = 1, limit = 50 } = filters;

  const where: Prisma.admin_audit_logsWhereInput = {};
  if (adminId) where.adminId = adminId;
  if (action) where.action = action;
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Prisma.DateTimeFilter).gte = startDate;
    if (endDate) (where.createdAt as Prisma.DateTimeFilter).lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.admin_audit_logs.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        users: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    }),
    prisma.admin_audit_logs.count({ where }),
  ]);

  return {
    logs: logs.map(transformLog),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// Get audit log details
export async function getAuditLogDetails(logId: string) {
  return prisma.admin_audit_logs.findUnique({
    where: { id: logId },
    include: {
      users: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
}

// Get entity audit history
export async function getEntityAuditHistory(entityType: string, entityId: string) {
  return prisma.admin_audit_logs.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: 'desc' },
    include: {
      users: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
}

// Get admin activity summary
export async function getAdminActivitySummary(adminId: string, startDate?: Date, endDate?: Date) {
  const where: Prisma.admin_audit_logsWhereInput = { adminId };
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Prisma.DateTimeFilter).gte = startDate;
    if (endDate) (where.createdAt as Prisma.DateTimeFilter).lte = endDate;
  }

  const [totalActions, actionsByType, recentActions] = await Promise.all([
    prisma.admin_audit_logs.count({ where }),
    prisma.admin_audit_logs.groupBy({
      by: ['action'],
      where,
      _count: true,
    }),
    prisma.admin_audit_logs.findMany({
      where,
      take: 10,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    totalActions,
    actionsByType: Object.fromEntries(actionsByType.map((a) => [a.action, a._count])),
    recentActions,
  };
}

// Get audit stats
export async function getAuditStats(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const last24Hours = new Date();
  last24Hours.setHours(last24Hours.getHours() - 24);

  const [totalLogs, byAction, byEntityType, recentActivity, topAdmins] = await Promise.all([
    prisma.admin_audit_logs.count({ where: { createdAt: { gte: startDate } } }),
    prisma.admin_audit_logs.groupBy({
      by: ['action'],
      where: { createdAt: { gte: startDate } },
      _count: true,
    }),
    prisma.admin_audit_logs.groupBy({
      by: ['entityType'],
      where: { createdAt: { gte: startDate } },
      _count: true,
    }),
    prisma.admin_audit_logs.count({ where: { createdAt: { gte: last24Hours } } }),
    prisma.admin_audit_logs.groupBy({
      by: ['adminId'],
      where: { createdAt: { gte: startDate } },
      _count: true,
      orderBy: { _count: { adminId: 'desc' } },
      take: 5,
    }),
  ]);

  return {
    totalLogs,
    actionCounts: Object.fromEntries(byAction.map((a) => [a.action, a._count])),
    byAction: Object.fromEntries(byAction.map((a) => [a.action, a._count])),
    byEntityType: Object.fromEntries(byEntityType.map((e) => [e.entityType, e._count])),
    recentActivity,
    topAdmins: topAdmins.map((a) => ({ adminId: a.adminId, count: a._count })),
  };
}

// Search audit logs
export async function searchAuditLogs(query: string, page = 1, limit = 50) {
  const where: Prisma.admin_audit_logsWhereInput = {
    OR: [
      { entityId: { contains: query } },
      { users: { firstName: { contains: query, mode: 'insensitive' } } },
      { users: { lastName: { contains: query, mode: 'insensitive' } } },
      { users: { email: { contains: query, mode: 'insensitive' } } },
    ],
  };

  const [logs, total] = await Promise.all([
    prisma.admin_audit_logs.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        users: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    }),
    prisma.admin_audit_logs.count({ where }),
  ]);

  return {
    logs: logs.map(transformLog),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// Export audit logs
export async function exportAuditLogs(filters: AuditLogFilters) {
  const where: Prisma.admin_audit_logsWhereInput = {};
  if (filters.adminId) where.adminId = filters.adminId;
  if (filters.action) where.action = filters.action;
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) (where.createdAt as Prisma.DateTimeFilter).gte = filters.startDate;
    if (filters.endDate) (where.createdAt as Prisma.DateTimeFilter).lte = filters.endDate;
  }

  const logs = await prisma.admin_audit_logs.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      users: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });

  return logs.map(transformLog);
}
