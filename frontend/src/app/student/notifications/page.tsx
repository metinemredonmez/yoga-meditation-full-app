'use client';

import { useEffect, useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { IconBell, IconBellOff, IconCheck, IconRefresh, IconTrash, IconLoader2, IconStar, IconCrown, IconFlame, IconTrophy, IconInfoCircle } from '@tabler/icons-react';
import { getNotificationPreferences, updateNotificationPreferences, resetNotificationPreferences, getMyNotifications, markAllNotificationsAsRead, markNotificationAsRead, deleteNotification } from '@/lib/api';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface NotificationPreferences {
  id: string;
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  marketingEmails: boolean;
  sessionReminders: boolean;
  weeklyProgress: boolean;
  newProgramAlerts: boolean;
  communityUpdates: boolean;
  challengeReminders: boolean;
  challengeUpdates: boolean;
}

interface UserNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'ACHIEVEMENT':
      return <IconTrophy className="h-5 w-5 text-yellow-500" />;
    case 'NEW_CONTENT':
      return <IconStar className="h-5 w-5 text-blue-500" />;
    case 'CHALLENGE':
      return <IconFlame className="h-5 w-5 text-orange-500" />;
    case 'SUBSCRIPTION':
      return <IconCrown className="h-5 w-5 text-purple-500" />;
    default:
      return <IconInfoCircle className="h-5 w-5 text-gray-500" />;
  }
};

