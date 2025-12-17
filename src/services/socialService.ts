import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import type { ActivityType, BadgeCategory, Prisma } from '@prisma/client';

// ============================================
// User Follow Service
// ============================================

export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) {
    return { following: false, message: 'Cannot follow yourself' };
  }

  // Check if already following
  const existing = await prisma.userFollow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });

  if (existing) {
    return { following: true, message: 'Already following' };
  }

  // Check if blocked
  const blocked = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: followerId, blockedId: followingId },
        { blockerId: followingId, blockedId: followerId },
      ],
    },
  });

  if (blocked) {
    return { following: false, message: 'Cannot follow this user' };
  }

  await prisma.userFollow.create({
    data: { followerId, followingId },
  });

  // Create activity
  await createActivity({
    userId: followerId,
    activityType: 'FOLLOWED_USER',
    targetId: followingId,
    targetType: 'user',
  });

  logger.info({ followerId, followingId }, 'User followed');
  return { following: true, message: 'User followed' };
}

export async function unfollowUser(followerId: string, followingId: string) {
  const existing = await prisma.userFollow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });

  if (!existing) {
    return { following: false, message: 'Not following' };
  }

  await prisma.userFollow.delete({
    where: { followerId_followingId: { followerId, followingId } },
  });

  logger.info({ followerId, followingId }, 'User unfollowed');
  return { following: false, message: 'User unfollowed' };
}

export async function isFollowing(followerId: string, followingId: string) {
  const follow = await prisma.userFollow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  return !!follow;
}

