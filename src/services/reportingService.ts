import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import type { ReportReason, ReportTargetType, ReportStatus, Prisma } from '@prisma/client';

// ============================================
// Content Report Service
// ============================================

export interface ReportFilters {
  status?: ReportStatus;
  reason?: ReportReason;
  targetType?: ReportTargetType;
  reporterId?: string;
  reviewedById?: string;
}

export async function getReports(
  filters: ReportFilters = {},
  pagination: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;

  const where: Prisma.ContentReportWhereInput = {};

  if (filters.status) where.status = filters.status;
  if (filters.reason) where.reason = filters.reason;
  if (filters.targetType) where.targetType = filters.targetType;
  if (filters.reporterId) where.reporterId = filters.reporterId;
  if (filters.reviewedById) where.reviewedById = filters.reviewedById;

  const [reports, total] = await Promise.all([
    prisma.contentReport.findMany({
      where,
      include: {
        reporter: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        reviewedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        topic: {
          select: { id: true, title: true, slug: true },
        },
        post: {
          select: { id: true, content: true },
        },
        comment: {
          select: { id: true, content: true },
        },
        reportedUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.contentReport.count({ where }),
  ]);

  return {
    reports,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getReportById(id: string) {
  return prisma.contentReport.findUnique({
    where: { id },
    include: {
      reporter: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      reviewedBy: {
        select: { id: true, firstName: true, lastName: true },
      },
      topic: {
        select: { id: true, title: true, slug: true, authorId: true },
      },
      post: {
        select: { id: true, content: true, authorId: true },
      },
      comment: {
        select: { id: true, content: true, authorId: true },
      },
      reportedUser: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });
}

export async function createReport(data: {
  reporterId: string;
  reason: ReportReason;
  description?: string;
  targetType: ReportTargetType;
  topicId?: string;
  postId?: string;
  commentId?: string;
  userId?: string;
}) {
  // Check for duplicate report
  const existingReport = await prisma.contentReport.findFirst({
    where: {
      reporterId: data.reporterId,
      targetType: data.targetType,
      topicId: data.topicId,
      postId: data.postId,
      commentId: data.commentId,
      userId: data.userId,
      status: { in: ['PENDING', 'REVIEWING'] },
    },
  });

  if (existingReport) {
    return { created: false, report: existingReport, message: 'Already reported' };
  }

  const report = await prisma.contentReport.create({
    data,
    include: {
      reporter: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  logger.info(
    { reportId: report.id, targetType: data.targetType, reason: data.reason },
    'Content report created',
  );

  return { created: true, report };
}

export async function updateReportStatus(
  id: string,
  status: ReportStatus,
  reviewedById: string,
  resolution?: string,
) {
  const report = await prisma.contentReport.update({
    where: { id },
    data: {
      status,
      reviewedById,
      reviewedAt: new Date(),
      resolution,
    },
  });

  logger.info({ reportId: id, status, reviewedById }, 'Report status updated');
  return report;
}

export async function resolveReport(
  id: string,
  reviewedById: string,
  resolution: string,
  action?: 'hide' | 'delete' | 'ban' | 'none',
) {
  const report = await getReportById(id);
  if (!report) {
    throw new Error('Report not found');
  }

  // Take action based on report type
  if (action && action !== 'none') {
    switch (report.targetType) {
      case 'TOPIC':
        if (report.topicId) {
          if (action === 'delete') {
            await prisma.forumTopic.delete({ where: { id: report.topicId } });
          } else if (action === 'hide') {
            await prisma.forumTopic.update({
              where: { id: report.topicId },
              data: { isLocked: true },
            });
          }
        }
        break;

      case 'POST':
        if (report.postId && action === 'delete') {
          await prisma.forumPost.delete({ where: { id: report.postId } });
        }
        break;

      case 'COMMENT':
        if (report.commentId) {
          if (action === 'delete') {
            await prisma.comment.delete({ where: { id: report.commentId } });
          } else if (action === 'hide') {
            await prisma.comment.update({
              where: { id: report.commentId },
              data: { isHidden: true, hiddenReason: resolution },
            });
          }
        }
        break;

      case 'USER':
        // User ban would be handled separately
        break;
    }

    logger.info({ reportId: id, action }, 'Report action taken');
  }

  return updateReportStatus(id, 'RESOLVED', reviewedById, resolution);
}

export async function dismissReport(
  id: string,
  reviewedById: string,
  resolution?: string,
) {
  return updateReportStatus(id, 'DISMISSED', reviewedById, resolution || 'Report dismissed');
}

// ============================================
// Report Statistics
// ============================================

export async function getReportStats() {
  const [
    totalReports,
    pendingReports,
    resolvedReports,
    dismissedReports,
    reportsByReason,
    reportsByType,
    recentReports,
  ] = await Promise.all([
    prisma.contentReport.count(),
    prisma.contentReport.count({ where: { status: 'PENDING' } }),
    prisma.contentReport.count({ where: { status: 'RESOLVED' } }),
    prisma.contentReport.count({ where: { status: 'DISMISSED' } }),
    prisma.contentReport.groupBy({
      by: ['reason'],
      _count: true,
    }),
    prisma.contentReport.groupBy({
      by: ['targetType'],
      _count: true,
    }),
    prisma.contentReport.findMany({
      where: { status: 'PENDING' },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    }),
  ]);

  return {
    totalReports,
    pendingReports,
    resolvedReports,
    dismissedReports,
    reportsByReason: reportsByReason.reduce(
      (acc, item) => {
        acc[item.reason] = item._count;
        return acc;
      },
      {} as Record<string, number>,
    ),
    reportsByType: reportsByType.reduce(
      (acc, item) => {
        acc[item.targetType] = item._count;
        return acc;
      },
      {} as Record<string, number>,
    ),
    recentReports,
  };
}

export async function getUserReportHistory(userId: string) {
  const [reportsAgainst, reportsSubmitted] = await Promise.all([
    prisma.contentReport.count({
      where: {
        OR: [
          { userId },
          { topic: { authorId: userId } },
          { post: { authorId: userId } },
          { comment: { authorId: userId } },
        ],
      },
    }),
    prisma.contentReport.count({
      where: { reporterId: userId },
    }),
  ]);

  return {
    reportsAgainst,
    reportsSubmitted,
  };
}

// ============================================
// Report Topics
// ============================================

export async function reportTopic(
  reporterId: string,
  topicId: string,
  reason: ReportReason,
  description?: string,
) {
  return createReport({
    reporterId,
    reason,
    description,
    targetType: 'TOPIC',
    topicId,
  });
}

export async function reportPost(
  reporterId: string,
  postId: string,
  reason: ReportReason,
  description?: string,
) {
  return createReport({
    reporterId,
    reason,
    description,
    targetType: 'POST',
    postId,
  });
}

export async function reportComment(
  reporterId: string,
  commentId: string,
  reason: ReportReason,
  description?: string,
) {
  return createReport({
    reporterId,
    reason,
    description,
    targetType: 'COMMENT',
    commentId,
  });
}

export async function reportUser(
  reporterId: string,
  userId: string,
  reason: ReportReason,
  description?: string,
) {
  return createReport({
    reporterId,
    reason,
    description,
    targetType: 'USER',
    userId,
  });
}
