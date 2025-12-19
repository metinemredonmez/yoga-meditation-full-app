'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  IconBrain,
  IconWind,
  IconMusic,
  IconMoon,
  IconClock,
  IconQuote,
  IconCalendar,
  IconArrowRight,
  IconLoader2,
  IconPlus,
  IconBook,
  IconPlaylist,
  IconMoodSmile,
  IconTarget,
} from '@tabler/icons-react';
import {
  getMeditationStats,
  getBreathworkStats,
  getSoundscapeStats,
  getSleepStoryStats,
  getTimerPresetStats,
  getDailyQuoteStats,
  getJournalPromptStats,
} from '@/lib/api';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface StatsCard {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  href: string;
  color: string;
  subValue?: string;
}

interface RecentItem {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  isActive: boolean;
}

const QUICK_LINKS = [
  { title: 'Meditasyonlar', href: '/dashboard/wellness/meditations', icon: IconBrain, color: 'bg-violet-500' },
  { title: 'Nefes Egzersizleri', href: '/dashboard/wellness/breathwork', icon: IconWind, color: 'bg-cyan-500' },
  { title: 'Sesler', href: '/dashboard/wellness/soundscapes', icon: IconMusic, color: 'bg-emerald-500' },
  { title: 'Uyku Hikayeleri', href: '/dashboard/wellness/sleep-stories', icon: IconMoon, color: 'bg-indigo-500' },
  { title: 'Zamanlayıcılar', href: '/dashboard/wellness/timer', icon: IconClock, color: 'bg-amber-500' },
  { title: 'Günlük Sözler', href: '/dashboard/wellness/daily-quotes', icon: IconQuote, color: 'bg-pink-500' },
  { title: 'Günlük İçerik', href: '/dashboard/wellness/daily-content', icon: IconCalendar, color: 'bg-rose-500' },
  { title: 'Günlük Soruları', href: '/dashboard/journal/prompts', icon: IconBook, color: 'bg-orange-500' },
];

export function WellnessOverview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsCard[]>([]);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const [
        meditationStats,
        breathworkStats,
        soundscapeStats,
        sleepStats,
        timerStats,
        quoteStats,
        journalStats,
      ] = await Promise.all([
        getMeditationStats().catch(() => ({ total: 0, published: 0 })),
        getBreathworkStats().catch(() => ({ total: 0, published: 0 })),
        getSoundscapeStats().catch(() => ({ total: 0, published: 0 })),
        getSleepStoryStats().catch(() => ({ total: 0, published: 0 })),
        getTimerPresetStats().catch(() => ({ total: 0, active: 0 })),
        getDailyQuoteStats().catch(() => ({ total: 0, active: 0 })),
        getJournalPromptStats().catch(() => ({ total: 0, active: 0 })),
      ]);

      setStats([
        {
          title: 'Meditasyonlar',
          value: meditationStats.total || 0,
          icon: <IconBrain className="h-5 w-5" />,
          href: '/dashboard/wellness/meditations',
          color: 'text-violet-500',
          subValue: `${meditationStats.published || 0} yayında`,
        },
        {
          title: 'Nefes Egzersizi',
          value: breathworkStats.total || 0,
          icon: <IconWind className="h-5 w-5" />,
          href: '/dashboard/wellness/breathwork',
          color: 'text-cyan-500',
          subValue: `${breathworkStats.published || 0} yayında`,
        },
        {
          title: 'Sesler',
          value: soundscapeStats.total || 0,
          icon: <IconMusic className="h-5 w-5" />,
          href: '/dashboard/wellness/soundscapes',
          color: 'text-emerald-500',
          subValue: `${soundscapeStats.published || 0} yayında`,
        },
        {
          title: 'Uyku Hikayeleri',
          value: sleepStats.total || 0,
          icon: <IconMoon className="h-5 w-5" />,
          href: '/dashboard/wellness/sleep-stories',
          color: 'text-indigo-500',
          subValue: `${sleepStats.published || 0} yayında`,
        },
        {
          title: 'Zamanlayıcılar',
          value: timerStats.total || 0,
          icon: <IconClock className="h-5 w-5" />,
          href: '/dashboard/wellness/timer',
          color: 'text-amber-500',
          subValue: `${timerStats.active || 0} aktif`,
        },
        {
          title: 'Günlük Sözler',
          value: quoteStats.total || 0,
          icon: <IconQuote className="h-5 w-5" />,
          href: '/dashboard/wellness/daily-quotes',
          color: 'text-pink-500',
          subValue: `${quoteStats.active || 0} aktif`,
        },
        {
          title: 'Günlük Soruları',
          value: journalStats.total || 0,
          icon: <IconBook className="h-5 w-5" />,
          href: '/dashboard/journal/prompts',
          color: 'text-orange-500',
          subValue: `${journalStats.active || 0} aktif`,
        },
      ]);
    } catch (error) {
      console.error('Failed to load wellness stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.slice(0, 4).map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={stat.color}>{stat.icon}</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.subValue && (
                  <p className="text-xs text-muted-foreground">{stat.subValue}</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Second Row Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.slice(4).map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={stat.color}>{stat.icon}</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.subValue && (
                  <p className="text-xs text-muted-foreground">{stat.subValue}</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Links & Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hızlı Erişim</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {QUICK_LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                >
                  <div className={`${link.color} p-1.5 rounded mr-3`}>
                    <link.icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm">{link.title}</span>
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hızlı İşlemler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/wellness/meditations/new">
              <Button className="w-full justify-start" variant="outline">
                <IconPlus className="h-4 w-4 mr-2" />
                Yeni Meditasyon Ekle
              </Button>
            </Link>
            <Link href="/dashboard/wellness/breathwork/new">
              <Button className="w-full justify-start" variant="outline">
                <IconPlus className="h-4 w-4 mr-2" />
                Yeni Nefes Egzersizi Ekle
              </Button>
            </Link>
            <Link href="/dashboard/wellness/soundscapes/new">
              <Button className="w-full justify-start" variant="outline">
                <IconPlus className="h-4 w-4 mr-2" />
                Yeni Ses Ekle
              </Button>
            </Link>
            <Link href="/dashboard/wellness/daily-content">
              <Button className="w-full justify-start" variant="outline">
                <IconCalendar className="h-4 w-4 mr-2" />
                Günlük İçerik Planla
              </Button>
            </Link>
            <Link href="/dashboard/playlists/new">
              <Button className="w-full justify-start" variant="outline">
                <IconPlaylist className="h-4 w-4 mr-2" />
                Yeni Playlist Oluştur
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Related Modules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">İlgili Modüller</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/dashboard/playlists">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                      <IconPlaylist className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-medium">Playlistler</h4>
                      <p className="text-xs text-muted-foreground">İçerik koleksiyonları</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/user-content/moods">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-pink-100 dark:bg-pink-900/30 p-2 rounded-lg">
                      <IconMoodSmile className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                      <h4 className="font-medium">Mood Kayıtları</h4>
                      <p className="text-xs text-muted-foreground">Kullanıcı duygu durumları</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/user-content/goals">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                      <IconTarget className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-medium">Kullanıcı Hedefleri</h4>
                      <p className="text-xs text-muted-foreground">Hedef takibi</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
