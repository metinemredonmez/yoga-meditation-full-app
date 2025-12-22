import { Request, Response, NextFunction } from 'express';
import '../types/express'; // Ensure Express.Request types are extended

// Role hierarchy with numeric levels for comparison
export const ROLE_LEVELS = {
  STUDENT: 10,
  TEACHER: 50,
  INSTRUCTOR: 50, // Alias for TEACHER
  ADMIN: 80,
  SUPER_ADMIN: 100,
} as const;

export type UserRole = keyof typeof ROLE_LEVELS;

// Permission types for fine-grained access control
export type Permission =
  // Users
  | 'users.view'
  | 'users.edit'
  | 'users.delete'
  | 'users.ban'
  | 'users.role_change'
  // Content
  | 'content.view'
  | 'content.create'
  | 'content.edit_own'
  | 'content.edit_all'
  | 'content.delete'
  | 'content.publish'
  // Poses & Challenges
  | 'poses.manage'
  | 'challenges.manage'
  // Finance
  | 'payments.view'
  | 'payments.view_own'
  | 'payments.refund'
  | 'subscriptions.view'
  // Analytics
  | 'analytics.view'
  | 'analytics.view_own'
  // Moderation
  | 'moderation.view'
  // Live Streams & Podcasts
  | 'streams.view'
  | 'streams.manage_own'
  | 'streams.manage_all'
  // Audit
  | 'audit.view'
  // Settings
  | 'settings.view'
  | 'settings.edit'
  // Notifications
  | 'notifications.manage'
  // Community
  | 'community.manage'
  // Gamification
  | 'gamification.manage'
  // Instructors
  | 'instructors.view'
  | 'instructors.manage';

// Role-Permission Mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  STUDENT: [],

  INSTRUCTOR: [
    'content.create',
    'content.edit_own',
    'payments.view_own',
    'analytics.view_own',
    'streams.manage_own',
  ],

  TEACHER: [
    'content.create',
    'content.edit_own',
    'payments.view_own',
    'analytics.view_own',
    'streams.manage_own',
  ],

  ADMIN: [
    'users.view',
    'users.edit',
    'users.ban',
    'content.view',
    'content.create',
    'content.edit_own',
    'content.edit_all',
    'content.delete',
    'content.publish',
    'poses.manage',
    'challenges.manage',
    'payments.view',
    'subscriptions.view',
    'analytics.view',
    'moderation.view',
    'streams.view',
    'streams.manage_all',
    'notifications.manage',
    'community.manage',
    'gamification.manage',
    'settings.view',
    'instructors.view',
    'instructors.manage',
  ],

  SUPER_ADMIN: [
    'users.view',
    'users.edit',
    'users.delete',
    'users.ban',
    'users.role_change',
    'content.view',
    'content.create',
    'content.edit_own',
    'content.edit_all',
    'content.delete',
    'content.publish',
    'poses.manage',
    'challenges.manage',
    'payments.view',
    'payments.refund',
    'subscriptions.view',
    'analytics.view',
    'moderation.view',
    'streams.view',
    'streams.manage_all',
    'audit.view',
    'notifications.manage',
    'community.manage',
    'gamification.manage',
    'settings.view',
    'settings.edit',
    'instructors.view',
    'instructors.manage',
  ],
};

/**
 * Get the numeric level for a role
 */
export function getRoleLevel(role: string): number {
  return ROLE_LEVELS[role as UserRole] ?? 0;
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: string, permission: Permission): boolean {
  const userRole = role as UserRole;
  return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false;
}

/**
 * Check if user's role level is at least the required level
 */
export function isRoleAtLevel(userRole: string, requiredLevel: number): boolean {
  return getRoleLevel(userRole) >= requiredLevel;
}

/**
 * Check if user's role is at least the minimum role
 */
export function isRoleAtLeast(userRole: string, minimumRole: UserRole): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(minimumRole);
}

/**
 * Middleware: Require user to have at least the specified role level
 * Usage: requireLevel(ROLE_LEVELS.ADMIN) or requireLevel(80)
 */
export function requireLevel(minLevel: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userLevel = getRoleLevel(req.user.role);
    if (userLevel < minLevel) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: minLevel,
        current: userLevel
      });
    }

    return next();
  };
}

/**
 * Middleware: Require user to have at least the specified role
 * Usage: requireRole('ADMIN') or requireRole('TEACHER')
 */
export function requireRole(minimumRole: UserRole) {
  return requireLevel(ROLE_LEVELS[minimumRole]);
}

/**
 * Middleware: Require user to have a specific permission
 * Usage: requirePermission('users.delete')
 */
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        error: 'Permission denied',
        required: permission
      });
    }

    return next();
  };
}

/**
 * Middleware: Require user to have any of the specified permissions
 */
export function requireAnyPermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasAny = permissions.some(p => hasPermission(req.user!.role, p));
    if (!hasAny) {
      return res.status(403).json({
        error: 'Permission denied',
        required: permissions
      });
    }

    return next();
  };
}

/**
 * Middleware: Require ownership or admin access
 * Checks if user owns the resource (via userId param/body) OR has admin level
 * Usage: requireOwnership('userId') - checks req.params.userId or req.body.userId
 */
export function requireOwnership(
  userIdField: string = 'userId',
  adminLevel: number = ROLE_LEVELS.ADMIN
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get the resource's userId from params, body, or query
    const resourceUserId =
      req.params[userIdField] ||
      req.body?.[userIdField] ||
      req.query[userIdField];

    const currentUserId = req.user.userId || req.user.id;
    const userLevel = getRoleLevel(req.user.role);

    // Allow if user is admin level or higher
    if (userLevel >= adminLevel) {
      return next();
    }

    // Allow if user owns the resource
    if (resourceUserId && resourceUserId === currentUserId) {
      return next();
    }

    return res.status(403).json({
      error: 'Access denied: not owner or admin'
    });
  };
}

/**
 * Middleware: Check if user can access admin panel
 * Allows TEACHER, ADMIN, SUPER_ADMIN
 */
export function requireAdminAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const level = getRoleLevel(req.user.role);
  if (level < ROLE_LEVELS.TEACHER) {
    return res.status(403).json({ error: 'Admin panel access required' });
  }

  return next();
}

/**
 * Middleware: Restrict to SUPER_ADMIN only
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super Admin access required' });
  }

  return next();
}

/**
 * Helper: Attach user role level to request for use in controllers
 */
export function attachRoleLevel(req: Request, _res: Response, next: NextFunction) {
  if (req.user) {
    (req as any).roleLevel = getRoleLevel(req.user.role);
  }
  return next();
}

// Export convenient constants for route protection
export const LEVEL = {
  STUDENT: ROLE_LEVELS.STUDENT,
  TEACHER: ROLE_LEVELS.TEACHER,
  ADMIN: ROLE_LEVELS.ADMIN,
  SUPER_ADMIN: ROLE_LEVELS.SUPER_ADMIN,
} as const;
