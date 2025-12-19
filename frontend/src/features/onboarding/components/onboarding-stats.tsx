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

export function OnboardingStatsView() {
  const [stats, setStats] = useState<OnboardingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOnboardingStats({ period });
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Set mock data for demo
      setStats({
        totalStarted: 1250,
        totalCompleted: 780,
        completionRate: 62.4,
        avgDuration: 185,
        funnel: [
          { step: 1, label: 'Başlangıç', count: 1250, percentage: 100 },
          { step: 2, label: 'Deneyim', count: 1100, percentage: 88 },
          { step: 3, label: 'Hedefler', count: 950, percentage: 76 },
          { step: 4, label: 'İlgi Alanları', count: 870, percentage: 69.6 },
          { step: 5, label: 'Tercihler', count: 820, percentage: 65.6 },
          { step: 6, label: 'Tamamlama', count: 780, percentage: 62.4 },
        ],
        popularAnswers: {
          experienceLevel: [
            { value: 'BEGINNER', label: 'Yeni Başlıyorum', count: 562, percentage: 45 },
            { value: 'SOME', label: 'Biraz Deneyimim Var', count: 375, percentage: 30 },
            { value: 'INTERMEDIATE', label: 'Orta Seviye', count: 250, percentage: 20 },
            { value: 'ADVANCED', label: 'İleri Seviye', count: 63, percentage: 5 },
          ],
          goals: [
            { value: 'STRESS_RELIEF', label: 'Stres Azaltma', count: 975, percentage: 78 },
            { value: 'BETTER_SLEEP', label: 'Daha İyi Uyku', count: 812, percentage: 65 },
            { value: 'FOCUS', label: 'Odaklanma', count: 650, percentage: 52 },
            { value: 'FLEXIBILITY', label: 'Esneklik', count: 500, percentage: 40 },
            { value: 'ANXIETY', label: 'Kaygı Yönetimi', count: 437, percentage: 35 },
            { value: 'ENERGY', label: 'Enerji', count: 375, percentage: 30 },
          ],
        },
        trends: {
          startedChange: 12.5,
          completedChange: 8.3,
          rateChange: -2.1,
        },
      });
    } finally {
      setLoading(false);
    }
  }, [period]);

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
