import { prisma } from '../../utils/database';
import { HttpError } from '../../middleware/errorHandler';
import { Prisma } from '@prisma/client';

// ==================== TAB 1: OVERVIEW ====================

export async function getUserOverview(userId: string) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: {
      user_levels: true,
      user_engagement_stats: true,
      subscriptions: {
        where: { status: 'ACTIVE' },
        take: 1,
        include: {
          plan: true,
        },
      },
      _count: {
        select: {
          video_progress: { where: { completed: true } },
          user_badges: true,
          challenge_enrollments: true,
          payments: { where: { status: 'COMPLETED' } },
          bookings: true,
        },
      },
    },
  });

  // Get equipped title and frame
  let equippedTitle = null;
  let equippedFrame = null;

  if (user?.equippedTitleId) {
    equippedTitle = await prisma.titles.findUnique({
      where: { id: user.equippedTitleId },
      select: { name: true },
    });
  }

  if (user?.equippedFrameId) {
    equippedFrame = await prisma.avatar_frames.findUnique({
      where: { id: user.equippedFrameId },
      select: { name: true },
    });
  }

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  // Get active ban if exists
  const activeBan = await prisma.user_bans.findFirst({
    where: {
      userId,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  // Calculate programs completed
  const programsCompleted = await prisma.video_progress.groupBy({
    by: ['lessonId'],
    where: {
      userId,
      completed: true,
      lessonType: 'PROGRAM_SESSION',
    },
  });

  // Calculate total practice minutes
  const practiceStats = user.user_engagement_stats;

  // Get lifetime value
  const lifetimeValue = await prisma.payments.aggregate({
    where: { userId, status: 'COMPLETED' },
    _sum: { amount: true },
  });

  return {
    profile: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      phoneVerified: user.phoneVerified,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      location: (user as any).location || null,
      timezone: (user as any).timezone || 'Europe/Istanbul',
    },
    accountStatus: {
      status: activeBan ? 'banned' : 'active',
      role: user.role,
      emailVerified: (user as any).emailVerified || false,
      phoneVerified: user.phoneVerified,
      twoFactorEnabled: (user as any).twoFactorEnabled || false,
      memberSince: user.createdAt,
      lastLogin: (user as any).lastLoginAt || null,
      lastIp: (user as any).lastLoginIp || null,
    },
    quickStats: {
      classesCompleted: user._count.video_progress,
      totalXP: user.user_levels?.totalXP || 0,
      level: user.user_levels?.level || 1,
      badgesEarned: user._count.user_badges,
      currentStreak: user.user_levels?.currentStreak || 0,
      totalPracticeMinutes: practiceStats?.totalPracticeMinutes || 0,
      programsCompleted: programsCompleted.length,
      challengesJoined: user._count.challenge_enrollments,
      totalSessions: practiceStats?.totalSessions || 0,
    },
    subscription: user.subscriptions[0]
      ? {
          plan: user.subscriptions[0].plan?.name,
          tier: user.subscriptions[0].plan?.tier,
          status: user.subscriptions[0].status,
          provider: user.subscriptions[0].provider,
          currentPeriodStart: user.subscriptions[0].currentPeriodStart,
          currentPeriodEnd: user.subscriptions[0].currentPeriodEnd,
          autoRenew: user.subscriptions[0].autoRenew,
        }
      : null,
    equippedItems: {
      title: equippedTitle?.name || null,
      frame: equippedFrame?.name || null,
    },
    lifetimeValue: lifetimeValue._sum.amount || 0,
    totalPayments: user._count.payments,
    activeBan: activeBan
      ? {
          reason: activeBan.reason,
          expiresAt: activeBan.expiresAt,
          createdAt: activeBan.createdAt,
        }
      : null,
  };
}

// ==================== TAB 2: ACTIVITY ====================

export async function getUserActivity(
  userId: string,
  page = 1,
  limit = 50,
  filter?: string
) {
  const skip = (page - 1) * limit;

  // Build filter
  const where: Prisma.user_activitiesWhereInput = { userId };
  if (filter && filter !== 'all') {
    where.activityType = filter;
  }

  const [activities, total] = await Promise.all([
    prisma.user_activities.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user_activities.count({ where }),
  ]);

  return {
    activities: activities.map((a) => ({
      id: a.id,
      type: a.activityType,
      targetId: a.targetId,
      targetType: a.targetType,
      metadata: a.metadata,
      createdAt: a.createdAt,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getUserLoginHistory(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [tokens, total] = await Promise.all([
    prisma.refresh_tokens.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        revokedAt: true,
      },
    }),
    prisma.refresh_tokens.count({ where: { userId } }),
  ]);

  return {
    loginHistory: tokens.map((t) => ({
      id: t.id,
      device: parseUserAgent(t.userAgent || ''),
      ipAddress: t.ipAddress,
      createdAt: t.createdAt,
      isRevoked: !!t.revokedAt,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getUserActiveSessions(userId: string) {
  const sessions = await prisma.refresh_tokens.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  return sessions.map((s) => ({
    id: s.id,
    device: parseUserAgent(s.userAgent || ''),
    ipAddress: s.ipAddress,
    createdAt: s.createdAt,
    lastUsed: s.updatedAt,
  }));
}

export async function revokeUserSession(userId: string, sessionId: string) {
  const session = await prisma.refresh_tokens.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    throw new HttpError(404, 'Session not found');
  }

  await prisma.refresh_tokens.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });

  return { success: true };
}

export async function revokeAllUserSessions(userId: string) {
  await prisma.refresh_tokens.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  return { success: true };
}

// ==================== TAB 3: PROGRESS ====================

export async function getUserProgress(userId: string) {
  const [
    userLevel,
    badges,
    achievements,
    recentClasses,
    favorites,
    activeChallenges,
  ] = await Promise.all([
    // Level & XP
    prisma.user_levels.findUnique({
      where: { userId },
    }),

    // Badges
    prisma.user_badges.findMany({
      where: { userId },
      include: { badges: true },
      orderBy: { earnedAt: 'desc' },
    }),

    // Achievements in progress
    prisma.user_achievements.findMany({
      where: { userId },
      include: { achievements: true },
      orderBy: { percentage: 'desc' },
    }),

    // Recently completed classes
    prisma.video_progress.findMany({
      where: { userId, completed: true },
      take: 10,
      orderBy: { lastWatchedAt: 'desc' },
      include: {
        classes: {
          select: {
            id: true,
            title: true,
            duration: true,
            thumbnailUrl: true,
          },
        },
      },
    }),

    // Favorites
    prisma.favorites.findMany({
      where: { userId },
      take: 10,
      orderBy: { createdAt: 'desc' },
    }),

    // Active challenges
    prisma.challenge_enrollments.findMany({
      where: { userId },
      include: {
        challenges: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
          },
        },
        daily_checks: {
          where: { completed: true },
        },
      },
      orderBy: { joinedAt: 'desc' },
    }),
  ]);

  // Calculate XP needed for next level
  const currentLevel = userLevel?.level || 1;
  const xpForNextLevel = calculateXPForLevel(currentLevel + 1);
  const currentXP = userLevel?.currentXP || 0;

  return {
    level: {
      current: currentLevel,
      currentXP,
      xpForNextLevel,
      progressPercent: Math.round((currentXP / xpForNextLevel) * 100),
      totalXP: userLevel?.totalXP || 0,
      currentStreak: userLevel?.currentStreak || 0,
      longestStreak: userLevel?.longestStreak || 0,
      streakFreezeCount: userLevel?.streakFreezeCount || 0,
    },
    badges: {
      earned: badges.map((b) => ({
        id: b.badges?.id,
        name: b.badges?.name,
        description: b.badges?.description,
        iconUrl: b.badges?.iconUrl,
        earnedAt: b.earnedAt,
      })),
      totalAvailable: await prisma.badges.count(),
    },
    achievements: achievements.map((a) => ({
      id: a.achievements?.id,
      name: a.achievements?.name,
      description: a.achievements?.description,
      currentValue: a.currentValue,
      targetValue: a.targetValue,
      percentage: a.percentage,
      isCompleted: a.isCompleted,
      completedAt: a.completedAt,
      xpReward: a.achievements?.xpReward,
    })),
    recentClasses: recentClasses.map((v) => ({
      id: v.classes?.id,
      title: v.classes?.title,
      duration: v.classes?.duration,
      thumbnailUrl: v.classes?.thumbnailUrl,
      completedAt: v.lastWatchedAt,
    })),
    favorites: favorites.map((f) => ({
      id: f.id,
      itemId: f.itemId,
      itemType: f.itemType,
      createdAt: f.createdAt,
    })),
    challenges: activeChallenges.map((c) => ({
      id: c.challenges?.id,
      title: c.challenges?.title,
      startDate: c.challenges?.startDate,
      endDate: c.challenges?.endDate,
      joinedAt: c.joinedAt,
      daysCompleted: c.daily_checks?.length || 0,
    })),
  };
}

// ==================== TAB 4: PAYMENTS ====================

export async function getUserPayments(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [
    currentSubscription,
    subscriptionHistory,
    payments,
    paymentsTotal,
    couponUsages,
    paymentStats,
  ] = await Promise.all([
    // Current subscription
    prisma.subscriptions.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: { plan: true },
    }),

    // Subscription history
    prisma.subscriptions.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { plan: true },
    }),

    // Payments
    prisma.payments.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { invoices: true },
    }),

    // Payments count
    prisma.payments.count({ where: { userId } }),

    // Coupon usages
    prisma.coupon_usages.findMany({
      where: { userId },
      include: { coupons: true },
    }),

    // Payment stats
    prisma.payments.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
      _sum: { amount: true },
    }),
  ]);

  // Calculate stats
  const successfulPayments =
    paymentStats.find((p) => p.status === 'COMPLETED')?._count || 0;
  const failedPayments =
    paymentStats.find((p) => p.status === 'FAILED')?._count || 0;
  const lifetimeValue =
    paymentStats.find((p) => p.status === 'COMPLETED')?._sum?.amount || 0;

  // Get refunds
  const refunds = await prisma.refunds.aggregate({
    where: { payments: { userId } },
    _sum: { amount: true },
  });

  return {
    currentSubscription: currentSubscription
      ? {
          id: currentSubscription.id,
          plan: currentSubscription.plan?.name,
          tier: currentSubscription.plan?.tier,
          price: currentSubscription.plan?.priceMonthly,
          status: currentSubscription.status,
          provider: currentSubscription.provider,
          stripeCustomerId: currentSubscription.stripeCustomerId,
          currentPeriodStart: currentSubscription.currentPeriodStart,
          currentPeriodEnd: currentSubscription.currentPeriodEnd,
          autoRenew: currentSubscription.autoRenew,
          cancelAtPeriodEnd: currentSubscription.cancelAtPeriodEnd,
        }
      : null,
    subscriptionHistory: subscriptionHistory.map((s) => ({
      id: s.id,
      plan: s.plan?.name,
      status: s.status,
      provider: s.provider,
      createdAt: s.createdAt,
      cancelledAt: s.cancelledAt,
    })),
    payments: {
      items: payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        provider: p.provider,
        description: p.description,
        cardBrand: p.cardBrand,
        cardLast4: p.cardLast4,
        receiptUrl: p.receiptUrl,
        invoiceId: p.invoices?.id,
        invoicePdf: p.invoices?.invoicePdf,
        createdAt: p.createdAt,
      })),
      pagination: {
        page,
        limit,
        total: paymentsTotal,
        totalPages: Math.ceil(paymentsTotal / limit),
      },
    },
    couponUsages: couponUsages.map((cu) => ({
      code: cu.coupons?.code,
      discount: cu.coupons?.discountPercent || cu.coupons?.discountAmount,
      discountType: cu.coupons?.discountType,
      savedAmount: cu.discountAmount,
      usedAt: cu.createdAt,
    })),
    summary: {
      lifetimeValue,
      totalPayments: successfulPayments + failedPayments,
      successfulPayments,
      failedPayments,
      totalRefunded: refunds._sum.amount || 0,
    },
  };
}

