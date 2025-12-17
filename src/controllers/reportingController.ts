import type { Request, Response, NextFunction } from 'express';
import * as reportingService from '../services/reportingService';
import { HttpError } from '../middleware/errorHandler';
import type { ReportReason, ReportTargetType, ReportStatus } from '@prisma/client';

// ============================================
// Report Controllers (User)
// ============================================

export async function reportContent(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const reporterId = (req as any).user.userId;
    const { targetType, targetId, reason, description } = req.body;

    let result;

    switch (targetType) {
      case 'TOPIC':
        result = await reportingService.reportTopic(
          reporterId,
          targetId,
          reason as ReportReason,
          description,
        );
        break;
      case 'POST':
        result = await reportingService.reportPost(
          reporterId,
          targetId,
          reason as ReportReason,
          description,
        );
        break;
      case 'COMMENT':
        result = await reportingService.reportComment(
          reporterId,
          targetId,
          reason as ReportReason,
          description,
        );
        break;
      case 'USER':
        result = await reportingService.reportUser(
          reporterId,
          targetId,
          reason as ReportReason,
          description,
        );
        break;
      default:
        throw new HttpError(400, 'Invalid target type');
    }

    if (!result.created) {
      res.json({ success: true, message: result.message, data: result.report });
      return;
    }

    res.status(201).json({ success: true, data: result.report });
  } catch (error) {
    next(error);
  }
}

export async function reportTopic(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const reporterId = (req as any).user.userId;
    const topicId = req.params.topicId!;
    const { reason, description } = req.body;

    const result = await reportingService.reportTopic(
      reporterId,
      topicId,
      reason as ReportReason,
      description,
    );

    if (!result.created) {
      res.json({ success: true, message: result.message });
      return;
    }

    res.status(201).json({ success: true, data: result.report });
  } catch (error) {
    next(error);
  }
}

export async function reportPost(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const reporterId = (req as any).user.userId;
    const postId = req.params.postId!;
    const { reason, description } = req.body;

    const result = await reportingService.reportPost(
      reporterId,
      postId,
      reason as ReportReason,
      description,
    );

    if (!result.created) {
      res.json({ success: true, message: result.message });
      return;
    }

    res.status(201).json({ success: true, data: result.report });
  } catch (error) {
    next(error);
  }
}

export async function reportComment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const reporterId = (req as any).user.userId;
    const commentId = req.params.commentId!;
    const { reason, description } = req.body;

    const result = await reportingService.reportComment(
      reporterId,
      commentId,
      reason as ReportReason,
      description,
    );

    if (!result.created) {
      res.json({ success: true, message: result.message });
      return;
    }

    res.status(201).json({ success: true, data: result.report });
  } catch (error) {
    next(error);
  }
}

export async function reportUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const reporterId = (req as any).user.userId;
    const userId = req.params.userId!;
    const { reason, description } = req.body;

    const result = await reportingService.reportUser(
      reporterId,
      userId,
      reason as ReportReason,
      description,
    );

    if (!result.created) {
      res.json({ success: true, message: result.message });
      return;
    }

    res.status(201).json({ success: true, data: result.report });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Admin Controllers
// ============================================

export async function getReports(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { status, reason, targetType, reporterId, reviewedById, page, limit } = req.query;

    const result = await reportingService.getReports(
      {
        status: status as ReportStatus,
        reason: reason as ReportReason,
        targetType: targetType as ReportTargetType,
        reporterId: reporterId as string,
        reviewedById: reviewedById as string,
      },
      {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      },
    );

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getReportById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;

    const report = await reportingService.getReportById(id);

    if (!report) {
      throw new HttpError(404, 'Report not found');
    }

    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
}

export async function resolveReport(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const reviewedById = (req as any).user.userId;
    const { resolution, action } = req.body;

    const report = await reportingService.resolveReport(
      id,
      reviewedById,
      resolution,
      action,
    );

    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
}

export async function dismissReport(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const reviewedById = (req as any).user.userId;
    const { resolution } = req.body;

    const report = await reportingService.dismissReport(id, reviewedById, resolution);

    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
}

export async function updateReportStatus(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const reviewedById = (req as any).user.userId;
    const { status, resolution } = req.body;

    const report = await reportingService.updateReportStatus(
      id,
      status as ReportStatus,
      reviewedById,
      resolution,
    );

    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
}

export async function getReportStats(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const stats = await reportingService.getReportStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

export async function getUserReportHistory(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.params.userId!;

    const history = await reportingService.getUserReportHistory(userId);
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
}
