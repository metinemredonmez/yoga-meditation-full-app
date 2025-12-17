import { prisma } from '../../utils/database';
import { UserRole, Prisma } from '@prisma/client';
import { hashPassword } from '../../utils/password';
import { HttpError } from '../../middleware/errorHandler';

export interface UserFilters {
  search?: string;
  role?: UserRole;
  status?: 'active' | 'banned' | 'inactive';
  subscriptionStatus?: 'active' | 'expired' | 'none';
  createdAfter?: Date;
  createdBefore?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Get paginated user list with filters
export async function getUsers(filters: UserFilters) {
  const {
    search,
    role,
    status,
    subscriptionStatus,
    createdAfter,
    createdBefore,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const where: Prisma.UserWhereInput = {};

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (status === 'banned') {
    where.bansReceived = {
      some: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    };
  }

  if (subscriptionStatus === 'active') {
    where.subscriptions = {
      some: {
        status: 'ACTIVE',
      },
    };
  } else if (subscriptionStatus === 'expired') {
    where.AND = [
      {
        subscriptions: {
          some: {},
        },
      },
      {
        NOT: {
          subscriptions: {
            some: {
              status: 'ACTIVE',
            },
          },
        },
      },
    ];
  } else if (subscriptionStatus === 'none') {
    where.subscriptions = { none: {} };
  }

  if (createdAfter) {
    where.createdAt = { ...(where.createdAt as Prisma.DateTimeFilter || {}), gte: createdAfter };
  }
  if (createdBefore) {
    where.createdAt = { ...(where.createdAt as Prisma.DateTimeFilter || {}), lte: createdBefore };
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        subscriptionTier: true,
        createdAt: true,
        subscriptions: {
          where: { status: 'ACTIVE' },
          take: 1,
          select: {
            plan: { select: { name: true } },
          },
        },
        bansReceived: {
          where: {
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          take: 1,
          select: {
            reason: true,
            expiresAt: true,
          },
        },
        _count: {
          select: {
            payments: true,
            bookings: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map((u) => ({
      ...u,
      isBanned: u.bansReceived.length > 0,
      activeBan: u.bansReceived[0] || null,
      activeSubscription: u.subscriptions[0] || null,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Get single user details
export async function getUserDetails(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        orderBy: { createdAt: 'desc' },
        include: { plan: true },
      },
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      bansReceived: {
        orderBy: { createdAt: 'desc' },
        include: { bannedBy: { select: { firstName: true, lastName: true, email: true } } },
      },
      warningsReceived: {
        orderBy: { createdAt: 'desc' },
        include: { warnedBy: { select: { firstName: true, lastName: true, email: true } } },
      },
      challengeEnrollments: {
        take: 5,
        orderBy: { joinedAt: 'desc' },
        include: { challenge: { select: { title: true } } },
      },
      _count: {
        select: {
          payments: true,
          bookings: true,
          challengeEnrollments: true,
        },
      },
    },
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  return user;
}

// Update user
export async function updateUser(
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: UserRole;
  },
) {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    throw new HttpError(404, 'User not found');
  }

  if (data.email && data.email !== existing.email) {
    const emailExists = await prisma.user.findUnique({ where: { email: data.email } });
    if (emailExists) {
      throw new HttpError(400, 'Email already in use');
    }
  }

  return prisma.user.update({
    where: { id: userId },
    data,
  });
}

// Reset user password
export async function resetUserPassword(userId: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  const hashedPassword = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashedPassword },
  });

  return { success: true };
}

// Ban user
export async function banUser(
  userId: string,
  adminId: string,
  reason: string,
  expiresAt?: Date,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  if (user.role === 'ADMIN') {
    throw new HttpError(400, 'Cannot ban admin users');
  }

  // Check for existing active ban
  const existingBan = await prisma.userBan.findFirst({
    where: {
      userId,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  if (existingBan) {
    throw new HttpError(400, 'User is already banned');
  }

  return prisma.userBan.create({
    data: {
      userId,
      bannedById: adminId,
      reason,
      expiresAt,
      isActive: true,
    },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      bannedBy: { select: { firstName: true, lastName: true, email: true } },
    },
  });
}

// Unban user
export async function unbanUser(userId: string, adminId: string, reason?: string) {
  const activeBan = await prisma.userBan.findFirst({
    where: {
      userId,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  if (!activeBan) {
    throw new HttpError(400, 'User is not banned');
  }

  return prisma.userBan.update({
    where: { id: activeBan.id },
    data: {
      isActive: false,
      unbannedById: adminId,
      unbannedAt: new Date(),
      unbanReason: reason,
    },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      unbannedBy: { select: { firstName: true, lastName: true, email: true } },
    },
  });
}

// Warn user
export async function warnUser(
  userId: string,
  adminId: string,
  reason: string,
  severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM',
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  // Convert severity string to number
  const severityLevel = severity === 'LOW' ? 1 : severity === 'MEDIUM' ? 3 : 5;

  return prisma.userWarning.create({
    data: {
      userId,
      warnedById: adminId,
      reason,
      severity: severityLevel,
    },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      warnedBy: { select: { firstName: true, lastName: true, email: true } },
    },
  });
}

// Acknowledge warning
export async function acknowledgeWarning(warningId: string) {
  const warning = await prisma.userWarning.findUnique({ where: { id: warningId } });
  if (!warning) {
    throw new HttpError(404, 'Warning not found');
  }

  return prisma.userWarning.update({
    where: { id: warningId },
    data: { acknowledgedAt: new Date() },
  });
}

// Change user role
export async function changeUserRole(userId: string, newRole: UserRole) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  return prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });
}

// Delete user (soft delete or hard delete based on config)
export async function deleteUser(userId: string, hardDelete = false) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  if (user.role === 'ADMIN') {
    throw new HttpError(400, 'Cannot delete admin users');
  }

  if (hardDelete) {
    await prisma.user.delete({ where: { id: userId } });
    return { deleted: true, userId };
  }

  // Soft delete - anonymize user data
  await prisma.user.update({
    where: { id: userId },
    data: {
      email: `deleted_${userId}@deleted.local`,
      firstName: 'Deleted',
      lastName: 'User',
      passwordHash: '',
      bio: null,
      phoneNumber: null,
    },
  });

  return { deleted: true, softDelete: true, userId };
}

// Get user activity log
export async function getUserActivityLog(userId: string, page = 1, limit = 50) {
  const skip = (page - 1) * limit;

  const [payments, bookings] = await Promise.all([
    prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
      select: {
        id: true,
        amount: true,
        createdAt: true,
      },
    }),
    prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
      include: {
        class: { select: { title: true } },
      },
    }),
  ]);

  const activities = [
    ...payments.map((p) => ({
      type: 'payment' as const,
      description: `Payment: $${p.amount}`,
      createdAt: p.createdAt,
    })),
    ...bookings.map((b) => ({
      type: 'booking' as const,
      description: `Booked class: ${b.class.title}`,
      createdAt: b.createdAt,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return {
    activities: activities.slice(0, limit),
    pagination: {
      page,
      limit,
      total: activities.length,
    },
  };
}

// Get banned users
export async function getBannedUsers(page = 1, limit = 20) {
  const [bans, total] = await Promise.all([
    prisma.userBan.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        bannedBy: { select: { firstName: true, lastName: true, email: true } },
      },
    }),
    prisma.userBan.count({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    }),
  ]);

  return {
    bans,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Get users with warnings
export async function getWarnings(userId?: string, page = 1, limit = 20) {
  const where: Prisma.UserWarningWhereInput = userId ? { userId } : {};

  const [warnings, total] = await Promise.all([
    prisma.userWarning.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        warnedBy: { select: { firstName: true, lastName: true, email: true } },
      },
    }),
    prisma.userWarning.count({ where }),
  ]);

  return {
    warnings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
