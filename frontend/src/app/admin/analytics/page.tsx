'use client';

import { useState } from 'react';

type DateRange = '7d' | '30d' | '90d' | '1y';

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analitik</h1>
          <p className="text-gray-500 mt-1">Detaylı istatistikler ve raporlar</p>
        </div>
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d', '1y'] as DateRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === range
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {range === '7d' ? 'Son 7 Gün' : range === '30d' ? 'Son 30 Gün' : range === '90d' ? 'Son 90 Gün' : 'Son 1 Yıl'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Toplam Ziyaret</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">45,280</p>
              <p className="text-sm text-green-600 mt-2">↑ 12.5% önceki döneme göre</p>
            </div>
            <div className="text-4xl">👁️</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Ortalama Oturum</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">12:45</p>
              <p className="text-sm text-green-600 mt-2">↑ 8.2% önceki döneme göre</p>
            </div>
            <div className="text-4xl">⏱️</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Dönüşüm Oranı</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">4.8%</p>
              <p className="text-sm text-green-600 mt-2">↑ 0.5% önceki döneme göre</p>
            </div>
            <div className="text-4xl">🎯</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Bounce Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">32.4%</p>
              <p className="text-sm text-red-600 mt-2">↓ 2.1% önceki döneme göre</p>
            </div>
            <div className="text-4xl">↩️</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* User Growth Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Kullanıcı Büyümesi</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-2">📈</div>
              <p>Kullanıcı büyüme grafiği</p>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Gelir Analizi</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-2">💰</div>
              <p>Gelir grafiği</p>
            </div>
          </div>
        </div>

        {/* Class Engagement */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ders Etkileşimi</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-2">🧘</div>
              <p>Ders etkileşim grafiği</p>
            </div>
          </div>
        </div>

        {/* User Retention */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Kullanıcı Tutma</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-2">🔄</div>
              <p>Retention grafiği</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Popular Classes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">En Popüler Dersler</h3>
          <div className="space-y-4">
            {[
              { name: 'Sabah Yogası', views: 12500, trend: '+15%' },
              { name: 'Vinyasa Flow', views: 8900, trend: '+8%' },
              { name: 'Yin Yoga', views: 7200, trend: '+12%' },
              { name: 'Power Yoga', views: 5600, trend: '+5%' },
              { name: 'Meditasyon', views: 4800, trend: '+22%' },
            ].map((cls, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center">
                  <span className="w-6 h-6 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded text-sm font-semibold mr-3">
                    {i + 1}
                  </span>
                  <span className="text-gray-900">{cls.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-500">{cls.views.toLocaleString()} görüntüleme</span>
                  <span className="text-green-600 text-sm">{cls.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Instructors */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">En Popüler Eğitmenler</h3>
          <div className="space-y-4">
            {[
              { name: 'Zeynep Aydın', students: 2450, rating: 4.9 },
              { name: 'Mehmet Kara', students: 1890, rating: 4.8 },
              { name: 'Ayşe Demir', students: 1560, rating: 4.9 },
              { name: 'Ali Yılmaz', students: 1200, rating: 4.7 },
              { name: 'Fatma Çelik', students: 980, rating: 4.8 },
            ].map((instructor, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold mr-3">
                    {instructor.name.charAt(0)}
                  </div>
                  <span className="text-gray-900">{instructor.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-500">{instructor.students.toLocaleString()} öğrenci</span>
                  <span className="flex items-center text-yellow-500">
                    ⭐ {instructor.rating}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
