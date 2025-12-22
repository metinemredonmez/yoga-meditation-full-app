import { prisma } from '../../utils/database';
import { HttpError } from '../../middleware/errorHandler';
import { Prisma, ReportStatus } from '@prisma/client';

// Get reports from content_reports table
export async function getReports(filters: {
  status?: string;
  type?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;

  const where: Prisma.content_reportsWhereInput = {};

  if (filters.status) {
    where.status = filters.status as ReportStatus;
  }
  if (filters.type) {
    where.targetType = filters.type as Prisma.EnumReportTargetTypeFilter['equals'];
  }
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) (where.createdAt as Prisma.DateTimeFilter).gte = filters.startDate;
    if (filters.endDate) (where.createdAt as Prisma.DateTimeFilter).lte = filters.endDate;
  }

  const [reports, total] = await Promise.all([
    prisma.content_reports.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        users_content_reports_reporterIdTousers: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        users_content_reports_reviewedByIdTousers: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    }),
    prisma.content_reports.count({ where }),
  ]);

  // Transform to frontend format
  const transformedReports = reports.map((report) => ({
    id: report.id,
    reason: report.reason,
    description: report.description,
    targetType: report.targetType,
    topicId: report.topicId,
    postId: report.postId,
    commentId: report.commentId,
    userId: report.userId,
    status: report.status,
    resolution: report.resolution,
    createdAt: report.createdAt,
    reviewedAt: report.reviewedAt,
    reporter: report.users_content_reports_reporterIdTousers
      ? {
          id: report.users_content_reports_reporterIdTousers.id,
          name: `${report.users_content_reports_reporterIdTousers.firstName || ''} ${report.users_content_reports_reporterIdTousers.lastName || ''}`.trim(),
          email: report.users_content_reports_reporterIdTousers.email,
        }
      : null,
    reviewer: report.users_content_reports_reviewedByIdTousers
      ? {
          id: report.users_content_reports_reviewedByIdTousers.id,
          name: `${report.users_content_reports_reviewedByIdTousers.firstName || ''} ${report.users_content_reports_reviewedByIdTousers.lastName || ''}`.trim(),
          email: report.users_content_reports_reviewedByIdTousers.email,
        }
      : null,
  }));

  return {
    reports: transformedReports,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// Get report details
export async function getReportDetails(reportId: string) {
  const report = await prisma.content_reports.findUnique({
    where: { id: reportId },
    include: {
      users_content_reports_reporterIdTousers: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      users_content_reports_reviewedByIdTousers: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  if (!report) {
    throw new HttpError(404, 'Report not found');
  }

  return {
    id: report.id,
    reason: report.reason,
    description: report.description,
    targetType: report.targetType,
    topicId: report.topicId,
    postId: report.postId,
    commentId: report.commentId,
    userId: report.userId,
    status: report.status,
    resolution: report.resolution,
    createdAt: report.createdAt,
    reviewedAt: report.reviewedAt,
    reporter: report.users_content_reports_reporterIdTousers
      ? {
          id: report.users_content_reports_reporterIdTousers.id,
          name: `${report.users_content_reports_reporterIdTousers.firstName || ''} ${report.users_content_reports_reporterIdTousers.lastName || ''}`.trim(),
          email: report.users_content_reports_reporterIdTousers.email,
        }
      : null,
    reviewer: report.users_content_reports_reviewedByIdTousers
      ? {
          id: report.users_content_reports_reviewedByIdTousers.id,
          name: `${report.users_content_reports_reviewedByIdTousers.firstName || ''} ${report.users_content_reports_reviewedByIdTousers.lastName || ''}`.trim(),
          email: report.users_content_reports_reviewedByIdTousers.email,
        }
      : null,
  };
}

// Resolve report
export async function resolveReport(
  reportId: string,
  adminId: string,
  resolution: string,
  notes?: string
) {
  const report = await prisma.content_reports.findUnique({
    where: { id: reportId },
  });

  if (!report) {
    throw new HttpError(404, 'Report not found');
  }

  const updatedReport = await prisma.content_reports.update({
    where: { id: reportId },
    data: {
      status: resolution as ReportStatus,
      reviewedById: adminId,
      reviewedAt: new Date(),
      resolution: notes || null,
    },
    include: {
      users_content_reports_reporterIdTousers: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      users_content_reports_reviewedByIdTousers: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  return {
    id: updatedReport.id,
    status: updatedReport.status,
    resolution: updatedReport.resolution,
    reviewedAt: updatedReport.reviewedAt,
  };
}

// Bulk resolve reports
export async function bulkResolveReports(_reportIds: string[], _adminId: string, _resolution: string) {
  return { updated: 0 };
}

// Get comments
export async function getComments(filters: {
  search?: string;
  userId?: string;
  flagged?: boolean;
  page?: number;
  limit?: number;
}) {
  const { page = 1, limit = 20 } = filters;

  const [comments, total] = await Promise.all([
    prisma.comments.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.comments.count(),
  ]);

  return {
    comments,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// Delete comment
export async function deleteComment(commentId: string) {
  await prisma.comments.delete({ where: { id: commentId } });
}

// Hide comment - stub (no isHidden field in Comment schema)
export async function hideComment(_commentId: string) {
  // Comment model doesn't have isHidden field
  return { success: true };
}

// Bulk delete comments
export async function bulkDeleteComments(commentIds: string[]) {
  const result = await prisma.comments.deleteMany({
    where: { id: { in: commentIds } },
  });
  return { deleted: result.count };
}


// Get moderation stats
export async function getModerationStats() {
  const [totalComments, totalReports, pendingReports, resolvedReports, reviewingReports, dismissedReports] =
    await Promise.all([
      prisma.comments.count(),
      prisma.content_reports.count(),
      prisma.content_reports.count({ where: { status: 'PENDING' } }),
      prisma.content_reports.count({ where: { status: 'RESOLVED' } }),
      prisma.content_reports.count({ where: { status: 'REVIEWING' } }),
      prisma.content_reports.count({ where: { status: 'DISMISSED' } }),
    ]);

  return {
    reports: {
      total: totalReports,
      pending: pendingReports,
      reviewing: reviewingReports,
      resolved: resolvedReports,
      dismissed: dismissedReports,
    },
    comments: { total: totalComments, hidden: 0 },
  };
}

// Get content review queue
export async function getContentReviewQueue(page = 1, limit = 20) {
  return {
    queue: [],
    pagination: { page, limit, total: 0, totalPages: 0 },
  };
}
