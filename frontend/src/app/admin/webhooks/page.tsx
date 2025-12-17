'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';

type DeliveryStatus = 'PENDING' | 'SENDING' | 'DELIVERED' | 'FAILED';

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret: string;
  createdAt: string;
  lastDeliveryAt: string | null;
  successRate: number;
  totalDeliveries: number;
  userId: string;
  user?: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

interface WebhookDelivery {
  id: string;
  endpointId: string;
  event: string;
  status: DeliveryStatus;
  requestBody: string;
  responseBody: string | null;
  responseStatus: number | null;
  attemptCount: number;
  maxAttempts: number;
  nextRetryAt: string | null;
  createdAt: string;
  deliveredAt: string | null;
  endpoint?: {
    name: string;
    url: string;
  };
}

interface WebhookStats {
  totalEndpoints: number;
  activeEndpoints: number;
  totalDeliveries: number;
  pendingDeliveries: number;
  failedDeliveries: number;
  successRate: number;
  processorStatus: 'running' | 'stopped' | 'error';
}

const statusConfig: Record<DeliveryStatus, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'Bekliyor', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  SENDING: { label: 'Gonderiliyor', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  DELIVERED: { label: 'Teslim Edildi', color: 'text-green-700', bgColor: 'bg-green-100' },
  FAILED: { label: 'Basarisiz', color: 'text-red-700', bgColor: 'bg-red-100' },
};

const availableEvents = [
  { group: 'Abonelik', events: ['subscription.created', 'subscription.updated', 'subscription.cancelled', 'subscription.expired', 'subscription.renewed'] },
  { group: 'Odeme', events: ['payment.completed', 'payment.failed', 'payment.refunded'] },
  { group: 'Kullanici', events: ['user.created', 'user.updated', 'user.deleted'] },
  { group: 'Ders', events: ['class.completed', 'class.started'] },
  { group: 'Canli Yayin', events: ['livestream.started', 'livestream.ended'] },
];

