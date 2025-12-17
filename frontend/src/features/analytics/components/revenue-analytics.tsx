'use client';
import { useEffect, useState } from 'react';
import { getRevenueAnalytics } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconLoader2, IconCurrencyLira } from '@tabler/icons-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

interface RevenueAnalyticsData {
  revenue: { date: string; amount: number }[];
  revenueByPlan: { plan: string; amount: number }[];
  paymentMethods: { method: string; count: number }[];
  refunds: { date: string; amount: number }[];
  totalRevenue: number;
  totalRefunds: number;
  netRevenue: number;
}

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];

export function RevenueAnalytics() {
  const [data, setData] = useState<RevenueAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getRevenueAnalytics(period);
      setData(result);
    } catch (error) {
      console.error('Failed to load revenue analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => `₺${value.toLocaleString()}`;

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
            <SelectItem value='1y'>Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className='text-2xl flex items-center gap-1'>
              <IconCurrencyLira className='h-5 w-5' />
              {(data?.totalRevenue || 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Total Refunds</CardDescription>
            <CardTitle className='text-2xl flex items-center gap-1 text-red-500'>
              <IconCurrencyLira className='h-5 w-5' />
              {(data?.totalRefunds || 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Net Revenue</CardDescription>
            <CardTitle className='text-2xl flex items-center gap-1 text-green-500'>
              <IconCurrencyLira className='h-5 w-5' />
              {(data?.netRevenue || 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <Card className='col-span-2'>
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
            <CardDescription>Daily revenue trend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='h-[300px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <AreaChart data={data?.revenue || []}>
                  <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                  <XAxis dataKey='date' className='text-xs' />
                  <YAxis className='text-xs' tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Area type='monotone' dataKey='amount' stroke='#22c55e' fill='#22c55e' fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Plan</CardTitle>
            <CardDescription>Breakdown by subscription tier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='h-[300px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={data?.revenueByPlan || []}
                    cx='50%'
                    cy='50%'
                    innerRadius={60}
                    outerRadius={100}
                    dataKey='amount'
                    nameKey='plan'
                    label={({ plan }) => plan}
                  >
                    {(data?.revenueByPlan || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Transactions by payment type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='h-[300px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={data?.paymentMethods || []}>
                  <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                  <XAxis dataKey='method' className='text-xs' />
                  <YAxis className='text-xs' />
                  <Tooltip />
                  <Bar dataKey='count' fill='#6366f1' radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
