'use client';

import { useState } from 'react';

type ContentType = 'pages' | 'banners' | 'faqs' | 'announcements';

interface Page {
  id: string;
  title: string;
  slug: string;
  status: 'published' | 'draft';
  updatedAt: string;
}

interface Banner {
  id: string;
  title: string;
  position: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

interface FAQ {
  id: string;
  question: string;
  category: string;
  order: number;
}

const mockPages: Page[] = [
  { id: '1', title: 'Hakkımızda', slug: 'about', status: 'published', updatedAt: '2024-12-15' },
  { id: '2', title: 'Gizlilik Politikası', slug: 'privacy', status: 'published', updatedAt: '2024-12-10' },
  { id: '3', title: 'Kullanım Şartları', slug: 'terms', status: 'published', updatedAt: '2024-12-08' },
  { id: '4', title: 'İletişim', slug: 'contact', status: 'published', updatedAt: '2024-12-05' },
  { id: '5', title: 'Yeni Özellikler', slug: 'features', status: 'draft', updatedAt: '2024-12-17' },
];

const mockBanners: Banner[] = [
  { id: '1', title: 'Yılbaşı İndirimi', position: 'Ana Sayfa', isActive: true, startDate: '2024-12-20', endDate: '2025-01-05' },
  { id: '2', title: 'Yeni Program Duyurusu', position: 'Dashboard', isActive: true, startDate: '2024-12-15', endDate: '2024-12-31' },
  { id: '3', title: 'Premium Kampanya', position: 'Sidebar', isActive: false, startDate: '2024-11-01', endDate: '2024-11-30' },
];

const mockFAQs: FAQ[] = [
  { id: '1', question: 'Aboneliğimi nasıl iptal edebilirim?', category: 'Ödeme', order: 1 },
  { id: '2', question: 'Dersleri offline izleyebilir miyim?', category: 'Özellikler', order: 2 },
  { id: '3', question: 'Premium üyelik avantajları nelerdir?', category: 'Üyelik', order: 3 },
  { id: '4', question: 'Eğitmen nasıl olabilirim?', category: 'Eğitmenler', order: 4 },
];

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState<ContentType>('pages');

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">İçerik Yönetimi</h1>
          <p className="text-gray-500 mt-1">Sayfa, banner ve içerikleri yönetin</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'pages' as ContentType, label: 'Sayfalar', icon: '📄' },
          { id: 'banners' as ContentType, label: 'Bannerlar', icon: '🖼️' },
          { id: 'faqs' as ContentType, label: 'SSS', icon: '❓' },
          { id: 'announcements' as ContentType, label: 'Duyurular', icon: '📢' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Pages Tab */}
      {activeTab === 'pages' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Sayfalar</h2>
            <button className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
              + Yeni Sayfa
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {mockPages.map((page) => (
              <div key={page.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{page.title}</span>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                      page.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {page.status === 'published' ? 'Yayında' : 'Taslak'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">/{page.slug}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">{page.updatedAt}</span>
                  <button className="text-indigo-600 hover:text-indigo-900 text-sm">Düzenle</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Banners Tab */}
      {activeTab === 'banners' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Bannerlar</h2>
            <button className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
              + Yeni Banner
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {mockBanners.map((banner) => (
              <div key={banner.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{banner.title}</span>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                      banner.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {banner.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{banner.position} • {banner.startDate} - {banner.endDate}</p>
                </div>
                <div className="flex items-center gap-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={banner.isActive} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                  <button className="text-indigo-600 hover:text-indigo-900 text-sm">Düzenle</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQs Tab */}
      {activeTab === 'faqs' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Sıkça Sorulan Sorular</h2>
            <button className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
              + Yeni Soru
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {mockFAQs.map((faq) => (
              <div key={faq.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded text-gray-500 text-sm font-medium">
                    {faq.order}
                  </span>
                  <div>
                    <span className="font-medium text-gray-900">{faq.question}</span>
                    <span className="ml-2 inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                      {faq.category}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1 text-gray-400 hover:text-gray-600">↑</button>
                  <button className="p-1 text-gray-400 hover:text-gray-600">↓</button>
                  <button className="text-indigo-600 hover:text-indigo-900 text-sm ml-2">Düzenle</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Duyurular</h2>
            <button className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
              + Yeni Duyuru
            </button>
          </div>
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-4">📢</div>
            <p>Henüz duyuru yok</p>
            <p className="text-sm mt-2">Yeni bir duyuru oluşturmak için butona tıklayın</p>
          </div>
        </div>
      )}
    </div>
  );
}
