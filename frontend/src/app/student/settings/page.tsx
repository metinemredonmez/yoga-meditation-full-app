'use client';

import { useEffect, useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { getCurrentUser, clearSession } from '@/lib/auth';
import { deleteAccount, updateNotificationPreferences, getNotificationPreferences } from '@/lib/api';
import { IconSettings, IconLogout, IconTrash, IconMoon, IconLanguage, IconLoader2 } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

export default function StudentSettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [language, setLanguage] = useState('tr');
  const [activityTracking, setActivityTracking] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const currentUser = getCurrentUser();
    setUser(currentUser);

    // Load saved preferences from localStorage
    const savedLanguage = localStorage.getItem('yoga_language') || 'tr';
    const savedActivityTracking = localStorage.getItem('yoga_activity_tracking') !== 'false';
    const savedAnalytics = localStorage.getItem('yoga_analytics') !== 'false';

    setLanguage(savedLanguage);
    setActivityTracking(savedActivityTracking);
    setAnalyticsEnabled(savedAnalytics);
  }, []);

  const handleLogout = () => {
    clearSession();
    toast.success('Basariyla cikis yapildi');
    router.push('/auth/sign-in');
  };

  const handleThemeChange = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
    toast.success(checked ? 'Karanlik mod etkinlestirildi' : 'Acik mod etkinlestirildi');
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    localStorage.setItem('yoga_language', value);
    toast.success(`Dil ${value === 'tr' ? 'Turkce' : 'Ingilizce'} olarak ayarlandi`);
  };

  const handleActivityTrackingChange = (checked: boolean) => {
    setActivityTracking(checked);
    localStorage.setItem('yoga_activity_tracking', String(checked));
    toast.success(checked ? 'Aktivite takibi etkinlestirildi' : 'Aktivite takibi devre disi birakildi');
  };

  const handleAnalyticsChange = (checked: boolean) => {
    setAnalyticsEnabled(checked);
    localStorage.setItem('yoga_analytics', String(checked));
    toast.success(checked ? 'Analitik paylasimi etkinlestirildi' : 'Analitik paylasimi devre disi birakildi');
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Lutfen sifrenizi girin');
      return;
    }

    try {
      setIsDeleting(true);
      await deleteAccount(deletePassword);
      toast.success('Hesabiniz basariyla silindi');
      clearSession();
      router.push('/auth/sign-in');
    } catch (error: any) {
      console.error('Failed to delete account:', error);
      toast.error(error?.response?.data?.error || 'Hesap silinemedi. Sifrenizi kontrol edin.');
    } finally {
      setIsDeleting(false);
      setDeletePassword('');
    }
  };

  // Avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <PageContainer scrollable>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ayarlar</h2>
          <p className="text-muted-foreground">
            Hesap ve uygulama ayarlarinizi yonetin.
          </p>
        </div>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconMoon className="h-5 w-5" />
              Gorunum
            </CardTitle>
            <CardDescription>Tema ve gorunum tercihleriniz</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="darkMode">Karanlik Mod</Label>
                <p className="text-sm text-muted-foreground">
                  Karanlik temayi etkinlestir
                </p>
              </div>
              <Switch
                id="darkMode"
                checked={theme === 'dark'}
                onCheckedChange={handleThemeChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconLanguage className="h-5 w-5" />
              Dil
            </CardTitle>
            <CardDescription>Uygulama dilini secin</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Dil secin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tr">Turkce</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconSettings className="h-5 w-5" />
              Gizlilik
            </CardTitle>
            <CardDescription>Gizlilik ve veri tercihleriniz</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="activityTracking">Aktivite Takibi</Label>
                <p className="text-sm text-muted-foreground">
                  Izleme ve aktivite verilerini kaydet
                </p>
              </div>
              <Switch
                id="activityTracking"
                checked={activityTracking}
                onCheckedChange={handleActivityTrackingChange}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="analytics">Analitik</Label>
                <p className="text-sm text-muted-foreground">
                  Uygulama iyilestirmeleri icin anonim veri paylas
                </p>
              </div>
              <Switch
                id="analytics"
                checked={analyticsEnabled}
                onCheckedChange={handleAnalyticsChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Hesap Islemleri</CardTitle>
            <CardDescription>Hesabinizla ilgili islemler</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Cikis Yap</p>
                <p className="text-sm text-muted-foreground">
                  Hesabinizdan guvenli cikis yapin
                </p>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <IconLogout className="h-4 w-4 mr-2" />
                Cikis Yap
              </Button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="font-medium text-destructive">Hesabi Sil</p>
                <p className="text-sm text-muted-foreground">
                  Hesabinizi ve tum verilerinizi kalici olarak silin
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <IconTrash className="h-4 w-4 mr-2" />
                    Hesabi Sil
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hesabinizi silmek istediginize emin misiniz?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bu islem geri alinamaz. Hesabiniz ve tum verileriniz kalici olarak silinecektir.
                      Devam etmek icin sifrenizi girin.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4">
                    <Input
                      type="password"
                      placeholder="Sifrenizi girin"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeletePassword('')}>Iptal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={isDeleting || !deletePassword}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? (
                        <>
                          <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                          Siliniyor...
                        </>
                      ) : (
                        'Hesabi Sil'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardHeader>
            <CardTitle>Uygulama Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Versiyon: 1.0.0</p>
            <p>Hesap: {user?.email || '-'}</p>
            <div className="flex gap-4 pt-2">
              <a href="/terms" className="hover:text-primary">Kullanim Sartlari</a>
              <a href="/privacy" className="hover:text-primary">Gizlilik Politikasi</a>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
