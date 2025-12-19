import { prisma } from '../../utils/database';
import { BulkActionStatus, Prisma } from '@prisma/client';
import { HttpError } from '../../middleware/errorHandler';

export type BulkActionType =
  | 'delete_users'
  | 'ban_users'
  | 'unban_users'
  | 'change_role'
  | 'send_notification'
  | 'cancel_subscriptions'
  | 'delete_content';

// Get bulk action jobs
export async function getBulkActionJobs(adminId?: string, page = 1, limit = 20) {
  const where: Prisma.bulk_action_jobsWhereInput = adminId ? { adminId } : {};

  const [jobs, total] = await Promise.all([
    prisma.bulk_action_jobs.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.bulk_action_jobs.count({ where }),
  ]);

  return {
    jobs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// Get single bulk action job
export async function getBulkActionJob(jobId: string) {
  const job = await prisma.bulk_action_jobs.findUnique({
    where: { id: jobId },
  });

  if (!job) throw new HttpError(404, 'Bulk action job not found');
  return job;
}

// Create bulk action job
export async function createBulkActionJob(
  adminId: string,
  data: {
    actionType: BulkActionType;
    entityIds: string[];
    parameters?: object;
  }
) {
  const job = await prisma.bulk_action_jobs.create({
    data: {
      action: data.actionType,
      entityType: 'user',
      entityIds: data.entityIds,
      parameters: data.parameters as Prisma.JsonObject,
      totalCount: data.entityIds.length,
      successCount: 0,
      failureCount: 0,
      status: 'PENDING',
      adminId,
    },
  });

  // Start processing in background
  processBulkActionJob(job.id).catch(console.error);

  return job;
}

// Cancel bulk action job
export async function cancelBulkActionJob(jobId: string) {
  const job = await prisma.bulk_action_jobs.findUnique({ where: { id: jobId } });
  if (!job) throw new HttpError(404, 'Bulk action job not found');

  if (job.status !== 'PENDING' && job.status !== 'PROCESSING') {
    throw new HttpError(400, 'Cannot cancel job that is not pending or processing');
  }

  return prisma.bulk_action_jobs.update({
    where: { id: jobId },
    data: { status: 'CANCELLED' },
  });
}

// Process bulk action job in background
async function processBulkActionJob(jobId: string) {
  const job = await prisma.bulk_action_jobs.update({
    where: { id: jobId },
    data: { status: 'PROCESSING', startedAt: new Date() },
  });

  let successCount = 0;
  let failureCount = 0;

  try {
    for (const entityId of job.entityIds) {
      const currentJob = await prisma.bulk_action_jobs.findUnique({ where: { id: jobId } });
      if (currentJob?.status === 'CANCELLED') break;

      try {
        await processEntity(job.action as BulkActionType, entityId);
        successCount++;
      } catch {
        failureCount++;
      }

      await prisma.bulk_action_jobs.update({
        where: { id: jobId },
        data: { progress: successCount + failureCount },
      });
    }

    let finalStatus: BulkActionStatus = 'COMPLETED';
    if (failureCount > 0 && successCount > 0) finalStatus = 'PARTIAL';
    else if (failureCount > 0 && successCount === 0) finalStatus = 'FAILED';

    await prisma.bulk_action_jobs.update({
      where: { id: jobId },
      data: {
        status: finalStatus,
        completedAt: new Date(),
        successCount,
        failureCount,
      },
    });
  } catch (error) {
    await prisma.bulk_action_jobs.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

async function processEntity(actionType: BulkActionType, entityId: string): Promise<void> {
  switch (actionType) {
    case 'delete_users':
      await prisma.users.delete({ where: { id: entityId } });
      break;
    case 'ban_users':
      await prisma.user_bans.create({
        data: { userId: entityId, bannedById: 'system', reason: 'Bulk ban', isActive: true },
      });
      break;
    case 'unban_users':
      await prisma.user_bans.updateMany({
        where: { userId: entityId, isActive: true },
        data: { isActive: false, unbannedAt: new Date() },
      });
      break;
    case 'cancel_subscriptions':
      await prisma.subscriptions.update({
        where: { id: entityId },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      });
      break;
    default:
      break;
  }
}

// Quick Bulk Actions
export async function bulkDeleteUsers(userIds: string[], _adminId: string) {
  const result = await prisma.users.deleteMany({ where: { id: { in: userIds } } });
  return { deleted: result.count };
}

export async function bulkBanUsers(userIds: string[], adminId: string, reason: string, expiresAt?: Date) {
  const results = [];
  for (const userId of userIds) {
    try {
      await prisma.user_bans.create({
        data: { userId, bannedById: adminId, reason, expiresAt, isActive: true },
      });
      results.push({ userId, success: true });
    } catch {
      results.push({ userId, success: false });
    }
  }
  return { total: userIds.length, success: results.filter(r => r.success).length, failed: results.filter(r => !r.success).length };
}

export async function bulkUnbanUsers(userIds: string[], adminId: string) {
  const result = await prisma.user_bans.updateMany({
    where: { userId: { in: userIds }, isActive: true },
    data: { isActive: false, unbannedById: adminId, unbannedAt: new Date() },
  });
  return { unbanned: result.count };
}

export async function bulkSendNotification(userIds: string[], title: string, message: string) {
  const notifications = userIds.map(userId => ({
    userId,
    type: 'PUSH' as const,
    title,
    body: message,
    status: 'PENDING' as const,
  }));
  const result = await prisma.notification_logs.createMany({ data: notifications });
  return { sent: result.count };
}

export async function bulkUpdateSubscriptions(
  subscriptionIds: string[],
  action: 'cancel' | 'extend',
  params?: { days?: number; reason?: string }
) {
  if (action === 'cancel') {
    const result = await prisma.subscriptions.updateMany({
      where: { id: { in: subscriptionIds } },
      data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: params?.reason },
    });
    return { cancelled: result.count };
  }
  return { extended: 0 };
}
