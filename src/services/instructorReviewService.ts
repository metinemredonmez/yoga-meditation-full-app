import { ReviewStatus, Prisma } from '@prisma/client';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

// ============================================
// Types
// ============================================

interface CreateReviewInput {
  instructorId: string;
  rating: number;
  title?: string;
  content?: string;
  programId?: string;
  classId?: string;
}

interface UpdateReviewInput {
  rating?: number;
  title?: string;
  content?: string;
}

interface ReviewFilters {
  status?: ReviewStatus;
  rating?: number;
  minRating?: number;
  hasReply?: boolean;
  includeAll?: boolean; // For instructor dashboard to see all their reviews
}

// ============================================
// Review Management
// ============================================

/**
 * Create a review for an instructor
 */
export async function createReview(
  studentId: string,
  input: CreateReviewInput,
) {
  // Check if student already reviewed this instructor
  const existingReview = await prisma.instructor_reviews.findFirst({
    where: {
      instructorId: input.instructorId,
      studentId,
    },
  });

  if (existingReview) {
    throw new Error('You have already reviewed this instructor');
  }

  // Check if rating is valid
  if (input.rating < 1 || input.rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  // Check if student has purchased/booked from this instructor
  const instructor = await prisma.instructor_profiles.findUnique({
    where: { id: input.instructorId },
  });

  if (!instructor) {
    throw new Error('Instructor not found');
  }

  // Check for verified purchase
  let isVerifiedPurchase = false;

  if (input.programId) {
    // Check video progress or payment for program
    const progress = await prisma.video_progress.findFirst({
      where: {
        userId: studentId,
        lessonType: 'PROGRAM_SESSION',
      },
    });
    isVerifiedPurchase = !!progress;
  }

  if (input.classId) {
    // Check booking for class
    const booking = await prisma.bookings.findFirst({
      where: {
        userId: studentId,
        classId: input.classId,
        status: 'CONFIRMED',
      },
    });
    isVerifiedPurchase = !!booking;
  }

  const review = await prisma.instructor_reviews.create({
    data: {
      instructorId: input.instructorId,
      studentId,
      rating: input.rating,
      title: input.title,
      content: input.content,
      programId: input.programId,
      classId: input.classId,
      isVerifiedPurchase,
      status: 'PENDING', // Reviews need moderation
    },
    include: {
      users: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  logger.info(
    { reviewId: review.id, instructorId: input.instructorId, studentId },
    'Review created',
  );

  return review;
}

/**
 * Update a review
 */
export async function updateReview(
  reviewId: string,
  studentId: string,
  input: UpdateReviewInput,
) {
  const review = await prisma.instructor_reviews.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new Error('Review not found');
  }

  if (review.studentId !== studentId) {
    throw new Error('You can only edit your own reviews');
  }

  if (input.rating && (input.rating < 1 || input.rating > 5)) {
    throw new Error('Rating must be between 1 and 5');
  }

  const updatedReview = await prisma.instructor_reviews.update({
    where: { id: reviewId },
    data: {
      rating: input.rating,
      title: input.title,
      content: input.content,
      status: 'PENDING', // Re-moderation after edit
    },
    include: {
      users: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  logger.info({ reviewId, studentId }, 'Review updated');

  return updatedReview;
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId: string, studentId: string) {
  const review = await prisma.instructor_reviews.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new Error('Review not found');
  }

  if (review.studentId !== studentId) {
    throw new Error('You can only delete your own reviews');
  }

  await prisma.instructor_reviews.delete({
    where: { id: reviewId },
  });

  // Recalculate instructor rating
  await calculateAverageRating(review.instructorId);

  logger.info({ reviewId, studentId }, 'Review deleted');
}

/**
 * Reply to a review (instructor)
 */
export async function replyToReview(
  reviewId: string,
  instructorId: string,
  reply: string,
) {
  const review = await prisma.instructor_reviews.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new Error('Review not found');
  }

  if (review.instructorId !== instructorId) {
    throw new Error('You can only reply to reviews on your profile');
  }

  const updatedReview = await prisma.instructor_reviews.update({
    where: { id: reviewId },
    data: {
      instructorReply: reply,
      repliedAt: new Date(),
    },
  });

  logger.info({ reviewId, instructorId }, 'Review reply added');

  return updatedReview;
}

// ============================================
// Moderation
// ============================================

/**
 * Moderate a review (admin)
 */
export async function moderateReview(
  reviewId: string,
  adminId: string,
  status: ReviewStatus,
  reason?: string,
) {
  const review = await prisma.instructor_reviews.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new Error('Review not found');
  }

  const updatedReview = await prisma.instructor_reviews.update({
    where: { id: reviewId },
    data: { status },
  });

  // Create audit log
  await prisma.audit_logs.create({
    data: {
      userId: adminId,
      action: 'REVIEW_MODERATED',
      metadata: { reviewId, status, reason },
    },
  });

  // Recalculate rating if status changed
  await calculateAverageRating(review.instructorId);

  logger.info({ reviewId, adminId, status }, 'Review moderated');

  return updatedReview;
}

/**
 * Report a review
 */
export async function reportReview(
  reviewId: string,
  userId: string,
  reason: string,
) {
  // Check if already reported
  const existing = await prisma.review_reports.findUnique({
    where: {
      reviewId_userId: {
        reviewId,
        userId,
      },
    },
  });

  if (existing) {
    throw new Error('You have already reported this review');
  }

  await prisma.review_reports.create({
    data: {
      reviewId,
      userId,
      reason,
    },
  });

  // Increment report count
  const review = await prisma.instructor_reviews.update({
    where: { id: reviewId },
    data: {
      reportCount: { increment: 1 },
    },
  });

  // Auto-flag if too many reports
  if (review.reportCount >= 5 && review.status !== 'FLAGGED') {
    await prisma.instructor_reviews.update({
      where: { id: reviewId },
      data: { status: 'FLAGGED' },
    });
  }

  logger.info({ reviewId, userId, reason }, 'Review reported');
}

/**
 * Mark review as helpful
 */
export async function markHelpful(reviewId: string, userId: string) {
  // Check if already marked
  const existing = await prisma.review_helpfuls.findUnique({
    where: {
      reviewId_userId: {
        reviewId,
        userId,
      },
    },
  });

  if (existing) {
    // Remove helpful mark
    await prisma.review_helpfuls.delete({
      where: {
        reviewId_userId: {
          reviewId,
          userId,
        },
      },
    });

    await prisma.instructor_reviews.update({
      where: { id: reviewId },
      data: {
        helpfulCount: { decrement: 1 },
      },
    });

    return { marked: false };
  }

  await prisma.review_helpfuls.create({
    data: {
      reviewId,
      userId,
    },
  });

  await prisma.instructor_reviews.update({
    where: { id: reviewId },
    data: {
      helpfulCount: { increment: 1 },
    },
  });

  return { marked: true };
}

// ============================================
// Review Queries
// ============================================

/**
 * Get reviews for an instructor
 */
export async function getInstructorReviews(
  instructorId: string,
  filters: ReviewFilters = {},
  pagination: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 20 } = pagination;

  const where: Prisma.instructor_reviewsWhereInput = {
    instructorId,
  };

  // If not including all, filter by status (default to APPROVED for public views)
  if (!filters.includeAll) {
    where.status = filters.status || 'APPROVED';
  }

  if (filters.rating) {
    where.rating = filters.rating;
  }

  if (filters.minRating) {
    where.rating = { gte: filters.minRating };
  }

  if (filters.hasReply !== undefined) {
    if (filters.hasReply) {
      where.instructorReply = { not: null };
    } else {
      where.instructorReply = null;
    }
  }

  const [items, total] = await Promise.all([
    prisma.instructor_reviews.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.instructor_reviews.count({ where }),
  ]);

  // Fetch related class/program titles separately
  const classIds = items.filter(i => i.classId).map(i => i.classId!);
  const programIds = items.filter(i => i.programId).map(i => i.programId!);

  const [classes, programs] = await Promise.all([
    classIds.length > 0 ? prisma.classes.findMany({
      where: { id: { in: classIds } },
      select: { id: true, title: true },
    }) : [],
    programIds.length > 0 ? prisma.programs.findMany({
      where: { id: { in: programIds } },
      select: { id: true, title: true },
    }) : [],
  ]);

  const classMap = new Map(classes.map(c => [c.id, c]));
  const programMap = new Map(programs.map(p => [p.id, p]));

  // Attach class/program info to items
  const enrichedItems = items.map(item => ({
    ...item,
    classes: item.classId ? classMap.get(item.classId) : null,
    programs: item.programId ? programMap.get(item.programId) : null,
  }));

  return {
    items: enrichedItems,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get pending reviews for moderation (admin)
 */
export async function getPendingReviews(
  pagination: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 20 } = pagination;

  const where: Prisma.instructor_reviewsWhereInput = {
    status: { in: ['PENDING', 'FLAGGED'] },
  };

  const [items, total] = await Promise.all([
    prisma.instructor_reviews.findMany({
      where,
      orderBy: [
        { status: 'asc' }, // FLAGGED first
        { createdAt: 'asc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        users: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        instructor_profiles: {
          select: { id: true, displayName: true, slug: true },
        },
      },
    }),
    prisma.instructor_reviews.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get review by ID
 */
export async function getReviewById(reviewId: string) {
  return prisma.instructor_reviews.findUnique({
    where: { id: reviewId },
    include: {
      users: {
        select: { id: true, firstName: true, lastName: true },
      },
      instructor_profiles: {
        select: { id: true, displayName: true, slug: true },
      },
    },
  });
}

// ============================================
// Rating Calculation
// ============================================

/**
 * Calculate and update average rating for instructor
 */
export async function calculateAverageRating(instructorId: string) {
  const stats = await prisma.instructor_reviews.aggregate({
    where: {
      instructorId,
      status: 'APPROVED',
    },
    _avg: { rating: true },
    _count: true,
  });

  await prisma.instructor_profiles.update({
    where: { id: instructorId },
    data: {
      averageRating: stats._avg.rating || 0,
      totalReviews: stats._count,
    },
  });

  logger.debug(
    { instructorId, avgRating: stats._avg.rating, count: stats._count },
    'Average rating calculated',
  );

  return {
    averageRating: stats._avg.rating || 0,
    totalReviews: stats._count,
  };
}

/**
 * Get rating distribution for instructor
 */
export async function getRatingDistribution(instructorId: string) {
  const distribution = await prisma.instructor_reviews.groupBy({
    by: ['rating'],
    where: {
      instructorId,
      status: 'APPROVED',
    },
    _count: true,
  });

  const result: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  for (const item of distribution) {
    result[item.rating] = item._count;
  }

  return result;
}

// ============================================
// Review Stats
// ============================================

/**
 * Get review statistics for instructor
 */
export async function getReviewStats(instructorId: string) {
  const [total, approved, pending, avgRating, distribution] = await Promise.all([
    prisma.instructor_reviews.count({ where: { instructorId } }),
    prisma.instructor_reviews.count({
      where: { instructorId, status: 'APPROVED' },
    }),
    prisma.instructor_reviews.count({
      where: { instructorId, status: 'PENDING' },
    }),
    prisma.instructor_reviews.aggregate({
      where: { instructorId, status: 'APPROVED' },
      _avg: { rating: true },
    }),
    getRatingDistribution(instructorId),
  ]);

  return {
    total,
    approved,
    pending,
    averageRating: avgRating._avg.rating || 0,
    distribution,
  };
}
