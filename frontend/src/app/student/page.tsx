'use client';

import { useEffect, useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getCurrentUser } from '@/lib/auth';
import { getProgressSummary, getFavoriteCounts, getVideoProgress, getUserGoals } from '@/lib/api';
import { IconHeart, IconHistory, IconTarget, IconClock, IconFlame, IconCheck, IconDownload } from '@tabler/icons-react';

interface ProgressSummary {
  totalMinutes: number;
  streak: number;
  completed: number;
  inProgress: number;
}

interface FavoriteCounts {
  programs: number;
  poses: number;
  classes: number;
  total: number;
}

interface Goal {
  id: string;
  title: string;
  type: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  isActive: boolean;
}

interface WatchHistoryItem {
  id: string;
  lessonId: string;
  lessonType: string;
  percentage: number;
  completed: boolean;
  lastWatchedAt: string;
  lesson?: {
    title?: string;
    name?: string;
  };
}

export default function StudentDashboardPage() {
  const [user, setUser] = useState<{ firstName?: string; lastName?: string; email: string } | null>(null);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [favorites, setFavorites] = useState<FavoriteCounts | null>(null);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = getCurrentUser();
        setUser(currentUser);

        // Load all data in parallel
        const [progressData, favoritesData, historyData, goalsData] = await Promise.allSettled([
          getProgressSummary(),
          getFavoriteCounts(),
          getVideoProgress({ limit: 5 }),
          getUserGoals({ limit: 5 }),
        ]);

        if (progressData.status === 'fulfilled') {
          setProgress(progressData.value.summary || progressData.value);
        }
        if (favoritesData.status === 'fulfilled') {
          setFavorites(favoritesData.value.counts || favoritesData.value);
        }
        if (historyData.status === 'fulfilled') {
          setWatchHistory(historyData.value.items || []);
        }
        if (goalsData.status === 'fulfilled') {
          setGoals(goalsData.value.goals || goalsData.value.data || []);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const userName = user?.firstName || 'Kullanici';

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes} dk`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} saat ${mins} dk` : `${hours} saat`;
  };

  return (
    <PageContainer scrollable>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Hos Geldin, {userName}!</h2>
          <p className="text-muted-foreground">
            Yoga yolculugunuzda size eslik etmekten mutluluk duyuyoruz.
          </p>
        </div>

        {/* Info Card - Mobile App */}
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <IconDownload className="h-5 w-5" />
              Mobil Uygulama
            </CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">
              Tum iceriklere erismek icin mobil uygulamamizi indirin!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Yoga dersleri, meditasyonlar, nefes egzersizleri ve daha fazlasi icin
              App Store veya Google Play&apos;den uygulamamizi indirin.
            </p>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Sure</CardTitle>
              <IconClock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {progress ? formatMinutes(progress.totalMinutes) : '0 dk'}
                  </div>
                  <p className="text-xs text-muted-foreground">Toplam pratik suresi</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Seri</CardTitle>
              <IconFlame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-orange-500">
                    {progress?.streak || 0} gun
                  </div>
                  <p className="text-xs text-muted-foreground">Gunluk seri</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favorilerim</CardTitle>
              <IconHeart className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{favorites?.total || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {favorites?.programs || 0} program, {favorites?.classes || 0} ders
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
              <IconCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-600">
                    {progress?.completed || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {progress?.inProgress || 0} devam eden
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Content Sections */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Watch History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconHistory className="h-5 w-5" />
                Son Izlediklerim
              </CardTitle>
              <CardDescription>Kaldiginiz yerden devam edin</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : watchHistory.length > 0 ? (
                <div className="space-y-3">
                  {watchHistory.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {item.lesson?.title || item.lesson?.name || `Ders #${item.lessonId.slice(0, 8)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.lessonType === 'CLASS' ? 'Ders' : 'Program'} - %{Math.round(item.percentage)}
                        </p>
                      </div>
                      {item.completed ? (
                        <IconCheck className="h-5 w-5 text-green-500" />
                      ) : (
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Henuz izleme gecmisiniz bulunmuyor. Mobil uygulamadan derslere goz atin!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Active Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconTarget className="h-5 w-5" />
                Hedeflerim
              </CardTitle>
              <CardDescription>Aktif hedefleriniz ve ilerlemeniz</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : goals.length > 0 ? (
                <div className="space-y-3">
                  {goals.filter(g => g.isActive).slice(0, 4).map((goal) => {
                    const progress = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;
                    return (
                      <div
                        key={goal.id}
                        className="p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{goal.title}</p>
                          <span className="text-sm text-muted-foreground">
                            {goal.currentValue}/{goal.targetValue} {goal.unit}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Henuz hedef belirlememissiniz. Mobil uygulamadan hedef ekleyebilirsiniz.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
