import type { Request, Response, NextFunction } from 'express';
import * as socialService from '../services/socialService';
import { HttpError } from '../middleware/errorHandler';
import type { BadgeCategory } from '@prisma/client';

// ============================================
// Follow Controllers
// ============================================

export async function followUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const followerId = (req as any).user.userId;
    const followingId = req.params.userId!;

    const result = await socialService.followUser(followerId, followingId);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function unfollowUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const followerId = (req as any).user.userId;
    const followingId = req.params.userId!;

    const result = await socialService.unfollowUser(followerId, followingId);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getFollowers(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.params.userId!;
    const { page, limit } = req.query;

    const result = await socialService.getFollowers(userId, {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getFollowing(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.params.userId!;
    const { page, limit } = req.query;

    const result = await socialService.getFollowing(userId, {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getMyFollowers(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user.userId;
    const { page, limit } = req.query;

    const result = await socialService.getFollowers(userId, {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getMyFollowing(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user.userId;
    const { page, limit } = req.query;

    const result = await socialService.getFollowing(userId, {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getFollowStats(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.params.userId!;
    const stats = await socialService.getFollowStats(userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

export async function checkFollowStatus(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const followerId = (req as any).user.userId;
    const followingId = req.params.userId!;

    const isFollowing = await socialService.isFollowing(followerId, followingId);
    res.json({ success: true, data: { isFollowing } });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Activity Controllers
// ============================================

export async function getMyActivities(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user.userId;
    const { page, limit } = req.query;

    const result = await socialService.getUserActivities(userId, {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getUserActivities(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.params.userId!;
    const { page, limit } = req.query;

    const result = await socialService.getPublicActivities(userId, {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getActivityFeed(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user.userId;
    const { page, limit } = req.query;

    const result = await socialService.getActivityFeed(userId, {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Badge Controllers
// ============================================

export async function getBadges(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { category, isActive } = req.query;

    const badges = await socialService.getBadges({
      category: category as BadgeCategory,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });

    res.json({ success: true, data: badges });
  } catch (error) {
    next(error);
  }
}

export async function getBadgeById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const badge = await socialService.getBadgeById(id);

    if (!badge) {
      throw new HttpError(404, 'Badge not found');
    }

    res.json({ success: true, data: badge });
  } catch (error) {
    next(error);
  }
}

export async function createBadge(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { name, slug, description, icon, color, category, requirement, points } = req.body;

    const badge = await socialService.createBadge({
      name,
      slug,
      description,
      icon,
      color,
      category,
      requirement,
      points,
    });

    res.status(201).json({ success: true, data: badge });
  } catch (error) {
    next(error);
  }
}

export async function updateBadge(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const { name, slug, description, icon, color, category, requirement, points, isActive } = req.body;

    const badge = await socialService.updateBadge(id, {
      name,
      slug,
      description,
      icon,
      color,
      category,
      requirement,
      points,
      isActive,
    });

    res.json({ success: true, data: badge });
  } catch (error) {
    next(error);
  }
}

export async function deleteBadge(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    await socialService.deleteBadge(id);
    res.json({ success: true, message: 'Badge deleted' });
  } catch (error) {
    next(error);
  }
}

// ============================================
// User Badge Controllers
// ============================================

export async function getMyBadges(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user.userId;
    const badges = await socialService.getUserBadges(userId);
    res.json({ success: true, data: badges });
  } catch (error) {
    next(error);
  }
}

export async function getUserBadges(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.params.userId!;
    const badges = await socialService.getUserBadges(userId);
    res.json({ success: true, data: badges });
  } catch (error) {
    next(error);
  }
}

export async function getMyBadgeStats(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user.userId;
    const stats = await socialService.getUserBadgeStats(userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

export async function getNewBadgesCount(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user.userId;
    const count = await socialService.getNewBadgesCount(userId);
    res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
}

export async function markBadgeAsSeen(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user.userId;
    const badgeId = req.params.badgeId!;

    await socialService.markBadgeAsSeen(userId, badgeId);
    res.json({ success: true, message: 'Badge marked as seen' });
  } catch (error) {
    next(error);
  }
}

// Admin badge award
export async function awardBadgeToUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId, badgeId } = req.body;

    const result = await socialService.awardBadge(userId, badgeId);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function revokeBadgeFromUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId, badgeId } = req.body;

    const result = await socialService.revokeBadge(userId, badgeId);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Block Controllers
// ============================================

export async function blockUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const blockerId = (req as any).user.userId;
    const blockedId = req.params.userId!;

    const result = await socialService.blockUser(blockerId, blockedId);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function unblockUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const blockerId = (req as any).user.userId;
    const blockedId = req.params.userId!;

    const result = await socialService.unblockUser(blockerId, blockedId);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getBlockedUsers(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user.userId;
    const blockedUsers = await socialService.getBlockedUsers(userId);
    res.json({ success: true, data: blockedUsers });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Share Controllers
// ============================================

export async function createShare(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user.userId;
    const { platform, shareType, targetId, targetType, shareUrl, metadata } = req.body;

    const share = await socialService.createShare({
      userId,
      platform,
      shareType,
      targetId,
      targetType,
      shareUrl,
      metadata,
    });

    res.status(201).json({ success: true, data: share });
  } catch (error) {
    next(error);
  }
}

export async function getMyShares(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user.userId;
    const { page, limit } = req.query;

    const result = await socialService.getUserShares(userId, {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getMyShareStats(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user.userId;
    const stats = await socialService.getShareStats(userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}
