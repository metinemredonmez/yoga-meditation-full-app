'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  IconSettings,
  IconUser,
  IconBell,
  IconLock,
  IconCreditCard,
  IconLoader2,
  IconShield,
  IconWorld,
  IconCalendar,
  IconSchool,
  IconTrash,
  IconDevices,
  IconAlertTriangle,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import api from '@/lib/api';

interface InstructorSettings {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  avatarUrl: string;
  specialties: string[];
  emailNotifications: boolean;
  pushNotifications: boolean;
  newStudentAlert: boolean;
  reviewAlert: boolean;
  earningsAlert: boolean;
  payoutMethod: string;
  bankCountry: string;
  bankCountryCode: string;
  bankName: string;
  iban: string;
  swiftCode: string;
  accountHolderName: string;
  paypalEmail: string;
  profilePublic: boolean;
  showEarnings: boolean;
  showStudentCount: boolean;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  lastLogin: string | null;
  hasPassword: boolean;
  sessions: {
    id: string;
    device: string;
    ip: string;
    location: string;
    lastActive: string;
    current: boolean;
  }[];
}

interface Preferences {
  language: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
}

interface ClassPreferences {
  defaultDuration: number;
  maxStudents: number;
  minBookingHours: number;
  autoApprove: boolean;
  allowComments: boolean;
  allowRatings: boolean;
  defaultLevel: string;
  defaultLanguage: string;
}

interface CalendarIntegrations {
  googleCalendar: { connected: boolean; email: string | null; syncEnabled: boolean };
  appleCalendar: { connected: boolean; syncEnabled: boolean };
  outlook: { connected: boolean; email: string | null; syncEnabled: boolean };
}

