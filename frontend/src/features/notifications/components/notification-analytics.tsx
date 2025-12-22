'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  IconBell,
  IconTrendingUp,
  IconClock,
  IconX,
} from '@tabler/icons-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { getNotificationLogs, getNotificationStats } from '@/lib/api';
import { toast } from 'sonner';

interface NotificationLog {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  title: string;
  body: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  errorMessage?: string;
  sentAt?: string;
  createdAt: string;
}

interface StatsData {
  total: number;
  last24Hours: number;
  last7Days: number;
  byStatus: { status: string; count: number }[];
}

export function NotificationAnalytics() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        getNotificationLogs({ limit: 20 }),
        getNotificationStats(),
      ]);
      setLogs(logsRes.notifications || []);
      setStats(statsRes.stats || null);
    } catch (error) {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (statusFilter !== 'all' && log.status !== statusFilter) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300">Bekliyor</Badge>;
      case 'SENT':
        return <Badge className="bg-green-500/10 text-green-600">Gönderildi</Badge>;
      case 'DELIVERED':
        return <Badge className="bg-blue-500/10 text-blue-600">Teslim Edildi</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-500/10 text-red-600">Başarısız</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusCount = (status: string) => {
    if (!stats?.byStatus) return 0;
    const found = stats.byStatus.find(s => s.status === status);
    return found?.count || 0;
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
          <h2 className="text-2xl font-bold tracking-tight">Bildirim Analitikleri</h2>
          <p className="text-muted-foreground">Bildirim performansını izleyin</p>
        </div>
        <Button variant="outline" size="icon" onClick={loadData}>
          <IconRefresh className="h-4 w-4" />
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Bildirim</CardTitle>
            <IconSend className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total?.toLocaleString() || 0}</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <IconTrendingUp className="h-3 w-3 mr-1" />
              {stats?.last24Hours || 0} son 24 saat
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gönderilen</CardTitle>
            <IconCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{getStatusCount('SENT')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Başarılı gönderimler
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen</CardTitle>
            <IconClock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{getStatusCount('PENDING')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              İşlem bekliyor
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Başarısız</CardTitle>
            <IconX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{getStatusCount('FAILED')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Hatalı gönderimler
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Son Bildirimler</CardTitle>
              <CardDescription>Gönderilen bildirimlerin geçmişi</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="SENT">Gönderildi</SelectItem>
                <SelectItem value="PENDING">Bekliyor</SelectItem>
                <SelectItem value="FAILED">Başarısız</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <IconBell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Henüz bildirim yok</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bildirim</TableHead>
                  <TableHead>Alıcı</TableHead>
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
                        <p className="text-xs text-muted-foreground line-clamp-1">{log.body}</p>
                        {log.errorMessage && (
                          <p className="text-xs text-red-600">{log.errorMessage}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">
                          {log.user?.firstName} {log.user?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{log.user?.email}</p>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
