'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';

type IntegrationStatus = 'active' | 'inactive' | 'error' | 'not_configured';
type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT';

interface Integration {
  id: string;
  name: string;
  provider: string;
  category: string;
  description: string;
  status: IntegrationStatus;
  sandboxMode?: boolean;
  configKeys: string[];
  allowedRoles: UserRole[];
  docsUrl?: string;
}

interface IntegrationCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  allowedRoles: UserRole[];
}

const categories: IntegrationCategory[] = [
  { id: 'payment', name: 'Odeme', icon: '💳', description: 'Odeme saglayicilari', allowedRoles: ['SUPER_ADMIN'] },
  { id: 'sms', name: 'SMS / OTP', icon: '📱', description: 'SMS ve dogrulama servisleri', allowedRoles: ['SUPER_ADMIN'] },
  { id: 'push', name: 'Push Bildirim', icon: '🔔', description: 'Mobil bildirim servisleri', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  { id: 'email', name: 'E-posta', icon: '📧', description: 'E-posta gonderim servisleri', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  { id: 'storage', name: 'Depolama / CDN', icon: '☁️', description: 'Dosya depolama ve CDN', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'] },
  { id: 'livestream', name: 'Canli Yayin', icon: '📺', description: 'Video streaming servisleri', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'] },
  { id: 'podcast', name: 'Podcast / RSS', icon: '🎙️', description: 'Podcast yayin ve RSS servisleri', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  { id: 'ai', name: 'Yapay Zeka', icon: '🤖', description: 'AI ve ML servisleri', allowedRoles: ['SUPER_ADMIN'] },
  { id: 'monitoring', name: 'Izleme', icon: '📊', description: 'Hata takibi ve metrikler', allowedRoles: ['SUPER_ADMIN'] },
];

const allIntegrations: Integration[] = [
  // Payment
  { id: 'stripe', name: 'Stripe', provider: 'stripe', category: 'payment', description: 'Kredi karti, Apple Pay, Google Pay', status: 'not_configured', configKeys: ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY', 'STRIPE_WEBHOOK_SECRET'], allowedRoles: ['SUPER_ADMIN'], docsUrl: 'https://stripe.com/docs' },
  { id: 'paypal', name: 'PayPal', provider: 'paypal', category: 'payment', description: 'PayPal odemeler', status: 'not_configured', configKeys: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET'], allowedRoles: ['SUPER_ADMIN'], docsUrl: 'https://developer.paypal.com' },
  { id: 'iyzico', name: 'Iyzico', provider: 'iyzico', category: 'payment', description: 'Turkiye yerel odeme', status: 'not_configured', configKeys: ['IYZICO_API_KEY', 'IYZICO_SECRET_KEY'], allowedRoles: ['SUPER_ADMIN'], docsUrl: 'https://dev.iyzipay.com' },
  { id: 'apple_iap', name: 'Apple In-App Purchase', provider: 'apple', category: 'payment', description: 'iOS uygulama ici satin alma', status: 'not_configured', configKeys: ['APPLE_SHARED_SECRET', 'APPLE_KEY_ID', 'APPLE_ISSUER_ID'], allowedRoles: ['SUPER_ADMIN'], docsUrl: 'https://developer.apple.com/in-app-purchase/' },
  { id: 'google_play', name: 'Google Play Billing', provider: 'google', category: 'payment', description: 'Android uygulama ici satin alma', status: 'not_configured', configKeys: ['GOOGLE_PACKAGE_NAME', 'GOOGLE_SERVICE_ACCOUNT_EMAIL'], allowedRoles: ['SUPER_ADMIN'], docsUrl: 'https://developer.android.com/google/play/billing' },

  // SMS
  { id: 'twilio', name: 'Twilio', provider: 'twilio', category: 'sms', description: 'Global SMS ve OTP', status: 'not_configured', configKeys: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'], allowedRoles: ['SUPER_ADMIN'], docsUrl: 'https://www.twilio.com/docs' },
  { id: 'netgsm', name: 'NetGSM', provider: 'netgsm', category: 'sms', description: 'Turkiye SMS servisi', status: 'not_configured', configKeys: ['NETGSM_USER_CODE', 'NETGSM_PASSWORD', 'NETGSM_HEADER'], allowedRoles: ['SUPER_ADMIN'], docsUrl: 'https://www.netgsm.com.tr' },

  // Push
  { id: 'firebase_fcm', name: 'Firebase Cloud Messaging', provider: 'firebase', category: 'push', description: 'Google push bildirim', status: 'not_configured', configKeys: ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'], allowedRoles: ['SUPER_ADMIN', 'ADMIN'], docsUrl: 'https://firebase.google.com/docs/cloud-messaging' },
  { id: 'onesignal', name: 'OneSignal', provider: 'onesignal', category: 'push', description: 'Coklu platform push', status: 'not_configured', configKeys: ['ONESIGNAL_APP_ID', 'ONESIGNAL_REST_API_KEY'], allowedRoles: ['SUPER_ADMIN', 'ADMIN'], docsUrl: 'https://documentation.onesignal.com' },

  // Email
  { id: 'smtp', name: 'SMTP Server', provider: 'smtp', category: 'email', description: 'Genel SMTP e-posta', status: 'not_configured', configKeys: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD'], allowedRoles: ['SUPER_ADMIN', 'ADMIN'], docsUrl: '' },
  { id: 'sendgrid', name: 'SendGrid', provider: 'sendgrid', category: 'email', description: 'Twilio SendGrid e-posta', status: 'not_configured', configKeys: ['SENDGRID_API_KEY'], allowedRoles: ['SUPER_ADMIN', 'ADMIN'], docsUrl: 'https://docs.sendgrid.com' },

  // Storage
  { id: 'aws_s3', name: 'AWS S3', provider: 's3', category: 'storage', description: 'Amazon dosya depolama', status: 'not_configured', configKeys: ['S3_BUCKET_NAME', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'S3_REGION'], allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'], docsUrl: 'https://docs.aws.amazon.com/s3/' },
  { id: 'cloudfront', name: 'CloudFront CDN', provider: 'cloudfront', category: 'storage', description: 'Amazon CDN', status: 'not_configured', configKeys: ['STORAGE_CDN_BASE_URL'], allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'], docsUrl: 'https://docs.aws.amazon.com/cloudfront/' },

  // Livestream
  { id: 'agora', name: 'Agora', provider: 'agora', category: 'livestream', description: 'Canli video streaming', status: 'not_configured', configKeys: ['AGORA_APP_ID', 'AGORA_APP_CERTIFICATE'], allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'], docsUrl: 'https://docs.agora.io' },

  // AI
  { id: 'openai', name: 'OpenAI', provider: 'openai', category: 'ai', description: 'ChatGPT ve GPT modelleri', status: 'not_configured', configKeys: ['OPENAI_API_KEY'], allowedRoles: ['SUPER_ADMIN'], docsUrl: 'https://platform.openai.com/docs' },
  { id: 'elevenlabs', name: 'ElevenLabs', provider: 'elevenlabs', category: 'ai', description: 'Ses sentezi (TTS)', status: 'not_configured', configKeys: ['ELEVENLABS_API_KEY'], allowedRoles: ['SUPER_ADMIN'], docsUrl: 'https://docs.elevenlabs.io' },

  // Monitoring
  { id: 'sentry', name: 'Sentry', provider: 'sentry', category: 'monitoring', description: 'Hata takibi', status: 'not_configured', configKeys: ['SENTRY_DSN'], allowedRoles: ['SUPER_ADMIN'], docsUrl: 'https://docs.sentry.io' },
  { id: 'prometheus', name: 'Prometheus', provider: 'prometheus', category: 'monitoring', description: 'Metrik toplama', status: 'not_configured', configKeys: ['METRICS_ENABLED', 'METRICS_PATH'], allowedRoles: ['SUPER_ADMIN'], docsUrl: 'https://prometheus.io/docs/' },

  // Podcast / RSS
  { id: 'rss_feed', name: 'RSS Feed', provider: 'rss', category: 'podcast', description: 'Podcast RSS feed olusturma', status: 'not_configured', configKeys: ['RSS_FEED_BASE_URL', 'RSS_AUTHOR_EMAIL', 'RSS_COPYRIGHT'], allowedRoles: ['SUPER_ADMIN', 'ADMIN'], docsUrl: '' },
  { id: 'spotify_podcasters', name: 'Spotify for Podcasters', provider: 'spotify', category: 'podcast', description: 'Spotify podcast dagitimi', status: 'not_configured', configKeys: ['SPOTIFY_PODCAST_ID', 'SPOTIFY_SUBMISSION_EMAIL'], allowedRoles: ['SUPER_ADMIN', 'ADMIN'], docsUrl: 'https://podcasters.spotify.com' },
  { id: 'apple_podcasts', name: 'Apple Podcasts', provider: 'apple_podcasts', category: 'podcast', description: 'Apple Podcasts dagitimi', status: 'not_configured', configKeys: ['APPLE_PODCAST_ID', 'APPLE_PODCASTS_CATEGORY'], allowedRoles: ['SUPER_ADMIN', 'ADMIN'], docsUrl: 'https://podcasters.apple.com' },
  { id: 'google_podcasts', name: 'Google Podcasts', provider: 'google_podcasts', category: 'podcast', description: 'Google Podcasts dagitimi', status: 'not_configured', configKeys: ['GOOGLE_PODCAST_FEED_URL'], allowedRoles: ['SUPER_ADMIN', 'ADMIN'], docsUrl: 'https://podcasts.google.com' },
];

const statusConfig = {
  active: { label: 'Aktif', color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
  inactive: { label: 'Pasif', color: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
  error: { label: 'Hata', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
  not_configured: { label: 'Yapilandirilmadi', color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
};

const categoryIcons: Record<string, JSX.Element> = {
  payment: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  sms: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  push: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  email: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  storage: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>,
  livestream: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  podcast: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>,
  ai: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  monitoring: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
};

export default function IntegrationsPage() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState<Integration[]>(allIntegrations);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('STUDENT');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    checkAccess();
    loadIntegrations();
  }, []);

  const checkAccess = () => {
    const session = getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    const role = session.role as UserRole;
    if (!['SUPER_ADMIN', 'ADMIN', 'TEACHER'].includes(role)) {
      router.push('/dashboard');
      return;
    }

    setUserRole(role);
  };

  const loadIntegrations = async () => {
    try {
      // TODO: Load from API
      setLoading(false);
    } catch (error) {
      console.error('Failed to load integrations:', error);
      setLoading(false);
    }
  };

  // Filter categories and integrations based on user role
  const visibleCategories = categories.filter((cat) => cat.allowedRoles.includes(userRole));
  const visibleIntegrations = integrations.filter((int) => int.allowedRoles.includes(userRole));

  const filteredIntegrations = selectedCategory === 'all'
    ? visibleIntegrations
    : visibleIntegrations.filter((int) => int.category === selectedCategory);

  // Stats
  const stats = {
    total: visibleIntegrations.length,
    active: visibleIntegrations.filter((i) => i.status === 'active').length,
    inactive: visibleIntegrations.filter((i) => i.status === 'inactive').length,
    notConfigured: visibleIntegrations.filter((i) => i.status === 'not_configured').length,
    error: visibleIntegrations.filter((i) => i.status === 'error').length,
  };

  const handleConfigure = (integration: Integration) => {
    setSelectedIntegration(integration);
    const initialData: Record<string, string> = {};
    integration.configKeys.forEach((key) => {
      initialData[key] = '';
    });
    setFormData(initialData);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!selectedIntegration) return;
    setSaving(true);

    try {
      // TODO: Save to API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update local state
      const hasValues = Object.values(formData).some((v) => v.trim() !== '');
      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === selectedIntegration.id
            ? { ...i, status: hasValues ? 'active' : 'not_configured' }
            : i
        )
      );

      setShowModal(false);
      setSelectedIntegration(null);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getRoleBadge = (roles: UserRole[]) => {
    if (roles.includes('TEACHER')) return { label: 'Herkes', color: 'bg-green-100 text-green-700' };
    if (roles.includes('ADMIN')) return { label: 'Admin+', color: 'bg-blue-100 text-blue-700' };
    return { label: 'Super Admin', color: 'bg-red-100 text-red-700' };
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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Entegrasyonlar</h1>
            {userRole === 'SUPER_ADMIN' && (
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                Super Admin
              </span>
            )}
            {userRole === 'ADMIN' && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                Admin
              </span>
            )}
            {userRole === 'TEACHER' && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                Egitmen
              </span>
            )}
          </div>
          <p className="text-gray-600 mt-1">Ucuncu parti servis entegrasyonlarini yonetin</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Toplam</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-gray-500">Aktif</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
          <div className="text-sm text-gray-500">Pasif</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-orange-600">{stats.notConfigured}</div>
          <div className="text-sm text-gray-500">Yapilandirilmadi</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-red-600">{stats.error}</div>
          <div className="text-sm text-gray-500">Hata</div>
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
          Tumu ({visibleIntegrations.length})
        </button>
        {visibleCategories.map((cat) => {
          const count = visibleIntegrations.filter((i) => i.category === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIntegrations.map((integration) => {
          const status = statusConfig[integration.status];
          const roleBadge = getRoleBadge(integration.allowedRoles);
          const category = categories.find((c) => c.id === integration.category);

          return (
            <div
              key={integration.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                      {categoryIcons[integration.category]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                      <span className="text-xs text-gray-500">{category?.name}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${status.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                      {status.label}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${roleBadge.color}`}>
                      {roleBadge.label}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">{integration.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {integration.docsUrl && (
                      <a
                        href={integration.docsUrl}
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
                  </div>
                  <button
                    onClick={() => handleConfigure(integration)}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Yapilandir
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredIntegrations.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Entegrasyon bulunamadi</h3>
          <p className="mt-1 text-sm text-gray-500">Bu kategoride gosterilecek entegrasyon yok.</p>
        </div>
      )}

      {/* Configuration Modal */}
      {showModal && selectedIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedIntegration.name}</h2>
                <p className="text-sm text-gray-500">{selectedIntegration.description}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Security Warning */}
              {userRole === 'SUPER_ADMIN' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm text-amber-700">
                      API anahtarlari hassas bilgilerdir. Guvenli bir sekilde saklayin.
                    </p>
                  </div>
                </div>
              )}

              {/* Config Fields */}
              {selectedIntegration.configKeys.map((key) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {key}
                  </label>
                  <div className="relative">
                    <input
                      type={showSecrets[key] ? 'text' : 'password'}
                      value={formData[key] || ''}
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                      placeholder={`${key} degerini girin...`}
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecret(key)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSecrets[key] ? (
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
                  </div>
                </div>
              ))}

              {/* Docs Link */}
              {selectedIntegration.docsUrl && (
                <a
                  href={selectedIntegration.docsUrl}
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

            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowModal(false)}
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
      )}
    </div>
  );
}
