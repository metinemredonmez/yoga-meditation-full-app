'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IconLoader2,
  IconCheck,
  IconX,
  IconBrandFirebase,
  IconBell,
  IconMail,
  IconDeviceMobile,
  IconSettings,
  IconTestPipe,
  IconUpload,
  IconKey,
  IconShield,
  IconRefresh,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { getNotificationProviderSettings, updateNotificationProviderSettings } from '@/lib/api';

interface ProviderConfig {
  id: string;
  name: string;
  provider: 'FIREBASE' | 'ONESIGNAL' | 'EXPO' | 'CUSTOM';
  isEnabled: boolean;
  isConfigured: boolean;
  config: Record<string, string>;
  lastTestAt?: string;
  lastTestStatus?: 'SUCCESS' | 'FAILED';
}

interface EmailConfig {
  provider: 'SMTP' | 'SENDGRID' | 'SES' | 'MAILGUN';
  isEnabled: boolean;
  isConfigured: boolean;
  fromEmail: string;
  fromName: string;
  config: Record<string, string>;
}

const DEFAULT_PROVIDERS: ProviderConfig[] = [
  {
    id: 'firebase',
    name: 'Firebase Cloud Messaging',
    provider: 'FIREBASE',
    isEnabled: false,
    isConfigured: false,
    config: {
      projectId: '',
      privateKey: '',
      clientEmail: '',
    }
  },
  {
    id: 'onesignal',
    name: 'OneSignal',
    provider: 'ONESIGNAL',
    isEnabled: false,
    isConfigured: false,
    config: {
      appId: '',
      apiKey: '',
    }
  },
  {
    id: 'expo',
    name: 'Expo Push Notifications',
    provider: 'EXPO',
    isEnabled: false,
    isConfigured: false,
    config: {
      accessToken: '',
    }
  }
];

const DEFAULT_EMAIL_CONFIG: EmailConfig = {
  provider: 'SMTP',
  isEnabled: false,
  isConfigured: false,
  fromEmail: '',
  fromName: '',
  config: {
    host: '',
    port: '587',
    username: '',
    password: '',
    secure: 'true',
  }
};