export default function WebhooksPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'endpoints' | 'deliveries' | 'stats'>('endpoints');
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [stats, setStats] = useState<WebhookStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');

  // Endpoint modal
  const [showEndpointModal, setShowEndpointModal] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<WebhookEndpoint | null>(null);
  const [endpointForm, setEndpointForm] = useState({
    name: '',
    url: '',
    events: [] as string[],
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | 'all'>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');

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
      // Mock data
      setEndpoints([
        {
          id: '1',
          name: 'CRM Integration',
          url: 'https://crm.example.com/webhooks/yoga',
          events: ['subscription.created', 'subscription.cancelled', 'payment.completed'],
          isActive: true,
          secret: 'whsec_xxxxx',
          createdAt: '2024-01-15T00:00:00Z',
          lastDeliveryAt: '2024-12-10T14:30:00Z',
          successRate: 98.5,
          totalDeliveries: 1250,
          userId: 'admin1',
          user: { email: 'admin@yogaapp.com', firstName: 'Admin', lastName: 'User' },
        },
        {
          id: '2',
          name: 'Analytics Platform',
          url: 'https://analytics.example.com/events',
          events: ['class.completed', 'user.created'],
          isActive: true,
          secret: 'whsec_yyyyy',
          createdAt: '2024-03-20T00:00:00Z',
          lastDeliveryAt: '2024-12-10T15:00:00Z',
          successRate: 100,
          totalDeliveries: 850,
          userId: 'admin1',
          user: { email: 'admin@yogaapp.com', firstName: 'Admin', lastName: 'User' },
        },
        {
          id: '3',
          name: 'Slack Notifications',
          url: 'https://hooks.slack.com/services/xxx/yyy/zzz',
          events: ['subscription.created', 'payment.failed'],
          isActive: false,
          secret: 'whsec_zzzzz',
          createdAt: '2024-06-01T00:00:00Z',
          lastDeliveryAt: null,
          successRate: 0,
          totalDeliveries: 0,
          userId: 'admin2',
          user: { email: 'dev@yogaapp.com', firstName: 'Dev', lastName: 'Team' },
        },
      ]);

      setDeliveries([
        {
          id: 'd1',
          endpointId: '1',
          event: 'subscription.created',
          status: 'DELIVERED',
          requestBody: '{"event":"subscription.created","data":{...}}',
          responseBody: '{"status":"ok"}',
          responseStatus: 200,
          attemptCount: 1,
          maxAttempts: 5,
          nextRetryAt: null,
          createdAt: '2024-12-10T14:30:00Z',
          deliveredAt: '2024-12-10T14:30:01Z',
          endpoint: { name: 'CRM Integration', url: 'https://crm.example.com/webhooks/yoga' },
        },
        {
          id: 'd2',
          endpointId: '1',
          event: 'payment.completed',
          status: 'DELIVERED',
          requestBody: '{"event":"payment.completed","data":{...}}',
          responseBody: '{"received":true}',
          responseStatus: 200,
          attemptCount: 1,
          maxAttempts: 5,
          nextRetryAt: null,
          createdAt: '2024-12-10T14:25:00Z',
          deliveredAt: '2024-12-10T14:25:02Z',
          endpoint: { name: 'CRM Integration', url: 'https://crm.example.com/webhooks/yoga' },
        },
        {
          id: 'd3',
          endpointId: '2',
          event: 'class.completed',
          status: 'FAILED',
          requestBody: '{"event":"class.completed","data":{...}}',
          responseBody: 'Connection timeout',
          responseStatus: null,
          attemptCount: 5,
          maxAttempts: 5,
          nextRetryAt: null,
          createdAt: '2024-12-10T12:00:00Z',
          deliveredAt: null,
          endpoint: { name: 'Analytics Platform', url: 'https://analytics.example.com/events' },
        },
        {
          id: 'd4',
          endpointId: '1',
          event: 'subscription.cancelled',
          status: 'PENDING',
          requestBody: '{"event":"subscription.cancelled","data":{...}}',
          responseBody: null,
          responseStatus: null,
          attemptCount: 0,
          maxAttempts: 5,
          nextRetryAt: '2024-12-10T16:00:00Z',
          createdAt: '2024-12-10T15:55:00Z',
          deliveredAt: null,
          endpoint: { name: 'CRM Integration', url: 'https://crm.example.com/webhooks/yoga' },
        },
      ]);

      setStats({
        totalEndpoints: 3,
        activeEndpoints: 2,
        totalDeliveries: 2100,
        pendingDeliveries: 5,
        failedDeliveries: 12,
        successRate: 99.4,
        processorStatus: 'running',
      });

    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEndpoint = async () => {
    try {
      console.log('Saving endpoint:', endpointForm);
      setShowEndpointModal(false);
      loadData();
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleToggleEndpoint = async (endpoint: WebhookEndpoint) => {
    try {
      console.log('Toggling:', endpoint.id);
      setEndpoints((prev) =>
        prev.map((e) => (e.id === endpoint.id ? { ...e, isActive: !e.isActive } : e))
      );
    } catch (error) {
      console.error('Failed to toggle:', error);
    }
  };

  const handleTestEndpoint = async (endpointId: string) => {
    try {
      alert('Test webhook gonderildi!');
    } catch (error) {
      console.error('Failed to test:', error);
    }
  };

  const handleRetryDelivery = async (deliveryId: string) => {
    try {
      alert('Yeniden deneme baslatildi!');
    } catch (error) {
      console.error('Failed to retry:', error);
    }
  };

  const handleRotateSecret = async (endpointId: string) => {
    if (!confirm('Secret anahtarini yenilemek istediginize emin misiniz? Mevcut anahtar gecersiz olacak.')) return;
    try {
      alert('Yeni secret olusturuldu!');
    } catch (error) {
      console.error('Failed to rotate:', error);
    }
  };

  const toggleEvent = (event: string) => {
    setEndpointForm((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  const filteredDeliveries = deliveries.filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (eventFilter !== 'all' && d.event !== eventFilter) return false;
    return true;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('tr-TR');
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
          <h1 className="text-2xl font-bold text-gray-900">Webhook Yonetimi</h1>
          <p className="text-gray-600 mt-1">Giden webhook endpoint ve teslimatlarini yonetin</p>
        </div>
        <button
          onClick={() => {
            setEditingEndpoint(null);
            setEndpointForm({ name: '', url: '', events: [] });
            setShowEndpointModal(true);
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Endpoint
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { id: 'endpoints', label: 'Endpoints', icon: '🔗' },
          { id: 'deliveries', label: 'Teslimatlar', icon: '📤' },
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

      {/* Endpoints Tab */}
      {activeTab === 'endpoints' && (
        <div className="space-y-4">
          {endpoints.map((endpoint) => (
            <div
              key={endpoint.id}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{endpoint.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        endpoint.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {endpoint.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                      %{endpoint.successRate.toFixed(1)} basari
                    </span>
                  </div>

                  <div className="text-sm text-gray-500 mb-3 font-mono bg-gray-50 px-3 py-1.5 rounded inline-block">
                    {endpoint.url}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {endpoint.events.map((event) => (
                      <span
                        key={event}
                        className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                      >
                        {event}
                      </span>
                    ))}
                  </div>

                  <div className="text-xs text-gray-400">
                    {endpoint.totalDeliveries} teslimat
                    {endpoint.lastDeliveryAt && (
                      <> | Son: {formatDate(endpoint.lastDeliveryAt)}</>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestEndpoint(endpoint.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Test Gonder"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleRotateSecret(endpoint.id)}
                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                    title="Secret Yenile"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleToggleEndpoint(endpoint)}
                    className={`p-2 rounded-lg ${
                      endpoint.isActive
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                    title={endpoint.isActive ? 'Devre Disi Birak' : 'Etkinlestir'}
                  >
                    {endpoint.isActive ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditingEndpoint(endpoint);
                      setEndpointForm({
                        name: endpoint.name,
                        url: endpoint.url,
                        events: endpoint.events,
                      });
                      setShowEndpointModal(true);
                    }}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    title="Duzenle"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Deliveries Tab */}
      {activeTab === 'deliveries' && (
        <div>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as DeliveryStatus | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tum Durumlar</option>
              {Object.entries(statusConfig).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tum Eventler</option>
              {availableEvents.flatMap((g) => g.events).map((event) => (
                <option key={event} value={event}>{event}</option>
              ))}
            </select>
          </div>

          {/* Deliveries Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Endpoint</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deneme</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Islem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDeliveries.map((delivery) => {
                  const status = statusConfig[delivery.status];
                  return (
                    <tr key={delivery.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-mono">
                          {delivery.event}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{delivery.endpoint?.name}</div>
                        <div className="text-xs text-gray-500 font-mono truncate max-w-xs">
                          {delivery.endpoint?.url}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${status.bgColor} ${status.color}`}>
                          {status.label}
                        </span>
                        {delivery.responseStatus && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({delivery.responseStatus})
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {delivery.attemptCount}/{delivery.maxAttempts}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(delivery.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {delivery.status === 'FAILED' && (
                          <button
                            onClick={() => handleRetryDelivery(delivery.id)}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            Tekrar Dene
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          {/* Processor Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`w-4 h-4 rounded-full ${
                    stats.processorStatus === 'running'
                      ? 'bg-green-500 animate-pulse'
                      : stats.processorStatus === 'error'
                      ? 'bg-red-500'
                      : 'bg-gray-400'
                  }`}
                />
                <div>
                  <h3 className="font-semibold text-gray-900">Webhook Processor</h3>
                  <p className="text-sm text-gray-500">
                    {stats.processorStatus === 'running'
                      ? 'Calisiyor - Kuyruk isleniyor'
                      : stats.processorStatus === 'error'
                      ? 'Hata - Kontrol gerekiyor'
                      : 'Durduruldu'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm">
                  Islemleri Tetikle
                </button>
                <button className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 text-sm">
                  Retry Tetikle
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-3xl font-bold text-gray-900">{stats.totalEndpoints}</div>
              <div className="text-sm text-gray-500">Toplam Endpoint</div>
              <div className="text-xs text-green-600 mt-1">{stats.activeEndpoints} aktif</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-3xl font-bold text-gray-900">{stats.totalDeliveries}</div>
              <div className="text-sm text-gray-500">Toplam Teslimat</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-3xl font-bold text-yellow-600">{stats.pendingDeliveries}</div>
              <div className="text-sm text-gray-500">Bekleyen</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-3xl font-bold text-red-600">{stats.failedDeliveries}</div>
              <div className="text-sm text-gray-500">Basarisiz</div>
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Basari Orani</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${stats.successRate}%` }}
                  />
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600">%{stats.successRate}</div>
            </div>
          </div>
        </div>
      )}

      {/* Endpoint Modal */}
      {showEndpointModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingEndpoint ? 'Endpoint Duzenle' : 'Yeni Endpoint'}
              </h2>
              <button onClick={() => setShowEndpointModal(false)} className="p-1 text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint Adi</label>
                <input
                  type="text"
                  value={endpointForm.name}
                  onChange={(e) => setEndpointForm({ ...endpointForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="CRM Integration"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="url"
                  value={endpointForm.url}
                  onChange={(e) => setEndpointForm({ ...endpointForm, url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                  placeholder="https://example.com/webhooks"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Eventler</label>
                <div className="space-y-4 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {availableEvents.map((group) => (
                    <div key={group.group}>
                      <div className="text-xs font-medium text-gray-500 uppercase mb-2">{group.group}</div>
                      <div className="flex flex-wrap gap-2">
                        {group.events.map((event) => (
                          <button
                            key={event}
                            type="button"
                            onClick={() => toggleEvent(event)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              endpointForm.events.includes(event)
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {event}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {endpointForm.events.length} event secildi
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowEndpointModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Iptal
              </button>
              <button
                onClick={handleSaveEndpoint}
                disabled={!endpointForm.name || !endpointForm.url || endpointForm.events.length === 0}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
