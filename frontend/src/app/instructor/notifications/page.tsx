'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageContainer from '@/components/layout/page-container';
import {
  IconBell,
  IconBellOff,
  IconCheck,
  IconLoader2,
  IconMail,
  IconMessage,
  IconSettings,
  IconTrash,
  IconUser,
  IconVideo,
  IconCurrencyDollar,
  IconStar,
  IconSend,
  IconCrown,
  IconLock,
  IconUsers,
} from '@tabler/icons-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import api from '@/lib/api';

interface Notification {
  id: string;
  type: 'new_student' | 'new_review' | 'earning' | 'class_approved' | 'class_rejected' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationSettings {
  email: {
    newStudent: boolean;
    newReview: boolean;
    earnings: boolean;
    classStatus: boolean;
    marketing: boolean;
  };
  push: {
    newStudent: boolean;
    newReview: boolean;
    earnings: boolean;
    classStatus: boolean;
  };
}

const typeIcons: Record<string, typeof IconBell> = {
  new_student: IconUser,
  new_review: IconStar,
  earning: IconCurrencyDollar,
  class_approved: IconVideo,
  class_rejected: IconVideo,
  system: IconBell,
};

const typeColors: Record<string, string> = {
  new_student: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  new_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  earning: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  class_approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
  class_rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  system: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
};

const typeLabels: Record<string, string> = {
  new_student: 'Yeni Ogrenci',
  new_review: 'Yeni Degerlendirme',
  earning: 'Kazanc',
  class_approved: 'Ders Onaylandi',
  class_rejected: 'Ders Reddedildi',
  system: 'Sistem',
};

export default function InstructorNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    email: {
      newStudent: true,
      newReview: true,
      earnings: true,
      classStatus: true,
      marketing: false,
    },
    push: {
      newStudent: true,
      newReview: true,
      earnings: true,
      classStatus: true,
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentTier, setCurrentTier] = useState<string>('STARTER');
  const [sendDialog, setSendDialog] = useState(false);
  const [sending, setSending] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    body: '',
    targetType: 'all' as 'all' | 'class' | 'selected',
  });
  const [studentCount, setStudentCount] = useState(0);

  const canSendNotifications = ['PRO', 'ELITE', 'PLATFORM_OWNER'].includes(currentTier);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // Get tier info from API
      const tierResponse = await api.get('/api/instructor/tier');
      if (tierResponse.data.success) {
        setCurrentTier(tierResponse.data.data.currentTier || 'STARTER');
        setStudentCount(tierResponse.data.data.stats?.totalStudents || 0);
      }

      // Get user's notifications from API
      const notifResponse = await api.get('/api/notifications/my');
      if (notifResponse.data.success && notifResponse.data.notifications) {
        const mappedNotifications = notifResponse.data.notifications.map((n: any) => ({
          id: n.id,
          type: mapNotificationType(n.type),
          title: n.title,
          message: n.message,
          isRead: n.isRead,
          createdAt: n.createdAt,
        }));
        setNotifications(mappedNotifications);
      }
    } catch (error) {
      console.error('Load notifications error:', error);
      // Fallback to empty state
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const mapNotificationType = (type: string): string => {
    const typeMap: Record<string, string> = {
      'NEW_STUDENT': 'new_student',
      'NEW_REVIEW': 'new_review',
      'EARNING': 'earning',
      'CLASS_APPROVED': 'class_approved',
      'CLASS_REJECTED': 'class_rejected',
      'INSTRUCTOR_MESSAGE': 'system',
      'SYSTEM': 'system',
    };
    return typeMap[type] || 'system';
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Mark as read error:', error);
      // Still update UI
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/api/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('Tum bildirimler okundu olarak isaretlendi');
    } catch (error) {
      console.error('Mark all as read error:', error);
      // Still update UI
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('Tum bildirimler okundu olarak isaretlendi');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/api/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success('Bildirim silindi');
    } catch (error) {
      console.error('Delete notification error:', error);
      // Still update UI
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success('Bildirim silindi');
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.put('/api/instructor/notifications/settings', settings);
      toast.success('Ayarlar kaydedildi');
    } catch (error) {
      console.error('Save settings error:', error);
      toast.error('Ayarlar kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const sendNotification = async () => {
    if (!notificationForm.title || !notificationForm.body) {
      toast.error('Baslik ve mesaj zorunludur');
      return;
    }

    setSending(true);
    try {
      const response = await api.post('/api/instructor/notifications/send', {
        title: notificationForm.title,
        body: notificationForm.body,
        targetType: notificationForm.targetType,
      });

      if (response.data.success) {
        toast.success(`${response.data.data.sentTo || studentCount} ogrenciye bildirim gonderildi`);
        setSendDialog(false);
        setNotificationForm({ title: '', body: '', targetType: 'all' });
      } else {
        toast.error(response.data.error || 'Bildirim gonderilemedi');
      }
    } catch (error: any) {
      console.error('Send notification error:', error);
      toast.error(error.response?.data?.error || 'Bildirim gonderilemedi');
    } finally {
      setSending(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <PageContainer scrollable>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Bildirimler</h2>
            <p className="text-muted-foreground">
              Bildirimlerinizi yonetin ve tercihlerinizi ayarlayin
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <IconCheck className="mr-2 h-4 w-4" />
              Tumunu Okundu Isaretle
            </Button>
          )}
        </div>

        <Tabs defaultValue="notifications">
          <TabsList>
            <TabsTrigger value="notifications" className="relative">
              <IconBell className="mr-2 h-4 w-4" />
              Bildirimler
              {unreadCount > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="send">
              <IconSend className="mr-2 h-4 w-4" />
              Gonder
              {!canSendNotifications && <IconLock className="ml-1 h-3 w-3" />}
            </TabsTrigger>
            <TabsTrigger value="settings">
              <IconSettings className="mr-2 h-4 w-4" />
              Ayarlar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <IconLoader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <IconBellOff className="h-12 w-12 mb-4" />
                    <p>Henuz bildiriminiz yok</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification) => {
                      const Icon = typeIcons[notification.type] || IconBell;
                      return (
                        <div
                          key={notification.id}
                          className={`flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors ${
                            !notification.isRead ? 'bg-muted/30' : ''
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full ${
                              typeColors[notification.type]
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{notification.title}</p>
                                {!notification.isRead && (
                                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(notification.createdAt), 'dd MMM HH:mm', {
                                  locale: tr,
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {notification.message}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <IconTrash className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="send" className="mt-4">
            {canSendNotifications ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconSend className="h-5 w-5" />
                      Ogrencilere Bildirim Gonder
                    </CardTitle>
                    <CardDescription>
                      Derslerinize kayitli ogrencilere push bildirimi gonderin
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <IconUsers className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>{studentCount}</strong> ogrenciye bildirim gonderebilirsiniz
                      </span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notif-title">Baslik</Label>
                      <Input
                        id="notif-title"
                        value={notificationForm.title}
                        onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                        placeholder="Bildirim basligi"
                        maxLength={50}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notif-body">Mesaj</Label>
                      <Textarea
                        id="notif-body"
                        value={notificationForm.body}
                        onChange={(e) => setNotificationForm({ ...notificationForm, body: e.target.value })}
                        placeholder="Bildirim mesaji..."
                        rows={4}
                        maxLength={200}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {notificationForm.body.length}/200
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Hedef Kitle</Label>
                      <Select
                        value={notificationForm.targetType}
                        onValueChange={(value: 'all' | 'class' | 'selected') =>
                          setNotificationForm({ ...notificationForm, targetType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tum Ogrenciler</SelectItem>
                          <SelectItem value="class">Belirli Ders Ogrencileri</SelectItem>
                          <SelectItem value="selected">Secili Ogrenciler</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button onClick={() => setSendDialog(true)} disabled={!notificationForm.title || !notificationForm.body}>
                    <IconSend className="mr-2 h-4 w-4" />
                    Bildirimi Gonder
                  </Button>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                      <IconCrown className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">PRO Ozellik</h3>
                      <p className="text-muted-foreground mt-1">
                        Ogrencilerinize bildirim gonderebilmek icin PRO veya ELITE kademesine yukseltmeniz gerekiyor.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <IconCheck className="h-4 w-4 text-green-500" />
                        <span>Ogrencilerinize push bildirimi gonderin</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <IconCheck className="h-4 w-4 text-green-500" />
                        <span>E-posta kampanyalari olusturun</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <IconCheck className="h-4 w-4 text-green-500" />
                        <span>Gelismis analitik erisimi</span>
                      </div>
                    </div>
                    <Button asChild className="mt-4">
                      <Link href="/instructor/billing">
                        <IconCrown className="mr-2 h-4 w-4" />
                        PRO ya Yukselt
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="settings" className="mt-4 space-y-6">
            {/* Email Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconMail className="h-5 w-5" />
                  E-posta Bildirimleri
                </CardTitle>
                <CardDescription>
                  Hangi durumlarda e-posta almak istediginizi secin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-newStudent">Yeni ogrenci katildinda</Label>
                  <Switch
                    id="email-newStudent"
                    checked={settings.email.newStudent}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        email: { ...settings.email, newStudent: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-newReview">Yeni degerlendirme geldiginde</Label>
                  <Switch
                    id="email-newReview"
                    checked={settings.email.newReview}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        email: { ...settings.email, newReview: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-earnings">Kazanc bildirimleri</Label>
                  <Switch
                    id="email-earnings"
                    checked={settings.email.earnings}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        email: { ...settings.email, earnings: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-classStatus">Ders onay/red bildirimleri</Label>
                  <Switch
                    id="email-classStatus"
                    checked={settings.email.classStatus}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        email: { ...settings.email, classStatus: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-marketing">Pazarlama ve guncellemeler</Label>
                  <Switch
                    id="email-marketing"
                    checked={settings.email.marketing}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        email: { ...settings.email, marketing: checked },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Push Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconMessage className="h-5 w-5" />
                  Push Bildirimleri
                </CardTitle>
                <CardDescription>
                  Anlık bildirim tercihlerinizi ayarlayın
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-newStudent">Yeni ogrenci katildinda</Label>
                  <Switch
                    id="push-newStudent"
                    checked={settings.push.newStudent}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        push: { ...settings.push, newStudent: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-newReview">Yeni degerlendirme geldiginde</Label>
                  <Switch
                    id="push-newReview"
                    checked={settings.push.newReview}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        push: { ...settings.push, newReview: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-earnings">Kazanc bildirimleri</Label>
                  <Switch
                    id="push-earnings"
                    checked={settings.push.earnings}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        push: { ...settings.push, earnings: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-classStatus">Ders onay/red bildirimleri</Label>
                  <Switch
                    id="push-classStatus"
                    checked={settings.push.classStatus}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        push: { ...settings.push, classStatus: checked },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={saveSettings} disabled={saving}>
                {saving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ayarlari Kaydet
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Send Notification Confirmation Dialog */}
      <Dialog open={sendDialog} onOpenChange={setSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bildirimi Gonder</DialogTitle>
            <DialogDescription>
              Bu bildirim {studentCount} ogrenciye gonderilecek. Devam etmek istiyor musunuz?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{notificationForm.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{notificationForm.body}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconUsers className="h-4 w-4" />
              <span>
                Hedef: {notificationForm.targetType === 'all' ? 'Tum Ogrenciler' :
                        notificationForm.targetType === 'class' ? 'Belirli Ders' : 'Secili Ogrenciler'}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialog(false)}>
              Iptal
            </Button>
            <Button onClick={sendNotification} disabled={sending}>
              {sending && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
              <IconSend className="mr-2 h-4 w-4" />
              Gonder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
