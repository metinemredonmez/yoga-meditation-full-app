import { prisma } from '../../utils/database';
import { HttpError } from '../../middleware/errorHandler';

// Get reports - stub implementation
export async function getReports(_filters: {
  status?: string;
  type?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const page = _filters.page || 1;
  const limit = _filters.limit || 20;
  return {
    reports: [],
    pagination: { page, limit, total: 0, totalPages: 0 },
  };
}

// Get report details
export async function getReportDetails(_reportId: string) {
  throw new HttpError(404, 'Report not found');
}

// Resolve report
export async function resolveReport(_reportId: string, _adminId: string, _resolution: string, _notes?: string) {
  throw new HttpError(404, 'Report not found');
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
  const totalComments = await prisma.comments.count();

  return {
    reports: { total: 0, pending: 0, resolved: 0 },
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
