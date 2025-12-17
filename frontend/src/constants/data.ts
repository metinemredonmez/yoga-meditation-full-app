import { NavItem } from '@/types';

export type Product = {
  photo_url: string;
  name: string;
  description: string;
  created_at: string;
  price: number;
  id: number;
  category: string;
  updated_at: string;
};

//Info: The following data is used for the sidebar navigation and Cmd K bar.
export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },
  {
    title: 'Content',
    url: '#',
    icon: 'programs',
    isActive: false,
    items: [
      {
        title: 'Programs',
        url: '/dashboard/programs',
        icon: 'programs',
        shortcut: ['p', 'r']
      },
      {
        title: 'Classes',
        url: '/dashboard/classes',
        icon: 'classes',
        shortcut: ['c', 'l']
      },
      {
        title: 'Poses',
        url: '/dashboard/poses',
        icon: 'poses',
        shortcut: ['p', 'o']
      },
      {
        title: 'Challenges',
        url: '/dashboard/challenges',
        icon: 'challenges',
        shortcut: ['c', 'h']
      }
    ]
  },
  {
    title: 'Users',
    url: '/dashboard/users',
    icon: 'users',
    isActive: false,
    shortcut: ['u', 'u'],
    items: []
  },
  {
    title: 'Instructors',
    url: '/dashboard/instructors',
    icon: 'instructors',
    isActive: false,
    shortcut: ['i', 'n'],
    items: []
  },
  {
    title: 'Financial',
    url: '#',
    icon: 'payments',
    isActive: false,
    items: [
      {
        title: 'Payments',
        url: '/dashboard/payments',
        icon: 'payments',
        shortcut: ['p', 'a']
      },
      {
        title: 'Subscriptions',
        url: '/dashboard/subscriptions',
        icon: 'subscriptions',
        shortcut: ['s', 'u']
      }
    ]
  },
  {
    title: 'Analytics',
    url: '/dashboard/analytics',
    icon: 'analytics',
    isActive: false,
    shortcut: ['a', 'n'],
    items: []
  },
  {
    title: 'Moderation',
    url: '/dashboard/moderation',
    icon: 'moderation',
    isActive: false,
    shortcut: ['m', 'o'],
    items: []
  },
  {
    title: 'Live Streams',
    url: '/dashboard/live-streams',
    icon: 'liveStreams',
    isActive: false,
    shortcut: ['l', 's'],
    items: []
  },
  {
    title: 'Podcasts',
    url: '/dashboard/podcasts',
    icon: 'podcast',
    isActive: false,
    shortcut: ['p', 'c'],
    items: []
  },
  {
    title: 'Audit Logs',
    url: '/dashboard/audit-logs',
    icon: 'auditLogs',
    isActive: false,
    shortcut: ['a', 'l'],
    items: []
  },
  {
    title: 'Notifications',
    url: '/dashboard/notifications',
    icon: 'notifications',
    isActive: false,
    shortcut: ['n', 't'],
    items: []
  },
  {
    title: 'Community',
    url: '#',
    icon: 'community',
    isActive: false,
    items: [
      {
        title: 'Overview',
        url: '/dashboard/community',
        icon: 'community',
        shortcut: ['c', 'o']
      },
      {
        title: 'Categories',
        url: '/dashboard/community/categories',
        icon: 'folder',
        shortcut: ['c', 'c']
      },
      {
        title: 'Topics',
        url: '/dashboard/community/topics',
        icon: 'message',
        shortcut: ['c', 't']
      },
      {
        title: 'Reports',
        url: '/dashboard/community/reports',
        icon: 'flag',
        shortcut: ['c', 'r']
      }
    ]
  },
  {
    title: 'Gamification',
    url: '#',
    icon: 'gamification',
    isActive: false,
    items: [
      {
        title: 'Achievements',
        url: '/dashboard/gamification/achievements',
        icon: 'achievements',
        shortcut: ['g', 'a']
      },
      {
        title: 'Quests',
        url: '/dashboard/gamification/quests',
        icon: 'quests',
        shortcut: ['g', 'q']
      },
      {
        title: 'Leaderboard',
        url: '/dashboard/gamification/leaderboard',
        icon: 'leaderboard',
        shortcut: ['g', 'l']
      },
      {
        title: 'Shop',
        url: '/dashboard/gamification/shop',
        icon: 'shop',
        shortcut: ['g', 's']
      },
      {
        title: 'Daily Rewards',
        url: '/dashboard/gamification/daily-rewards',
        icon: 'dailyRewards',
        shortcut: ['g', 'd']
      }
    ]
  },
  {
    title: 'Account',
    url: '#',
    icon: 'user',
    isActive: true,
    items: [
      {
        title: 'Profile',
        url: '/dashboard/profile',
        icon: 'userPen',
        shortcut: ['m', 'm']
      },
      {
        title: 'Settings',
        url: '/dashboard/settings',
        icon: 'settings',
        shortcut: ['s', 't']
      },
      {
        title: 'Logout',
        shortcut: ['l', 'o'],
        url: '/auth/logout',
        icon: 'logout'
      }
    ]
  }
];

export interface SaleUser {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}

export const recentSalesData: SaleUser[] = [
  {
    id: 1,
    name: 'Olivia Martin',
    email: 'olivia.martin@email.com',
    amount: '+$1,999.00',
    image: 'https://api.slingacademy.com/public/sample-users/1.png',
    initials: 'OM'
  },
  {
    id: 2,
    name: 'Jackson Lee',
    email: 'jackson.lee@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/2.png',
    initials: 'JL'
  },
  {
    id: 3,
    name: 'Isabella Nguyen',
    email: 'isabella.nguyen@email.com',
    amount: '+$299.00',
    image: 'https://api.slingacademy.com/public/sample-users/3.png',
    initials: 'IN'
  },
  {
    id: 4,
    name: 'William Kim',
    email: 'will@email.com',
    amount: '+$99.00',
    image: 'https://api.slingacademy.com/public/sample-users/4.png',
    initials: 'WK'
  },
  {
    id: 5,
    name: 'Sofia Davis',
    email: 'sofia.davis@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/5.png',
    initials: 'SD'
  }
];
