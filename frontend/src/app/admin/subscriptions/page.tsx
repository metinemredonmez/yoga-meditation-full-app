'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';

type SubscriptionTier = 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
type SubscriptionStatus = 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED' | 'PAUSED' | 'GRACE_PERIOD';
type SubscriptionInterval = 'MONTHLY' | 'YEARLY';
type PaymentProvider = 'STRIPE' | 'IYZICO' | 'APPLE' | 'GOOGLE';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  tier: SubscriptionTier;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  features: string[];
  isActive: boolean;
  trialDays: number;
  maxDevices: number;
  offlineDownloads: boolean;
  sortOrder: number;
  stripePriceIdMonthly: string | null;
  stripePriceIdYearly: string | null;
  appleProductIdMonthly: string | null;
  appleProductIdYearly: string | null;
  googleProductIdMonthly: string | null;
  googleProductIdYearly: string | null;
  _count?: { subscriptions: number };
}

interface Subscription {
  id: string;
  userId: string;
  planId: string;
  provider: PaymentProvider;
  status: SubscriptionStatus;
  interval: SubscriptionInterval;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  autoRenew: boolean;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  plan: {
    id: string;
    name: string;
    tier: SubscriptionTier;
  };
}

interface SubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialingSubscriptions: number;
  cancelledThisMonth: number;
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  churnRate: number;
  conversionRate: number;
  byTier: Record<SubscriptionTier, number>;
  byProvider: Record<PaymentProvider, number>;
}

