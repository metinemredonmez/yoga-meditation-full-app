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
  await prisma.adminAuditLog.create({
    data: {
      adminId,
      action,
      entityType,
      entityId: entityId || null,
      metadata: metadata ? (metadata as Prisma.JsonObject) : undefined,
    },
  });
}

// Get audit logs with pagination
export async function getAuditLogs(filters: AuditLogFilters) {
  const { adminId, action, entityType, entityId, startDate, endDate, page = 1, limit = 50 } = filters;

  const where: Prisma.AdminAuditLogWhereInput = {};
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
    prisma.adminAuditLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        admin: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    }),
    prisma.adminAuditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// Get audit log details
export async function getAuditLogDetails(logId: string) {
  return prisma.adminAuditLog.findUnique({
    where: { id: logId },
    include: {
      admin: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
}

// Get entity audit history
export async function getEntityAuditHistory(entityType: string, entityId: string) {
  return prisma.adminAuditLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: 'desc' },
    include: {
      admin: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
}

// Get admin activity summary
export async function getAdminActivitySummary(adminId: string, startDate?: Date, endDate?: Date) {
  const where: Prisma.AdminAuditLogWhereInput = { adminId };
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Prisma.DateTimeFilter).gte = startDate;
    if (endDate) (where.createdAt as Prisma.DateTimeFilter).lte = endDate;
  }

  const [totalActions, actionsByType, recentActions] = await Promise.all([
    prisma.adminAuditLog.count({ where }),
    prisma.adminAuditLog.groupBy({
      by: ['action'],
      where,
      _count: true,
    }),
    prisma.adminAuditLog.findMany({
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

  const [totalLogs, byAction, byEntityType] = await Promise.all([
    prisma.adminAuditLog.count({ where: { createdAt: { gte: startDate } } }),
    prisma.adminAuditLog.groupBy({
      by: ['action'],
      where: { createdAt: { gte: startDate } },
      _count: true,
    }),
    prisma.adminAuditLog.groupBy({
      by: ['entityType'],
      where: { createdAt: { gte: startDate } },
      _count: true,
    }),
  ]);

  return {
    totalLogs,
    byAction: Object.fromEntries(byAction.map((a) => [a.action, a._count])),
    byEntityType: Object.fromEntries(byEntityType.map((e) => [e.entityType, e._count])),
  };
}

// Search audit logs
export async function searchAuditLogs(query: string, page = 1, limit = 50) {
  const where: Prisma.AdminAuditLogWhereInput = {
    OR: [
      { entityId: { contains: query } },
      { admin: { firstName: { contains: query, mode: 'insensitive' } } },
      { admin: { lastName: { contains: query, mode: 'insensitive' } } },
      { admin: { email: { contains: query, mode: 'insensitive' } } },
    ],
  };

  const [logs, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        admin: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    }),
    prisma.adminAuditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// Export audit logs
export async function exportAuditLogs(filters: AuditLogFilters) {
  const where: Prisma.AdminAuditLogWhereInput = {};
  if (filters.adminId) where.adminId = filters.adminId;
  if (filters.action) where.action = filters.action;
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) (where.createdAt as Prisma.DateTimeFilter).gte = filters.startDate;
    if (filters.endDate) (where.createdAt as Prisma.DateTimeFilter).lte = filters.endDate;
  }

  return prisma.adminAuditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      admin: { select: { firstName: true, lastName: true, email: true } },
    },
  });
}