export default function StudentNotificationsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  useEffect(() => {
    loadPreferences();
    loadNotifications();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await getNotificationPreferences();
      setPreferences(response.data);
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
      toast.error('Bildirim tercihleri yuklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const response = await getMyNotifications({ limit: 20 });
      setNotifications(response.notifications || []);
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return;

    const previousValue = preferences[key];
    // Optimistic update
    setPreferences({ ...preferences, [key]: value });

    try {
      setSaving(true);
      await updateNotificationPreferences({ [key]: value });
      toast.success('Tercih guncellendi');
    } catch (error) {
      // Rollback on error
      setPreferences({ ...preferences, [key]: previousValue });
      console.error('Failed to update preference:', error);
      toast.error('Tercih guncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setResetting(true);
      const response = await resetNotificationPreferences();
      setPreferences(response.data);
      toast.success('Tercihler varsayilana sifirlandi');
    } catch (error) {
      console.error('Failed to reset preferences:', error);
      toast.error('Tercihler sifirlanamadi');
    } finally {
      setResetting(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) {
      toast.info('Okunmamis bildiriminiz yok');
      return;
    }

    try {
      setMarkingAllRead(true);
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
      setUnreadCount(0);
      toast.success('Tum bildirimler okundu olarak isaretlendi');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Bildirimler isaretlenemedi');
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n =>
        n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Bildirim isaretlenemedi');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteNotification(id);
      const notification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      toast.success('Bildirim silindi');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Bildirim silinemedi');
    }
  };

  return (
    <PageContainer scrollable>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Bildirimler</h2>
            <p className="text-muted-foreground">
              Bildirimlerinizi ve tercihlerinizi yonetin.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={markingAllRead || unreadCount === 0}>
            {markingAllRead ? (
              <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <IconCheck className="h-4 w-4 mr-2" />
            )}
            Tumunu Okundu Isaretle
            {unreadCount > 0 && <Badge variant="secondary" className="ml-2">{unreadCount}</Badge>}
          </Button>
        </div>

        {/* Notification Preferences */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Bildirim Tercihleri</CardTitle>
              <CardDescription>Hangi bildirimleri almak istediginizi secin</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={resetting || loading}
            >
              <IconRefresh className={`h-4 w-4 mr-2 ${resetting ? 'animate-spin' : ''}`} />
              Sifirla
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-6 w-11 rounded-full" />
                  </div>
                ))}
              </div>
            ) : preferences ? (
              <>
                {/* Session Reminders */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sessionReminders">Gunluk Hatirlatici</Label>
                    <p className="text-sm text-muted-foreground">
                      Her gun yoga yapmani hatirlat
                    </p>
                  </div>
                  <Switch
                    id="sessionReminders"
                    checked={preferences.sessionReminders}
                    onCheckedChange={(checked) => handleToggle('sessionReminders', checked)}
                    disabled={saving}
                  />
                </div>

                {/* New Program Alerts */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="newProgramAlerts">Yeni Icerik</Label>
                    <p className="text-sm text-muted-foreground">
                      Yeni dersler ve programlar hakkinda bilgilendir
                    </p>
                  </div>
                  <Switch
                    id="newProgramAlerts"
                    checked={preferences.newProgramAlerts}
                    onCheckedChange={(checked) => handleToggle('newProgramAlerts', checked)}
                    disabled={saving}
                  />
                </div>

                {/* Challenge Reminders */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="challengeReminders">Hedef Hatirlaticlari</Label>
                    <p className="text-sm text-muted-foreground">
                      Hedeflerine yaklastiginizda bilgilendir
                    </p>
                  </div>
                  <Switch
                    id="challengeReminders"
                    checked={preferences.challengeReminders}
                    onCheckedChange={(checked) => handleToggle('challengeReminders', checked)}
                    disabled={saving}
                  />
                </div>

                {/* Marketing Emails */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="marketingEmails">Promosyonlar</Label>
                    <p className="text-sm text-muted-foreground">
                      Ozel teklifler ve indirimler hakkinda bilgilendir
                    </p>
                  </div>
                  <Switch
                    id="marketingEmails"
                    checked={preferences.marketingEmails}
                    onCheckedChange={(checked) => handleToggle('marketingEmails', checked)}
                    disabled={saving}
                  />
                </div>

                {/* Weekly Progress */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="weeklyProgress">Haftalik Rapor</Label>
                    <p className="text-sm text-muted-foreground">
                      Haftalik ilerleme raporunu e-posta ile al
                    </p>
                  </div>
                  <Switch
                    id="weeklyProgress"
                    checked={preferences.weeklyProgress}
                    onCheckedChange={(checked) => handleToggle('weeklyProgress', checked)}
                    disabled={saving}
                  />
                </div>

                {/* Community Updates */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="communityUpdates">Topluluk Guncellemeleri</Label>
                    <p className="text-sm text-muted-foreground">
                      Topluluk aktiviteleri hakkinda bilgilendir
                    </p>
                  </div>
                  <Switch
                    id="communityUpdates"
                    checked={preferences.communityUpdates}
                    onCheckedChange={(checked) => handleToggle('communityUpdates', checked)}
                    disabled={saving}
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Tercihler yuklenemedi. Lutfen sayfayi yenileyin.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Channel Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Bildirim Kanallari</CardTitle>
            <CardDescription>Bildirimleri hangi kanallardan almak istediginizi secin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-6 w-11 rounded-full" />
                  </div>
                ))}
              </div>
            ) : preferences ? (
              <>
                {/* Push Notifications */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="pushEnabled">Push Bildirimleri</Label>
                    <p className="text-sm text-muted-foreground">
                      Mobil uygulama push bildirimleri
                    </p>
                  </div>
                  <Switch
                    id="pushEnabled"
                    checked={preferences.pushEnabled}
                    onCheckedChange={(checked) => handleToggle('pushEnabled', checked)}
                    disabled={saving}
                  />
                </div>

                {/* Email Notifications */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailEnabled">E-posta Bildirimleri</Label>
                    <p className="text-sm text-muted-foreground">
                      Onemli guncellemeler icin e-posta al
                    </p>
                  </div>
                  <Switch
                    id="emailEnabled"
                    checked={preferences.emailEnabled}
                    onCheckedChange={(checked) => handleToggle('emailEnabled', checked)}
                    disabled={saving}
                  />
                </div>

                {/* In-App Notifications */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="inAppEnabled">Uygulama Ici Bildirimler</Label>
                    <p className="text-sm text-muted-foreground">
                      Uygulama icerisinde bildirim goster
                    </p>
                  </div>
                  <Switch
                    id="inAppEnabled"
                    checked={preferences.inAppEnabled}
                    onCheckedChange={(checked) => handleToggle('inAppEnabled', checked)}
                    disabled={saving}
                  />
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle>Son Bildirimler</CardTitle>
            <CardDescription>Tum bildirimleriniz</CardDescription>
          </CardHeader>
          <CardContent>
            {notificationsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-4 p-4 border rounded-lg">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <IconBellOff className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground text-center max-w-md">
                  Henuz bildiriminiz yok. Yeni icerikler ve guncellemeler
                  hakkinda burada bilgilendirileceksiniz.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 border rounded-lg transition-colors ${
                      !notification.isRead ? 'bg-muted/50 border-primary/20' : ''
                    }`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{notification.title}</p>
                        {!notification.isRead && (
                          <Badge variant="secondary" className="text-xs">Yeni</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: tr })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleMarkAsRead(notification.id)}
                          title="Okundu olarak isaretle"
                        >
                          <IconCheck className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteNotification(notification.id)}
                        title="Sil"
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