const tierConfig: Record<SubscriptionTier, { label: string; color: string; bgColor: string }> = {
  FREE: { label: 'Ucretsiz', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  BASIC: { label: 'Temel', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  PREMIUM: { label: 'Premium', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  ENTERPRISE: { label: 'Kurumsal', color: 'text-amber-700', bgColor: 'bg-amber-100' },
};

const statusConfig: Record<SubscriptionStatus, { label: string; color: string; bgColor: string }> = {
  ACTIVE: { label: 'Aktif', color: 'text-green-700', bgColor: 'bg-green-100' },
  TRIALING: { label: 'Deneme', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  PAST_DUE: { label: 'Odeme Gecikti', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  CANCELLED: { label: 'Iptal', color: 'text-red-700', bgColor: 'bg-red-100' },
  EXPIRED: { label: 'Suresi Doldu', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  PAUSED: { label: 'Duraklatildi', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  GRACE_PERIOD: { label: 'Ek Sure', color: 'text-amber-700', bgColor: 'bg-amber-100' },
};

const providerConfig: Record<PaymentProvider, { label: string; icon: string }> = {
  STRIPE: { label: 'Stripe', icon: '💳' },
  IYZICO: { label: 'Iyzico', icon: '🇹🇷' },
  APPLE: { label: 'Apple', icon: '🍎' },
  GOOGLE: { label: 'Google', icon: '🤖' },
};

export default function SubscriptionsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'plans' | 'subscriptions' | 'stats'>('plans');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');

  // Plan modal
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    tier: 'BASIC' as SubscriptionTier,
    priceMonthly: 0,
    priceYearly: 0,
    currency: 'TRY',
    features: [''],
    trialDays: 7,
    maxDevices: 1,
    offlineDownloads: false,
    sortOrder: 0,
  });

  // Grant subscription modal
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantForm, setGrantForm] = useState({
    userId: '',
    planId: '',
    durationDays: 30,
    reason: '',
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'all'>('all');
  const [tierFilter, setTierFilter] = useState<SubscriptionTier | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkAccess();
    loadData();
  }, []);

  const checkAccess = () => {
    const session = getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.role)) {
      router.push('/dashboard');
      return;
    }
    setUserRole(session.role);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API calls
      // Mock data for now
      setPlans([
        {
          id: '1',
          name: 'Ucretsiz',
          description: 'Temel ozellikler',
          tier: 'FREE',
          priceMonthly: 0,
          priceYearly: 0,
          currency: 'TRY',
          features: ['5 ders/ay', 'Temel pozlar', 'Topluluk erisimi'],
          isActive: true,
          trialDays: 0,
          maxDevices: 1,
          offlineDownloads: false,
          sortOrder: 0,
          stripePriceIdMonthly: null,
          stripePriceIdYearly: null,
          appleProductIdMonthly: null,
          appleProductIdYearly: null,
          googleProductIdMonthly: null,
          googleProductIdYearly: null,
          _count: { subscriptions: 1250 },
        },
        {
          id: '2',
          name: 'Temel',
          description: 'Bireysel kullanici icin ideal',
          tier: 'BASIC',
          priceMonthly: 49.99,
          priceYearly: 479.99,
          currency: 'TRY',
          features: ['Sinirsiz ders', 'Tum pozlar', 'Canli dersler', '1 cihaz'],
          isActive: true,
          trialDays: 7,
          maxDevices: 1,
          offlineDownloads: false,
          sortOrder: 1,
          stripePriceIdMonthly: 'price_basic_monthly',
          stripePriceIdYearly: 'price_basic_yearly',
          appleProductIdMonthly: 'com.yogaapp.basic.monthly',
          appleProductIdYearly: 'com.yogaapp.basic.yearly',
          googleProductIdMonthly: 'basic_monthly',
          googleProductIdYearly: 'basic_yearly',
          _count: { subscriptions: 542 },
        },
        {
          id: '3',
          name: 'Premium',
          description: 'En populer secim',
          tier: 'PREMIUM',
          priceMonthly: 99.99,
          priceYearly: 899.99,
          currency: 'TRY',
          features: ['Sinirsiz ders', 'Tum pozlar', 'Canli dersler', '3 cihaz', 'Offline indirme', 'Ozel programlar'],
          isActive: true,
          trialDays: 14,
          maxDevices: 3,
          offlineDownloads: true,
          sortOrder: 2,
          stripePriceIdMonthly: 'price_premium_monthly',
          stripePriceIdYearly: 'price_premium_yearly',
          appleProductIdMonthly: 'com.yogaapp.premium.monthly',
          appleProductIdYearly: 'com.yogaapp.premium.yearly',
          googleProductIdMonthly: 'premium_monthly',
          googleProductIdYearly: 'premium_yearly',
          _count: { subscriptions: 328 },
        },
        {
          id: '4',
          name: 'Kurumsal',
          description: 'Sirketler ve studyolar icin',
          tier: 'ENTERPRISE',
          priceMonthly: 299.99,
          priceYearly: 2699.99,
          currency: 'TRY',
          features: ['Sinirsiz ders', 'Tum pozlar', 'Canli dersler', 'Sinirsiz cihaz', 'Offline indirme', 'Ozel programlar', 'API erisimi', 'Oncelikli destek'],
          isActive: true,
          trialDays: 30,
          maxDevices: 99,
          offlineDownloads: true,
          sortOrder: 3,
          stripePriceIdMonthly: 'price_enterprise_monthly',
          stripePriceIdYearly: 'price_enterprise_yearly',
          appleProductIdMonthly: null,
          appleProductIdYearly: null,
          googleProductIdMonthly: null,
          googleProductIdYearly: null,
          _count: { subscriptions: 45 },
        },
      ]);

      setSubscriptions([
        {
          id: 'sub1',
          userId: 'user1',
          planId: '3',
          provider: 'STRIPE',
          status: 'ACTIVE',
          interval: 'MONTHLY',
          currentPeriodStart: '2024-11-15T00:00:00Z',
          currentPeriodEnd: '2024-12-15T00:00:00Z',
          cancelAtPeriodEnd: false,
          autoRenew: true,
          createdAt: '2024-01-15T00:00:00Z',
          user: { id: 'user1', email: 'ahmet@example.com', firstName: 'Ahmet', lastName: 'Yilmaz' },
          plan: { id: '3', name: 'Premium', tier: 'PREMIUM' },
        },
        {
          id: 'sub2',
          userId: 'user2',
          planId: '2',
          provider: 'APPLE',
          status: 'TRIALING',
          interval: 'YEARLY',
          currentPeriodStart: '2024-12-01T00:00:00Z',
          currentPeriodEnd: '2024-12-08T00:00:00Z',
          cancelAtPeriodEnd: false,
          autoRenew: true,
          createdAt: '2024-12-01T00:00:00Z',
          user: { id: 'user2', email: 'ayse@example.com', firstName: 'Ayse', lastName: 'Demir' },
          plan: { id: '2', name: 'Temel', tier: 'BASIC' },
        },
        {
          id: 'sub3',
          userId: 'user3',
          planId: '3',
          provider: 'IYZICO',
          status: 'PAST_DUE',
          interval: 'MONTHLY',
          currentPeriodStart: '2024-11-01T00:00:00Z',
          currentPeriodEnd: '2024-12-01T00:00:00Z',
          cancelAtPeriodEnd: false,
          autoRenew: true,
          createdAt: '2024-06-15T00:00:00Z',
          user: { id: 'user3', email: 'mehmet@example.com', firstName: 'Mehmet', lastName: 'Kaya' },
          plan: { id: '3', name: 'Premium', tier: 'PREMIUM' },
        },
      ]);

      setStats({
        totalSubscriptions: 2165,
        activeSubscriptions: 870,
        trialingSubscriptions: 156,
        cancelledThisMonth: 23,
        mrr: 72450.50,
        arr: 869406.00,
        churnRate: 2.6,
        conversionRate: 68.5,
        byTier: { FREE: 1250, BASIC: 542, PREMIUM: 328, ENTERPRISE: 45 },
        byProvider: { STRIPE: 580, IYZICO: 420, APPLE: 125, GOOGLE: 90 },
      });

    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async () => {
    try {
      // TODO: API call to save plan
      console.log('Saving plan:', planForm);
      setShowPlanModal(false);
      loadData();
    } catch (error) {
      console.error('Failed to save plan:', error);
    }
  };

  const handleGrantSubscription = async () => {
    try {
      // TODO: API call to grant subscription
      console.log('Granting subscription:', grantForm);
      setShowGrantModal(false);
      loadData();
    } catch (error) {
      console.error('Failed to grant subscription:', error);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Bu aboneligi iptal etmek istediginize emin misiniz?')) return;
    try {
      // TODO: API call
      console.log('Cancelling:', subscriptionId);
      loadData();
    } catch (error) {
      console.error('Failed to cancel:', error);
    }
  };

  const handleExtendSubscription = async (subscriptionId: string) => {
    const days = prompt('Kac gun uzatmak istiyorsunuz?', '30');
    if (!days) return;
    try {
      // TODO: API call
      console.log('Extending:', subscriptionId, days);
      loadData();
    } catch (error) {
      console.error('Failed to extend:', error);
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (statusFilter !== 'all' && sub.status !== statusFilter) return false;
    if (tierFilter !== 'all' && sub.plan.tier !== tierFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const userName = `${sub.user.firstName || ''} ${sub.user.lastName || ''}`.toLowerCase();
      if (!userName.includes(query) && !sub.user.email.toLowerCase().includes(query)) {
        return false;
      }
    }
    return true;
  });

  const formatCurrency = (amount: number, currency: string = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Abonelik Yonetimi</h1>
          <p className="text-gray-600 mt-1">Paketleri ve abonelikleri yonetin</p>
        </div>
        <div className="flex gap-3">
          {userRole === 'SUPER_ADMIN' && (
            <button
              onClick={() => {
                setEditingPlan(null);
                setPlanForm({
                  name: '',
                  description: '',
                  tier: 'BASIC',
                  priceMonthly: 0,
                  priceYearly: 0,
                  currency: 'TRY',
                  features: [''],
                  trialDays: 7,
                  maxDevices: 1,
                  offlineDownloads: false,
                  sortOrder: 0,
                });
                setShowPlanModal(true);
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Yeni Paket
            </button>
          )}
          <button
            onClick={() => setShowGrantModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
            Abonelik Ver
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { id: 'plans', label: 'Paketler', icon: '📦' },
          { id: 'subscriptions', label: 'Abonelikler', icon: '👥' },
          { id: 'stats', label: 'Istatistikler', icon: '📊' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const tier = tierConfig[plan.tier];
            return (
              <div
                key={plan.id}
                className={`bg-white rounded-xl border-2 overflow-hidden ${
                  plan.tier === 'PREMIUM' ? 'border-purple-300 ring-2 ring-purple-100' : 'border-gray-200'
                }`}
              >
                {plan.tier === 'PREMIUM' && (
                  <div className="bg-purple-600 text-white text-center py-1 text-xs font-medium">
                    En Populer
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${tier.bgColor} ${tier.color}`}>
                        {tier.label}
                      </span>
                    </div>
                    {!plan.isActive && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">Pasif</span>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="text-3xl font-bold text-gray-900">
                      {formatCurrency(plan.priceMonthly, plan.currency)}
                      <span className="text-sm font-normal text-gray-500">/ay</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      veya {formatCurrency(plan.priceYearly, plan.currency)}/yil
                    </div>
                  </div>

                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4 border-t border-gray-100 space-y-2 text-sm text-gray-500">
                    <div className="flex justify-between">
                      <span>Deneme suresi:</span>
                      <span className="font-medium text-gray-900">{plan.trialDays} gun</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Maks cihaz:</span>
                      <span className="font-medium text-gray-900">{plan.maxDevices}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Abone sayisi:</span>
                      <span className="font-medium text-gray-900">{plan._count?.subscriptions || 0}</span>
                    </div>
                  </div>

                  {userRole === 'SUPER_ADMIN' && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                      <button
                        onClick={() => {
                          setEditingPlan(plan);
                          setPlanForm({
                            name: plan.name,
                            description: plan.description || '',
                            tier: plan.tier,
                            priceMonthly: plan.priceMonthly,
                            priceYearly: plan.priceYearly,
                            currency: plan.currency,
                            features: plan.features.length > 0 ? plan.features : [''],
                            trialDays: plan.trialDays,
                            maxDevices: plan.maxDevices,
                            offlineDownloads: plan.offlineDownloads,
                            sortOrder: plan.sortOrder,
                          });
                          setShowPlanModal(true);
                        }}
                        className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Duzenle
                      </button>
                      <button
                        className="px-3 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                        title="Stripe ile senkronize et"
                      >
                        Sync
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <input
              type="text"
              placeholder="Kullanici ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SubscriptionStatus | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Tum Durumlar</option>
              {Object.entries(statusConfig).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as SubscriptionTier | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Tum Paketler</option>
              {Object.entries(tierConfig).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kullanici</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paket</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saglayici</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Periyot</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bitis</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Islemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSubscriptions.map((sub) => {
                  const status = statusConfig[sub.status];
                  const tier = tierConfig[sub.plan.tier];
                  const provider = providerConfig[sub.provider];
                  return (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {sub.user.firstName} {sub.user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{sub.user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${tier.bgColor} ${tier.color}`}>
                          {sub.plan.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1 text-sm">
                          <span>{provider.icon}</span>
                          {provider.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${status.bgColor} ${status.color}`}>
                          {status.label}
                        </span>
                        {sub.cancelAtPeriodEnd && (
                          <span className="ml-1 text-xs text-red-500">(iptal edilecek)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {sub.interval === 'MONTHLY' ? 'Aylik' : 'Yillik'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(sub.currentPeriodEnd)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleExtendSubscription(sub.id)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Uzat"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          {sub.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleCancelSubscription(sub.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Iptal Et"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredSubscriptions.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Abonelik bulunamadi
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          {/* Revenue Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Aylik Gelir (MRR)</div>
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.mrr)}</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Yillik Gelir (ARR)</div>
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.arr)}</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Aktif Abone</div>
                  <div className="text-2xl font-bold text-gray-900">{stats.activeSubscriptions}</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Deneme Surecinde</div>
                  <div className="text-2xl font-bold text-gray-900">{stats.trialingSubscriptions}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Rates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Donusum ve Kayip Oranlari</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Donusum Orani (Trial to Paid)</span>
                    <span className="text-sm font-medium text-green-600">{stats.conversionRate}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${stats.conversionRate}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Kayip Orani (Churn Rate)</span>
                    <span className="text-sm font-medium text-red-600">{stats.churnRate}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${stats.churnRate * 10}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Saglayiciya Gore Dagilim</h3>
              <div className="space-y-3">
                {Object.entries(stats.byProvider).map(([provider, count]) => {
                  const config = providerConfig[provider as PaymentProvider];
                  const percentage = Math.round((count / stats.activeSubscriptions) * 100);
                  return (
                    <div key={provider} className="flex items-center gap-3">
                      <span className="text-xl">{config.icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-600">{config.label}</span>
                          <span className="text-sm font-medium">{count} ({percentage}%)</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tier Distribution */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Paket Dagilimi</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.byTier).map(([tier, count]) => {
                const config = tierConfig[tier as SubscriptionTier];
                const percentage = Math.round((count / stats.totalSubscriptions) * 100);
                return (
                  <div key={tier} className={`p-4 rounded-lg ${config.bgColor}`}>
                    <div className={`text-2xl font-bold ${config.color}`}>{count}</div>
                    <div className={`text-sm ${config.color}`}>{config.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{percentage}% toplam</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingPlan ? 'Paketi Duzenle' : 'Yeni Paket Olustur'}
              </h2>
              <button onClick={() => setShowPlanModal(false)} className="p-1 text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paket Adi</label>
                  <input
                    type="text"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
                  <select
                    value={planForm.tier}
                    onChange={(e) => setPlanForm({ ...planForm, tier: e.target.value as SubscriptionTier })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    {Object.entries(tierConfig).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aciklama</label>
                <textarea
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aylik Fiyat</label>
                  <input
                    type="number"
                    value={planForm.priceMonthly}
                    onChange={(e) => setPlanForm({ ...planForm, priceMonthly: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yillik Fiyat</label>
                  <input
                    type="number"
                    value={planForm.priceYearly}
                    onChange={(e) => setPlanForm({ ...planForm, priceYearly: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Para Birimi</label>
                  <select
                    value={planForm.currency}
                    onChange={(e) => setPlanForm({ ...planForm, currency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="TRY">TRY</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deneme Suresi (gun)</label>
                  <input
                    type="number"
                    value={planForm.trialDays}
                    onChange={(e) => setPlanForm({ ...planForm, trialDays: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maks Cihaz</label>
                  <input
                    type="number"
                    value={planForm.maxDevices}
                    onChange={(e) => setPlanForm({ ...planForm, maxDevices: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planForm.offlineDownloads}
                      onChange={(e) => setPlanForm({ ...planForm, offlineDownloads: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Offline Indirme</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ozellikler</label>
                {planForm.features.map((feature, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => {
                        const newFeatures = [...planForm.features];
                        newFeatures[idx] = e.target.value;
                        setPlanForm({ ...planForm, features: newFeatures });
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Ozellik ekle..."
                    />
                    {planForm.features.length > 1 && (
                      <button
                        onClick={() => {
                          const newFeatures = planForm.features.filter((_, i) => i !== idx);
                          setPlanForm({ ...planForm, features: newFeatures });
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setPlanForm({ ...planForm, features: [...planForm.features, ''] })}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  + Ozellik Ekle
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowPlanModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Iptal
              </button>
              <button
                onClick={handleSavePlan}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grant Subscription Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Abonelik Ver</h2>
              <button onClick={() => setShowGrantModal(false)} className="p-1 text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kullanici ID veya E-posta</label>
                <input
                  type="text"
                  value={grantForm.userId}
                  onChange={(e) => setGrantForm({ ...grantForm, userId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="kullanici@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paket</label>
                <select
                  value={grantForm.planId}
                  onChange={(e) => setGrantForm({ ...grantForm, planId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Paket secin...</option>
                  {plans.filter(p => p.tier !== 'FREE').map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.name} ({tierConfig[plan.tier].label})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sure (gun)</label>
                <input
                  type="number"
                  value={grantForm.durationDays}
                  onChange={(e) => setGrantForm({ ...grantForm, durationDays: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sebep</label>
                <textarea
                  value={grantForm.reason}
                  onChange={(e) => setGrantForm({ ...grantForm, reason: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Neden abonelik veriliyor..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={() => setShowGrantModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Iptal
              </button>
              <button
                onClick={handleGrantSubscription}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Abonelik Ver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