export async function extendSubscription(
  userId: string,
  days: number,
  adminId: string
) {
  const subscription = await prisma.subscriptions.findFirst({
    where: { userId, status: 'ACTIVE' },
  });

  if (!subscription) {
    throw new HttpError(404, 'No active subscription found');
  }

  const newEndDate = new Date(subscription.currentPeriodEnd!);
  newEndDate.setDate(newEndDate.getDate() + days);

  const updated = await prisma.subscriptions.update({
    where: { id: subscription.id },
    data: { currentPeriodEnd: newEndDate },
  });

  // Log the action
  await prisma.audit_logs.create({
    data: {
      userId: adminId,
      action: 'EXTEND_SUBSCRIPTION',
      entityType: 'subscription',
      entityId: subscription.id,
      metadata: { targetUserId: userId, days, newEndDate } as any,
    },
  });

  return updated;
}

export async function grantPremium(
  userId: string,
  days: number,
  planId: string,
  adminId: string
) {
  // Check if user already has active subscription
  const existing = await prisma.subscriptions.findFirst({
    where: { userId, status: 'ACTIVE' },
  });

  if (existing) {
    throw new HttpError(400, 'User already has an active subscription');
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);

  const subscription = await prisma.subscriptions.create({
    data: {
      userId,
      planId,
      provider: 'ADMIN',
      status: 'ACTIVE',
      currentPeriodStart: startDate,
      currentPeriodEnd: endDate,
      autoRenew: false,
    },
  });

  // Also update user's subscription tier
  const plan = await prisma.subscription_plans.findUnique({
    where: { id: planId },
  });

  if (plan) {
    await prisma.users.update({
      where: { id: userId },
      data: {
        subscriptionTier: plan.tier,
        subscriptionExpiresAt: endDate,
      },
    });
  }

  // Log the action
  await prisma.audit_logs.create({
    data: {
      userId: adminId,
      action: 'GRANT_PREMIUM',
      entityType: 'subscription',
      entityId: subscription.id,
      metadata: { targetUserId: userId, days, planId } as any,
    },
  });

  return subscription;
}

