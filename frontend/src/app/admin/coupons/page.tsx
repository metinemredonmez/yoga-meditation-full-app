'use client';

import { useState, useEffect } from 'react';
import { getSession } from '@/lib/auth';

// ============================================
// Types
// ============================================

type CouponType = 'PERCENTAGE' | 'FIXED';

interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  maxUses: number | null;
  maxUsesPerUser: number;
  currentUses: number;
  minPurchaseAmount: number | null;
  applicablePlans: string[];
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CouponUsage {
  id: string;
  couponId: string;
  userId: string;
  paymentId: string | null;
  discountAmount: number;
  createdAt: string;
  user?: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface CouponStats {
  totalCoupons: number;
  activeCoupons: number;
  expiredCoupons: number;
  totalUsages: number;
  totalDiscountGiven: number;
  averageDiscount: number;
  topCoupons: { code: string; uses: number; discount: number }[];
}

// ============================================
// Coupon Management Page
// ============================================

export default function CouponsPage() {
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'stats'>('list');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState<CouponStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');

  // Create/Edit form state
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'PERCENTAGE' as CouponType,
    value: 10,
    maxUses: '',
    maxUsesPerUser: 1,
    minPurchaseAmount: '',
    applicablePlans: [] as string[],
    startsAt: '',
    expiresAt: '',
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Coupon usage modal
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [couponUsages, setCouponUsages] = useState<CouponUsage[]>([]);
  const [showUsageModal, setShowUsageModal] = useState(false);

  useEffect(() => {
    const s = getSession();
    setSession(s);
    if (s) {
      fetchCoupons();
      fetchStats();
    }
  }, []);

  // ============================================
  // API Calls
  // ============================================

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/financial/coupons', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCoupons(data.coupons || []);
      }
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/financial/stats/coupons', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        // Generate mock stats based on coupons data
        setStats({
          totalCoupons: data.stats?.total || 0,
          activeCoupons: data.stats?.active || 0,
          expiredCoupons: 0,
          totalUsages: 0,
          totalDiscountGiven: 0,
          averageDiscount: 0,
          topCoupons: [],
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const createCoupon = async () => {
    try {
      setFormError('');
      setFormSuccess('');

      if (!formData.code.trim()) {
        setFormError('Kupon kodu zorunludur');
        return;
      }

      if (formData.value <= 0) {
        setFormError('Indirim degeri 0\'dan buyuk olmalidir');
        return;
      }

      if (formData.type === 'PERCENTAGE' && formData.value > 100) {
        setFormError('Yuzde indirimi 100\'den buyuk olamaz');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/financial/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: formData.code.toUpperCase(),
          discountType: formData.type,
          discountValue: formData.value,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
          maxUsesPerUser: formData.maxUsesPerUser,
          minPurchaseAmount: formData.minPurchaseAmount ? parseFloat(formData.minPurchaseAmount) : null,
          applicablePlans: formData.applicablePlans,
          startsAt: formData.startsAt || null,
          expiresAt: formData.expiresAt || null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setFormSuccess('Kupon basariyla olusturuldu');
        resetForm();
        fetchCoupons();
        fetchStats();
        setTimeout(() => setActiveTab('list'), 1500);
      } else {
        setFormError(data.error || 'Kupon olusturulamadi');
      }
    } catch (error) {
      setFormError('Bir hata olustu');
    }
  };

  const updateCoupon = async (couponId: string, updates: Partial<Coupon>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/financial/coupons/${couponId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      if (data.success) {
        fetchCoupons();
      }
    } catch (error) {
      console.error('Failed to update coupon:', error);
    }
  };

  const deleteCoupon = async (couponId: string) => {
    if (!confirm('Bu kuponu silmek istediginizden emin misiniz?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/financial/coupons/${couponId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        fetchCoupons();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to delete coupon:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'PERCENTAGE',
      value: 10,
      maxUses: '',
      maxUsesPerUser: 1,
      minPurchaseAmount: '',
      applicablePlans: [],
      startsAt: '',
      expiresAt: '',
    });
    setEditingCoupon(null);
    setFormError('');
    setFormSuccess('');
  };

  // ============================================
  // Helpers
  // ============================================

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const getCouponStatus = (coupon: Coupon): { label: string; color: string } => {
    if (!coupon.isActive) {
      return { label: 'Pasif', color: 'bg-gray-100 text-gray-800' };
    }

    const now = new Date();
    if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
      return { label: 'Suresi Dolmus', color: 'bg-red-100 text-red-800' };
    }

    if (coupon.startsAt && new Date(coupon.startsAt) > now) {
      return { label: 'Baslamadi', color: 'bg-yellow-100 text-yellow-800' };
    }

    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return { label: 'Limit Doldu', color: 'bg-orange-100 text-orange-800' };
    }

    return { label: 'Aktif', color: 'bg-green-100 text-green-800' };
  };

  const formatDiscount = (coupon: Coupon): string => {
    if (coupon.type === 'PERCENTAGE') {
      return `%${coupon.value}`;
    }
    return `${coupon.value.toFixed(2)} TL`;
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR');
  };

  // Filter coupons
  const filteredCoupons = coupons.filter((coupon) => {
    // Search filter
    if (search && !coupon.code.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }

    // Status filter
    const status = getCouponStatus(coupon);
    if (statusFilter === 'active' && status.label !== 'Aktif') return false;
    if (statusFilter === 'inactive' && coupon.isActive) return false;
    if (statusFilter === 'expired' && status.label !== 'Suresi Dolmus') return false;

    return true;
  });

  // ============================================
  // Render
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kupon Yonetimi</h1>
          <p className="text-gray-500 mt-1">Indirim kuponlarini yonetin ve takip edin</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setActiveTab('create');
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Yeni Kupon
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'list', label: 'Kuponlar', icon: '🎟️' },
            { id: 'create', label: 'Olustur', icon: '➕' },
            { id: 'stats', label: 'Istatistikler', icon: '📊' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Kupon kodu ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tum Durumlar</option>
              <option value="active">Aktif</option>
              <option value="inactive">Pasif</option>
              <option value="expired">Suresi Dolmus</option>
            </select>
          </div>

          {/* Coupons Table */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Yukleniyor...</p>
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <span className="text-4xl">🎟️</span>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Kupon bulunamadi</h3>
              <p className="mt-1 text-gray-500">Henuz kupon olusturulmamiş veya filtreye uyan sonuc yok.</p>
              <button
                onClick={() => setActiveTab('create')}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Ilk Kuponu Olustur
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kupon Kodu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Indirim
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kullanim
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gecerlilik
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Islemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCoupons.map((coupon) => {
                    const status = getCouponStatus(coupon);
                    return (
                      <tr key={coupon.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">🎟️</span>
                            <div>
                              <div className="font-mono font-bold text-gray-900">{coupon.code}</div>
                              <div className="text-xs text-gray-500">
                                Olusturulma: {formatDate(coupon.createdAt)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-semibold text-indigo-600">
                            {formatDiscount(coupon)}
                          </span>
                          <div className="text-xs text-gray-500">
                            {coupon.type === 'PERCENTAGE' ? 'Yuzde' : 'Sabit'} indirim
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {coupon.currentUses} / {coupon.maxUses || '∞'}
                          </div>
                          {coupon.maxUses && (
                            <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                              <div
                                className="bg-indigo-600 h-1.5 rounded-full"
                                style={{
                                  width: `${Math.min((coupon.currentUses / coupon.maxUses) * 100, 100)}%`,
                                }}
                              />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>Baslangic: {formatDate(coupon.startsAt)}</div>
                          <div>Bitis: {formatDate(coupon.expiresAt)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => updateCoupon(coupon.id, { isActive: !coupon.isActive })}
                              className={`px-3 py-1 rounded text-xs font-medium ${
                                coupon.isActive
                                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                  : 'bg-green-100 text-green-800 hover:bg-green-200'
                              }`}
                            >
                              {coupon.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(coupon.code);
                                alert('Kupon kodu kopyalandi!');
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Kopyala"
                            >
                              📋
                            </button>
                            <button
                              onClick={() => deleteCoupon(coupon.id)}
                              className="p-1 text-red-400 hover:text-red-600"
                              title="Sil"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'create' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              {editingCoupon ? 'Kuponu Duzenle' : 'Yeni Kupon Olustur'}
            </h2>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                {formSuccess}
              </div>
            )}

            <div className="space-y-4">
              {/* Coupon Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kupon Kodu *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="YILBASI2024"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono uppercase"
                  />
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Rastgele
                  </button>
                </div>
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Indirim Tipi
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as CouponType })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="PERCENTAGE">Yuzde (%)</option>
                    <option value="FIXED">Sabit Tutar (TL)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Indirim Degeri *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                      min="0"
                      max={formData.type === 'PERCENTAGE' ? 100 : undefined}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {formData.type === 'PERCENTAGE' ? '%' : 'TL'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Usage Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maksimum Kullanim (Toplam)
                  </label>
                  <input
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                    placeholder="Sinirsiz"
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kullanici Basina Limit
                  </label>
                  <input
                    type="number"
                    value={formData.maxUsesPerUser}
                    onChange={(e) => setFormData({ ...formData, maxUsesPerUser: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Minimum Purchase */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Satin Alma Tutari (TL)
                </label>
                <input
                  type="number"
                  value={formData.minPurchaseAmount}
                  onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
                  placeholder="Yok"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Baslangic Tarihi
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startsAt}
                    onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bitis Tarihi
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Applicable Plans */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Uygulanabilir Paketler
                </label>
                <div className="flex flex-wrap gap-2">
                  {['BASIC', 'PREMIUM', 'ENTERPRISE'].map((plan) => (
                    <label
                      key={plan}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer ${
                        formData.applicablePlans.includes(plan)
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.applicablePlans.includes(plan)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              applicablePlans: [...formData.applicablePlans, plan],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              applicablePlans: formData.applicablePlans.filter((p) => p !== plan),
                            });
                          }
                        }}
                        className="sr-only"
                      />
                      {plan}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Secim yapilmazsa tum paketlerde gecerli olur
                </p>
              </div>

              {/* Preview */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Onizleme</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center text-3xl">
                      🎟️
                    </div>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-lg text-gray-900">
                      {formData.code || 'KUPONKODU'}
                    </div>
                    <div className="text-indigo-600 font-semibold">
                      {formData.type === 'PERCENTAGE' ? `%${formData.value}` : `${formData.value} TL`} indirim
                    </div>
                    {formData.minPurchaseAmount && (
                      <div className="text-xs text-gray-500">
                        Min. {formData.minPurchaseAmount} TL alisveris
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setActiveTab('list');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Iptal
                </button>
                <button
                  type="button"
                  onClick={createCoupon}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editingCoupon ? 'Guncelle' : 'Olustur'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-indigo-100">
                  <span className="text-2xl">🎟️</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Toplam Kupon</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalCoupons || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Aktif Kupon</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.activeCoupons || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Toplam Kullanim</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalUsages || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <span className="text-2xl">💰</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Toplam Indirim</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(stats?.totalDiscountGiven || 0).toFixed(2)} TL
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hizli Islemler</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => {
                  setFormData({
                    ...formData,
                    code: 'HOSGELDIN',
                    type: 'PERCENTAGE',
                    value: 20,
                    maxUsesPerUser: 1,
                  });
                  setActiveTab('create');
                }}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <span className="text-2xl mb-2 block">👋</span>
                <h4 className="font-medium text-gray-900">Hosgeldin Kuponu</h4>
                <p className="text-sm text-gray-500">Yeni kullanicilar icin %20 indirim</p>
              </button>

              <button
                onClick={() => {
                  setFormData({
                    ...formData,
                    code: 'YILBASI2024',
                    type: 'PERCENTAGE',
                    value: 30,
                    expiresAt: new Date(new Date().getFullYear(), 11, 31, 23, 59).toISOString().slice(0, 16),
                  });
                  setActiveTab('create');
                }}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <span className="text-2xl mb-2 block">🎄</span>
                <h4 className="font-medium text-gray-900">Sezon Kuponu</h4>
                <p className="text-sm text-gray-500">Ozel gun/sezon indirimi</p>
              </button>

              <button
                onClick={() => {
                  setFormData({
                    ...formData,
                    code: 'VIP50',
                    type: 'FIXED',
                    value: 50,
                    maxUses: '100',
                  });
                  setActiveTab('create');
                }}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <span className="text-2xl mb-2 block">⭐</span>
                <h4 className="font-medium text-gray-900">VIP Kuponu</h4>
                <p className="text-sm text-gray-500">Sinirli sayida 50 TL indirim</p>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Son Kullanim Aktivitesi</h3>
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-2 block">📋</span>
              <p>Henuz kupon kullanim aktivitesi yok</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
