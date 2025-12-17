import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

// ============================================
// Follow/Unfollow
// ============================================

/**
 * Follow an instructor
 */
export async function followInstructor(userId: string, instructorId: string) {
  // Check if instructor exists and is approved
  const instructor = await prisma.instructorProfile.findUnique({
    where: { id: instructorId },
  });

  if (!instructor || instructor.status !== 'APPROVED') {
    throw new Error('Instructor not found');
  }

  // Check if already following
  const existing = await prisma.instructorFollower.findUnique({
    where: {
      instructorId_userId: {
        instructorId,
        userId,
      },
    },
  });

  if (existing) {
    throw new Error('Already following this instructor');
  }

  const follower = await prisma.instructorFollower.create({
    data: {
      instructorId,
      userId,
      notificationsEnabled: true,
    },
  });

  logger.info({ userId, instructorId }, 'User followed instructor');

  return follower;
}

/**
 * Unfollow an instructor
 */
export async function unfollowInstructor(userId: string, instructorId: string) {
  const follower = await prisma.instructorFollower.findUnique({
    where: {
      instructorId_userId: {
        instructorId,
        userId,
      },
    },
  });

  if (!follower) {
    throw new Error('Not following this instructor');
  }

  await prisma.instructorFollower.delete({
    where: {
      instructorId_userId: {
        instructorId,
        userId,
      },
    },
  });

  logger.info({ userId, instructorId }, 'User unfollowed instructor');
}

/**
 * Toggle follow notifications
 */
export async function toggleNotifications(
  userId: string,
  instructorId: string,
  enabled: boolean,
) {
  const follower = await prisma.instructorFollower.findUnique({
    where: {
      instructorId_userId: {
        instructorId,
        userId,
      },
    },
  });

  if (!follower) {
    throw new Error('Not following this instructor');
  }

  const updated = await prisma.instructorFollower.update({
    where: {
      instructorId_userId: {
        instructorId,
        userId,
      },
    },
    data: {
      notificationsEnabled: enabled,
    },
  });

  logger.info({ userId, instructorId, enabled }, 'Follower notifications toggled');

  return updated;
}

// ============================================
// Queries
// ============================================

/**
 * Check if user is following an instructor
 */
export async function isFollowing(
  userId: string,
  instructorId: string,
): Promise<boolean> {
  const follower = await prisma.instructorFollower.findUnique({
    where: {
      instructorId_userId: {
        instructorId,
        userId,
      },
    },
  });

  return !!follower;
}

/**
 * Get following status with notification setting
 */
export async function getFollowingStatus(userId: string, instructorId: string) {
  const follower = await prisma.instructorFollower.findUnique({
    where: {
      instructorId_userId: {
        instructorId,
        userId,
      },
    },
  });

  return {
    isFollowing: !!follower,
    notificationsEnabled: follower?.notificationsEnabled ?? false,
    followedAt: follower?.followedAt ?? null,
  };
}

/**
 * Get followers of an instructor
 */
export async function getFollowers(
  instructorId: string,
  pagination: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 20 } = pagination;

  const [items, total] = await Promise.all([
    prisma.instructorFollower.findMany({
      where: { instructorId },
      orderBy: { followedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.instructorFollower.count({ where: { instructorId } }),
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
 * Get instructors a user is following
 */
export async function getFollowing(
  userId: string,
  pagination: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 20 } = pagination;

  const [items, total] = await Promise.all([
    prisma.instructorFollower.findMany({
      where: { userId },
      orderBy: { followedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        instructor: {
          select: {
            id: true,
            displayName: true,
            slug: true,
            profileImageUrl: true,
            averageRating: true,
            totalStudents: true,
          },
        },
      },
    }),
    prisma.instructorFollower.count({ where: { userId } }),
  ]);

  return {
    items: items.map((i) => ({
      ...i.instructor,
      followedAt: i.followedAt,
      notificationsEnabled: i.notificationsEnabled,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get follower count for instructor
 */
export async function getFollowerCount(instructorId: string): Promise<number> {
  return prisma.instructorFollower.count({
    where: { instructorId },
  });
}

// ============================================
// Notifications
// ============================================

/**
 * Get follower user IDs with notifications enabled
 * (for sending new content notifications)
 */
export async function getFollowerIdsWithNotifications(
  instructorId: string,
): Promise<string[]> {
  const followers = await prisma.instructorFollower.findMany({
    where: {
      instructorId,
      notificationsEnabled: true,
    },
    select: { userId: true },
  });

  return followers.map((f) => f.userId);
}

/**
 * Notify followers about new content
 * This would integrate with the messaging system
 */
export async function notifyFollowers(
  instructorId: string,
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  },
) {
  const followerIds = await getFollowerIdsWithNotifications(instructorId);

  if (followerIds.length === 0) {
    return { sent: 0 };
  }

  // In production, this would integrate with push notification service
  // For now, just log the notification
  logger.info(
    {
      instructorId,
      followerCount: followerIds.length,
      notification: notification.title,
    },
    'Notifying followers',
  );

  // Here you would call the push notification service
  // await pushNotificationService.sendToUsers(followerIds, notification);

  return { sent: followerIds.length };
}

// ============================================
// Stats
// ============================================

/**
 * Get follower stats for instructor
 */
export async function getFollowerStats(instructorId: string) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [total, newThisMonth, newThisWeek, withNotifications] = await Promise.all([
    prisma.instructorFollower.count({ where: { instructorId } }),
    prisma.instructorFollower.count({
      where: {
        instructorId,
        followedAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.instructorFollower.count({
      where: {
        instructorId,
        followedAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.instructorFollower.count({
      where: {
        instructorId,
        notificationsEnabled: true,
      },
    }),
  ]);

  return {
    total,
    newThisMonth,
    newThisWeek,
    withNotifications,
    notificationRate: total > 0 ? (withNotifications / total) * 100 : 0,
  };
}
