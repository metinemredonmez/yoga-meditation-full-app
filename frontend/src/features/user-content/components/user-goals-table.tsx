'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAdminUserGoals, getUserGoalStats } from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IconLoader2,
  IconTarget,
  IconSearch,
  IconCalendar,
  IconUser,
  IconTrophy,
  IconFlame,
  IconCheck,
  IconClock,
  IconAlertCircle,
} from '@tabler/icons-react';
import { format, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';

interface UserGoal {
  id: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  type: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit?: string;
  frequency?: string;
  startDate: string;
  endDate?: string;
  status: string;
  streak?: number;
  createdAt: string;
}

interface Stats {
  total: number;
  active: number;
  completed: number;
  averageProgress: number;
}

const GOAL_TYPE_OPTIONS: Record<string, { label: string; color: string }> = {
  PRACTICE: { label: 'Pratik', color: 'bg-violet-500' },
  MEDITATION: { label: 'Meditasyon', color: 'bg-indigo-500' },
  BREATHWORK: { label: 'Nefes', color: 'bg-cyan-500' },
  MINDFULNESS: { label: 'Farkındalık', color: 'bg-emerald-500' },
  FITNESS: { label: 'Fitness', color: 'bg-orange-500' },
  WELLNESS: { label: 'Sağlık', color: 'bg-pink-500' },
  LEARNING: { label: 'Öğrenme', color: 'bg-amber-500' },
  STREAK: { label: 'Seri', color: 'bg-red-500' },
  CUSTOM: { label: 'Özel', color: 'bg-gray-500' },
};

const STATUS_OPTIONS: Record<string, { label: string; color: string; icon: any }> = {
  ACTIVE: { label: 'Aktif', color: 'bg-blue-500', icon: IconClock },
  COMPLETED: { label: 'Tamamlandı', color: 'bg-green-500', icon: IconCheck },
  FAILED: { label: 'Başarısız', color: 'bg-red-500', icon: IconAlertCircle },
  PAUSED: { label: 'Durduruldu', color: 'bg-gray-500', icon: IconClock },
  CANCELLED: { label: 'İptal', color: 'bg-slate-500', icon: IconAlertCircle },
};

const FREQUENCY_OPTIONS: Record<string, string> = {
  DAILY: 'Günlük',
  WEEKLY: 'Haftalık',
  MONTHLY: 'Aylık',
  ONE_TIME: 'Tek Seferlik',
};

export function UserGoalsTable() {
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadGoals = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (typeFilter && typeFilter !== 'all') params.type = typeFilter;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;

      const data = await getAdminUserGoals(params);
      setGoals(data.goals || data.userGoals || []);

      // Load stats
      try {
        const statsData = await getUserGoalStats();
        setStats(statsData);
      } catch {
        // Stats endpoint may not exist
      }
    } catch (error) {
      console.error('Failed to load user goals:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, typeFilter, statusFilter]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const getProgress = (goal: UserGoal) => {
    if (goal.targetValue === 0) return 0;
    return Math.min((goal.currentValue / goal.targetValue) * 100, 100);
  };

  const getDaysRemaining = (goal: UserGoal) => {
    if (!goal.endDate) return null;
    const days = differenceInDays(new Date(goal.endDate), new Date());
    return days;
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Toplam Hedef</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <IconTarget className="h-8 w-8 text-violet-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aktif</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
                </div>
                <IconClock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tamamlanan</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <IconTrophy className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ort. İlerleme</p>
                  <p className="text-2xl font-bold text-amber-600">
                    %{stats.averageProgress?.toFixed(0) || 0}
                  </p>
                </div>
                <IconFlame className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Kullanıcı veya hedef ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tip" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                {Object.entries(GOAL_TYPE_OPTIONS).map(([value, { label }]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                {Object.entries(STATUS_OPTIONS).map(([value, { label }]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : goals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Hedef bulunamadı
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>Hedef</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>İlerleme</TableHead>
                  <TableHead>Sıklık</TableHead>
                  <TableHead>Seri</TableHead>
                  <TableHead>Kalan Gün</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Başlangıç</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goals.map((goal) => {
                  const progress = getProgress(goal);
                  const daysRemaining = getDaysRemaining(goal);
                  const StatusIcon = STATUS_OPTIONS[goal.status]?.icon || IconClock;

                  return (
                    <TableRow key={goal.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <IconUser className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {goal.user?.name || 'Anonim'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {goal.user?.email || goal.userId.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{goal.title}</p>
                          {goal.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {goal.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`${GOAL_TYPE_OPTIONS[goal.type]?.color || 'bg-gray-500'} text-white`}
                        >
                          {GOAL_TYPE_OPTIONS[goal.type]?.label || goal.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 min-w-[120px]">
                          <div className="flex justify-between text-xs">
                            <span>
                              {goal.currentValue}/{goal.targetValue}
                              {goal.unit && ` ${goal.unit}`}
                            </span>
                            <span className="font-medium">{progress.toFixed(0)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {FREQUENCY_OPTIONS[goal.frequency || ''] || goal.frequency || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {goal.streak !== undefined && goal.streak > 0 ? (
                          <div className="flex items-center gap-1">
                            <IconFlame className="h-4 w-4 text-orange-500" />
                            <span className="font-mono font-medium">{goal.streak}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {daysRemaining !== null ? (
                          <span
                            className={`text-sm font-medium ${
                              daysRemaining < 0
                                ? 'text-red-500'
                                : daysRemaining <= 7
                                  ? 'text-amber-500'
                                  : 'text-muted-foreground'
                            }`}
                          >
                            {daysRemaining < 0
                              ? `${Math.abs(daysRemaining)} gün geçti`
                              : daysRemaining === 0
                                ? 'Bugün'
                                : `${daysRemaining} gün`}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${STATUS_OPTIONS[goal.status]?.color || 'bg-gray-500'} text-white border-0`}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {STATUS_OPTIONS[goal.status]?.label || goal.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(goal.startDate), 'dd MMM yyyy', {
                            locale: tr,
                          })}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
