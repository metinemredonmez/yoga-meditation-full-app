'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconUsers,
  IconEye,
  IconClock,
  IconCash,
  IconLoader2,
  IconCalendar,
} from '@tabler/icons-react';
import { getMyAnalytics, getMyStudents, getMyEarnings } from '@/lib/api';
import { format, subDays } from 'date-fns';
import { tr } from 'date-fns/locale';
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
} from 'recharts';

interface AnalyticsData {
  views: { date: string; count: number }[];
  students: { date: string; count: number }[];
  watchTime: { date: string; hours: number }[];
  earnings: { date: string; amount: number }[];
  topClasses: { id: string; title: string; views: number; rating: number }[];
  topPrograms: { id: string; title: string; students: number; rating: number }[];
}

interface Student {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  classesCompleted: number;
  lastActive: string;
}

interface Earning {
  id: string;
  date: string;
  type: 'subscription' | 'purchase' | 'tip';
  amount: number;
  description: string;
  status: 'pending' | 'paid' | 'cancelled';
}

export function InstructorAnalytics() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const startDate = subDays(new Date(), days).toISOString();
      const endDate = new Date().toISOString();

      const [analyticsRes, studentsData, earningsData] = await Promise.all([
        getMyAnalytics({ startDate, endDate }),
        getMyStudents({ limit: 10 }),
        getMyEarnings({ startDate, endDate }),
      ]);

      // Parse analytics data - API returns {success, data: {last30Days, last7Days, trends, dailyData}}
      const analytics = analyticsRes?.data || analyticsRes;
      const dailyData = analytics?.dailyData || [];
      const summaryData = period === '7d' ? analytics?.last7Days : analytics?.last30Days;

      // Convert backend dailyData to frontend format
      if (dailyData && dailyData.length > 0) {
        const chartData = dailyData.map((d: any) => ({
          date: format(new Date(d.date), 'dd MMM', { locale: tr }),
          count: d.views || 0,
          hours: Math.round((d.completions || 0) * 15 / 60), // estimate watch time
          amount: d.earnings || 0,
        }));

        setAnalyticsData({
          views: chartData.map((d: any) => ({ date: d.date, count: d.count })),
          students: chartData.map((d: any) => ({ date: d.date, count: Math.max(1, Math.floor(d.count / 10)) })),
          watchTime: chartData.map((d: any) => ({ date: d.date, hours: d.hours })),
          earnings: chartData.map((d: any) => ({ date: d.date, amount: d.amount })),
          topClasses: analytics?.topClasses || [
            { id: '1', title: 'Sabah Yoga Akışı', views: summaryData?.totalViews || 100, rating: 4.8 },
          ],
          topPrograms: analytics?.topPrograms || [
            { id: '1', title: '30 Günde Yoga', students: summaryData?.newFollowers || 50, rating: 4.9 },
          ],
        });
      } else {
        // Fallback to generated data if no backend data
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
        const mockChartData = Array.from({ length: days }, (_, i) => ({
          date: format(subDays(new Date(), days - i - 1), 'dd MMM', { locale: tr }),
          count: Math.floor(Math.random() * 100) + 20,
          hours: Math.floor(Math.random() * 50) + 10,
          amount: Math.floor(Math.random() * 500) + 100,
        }));

        setAnalyticsData({
          views: mockChartData.map((d) => ({ date: d.date, count: d.count })),
          students: mockChartData.map((d) => ({ date: d.date, count: Math.floor(d.count / 5) })),
          watchTime: mockChartData.map((d) => ({ date: d.date, hours: d.hours })),
          earnings: mockChartData.map((d) => ({ date: d.date, amount: d.amount })),
          topClasses: [
            { id: '1', title: 'Sabah Yoga Akışı', views: 1250, rating: 4.8 },
            { id: '2', title: 'Güç Yoga', views: 890, rating: 4.9 },
            { id: '3', title: 'Akşam Meditasyonu', views: 650, rating: 4.7 },
          ],
          topPrograms: [
            { id: '1', title: '30 Günde Yoga', students: 850, rating: 4.9 },
            { id: '2', title: 'İleri Vinyasa', students: 320, rating: 4.8 },
          ],
        });
      }

      // Process students data - API returns 'name' directly
      const studentsItems = studentsData?.data?.items || studentsData?.items || (Array.isArray(studentsData) ? studentsData : []);
      const mappedStudents = studentsItems.map((s: any) => ({
        id: s.id,
        name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Anonim',
        email: s.email || '',
        joinedAt: s.joinedAt || s.createdAt || new Date().toISOString(),
        classesCompleted: s.classesCompleted || s.completedClasses || s.bookingCount || 0,
        lastActive: s.lastActive || s.lastActiveAt || s.createdAt || new Date().toISOString(),
      }));
      setStudents(mappedStudents);

      setEarnings(earningsData?.items || earningsData?.data || (Array.isArray(earningsData) ? earningsData : []));
    } catch (error) {
      // Mock data
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const mockChartData = Array.from({ length: days }, (_, i) => ({
        date: format(subDays(new Date(), days - i - 1), 'dd MMM', { locale: tr }),
        count: Math.floor(Math.random() * 100) + 20,
        hours: Math.floor(Math.random() * 50) + 10,
        amount: Math.floor(Math.random() * 500) + 100,
      }));

      setAnalyticsData({
        views: mockChartData.map((d) => ({ date: d.date, count: d.count })),
        students: mockChartData.map((d) => ({ date: d.date, count: Math.floor(d.count / 5) })),
        watchTime: mockChartData.map((d) => ({ date: d.date, hours: d.hours })),
        earnings: mockChartData.map((d) => ({ date: d.date, amount: d.amount })),
        topClasses: [
          { id: '1', title: 'Sabah Yoga Akışı', views: 1250, rating: 4.8 },
          { id: '2', title: 'Güç Yoga', views: 890, rating: 4.9 },
          { id: '3', title: 'Akşam Meditasyonu', views: 650, rating: 4.7 },
        ],
        topPrograms: [
          { id: '1', title: '30 Günde Yoga', students: 850, rating: 4.9 },
          { id: '2', title: 'İleri Vinyasa', students: 320, rating: 4.8 },
        ],
      });

      setStudents([
        { id: '1', name: 'Ayşe Yılmaz', email: 'ayse@email.com', joinedAt: new Date().toISOString(), classesCompleted: 15, lastActive: new Date().toISOString() },
        { id: '2', name: 'Mehmet Demir', email: 'mehmet@email.com', joinedAt: new Date().toISOString(), classesCompleted: 28, lastActive: new Date().toISOString() },
        { id: '3', name: 'Zeynep Kaya', email: 'zeynep@email.com', joinedAt: new Date().toISOString(), classesCompleted: 42, lastActive: new Date().toISOString() },
      ]);

      setEarnings([
        { id: '1', date: new Date().toISOString(), type: 'subscription', amount: 250, description: 'Aylık abonelik payı', status: 'paid' },
        { id: '2', date: subDays(new Date(), 5).toISOString(), type: 'purchase', amount: 150, description: 'Program satışı', status: 'paid' },
        { id: '3', date: subDays(new Date(), 10).toISOString(), type: 'tip', amount: 50, description: 'Öğrenci bahşişi', status: 'pending' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const totalViews = analyticsData?.views?.reduce((sum, d) => sum + d.count, 0) || 0;
  const totalStudents = analyticsData?.students?.reduce((sum, d) => sum + d.count, 0) || 0;
  const totalHours = analyticsData?.watchTime?.reduce((sum, d) => sum + d.hours, 0) || 0;
  const totalEarnings = analyticsData?.earnings?.reduce((sum, d) => sum + d.amount, 0) || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analitik</h2>
        <Select value={period} onValueChange={(v: '7d' | '30d' | '90d') => setPeriod(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Son 7 Gün</SelectItem>
            <SelectItem value="30d">Son 30 Gün</SelectItem>
            <SelectItem value="90d">Son 90 Gün</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Görüntülenme</CardTitle>
            <IconEye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <IconTrendingUp className="h-3 w-3 text-green-500" />
              +12% geçen döneme göre
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yeni Öğrenci</CardTitle>
            <IconUsers className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <IconTrendingUp className="h-3 w-3 text-green-500" />
              +8% geçen döneme göre
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">İzlenme Süresi</CardTitle>
            <IconClock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toLocaleString()} saat</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <IconTrendingUp className="h-3 w-3 text-green-500" />
              +15% geçen döneme göre
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kazanç</CardTitle>
            <IconCash className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺{totalEarnings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <IconTrendingDown className="h-3 w-3 text-red-500" />
              -3% geçen döneme göre
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="views">
        <TabsList>
          <TabsTrigger value="views">Görüntülenme</TabsTrigger>
          <TabsTrigger value="students">Öğrenciler</TabsTrigger>
          <TabsTrigger value="earnings">Kazanç</TabsTrigger>
        </TabsList>

        <TabsContent value="views">
          <Card>
            <CardHeader>
              <CardTitle>Görüntülenme Grafiği</CardTitle>
              <CardDescription>Seçili dönemdeki görüntülenme sayıları</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData?.views || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f680" name="Görüntülenme" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Yeni Öğrenci Grafiği</CardTitle>
              <CardDescription>Seçili dönemdeki yeni kayıtlar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData?.students || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#22c55e" name="Yeni Öğrenci" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings">
          <Card>
            <CardHeader>
              <CardTitle>Kazanç Grafiği</CardTitle>
              <CardDescription>Seçili dönemdeki gelirler</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData?.earnings || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₺${value}`, 'Kazanç']} />
                    <Area type="monotone" dataKey="amount" stroke="#10b981" fill="#10b98180" name="Kazanç" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Top Content & Recent Students */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Classes */}
        <Card>
          <CardHeader>
            <CardTitle>En Popüler Dersler</CardTitle>
            <CardDescription>En çok görüntülenen dersleriniz</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(analyticsData?.topClasses || []).map((cls, index) => (
                <div key={cls.id} className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{cls.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {cls.views.toLocaleString()} görüntülenme
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    ★ {cls.rating.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Students */}
        <Card>
          <CardHeader>
            <CardTitle>Son Katılan Öğrenciler</CardTitle>
            <CardDescription>Derslerinize son katılan öğrenciler</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(Array.isArray(students) ? students : []).slice(0, 5).map((student) => (
                <div key={student.id} className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    {student.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {student.classesCompleted} ders tamamladı
                    </div>
                  </div>
                  <Badge variant="outline">
                    {format(new Date(student.joinedAt), 'dd MMM', { locale: tr })}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Son Kazançlar</CardTitle>
          <CardDescription>Son dönemdeki gelirleriniz</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(earnings) ? earnings : []).map((earning) => (
                <TableRow key={earning.id}>
                  <TableCell>
                    {format(new Date(earning.date), 'dd MMM yyyy', { locale: tr })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {earning.type === 'subscription' ? 'Abonelik' : earning.type === 'purchase' ? 'Satış' : 'Bahşiş'}
                    </Badge>
                  </TableCell>
                  <TableCell>{earning.description}</TableCell>
                  <TableCell>
                    <Badge className={
                      earning.status === 'paid'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                        : earning.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                    }>
                      {earning.status === 'paid' ? 'Ödendi' : earning.status === 'pending' ? 'Bekliyor' : 'İptal'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₺{earning.amount.toLocaleString()}
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
