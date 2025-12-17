'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getSession } from '@/lib/auth';

interface NavItem {
  name: string;
  href: string;
  icon: string;
  superAdminOnly?: boolean;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
  { name: 'Kullanicilar', href: '/admin/users', icon: '👥' },
  { name: 'Siniflar', href: '/admin/classes', icon: '🧘' },
  { name: 'Programlar', href: '/admin/programs', icon: '📚' },
  { name: 'Medya', href: '/admin/media', icon: '🖼️' },
  { name: 'Abonelikler', href: '/admin/subscriptions', icon: '💎' },
  { name: 'Kuponlar', href: '/admin/coupons', icon: '🎟️' },
  { name: 'Odemeler', href: '/admin/payments', icon: '💳' },
  { name: 'Analitik', href: '/admin/analytics', icon: '📈' },
  { name: 'Icerik', href: '/admin/content', icon: '📝' },
  { name: 'Webhooks', href: '/admin/webhooks', icon: '🔔' },
  { name: 'Entegrasyonlar', href: '/admin/integrations', icon: '🔗' },
  { name: 'Ayarlar', href: '/admin/settings', icon: '⚙️' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Admin User');
  const [userEmail, setUserEmail] = useState<string>('admin@yogaapp.com');

  useEffect(() => {
    const session = getSession();
    if (session) {
      setUserRole(session.role);
      setUserName(`${session.firstName || ''} ${session.lastName || ''}`.trim() || 'Admin User');
      setUserEmail(session.email);
    }
  }, []);

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter((item) => {
    if (item.superAdminOnly) {
      return userRole === 'SUPER_ADMIN';
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-indigo-700 transform transition-transform lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4">
          <span className="text-xl font-bold text-white">Admin Panel</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-white hover:text-gray-200"
          >
            ✕
          </button>
        </div>
        <nav className="mt-4 px-2">
          {filteredNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 mb-1 rounded-lg text-sm font-medium ${
                pathname.startsWith(item.href)
                  ? 'bg-indigo-800 text-white'
                  : 'text-indigo-100 hover:bg-indigo-600'
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
              {item.superAdminOnly && (
                <span className="ml-auto px-1.5 py-0.5 bg-red-500 text-white text-xs rounded">SA</span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-indigo-700 overflow-y-auto">
          <div className="flex items-center h-16 px-4">
            <span className="text-xl font-bold text-white">🧘 Yoga Admin</span>
          </div>
          <nav className="mt-4 flex-1 px-2">
            {filteredNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 mb-1 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith(item.href)
                    ? 'bg-indigo-800 text-white'
                    : 'text-indigo-100 hover:bg-indigo-600'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
                {item.superAdminOnly && (
                  <span className="ml-auto px-1.5 py-0.5 bg-red-500 text-white text-xs rounded">SA</span>
                )}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-indigo-600">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{userName}</p>
                <p className="text-xs text-indigo-200">{userEmail}</p>
                {userRole === 'SUPER_ADMIN' && (
                  <span className="inline-block mt-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded">
                    Super Admin
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center h-16 bg-white border-b border-gray-200 px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 lg:hidden"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1 flex justify-end items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-500">
              <span className="sr-only">Bildirimler</span>
              🔔
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-500">
              <span className="sr-only">Ayarlar</span>
              ⚙️
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