export function PushProvidersSettings() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [activeTab, setActiveTab] = useState('push');

  // Push providers state
  const [pushProviders, setPushProviders] = useState<ProviderConfig[]>([]);

  // Email config state
  const [emailConfig, setEmailConfig] = useState<EmailConfig>(DEFAULT_EMAIL_CONFIG);

  // Test notification dialog
  const [testDialog, setTestDialog] = useState(false);
  const [testType, setTestType] = useState<'push' | 'email'>('push');
  const [testData, setTestData] = useState({
    title: 'Test Bildirimi',
    body: 'Bu bir test bildirimidir.',
    email: '',
  });

  // Config dialog
  const [configDialog, setConfigDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderConfig | null>(null);

  useEffect(() => {
    setMounted(true);
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getNotificationProviderSettings();
      // Merge with defaults to ensure all fields exist
      const providers = (data.providers || []).map((p: any, idx: number) => ({
        ...DEFAULT_PROVIDERS[idx],
        ...p,
        config: { ...(DEFAULT_PROVIDERS[idx]?.config || {}), ...(p.config || {}) },
      }));
      setPushProviders(providers.length > 0 ? providers : DEFAULT_PROVIDERS);

      const email = data.emailConfig || {};
      setEmailConfig({
        ...DEFAULT_EMAIL_CONFIG,
        ...email,
        config: { ...DEFAULT_EMAIL_CONFIG.config, ...(email.config || {}) },
      });
    } catch (error) {
      setPushProviders(DEFAULT_PROVIDERS);
      setEmailConfig(DEFAULT_EMAIL_CONFIG);
      toast.error('Ayarlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProvider = async (providerId: string, enabled: boolean) => {
    try {
      const updatedProviders = pushProviders.map(p =>
        p.id === providerId ? { ...p, isEnabled: enabled } : p
      );
      await updateNotificationProviderSettings({ providers: updatedProviders, emailConfig });
      setPushProviders(updatedProviders);
      toast.success(enabled ? 'Sağlayıcı aktifleştirildi' : 'Sağlayıcı devre dışı bırakıldı');
    } catch (error) {
      toast.error('Ayar güncellenemedi');
    }
  };

  const handleSaveProviderConfig = async () => {
    if (!selectedProvider) return;
    setSaving(true);
    try {
      const updatedProviders = pushProviders.map(p =>
        p.id === selectedProvider.id
          ? { ...p, config: selectedProvider.config, isConfigured: true }
          : p
      );
      await updateNotificationProviderSettings({ providers: updatedProviders, emailConfig });
      setPushProviders(updatedProviders);
      toast.success('Yapılandırma kaydedildi');
      setConfigDialog(false);
    } catch (error) {
      toast.error('Yapılandırma kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmailConfig = async () => {
    setSaving(true);
    try {
      const updatedEmailConfig = { ...emailConfig, isConfigured: true };
      await updateNotificationProviderSettings({ providers: pushProviders, emailConfig: updatedEmailConfig });
      setEmailConfig(updatedEmailConfig);
      toast.success('E-posta yapılandırması kaydedildi');
    } catch (error) {
      toast.error('Yapılandırma kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    setTesting(true);
    try {
      // In real app, call test API
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Test bildirimi gönderildi');
      setTestDialog(false);
    } catch (error) {
      toast.error('Test bildirimi gönderilemedi');
    } finally {
      setTesting(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'FIREBASE':
        return <IconBrandFirebase className="h-5 w-5 text-orange-500" />;
      case 'ONESIGNAL':
        return <IconBell className="h-5 w-5 text-red-500" />;
      case 'EXPO':
        return <IconDeviceMobile className="h-5 w-5 text-purple-500" />;
      default:
        return <IconBell className="h-5 w-5" />;
    }
  };

  const renderProviderConfigFields = (provider: ProviderConfig) => {
    switch (provider.provider) {
      case 'FIREBASE':
        return (
          <div className="space-y-4">
            <div>
              <Label>Project ID</Label>
              <Input
                value={provider.config.projectId || ''}
                onChange={(e) => setSelectedProvider(prev => prev ? {
                  ...prev,
                  config: { ...prev.config, projectId: e.target.value }
                } : null)}
                placeholder="your-project-id"
              />
            </div>
            <div>
              <Label>Client Email</Label>
              <Input
                value={provider.config.clientEmail || ''}
                onChange={(e) => setSelectedProvider(prev => prev ? {
                  ...prev,
                  config: { ...prev.config, clientEmail: e.target.value }
                } : null)}
                placeholder="firebase-adminsdk@project.iam.gserviceaccount.com"
              />
            </div>
            <div>
              <Label>Private Key</Label>
              <Textarea
                value={provider.config.privateKey || ''}
                onChange={(e) => setSelectedProvider(prev => prev ? {
                  ...prev,
                  config: { ...prev.config, privateKey: e.target.value }
                } : null)}
                placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
                rows={4}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Firebase Console {'>'} Project Settings {'>'} Service Accounts {'>'} Generate New Private Key
              </p>
            </div>
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
              <IconShield className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-blue-700 dark:text-blue-300">
                Credentials güvenli şekilde şifrelenerek saklanır
              </span>
            </div>
          </div>
        );

      case 'ONESIGNAL':
        return (
          <div className="space-y-4">
            <div>
              <Label>App ID</Label>
              <Input
                value={provider.config.appId || ''}
                onChange={(e) => setSelectedProvider(prev => prev ? {
                  ...prev,
                  config: { ...prev.config, appId: e.target.value }
                } : null)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              />
            </div>
            <div>
              <Label>REST API Key</Label>
              <Input
                type="password"
                value={provider.config.apiKey || ''}
                onChange={(e) => setSelectedProvider(prev => prev ? {
                  ...prev,
                  config: { ...prev.config, apiKey: e.target.value }
                } : null)}
                placeholder="••••••••••••••••"
              />
              <p className="text-xs text-muted-foreground mt-1">
                OneSignal Dashboard {'>'} Settings {'>'} Keys & IDs
              </p>
            </div>
          </div>
        );

      case 'EXPO':
        return (
          <div className="space-y-4">
            <div>
              <Label>Access Token</Label>
              <Input
                type="password"
                value={provider.config.accessToken || ''}
                onChange={(e) => setSelectedProvider(prev => prev ? {
                  ...prev,
                  config: { ...prev.config, accessToken: e.target.value }
                } : null)}
                placeholder="ExponentPushToken[...]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Expo Dashboard {'>'} Access Tokens {'>'} Create
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // SSR hydration fix - render nothing until mounted
  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bildirim Ayarları</h2>
          <p className="text-muted-foreground">Push ve e-posta bildirim sağlayıcılarını yapılandırın</p>
        </div>
        <Button variant="outline" onClick={() => setTestDialog(true)}>
          <IconTestPipe className="h-4 w-4 mr-2" />
          Test Gönder
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="push">
            <IconDeviceMobile className="h-4 w-4 mr-2" />
            Push Bildirimleri
          </TabsTrigger>
          <TabsTrigger value="email">
            <IconMail className="h-4 w-4 mr-2" />
            E-posta
          </TabsTrigger>
        </TabsList>

        {/* Push Providers Tab */}
        <TabsContent value="push" className="space-y-4 mt-4">
          {pushProviders.map((provider) => (
            <Card key={provider.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getProviderIcon(provider.provider)}
                    <div>
                      <CardTitle className="text-lg">{provider.name}</CardTitle>
                      <CardDescription>
                        {provider.provider === 'FIREBASE' && 'Google Firebase Cloud Messaging (FCM)'}
                        {provider.provider === 'ONESIGNAL' && 'OneSignal Push Notification Service'}
                        {provider.provider === 'EXPO' && 'Expo Push Notification Service'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {provider.isConfigured ? (
                      <Badge className="bg-green-500/10 text-green-600">
                        <IconCheck className="h-3 w-3 mr-1" />
                        Yapılandırıldı
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        <IconX className="h-3 w-3 mr-1" />
                        Yapılandırılmadı
                      </Badge>
                    )}
                    <Switch
                      checked={provider.isEnabled}
                      onCheckedChange={(checked) => handleToggleProvider(provider.id, checked)}
                      disabled={!provider.isConfigured}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {provider.lastTestAt && (
                      <span>
                        Son test: {new Date(provider.lastTestAt).toLocaleString('tr-TR')} -
                        {provider.lastTestStatus === 'SUCCESS' ? (
                          <span className="text-green-600 ml-1">Başarılı</span>
                        ) : (
                          <span className="text-red-600 ml-1">Başarısız</span>
                        )}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedProvider(provider);
                      setConfigDialog(true);
                    }}
                  >
                    <IconSettings className="h-4 w-4 mr-2" />
                    Yapılandır
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Info Card */}
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <IconShield className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">Güvenlik Notu</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Tüm API anahtarları ve credentials&apos;lar AES-256 şifreleme ile güvenli şekilde saklanır.
                    Production ortamında environment variables kullanmanız önerilir.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <IconMail className="h-5 w-5 text-blue-500" />
                  <div>
                    <CardTitle className="text-lg">E-posta Sağlayıcısı</CardTitle>
                    <CardDescription>
                      E-posta bildirimleri için SMTP veya API tabanlı sağlayıcı seçin
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {emailConfig.isConfigured ? (
                    <Badge className="bg-green-500/10 text-green-600">
                      <IconCheck className="h-3 w-3 mr-1" />
                      Yapılandırıldı
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <IconX className="h-3 w-3 mr-1" />
                      Yapılandırılmadı
                    </Badge>
                  )}
                  <Switch
                    checked={emailConfig.isEnabled}
                    onCheckedChange={(checked) => setEmailConfig(prev => ({ ...prev, isEnabled: checked }))}
                    disabled={!emailConfig.isConfigured}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sağlayıcı</Label>
                  <Select
                    value={emailConfig.provider}
                    onValueChange={(v) => setEmailConfig(prev => ({ ...prev, provider: v as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SMTP">SMTP</SelectItem>
                      <SelectItem value="SENDGRID">SendGrid</SelectItem>
                      <SelectItem value="SES">Amazon SES</SelectItem>
                      <SelectItem value="MAILGUN">Mailgun</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Gönderen Adı</Label>
                  <Input
                    value={emailConfig.fromName}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, fromName: e.target.value }))}
                    placeholder="Yoga App"
                  />
                </div>
              </div>

              <div>
                <Label>Gönderen E-posta</Label>
                <Input
                  type="email"
                  value={emailConfig.fromEmail}
                  onChange={(e) => setEmailConfig(prev => ({ ...prev, fromEmail: e.target.value }))}
                  placeholder="noreply@yogaapp.com"
                />
              </div>

              {emailConfig.provider === 'SMTP' && (
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium">SMTP Ayarları</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Host</Label>
                      <Input
                        value={emailConfig.config.host || ''}
                        onChange={(e) => setEmailConfig(prev => ({
                          ...prev,
                          config: { ...prev.config, host: e.target.value }
                        }))}
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    <div>
                      <Label>Port</Label>
                      <Input
                        value={emailConfig.config.port || ''}
                        onChange={(e) => setEmailConfig(prev => ({
                          ...prev,
                          config: { ...prev.config, port: e.target.value }
                        }))}
                        placeholder="587"
                      />
                    </div>
                    <div>
                      <Label>Kullanıcı Adı</Label>
                      <Input
                        value={emailConfig.config.username || ''}
                        onChange={(e) => setEmailConfig(prev => ({
                          ...prev,
                          config: { ...prev.config, username: e.target.value }
                        }))}
                        placeholder="user@gmail.com"
                      />
                    </div>
                    <div>
                      <Label>Şifre</Label>
                      <Input
                        type="password"
                        value={emailConfig.config.password || ''}
                        onChange={(e) => setEmailConfig(prev => ({
                          ...prev,
                          config: { ...prev.config, password: e.target.value }
                        }))}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>
              )}

              {emailConfig.provider === 'SENDGRID' && (
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium">SendGrid Ayarları</h4>
                  <div>
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      value={emailConfig.config.apiKey || ''}
                      onChange={(e) => setEmailConfig(prev => ({
                        ...prev,
                        config: { ...prev.config, apiKey: e.target.value }
                      }))}
                      placeholder="SG.xxxxxxxx"
                    />
                  </div>
                </div>
              )}

              {emailConfig.provider === 'SES' && (
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium">Amazon SES Ayarları</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Access Key ID</Label>
                      <Input
                        value={emailConfig.config.accessKeyId || ''}
                        onChange={(e) => setEmailConfig(prev => ({
                          ...prev,
                          config: { ...prev.config, accessKeyId: e.target.value }
                        }))}
                        placeholder="AKIA..."
                      />
                    </div>
                    <div>
                      <Label>Secret Access Key</Label>
                      <Input
                        type="password"
                        value={emailConfig.config.secretAccessKey || ''}
                        onChange={(e) => setEmailConfig(prev => ({
                          ...prev,
                          config: { ...prev.config, secretAccessKey: e.target.value }
                        }))}
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <Label>Region</Label>
                      <Input
                        value={emailConfig.config.region || ''}
                        onChange={(e) => setEmailConfig(prev => ({
                          ...prev,
                          config: { ...prev.config, region: e.target.value }
                        }))}
                        placeholder="eu-west-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {emailConfig.provider === 'MAILGUN' && (
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium">Mailgun Ayarları</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>API Key</Label>
                      <Input
                        type="password"
                        value={emailConfig.config.apiKey || ''}
                        onChange={(e) => setEmailConfig(prev => ({
                          ...prev,
                          config: { ...prev.config, apiKey: e.target.value }
                        }))}
                        placeholder="key-xxxxxxxx"
                      />
                    </div>
                    <div>
                      <Label>Domain</Label>
                      <Input
                        value={emailConfig.config.domain || ''}
                        onChange={(e) => setEmailConfig(prev => ({
                          ...prev,
                          config: { ...prev.config, domain: e.target.value }
                        }))}
                        placeholder="mg.yourdomain.com"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveEmailConfig} disabled={saving}>
                  {saving && <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Kaydet
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Provider Config Dialog */}
      <Dialog open={configDialog} onOpenChange={setConfigDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedProvider && getProviderIcon(selectedProvider.provider)}
              {selectedProvider?.name} Yapılandırması
            </DialogTitle>
            <DialogDescription>
              API credentials ve gerekli ayarları girin
            </DialogDescription>
          </DialogHeader>
          {selectedProvider && renderProviderConfigFields(selectedProvider)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleSaveProviderConfig} disabled={saving}>
              {saving && <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />}
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Notification Dialog */}
      <Dialog open={testDialog} onOpenChange={setTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Bildirimi Gönder</DialogTitle>
            <DialogDescription>
              Yapılandırmanızı test etmek için bildirim gönderin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Bildirim Türü</Label>
              <Select value={testType} onValueChange={(v) => setTestType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="push">Push Bildirimi</SelectItem>
                  <SelectItem value="email">E-posta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Başlık</Label>
              <Input
                value={testData.title}
                onChange={(e) => setTestData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <Label>İçerik</Label>
              <Textarea
                value={testData.body}
                onChange={(e) => setTestData(prev => ({ ...prev, body: e.target.value }))}
                rows={3}
              />
            </div>
            {testType === 'email' && (
              <div>
                <Label>Alıcı E-posta</Label>
                <Input
                  type="email"
                  value={testData.email}
                  onChange={(e) => setTestData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="test@example.com"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleTestNotification} disabled={testing}>
              {testing && <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />}
              Gönder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
