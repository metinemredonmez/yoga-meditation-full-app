import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as instructorService from '../services/instructorService';
import * as instructorReviewService from '../services/instructorReviewService';
import * as instructorFollowerService from '../services/instructorFollowerService';
import { logger } from '../utils/logger';

// ============================================
// Public Instructor Routes
// ============================================

export async function listInstructors(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const tier = req.query.tier as string | undefined;
    const isVerified = req.query.verified === 'true' ? true : undefined;

    const instructors = await instructorService.getAllInstructors(
      { status: 'APPROVED', tier: tier as any, isVerified },
      { page, limit },
    );

    res.json({ success: true, data: instructors });
  } catch (error) {
    logger.error({ error }, 'Failed to list instructors');
    res.status(500).json({ success: false, error: 'Failed to list instructors' });
  }
}

export async function searchInstructors(req: Request, res: Response) {
  try {
    const query = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!query || query.length < 2) {
      return res.status(400).json({ success: false, error: 'Search query must be at least 2 characters' });
    }

    const instructors = await instructorService.searchInstructors(query, {}, { page, limit });
    res.json({ success: true, data: instructors });
  } catch (error) {
    logger.error({ error }, 'Failed to search instructors');
    res.status(500).json({ success: false, error: 'Failed to search instructors' });
  }
}

export async function getFeaturedInstructors(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const instructors = await instructorService.getFeaturedInstructors(limit);
    res.json({ success: true, data: instructors });
  } catch (error) {
    logger.error({ error }, 'Failed to get featured instructors');
    res.status(500).json({ success: false, error: 'Failed to get featured instructors' });
  }
}

export async function getInstructor(req: Request, res: Response) {
  try {
    const slug = req.params.slug!;
    const instructor = await instructorService.getInstructorBySlug(slug);

    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor not found' });
    }

    res.json({ success: true, data: instructor });
  } catch (error) {
    logger.error({ error }, 'Failed to get instructor');
    res.status(500).json({ success: false, error: 'Failed to get instructor' });
  }
}

export async function getInstructorById(req: Request, res: Response) {
  try {
    const id = req.params.id!;
    const instructor = await instructorService.getInstructorById(id);

    if (!instructor || instructor.status !== 'APPROVED') {
      return res.status(404).json({ success: false, error: 'Instructor not found' });
    }

    res.json({ success: true, data: instructor });
  } catch (error) {
    logger.error({ error }, 'Failed to get instructor');
    res.status(500).json({ success: false, error: 'Failed to get instructor' });
  }
}

export async function getInstructorPrograms(req: Request, res: Response) {
  try {
    const slug = req.params.slug!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const instructor = await instructorService.getInstructorBySlug(slug);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor not found' });
    }

    const programs = await instructorService.getInstructorPrograms(instructor.id);
    res.json({ success: true, data: { items: programs, page, limit } });
  } catch (error) {
    logger.error({ error }, 'Failed to get instructor programs');
    res.status(500).json({ success: false, error: 'Failed to get instructor programs' });
  }
}

export async function getInstructorClasses(req: Request, res: Response) {
  try {
    const slug = req.params.slug!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const instructor = await instructorService.getInstructorBySlug(slug);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor not found' });
    }

    const classes = await instructorService.getInstructorClasses(instructor.id);
    res.json({ success: true, data: { items: classes, page, limit } });
  } catch (error) {
    logger.error({ error }, 'Failed to get instructor classes');
    res.status(500).json({ success: false, error: 'Failed to get instructor classes' });
  }
}

export async function getInstructorReviews(req: Request, res: Response) {
  try {
    const slug = req.params.slug!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const rating = req.query.rating ? parseInt(req.query.rating as string) : undefined;

    const instructor = await instructorService.getInstructorBySlug(slug);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor not found' });
    }

    const reviews = await instructorReviewService.getInstructorReviews(instructor.id, { status: 'APPROVED', rating }, { page, limit });
    res.json({ success: true, data: reviews });
  } catch (error) {
    logger.error({ error }, 'Failed to get instructor reviews');
    res.status(500).json({ success: false, error: 'Failed to get instructor reviews' });
  }
}

export async function getRatingDistribution(req: Request, res: Response) {
  try {
    const slug = req.params.slug!;
    const instructor = await instructorService.getInstructorBySlug(slug);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor not found' });
    }

    const distribution = await instructorReviewService.getRatingDistribution(instructor.id);
    res.json({ success: true, data: distribution });
  } catch (error) {
    logger.error({ error }, 'Failed to get rating distribution');
    res.status(500).json({ success: false, error: 'Failed to get rating distribution' });
  }
}

