'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  IconUsers,
  IconVideo,
  IconBook,
  IconCash,
  IconTrendingUp,
  IconEye,
  IconStar,
  IconClock
} from '@tabler/icons-react';
import { getInstructorDashboard } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

interface InstructorStats {
  totalClasses: number;
  totalPrograms: number;
  totalStudents: number;
  totalViews: number;
  totalEarnings: number;
  averageRating: number;
  totalHoursWatched: number;
  pendingReviews: number;
  classesThisMonth: number;
  studentsThisMonth: number;
}

export function InstructorStats() {
  const [stats, setStats] = useState<InstructorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getInstructorDashboard();
      setStats(data);
    } catch (error) {
      // Mock data for development
      setStats({
        totalClasses: 24,
        totalPrograms: 5,
        totalStudents: 1250,
        totalViews: 45000,
        totalEarnings: 12500,
        averageRating: 4.8,
        totalHoursWatched: 3200,
        pendingReviews: 3,
        classesThisMonth: 4,
        studentsThisMonth: 180,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-32 mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Toplam Ders',
      value: stats?.totalClasses || 0,
      description: `Bu ay ${stats?.classesThisMonth || 0} yeni ders`,
      icon: IconVideo,
      color: 'text-blue-600',
    },
    {
      title: 'Toplam Program',
      value: stats?.totalPrograms || 0,
      description: `${stats?.pendingReviews || 0} onay bekliyor`,
      icon: IconBook,
      color: 'text-purple-600',
    },
    {
      title: 'Toplam Öğrenci',
      value: stats?.totalStudents?.toLocaleString() || 0,
      description: `Bu ay ${stats?.studentsThisMonth || 0} yeni öğrenci`,
      icon: IconUsers,
      color: 'text-green-600',
    },
    {
      title: 'Toplam Görüntülenme',
      value: stats?.totalViews?.toLocaleString() || 0,
      description: 'Tüm içerikler',
      icon: IconEye,
      color: 'text-orange-600',
    },
    {
      title: 'Toplam Kazanç',
      value: `₺${stats?.totalEarnings?.toLocaleString() || 0}`,
      description: 'Bu ay',
      icon: IconCash,
      color: 'text-emerald-600',
    },
    {
      title: 'Ortalama Puan',
      value: stats?.averageRating?.toFixed(1) || '0.0',
      description: 'Öğrenci değerlendirmeleri',
      icon: IconStar,
      color: 'text-yellow-600',
    },
    {
      title: 'İzlenme Süresi',
      value: `${stats?.totalHoursWatched?.toLocaleString() || 0} saat`,
      description: 'Toplam izlenme',
      icon: IconClock,
      color: 'text-cyan-600',
    },
    {
      title: 'Büyüme',
      value: '+12%',
      description: 'Geçen aya göre',
      icon: IconTrendingUp,
      color: 'text-pink-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
