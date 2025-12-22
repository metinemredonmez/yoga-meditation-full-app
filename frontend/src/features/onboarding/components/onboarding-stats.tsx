'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IconLoader2,
  IconUsers,
  IconCheck,
  IconPercentage,
  IconClock,
  IconChartBar,
  IconTrendingUp,
  IconTrendingDown,
} from '@tabler/icons-react';
import { getOnboardingStats } from '@/lib/api';

interface FunnelStep {
  step: number;
  label: string;
  count: number;
  percentage: number;
}

interface PopularAnswer {
  value: string;
  label: string;
  count: number;
  percentage: number;
}

interface OnboardingStats {
  totalStarted: number;
  totalCompleted: number;
  completionRate: number;
  avgDuration: number;
  funnel: FunnelStep[];
  popularAnswers: Record<string, PopularAnswer[]>;
  trends: {
    startedChange: number;
    completedChange: number;
    rateChange: number;
  };
}

// Helper function to normalize popularAnswers from API
const normalizePopularAnswers = (
  apiData: Record<string, Record<string, number>> | undefined,
  total: number
): Record<string, PopularAnswer[]> => {
  if (!apiData) return {};
  const result: Record<string, PopularAnswer[]> = {};
  const labelMap: Record<string, string> = {
    BEGINNER: 'Yeni Başlıyorum',
    SOME: 'Biraz Deneyimim Var',
    INTERMEDIATE: 'Orta Seviye',
    ADVANCED: 'İleri Seviye',
    STRESS_RELIEF: 'Stres Azaltma',
    BETTER_SLEEP: 'Daha İyi Uyku',
    FOCUS: 'Odaklanma',
    FLEXIBILITY: 'Esneklik',
    ANXIETY: 'Kaygı Yönetimi',
    ENERGY: 'Enerji',
    MEDITATION: 'Meditasyon',
    YOGA: 'Yoga',
    BREATHWORK: 'Nefes',
    SLEEP: 'Uyku',
    SOUNDSCAPES: 'Doğa Sesleri',
    JOURNALING: 'Günlük',
    MORNING: 'Sabah',
    AFTERNOON: 'Öğlen',
    EVENING: 'Akşam',
    NIGHT: 'Gece',
    ANYTIME: 'Farketmez',
  };

  for (const [field, values] of Object.entries(apiData)) {
    if (typeof values === 'object' && values !== null) {
      result[field] = Object.entries(values).map(([key, count]) => ({
        value: key,
        label: labelMap[key] || key,
        count: count as number,
        percentage: total > 0 ? Math.round(((count as number) / total) * 100) : 0,
      }));
    }
  }
  return result;
};

