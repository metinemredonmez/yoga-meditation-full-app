'use client';
import { useEffect, useState } from 'react';
import { getContentAnalytics } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconLoader2 } from '@tabler/icons-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface ContentAnalyticsData {
  popularPrograms: { name: string; views: number; completions: number }[];
  popularClasses: { name: string; views: number; completions: number }[];
  classCompletionRate: { date: string; rate: number }[];
  averageSessionDuration: number;
  totalClassViews: number;
  totalCompletions: number;
}

export function ContentAnalytics() {
  const [data, setData] = useState<ContentAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getContentAnalytics(period);
      setData(result);
    } catch (error) {
      console.error('Failed to load content analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <IconLoader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex justify-end'>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className='w-[150px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='7d'>Last 7 days</SelectItem>
            <SelectItem value='30d'>Last 30 days</SelectItem>
            <SelectItem value='90d'>Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Total Class Views</CardDescription>
            <CardTitle className='text-3xl'>{(data?.totalClassViews || 0).toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Total Completions</CardDescription>
            <CardTitle className='text-3xl'>{(data?.totalCompletions || 0).toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Avg Session Duration</CardDescription>
            <CardTitle className='text-3xl'>{data?.averageSessionDuration || 0} min</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Popular Programs</CardTitle>
            <CardDescription>Most viewed programs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='h-[300px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={data?.popularPrograms || []} layout='vertical'>
                  <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                  <XAxis type='number' className='text-xs' />
                  <YAxis dataKey='name' type='category' className='text-xs' width={100} />
                  <Tooltip />
                  <Bar dataKey='views' fill='#6366f1' name='Views' radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Popular Classes</CardTitle>
            <CardDescription>Most viewed classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='h-[300px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={data?.popularClasses || []} layout='vertical'>
                  <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                  <XAxis type='number' className='text-xs' />
                  <YAxis dataKey='name' type='category' className='text-xs' width={100} />
                  <Tooltip />
                  <Bar dataKey='views' fill='#8b5cf6' name='Views' radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className='col-span-2'>
          <CardHeader>
            <CardTitle>Completion Rate Trend</CardTitle>
            <CardDescription>Class completion rate over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='h-[300px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <LineChart data={data?.classCompletionRate || []}>
                  <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                  <XAxis dataKey='date' className='text-xs' />
                  <YAxis className='text-xs' tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  <Line type='monotone' dataKey='rate' stroke='#22c55e' strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
