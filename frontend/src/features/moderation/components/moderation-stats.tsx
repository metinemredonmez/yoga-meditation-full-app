'use client';
import { useEffect, useState } from 'react';
import { getModerationStats } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconAlertTriangle, IconMessageCircle, IconFlag, IconShield, IconLoader2 } from '@tabler/icons-react';
import { toast } from 'sonner';

interface ModerationStats {
  pendingReports: number;
  resolvedToday: number;
  totalReports: number;
  flaggedComments: number;
  bannedUsersToday: number;
  warningsSentToday: number;
}

export function ModerationStats() {
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getModerationStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load moderation stats:', error);
      toast.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <IconLoader2 className='h-6 w-6 animate-spin' />
      </div>
    );
  }

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Pending Reports</CardTitle>
          <IconAlertTriangle className='h-4 w-4 text-yellow-500' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{stats?.pendingReports || 0}</div>
          <p className='text-xs text-muted-foreground'>Requires attention</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Resolved Today</CardTitle>
          <IconShield className='h-4 w-4 text-green-500' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{stats?.resolvedToday || 0}</div>
          <p className='text-xs text-muted-foreground'>Reports handled</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Flagged Comments</CardTitle>
          <IconMessageCircle className='h-4 w-4 text-orange-500' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{stats?.flaggedComments || 0}</div>
          <p className='text-xs text-muted-foreground'>Need review</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Actions Today</CardTitle>
          <IconFlag className='h-4 w-4 text-blue-500' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            {(stats?.bannedUsersToday || 0) + (stats?.warningsSentToday || 0)}
          </div>
          <p className='text-xs text-muted-foreground'>
            {stats?.bannedUsersToday || 0} bans, {stats?.warningsSentToday || 0} warnings
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