export async function getFollowers(
  userId: string,
  pagination: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;

  const [followers, total] = await Promise.all([
    prisma.userFollow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: { id: true, firstName: true, lastName: true, bio: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.userFollow.count({ where: { followingId: userId } }),
  ]);

  return {
    followers: followers.map((f) => f.follower),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getFollowing(
  userId: string,
  pagination: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;

  const [following, total] = await Promise.all([
    prisma.userFollow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: { id: true, firstName: true, lastName: true, bio: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.userFollow.count({ where: { followerId: userId } }),
  ]);

  return {
    following: following.map((f) => f.following),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getFollowStats(userId: string) {
  const [followersCount, followingCount] = await Promise.all([
    prisma.userFollow.count({ where: { followingId: userId } }),
    prisma.userFollow.count({ where: { followerId: userId } }),
  ]);

  return { followersCount, followingCount };
}

// ============================================
// User Activity Service
// ============================================

export async function createActivity(data: {
  userId: string;
  activityType: ActivityType;
  targetId: string;
  targetType: string;
  metadata?: Record<string, any>;
  isPublic?: boolean;
}) {
  return prisma.userActivity.create({
    data: {
      userId: data.userId,
      activityType: data.activityType,
      targetId: data.targetId,
      targetType: data.targetType,
      metadata: data.metadata || {},
      isPublic: data.isPublic ?? true,
    },
  });
}

export async function getUserActivities(
  userId: string,
  pagination: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;

  const [activities, total] = await Promise.all([
    prisma.userActivity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.userActivity.count({ where: { userId } }),
  ]);

  return {
    activities,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getActivityFeed(
  userId: string,
  pagination: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;

  // Get users the current user follows
  const following = await prisma.userFollow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  const followingIds = following.map((f) => f.followingId);
  followingIds.push(userId); // Include own activities

  const [activities, total] = await Promise.all([
    prisma.userActivity.findMany({
      where: {
        userId: { in: followingIds },
        isPublic: true,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.userActivity.count({
      where: {
        userId: { in: followingIds },
        isPublic: true,
      },
    }),
  ]);

  return {
    activities,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getPublicActivities(
  userId: string,
  pagination: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;

  const [activities, total] = await Promise.all([
    prisma.userActivity.findMany({
      where: { userId, isPublic: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.userActivity.count({ where: { userId, isPublic: true } }),
  ]);

  return {
    activities,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================
// Badge Service
// ============================================

export async function getBadges(filters: {
  category?: BadgeCategory;
  isActive?: boolean;
} = {}) {
  const where: Prisma.BadgeWhereInput = {};

  if (filters.category) where.category = filters.category;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  return prisma.badge.findMany({
    where,
    orderBy: [{ category: 'asc' }, { points: 'desc' }],
  });
}

export async function getBadgeById(id: string) {
  return prisma.badge.findUnique({
    where: { id },
    include: {
      _count: {
        select: { users: true },
      },
    },
  });
}

export async function getBadgeBySlug(slug: string) {
  return prisma.badge.findUnique({
    where: { slug },
    include: {
      _count: {
        select: { users: true },
      },
    },
  });
}

export async function createBadge(data: {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color?: string;
  category: BadgeCategory;
  requirement: Record<string, any>;
  points?: number;
}) {
  const badge = await prisma.badge.create({
    data,
  });

  logger.info({ badgeId: badge.id }, 'Badge created');
  return badge;
}

export async function updateBadge(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    description: string;
    icon: string;
    color: string;
    category: BadgeCategory;
    requirement: Record<string, any>;
    points: number;
    isActive: boolean;
  }>,
) {
  const badge = await prisma.badge.update({
    where: { id },
    data,
  });

  logger.info({ badgeId: id }, 'Badge updated');
  return badge;
}

export async function deleteBadge(id: string) {
  await prisma.badge.delete({
    where: { id },
  });

  logger.info({ badgeId: id }, 'Badge deleted');
}

// ============================================
// User Badge Service
// ============================================

export async function getUserBadges(userId: string) {
  const badges = await prisma.userBadge.findMany({
    where: { userId },
    include: {
      badge: true,
    },
    orderBy: { earnedAt: 'desc' },
  });

  return badges;
}

export async function awardBadge(userId: string, badgeId: string) {
  // Check if already has badge
  const existing = await prisma.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId } },
  });

  if (existing) {
    return { awarded: false, message: 'Badge already earned' };
  }

  const userBadge = await prisma.userBadge.create({
    data: { userId, badgeId },
    include: { badge: true },
  });

  // Create activity
  await createActivity({
    userId,
    activityType: 'EARNED_BADGE',
    targetId: badgeId,
    targetType: 'badge',
    metadata: { badgeName: userBadge.badge.name },
  });

  logger.info({ userId, badgeId }, 'Badge awarded');
  return { awarded: true, badge: userBadge.badge };
}

export async function revokeBadge(userId: string, badgeId: string) {
  const existing = await prisma.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId } },
  });

  if (!existing) {
    return { revoked: false, message: 'Badge not earned' };
  }

  await prisma.userBadge.delete({
    where: { userId_badgeId: { userId, badgeId } },
  });

  logger.info({ userId, badgeId }, 'Badge revoked');
  return { revoked: true, message: 'Badge revoked' };
}

export async function hasUserBadge(userId: string, badgeId: string) {
  const badge = await prisma.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId } },
  });
  return !!badge;
}

export async function markBadgeAsSeen(userId: string, badgeId: string) {
  await prisma.userBadge.update({
    where: { userId_badgeId: { userId, badgeId } },
    data: { isNew: false },
  });
}

export async function getNewBadgesCount(userId: string) {
  return prisma.userBadge.count({
    where: { userId, isNew: true },
  });
}

export async function getUserBadgeStats(userId: string) {
  const [totalBadges, totalPoints, badgesByCategory] = await Promise.all([
    prisma.userBadge.count({ where: { userId } }),
    prisma.userBadge.findMany({
      where: { userId },
      include: { badge: { select: { points: true } } },
    }),
    prisma.$queryRaw`
      SELECT b.category, COUNT(*) as count
      FROM user_badges ub
      JOIN badges b ON ub."badgeId" = b.id
      WHERE ub."userId" = ${userId}
      GROUP BY b.category
    ` as Promise<Array<{ category: string; count: bigint }>>,
  ]);

  const points = totalPoints.reduce((sum, ub) => sum + ub.badge.points, 0);
  const categories = badgesByCategory.reduce(
    (acc, item) => {
      acc[item.category] = Number(item.count);
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    totalBadges,
    totalPoints: points,
    badgesByCategory: categories,
  };
}

// ============================================
// Badge Checking Service
// ============================================

export async function checkAndAwardBadges(userId: string) {
  const badges = await prisma.badge.findMany({
    where: { isActive: true },
  });

  const userBadges = await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeId: true },
  });

  const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId));
  const awardedBadges: string[] = [];

  for (const badge of badges) {
    if (earnedBadgeIds.has(badge.id)) continue;

    const earned = await checkBadgeRequirement(userId, badge.requirement as Record<string, any>);
    if (earned) {
      await awardBadge(userId, badge.id);
      awardedBadges.push(badge.id);
    }
  }

  return awardedBadges;
}

async function checkBadgeRequirement(
  userId: string,
  requirement: Record<string, any>,
): Promise<boolean> {
  const { type, value } = requirement;

  switch (type) {
    case 'classes_completed':
      const classCount = await prisma.videoProgress.count({
        where: { userId, completed: true },
      });
      return classCount >= value;

    case 'programs_completed':
      // This would need more complex logic based on your program completion tracking
      return false;

    case 'streak_days':
      // Check daily check-ins for streak
      // This would need implementation based on your streak tracking
      return false;

    case 'followers_count':
      const followersCount = await prisma.userFollow.count({
        where: { followingId: userId },
      });
      return followersCount >= value;

    case 'forum_posts':
      const postCount = await prisma.forumPost.count({
        where: { authorId: userId },
      });
      return postCount >= value;

    case 'comments_count':
      const commentCount = await prisma.comment.count({
        where: { authorId: userId },
      });
      return commentCount >= value;

    case 'challenges_completed':
      // This would need implementation
      return false;

    default:
      return false;
  }
}

// ============================================
// User Block Service
// ============================================

export async function blockUser(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) {
    return { blocked: false, message: 'Cannot block yourself' };
  }

  const existing = await prisma.userBlock.findUnique({
    where: { blockerId_blockedId: { blockerId, blockedId } },
  });

  if (existing) {
    return { blocked: true, message: 'Already blocked' };
  }

  // Remove any existing follow relationships
  await prisma.userFollow.deleteMany({
    where: {
      OR: [
        { followerId: blockerId, followingId: blockedId },
        { followerId: blockedId, followingId: blockerId },
      ],
    },
  });

  await prisma.userBlock.create({
    data: { blockerId, blockedId },
  });

  logger.info({ blockerId, blockedId }, 'User blocked');
  return { blocked: true, message: 'User blocked' };
}

