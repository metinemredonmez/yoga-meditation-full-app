'use client';

import { useEffect, useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { IconHistory, IconClock, IconFlame, IconCalendar, IconCheck, IconVideo, IconLayoutGrid, IconPlayerPlay, IconRefresh } from '@tabler/icons-react';
import { getProgressSummary, getVideoProgress } from '@/lib/api';
import { toast } from 'sonner';

interface ProgressSummary {
  totalMinutes: number;
  streak: number;
  completed: number;
  inProgress: number;
  activeDays?: number;
}

interface WatchHistoryItem {
  id: string;
  lessonId: string;
  lessonType: string;
  percentage: number;
  completed: boolean;
  lastWatchedAt: string;
  watchedMinutes?: number;
  lesson?: {
    id?: string;
    title?: string;
    name?: string;
    duration?: number;
    thumbnailUrl?: string;
  };
}

export default function StudentHistoryPage() {
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [progressRes, historyRes] = await Promise.allSettled([
        getProgressSummary(),
        getVideoProgress({ limit: 50 }),
      ]);

      if (progressRes.status === 'fulfilled') {
        setProgress(progressRes.value.summary || progressRes.value);
      }
      if (historyRes.status === 'fulfilled') {
        setHistory(historyRes.value.items || historyRes.value.data || []);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      toast.error('Gecmis yuklenemedi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadData(true);
    toast.success('Gecmis yenilendi');
  };

  const formatMinutes = (minutes: number) => {
    if (!minutes) return '0 dk';
    if (minutes < 60) return `${minutes} dk`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} saat ${mins} dk` : `${hours} saat`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Bugun';
    if (diffDays === 1) return 'Dun';
    if (diffDays < 7) return `${diffDays} gun once`;
    return date.toLocaleDateString('tr-TR');
  };

  const getItemTitle = (item: WatchHistoryItem) => {
    return item.lesson?.title || item.lesson?.name || `Ders #${item.lessonId.slice(0, 8)}`;
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'CLASS':
        return <IconVideo className="h-5 w-5 text-primary" />;
      case 'PROGRAM':
        return <IconLayoutGrid className="h-5 w-5 text-primary" />;
      default:
        return <IconPlayerPlay className="h-5 w-5 text-primary" />;
    }
  };

  const completedItems = history.filter(h => h.completed);
  const inProgressItems = history.filter(h => !h.completed);

  return (
    <PageContainer scrollable>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Izleme Gecmisim</h2>
            <p className="text-muted-foreground">
              Tamamladiginiz ve izlediginiz icerikler burada listelenir.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <IconRefresh className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
        </div>

        {/* Stats */}
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
                    {formatMinutes(progress?.totalMinutes || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Toplam pratik suresi</p>
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
                    {progress?.completed || completedItems.length}
                  </div>
                  <p className="text-xs text-muted-foreground">Tamamlanan icerik</p>
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
                  <p className="text-xs text-muted-foreground">Mevcut seri</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Devam Eden</CardTitle>
              <IconCalendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {progress?.inProgress || inProgressItems.length}
                  </div>
                  <p className="text-xs text-muted-foreground">Devam eden icerik</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* In Progress Section */}
        {inProgressItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconPlayerPlay className="h-5 w-5" />
                Devam Edenler
              </CardTitle>
              <CardDescription>Kaldiginiz yerden devam edin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inProgressItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        {getItemIcon(item.lessonType)}
                      </div>
                      <div>
                        <p className="font-medium">{getItemTitle(item)}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.lessonType === 'CLASS' ? 'Ders' : 'Program'} - {formatDate(item.lastWatchedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium">%{Math.round(item.percentage)}</p>
                        {item.watchedMinutes && (
                          <p className="text-xs text-muted-foreground">{item.watchedMinutes} dk</p>
                        )}
                      </div>
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completed Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconHistory className="h-5 w-5" />
              {completedItems.length > 0 ? 'Tamamlananlar' : 'Son Aktiviteler'}
            </CardTitle>
            <CardDescription>
              {completedItems.length > 0
                ? 'Tamamladiginiz icerikler'
                : 'Son izlediginiz ve tamamladiginiz icerikler'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : completedItems.length > 0 ? (
              <div className="space-y-3">
                {completedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                        {getItemIcon(item.lessonType)}
                      </div>
                      <div>
                        <p className="font-medium">{getItemTitle(item)}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.lessonType === 'CLASS' ? 'Ders' : 'Program'} - {formatDate(item.lastWatchedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.watchedMinutes && (
                        <span className="text-sm text-muted-foreground">{item.watchedMinutes} dk</span>
                      )}
                      <IconCheck className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <IconHistory className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground text-center max-w-md">
                  Henuz bir icerik izlemediniz. Mobil uygulamadan derslere
                  baslayin ve ilerlemenizi burada takip edin.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Henuz tamamlanan icerik yok.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
