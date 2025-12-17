'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPodcastAnalytics, getAdminPodcastById } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  IconLoader2,
  IconArrowLeft,
  IconHeadphones,
  IconUsers,
  IconPlayerPlay,
  IconTrendingUp,
  IconClock,
  IconCalendar
} from '@tabler/icons-react';
import { toast } from 'sonner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subDays } from 'date-fns';
import { tr } from 'date-fns/locale';

interface PodcastAnalyticsProps {
  podcastId: string;
}

interface Analytics {
  overview: {
    totalListens: number;
    totalSubscribers: number;
    totalEpisodes: number;
    avgListenDuration: number;
    completionRate: number;
  };
  listensOverTime: Array<{ date: string; listens: number }>;
  topEpisodes: Array<{
    id: string;
    title: string;
    listens: number;
    completionRate: number;
  }>;
  subscriberGrowth: Array<{ date: string; subscribers: number }>;
  listenerRetention: Array<{ percentComplete: number; listeners: number }>;
}

const PERIOD_OPTIONS = [
  { value: '7d', label: 'Son 7 Gün' },
  { value: '30d', label: 'Son 30 Gün' },
  { value: '90d', label: 'Son 90 Gün' },
  { value: '365d', label: 'Son 1 Yıl' }
];

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export function PodcastAnalytics({ podcastId }: PodcastAnalyticsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [podcastTitle, setPodcastTitle] = useState('');
  const [period, setPeriod] = useState('30d');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    loadPodcast();
  }, [podcastId]);

  useEffect(() => {
    loadAnalytics();
  }, [podcastId, period]);

  const loadPodcast = async () => {
    try {
      const response = await getAdminPodcastById(podcastId);
      setPodcastTitle(response.podcast?.title || '');
    } catch (error) {
      console.error('Failed to load podcast:', error);
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const days = parseInt(period.replace('d', ''));
      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
      const endDate = format(new Date(), 'yyyy-MM-dd');

      const response = await getPodcastAnalytics(podcastId, { startDate, endDate });
      setAnalytics(response.analytics || generateMockData(days));
    } catch (error) {
      console.error('Failed to load analytics:', error);
      // Use mock data for demo
      setAnalytics(generateMockData(parseInt(period.replace('d', ''))));
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (days: number): Analytics => {
    const listensOverTime = [];
    const subscriberGrowth = [];
    let totalSubs = 150;

    for (let i = days; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      listensOverTime.push({
        date,
        listens: Math.floor(Math.random() * 200) + 50
      });
      totalSubs += Math.floor(Math.random() * 10);
      subscriberGrowth.push({
        date,
        subscribers: totalSubs
      });
    }

    return {
      overview: {
        totalListens: Math.floor(Math.random() * 50000) + 10000,
        totalSubscribers: totalSubs,
        totalEpisodes: Math.floor(Math.random() * 30) + 5,
        avgListenDuration: Math.floor(Math.random() * 20) + 10,
        completionRate: Math.floor(Math.random() * 30) + 50
      },
      listensOverTime,
      topEpisodes: [
        { id: '1', title: 'Sabah Meditasyonu', listens: 5420, completionRate: 78 },
        { id: '2', title: 'Stres Yönetimi', listens: 4180, completionRate: 65 },
        { id: '3', title: 'Uyku için Yoga Nidra', listens: 3950, completionRate: 82 },
        { id: '4', title: 'Nefes Teknikleri', listens: 3200, completionRate: 71 },
        { id: '5', title: 'Farkındalık Pratikleri', listens: 2800, completionRate: 69 }
      ],
      subscriberGrowth,
      listenerRetention: [
        { percentComplete: 25, listeners: 100 },
        { percentComplete: 50, listeners: 75 },
        { percentComplete: 75, listeners: 55 },
        { percentComplete: 100, listeners: 42 }
      ]
    };
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

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
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/podcasts')}
          >
            <IconArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Podcast Analitik</h2>
            <p className="text-muted-foreground">{podcastTitle}</p>
          </div>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Dönem" />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Dinleme</CardTitle>
            <IconHeadphones className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(analytics?.overview.totalListens || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aboneler</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(analytics?.overview.totalSubscribers || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bölümler</CardTitle>
            <IconPlayerPlay className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.overview.totalEpisodes || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ort. Dinleme Süresi</CardTitle>
            <IconClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.overview.avgListenDuration || 0} dk
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamamlama Oranı</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              %{analytics?.overview.completionRate || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Listens Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Dinleme Trendi</CardTitle>
            <CardDescription>Zamana göre dinleme sayısı</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.listensOverTime || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), 'dd MMM', { locale: tr })}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    labelFormatter={(value) => format(new Date(value), 'dd MMMM yyyy', { locale: tr })}
                    formatter={(value: number) => [value, 'Dinleme']}
                  />
                  <Area
                    type="monotone"
                    dataKey="listens"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Subscriber Growth */}
        <Card>
          <CardHeader>
            <CardTitle>Abone Büyümesi</CardTitle>
            <CardDescription>Zamana göre toplam abone sayısı</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.subscriberGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), 'dd MMM', { locale: tr })}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    labelFormatter={(value) => format(new Date(value), 'dd MMMM yyyy', { locale: tr })}
                    formatter={(value: number) => [value, 'Abone']}
                  />
                  <Area
                    type="monotone"
                    dataKey="subscribers"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Episodes */}
        <Card>
          <CardHeader>
            <CardTitle>En Popüler Bölümler</CardTitle>
            <CardDescription>En çok dinlenen 5 bölüm</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics?.topEpisodes || []}
                  layout="vertical"
                  margin={{ left: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis
                    dataKey="title"
                    type="category"
                    width={100}
                    className="text-xs"
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip formatter={(value: number) => [value, 'Dinleme']} />
                  <Bar dataKey="listens" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Listener Retention */}
        <Card>
          <CardHeader>
            <CardTitle>Dinleyici Tutma</CardTitle>
            <CardDescription>Bölüm tamamlama oranları</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.listenerRetention || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="listeners"
                    nameKey="percentComplete"
                    label={({ percentComplete, listeners }) =>
                      `%${percentComplete}: ${listeners}`
                    }
                  >
                    {(analytics?.listenerRetention || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value} dinleyici`,
                      `%${name} tamamladı`
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