export default function InstructorSettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingIban, setEditingIban] = useState(false);
  const [originalIban, setOriginalIban] = useState('');
  const [settings, setSettings] = useState<InstructorSettings>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    avatarUrl: '',
    specialties: [],
    emailNotifications: true,
    pushNotifications: true,
    newStudentAlert: true,
    reviewAlert: true,
    earningsAlert: true,
    payoutMethod: 'bank',
    bankCountry: 'turkey',
    bankCountryCode: '',
    bankName: '',
    iban: '',
    swiftCode: '',
    accountHolderName: '',
    paypalEmail: '',
    profilePublic: true,
    showEarnings: false,
    showStudentCount: true,
  });

  // Security state
  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    lastLogin: null,
    hasPassword: false,
    sessions: [],
  });
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  // Preferences state
  const [preferences, setPreferences] = useState<Preferences>({
    language: 'tr',
    timezone: 'Europe/Istanbul',
    currency: 'TRY',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
  });

  // Class preferences state
  const [classPrefs, setClassPrefs] = useState<ClassPreferences>({
    defaultDuration: 30,
    maxStudents: 50,
    minBookingHours: 2,
    autoApprove: false,
    allowComments: true,
    allowRatings: true,
    defaultLevel: 'all',
    defaultLanguage: 'tr',
  });

  // Calendar integrations state
  const [calendarIntegrations, setCalendarIntegrations] = useState<CalendarIntegrations>({
    googleCalendar: { connected: false, email: null, syncEnabled: false },
    appleCalendar: { connected: false, syncEnabled: false },
    outlook: { connected: false, email: null, syncEnabled: false },
  });

  // Account dialogs
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [processingAccount, setProcessingAccount] = useState(false);

  // Calendar integration dialogs
  const [calendarDialog, setCalendarDialog] = useState<{
    open: boolean;
    provider: 'google' | 'apple' | 'outlook' | null;
  }>({ open: false, provider: null });
  const [connectingCalendar, setConnectingCalendar] = useState(false);

  useEffect(() => {
    loadSettings();
    loadSecuritySettings();
    loadPreferences();
    loadClassPreferences();
    loadCalendarIntegrations();
  }, []);

  // Handle OAuth callback from Google Calendar
  useEffect(() => {
    const calendarStatus = searchParams.get('calendar');
    const tab = searchParams.get('tab');

    if (calendarStatus === 'success') {
      toast.success('Google Calendar başarıyla bağlandı!');
      loadCalendarIntegrations();
      // Clean URL
      router.replace('/instructor/settings?tab=calendar', { scroll: false });
    } else if (calendarStatus === 'error') {
      toast.error('Google Calendar bağlantısı başarısız oldu');
      router.replace('/instructor/settings?tab=calendar', { scroll: false });
    }
  }, [searchParams, router]);

  // Helper function to mask IBAN - show only first 4 and last 4 characters
  const maskIban = (iban: string) => {
    if (!iban || iban.length < 10) return iban;
    const cleanIban = iban.replace(/\s/g, '');
    const masked = cleanIban.substring(0, 4) + ' **** **** **** **** ' + cleanIban.substring(cleanIban.length - 4);
    return masked;
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/instructor/settings');
      if (response.data.success && response.data.data) {
        setSettings(prev => ({ ...prev, ...response.data.data }));
        // Store original IBAN for masking
        if (response.data.data.iban) {
          setOriginalIban(response.data.data.iban);
        }
      }
    } catch (error) {
      console.error('Settings load error:', error);
      // Load from user profile as fallback
      try {
        const userResponse = await api.get('/api/users/me');
        if (userResponse.data) {
          const user = userResponse.data;
          setSettings(prev => ({
            ...prev,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: user.phoneNumber || '',
            bio: user.bio || '',
            avatarUrl: user.avatarUrl || '',
          }));
        }
      } catch (e) {
        console.error('User profile load error:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // If editing IBAN but not changed, send original
      const dataToSend = { ...settings };
      if (!editingIban && originalIban && !settings.iban) {
        dataToSend.iban = originalIban;
      }

      await api.put('/api/instructor/settings', dataToSend);
      toast.success('Ayarlar kaydedildi');

      // If new IBAN was saved, update the original and reset editing state
      if (editingIban && settings.iban) {
        setOriginalIban(settings.iban);
        setEditingIban(false);
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Kaydetme hatası');
    } finally {
      setSaving(false);
    }
  };

  // Load security settings
  const loadSecuritySettings = async () => {
    try {
      const response = await api.get('/api/instructor/settings/security');
      if (response.data.success && response.data.data) {
        setSecurity(response.data.data);
      }
    } catch (error) {
      console.error('Security settings load error:', error);
    }
  };

  // Load preferences
  const loadPreferences = async () => {
    try {
      const response = await api.get('/api/instructor/settings/preferences');
      if (response.data.success && response.data.data) {
        setPreferences(response.data.data);
      }
    } catch (error) {
      console.error('Preferences load error:', error);
    }
  };

  // Load class preferences
  const loadClassPreferences = async () => {
    try {
      const response = await api.get('/api/instructor/settings/class-preferences');
      if (response.data.success && response.data.data) {
        setClassPrefs(response.data.data);
      }
    } catch (error) {
      console.error('Class preferences load error:', error);
    }
  };

  // Load calendar integrations
  const loadCalendarIntegrations = async () => {
    try {
      const response = await api.get('/api/instructor/settings/calendar-integrations');
      if (response.data.success && response.data.data) {
        setCalendarIntegrations(response.data.data);
      }
    } catch (error) {
      console.error('Calendar integrations load error:', error);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error('Yeni şifreler eşleşmiyor');
      return;
    }
    if (passwordForm.new.length < 8) {
      toast.error('Şifre en az 8 karakter olmalı');
      return;
    }

    setChangingPassword(true);
    try {
      await api.post('/api/instructor/settings/security/change-password', {
        currentPassword: passwordForm.current,
        newPassword: passwordForm.new,
      });
      toast.success('Şifre değiştirildi');
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Şifre değiştirilemedi');
    } finally {
      setChangingPassword(false);
    }
  };

  // Toggle 2FA
  const handleToggle2FA = async (enabled: boolean) => {
    try {
      await api.post('/api/instructor/settings/security/toggle-2fa', { enabled });
      setSecurity(prev => ({ ...prev, twoFactorEnabled: enabled }));
      toast.success(enabled ? '2FA aktifleştirildi' : '2FA devre dışı bırakıldı');
    } catch (error) {
      toast.error('2FA ayarı değiştirilemedi');
    }
  };

  // Terminate all sessions
  const handleTerminateSessions = async () => {
    try {
      await api.post('/api/instructor/settings/security/terminate-sessions');
      toast.success('Tüm oturumlar sonlandırıldı');
      // Reload sessions
      loadSecuritySettings();
    } catch (error) {
      toast.error('Oturumlar sonlandırılamadı');
    }
  };

  // Save preferences
  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      await api.put('/api/instructor/settings/preferences', preferences);
      toast.success('Tercihler kaydedildi');
    } catch (error) {
      toast.error('Tercihler kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  // Save class preferences
  const handleSaveClassPreferences = async () => {
    setSaving(true);
    try {
      await api.put('/api/instructor/settings/class-preferences', classPrefs);
      toast.success('Ders tercihleri kaydedildi');
    } catch (error) {
      toast.error('Ders tercihleri kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  // Calendar integration actions
  const handleCalendarAction = async (provider: string, action: string, syncEnabled?: boolean) => {
    try {
      const response = await api.post('/api/instructor/settings/calendar-integrations', { provider, action, syncEnabled });
      // Update state with returned data
      if (response.data.success && response.data.data) {
        setCalendarIntegrations(response.data.data);
      } else {
        loadCalendarIntegrations();
      }
      toast.success(action === 'disconnect' ? 'Takvim bağlantısı kesildi' : 'Takvim ayarı güncellendi');
    } catch (error) {
      toast.error('Takvim ayarı güncellenemedi');
    }
  };

  // Connect calendar - real OAuth flow for Google and Outlook
  const handleConnectCalendar = async () => {
    if (!calendarDialog.provider) return;

    setConnectingCalendar(true);
    try {
      if (calendarDialog.provider === 'google') {
        // Real Google OAuth flow
        const response = await api.get('/api/auth/google/calendar');
        if (response.data.success && response.data.authUrl) {
          window.location.href = response.data.authUrl;
          return;
        }
        throw new Error('Failed to get auth URL');
      } else if (calendarDialog.provider === 'outlook') {
        // Real Outlook OAuth flow
        const response = await api.get('/api/auth/outlook/calendar');
        if (response.data.success && response.data.authUrl) {
          window.location.href = response.data.authUrl;
          return;
        }
        throw new Error('Failed to get auth URL');
      } else {
        // Apple Calendar - not implemented yet
        toast.error('Apple Calendar yakında kullanıma sunulacak');
        setCalendarDialog({ open: false, provider: null });
      }
    } catch (error) {
      toast.error('Takvim bağlanamadı');
      setConnectingCalendar(false);
    }
  };

  const getCalendarProviderInfo = (provider: 'google' | 'apple' | 'outlook' | null) => {
    switch (provider) {
      case 'google':
        return {
          name: 'Google Calendar',
          imagePath: '/logos/google-calendar.svg',
          bgColor: 'bg-white dark:bg-gray-800',
          description: 'Google hesabınızla bağlanarak derslerinizi Google Calendar\'a otomatik ekleyin.',
          features: [
            'Dersleriniz otomatik olarak takviminize eklenir',
            'Öğrenci rezervasyonları anında güncellenir',
            'Hatırlatıcılar ve bildirimler alın',
          ],
        };
      case 'apple':
        return {
          name: 'Apple Calendar',
          imagePath: '/logos/apple-calendar.svg',
          bgColor: 'bg-white dark:bg-gray-800',
          description: 'iCloud hesabınızla bağlanarak derslerinizi Apple Calendar\'a senkronize edin.',
          features: [
            'iPhone, iPad ve Mac\'te senkronizasyon',
            'Siri ile ders hatırlatıcıları',
            'iCloud ailenizle paylaşım',
          ],
        };
      case 'outlook':
        return {
          name: 'Microsoft Outlook',
          imagePath: '/logos/outlook-calendar.svg',
          bgColor: 'bg-white dark:bg-gray-800',
          description: 'Microsoft hesabınızla bağlanarak derslerinizi Outlook Calendar\'a ekleyin.',
          features: [
            'Office 365 ve Outlook.com entegrasyonu',
            'Teams toplantı bağlantıları',
            'İş takvimi ile senkronizasyon',
          ],
        };
      default:
        return null;
    }
  };

  // Deactivate account
  const handleDeactivateAccount = async () => {
    setProcessingAccount(true);
    try {
      await api.post('/api/instructor/settings/account/deactivate', { password: deactivatePassword });
      toast.success('Hesabınız donduruldu');
      setShowDeactivateDialog(false);
      // Redirect to login
      window.location.href = '/auth/sign-in';
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Hesap dondurulamadı');
    } finally {
      setProcessingAccount(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'HESABIMI SIL') {
      toast.error('Lütfen onay metnini doğru yazın');
      return;
    }

    setProcessingAccount(true);
    try {
      await api.post('/api/instructor/settings/account/delete', {
        password: deletePassword,
        confirmText: deleteConfirmText,
      });
      toast.success('Hesabınız 30 gün içinde silinecek');
      setShowDeleteDialog(false);
      window.location.href = '/auth/sign-in';
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Hesap silinemedi');
    } finally {
      setProcessingAccount(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-20">
          <IconLoader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <IconSettings className="h-6 w-6" />
          Ayarlar
        </h1>
        <p className="text-muted-foreground">Hesap ve tercihlerinizi yönetin</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1 lg:grid lg:grid-cols-8 lg:w-full">
          <TabsTrigger value="profile" className="flex items-center gap-1 text-xs px-2 py-1.5">
            <IconUser className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Profil</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1 text-xs px-2 py-1.5">
            <IconShield className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Güvenlik</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-1 text-xs px-2 py-1.5">
            <IconWorld className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tercihler</span>
          </TabsTrigger>
          <TabsTrigger value="class-prefs" className="flex items-center gap-1 text-xs px-2 py-1.5">
            <IconSchool className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Ders</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1 text-xs px-2 py-1.5">
            <IconBell className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Bildirim</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-1 text-xs px-2 py-1.5">
            <IconCalendar className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Takvim</span>
          </TabsTrigger>
          <TabsTrigger value="payout" className="flex items-center gap-1 text-xs px-2 py-1.5">
            <IconCreditCard className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Ödeme</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-1 text-xs px-2 py-1.5">
            <IconTrash className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Hesap</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profil Bilgileri</CardTitle>
              <CardDescription>Kişisel bilgilerinizi güncelleyin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Ad</Label>
                  <Input
                    value={settings.firstName}
                    onChange={(e) => setSettings({ ...settings, firstName: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Soyad</Label>
                  <Input
                    value={settings.lastName}
                    onChange={(e) => setSettings({ ...settings, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>E-posta</Label>
                <Input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  disabled
                />
                <p className="text-xs text-muted-foreground">E-posta değiştirilemez</p>
              </div>

              <div className="grid gap-2">
                <Label>Telefon</Label>
                <Input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  placeholder="+90 5XX XXX XX XX"
                />
              </div>

              <div className="grid gap-2">
                <Label>Hakkımda</Label>
                <Textarea
                  value={settings.bio}
                  onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
                  rows={4}
                  placeholder="Kendinizi tanıtın..."
                />
              </div>

              <Button onClick={handleSave} disabled={saving}>
                {saving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kaydet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Bildirim Tercihleri</CardTitle>
              <CardDescription>Hangi bildirimleri almak istediğinizi seçin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>E-posta Bildirimleri</Label>
                  <p className="text-sm text-muted-foreground">Önemli güncellemeler için e-posta alın</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(c) => setSettings({ ...settings, emailNotifications: c })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>Push Bildirimleri</Label>
                  <p className="text-sm text-muted-foreground">Anlık bildirimler alın</p>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(c) => setSettings({ ...settings, pushNotifications: c })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>Yeni Öğrenci Uyarıları</Label>
                  <p className="text-sm text-muted-foreground">Yeni öğrenci kaydında bildirim alın</p>
                </div>
                <Switch
                  checked={settings.newStudentAlert}
                  onCheckedChange={(c) => setSettings({ ...settings, newStudentAlert: c })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>Değerlendirme Uyarıları</Label>
                  <p className="text-sm text-muted-foreground">Yeni değerlendirme geldiğinde bildirim alın</p>
                </div>
                <Switch
                  checked={settings.reviewAlert}
                  onCheckedChange={(c) => setSettings({ ...settings, reviewAlert: c })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>Kazanç Uyarıları</Label>
                  <p className="text-sm text-muted-foreground">Ödeme ve kazanç güncellemeleri</p>
                </div>
                <Switch
                  checked={settings.earningsAlert}
                  onCheckedChange={(c) => setSettings({ ...settings, earningsAlert: c })}
                />
              </div>

              <Button onClick={handleSave} disabled={saving}>
                {saving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kaydet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payout Tab */}
        <TabsContent value="payout">
          <Card>
            <CardHeader>
              <CardTitle>Ödeme Ayarları</CardTitle>
              <CardDescription>Kazançlarınızı nasıl almak istediğinizi belirleyin. Bu bilgiler gizli tutulur ve sadece ödeme işlemleri için kullanılır.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Ödeme bilgileriniz şifreli olarak saklanır. Minimum ödeme tutarı 100 TL&apos;dir.
                </p>
              </div>

              <div className="grid gap-2">
                <Label className="text-base font-medium">Ödeme Yöntemi</Label>
                <Select
                  value={settings.payoutMethod}
                  onValueChange={(v) => setSettings({ ...settings, payoutMethod: v })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Banka Havalesi (EFT/SWIFT)</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.payoutMethod === 'bank' && (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label className="text-base font-medium">Banka Konumu</Label>
                    <Tabs defaultValue={settings.bankCountry || 'turkey'} onValueChange={(v) => setSettings({ ...settings, bankCountry: v })} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 h-12">
                        <TabsTrigger value="turkey" className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                          Türkiye Bankası
                        </TabsTrigger>
                        <TabsTrigger value="international" className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                          Yurtdışı Bankası
                        </TabsTrigger>
                      </TabsList>

                    {/* Türkiye Bankası */}
                    <TabsContent value="turkey" className="space-y-4 rounded-lg border p-4 mt-4">
                      <h4 className="font-medium">Türkiye Banka Hesap Bilgileri</h4>
                      <div className="grid gap-2">
                        <Label>Banka Adı <span className="text-red-500">*</span></Label>
                        <Select
                          value={settings.bankName}
                          onValueChange={(v) => setSettings({ ...settings, bankName: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Banka seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Akbank">Akbank</SelectItem>
                            <SelectItem value="Denizbank">Denizbank</SelectItem>
                            <SelectItem value="Garanti BBVA">Garanti BBVA</SelectItem>
                            <SelectItem value="Halkbank">Halkbank</SelectItem>
                            <SelectItem value="ING Bank">ING Bank</SelectItem>
                            <SelectItem value="İş Bankası">İş Bankası</SelectItem>
                            <SelectItem value="QNB Finansbank">QNB Finansbank</SelectItem>
                            <SelectItem value="TEB">TEB</SelectItem>
                            <SelectItem value="Vakıfbank">Vakıfbank</SelectItem>
                            <SelectItem value="Yapı Kredi">Yapı Kredi</SelectItem>
                            <SelectItem value="Ziraat Bankası">Ziraat Bankası</SelectItem>
                            <SelectItem value="ENPARA">Enpara</SelectItem>
                            <SelectItem value="Papara">Papara</SelectItem>
                            <SelectItem value="Diğer">Diğer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>IBAN <span className="text-red-500">*</span></Label>
                        {!editingIban && originalIban ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-10 px-3 py-2 rounded-md border bg-muted font-mono tracking-wider text-sm flex items-center">
                              {maskIban(originalIban)}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingIban(true);
                                setSettings({ ...settings, iban: '' });
                              }}
                            >
                              Değiştir
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Input
                              value={settings.iban}
                              onChange={(e) => {
                                let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                // Auto-add TR prefix for Turkey
                                if (value.length > 0 && !value.startsWith('TR')) {
                                  value = 'TR' + value.replace(/^TR/, '');
                                }
                                if (value.length > 26) value = value.substring(0, 26);
                                const formatted = value.replace(/(.{4})/g, '$1 ').trim();
                                setSettings({ ...settings, iban: formatted });
                              }}
                              placeholder="TR00 0000 0000 0000 0000 0000 00"
                              maxLength={32}
                              className="font-mono tracking-wider"
                              autoFocus={editingIban}
                            />
                            {editingIban && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-fit text-muted-foreground"
                                onClick={() => {
                                  setEditingIban(false);
                                  setSettings({ ...settings, iban: originalIban });
                                }}
                              >
                                Vazgeç
                              </Button>
                            )}
                          </>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Türkiye IBAN 26 karakterdir ve TR ile başlar
                        </p>
                        {(editingIban || !originalIban) && settings.iban && settings.iban.replace(/\s/g, '').length > 0 && settings.iban.replace(/\s/g, '').length !== 26 && (
                          <p className="text-xs text-red-500">
                            IBAN 26 karakter olmalıdır ({settings.iban.replace(/\s/g, '').length}/26)
                          </p>
                        )}
                        {(editingIban || !originalIban) && settings.iban && settings.iban.replace(/\s/g, '').length === 26 && (
                          <p className="text-xs text-green-600">
                            IBAN formatı geçerli
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label>Hesap Sahibi Adı</Label>
                        <Input
                          value={settings.accountHolderName || ''}
                          onChange={(e) => setSettings({ ...settings, accountHolderName: e.target.value })}
                          placeholder="Ad Soyad"
                        />
                      </div>
                    </TabsContent>

                    {/* Uluslararası Banka */}
                    <TabsContent value="international" className="space-y-4 rounded-lg border p-4 mt-4">
                      <h4 className="font-medium">Uluslararası Banka Hesap Bilgileri</h4>
                      <div className="grid gap-2">
                        <Label>Ülke <span className="text-red-500">*</span></Label>
                        <Select
                          value={settings.bankCountryCode || ''}
                          onValueChange={(v) => setSettings({ ...settings, bankCountryCode: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Ülke seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DE">Almanya</SelectItem>
                            <SelectItem value="AT">Avusturya</SelectItem>
                            <SelectItem value="BE">Belçika</SelectItem>
                            <SelectItem value="BG">Bulgaristan</SelectItem>
                            <SelectItem value="CZ">Çekya</SelectItem>
                            <SelectItem value="DK">Danimarka</SelectItem>
                            <SelectItem value="EE">Estonya</SelectItem>
                            <SelectItem value="FI">Finlandiya</SelectItem>
                            <SelectItem value="FR">Fransa</SelectItem>
                            <SelectItem value="NL">Hollanda</SelectItem>
                            <SelectItem value="GB">İngiltere</SelectItem>
                            <SelectItem value="IE">İrlanda</SelectItem>
                            <SelectItem value="ES">İspanya</SelectItem>
                            <SelectItem value="SE">İsveç</SelectItem>
                            <SelectItem value="CH">İsviçre</SelectItem>
                            <SelectItem value="IT">İtalya</SelectItem>
                            <SelectItem value="CY">Kıbrıs</SelectItem>
                            <SelectItem value="LV">Letonya</SelectItem>
                            <SelectItem value="LT">Litvanya</SelectItem>
                            <SelectItem value="LU">Lüksemburg</SelectItem>
                            <SelectItem value="HU">Macaristan</SelectItem>
                            <SelectItem value="MT">Malta</SelectItem>
                            <SelectItem value="NO">Norveç</SelectItem>
                            <SelectItem value="PL">Polonya</SelectItem>
                            <SelectItem value="PT">Portekiz</SelectItem>
                            <SelectItem value="RO">Romanya</SelectItem>
                            <SelectItem value="SK">Slovakya</SelectItem>
                            <SelectItem value="SI">Slovenya</SelectItem>
                            <SelectItem value="GR">Yunanistan</SelectItem>
                            <SelectItem value="US">ABD</SelectItem>
                            <SelectItem value="CA">Kanada</SelectItem>
                            <SelectItem value="AU">Avustralya</SelectItem>
                            <SelectItem value="OTHER">Diğer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Banka Adı <span className="text-red-500">*</span></Label>
                        <Input
                          value={settings.bankName}
                          onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                          placeholder="Örn: Deutsche Bank, HSBC, Barclays..."
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>IBAN <span className="text-red-500">*</span></Label>
                        {!editingIban && originalIban ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-10 px-3 py-2 rounded-md border bg-muted font-mono tracking-wider text-sm flex items-center">
                              {maskIban(originalIban)}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingIban(true);
                                setSettings({ ...settings, iban: '' });
                              }}
                            >
                              Değiştir
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Input
                              value={settings.iban}
                              onChange={(e) => {
                                let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                if (value.length > 34) value = value.substring(0, 34);
                                const formatted = value.replace(/(.{4})/g, '$1 ').trim();
                                setSettings({ ...settings, iban: formatted });
                              }}
                              placeholder={`${settings.bankCountryCode || 'XX'}00 0000 0000 0000 0000`}
                              maxLength={42}
                              className="font-mono tracking-wider"
                              autoFocus={editingIban}
                            />
                            {editingIban && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-fit text-muted-foreground"
                                onClick={() => {
                                  setEditingIban(false);
                                  setSettings({ ...settings, iban: originalIban });
                                }}
                              >
                                Vazgeç
                              </Button>
                            )}
                          </>
                        )}
                        <p className="text-xs text-muted-foreground">
                          IBAN ülke kodunuzla başlar - 15 ile 34 karakter arası
                        </p>
                        {(editingIban || !originalIban) && settings.iban && settings.iban.replace(/\s/g, '').length > 0 && settings.iban.replace(/\s/g, '').length < 15 && (
                          <p className="text-xs text-red-500">
                            IBAN en az 15 karakter olmalıdır ({settings.iban.replace(/\s/g, '').length}/15)
                          </p>
                        )}
                        {(editingIban || !originalIban) && settings.iban && settings.iban.replace(/\s/g, '').length >= 15 && (
                          <p className="text-xs text-green-600">
                            IBAN formatı geçerli ({settings.iban.replace(/\s/g, '').length} karakter)
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label>SWIFT/BIC Kodu <span className="text-red-500">*</span></Label>
                        <Input
                          value={settings.swiftCode || ''}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                            setSettings({ ...settings, swiftCode: value.substring(0, 11) });
                          }}
                          placeholder="DEUTDEFF"
                          maxLength={11}
                          className="font-mono tracking-wider"
                        />
                        <p className="text-xs text-muted-foreground">
                          8 veya 11 karakterli banka tanımlama kodu (uluslararası transferler için zorunlu)
                        </p>
                        {settings.swiftCode && settings.swiftCode.length > 0 && settings.swiftCode.length !== 8 && settings.swiftCode.length !== 11 && (
                          <p className="text-xs text-red-500">
                            SWIFT kodu 8 veya 11 karakter olmalıdır ({settings.swiftCode.length} karakter)
                          </p>
                        )}
                        {settings.swiftCode && (settings.swiftCode.length === 8 || settings.swiftCode.length === 11) && (
                          <p className="text-xs text-green-600">
                            SWIFT kodu formatı geçerli
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label>Hesap Sahibi Adı <span className="text-red-500">*</span></Label>
                        <Input
                          value={settings.accountHolderName || ''}
                          onChange={(e) => setSettings({ ...settings, accountHolderName: e.target.value })}
                          placeholder="John Doe"
                        />
                        <p className="text-xs text-muted-foreground">
                          Banka hesabınızda kayıtlı tam isim (Latin karakterlerle)
                        </p>
                      </div>
                    </TabsContent>
                    </Tabs>
                  </div>
                </div>
              )}

              {settings.payoutMethod === 'paypal' && (
                <div className="space-y-4 rounded-lg border p-4">
                  <h4 className="font-medium">PayPal Hesap Bilgileri</h4>
                  <div className="grid gap-2">
                    <Label>PayPal E-posta <span className="text-red-500">*</span></Label>
                    <Input
                      type="email"
                      value={settings.paypalEmail}
                      onChange={(e) => setSettings({ ...settings, paypalEmail: e.target.value })}
                      placeholder="paypal@example.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      PayPal hesabınıza kayıtlı e-posta adresini girin
                    </p>
                  </div>
                </div>
              )}

              <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
                {saving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ödeme Bilgilerini Kaydet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Gizlilik Ayarları</CardTitle>
              <CardDescription>Profilinizin görünürlüğünü kontrol edin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>Herkese Açık Profil</Label>
                  <p className="text-sm text-muted-foreground">Profiliniz tüm kullanıcılara görünsün</p>
                </div>
                <Switch
                  checked={settings.profilePublic}
                  onCheckedChange={(c) => setSettings({ ...settings, profilePublic: c })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>Kazançları Göster</Label>
                  <p className="text-sm text-muted-foreground">Toplam kazancınız profilinizde görünsün</p>
                </div>
                <Switch
                  checked={settings.showEarnings}
                  onCheckedChange={(c) => setSettings({ ...settings, showEarnings: c })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>Öğrenci Sayısını Göster</Label>
                  <p className="text-sm text-muted-foreground">Toplam öğrenci sayınız profilinizde görünsün</p>
                </div>
                <Switch
                  checked={settings.showStudentCount}
                  onCheckedChange={(c) => setSettings({ ...settings, showStudentCount: c })}
                />
              </div>

              <Button onClick={handleSave} disabled={saving}>
                {saving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kaydet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="space-y-6">
            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconLock className="h-5 w-5" />
                  {security.hasPassword ? 'Şifre Değiştir' : 'Şifre Oluştur'}
                </CardTitle>
                <CardDescription>
                  {security.hasPassword
                    ? 'Hesap güvenliğiniz için güçlü bir şifre kullanın'
                    : 'Telefon ile giriş yapıyorsunuz. İsterseniz şifre de oluşturabilirsiniz.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {security.hasPassword && (
                  <div className="grid gap-2">
                    <Label>Mevcut Şifre</Label>
                    <Input
                      type="password"
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                )}
                <div className="grid gap-2">
                  <Label>Yeni Şifre</Label>
                  <Input
                    type="password"
                    value={passwordForm.new}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-muted-foreground">En az 8 karakter</p>
                </div>
                <div className="grid gap-2">
                  <Label>Yeni Şifre (Tekrar)</Label>
                  <Input
                    type="password"
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <Button onClick={handleChangePassword} disabled={changingPassword}>
                  {changingPassword && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {security.hasPassword ? 'Şifreyi Değiştir' : 'Şifre Oluştur'}
                </Button>
              </CardContent>
            </Card>

            {/* Two-Factor Authentication */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconShield className="h-5 w-5" />
                  İki Faktörlü Doğrulama (2FA)
                </CardTitle>
                <CardDescription>Hesabınıza ekstra güvenlik katmanı ekleyin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label>2FA Etkin</Label>
                    <p className="text-sm text-muted-foreground">
                      {security.twoFactorEnabled
                        ? 'İki faktörlü doğrulama aktif'
                        : 'İki faktörlü doğrulama kapalı'}
                    </p>
                  </div>
                  <Switch
                    checked={security.twoFactorEnabled}
                    onCheckedChange={handleToggle2FA}
                  />
                </div>
                {security.twoFactorEnabled && (
                  <Alert>
                    <IconCheck className="h-4 w-4" />
                    <AlertDescription>
                      Hesabınız iki faktörlü doğrulama ile korunuyor.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Active Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconDevices className="h-5 w-5" />
                  Aktif Oturumlar
                </CardTitle>
                <CardDescription>Hesabınıza bağlı cihazları görüntüleyin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {security.sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <IconDevices className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{session.device}</p>
                        <p className="text-sm text-muted-foreground">
                          {session.location} • {session.ip}
                        </p>
                      </div>
                    </div>
                    {session.current && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Bu cihaz
                      </Badge>
                    )}
                  </div>
                ))}
                {security.sessions.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">Oturum bilgisi bulunamadı</p>
                )}
                <Separator />
                <Button variant="destructive" onClick={handleTerminateSessions}>
                  Tüm Oturumları Sonlandır
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconWorld className="h-5 w-5" />
                Dil ve Bölge
              </CardTitle>
              <CardDescription>Dil, saat dilimi ve biçim tercihlerinizi ayarlayın</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Dil</Label>
                  <Select
                    value={preferences.language}
                    onValueChange={(v) => setPreferences({ ...preferences, language: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tr">Türkçe</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Saat Dilimi</Label>
                  <Select
                    value={preferences.timezone}
                    onValueChange={(v) => setPreferences({ ...preferences, timezone: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Istanbul">İstanbul (GMT+3)</SelectItem>
                      <SelectItem value="Europe/London">Londra (GMT+0)</SelectItem>
                      <SelectItem value="Europe/Berlin">Berlin (GMT+1)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (GMT+1)</SelectItem>
                      <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Los Angeles (GMT-8)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (GMT+9)</SelectItem>
                      <SelectItem value="Asia/Dubai">Dubai (GMT+4)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Para Birimi</Label>
                  <Select
                    value={preferences.currency}
                    onValueChange={(v) => setPreferences({ ...preferences, currency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRY">Türk Lirası (₺)</SelectItem>
                      <SelectItem value="USD">ABD Doları ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                      <SelectItem value="GBP">İngiliz Sterlini (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Tarih Formatı</Label>
                  <Select
                    value={preferences.dateFormat}
                    onValueChange={(v) => setPreferences({ ...preferences, dateFormat: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">31/12/2024</SelectItem>
                      <SelectItem value="MM/DD/YYYY">12/31/2024</SelectItem>
                      <SelectItem value="YYYY-MM-DD">2024-12-31</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Saat Formatı</Label>
                  <Select
                    value={preferences.timeFormat}
                    onValueChange={(v) => setPreferences({ ...preferences, timeFormat: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24 saat (14:30)</SelectItem>
                      <SelectItem value="12h">12 saat (2:30 PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSavePreferences} disabled={saving}>
                {saving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kaydet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Class Preferences Tab */}
        <TabsContent value="class-prefs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconSchool className="h-5 w-5" />
                Ders Tercihleri
              </CardTitle>
              <CardDescription>Varsayılan ders ayarlarınızı belirleyin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Varsayılan Ders Süresi (dk)</Label>
                  <Select
                    value={classPrefs.defaultDuration.toString()}
                    onValueChange={(v) => setClassPrefs({ ...classPrefs, defaultDuration: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 dakika</SelectItem>
                      <SelectItem value="20">20 dakika</SelectItem>
                      <SelectItem value="30">30 dakika</SelectItem>
                      <SelectItem value="45">45 dakika</SelectItem>
                      <SelectItem value="60">60 dakika</SelectItem>
                      <SelectItem value="90">90 dakika</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Maksimum Öğrenci Sayısı</Label>
                  <Input
                    type="number"
                    value={classPrefs.maxStudents}
                    onChange={(e) => setClassPrefs({ ...classPrefs, maxStudents: parseInt(e.target.value) || 50 })}
                    min={1}
                    max={1000}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Minimum Rezervasyon Süresi (saat)</Label>
                  <Select
                    value={classPrefs.minBookingHours.toString()}
                    onValueChange={(v) => setClassPrefs({ ...classPrefs, minBookingHours: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sınırsız</SelectItem>
                      <SelectItem value="1">1 saat önce</SelectItem>
                      <SelectItem value="2">2 saat önce</SelectItem>
                      <SelectItem value="4">4 saat önce</SelectItem>
                      <SelectItem value="12">12 saat önce</SelectItem>
                      <SelectItem value="24">24 saat önce</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Varsayılan Seviye</Label>
                  <Select
                    value={classPrefs.defaultLevel}
                    onValueChange={(v) => setClassPrefs({ ...classPrefs, defaultLevel: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Seviyeler</SelectItem>
                      <SelectItem value="beginner">Başlangıç</SelectItem>
                      <SelectItem value="intermediate">Orta</SelectItem>
                      <SelectItem value="advanced">İleri</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Varsayılan Ders Dili</Label>
                  <Select
                    value={classPrefs.defaultLanguage}
                    onValueChange={(v) => setClassPrefs({ ...classPrefs, defaultLanguage: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tr">Türkçe</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label>Otomatik Ders Onayı</Label>
                    <p className="text-sm text-muted-foreground">Yeni dersler otomatik olarak onaylansın</p>
                  </div>
                  <Switch
                    checked={classPrefs.autoApprove}
                    onCheckedChange={(c) => setClassPrefs({ ...classPrefs, autoApprove: c })}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label>Yorumlara İzin Ver</Label>
                    <p className="text-sm text-muted-foreground">Öğrenciler derslerinize yorum yapabilsin</p>
                  </div>
                  <Switch
                    checked={classPrefs.allowComments}
                    onCheckedChange={(c) => setClassPrefs({ ...classPrefs, allowComments: c })}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label>Puanlamaya İzin Ver</Label>
                    <p className="text-sm text-muted-foreground">Öğrenciler derslerinizi puanlayabilsin</p>
                  </div>
                  <Switch
                    checked={classPrefs.allowRatings}
                    onCheckedChange={(c) => setClassPrefs({ ...classPrefs, allowRatings: c })}
                  />
                </div>
              </div>

              <Button onClick={handleSaveClassPreferences} disabled={saving}>
                {saving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kaydet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCalendar className="h-5 w-5" />
                Takvim Entegrasyonları
              </CardTitle>
              <CardDescription>Takvimlerinizi senkronize edin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Google Calendar */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-gray-800">
                    <Image src="/logos/google-calendar.svg" alt="Google Calendar" width={28} height={28} />
                  </div>
                  <div>
                    <Label>Google Calendar</Label>
                    <p className="text-sm text-muted-foreground">
                      {calendarIntegrations.googleCalendar.connected
                        ? calendarIntegrations.googleCalendar.email
                        : 'Bağlı değil'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {calendarIntegrations.googleCalendar.connected ? (
                    <>
                      <Switch
                        checked={calendarIntegrations.googleCalendar.syncEnabled}
                        onCheckedChange={(c) => handleCalendarAction('googleCalendar', 'toggle-sync', c)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCalendarAction('googleCalendar', 'disconnect')}
                      >
                        Bağlantıyı Kes
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setCalendarDialog({ open: true, provider: 'google' })}>
                      Bağlan
                    </Button>
                  )}
                </div>
              </div>

              {/* Apple Calendar */}
              <div className="flex items-center justify-between rounded-lg border p-4 opacity-60">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-gray-800">
                    <Image src="/logos/apple-calendar.svg" alt="Apple Calendar" width={28} height={28} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Label>Apple Calendar</Label>
                      <Badge variant="secondary" className="text-xs">Yakında</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Çok yakında kullanıma sunulacak
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Yakında
                  </Button>
                </div>
              </div>

              {/* Outlook */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-gray-800">
                    <Image src="/logos/outlook-calendar.svg" alt="Microsoft Outlook" width={28} height={28} />
                  </div>
                  <div>
                    <Label>Microsoft Outlook</Label>
                    <p className="text-sm text-muted-foreground">
                      {calendarIntegrations.outlook.connected
                        ? calendarIntegrations.outlook.email
                        : 'Bağlı değil'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {calendarIntegrations.outlook.connected ? (
                    <>
                      <Switch
                        checked={calendarIntegrations.outlook.syncEnabled}
                        onCheckedChange={(c) => handleCalendarAction('outlook', 'toggle-sync', c)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCalendarAction('outlook', 'disconnect')}
                      >
                        Bağlantıyı Kes
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setCalendarDialog({ open: true, provider: 'outlook' })}>
                      Bağlan
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account">
          <div className="space-y-6">
            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600">
                  <IconAlertTriangle className="h-5 w-5" />
                  Hesabı Dondur
                </CardTitle>
                <CardDescription>
                  Hesabınızı geçici olarak dondurun. Tüm dersleriniz ve profiliniz gizlenecektir.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Hesabınızı dondurduğunuzda:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-4">
                  <li>Profiliniz öğrencilere görünmez olacak</li>
                  <li>Yeni öğrenci kaydı alınamayacak</li>
                  <li>Mevcut dersleriniz aktif kalacak</li>
                  <li>İstediğiniz zaman hesabınızı yeniden aktifleştirebilirsiniz</li>
                </ul>
                <Button variant="outline" className="border-amber-500 text-amber-600 hover:bg-amber-50" onClick={() => setShowDeactivateDialog(true)}>
                  Hesabı Dondur
                </Button>
              </CardContent>
            </Card>

            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <IconTrash className="h-5 w-5" />
                  Hesabı Sil
                </CardTitle>
                <CardDescription>
                  Hesabınızı ve tüm verilerinizi kalıcı olarak silin. Bu işlem geri alınamaz!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive" className="mb-4">
                  <IconAlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Hesabınızı silmek 30 günlük bekleme süresine tabidir. Bu süre içinde hesabınızı geri alabilirsiniz.
                  </AlertDescription>
                </Alert>
                <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                  Hesabı Kalıcı Olarak Sil
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Deactivate Dialog */}
      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hesabı Dondur</DialogTitle>
            <DialogDescription>
              Hesabınızı dondurmak için şifrenizi girin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Şifre</Label>
              <Input
                type="password"
                value={deactivatePassword}
                onChange={(e) => setDeactivatePassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeactivateDialog(false)}>
              İptal
            </Button>
            <Button variant="default" className="bg-amber-600 hover:bg-amber-700" onClick={handleDeactivateAccount} disabled={processingAccount}>
              {processingAccount && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hesabı Dondur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Hesabı Sil</DialogTitle>
            <DialogDescription>
              Bu işlem geri alınamaz. Hesabınız 30 gün içinde tamamen silinecektir.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <IconAlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Tüm verileriniz, dersleriniz, kazançlarınız ve öğrenci ilişkileriniz silinecektir.
              </AlertDescription>
            </Alert>
            <div className="grid gap-2">
              <Label>Şifre</Label>
              <Input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="grid gap-2">
              <Label>Onaylamak için &quot;HESABIMI SIL&quot; yazın</Label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="HESABIMI SIL"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={processingAccount || deleteConfirmText !== 'HESABIMI SIL'}>
              {processingAccount && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hesabı Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calendar Integration Dialog */}
      <Dialog open={calendarDialog.open} onOpenChange={(open) => setCalendarDialog({ open, provider: open ? calendarDialog.provider : null })}>
        <DialogContent className="sm:max-w-md">
          {calendarDialog.provider && (() => {
            const info = getCalendarProviderInfo(calendarDialog.provider);
            if (!info) return null;
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-3 rounded-xl ${info.bgColor} border`}>
                      <Image src={info.imagePath} alt={info.name} width={32} height={32} />
                    </div>
                    <DialogTitle className="text-xl">{info.name}</DialogTitle>
                  </div>
                  <DialogDescription className="text-left">
                    {info.description}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Bu entegrasyon ile:</h4>
                    <ul className="space-y-2">
                      {info.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <IconCheck className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Separator />
                  <Alert>
                    <IconShield className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Takvim erişimi yalnızca ders bilgilerinizi senkronize etmek için kullanılır.
                      Kişisel verileriniz paylaşılmaz ve istediğiniz zaman bağlantıyı kesebilirsiniz.
                    </AlertDescription>
                  </Alert>
                </div>
                <DialogFooter className="flex-col gap-2 sm:flex-row">
                  <Button variant="outline" onClick={() => setCalendarDialog({ open: false, provider: null })} className="w-full sm:w-auto">
                    Vazgeç
                  </Button>
                  <Button onClick={handleConnectCalendar} disabled={connectingCalendar} className="w-full sm:w-auto">
                    {connectingCalendar ? (
                      <>
                        <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                        Bağlanıyor...
                      </>
                    ) : (
                      <>
                        <Image src={info.imagePath} alt={info.name} width={16} height={16} className="mr-2" />
                        {info.name} ile Bağlan
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