// ============================================
// User Actions (Authenticated)
// ============================================

export async function followInstructor(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const slug = req.params.slug!;

    const instructor = await instructorService.getInstructorBySlug(slug);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor not found' });
    }

    const follower = await instructorFollowerService.followInstructor(userId, instructor.id);
    res.status(201).json({ success: true, data: follower });
  } catch (error: any) {
    logger.error({ error }, 'Failed to follow instructor');
    res.status(400).json({ success: false, error: error.message || 'Failed to follow instructor' });
  }
}

export async function unfollowInstructor(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const slug = req.params.slug!;

    const instructor = await instructorService.getInstructorBySlug(slug);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor not found' });
    }

    await instructorFollowerService.unfollowInstructor(userId, instructor.id);
    res.json({ success: true, message: 'Unfollowed instructor' });
  } catch (error: any) {
    logger.error({ error }, 'Failed to unfollow instructor');
    res.status(400).json({ success: false, error: error.message || 'Failed to unfollow instructor' });
  }
}

export async function toggleFollowNotifications(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const slug = req.params.slug!;
    const { enabled } = req.body;

    const instructor = await instructorService.getInstructorBySlug(slug);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor not found' });
    }

    const follower = await instructorFollowerService.toggleNotifications(userId, instructor.id, enabled);
    res.json({ success: true, data: follower });
  } catch (error: any) {
    logger.error({ error }, 'Failed to toggle notifications');
    res.status(400).json({ success: false, error: error.message || 'Failed to toggle notifications' });
  }
}

export async function getFollowStatus(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const slug = req.params.slug!;

    const instructor = await instructorService.getInstructorBySlug(slug);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor not found' });
    }

    const status = await instructorFollowerService.getFollowingStatus(userId, instructor.id);
    res.json({ success: true, data: status });
  } catch (error) {
    logger.error({ error }, 'Failed to get follow status');
    res.status(500).json({ success: false, error: 'Failed to get follow status' });
  }
}

export async function createReview(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const slug = req.params.slug!;
    const { rating, title, content, programId, classId } = req.body;

    const instructor = await instructorService.getInstructorBySlug(slug);
    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor not found' });
    }

    const review = await instructorReviewService.createReview(userId, {
      instructorId: instructor.id,
      rating,
      title,
      content,
      programId,
      classId,
    });

    res.status(201).json({ success: true, data: review });
  } catch (error: any) {
    logger.error({ error }, 'Failed to create review');
    res.status(400).json({ success: false, error: error.message || 'Failed to create review' });
  }
}

export async function updateReview(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const reviewId = req.params.reviewId!;
    const { rating, title, content } = req.body;

    const review = await instructorReviewService.updateReview(reviewId, userId, { rating, title, content });
    res.json({ success: true, data: review });
  } catch (error: any) {
    logger.error({ error }, 'Failed to update review');
    res.status(400).json({ success: false, error: error.message || 'Failed to update review' });
  }
}

export async function deleteReview(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const reviewId = req.params.reviewId!;

    await instructorReviewService.deleteReview(reviewId, userId);
    res.json({ success: true, message: 'Review deleted' });
  } catch (error: any) {
    logger.error({ error }, 'Failed to delete review');
    res.status(400).json({ success: false, error: error.message || 'Failed to delete review' });
  }
}

export async function markReviewHelpful(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const reviewId = req.params.reviewId!;

    const result = await instructorReviewService.markHelpful(reviewId, userId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error({ error }, 'Failed to mark review helpful');
    res.status(400).json({ success: false, error: error.message || 'Failed to mark review helpful' });
  }
}

export async function reportReview(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const reviewId = req.params.reviewId!;
    const { reason } = req.body;

    await instructorReviewService.reportReview(reviewId, userId, reason);
    res.json({ success: true, message: 'Review reported' });
  } catch (error: any) {
    logger.error({ error }, 'Failed to report review');
    res.status(400).json({ success: false, error: error.message || 'Failed to report review' });
  }
}

export async function getFollowing(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const following = await instructorFollowerService.getFollowing(userId, { page, limit });
    res.json({ success: true, data: following });
  } catch (error) {
    logger.error({ error }, 'Failed to get following list');
    res.status(500).json({ success: false, error: 'Failed to get following list' });
  }
}
