'use client';

import { useState } from 'react';

interface Payment {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  currency: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED';
  provider: 'STRIPE' | 'IYZICO';
  productName: string;
  createdAt: string;
}

const mockPayments: Payment[] = [
  { id: 'pay_1', userId: 'u1', userEmail: 'john@example.com', userName: 'John Doe', amount: 99.00, currency: 'TRY', status: 'COMPLETED', provider: 'STRIPE', productName: 'Premium Aylık', createdAt: '2024-12-17T10:30:00' },
  { id: 'pay_2', userId: 'u2', userEmail: 'jane@example.com', userName: 'Jane Smith', amount: 499.00, currency: 'TRY', status: 'COMPLETED', provider: 'IYZICO', productName: 'VIP Yıllık', createdAt: '2024-12-17T09:15:00' },
  { id: 'pay_3', userId: 'u3', userEmail: 'ali@example.com', userName: 'Ali Yılmaz', amount: 49.00, currency: 'TRY', status: 'PENDING', provider: 'STRIPE', productName: 'Basic Aylık', createdAt: '2024-12-17T08:45:00' },
  { id: 'pay_4', userId: 'u4', userEmail: 'ayse@example.com', userName: 'Ayşe Demir', amount: 99.00, currency: 'TRY', status: 'FAILED', provider: 'IYZICO', productName: 'Premium Aylık', createdAt: '2024-12-16T22:30:00' },
  { id: 'pay_5', userId: 'u5', userEmail: 'mehmet@example.com', userName: 'Mehmet Kaya', amount: 99.00, currency: 'TRY', status: 'REFUNDED', provider: 'STRIPE', productName: 'Premium Aylık', createdAt: '2024-12-16T18:00:00' },
];

const statusColors = {
  COMPLETED: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  FAILED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-gray-100 text-gray-700',
};

const statusLabels = {
  COMPLETED: 'Tamamlandı',
  PENDING: 'Bekliyor',
  FAILED: 'Başarısız',
  REFUNDED: 'İade Edildi',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterProvider, setFilterProvider] = useState<string>('all');

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    const matchesProvider = filterProvider === 'all' || payment.provider === filterProvider;
    return matchesSearch && matchesStatus && matchesProvider;
  });

  const totalRevenue = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);

  const todayRevenue = payments
    .filter(p => p.status === 'COMPLETED' && p.createdAt.startsWith('2024-12-17'))
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ödemeler</h1>
          <p className="text-gray-500 mt-1">Tüm ödeme işlemlerini görüntüleyin</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          📊 Rapor İndir
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Toplam Gelir</p>
          <p className="text-2xl font-bold text-green-600">₺{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Bugünkü Gelir</p>
          <p className="text-2xl font-bold text-indigo-600">₺{todayRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Başarılı İşlem</p>
          <p className="text-2xl font-bold text-gray-900">
            {payments.filter(p => p.status === 'COMPLETED').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Başarısız</p>
          <p className="text-2xl font-bold text-red-600">
            {payments.filter(p => p.status === 'FAILED').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="İşlem ID, e-posta veya isim ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="COMPLETED">Tamamlandı</option>
            <option value="PENDING">Bekliyor</option>
            <option value="FAILED">Başarısız</option>
            <option value="REFUNDED">İade Edildi</option>
          </select>
          <select
            value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tüm Sağlayıcılar</option>
            <option value="STRIPE">Stripe</option>
            <option value="IYZICO">Iyzico</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlem ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kullanıcı
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ürün
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tutar
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sağlayıcı
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono text-gray-900">
                    {payment.id}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{payment.userName}</div>
                    <div className="text-sm text-gray-500">{payment.userEmail}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {payment.productName}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    ₺{payment.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                      payment.provider === 'STRIPE' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {payment.provider}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[payment.status]}`}>
                      {statusLabels[payment.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(payment.createdAt).toLocaleString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                      Detay
                    </button>
                    {payment.status === 'COMPLETED' && (
                      <button className="text-red-600 hover:text-red-900">
                        İade
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {filteredPayments.length} işlem gösteriliyor
          </p>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50">
              Önceki
            </button>
            <button className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">1</button>
            <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50">
              Sonraki
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
