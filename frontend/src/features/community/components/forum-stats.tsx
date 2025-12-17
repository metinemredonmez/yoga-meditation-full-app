'use client';

import { useEffect, useState } from 'react';
import { getForumStats, getForumCategories, getForumTopics } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  IconUsers,
  IconMessage,
  IconFolder,
  IconEye,
  IconTrendingUp,
  IconLoader2,
  IconMessageCircle,
} from '@tabler/icons-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import Link from 'next/link';

interface ForumStats {
  totalTopics: number;
  totalPosts: number;
  totalCategories: number;
  totalUsers: number;
  totalViews: number;
  topicsToday: number;
  postsToday: number;
}

interface RecentTopic {
  id: string;
  title: string;
  slug: string;
  viewCount: number;
  replyCount: number;
  createdAt: string;
  author?: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  category?: {
    name: string;
    color: string;
  };
}

interface Category {
  id: string;
  name: string;
  color: string;
  _count?: {
    topics: number;
  };
}

export function ForumStats() {
  const [stats, setStats] = useState<ForumStats | null>(null);
  const [recentTopics, setRecentTopics] = useState<RecentTopic[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, categoriesData, topicsData] = await Promise.all([
        getForumStats(),
        getForumCategories(),
        getForumTopics({ limit: 5, sortField: 'createdAt', sortOrder: 'desc' }),
      ]);

      setStats(statsData.data);
      setCategories(categoriesData.data || []);
      setRecentTopics(topicsData.data || []);
    } catch (error) {
      console.error('Failed to load forum stats:', error);
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
    <div className='space-y-6'>
      {/* Stats Cards */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription className='flex items-center gap-2'>
              <IconMessage className='h-4 w-4' />
              Toplam Konu
            </CardDescription>
            <CardTitle className='text-2xl'>{stats?.totalTopics?.toLocaleString() || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-xs text-muted-foreground'>
              <span className='text-green-600'>+{stats?.topicsToday || 0}</span> bugün
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardDescription className='flex items-center gap-2'>
              <IconMessageCircle className='h-4 w-4' />
              Toplam Yanıt
            </CardDescription>
            <CardTitle className='text-2xl'>{stats?.totalPosts?.toLocaleString() || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-xs text-muted-foreground'>
              <span className='text-green-600'>+{stats?.postsToday || 0}</span> bugün
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardDescription className='flex items-center gap-2'>
              <IconFolder className='h-4 w-4' />
              Kategoriler
            </CardDescription>
            <CardTitle className='text-2xl'>{stats?.totalCategories || categories.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-xs text-muted-foreground'>Aktif kategoriler</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardDescription className='flex items-center gap-2'>
              <IconEye className='h-4 w-4' />
              Toplam Görüntülenme
            </CardDescription>
            <CardTitle className='text-2xl'>{stats?.totalViews?.toLocaleString() || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-xs text-muted-foreground'>Tüm zamanlar</p>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        {/* Recent Topics */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <IconTrendingUp className='h-5 w-5' />
              Son Konular
            </CardTitle>
            <CardDescription>En son açılan konular</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {recentTopics.length === 0 ? (
                <p className='text-sm text-muted-foreground text-center py-4'>
                  Henüz konu yok
                </p>
              ) : (
                recentTopics.map((topic) => (
                  <div key={topic.id} className='flex items-start justify-between gap-4'>
                    <div className='flex-1 min-w-0'>
                      <Link
                        href={`/dashboard/community/topics/${topic.id}`}
                        className='font-medium text-sm hover:underline line-clamp-1'
                      >
                        {topic.title}
                      </Link>
                      <div className='flex items-center gap-2 mt-1'>
                        {topic.category && (
                          <Badge
                            variant='outline'
                            className='text-xs'
                            style={{ borderColor: topic.category.color, color: topic.category.color }}
                          >
                            {topic.category.name}
                          </Badge>
                        )}
                        <span className='text-xs text-muted-foreground'>
                          {formatDistanceToNow(new Date(topic.createdAt), {
                            addSuffix: true,
                            locale: tr,
                          })}
                        </span>
                      </div>
                    </div>
                    <div className='flex items-center gap-3 text-xs text-muted-foreground'>
                      <span className='flex items-center gap-1'>
                        <IconMessage className='h-3 w-3' />
                        {topic.replyCount || 0}
                      </span>
                      <span className='flex items-center gap-1'>
                        <IconEye className='h-3 w-3' />
                        {topic.viewCount}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Categories Overview */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <IconFolder className='h-5 w-5' />
              Kategoriler
            </CardTitle>
            <CardDescription>Konu sayısına göre kategoriler</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {categories.length === 0 ? (
                <p className='text-sm text-muted-foreground text-center py-4'>
                  Henüz kategori yok
                </p>
              ) : (
                categories.slice(0, 6).map((category) => (
                  <div key={category.id} className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <div
                        className='h-3 w-3 rounded-full'
                        style={{ backgroundColor: category.color || '#3b82f6' }}
                      />
                      <span className='text-sm font-medium'>{category.name}</span>
                    </div>
                    <Badge variant='secondary'>
                      {category._count?.topics || 0} konu
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
