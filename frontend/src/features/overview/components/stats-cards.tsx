'use client';

import { useEffect, useState } from 'react';
import { getDashboardStats } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter
} from '@/components/ui/card';
import { IconTrendingDown, IconTrendingUp, IconUsers, IconYoga, IconReceipt, IconCash, IconBroadcast } from '@tabler/icons-react';
import { Icons } from '@/components/icons';
import { useSocket } from '@/context/socket-context';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalPrograms: number;
  totalClasses: number;
  totalRevenue: number;
  newUsersThisMonth: number;
  growthRate: number;
}

export function StatsCards() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { dashboardStats, isConnected } = useSocket();

  useEffect(() => {
    loadStats();
  }, []);

  // Update stats when real-time data arrives
  useEffect(() => {
    if (dashboardStats) {
      setStats((prev) => ({
        ...prev,
        totalUsers: dashboardStats.totalUsers ?? prev?.totalUsers ?? 0,
        activeSubscriptions: dashboardStats.activeSubscriptions ?? prev?.activeSubscriptions ?? 0,
        totalRevenue: dashboardStats.totalRevenue ?? prev?.totalRevenue ?? 0,
        newUsersThisMonth: dashboardStats.newSignups ?? prev?.newUsersThisMonth ?? 0,
        totalPrograms: prev?.totalPrograms ?? 0,
        totalClasses: prev?.totalClasses ?? 0,
        growthRate: prev?.growthRate ?? 0,
      }));
    }
  }, [dashboardStats]);

  const loadStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className='@container/card animate-pulse'>
            <CardHeader>
              <div className='h-4 bg-muted rounded w-24 mb-2'></div>
              <div className='h-8 bg-muted rounded w-32'></div>
            </CardHeader>
            <CardFooter>
              <div className='h-4 bg-muted rounded w-full'></div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('tr-TR').format(num);
  };

  return (
    <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
      <Card className='@container/card'>
        <CardHeader>
          <CardDescription className='flex items-center gap-2'>
            <IconUsers className='h-4 w-4' />
            Total Users
          </CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            {formatNumber(stats?.totalUsers || 0)}
          </CardTitle>
          <CardAction>
            <Badge variant='outline' className='truncate max-w-[130px]'>
              <IconTrendingUp className='h-3 w-3 shrink-0' />
              <span className='truncate'>+{stats?.newUsersThisMonth || 0}</span>
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            Active users on platform
          </div>
          <div className='text-muted-foreground'>
            Includes all registered accounts
          </div>
        </CardFooter>
      </Card>

      <Card className='@container/card'>
        <CardHeader>
          <CardDescription className='flex items-center gap-2'>
            <IconReceipt className='h-4 w-4' />
            Active Subscriptions
          </CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            {formatNumber(stats?.activeSubscriptions || 0)}
          </CardTitle>
          <CardAction>
            <Badge variant='outline' className='truncate max-w-[120px]'>
              <IconTrendingUp className='h-3 w-3 shrink-0' />
              <span className='truncate'>Premium</span>
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            Paying customers <IconTrendingUp className='size-4' />
          </div>
          <div className='text-muted-foreground'>
            Monthly & yearly plans
          </div>
        </CardFooter>
      </Card>

      <Card className='@container/card'>
        <CardHeader>
          <CardDescription className='flex items-center gap-2'>
            <IconYoga className='h-4 w-4' />
            Total Programs
          </CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            {formatNumber(stats?.totalPrograms || 0)}
          </CardTitle>
          <CardAction>
            <Badge variant='outline' className='truncate max-w-[100px]'>
              <span className='truncate'>{stats?.totalClasses || 0} classes</span>
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            Yoga, Pilates & Meditation
          </div>
          <div className='text-muted-foreground'>
            Available content library
          </div>
        </CardFooter>
      </Card>

      <Card className='@container/card'>
        <CardHeader>
          <CardDescription className='flex items-center gap-2'>
            <IconCash className='h-4 w-4' />
            Total Revenue
          </CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            {formatCurrency(stats?.totalRevenue || 0)}
          </CardTitle>
          <CardAction>
            <Badge variant='outline' className='truncate max-w-[80px]'>
              {stats?.growthRate !== undefined && stats.growthRate >= 0 ? (
                <>
                  <IconTrendingUp className='h-3 w-3 shrink-0' />
                  <span>+{stats.growthRate.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <IconTrendingDown className='h-3 w-3 shrink-0' />
                  <span>{stats?.growthRate?.toFixed(1)}%</span>
                </>
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            {stats?.growthRate !== undefined && stats.growthRate >= 0 ? (
              <>Trending up <IconTrendingUp className='size-4' /></>
            ) : (
              <>Trending down <IconTrendingDown className='size-4' /></>
            )}
          </div>
          <div className='text-muted-foreground'>
            All-time earnings
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
