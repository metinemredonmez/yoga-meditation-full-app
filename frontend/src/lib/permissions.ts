// Role-Based Permission System
// Based on the permission matrix for STUDENT, TEACHER, ADMIN, SUPER_ADMIN

export type UserRole = 'STUDENT' | 'TEACHER' | 'INSTRUCTOR' | 'ADMIN' | 'SUPER_ADMIN';

// Role hierarchy with numeric levels (must match backend)
export const ROLE_LEVELS: Record<UserRole, number> = {
  STUDENT: 10,
  INSTRUCTOR: 50,
  TEACHER: 50,
  ADMIN: 80,
  SUPER_ADMIN: 100,
};

/**
 * Get role level for a given role
 */
export function getRoleLevel(role: UserRole | string): number {
  return ROLE_LEVELS[role as UserRole] ?? 0;
}

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
  // Poses & Challenges (Admin only)
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
  | 'gamification.manage';

// Role-Permission Mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  STUDENT: [],

  // INSTRUCTOR is an alias for TEACHER (same permissions)
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
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole | string, permission: Permission): boolean {
  const userRole = role as UserRole;
  return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false;
}

/**
 * Check if a role has any of the given permissions
 */
export function hasAnyPermission(role: UserRole | string, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Check if a role has all of the given permissions
 */
export function hasAllPermissions(role: UserRole | string, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole | string): Permission[] {
  return ROLE_PERMISSIONS[role as UserRole] ?? [];
}

/**
 * Check if role can access admin panel
 */
export function canAccessAdminPanel(role: UserRole | string): boolean {
  return ['TEACHER', 'INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'].includes(role as UserRole);
}

/**
 * Check if role is at least the specified level
 */
export function isRoleAtLeast(role: UserRole | string, minimumRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    STUDENT: 0,
    INSTRUCTOR: 1,
    TEACHER: 1,
    ADMIN: 2,
    SUPER_ADMIN: 3,
  };

  return (roleHierarchy[role as UserRole] ?? -1) >= roleHierarchy[minimumRole];
}
