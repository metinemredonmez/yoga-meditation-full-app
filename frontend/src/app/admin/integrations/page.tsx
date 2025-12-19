'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { api } from '@/lib/api';

type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT';

interface IntegrationField {
  key: string;
  type: 'text' | 'password' | 'secret' | 'url' | 'email' | 'number' | 'textarea';
  label: string;
  required: boolean;
  placeholder?: string;
}

interface ProviderStatus {
  isActive: boolean;
  isConfigured: boolean;
  lastUpdated: string | null;
  configuredKeys: string[];
  missingKeys: string[];
}

interface IntegrationProvider {
  name: string;
  icon: string;
  description: string;
  fields: IntegrationField[];
  testable: boolean;
  docsUrl: string;
  status: ProviderStatus;
  config?: Record<string, string>;
}

interface IntegrationsData {
  [category: string]: {
    providers: {
      [provider: string]: IntegrationProvider;
    };
  };
}

const categoryLabels: Record<string, string> = {
  auth: 'Kimlik Dogrulama',
  notification: 'Push Bildirim',
  sms: 'SMS Servisleri',
  email: 'E-posta Servisleri',
  payment: 'Odeme Sistemleri',
  storage: 'Bulut Depolama',
  streaming: 'Streaming & Medya',
  monitoring: 'Izleme & Analitik',
};

const categoryIcons: Record<string, JSX.Element> = {
  auth: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>,
  notification: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  sms: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  email: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  payment: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  storage: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>,
  streaming: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  monitoring: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
};

