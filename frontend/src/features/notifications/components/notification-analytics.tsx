'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IconLoader2,
  IconRefresh,
  IconSend,
  IconCheck,
  IconX,
  IconMail,
  IconBell,
  IconDeviceMobile,
  IconEye,
  IconClick,
  IconTrendingUp,
  IconTrendingDown,
  IconChartBar,
  IconCalendar,
} from '@tabler/icons-react';
import { format, formatDistanceToNow, subDays } from 'date-fns';
import { tr } from 'date-fns/locale';

interface NotificationLog {
  id: string;
  type: 'PUSH' | 'EMAIL' | 'SMS' | 'IN_APP';
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'FAILED' | 'BOUNCED';
  recipient: {
    id: string;
    email: string;
    name: string;
  };
  title: string;
  channel: string;
  templateSlug?: string;
  campaignId?: string;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  error?: string;
  createdAt: string;
}

interface AnalyticsData {
  overview: {
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    totalFailed: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
  };
  byChannel: {
    channel: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
  }[];
  byDay: {
    date: string;
    sent: number;
    delivered: number;
    opened: number;
  }[];
}

const mockLogs: NotificationLog[] = [
  {
    id: '1',
    type: 'PUSH',
    status: 'DELIVERED',
    recipient: { id: '1', email: 'user1@example.com', name: 'Ahmet Yılmaz' },
    title: 'Dersiniz başlıyor!',
    channel: 'push',
    sentAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    deliveredAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: '2',
    type: 'EMAIL',
    status: 'OPENED',
    recipient: { id: '2', email: 'user2@example.com', name: 'Ayşe Demir' },
    title: 'Haftalık özet',
    channel: 'email',
    templateSlug: 'weekly-summary',
    sentAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    deliveredAt: new Date(Date.now() - 1000 * 60 * 29).toISOString(),
    openedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '3',
    type: 'PUSH',
    status: 'FAILED',
    recipient: { id: '3', email: 'user3@example.com', name: 'Mehmet Kaya' },
    title: 'Challenge hatırlatıcı',
    channel: 'push',
    error: 'Device token expired',
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: '4',
    type: 'EMAIL',
    status: 'BOUNCED',
    recipient: { id: '4', email: 'invalid@example.com', name: 'Test User' },
    title: 'Hoş geldiniz',
    channel: 'email',
    templateSlug: 'welcome',
    error: 'Email address does not exist',
    sentAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: '5',
    type: 'IN_APP',
    status: 'CLICKED',
    recipient: { id: '5', email: 'user5@example.com', name: 'Zeynep Özkan' },
    title: 'Yeni program eklendi',
    channel: 'inApp',
    campaignId: 'camp-123',
    sentAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    deliveredAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    openedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
];

const mockAnalytics: AnalyticsData = {
  overview: {
    totalSent: 15420,
    totalDelivered: 14892,
    totalOpened: 8234,
    totalClicked: 2156,
    totalFailed: 528,
    deliveryRate: 96.6,
    openRate: 55.3,
    clickRate: 26.2,
  },
  byChannel: [
    { channel: 'push', sent: 8500, delivered: 8200, opened: 5100, clicked: 1200, failed: 300 },
    { channel: 'email', sent: 5200, delivered: 5000, opened: 2800, clicked: 850, failed: 200 },
    { channel: 'inApp', sent: 1720, delivered: 1692, opened: 334, clicked: 106, failed: 28 },
  ],
  byDay: Array.from({ length: 7 }, (_, i) => ({
    date: subDays(new Date(), 6 - i).toISOString(),
    sent: Math.floor(Math.random() * 500) + 1500,
    delivered: Math.floor(Math.random() * 450) + 1450,
    opened: Math.floor(Math.random() * 300) + 800,
  })),
};

export function NotificationAnalytics() {
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('7d');
  const [logs, setLogs] = useState<NotificationLog[]>(mockLogs);
  const [analytics, setAnalytics] = useState<AnalyticsData>(mockAnalytics);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredLogs = logs.filter(log => {
    if (statusFilter !== 'all' && log.status !== statusFilter) return false;
    if (typeFilter !== 'all' && log.type !== typeFilter) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300">Bekliyor</Badge>;
      case 'SENT':
        return <Badge variant="outline" className="text-blue-600 border-blue-300">Gönderildi</Badge>;
      case 'DELIVERED':
        return <Badge className="bg-green-500/10 text-green-600">Teslim Edildi</Badge>;
      case 'OPENED':
        return <Badge className="bg-purple-500/10 text-purple-600">Açıldı</Badge>;
      case 'CLICKED':
        return <Badge className="bg-indigo-500/10 text-indigo-600">Tıklandı</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-500/10 text-red-600">Başarısız</Badge>;
      case 'BOUNCED':
        return <Badge className="bg-orange-500/10 text-orange-600">Geri Döndü</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PUSH':
        return <IconDeviceMobile className="h-4 w-4 text-green-500" />;
      case 'EMAIL':
        return <IconMail className="h-4 w-4 text-blue-500" />;
      case 'SMS':
        return <IconDeviceMobile className="h-4 w-4 text-purple-500" />;
      case 'IN_APP':
        return <IconBell className="h-4 w-4 text-orange-500" />;
      default:
        return <IconBell className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bildirim Analitikleri</h2>
          <p className="text-muted-foreground">Bildirim performansını izleyin</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Son 24 Saat</SelectItem>
              <SelectItem value="7d">Son 7 Gün</SelectItem>
              <SelectItem value="30d">Son 30 Gün</SelectItem>
              <SelectItem value="90d">Son 90 Gün</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <IconRefresh className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gönderim</CardTitle>
            <IconSend className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalSent.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <IconTrendingUp className="h-3 w-3 mr-1" />
              +12% geçen haftaya göre
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teslim Oranı</CardTitle>
            <IconCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.overview.deliveryRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.overview.totalDelivered.toLocaleString()} teslim edildi
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Açılma Oranı</CardTitle>
            <IconEye className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{analytics.overview.openRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.overview.totalOpened.toLocaleString()} açıldı
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tıklanma Oranı</CardTitle>
            <IconClick className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{analytics.overview.clickRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.overview.totalClicked.toLocaleString()} tıklandı
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Channel Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Kanal Performansı</CardTitle>
          <CardDescription>Bildirim kanallarına göre performans</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kanal</TableHead>
                <TableHead className="text-right">Gönderilen</TableHead>
                <TableHead className="text-right">Teslim</TableHead>
                <TableHead className="text-right">Açılan</TableHead>
                <TableHead className="text-right">Tıklanan</TableHead>
                <TableHead className="text-right">Başarısız</TableHead>
                <TableHead className="text-right">Teslim Oranı</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.byChannel.map((channel) => (
                <TableRow key={channel.channel}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {channel.channel === 'push' && <IconDeviceMobile className="h-4 w-4 text-green-500" />}
                      {channel.channel === 'email' && <IconMail className="h-4 w-4 text-blue-500" />}
                      {channel.channel === 'inApp' && <IconBell className="h-4 w-4 text-orange-500" />}
                      <span className="capitalize">{channel.channel}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{channel.sent.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-green-600">{channel.delivered.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-purple-600">{channel.opened.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-indigo-600">{channel.clicked.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-red-600">{channel.failed.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-medium">
                    {((channel.delivered / channel.sent) * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Son Bildirimler</CardTitle>
              <CardDescription>Gönderilen bildirimlerin geçmişi</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Tür" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="PUSH">Push</SelectItem>
                  <SelectItem value="EMAIL">E-posta</SelectItem>
                  <SelectItem value="IN_APP">Uygulama İçi</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="DELIVERED">Teslim Edildi</SelectItem>
                  <SelectItem value="OPENED">Açıldı</SelectItem>
                  <SelectItem value="CLICKED">Tıklandı</SelectItem>
                  <SelectItem value="FAILED">Başarısız</SelectItem>
                  <SelectItem value="BOUNCED">Geri Döndü</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bildirim</TableHead>
                <TableHead>Alıcı</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Zaman</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{log.title}</p>
                      {log.templateSlug && (
                        <p className="text-xs text-muted-foreground font-mono">{log.templateSlug}</p>
                      )}
                      {log.error && (
                        <p className="text-xs text-red-600">{log.error}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{log.recipient.name}</p>
                      <p className="text-xs text-muted-foreground">{log.recipient.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(log.type)}
                      <span className="text-sm">{log.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: tr })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
