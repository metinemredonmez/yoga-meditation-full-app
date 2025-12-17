'use client';
import { useEffect, useState } from 'react';
import { getRealtimeAnalytics } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconUsers, IconCurrencyLira, IconActivity, IconTrendingUp, IconTrendingDown, IconLoader2 } from '@tabler/icons-react';

interface RealtimeStats {
  activeUsers: number;
  activeUsersTrend: number;
  dau: number;
  wau: number;
  mau: number;
  mrr: number;
  mrrTrend: number;
  arr: number;
  retentionRate: number;
  churnRate: number;
}

export function AnalyticsCards() {
  const [stats, setStats] = useState<RealtimeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const data = await getRealtimeAnalytics();
      setStats(data);
    } catch (error) {
      console.error('Failed to load realtime stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className='pb-2'>
              <div className='h-4 w-24 bg-muted animate-pulse rounded' />
            </CardHeader>
            <CardContent>
              <div className='h-8 w-16 bg-muted animate-pulse rounded' />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const TrendBadge = ({ value }: { value: number }) => (
    <Badge variant='outline' className={value >= 0 ? 'text-green-500' : 'text-red-500'}>
      {value >= 0 ? <IconTrendingUp className='h-3 w-3 mr-1' /> : <IconTrendingDown className='h-3 w-3 mr-1' />}
      {Math.abs(value).toFixed(1)}%
    </Badge>
  );

  return (
    <div className='space-y-4'>
      {/* Main metrics */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Active Users</CardTitle>
            <IconActivity className='h-4 w-4 text-green-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{formatNumber(stats?.activeUsers || 0)}</div>
            <div className='flex items-center gap-2 mt-1'>
              <TrendBadge value={stats?.activeUsersTrend || 0} />
              <span className='text-xs text-muted-foreground'>vs last hour</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>MRR</CardTitle>
            <IconCurrencyLira className='h-4 w-4 text-blue-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>₺{formatNumber(stats?.mrr || 0)}</div>
            <div className='flex items-center gap-2 mt-1'>
              <TrendBadge value={stats?.mrrTrend || 0} />
              <span className='text-xs text-muted-foreground'>vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Retention Rate</CardTitle>
            <IconUsers className='h-4 w-4 text-purple-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{(stats?.retentionRate || 0).toFixed(1)}%</div>
            <p className='text-xs text-muted-foreground mt-1'>30-day retention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Churn Rate</CardTitle>
            <IconTrendingDown className='h-4 w-4 text-red-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{(stats?.churnRate || 0).toFixed(1)}%</div>
            <p className='text-xs text-muted-foreground mt-1'>Monthly churn</p>
          </CardContent>
        </Card>
      </div>

      {/* User engagement metrics */}
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Daily Active Users (DAU)</CardDescription>
            <CardTitle className='text-3xl'>{formatNumber(stats?.dau || 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Weekly Active Users (WAU)</CardDescription>
            <CardTitle className='text-3xl'>{formatNumber(stats?.wau || 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Monthly Active Users (MAU)</CardDescription>
            <CardTitle className='text-3xl'>{formatNumber(stats?.mau || 0)}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