export default function IntegrationsPage() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState<IntegrationsData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<{ category: string; provider: string; data: IntegrationProvider } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('STUDENT');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const loadIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/integrations');
      if (response.data.success) {
        setIntegrations(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load integrations:', err);
      setError('Entegrasyonlar yuklenirken hata olustu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    const role = session.role as UserRole;
    if (!['SUPER_ADMIN', 'ADMIN'].includes(role)) {
      router.push('/dashboard');
      return;
    }

    setUserRole(role);
    loadIntegrations();
  }, [router, loadIntegrations]);

  const handleConfigure = async (category: string, providerKey: string, providerData: IntegrationProvider) => {
    try {
      // Load full config from API
      const response = await api.get(`/admin/integrations/${category}/${providerKey}`);
      if (response.data.success) {
        const fullData = response.data.data;
        setSelectedProvider({ category, provider: providerKey, data: fullData });

        // Initialize form with existing config (masked values)
        const initialData: Record<string, string> = {};
        fullData.fields.forEach((field: IntegrationField) => {
          initialData[field.key] = fullData.config?.[field.key] || '';
        });
        setFormData(initialData);
        setShowModal(true);
        setTestResult(null);
      }
    } catch (err) {
      console.error('Failed to load provider config:', err);
    }
  };

  const handleSave = async () => {
    if (!selectedProvider) return;
    setSaving(true);
    setError(null);

    try {
      const response = await api.put(
        `/admin/integrations/${selectedProvider.category}/${selectedProvider.provider}`,
        { settings: formData }
      );

      if (response.data.success) {
        setShowModal(false);
        setSelectedProvider(null);
        loadIntegrations();
      } else {
        setError(response.data.error || 'Kaydetme basarisiz');
      }
    } catch (err: any) {
      console.error('Failed to save:', err);
      setError(err.response?.data?.error || 'Kaydetme basarisiz');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!selectedProvider) return;
    setTesting(true);
    setTestResult(null);

    try {
      const response = await api.post(
        `/admin/integrations/${selectedProvider.category}/${selectedProvider.provider}/test`
      );
      setTestResult({
        success: response.data.success,
        message: response.data.message,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.response?.data?.error || 'Baglanti testi basarisiz',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleToggle = async (category: string, provider: string, currentStatus: boolean) => {
    try {
      await api.patch(`/admin/integrations/${category}/${provider}/toggle`, {
        isActive: !currentStatus,
      });
      loadIntegrations();
    } catch (err) {
      console.error('Failed to toggle provider:', err);
    }
  };

  const toggleSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Calculate stats
  const getStats = () => {
    if (!integrations) return { total: 0, configured: 0, active: 0, notConfigured: 0 };

    let total = 0;
    let configured = 0;
    let active = 0;
    let notConfigured = 0;

    Object.values(integrations).forEach((cat) => {
      Object.values(cat.providers).forEach((provider) => {
        total++;
        if (provider.status.isConfigured) configured++;
        if (provider.status.isActive) active++;
        if (!provider.status.isConfigured) notConfigured++;
      });
    });

    return { total, configured, active, notConfigured };
  };

  const stats = getStats();

  // Get filtered providers
  const getFilteredProviders = () => {
    if (!integrations) return [];

    const result: { category: string; providerKey: string; provider: IntegrationProvider }[] = [];

    Object.entries(integrations).forEach(([category, data]) => {
      if (selectedCategory === 'all' || selectedCategory === category) {
        Object.entries(data.providers).forEach(([providerKey, provider]) => {
          result.push({ category, providerKey, provider });
        });
      }
    });

    return result;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const filteredProviders = getFilteredProviders();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Entegrasyonlar</h1>
            {userRole === 'SUPER_ADMIN' && (
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                Super Admin
              </span>
            )}
          </div>
          <p className="text-gray-600 mt-1">3. parti servis entegrasyonlarini yonetin</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Toplam</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-gray-500">Aktif</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.configured}</div>
          <div className="text-sm text-gray-500">Yapilandirildi</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-orange-600">{stats.notConfigured}</div>
          <div className="text-sm text-gray-500">Bekliyor</div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Tumu ({stats.total})
        </button>
        {integrations && Object.keys(integrations).map((category) => {
          const count = Object.keys(integrations[category].providers).length;
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                selectedCategory === category
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {categoryIcons[category]}
              {categoryLabels[category] || category} ({count})
            </button>
          );
        })}
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProviders.map(({ category, providerKey, provider }) => {
          const isConfigured = provider.status.isConfigured;
          const isActive = provider.status.isActive;

          return (
            <div
              key={`${category}-${providerKey}`}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                      {provider.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                      <span className="text-xs text-gray-500">{categoryLabels[category]}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {isConfigured ? (
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
                        isActive
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        {isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border bg-orange-100 text-orange-700 border-orange-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                        Yapilandirilmadi
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{provider.description}</p>

                {/* Missing Keys Warning */}
                {provider.status.missingKeys.length > 0 && (
                  <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-700">
                      Eksik: {provider.status.missingKeys.join(', ')}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {provider.docsUrl && (
                      <a
                        href={provider.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Dokumantasyon"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                    {isConfigured && (
                      <button
                        onClick={() => handleToggle(category, providerKey, isActive)}
                        className={`p-2 rounded-lg transition-colors ${
                          isActive
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        title={isActive ? 'Deaktif Et' : 'Aktif Et'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => handleConfigure(category, providerKey, provider)}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    {isConfigured ? 'Duzenle' : 'Yapilandir'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredProviders.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Entegrasyon bulunamadi</h3>
          <p className="mt-1 text-sm text-gray-500">Bu kategoride gosterilecek entegrasyon yok.</p>
        </div>
      )}

      {/* Configuration Modal */}
      {showModal && selectedProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedProvider.data.icon}</span>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedProvider.data.name}</h2>
                  <p className="text-sm text-gray-500">{categoryLabels[selectedProvider.category]}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedProvider(null);
                  setTestResult(null);
                }}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Test Result */}
              {testResult && (
                <div className={`p-3 rounded-lg border ${
                  testResult.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    <p className={`text-sm ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                      {testResult.message}
                    </p>
                  </div>
                </div>
              )}

              {/* Security Warning */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-amber-700">
                    API anahtarlari sifrelenerek saklanir. Mevcut degerler maskelenmis olarak gosterilir.
                  </p>
                </div>
              </div>

              {/* Config Fields */}
              {selectedProvider.data.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <div className="relative">
                    {field.type === 'textarea' ? (
                      <textarea
                        value={formData[field.key] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                        placeholder={field.placeholder || `${field.label} girin...`}
                        rows={4}
                      />
                    ) : (
                      <input
                        type={
                          field.type === 'password' || field.type === 'secret'
                            ? showSecrets[field.key] ? 'text' : 'password'
                            : field.type
                        }
                        value={formData[field.key] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                        placeholder={field.placeholder || `${field.label} girin...`}
                      />
                    )}
                    {(field.type === 'password' || field.type === 'secret') && (
                      <button
                        type="button"
                        onClick={() => toggleSecret(field.key)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showSecrets[field.key] ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Docs Link */}
              {selectedProvider.data.docsUrl && (
                <a
                  href={selectedProvider.data.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Dokumantasyonu Goruntule
                </a>
              )}
            </div>

            <div className="flex justify-between gap-3 p-4 border-t border-gray-200 sticky bottom-0 bg-white">
              <div>
                {selectedProvider.data.testable && selectedProvider.data.status.isConfigured && (
                  <button
                    onClick={handleTest}
                    disabled={testing}
                    className="px-4 py-2 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {testing ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Test Ediliyor...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Baglanti Test Et
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedProvider(null);
                    setTestResult(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Iptal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