export async function unblockUser(blockerId: string, blockedId: string) {
  const existing = await prisma.userBlock.findUnique({
    where: { blockerId_blockedId: { blockerId, blockedId } },
  });

  if (!existing) {
    return { blocked: false, message: 'Not blocked' };
  }

  await prisma.userBlock.delete({
    where: { blockerId_blockedId: { blockerId, blockedId } },
  });

  logger.info({ blockerId, blockedId }, 'User unblocked');
  return { blocked: false, message: 'User unblocked' };
}

export async function isBlocked(userId1: string, userId2: string) {
  const block = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: userId1, blockedId: userId2 },
        { blockerId: userId2, blockedId: userId1 },
      ],
    },
  });
  return !!block;
}

export async function getBlockedUsers(userId: string) {
  const blocks = await prisma.userBlock.findMany({
    where: { blockerId: userId },
    include: {
      blocked: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  return blocks.map((b) => b.blocked);
}

// ============================================
// Social Share Service
// ============================================

export async function createShare(data: {
  userId: string;
  platform: 'FACEBOOK' | 'TWITTER' | 'INSTAGRAM' | 'WHATSAPP' | 'LINKEDIN' | 'COPY_LINK';
  shareType: 'PROGRESS' | 'ACHIEVEMENT' | 'BADGE' | 'PROGRAM' | 'CLASS' | 'CHALLENGE' | 'PROFILE';
  targetId: string;
  targetType: string;
  shareUrl?: string;
  metadata?: Record<string, any>;
}) {
  return prisma.socialShare.create({
    data,
  });
}

export async function getUserShares(
  userId: string,
  pagination: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;

  const [shares, total] = await Promise.all([
    prisma.socialShare.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.socialShare.count({ where: { userId } }),
  ]);

  return {
    shares,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getShareStats(userId: string) {
  const stats = await prisma.socialShare.groupBy({
    by: ['platform'],
    where: { userId },
    _count: true,
  });

  return stats.reduce(
    (acc, item) => {
      acc[item.platform] = item._count;
      return acc;
    },
    {} as Record<string, number>,
  );
}
