// Sidebar Configuration with Role-Based Access
// Defines which menu items are visible for each role

import { NavItem } from '@/types';
import { UserRole } from '@/lib/permissions';

export interface NavItemWithRoles extends NavItem {
  roles: UserRole[];
  items?: NavItemWithRoles[];
}

// Full sidebar configuration with role restrictions
export const sidebarConfig: NavItemWithRoles[] = [
  {
    title: 'Dashboard',
    url: '/dashboard/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    roles: ['TEACHER', 'ADMIN', 'SUPER_ADMIN'],
    items: [],
  },
  {
    title: 'Content',
    url: '#',
    icon: 'programs',
    isActive: false,
    roles: ['TEACHER', 'ADMIN', 'SUPER_ADMIN'],
    items: [
      {
        title: 'Programs',
        url: '/dashboard/programs',
        icon: 'programs',
        shortcut: ['p', 'r'],
        roles: ['TEACHER', 'ADMIN', 'SUPER_ADMIN'],
      },
      {
        title: 'Classes',
        url: '/dashboard/classes',
        icon: 'classes',
        shortcut: ['c', 'l'],
        roles: ['TEACHER', 'ADMIN', 'SUPER_ADMIN'],
      },
      {
        title: 'Poses',
        url: '/dashboard/poses',
        icon: 'poses',
        shortcut: ['p', 'o'],
        roles: ['ADMIN', 'SUPER_ADMIN'], // Only ADMIN+
      },
      {
        title: 'Challenges',
        url: '/dashboard/challenges',
        icon: 'challenges',
        shortcut: ['c', 'h'],
        roles: ['ADMIN', 'SUPER_ADMIN'], // Only ADMIN+
      },
    ],
  },
  {
    title: 'Users',
    url: '/dashboard/users',
    icon: 'users',
    isActive: false,
    shortcut: ['u', 'u'],
    roles: ['ADMIN', 'SUPER_ADMIN'], // Only ADMIN+
    items: [],
  },
  {
    title: 'Instructors',
    url: '/dashboard/instructors',
    icon: 'instructors',
    isActive: false,
    shortcut: ['i', 'n'],
    roles: ['ADMIN', 'SUPER_ADMIN'], // Only ADMIN+
    items: [],
  },
  {
    title: 'Financial',
    url: '#',
    icon: 'payments',
    isActive: false,
    roles: ['TEACHER', 'ADMIN', 'SUPER_ADMIN'],
    items: [
      {
        title: 'Payments',
        url: '/dashboard/payments',
        icon: 'payments',
        shortcut: ['p', 'a'],
        roles: ['TEACHER', 'ADMIN', 'SUPER_ADMIN'], // TEACHER sees own only
      },
      {
        title: 'Subscriptions',
        url: '/dashboard/subscriptions',
        icon: 'subscriptions',
        shortcut: ['s', 'u'],
        roles: ['ADMIN', 'SUPER_ADMIN'], // Only ADMIN+
      },
    ],
  },
  {
    title: 'Analytics',
    url: '/dashboard/analytics',
    icon: 'analytics',
    isActive: false,
    shortcut: ['a', 'n'],
    roles: ['TEACHER', 'ADMIN', 'SUPER_ADMIN'], // TEACHER sees own only
    items: [],
  },
  {
    title: 'Moderation',
    url: '/dashboard/moderation',
    icon: 'moderation',
    isActive: false,
    shortcut: ['m', 'o'],
    roles: ['ADMIN', 'SUPER_ADMIN'], // Only ADMIN+
    items: [],
  },
  {
    title: 'Live Streams',
    url: '/dashboard/live-streams',
    icon: 'liveStreams',
    isActive: false,
    shortcut: ['l', 's'],
    roles: ['TEACHER', 'ADMIN', 'SUPER_ADMIN'],
    items: [],
  },
  {
    title: 'Podcasts',
    url: '/dashboard/podcasts',
    icon: 'podcast',
    isActive: false,
    shortcut: ['p', 'c'],
    roles: ['TEACHER', 'ADMIN', 'SUPER_ADMIN'],
    items: [],
  },
  {
    title: 'Audit Logs',
    url: '/dashboard/audit-logs',
    icon: 'auditLogs',
    isActive: false,
    shortcut: ['a', 'l'],
    roles: ['SUPER_ADMIN'], // Only SUPER_ADMIN
    items: [],
  },
  {
    title: 'Notifications',
    url: '/dashboard/notifications',
    icon: 'notifications',
    isActive: false,
    shortcut: ['n', 't'],
    roles: ['ADMIN', 'SUPER_ADMIN'], // Only ADMIN+
    items: [],
  },
  {
    title: 'Community',
    url: '#',
    icon: 'community',
    isActive: false,
    roles: ['ADMIN', 'SUPER_ADMIN'], // Only ADMIN+
    items: [
      {
        title: 'Overview',
        url: '/dashboard/community',
        icon: 'community',
        shortcut: ['c', 'o'],
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        title: 'Categories',
        url: '/dashboard/community/categories',
        icon: 'folder',
        shortcut: ['c', 'c'],
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        title: 'Topics',
        url: '/dashboard/community/topics',
        icon: 'message',
        shortcut: ['c', 't'],
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        title: 'Reports',
        url: '/dashboard/community/reports',
        icon: 'flag',
        shortcut: ['c', 'r'],
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
    ],
  },
  {
    title: 'Gamification',
    url: '#',
    icon: 'gamification',
    isActive: false,
    roles: ['ADMIN', 'SUPER_ADMIN'], // Only ADMIN+
    items: [
      {
        title: 'Achievements',
        url: '/dashboard/gamification/achievements',
        icon: 'achievements',
        shortcut: ['g', 'a'],
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        title: 'Quests',
        url: '/dashboard/gamification/quests',
        icon: 'quests',
        shortcut: ['g', 'q'],
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        title: 'Leaderboard',
        url: '/dashboard/gamification/leaderboard',
        icon: 'leaderboard',
        shortcut: ['g', 'l'],
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        title: 'Shop',
        url: '/dashboard/gamification/shop',
        icon: 'shop',
        shortcut: ['g', 's'],
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        title: 'Daily Rewards',
        url: '/dashboard/gamification/daily-rewards',
        icon: 'dailyRewards',
        shortcut: ['g', 'd'],
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
    ],
  },
  {
    title: 'Account',
    url: '#',
    icon: 'user',
    isActive: true,
    roles: ['TEACHER', 'ADMIN', 'SUPER_ADMIN'], // Everyone who can access admin panel
    items: [
      {
        title: 'Profile',
        url: '/dashboard/profile',
        icon: 'userPen',
        shortcut: ['m', 'm'],
        roles: ['TEACHER', 'ADMIN', 'SUPER_ADMIN'],
      },
      {
        title: 'Settings',
        url: '/dashboard/settings',
        icon: 'settings',
        shortcut: ['s', 't'],
        roles: ['ADMIN', 'SUPER_ADMIN'], // Only ADMIN+ can access settings
      },
      {
        title: 'Logout',
        shortcut: ['l', 'o'],
        url: '/auth/logout',
        icon: 'logout',
        roles: ['TEACHER', 'ADMIN', 'SUPER_ADMIN'],
      },
    ],
  },
];

/**
 * Filter sidebar items based on user role
 */
export function getVisibleNavItems(role: UserRole | string): NavItem[] {
  // Map INSTRUCTOR to TEACHER for sidebar purposes (same access level)
  let userRole = role as UserRole;
  if (userRole === 'INSTRUCTOR') {
    userRole = 'TEACHER';
  }

  return sidebarConfig
    .filter((item) => item.roles.includes(userRole))
    .map((item) => ({
      ...item,
      items: item.items?.filter((subItem) => subItem.roles.includes(userRole)),
    }));
}

/**
 * Get sidebar items for a specific role (backward compatible with navItems)
 */
export function getNavItemsForRole(role: UserRole | string): NavItem[] {
  return getVisibleNavItems(role);
}