// ==================== TAB 5: SUPPORT ====================

export async function getUserSupport(userId: string) {
  const [warnings, bans, adminNotes, reportsByUser, reportsAgainstUser] =
    await Promise.all([
      // Warnings
      prisma.user_warnings.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          users_user_warnings_warnedByIdTousers: {
            select: { firstName: true, lastName: true },
          },
        },
      }),

      // Ban history
      prisma.user_bans.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          users_user_bans_bannedByIdTousers: {
            select: { firstName: true, lastName: true },
          },
          users_user_bans_unbannedByIdTousers: {
            select: { firstName: true, lastName: true },
          },
        },
      }),

      // Admin notes
      prisma.admin_notes.findMany({
        where: { entityType: 'user', entityId: userId },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        include: {
          users: { select: { firstName: true, lastName: true } },
        },
      }),

      // Reports BY this user
      prisma.content_reports.findMany({
        where: { reporterId: userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),

      // Reports AGAINST this user
      prisma.content_reports.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

  // Get communication logs
  const messageLogs = await prisma.message_logs.findMany({
    where: { userId },
    orderBy: { sentAt: 'desc' },
    take: 20,
  });

  return {
    warnings: warnings.map((w) => ({
      id: w.id,
      reason: w.reason,
      severity: w.severity,
      acknowledgedAt: w.acknowledgedAt,
      createdAt: w.createdAt,
      warnedBy: w.users_user_warnings_warnedByIdTousers
        ? `${w.users_user_warnings_warnedByIdTousers.firstName} ${w.users_user_warnings_warnedByIdTousers.lastName}`
        : null,
    })),
    bans: bans.map((b) => ({
      id: b.id,
      reason: b.reason,
      duration: b.duration,
      expiresAt: b.expiresAt,
      isActive: b.isActive,
      createdAt: b.createdAt,
      bannedBy: b.users_user_bans_bannedByIdTousers
        ? `${b.users_user_bans_bannedByIdTousers.firstName} ${b.users_user_bans_bannedByIdTousers.lastName}`
        : null,
      unbannedAt: b.unbannedAt,
      unbannedBy: b.users_user_bans_unbannedByIdTousers
        ? `${b.users_user_bans_unbannedByIdTousers.firstName} ${b.users_user_bans_unbannedByIdTousers.lastName}`
        : null,
      unbanReason: b.unbanReason,
    })),
    adminNotes: adminNotes.map((n) => ({
      id: n.id,
      content: n.content,
      isPinned: n.isPinned,
      createdAt: n.createdAt,
      author: n.users
        ? `${n.users.firstName} ${n.users.lastName}`
        : null,
    })),
    reportsByUser: reportsByUser.map((r) => ({
      id: r.id,
      targetType: r.targetType,
      targetId: r.targetId,
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt,
    })),
    reportsAgainstUser: reportsAgainstUser.map((r) => ({
      id: r.id,
      targetType: r.targetType,
      targetId: r.targetId,
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt,
    })),
    communicationLog: messageLogs.map((m) => ({
      id: m.id,
      channel: m.channel,
      subject: m.subject,
      status: m.status,
      sentAt: m.sentAt,
    })),
  };
}

export async function addAdminNote(
  userId: string,
  adminId: string,
  content: string,
  isPinned = false
) {
  return prisma.admin_notes.create({
    data: {
      adminId,
      entityType: 'user',
      entityId: userId,
      content,
      isPinned,
    },
  });
}

export async function deleteAdminNote(noteId: string) {
  return prisma.admin_notes.delete({
    where: { id: noteId },
  });
}

export async function toggleNotePin(noteId: string) {
  const note = await prisma.admin_notes.findUnique({
    where: { id: noteId },
  });

  if (!note) {
    throw new HttpError(404, 'Note not found');
  }

  return prisma.admin_notes.update({
    where: { id: noteId },
    data: { isPinned: !note.isPinned },
  });
}

// ==================== TAB 6: ADMIN ACTIONS ====================

export async function addXP(
  userId: string,
  amount: number,
  reason: string,
  adminId: string
) {
  const userLevel = await prisma.user_levels.findUnique({
    where: { userId },
  });

  const currentXP = userLevel?.currentXP || 0;
  const totalXP = userLevel?.totalXP || 0;
  const currentLevel = userLevel?.level || 1;

  const newCurrentXP = currentXP + amount;
  const newTotalXP = totalXP + amount;
  const newLevel = calculateLevelFromXP(newTotalXP);

  await prisma.user_levels.upsert({
    where: { userId },
    create: {
      userId,
      currentXP: newCurrentXP,
      totalXP: newTotalXP,
      level: newLevel,
    },
    update: {
      currentXP: newCurrentXP,
      totalXP: newTotalXP,
      level: newLevel,
    },
  });

  // Create XP transaction
  await prisma.xp_transactions.create({
    data: {
      userId,
      amount,
      type: 'ADMIN_GRANT',
      description: reason,
    },
  });

  // Log the action
  await prisma.audit_logs.create({
    data: {
      userId: adminId,
      action: 'GRANT_XP',
      entityType: 'user',
      entityId: userId,
      metadata: { amount, reason, newLevel, newTotalXP } as any,
    },
  });

  return { newLevel, newTotalXP, newCurrentXP, leveledUp: newLevel > currentLevel };
}

export async function grantBadge(
  userId: string,
  badgeId: string,
  adminId: string
) {
  // Check if already has badge
  const existing = await prisma.user_badges.findFirst({
    where: { userId, badgeId },
  });

  if (existing) {
    throw new HttpError(400, 'User already has this badge');
  }

  const userBadge = await prisma.user_badges.create({
    data: {
      userId,
      badgeId,
    },
    include: { badges: true },
  });

  // Log the action
  await prisma.audit_logs.create({
    data: {
      userId: adminId,
      action: 'GRANT_BADGE',
      entityType: 'user_badge',
      entityId: userBadge.id,
      metadata: { targetUserId: userId, badgeId, badgeName: userBadge.badges?.name } as any,
    },
  });

  return userBadge;
}

export async function grantTitle(
  userId: string,
  titleId: string,
  adminId: string
) {
  // Check if already has title
  const existing = await prisma.user_titles.findFirst({
    where: { userId, titleId },
  });

  if (existing) {
    throw new HttpError(400, 'User already has this title');
  }

  const userTitle = await prisma.user_titles.create({
    data: {
      userId,
      titleId,
    },
    include: { titles: true },
  });

  // Log the action
  await prisma.audit_logs.create({
    data: {
      userId: adminId,
      action: 'GRANT_TITLE',
      entityType: 'user_title',
      entityId: userTitle.id,
      metadata: { targetUserId: userId, titleId, titleName: userTitle.titles?.name } as any,
    },
  });

  return userTitle;
}

export async function addStreakFreeze(userId: string, adminId: string) {
  const userLevel = await prisma.user_levels.upsert({
    where: { userId },
    create: {
      userId,
      streakFreezeCount: 1,
    },
    update: {
      streakFreezeCount: { increment: 1 },
    },
  });

  // Log the action
  await prisma.audit_logs.create({
    data: {
      userId: adminId,
      action: 'ADD_STREAK_FREEZE',
      entityType: 'user',
      entityId: userId,
      metadata: { newCount: userLevel.streakFreezeCount } as any,
    },
  });

  return userLevel;
}

export async function verifyUserEmail(userId: string, adminId: string) {
  await prisma.users.update({
    where: { id: userId },
    data: { emailVerified: true },
  });

  await prisma.audit_logs.create({
    data: {
      userId: adminId,
      action: 'VERIFY_EMAIL',
      entityType: 'user',
      entityId: userId,
    },
  });

  return { success: true };
}

export async function verifyUserPhone(userId: string, adminId: string) {
  await prisma.users.update({
    where: { id: userId },
    data: { phoneVerified: true },
  });

  await prisma.audit_logs.create({
    data: {
      userId: adminId,
      action: 'VERIFY_PHONE',
      entityType: 'user',
      entityId: userId,
    },
  });

  return { success: true };
}

export async function exportUserData(userId: string) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: {
      subscriptions: true,
      payments: true,
      bookings: { include: { classes: true } },
      user_levels: true,
      user_badges: { include: { badges: true } },
      user_achievements: { include: { achievements: true } },
      challenge_enrollments: { include: { challenges: true } },
      favorites: true,
      video_progress: true,
      user_activities: true,
    },
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  return user;
}

