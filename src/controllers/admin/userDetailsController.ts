import { Request, Response, NextFunction } from 'express';
import * as userDetailsService from '../../services/admin/userDetailsService';

// ==================== TAB 1: OVERVIEW ====================

export async function getUserOverview(req: Request, res: Response, next: NextFunction) {
  try {
    const overview = await userDetailsService.getUserOverview(req.params.id);
    res.json({ success: true, data: overview });
  } catch (error) {
    next(error);
  }
}

// ==================== TAB 2: ACTIVITY ====================

export async function getUserActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, filter } = req.query;
    const activities = await userDetailsService.getUserActivity(
      req.params.id,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 50,
      filter as string
    );
    res.json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
}

export async function getUserLoginHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = req.query;
    const history = await userDetailsService.getUserLoginHistory(
      req.params.id,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 20
    );
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
}

export async function getUserActiveSessions(req: Request, res: Response, next: NextFunction) {
  try {
    const sessions = await userDetailsService.getUserActiveSessions(req.params.id);
    res.json({ success: true, data: sessions });
  } catch (error) {
    next(error);
  }
}

export async function revokeUserSession(req: Request, res: Response, next: NextFunction) {
  try {
    await userDetailsService.revokeUserSession(req.params.id, req.params.sessionId);
    res.json({ success: true, message: 'Session revoked' });
  } catch (error) {
    next(error);
  }
}

export async function revokeAllUserSessions(req: Request, res: Response, next: NextFunction) {
  try {
    await userDetailsService.revokeAllUserSessions(req.params.id);
    res.json({ success: true, message: 'All sessions revoked' });
  } catch (error) {
    next(error);
  }
}

// ==================== TAB 3: PROGRESS ====================

export async function getUserProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const progress = await userDetailsService.getUserProgress(req.params.id);
    res.json({ success: true, data: progress });
  } catch (error) {
    next(error);
  }
}

// ==================== TAB 4: PAYMENTS ====================

export async function getUserPayments(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = req.query;
    const payments = await userDetailsService.getUserPayments(
      req.params.id,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 20
    );
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
}

export async function extendSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const { days } = req.body;
    const result = await userDetailsService.extendSubscription(
      req.params.id,
      days,
      req.user!.id
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function grantPremium(req: Request, res: Response, next: NextFunction) {
  try {
    const { days, planId } = req.body;
    const result = await userDetailsService.grantPremium(
      req.params.id,
      days,
      planId,
      req.user!.id
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

// ==================== TAB 5: SUPPORT ====================

export async function getUserSupport(req: Request, res: Response, next: NextFunction) {
  try {
    const support = await userDetailsService.getUserSupport(req.params.id);
    res.json({ success: true, data: support });
  } catch (error) {
    next(error);
  }
}

export async function addAdminNote(req: Request, res: Response, next: NextFunction) {
  try {
    const { content, isPinned } = req.body;
    const note = await userDetailsService.addAdminNote(
      req.params.id,
      req.user!.id,
      content,
      isPinned
    );
    res.json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
}

export async function deleteAdminNote(req: Request, res: Response, next: NextFunction) {
  try {
    await userDetailsService.deleteAdminNote(req.params.noteId);
    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    next(error);
  }
}

export async function toggleNotePin(req: Request, res: Response, next: NextFunction) {
  try {
    const note = await userDetailsService.toggleNotePin(req.params.noteId);
    res.json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
}

// ==================== TAB 6: ADMIN ACTIONS ====================

export async function addXP(req: Request, res: Response, next: NextFunction) {
  try {
    const { amount, reason } = req.body;
    const result = await userDetailsService.addXP(
      req.params.id,
      amount,
      reason,
      req.user!.id
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function grantBadge(req: Request, res: Response, next: NextFunction) {
  try {
    const { badgeId } = req.body;
    const result = await userDetailsService.grantBadge(
      req.params.id,
      badgeId,
      req.user!.id
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function grantTitle(req: Request, res: Response, next: NextFunction) {
  try {
    const { titleId } = req.body;
    const result = await userDetailsService.grantTitle(
      req.params.id,
      titleId,
      req.user!.id
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function addStreakFreeze(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await userDetailsService.addStreakFreeze(req.params.id, req.user!.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function verifyUserEmail(req: Request, res: Response, next: NextFunction) {
  try {
    await userDetailsService.verifyUserEmail(req.params.id, req.user!.id);
    res.json({ success: true, message: 'Email verified' });
  } catch (error) {
    next(error);
  }
}

export async function verifyUserPhone(req: Request, res: Response, next: NextFunction) {
  try {
    await userDetailsService.verifyUserPhone(req.params.id, req.user!.id);
    res.json({ success: true, message: 'Phone verified' });
  } catch (error) {
    next(error);
  }
}

export async function exportUserData(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await userDetailsService.exportUserData(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

// ==================== TAB 7: TEACHER ====================

export async function getTeacherProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await userDetailsService.getTeacherProfile(req.params.id);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
}

export async function updateInstructorStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = req.body;
    const result = await userDetailsService.updateInstructorStatus(
      req.params.id,
      status,
      req.user!.id
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function updateInstructorTier(req: Request, res: Response, next: NextFunction) {
  try {
    const { tier } = req.body;
    const result = await userDetailsService.updateInstructorTier(
      req.params.id,
      tier,
      req.user!.id
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function toggleInstructorVerified(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await userDetailsService.toggleInstructorVerified(
      req.params.id,
      req.user!.id
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function toggleInstructorFeatured(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await userDetailsService.toggleInstructorFeatured(
      req.params.id,
      req.user!.id
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function updateCommissionRate(req: Request, res: Response, next: NextFunction) {
  try {
    const { rate } = req.body;
    const result = await userDetailsService.updateCommissionRate(
      req.params.id,
      rate,
      req.user!.id
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
