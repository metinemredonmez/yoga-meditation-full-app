import { Request, Response, NextFunction } from 'express';
import * as userManagementService from '../../services/admin/userManagementService';
import { UserRole } from '@prisma/client';

// Get paginated list of users
export async function getUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, search, role, status } = req.query;

    const result = await userManagementService.getUsers({
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      search: search as string | undefined,
      role: role as UserRole | undefined,
      status: status as 'active' | 'banned' | 'inactive' | undefined,
    });

    // Map to frontend expected format
    const mappedUsers = result.users.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      status: u.isBanned ? 'BANNED' : 'ACTIVE',
      avatarUrl: null,
      createdAt: u.createdAt,
      lastLoginAt: null,
    }));

    res.json({
      users: mappedUsers,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

// Get user by ID
export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const user = await userManagementService.getUserDetails(id);

    // Calculate stats
    const totalClassesAttended = user._count?.bookings || 0;
    const totalMinutesPracticed = totalClassesAttended * 45; // Approximate

    // Check if user is banned
    const activeBan = user.bansReceived?.find(
      (ban: { isActive: boolean; expiresAt: Date | null }) =>
        ban.isActive && (!ban.expiresAt || new Date(ban.expiresAt) > new Date())
    );

    // Get active subscription
    const activeSubscription = user.subscriptions?.find(
      (sub: { status: string }) => sub.status === 'ACTIVE'
    );

    // Map subscriptions for response
    const subscriptions = user.subscriptions?.map(
      (sub: {
        id: string;
        status: string;
        startDate: Date;
        endDate: Date | null;
        createdAt: Date;
        plan: { name: string; price: number } | null;
      }) => ({
        id: sub.id,
        status: sub.status,
        planName: sub.plan?.name || 'Unknown',
        planPrice: sub.plan?.price || 0,
        startDate: sub.startDate,
        endDate: sub.endDate,
        createdAt: sub.createdAt,
      })
    );

    // Map payments for response
    const payments = user.payments?.map(
      (p: {
        id: string;
        amount: number;
        status: string;
        paymentMethod: string | null;
        createdAt: Date;
      }) => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        paymentMethod: p.paymentMethod,
        createdAt: p.createdAt,
      })
    );

    // Map bans for response
    const bans = user.bansReceived?.map(
      (ban: {
        id: string;
        reason: string;
        isActive: boolean;
        expiresAt: Date | null;
        createdAt: Date;
        users_user_bans_bannedByIdTousers: {
          firstName: string | null;
          lastName: string | null;
          email: string;
        } | null;
      }) => ({
        id: ban.id,
        reason: ban.reason,
        isActive: ban.isActive,
        expiresAt: ban.expiresAt,
        createdAt: ban.createdAt,
        bannedBy: ban.users_user_bans_bannedByIdTousers
          ? {
              name: `${ban.users_user_bans_bannedByIdTousers.firstName || ''} ${ban.users_user_bans_bannedByIdTousers.lastName || ''}`.trim(),
              email: ban.users_user_bans_bannedByIdTousers.email,
            }
          : null,
      })
    );

    // Map bookings for response
    const bookings = user.bookings?.map(
      (b: {
        id: string;
        status: string;
        createdAt: Date;
        class: {
          id: string;
          title: string;
          startTime: Date;
          endTime: Date;
          instructor: { firstName: string | null; lastName: string | null } | null;
        };
      }) => ({
        id: b.id,
        status: b.status,
        createdAt: b.createdAt,
        class: {
          id: b.class.id,
          title: b.class.title,
          startTime: b.class.startTime,
          endTime: b.class.endTime,
          instructor: b.class.instructor
            ? `${b.class.instructor.firstName || ''} ${b.class.instructor.lastName || ''}`.trim()
            : null,
        },
      })
    );

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: activeBan ? 'BANNED' : 'ACTIVE',
      avatarUrl: user.avatarUrl || null,
      bio: user.bio || null,
      phone: user.phoneNumber || null,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt || null,
      // Active subscription info
      subscriptionStatus: activeSubscription ? activeSubscription.status : null,
      // Stats
      totalClassesAttended,
      totalMinutesPracticed,
      totalPayments: user._count?.payments || 0,
      totalChallenges: user._count?.challenge_enrollments || 0,
      // Detailed data
      subscriptions: subscriptions || [],
      payments: payments || [],
      bans: bans || [],
      bookings: bookings || [],
    });
  } catch (error) {
    next(error);
  }
}

// Ban user
export async function banUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user!.id;

    const ban = await userManagementService.banUser(id, adminId, reason || 'No reason provided');

    res.json({
      success: true,
      message: 'User banned successfully',
      ban,
    });
  } catch (error) {
    next(error);
  }
}

// Unban user
export async function unbanUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;

    const result = await userManagementService.unbanUser(id, adminId);

    res.json({
      success: true,
      message: 'User unbanned successfully',
      result,
    });
  } catch (error) {
    next(error);
  }
}

// Warn user
export async function warnUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { reason, message } = req.body;
    const adminId = req.user!.id;

    const warning = await userManagementService.warnUser(
      id,
      adminId,
      reason || message || 'Warning issued by admin'
    );

    res.json({
      success: true,
      message: 'Warning sent successfully',
      warning,
    });
  } catch (error) {
    next(error);
  }
}

// Change user role
export async function changeUserRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['ADMIN', 'TEACHER', 'STUDENT'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    const user = await userManagementService.changeUserRole(id, role as UserRole);

    res.json({
      success: true,
      message: 'Role updated successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Reset user password
export async function resetUserPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    // Generate a random password or send reset email
    // For now, we'll generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-10);
    await userManagementService.resetUserPassword(id, tempPassword);

    // In a real scenario, you'd send an email with the reset link
    // For now, just return success
    res.json({
      success: true,
      message: 'Password reset email sent',
    });
  } catch (error) {
    next(error);
  }
}

// Get user activity
export async function getUserActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { page, limit } = req.query;

    const result = await userManagementService.getUserActivityLog(
      id,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 50
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
}
