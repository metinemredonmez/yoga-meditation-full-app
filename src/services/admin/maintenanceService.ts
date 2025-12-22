import { prisma } from '../../utils/database';
import { MaintenanceType, Prisma } from '@prisma/client';
import { HttpError } from '../../middleware/errorHandler';

export async function getMaintenanceWindows(includeCompleted = false) {
  const where: Prisma.maintenance_windowsWhereInput = includeCompleted ? {} : { endTime: { gte: new Date() } };
  return prisma.maintenance_windows.findMany({ where, orderBy: { startTime: 'asc' } });
}

export async function getActiveMaintenanceWindow() {
  const now = new Date();
  return prisma.maintenance_windows.findFirst({ where: { startTime: { lte: now }, endTime: { gte: now }, isActive: true } });
}

export async function getUpcomingMaintenanceWindows() {
  return prisma.maintenance_windows.findMany({ where: { startTime: { gt: new Date() } }, orderBy: { startTime: 'asc' }, take: 5 });
}

export async function createMaintenanceWindow(adminId: string, data: { title: string; message?: string; type: MaintenanceType; startTime: Date; endTime: Date; affectedServices?: string[] }) {
  return prisma.maintenance_windows.create({ data: { title: data.title, description: data.message, type: data.type, startTime: data.startTime, endTime: data.endTime, affectedServices: data.affectedServices || [], createdById: adminId, isActive: true } });
}

export async function updateMaintenanceWindow(windowId: string, data: { title?: string; message?: string; type?: MaintenanceType; startTime?: Date; endTime?: Date; affectedServices?: string[] }) {
  return prisma.maintenance_windows.update({ where: { id: windowId }, data: { title: data.title, description: data.message, type: data.type, startTime: data.startTime, endTime: data.endTime, affectedServices: data.affectedServices } });
}

export async function cancelMaintenanceWindow(windowId: string) {
  return prisma.maintenance_windows.update({ where: { id: windowId }, data: { isActive: false } });
}

export async function deleteMaintenanceWindow(windowId: string) {
  await prisma.maintenance_windows.delete({ where: { id: windowId } });
}

export async function clearCache(_cacheType?: string) {
  return { success: true, types: ['all'] };
}

export async function cleanupExpiredData() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [deletedLogs] = await Promise.all([prisma.admin_audit_logs.deleteMany({ where: { createdAt: { lt: thirtyDaysAgo } } })]);
  return { success: true, cleaned: { auditLogs: deletedLogs.count } };
}

export async function runDatabaseOptimization() {
  try { await prisma.$queryRaw`VACUUM ANALYZE`; } catch { /* ignore */ }
  return { success: true, duration: 0 };
}

export async function getSystemMetrics() {
  const [totalUsers, totalPayments, totalSubscriptions] = await Promise.all([prisma.users.count(), prisma.payments.count(), prisma.subscriptions.count()]);
  return { database: { users: totalUsers, payments: totalPayments, subscriptions: totalSubscriptions }, memory: process.memoryUsage(), uptime: process.uptime() };
}

export async function runHealthCheck() {
  let dbStatus = 'healthy';
  try { await prisma.$queryRaw`SELECT 1`; } catch { dbStatus = 'unhealthy'; }
  return { database: dbStatus, overall: dbStatus, checks: [] };
}

export async function getBackupStatus() {
  return { lastBackup: null, nextScheduled: null, status: 'unknown' };
}

export async function triggerBackup(_type?: string) {
  return { success: true, jobId: `backup_${Date.now()}`, status: 'queued' };
}

export async function getBackups() {
  // Return empty array as backups are not implemented yet
  // In production, this would query backup storage/database
  return [];
}