export function OnboardingStatsView() {
  const [stats, setStats] = useState<OnboardingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOnboardingStats({ period });
      // Normalize API response to match expected format
      const totalStarted = data?.totalStarted || 0;
      const normalizedStats: OnboardingStats = {
        totalStarted,
        totalCompleted: data?.totalCompleted || 0,
        completionRate: data?.completionRate || 0,
        avgDuration: data?.avgDuration || 0,
        funnel: data?.stepDropoffs?.map((step: any) => ({
          step: step.step,
          label: step.label,
          count: step.count,
          percentage: totalStarted > 0 ? Math.round((step.count / totalStarted) * 100) : 0,
        })) || data?.funnel || [],
        popularAnswers: normalizePopularAnswers(data?.popularAnswers, totalStarted),
        trends: data?.trends || {
          startedChange: 0,
          completedChange: 0,
          rateChange: 0,
        },
      };
      setStats(normalizedStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Set mock data for demo
      setStats({
        totalStarted: 0,
        totalCompleted: 0,
        completionRate: 0,
        avgDuration: 0,
        funnel: [],
        popularAnswers: {},
        trends: {
          startedChange: 0,
          completedChange: 0,
          rateChange: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  }, [period]);

  // Helper function to normalize popularAnswers from API
  const normalizePopularAnswers = (
    apiData: Record<string, Record<string, number>> | undefined,
    total: number
  ): Record<string, PopularAnswer[]> => {
    if (!apiData) return {};
    const result: Record<string, PopularAnswer[]> = {};
    const labelMap: Record<string, string> = {
      BEGINNER: 'Yeni Başlıyorum',
      SOME: 'Biraz Deneyimim Var',
      INTERMEDIATE: 'Orta Seviye',
      ADVANCED: 'İleri Seviye',
      STRESS_RELIEF: 'Stres Azaltma',
      BETTER_SLEEP: 'Daha İyi Uyku',
      FOCUS: 'Odaklanma',
      FLEXIBILITY: 'Esneklik',
      ANXIETY: 'Kaygı Yönetimi',
      ENERGY: 'Enerji',
      MEDITATION: 'Meditasyon',
      YOGA: 'Yoga',
      BREATHWORK: 'Nefes',
      SLEEP: 'Uyku',
      SOUNDSCAPES: 'Doğa Sesleri',
      JOURNALING: 'Günlük',
      MORNING: 'Sabah',
      AFTERNOON: 'Öğlen',
      EVENING: 'Akşam',
      NIGHT: 'Gece',
      ANYTIME: 'Farketmez',
    };

    for (const [field, values] of Object.entries(apiData)) {
      if (typeof values === 'object' && values !== null) {
        result[field] = Object.entries(values).map(([key, count]) => ({
          value: key,
          label: labelMap[key] || key,
          count: count as number,
          percentage: total > 0 ? Math.round(((count as number) / total) * 100) : 0,
        }));
      }
    }
    return result;
  };

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) {
      return <IconTrendingUp className="h-4 w-4 text-green-500" />;
    } else if (value < 0) {
      return <IconTrendingDown className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-500';
    if (value < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        İstatistikler yüklenemedi
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div className="flex justify-end">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Son 7 Gün</SelectItem>
            <SelectItem value="30d">Son 30 Gün</SelectItem>
            <SelectItem value="90d">Son 90 Gün</SelectItem>
            <SelectItem value="all">Tüm Zamanlar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Toplam Başlayan</p>
                <p className="text-2xl font-bold">{stats.totalStarted.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(stats.trends.startedChange)}
                  <span className={`text-xs ${getTrendColor(stats.trends.startedChange)}`}>
                    {stats.trends.startedChange > 0 ? '+' : ''}{stats.trends.startedChange}%
                  </span>
                </div>
              </div>
              <IconUsers className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tamamlayan</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.totalCompleted.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(stats.trends.completedChange)}
                  <span className={`text-xs ${getTrendColor(stats.trends.completedChange)}`}>
                    {stats.trends.completedChange > 0 ? '+' : ''}{stats.trends.completedChange}%
                  </span>
                </div>
              </div>
              <IconCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tamamlanma Oranı</p>
                <p className="text-2xl font-bold text-violet-600">
                  %{stats.completionRate.toFixed(1)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(stats.trends.rateChange)}
                  <span className={`text-xs ${getTrendColor(stats.trends.rateChange)}`}>
                    {stats.trends.rateChange > 0 ? '+' : ''}{stats.trends.rateChange}%
                  </span>
                </div>
              </div>
              <IconPercentage className="h-8 w-8 text-violet-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ortalama Süre</p>
                <p className="text-2xl font-bold text-amber-600">
                  {formatDuration(stats.avgDuration)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">dakika:saniye</p>
              </div>
              <IconClock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconChartBar className="h-5 w-5" />
            Onboarding Hunisi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.funnel.map((step, index) => {
              const dropoff = index > 0
                ? stats.funnel[index - 1].count - step.count
                : 0;
              const dropoffRate = index > 0
                ? ((dropoff / stats.funnel[index - 1].count) * 100).toFixed(1)
                : 0;

              return (
                <div key={step.step} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{step.step}</Badge>
                      <span className="font-medium">{step.label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono">{step.count.toLocaleString()}</span>
                      <span className="text-muted-foreground w-16 text-right">
                        %{step.percentage}
                      </span>
                      {dropoff > 0 && (
                        <span className="text-red-500 text-xs w-20 text-right">
                          -{dropoff} (%{dropoffRate})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-8 bg-muted rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${step.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Popular Answers */}
      <div className="grid grid-cols-2 gap-6">
        {Object.entries(stats.popularAnswers).map(([field, answers]) => (
          <Card key={field}>
            <CardHeader>
              <CardTitle className="text-base">
                {field === 'experienceLevel' ? 'Deneyim Seviyesi' :
                 field === 'goals' ? 'Hedefler' :
                 field}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {answers.map((answer) => (
                  <div key={answer.value} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{answer.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-muted-foreground">
                          {answer.count}
                        </span>
                        <Badge variant="secondary">%{answer.percentage}</Badge>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${answer.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
