'use client';

import { useState, useEffect } from 'react';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  totalRevenue: number;
  newUsersToday: number;
  activeClasses: number;
  completedClasses: number;
  upcomingBookings: number;
}

interface RecentActivity {
  id: string;
  type: 'user' | 'payment' | 'booking' | 'class';
  message: string;
  time: string;
}

const mockStats: DashboardStats = {
  totalUsers: 15420,
  activeUsers: 3250,
  premiumUsers: 2180,
  totalRevenue: 458000,
  newUsersToday: 48,
  activeClasses: 125,
  completedClasses: 8540,
  upcomingBookings: 340,
};

const mockActivities: RecentActivity[] = [
  { id: '1', type: 'user', message: 'Yeni kullanıcı kaydı: john@example.com', time: '2 dk önce' },
  { id: '2', type: 'payment', message: 'Premium abonelik satın alındı - ₺99.00', time: '5 dk önce' },
  { id: '3', type: 'booking', message: '"Sabah Yogası" dersi için 12 yeni rezervasyon', time: '15 dk önce' },
  { id: '4', type: 'class', message: 'Yeni ders eklendi: "İleri Vinyasa Flow"', time: '1 saat önce' },
  { id: '5', type: 'user', message: '5 kullanıcı premium\'a yükseldi', time: '2 saat önce' },
];

function StatCard({ title, value, icon, change, changeType }: {
  title: string;
  value: string | number;
  icon: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-2 ${
              changeType === 'positive' ? 'text-green-600' :
              changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
            }`}>
              {changeType === 'positive' ? '↑' : changeType === 'negative' ? '↓' : ''} {change}
            </p>
          )}
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

function ActivityItem({ activity }: { activity: RecentActivity }) {
  const icons = {
    user: '👤',
    payment: '💳',
    booking: '📅',
    class: '🧘',
  };

  return (
    <div className="flex items-start space-x-3 py-3 border-b border-gray-100 last:border-0">
      <div className="text-2xl">{icons[activity.type]}</div>
      <div className="flex-1">
        <p className="text-sm text-gray-900">{activity.message}</p>
        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>(mockStats);
  const [activities, setActivities] = useState<RecentActivity[]>(mockActivities);
  const [loading, setLoading] = useState(false);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Yoga App yönetim paneline hoş geldiniz</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Toplam Kullanıcı"
          value={stats.totalUsers.toLocaleString()}
          icon="👥"
          change="+12% bu ay"
          changeType="positive"
        />
        <StatCard
          title="Aktif Kullanıcı (Günlük)"
          value={stats.activeUsers.toLocaleString()}
          icon="📈"
          change="+5% dünden"
          changeType="positive"
        />
        <StatCard
          title="Premium Üyeler"
          value={stats.premiumUsers.toLocaleString()}
          icon="⭐"
          change="+8% bu ay"
          changeType="positive"
        />
        <StatCard
          title="Toplam Gelir"
          value={`₺${stats.totalRevenue.toLocaleString()}`}
          icon="💰"
          change="+15% bu ay"
          changeType="positive"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Bugün Kayıt"
          value={stats.newUsersToday}
          icon="🆕"
        />
        <StatCard
          title="Aktif Dersler"
          value={stats.activeClasses}
          icon="🧘"
        />
        <StatCard
          title="Tamamlanan Dersler"
          value={stats.completedClasses.toLocaleString()}
          icon="✅"
        />
        <StatCard
          title="Bekleyen Rezervasyon"
          value={stats.upcomingBookings}
          icon="📅"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Son Aktiviteler</h2>
            <button className="text-sm text-indigo-600 hover:text-indigo-700">
              Tümünü Gör
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hızlı İşlemler</h2>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors">
              <span className="flex items-center">
                <span className="mr-3">➕</span>
                Yeni Ders Ekle
              </span>
              <span>→</span>
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
              <span className="flex items-center">
                <span className="mr-3">📧</span>
                Toplu E-posta Gönder
              </span>
              <span>→</span>
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors">
              <span className="flex items-center">
                <span className="mr-3">📊</span>
                Rapor Oluştur
              </span>
              <span>→</span>
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors">
              <span className="flex items-center">
                <span className="mr-3">🔔</span>
                Push Bildirim Gönder
              </span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Kullanıcı Büyümesi</h2>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-gray-400">📈 Grafik burada görüntülenecek</p>
        </div>
      </div>
    </div>
  );
}
