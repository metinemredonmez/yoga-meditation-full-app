import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import type { Prisma, CommentTargetType } from '@prisma/client';

// ============================================
// Comment Service
// ============================================

export interface CommentFilters {
  targetType?: CommentTargetType;
  programId?: string;
  classId?: string;
  poseId?: string;
  challengeId?: string;
  authorId?: string;
  hasRating?: boolean;
  minRating?: number;
  isVerifiedPurchase?: boolean;
  isHidden?: boolean;
}

export async function getComments(
  filters: CommentFilters = {},
  pagination: { page?: number; limit?: number } = {},
  sort: { field?: string; order?: 'asc' | 'desc' } = {},
) {
  const { page = 1, limit = 20 } = pagination;
  const { field = 'createdAt', order = 'desc' } = sort;
  const skip = (page - 1) * limit;

  const where: Prisma.commentsWhereInput = {
    parentId: null, // Only get top-level comments
  };

  if (filters.targetType) where.targetType = filters.targetType;
  if (filters.programId) where.programId = filters.programId;
  if (filters.classId) where.classId = filters.classId;
  if (filters.poseId) where.poseId = filters.poseId;
  if (filters.challengeId) where.challengeId = filters.challengeId;
  if (filters.authorId) where.authorId = filters.authorId;
  if (filters.hasRating !== undefined) {
    where.rating = filters.hasRating ? { not: null } : null;
  }
  if (filters.minRating) where.rating = { gte: filters.minRating };
  if (filters.isVerifiedPurchase !== undefined) where.isVerifiedPurchase = filters.isVerifiedPurchase;
  if (filters.isHidden !== undefined) where.isHidden = filters.isHidden;

  const [comments, total] = await Promise.all([
    prisma.comments.findMany({
      where,
      include: {
        users: {
          select: { id: true, firstName: true, lastName: true },
        },
        other_comments: {
          include: {
            users: {
              select: { id: true, firstName: true, lastName: true },
            },
            _count: {
              select: { comment_likes: true },
            },
          },
          where: { isHidden: false },
          orderBy: { createdAt: 'asc' },
          take: 3, // Limit replies shown
        },
        _count: {
          select: { comment_likes: true, other_comments: true },
        },
      },
      orderBy: { [field]: order },
      skip,
      take: limit,
    }),
    prisma.comments.count({ where }),
  ]);

  return {
    comments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getCommentById(id: string) {
  return prisma.comments.findUnique({
    where: { id },
    include: {
      users: {
        select: { id: true, firstName: true, lastName: true },
      },
      other_comments: {
        include: {
          users: {
            select: { id: true, firstName: true, lastName: true },
          },
          _count: {
            select: { comment_likes: true },
          },
        },
        where: { isHidden: false },
        orderBy: { createdAt: 'asc' },
      },
      _count: {
        select: { comment_likes: true, other_comments: true },
      },
    },
  });
}

export async function getCommentReplies(
  parentId: string,
  pagination: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;

  const [replies, total] = await Promise.all([
    prisma.comments.findMany({
      where: { parentId, isHidden: false },
      include: {
        users: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: {
          select: { comment_likes: true },
        },
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    }),
    prisma.comments.count({ where: { parentId, isHidden: false } }),
  ]);

  return {
    replies,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function createComment(data: {
  content: string;
  authorId: string;
  targetType: CommentTargetType;
  programId?: string;
  classId?: string;
  poseId?: string;
  challengeId?: string;
  parentId?: string;
  rating?: number;
  isVerifiedPurchase?: boolean;
}) {
  const comment = await prisma.comments.create({
    data,
    include: {
      users: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  logger.info(
    { commentId: comment.id, targetType: data.targetType, authorId: data.authorId },
    'Comment created',
  );
  return comment;
}

export async function updateComment(
  id: string,
  data: { content: string; rating?: number },
) {
  const comment = await prisma.comments.update({
    where: { id },
    data: {
      ...data,
      isEdited: true,
      editedAt: new Date(),
    },
    include: {
      users: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  logger.info({ commentId: id }, 'Comment updated');
  return comment;
}

export async function deleteComment(id: string) {
  await prisma.comments.delete({
    where: { id },
  });

  logger.info({ commentId: id }, 'Comment deleted');
}

export async function hideComment(
  id: string,
  reason: string,
) {
  const comment = await prisma.comments.update({
    where: { id },
    data: {
      isHidden: true,
      hiddenReason: reason,
    },
  });

  logger.info({ commentId: id, reason }, 'Comment hidden');
  return comment;
}

export async function unhideComment(id: string) {
  const comment = await prisma.comments.update({
    where: { id },
    data: {
      isHidden: false,
      hiddenReason: null,
    },
  });

  logger.info({ commentId: id }, 'Comment unhidden');
  return comment;
}

// ============================================
// Comment Like Service
// ============================================

export async function likeComment(commentId: string, userId: string) {
  const existing = await prisma.comment_likes.findUnique({
    where: { commentId_userId: { commentId, userId } },
  });

  if (existing) {
    return { liked: true, message: 'Already liked' };
  }

  await prisma.comment_likes.create({
    data: { commentId, userId },
  });

  logger.debug({ commentId, userId }, 'Comment liked');
  return { liked: true, message: 'Comment liked' };
}

export async function unlikeComment(commentId: string, userId: string) {
  const existing = await prisma.comment_likes.findUnique({
    where: { commentId_userId: { commentId, userId } },
  });

  if (!existing) {
    return { liked: false, message: 'Not liked' };
  }

  await prisma.comment_likes.delete({
    where: { commentId_userId: { commentId, userId } },
  });

  logger.debug({ commentId, userId }, 'Comment unliked');
  return { liked: false, message: 'Comment unliked' };
}

export async function hasUserLikedComment(commentId: string, userId: string) {
  const like = await prisma.comment_likes.findUnique({
    where: { commentId_userId: { commentId, userId } },
  });
  return !!like;
}

// ============================================
// Review Statistics
// ============================================

export async function getReviewStats(
  targetType: CommentTargetType,
  targetId: string,
) {
  const targetField = targetType.toLowerCase() + 'Id';

  const stats = await prisma.comments.aggregate({
    where: {
      targetType,
      [targetField]: targetId,
      rating: { not: null },
      isHidden: false,
    },
    _avg: { rating: true },
    _count: { rating: true },
  });

  // Get rating distribution
  const ratingDistribution = await prisma.comments.groupBy({
    by: ['rating'],
    where: {
      targetType,
      [targetField]: targetId,
      rating: { not: null },
      isHidden: false,
    },
    _count: true,
  });

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratingDistribution.forEach((item) => {
    if (item.rating !== null) {
      distribution[item.rating] = item._count;
    }
  });

  return {
    averageRating: stats._avg.rating || 0,
    totalReviews: stats._count.rating,
    ratingDistribution: distribution,
  };
}

export async function getProgramReviewStats(programId: string) {
  return getReviewStats('PROGRAM', programId);
}

export async function getClassReviewStats(classId: string) {
  return getReviewStats('CLASS', classId);
}

export async function getPoseReviewStats(poseId: string) {
  return getReviewStats('POSE', poseId);
}

export async function getChallengeReviewStats(challengeId: string) {
  return getReviewStats('CHALLENGE', challengeId);
}

// ============================================
// User's Reviews
// ============================================

export async function getUserReviews(
  userId: string,
  pagination: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.comments.findMany({
      where: {
        authorId: userId,
        rating: { not: null },
      },
      include: {
        programs: {
          select: { id: true, title: true },
        },
        classes: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.comments.count({
      where: {
        authorId: userId,
        rating: { not: null },
      },
    }),
  ]);

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================
// Check if User Can Review
// ============================================

export async function canUserReview(
  userId: string,
  targetType: CommentTargetType,
  targetId: string,
): Promise<{ canReview: boolean; reason?: string }> {
  const targetField = targetType.toLowerCase() + 'Id';

  // Check if user already reviewed
  const existingReview = await prisma.comments.findFirst({
    where: {
      authorId: userId,
      targetType,
      [targetField]: targetId,
      rating: { not: null },
    },
  });

  if (existingReview) {
    return { canReview: false, reason: 'Already reviewed' };
  }

  // Check if user has completed/participated (for verified purchase)
  // This would depend on specific business logic
  // For now, we'll allow anyone to review

  return { canReview: true };
}

// ============================================
// Admin Functions
// ============================================

export async function getReportedComments(
  pagination: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;

  // Note: comment_reports table doesn't exist in schema, returning empty result
  // This function should be updated when the comment_reports table is added
  const [comments, total] = await Promise.all([
    prisma.comments.findMany({
      where: {
        isHidden: true,
      },
      include: {
        users: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.comments.count({
      where: {
        isHidden: true,
      },
    }),
  ]);

  return {
    comments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
