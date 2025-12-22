'use client';

import { useState, useEffect } from 'react';
import { getAdminUsers, adminGrantSubscription, adminRevokeSubscription } from '@/lib/api';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  subscriptionTier: 'FREE' | 'PREMIUM' | 'FAMILY' | null;
  subscriptionExpiresAt: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  activeSubscription: {
    id: string;
    provider: string;
    isManual: boolean;
    grantedAt: string | null;
    grantReason: string | null;
    currentPeriodEnd: string | null;
    plan: {
      tier: string;
      name: string;
    };
  } | null;
}

const tierColors: Record<string, string> = {
  FREE: 'bg-gray-100 text-gray-700',
  PREMIUM: 'bg-purple-100 text-purple-700',
  FAMILY: 'bg-yellow-100 text-yellow-700',
};

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700',
  ADMIN: 'bg-orange-100 text-orange-700',
  INSTRUCTOR: 'bg-blue-100 text-blue-700',
  STUDENT: 'bg-green-100 text-green-700',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal state
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [subscriptionForm, setSubscriptionForm] = useState({
    tier: 'PREMIUM' as 'FREE' | 'PREMIUM' | 'FAMILY',
    durationMonths: 12,
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = {
        page: currentPage,
        limit: 20,
      };
      if (filterTier !== 'all') params.tier = filterTier;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (searchTerm) params.search = searchTerm;

      const response = await getAdminUsers(params);
      setUsers(response.users || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotal(response.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Kullanicilar yuklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, filterTier, filterStatus]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const openSubscriptionModal = (user: User) => {
    setSelectedUser(user);
    setSubscriptionForm({
      tier: 'PREMIUM',
      durationMonths: 12,
      reason: '',
    });
    setShowSubscriptionModal(true);
  };

  const handleGrantSubscription = async () => {
    if (!selectedUser) return;

    try {
      setSubmitting(true);
      await adminGrantSubscription({
        userId: selectedUser.id,
        tier: subscriptionForm.tier,
        durationMonths: subscriptionForm.durationMonths,
        reason: subscriptionForm.reason || undefined,
      });
      toast.success(`${selectedUser.firstName} ${selectedUser.lastName} kullanicisina ${subscriptionForm.tier} abonelik verildi`);
      setShowSubscriptionModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Grant subscription error:', error);
      toast.error('Abonelik verilemedi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeSubscription = async (user: User) => {
    if (!confirm(`${user.firstName} ${user.lastName} kullanicisinin aboneligini iptal etmek istediginize emin misiniz?`)) {
      return;
    }

    try {
      await adminRevokeSubscription({
        userId: user.id,
        reason: 'Admin tarafindan iptal edildi',
      });
      toast.success('Abonelik iptal edildi');
      fetchUsers();
    } catch (error) {
      console.error('Revoke subscription error:', error);
      toast.error('Abonelik iptal edilemedi');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kullanicilar</h1>
          <p className="text-gray-500 mt-1">Tum kullanicilari yonetin ({total} kullanici)</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          + Kullanici Ekle
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Isim veya e-posta ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterTier}
            onChange={(e) => {
              setFilterTier(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tum Planlar</option>
            <option value="FREE">Free</option>
            <option value="PREMIUM">Premium</option>
            <option value="FAMILY">Family</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tum Durumlar</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Pasif</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-indigo-50 rounded-xl p-4 mb-6 flex items-center justify-between">
          <span className="text-indigo-700">{selectedUsers.length} kullanici secildi</span>
          <div className="space-x-2">
            <button className="px-3 py-1 bg-white text-indigo-600 rounded border border-indigo-200 hover:bg-indigo-50">
              E-posta Gonder
            </button>
            <button className="px-3 py-1 bg-white text-red-600 rounded border border-red-200 hover:bg-red-50">
              Askiya Al
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kullanici
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Abonelik
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bitis Tarihi
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Son Giris
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Islemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleSelectUser(user.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                          {user.firstName?.[0] || ''}{user.lastName?.[0] || ''}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleColors[user.role] || 'bg-gray-100 text-gray-700'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${tierColors[user.subscriptionTier || 'FREE']}`}>
                          {user.subscriptionTier || 'FREE'}
                        </span>
                        {user.activeSubscription?.isManual && (
                          <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                            Manuel
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(user.subscriptionExpiresAt || user.activeSubscription?.currentPeriodEnd || null)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(user.lastLoginAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.subscriptionTier === 'FREE' || !user.subscriptionTier ? (
                          <button
                            onClick={() => openSubscriptionModal(user)}
                            className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
                          >
                            Premium Yap
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRevokeSubscription(user)}
                            className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200 transition-colors"
                          >
                            Iptal Et
                          </button>
                        )}
                        <button className="text-indigo-600 hover:text-indigo-900 text-sm">
                          Duzenle
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Sayfa {currentPage} / {totalPages} ({total} kullanici)
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Onceki
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded text-sm ${
                    currentPage === page
                      ? 'bg-indigo-600 text-white'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sonraki
            </button>
          </div>
        </div>
      </div>

      {/* Subscription Modal */}
      {showSubscriptionModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Abonelik Ver
            </h2>
            <p className="text-gray-600 mb-6">
              <strong>{selectedUser.firstName} {selectedUser.lastName}</strong> kullanicisina abonelik verin
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Abonelik Tipi
                </label>
                <select
                  value={subscriptionForm.tier}
                  onChange={(e) => setSubscriptionForm(f => ({ ...f, tier: e.target.value as 'FREE' | 'PREMIUM' | 'FAMILY' }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="PREMIUM">Premium</option>
                  <option value="FAMILY">Family</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sure (Ay)
                </label>
                <select
                  value={subscriptionForm.durationMonths}
                  onChange={(e) => setSubscriptionForm(f => ({ ...f, durationMonths: Number(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={1}>1 Ay</option>
                  <option value={3}>3 Ay</option>
                  <option value={6}>6 Ay</option>
                  <option value={12}>12 Ay (1 Yil)</option>
                  <option value={24}>24 Ay (2 Yil)</option>
                  <option value={36}>36 Ay (3 Yil)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sebep (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={subscriptionForm.reason}
                  onChange={(e) => setSubscriptionForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Ornek: VIP kullanici, Test hesabi, Ozel indirim..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Iptal
              </button>
              <button
                onClick={handleGrantSubscription}
                disabled={submitting}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {submitting ? 'Veriliyor...' : 'Abonelik Ver'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
