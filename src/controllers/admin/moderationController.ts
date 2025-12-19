import { Request, Response, NextFunction } from 'express';
import * as moderationService from '../../services/admin/moderationService';
import * as auditService from '../../services/admin/auditService';
import { ReportStatus, AdminAction } from '@prisma/client';

// ============================================
// Reports
// ============================================

export async function getReports(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = {
      status: req.query.status as ReportStatus,
      type: req.query.type as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    const result = await moderationService.getReports(filters);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getReportDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const reportId = req.params.id!;
    const report = await moderationService.getReportDetails(reportId);
    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
}

export async function resolveReport(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const reportId = req.params.id!;
    const { resolution, notes } = req.body;

    const report = await moderationService.resolveReport(reportId, adminId, resolution, notes);

    await auditService.logAdminAction(
      adminId,
      resolution === 'RESOLVED' ? AdminAction.REPORT_RESOLVE : AdminAction.REPORT_DISMISS,
      'report',
      reportId,
      { resolution, notes }
    );

    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
}

export async function bulkResolveReports(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const { reportIds, resolution } = req.body;

    const result = await moderationService.bulkResolveReports(reportIds, adminId, resolution);

    await auditService.logAdminAction(
      adminId,
      AdminAction.BULK_ACTION,
      'reports',
      undefined,
      { reportIds, resolution, updated: result.updated }
    );

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Comments
// ============================================

export async function getComments(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = {
      search: req.query.search as string,
      userId: req.query.userId as string,
      flagged: req.query.flagged === 'true',
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    const result = await moderationService.getComments(filters);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function deleteComment(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const commentId = req.params.id!;

    await moderationService.deleteComment(commentId);

    await auditService.logAdminAction(
      adminId,
      AdminAction.COMMENT_DELETE,
      'comment',
      commentId
    );

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
}

export async function hideComment(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const commentId = req.params.id!;

    const comment = await moderationService.hideComment(commentId);

    await auditService.logAdminAction(
      adminId,
      AdminAction.CONTENT_REJECT,
      'comment',
      commentId
    );

    res.json({ success: true, comment });
  } catch (error) {
    next(error);
  }
}

export async function bulkDeleteComments(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const { commentIds } = req.body;

    const result = await moderationService.bulkDeleteComments(commentIds);

    await auditService.logAdminAction(
      adminId,
      AdminAction.BULK_ACTION,
      'comments',
      undefined,
      { commentIds, deleted: result.deleted }
    );

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Forum Posts - DISABLED (Forum models removed)
// ============================================

// export async function getForumPosts(req: Request, res: Response, next: NextFunction) {
//   try {
//     const filters = {
//       search: req.query.search as string,
//       userId: req.query.userId as string,
//       flagged: req.query.flagged === 'true',
//       page: parseInt(req.query.page as string) || 1,
//       limit: parseInt(req.query.limit as string) || 20,
//     };
//
//     const result = await moderationService.getForumPosts(filters);
//     res.json({ success: true, ...result });
//   } catch (error) {
//     next(error);
//   }
// }

// export async function deleteForumPost(req: Request, res: Response, next: NextFunction) {
//   try {
//     const adminId = req.user!.id;
//     const postId = req.params.id!;
//
//     await moderationService.deleteForumPost(postId);
//
//     await auditService.logAdminAction(
//       adminId,
//       AdminAction.FORUM_POST_DELETE,
//       'forum_post',
//       postId
//     );
//
//     res.json({ success: true, message: 'Forum post deleted' });
//   } catch (error) {
//     next(error);
//   }
// }

// export async function lockForumPost(req: Request, res: Response, next: NextFunction) {
//   try {
//     const adminId = req.user!.id;
//     const postId = req.params.id!;
//
//     const post = await moderationService.lockForumPost(postId);
//
//     await auditService.logAdminAction(
//       adminId,
//       AdminAction.CONTENT_REJECT,
//       'forum_post',
//       postId
//     );
//
//     res.json({ success: true, post });
//   } catch (error) {
//     next(error);
//   }
// }

// export async function pinForumPost(req: Request, res: Response, next: NextFunction) {
//   try {
//     const postId = req.params.id!;
//     const { isPinned } = req.body;
//
//     const post = await moderationService.pinForumPost(postId, isPinned);
//     res.json({ success: true, post });
//   } catch (error) {
//     next(error);
//   }
// }

// ============================================
// Stats & Queue
// ============================================

export async function getModerationStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await moderationService.getModerationStats();
    res.json({ success: true, stats });
  } catch (error) {
    next(error);
  }
}

export async function getContentReviewQueue(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const queue = await moderationService.getContentReviewQueue(page, limit);
    res.json({ success: true, queue });
  } catch (error) {
    next(error);
  }
}