// ==================== TAB 7: TEACHER ====================

export async function getTeacherProfile(userId: string) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || user.role !== 'TEACHER') {
    return null;
  }

  const [
    instructorProfile,
    classes,
    programs,
    earnings,
    payouts,
    reviews,
    analytics,
  ] = await Promise.all([
    prisma.instructor_profiles.findUnique({
      where: { userId },
    }),

    prisma.classes.findMany({
      where: { instructorId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),

    prisma.programs.findMany({
      where: { instructorId: userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),

    prisma.instructor_earnings.findMany({
      where: { instructorId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),

    prisma.instructor_payouts.findMany({
      where: { instructorId: userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),

    prisma.instructor_reviews.findMany({
      where: { instructorId: userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        users: { select: { firstName: true, lastName: true } },
      },
    }),

    prisma.instructor_analytics.findFirst({
      where: { instructorId: userId },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  if (!instructorProfile) {
    return null;
  }

  // Calculate totals
  const totalEarnings = await prisma.instructor_earnings.aggregate({
    where: { instructorId: userId, status: 'COMPLETED' },
    _sum: { amount: true },
  });

  const pendingEarnings = await prisma.instructor_earnings.aggregate({
    where: { instructorId: userId, status: 'PENDING' },
    _sum: { amount: true },
  });

  const followerCount = await prisma.instructor_followers.count({
    where: { instructorId: userId },
  });

  return {
    profile: {
      id: instructorProfile.id,
      displayName: instructorProfile.displayName,
      slug: instructorProfile.slug,
      bio: instructorProfile.bio,
      shortBio: instructorProfile.shortBio,
      profileImageUrl: instructorProfile.profileImageUrl,
      coverImageUrl: instructorProfile.coverImageUrl,
      specializations: instructorProfile.specializations,
      certifications: instructorProfile.certifications,
      yearsOfExperience: instructorProfile.yearsOfExperience,
      languages: instructorProfile.languages,
      status: instructorProfile.status,
      tier: instructorProfile.tier,
      isVerified: instructorProfile.isVerified,
      isFeatured: instructorProfile.isFeatured,
      commissionRate: instructorProfile.commissionRate,
    },
    stats: {
      totalClasses: instructorProfile.totalClasses,
      totalPrograms: instructorProfile.totalPrograms,
      totalStudents: instructorProfile.totalStudents,
      averageRating: instructorProfile.averageRating,
      totalReviews: instructorProfile.totalReviews,
      totalViews: analytics?.totalViews || 0,
      completionRate: analytics?.completionRate || 0,
      followers: followerCount,
    },
    financial: {
      totalEarnings: totalEarnings._sum.amount || 0,
      pendingBalance: pendingEarnings._sum.amount || 0,
      commissionRate: instructorProfile.commissionRate,
      minimumPayout: instructorProfile.minimumPayout,
    },
    classes: classes.map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      difficulty: c.difficulty,
      duration: c.duration,
      thumbnailUrl: c.thumbnailUrl,
      viewCount: c.viewCount,
      averageRating: c.averageRating,
      createdAt: c.createdAt,
    })),
    programs: programs.map((p) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      difficulty: p.difficulty,
      totalDuration: p.totalDuration,
      thumbnailUrl: p.thumbnailUrl,
      enrollmentCount: p.enrollmentCount,
      averageRating: p.averageRating,
      createdAt: p.createdAt,
    })),
    earnings: earnings.map((e) => ({
      id: e.id,
      type: e.type,
      amount: e.amount,
      status: e.status,
      createdAt: e.createdAt,
    })),
    payouts: payouts.map((p) => ({
      id: p.id,
      amount: p.amount,
      method: p.method,
      status: p.status,
      completedAt: p.completedAt,
      createdAt: p.createdAt,
    })),
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      content: r.content,
      studentName: r.users
        ? `${r.users.firstName} ${r.users.lastName}`
        : 'Anonymous',
      createdAt: r.createdAt,
    })),
  };
}

export async function updateInstructorStatus(
  userId: string,
  status: string,
  adminId: string
) {
  const updated = await prisma.instructor_profiles.update({
    where: { userId },
    data: { status },
  });

  await prisma.audit_logs.create({
    data: {
      userId: adminId,
      action: 'UPDATE_INSTRUCTOR_STATUS',
      entityType: 'instructor_profile',
      entityId: updated.id,
      metadata: { targetUserId: userId, newStatus: status } as any,
    },
  });

  return updated;
}

export async function updateInstructorTier(
  userId: string,
  tier: string,
  adminId: string
) {
  const updated = await prisma.instructor_profiles.update({
    where: { userId },
    data: { tier },
  });

  await prisma.audit_logs.create({
    data: {
      userId: adminId,
      action: 'UPDATE_INSTRUCTOR_TIER',
      entityType: 'instructor_profile',
      entityId: updated.id,
      metadata: { targetUserId: userId, newTier: tier } as any,
    },
  });

  return updated;
}

export async function toggleInstructorVerified(userId: string, adminId: string) {
  const profile = await prisma.instructor_profiles.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new HttpError(404, 'Instructor profile not found');
  }

  const updated = await prisma.instructor_profiles.update({
    where: { userId },
    data: { isVerified: !profile.isVerified },
  });

  await prisma.audit_logs.create({
    data: {
      userId: adminId,
      action: profile.isVerified ? 'UNVERIFY_INSTRUCTOR' : 'VERIFY_INSTRUCTOR',
      entityType: 'instructor_profile',
      entityId: updated.id,
      metadata: { targetUserId: userId } as any,
    },
  });

  return updated;
}

export async function toggleInstructorFeatured(userId: string, adminId: string) {
  const profile = await prisma.instructor_profiles.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new HttpError(404, 'Instructor profile not found');
  }

  const updated = await prisma.instructor_profiles.update({
    where: { userId },
    data: { isFeatured: !profile.isFeatured },
  });

  await prisma.audit_logs.create({
    data: {
      userId: adminId,
      action: profile.isFeatured ? 'UNFEATURE_INSTRUCTOR' : 'FEATURE_INSTRUCTOR',
      entityType: 'instructor_profile',
      entityId: updated.id,
      metadata: { targetUserId: userId } as any,
    },
  });

  return updated;
}

export async function updateCommissionRate(
  userId: string,
  rate: number,
  adminId: string
) {
  if (rate < 0 || rate > 100) {
    throw new HttpError(400, 'Commission rate must be between 0 and 100');
  }

  const updated = await prisma.instructor_profiles.update({
    where: { userId },
    data: { commissionRate: rate },
  });

  await prisma.audit_logs.create({
    data: {
      userId: adminId,
      action: 'UPDATE_COMMISSION_RATE',
      entityType: 'instructor_profile',
      entityId: updated.id,
      metadata: { targetUserId: userId, newRate: rate } as any,
    },
  });

  return updated;
}

// ==================== HELPER FUNCTIONS ====================

function parseUserAgent(ua: string): string {
  if (!ua) return 'Unknown Device';

  if (ua.includes('iPhone')) return 'iPhone';
  if (ua.includes('iPad')) return 'iPad';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('Mac')) return 'Mac';
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Linux')) return 'Linux';

  return 'Unknown Device';
}

function calculateXPForLevel(level: number): number {
  // Simple exponential curve: level 1 = 100, level 2 = 200, etc.
  return level * 100;
}

function calculateLevelFromXP(totalXP: number): number {
  // Reverse of calculateXPForLevel
  let level = 1;
  let xpRequired = 0;
  while (xpRequired + calculateXPForLevel(level) <= totalXP) {
    xpRequired += calculateXPForLevel(level);
    level++;
  }
  return level;
}
