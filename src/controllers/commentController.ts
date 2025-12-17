import type { Request, Response, NextFunction } from 'express';
import * as commentService from '../services/commentService';
import { HttpError } from '../middleware/errorHandler';
import type { CommentTargetType } from '@prisma/client';

// ============================================
// Comment Controllers
// ============================================

export async function getComments(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const {
      targetType,
      programId,
      classId,
      poseId,
      challengeId,
      authorId,
      hasRating,
      minRating,
      isVerifiedPurchase,
      page,
      limit,
      sortField,
      sortOrder,
    } = req.query;

    const result = await commentService.getComments(
      {
        targetType: targetType as CommentTargetType,
        programId: programId as string,
        classId: classId as string,
        poseId: poseId as string,
        challengeId: challengeId as string,
        authorId: authorId as string,
        hasRating: hasRating === 'true' ? true : hasRating === 'false' ? false : undefined,
        minRating: minRating ? parseInt(minRating as string, 10) : undefined,
        isVerifiedPurchase: isVerifiedPurchase === 'true' ? true : undefined,
        isHidden: false, // Don't show hidden comments by default
      },
      {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      },
      {
        field: sortField as string,
        order: sortOrder as 'asc' | 'desc',
      },
    );

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getCommentById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const comment = await commentService.getCommentById(id);

    if (!comment) {
      throw new HttpError(404, 'Comment not found');
    }

    res.json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
}

export async function getCommentReplies(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const { page, limit } = req.query;

    const result = await commentService.getCommentReplies(id, {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function createComment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user.userId;
    const {
      content,
      targetType,
      programId,
      classId,
      poseId,
      challengeId,
      parentId,
      rating,
    } = req.body;

    // Validate that appropriate target ID is provided
    if (targetType === 'PROGRAM' && !programId) {
      throw new HttpError(400, 'programId is required for PROGRAM comments');
    }
    if (targetType === 'CLASS' && !classId) {
      throw new HttpError(400, 'classId is required for CLASS comments');
    }
    if (targetType === 'POSE' && !poseId) {
      throw new HttpError(400, 'poseId is required for POSE comments');
    }
    if (targetType === 'CHALLENGE' && !challengeId) {
      throw new HttpError(400, 'challengeId is required for CHALLENGE comments');
    }

    // If it's a review (has rating), check if user can review
    if (rating) {
      const targetId = programId || classId || poseId || challengeId;
      const { canReview, reason } = await commentService.canUserReview(
        userId,
        targetType as CommentTargetType,
        targetId,
      );

      if (!canReview) {
        throw new HttpError(400, reason || 'Cannot submit review');
      }
    }

    const comment = await commentService.createComment({
      content,
      authorId: userId,
      targetType: targetType as CommentTargetType,
      programId,
      classId,
      poseId,
      challengeId,
      parentId,
      rating,
    });

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
}

export async function updateComment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const { content, rating } = req.body;

    const existingComment = await commentService.getCommentById(id);
    if (!existingComment) {
      throw new HttpError(404, 'Comment not found');
    }

    if (existingComment.authorId !== userId && userRole !== 'ADMIN') {
      throw new HttpError(403, 'Not authorized to update this comment');
    }

    const comment = await commentService.updateComment(id, { content, rating });
    res.json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
}

export async function deleteComment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    const existingComment = await commentService.getCommentById(id);
    if (!existingComment) {
      throw new HttpError(404, 'Comment not found');
    }

    if (existingComment.authorId !== userId && userRole !== 'ADMIN') {
      throw new HttpError(403, 'Not authorized to delete this comment');
    }

    await commentService.deleteComment(id);
    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Like Controllers
// ============================================

export async function likeComment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const userId = (req as any).user.userId;

    const result = await commentService.likeComment(id, userId);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function unlikeComment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const userId = (req as any).user.userId;

    const result = await commentService.unlikeComment(id, userId);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Review Stats Controllers
// ============================================

export async function getProgramReviewStats(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const programId = req.params.programId!;
    const stats = await commentService.getProgramReviewStats(programId);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

export async function getClassReviewStats(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const classId = req.params.classId!;
    const stats = await commentService.getClassReviewStats(classId);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

// ============================================
// User Reviews Controller
// ============================================

export async function getMyReviews(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user.userId;
    const { page, limit } = req.query;

    const result = await commentService.getUserReviews(userId, {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Admin Controllers
// ============================================

export async function hideComment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const { reason } = req.body;

    const comment = await commentService.hideComment(id, reason);
    res.json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
}

export async function unhideComment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;

    const comment = await commentService.unhideComment(id);
    res.json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
}

export async function getReportedComments(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { page, limit } = req.query;

    const result = await commentService.getReportedComments({
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}
