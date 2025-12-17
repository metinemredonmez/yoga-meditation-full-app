'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IconLoader2,
  IconRefresh,
  IconTrophy,
  IconFlame,
  IconClock,
  IconStar,
  IconMedal,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import {
  getLeaderboard,
  getLeaderboardStats,
  getTopByMinutes,
  getTopByStreaks,
  getTopBySessions,
  recalculateLeaderboardRanks,
} from '@/lib/api';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  avatarUrl?: string;
  value: number;
  level?: number;
  change?: number;
}

interface LeaderboardStats {
  totalUsers: number;
  activeUsers: number;
  averageXP: number;
  topStreak: number;
}

export function LeaderboardView() {
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [activeTab, setActiveTab] = useState('xp');
  const [period, setPeriod] = useState('weekly');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab, period]);

  const loadData = async () => {
    setLoading(true);
    try {
      let data;
      if (activeTab === 'xp') {
        data = await getLeaderboard({ type: 'xp', period: period as any });
      } else if (activeTab === 'streak') {
        data = await getTopByStreaks({ limit: 50 });
      } else if (activeTab === 'minutes') {
        data = await getTopByMinutes({ limit: 50 });
      } else {
        data = await getTopBySessions({ limit: 50 });
      }
      setEntries(data?.entries || data?.leaderboard || data || []);

      const statsData = await getLeaderboardStats();
      setStats(statsData);
    } catch {
      // Mock data
      setEntries([
        { rank: 1, userId: '1', userName: 'Yogi Master', value: 15420, level: 42, change: 0 },
        { rank: 2, userId: '2', userName: 'Zen Warrior', value: 12850, level: 38, change: 1 },
        { rank: 3, userId: '3', userName: 'Peaceful Mind', value: 11200, level: 35, change: -1 },
        { rank: 4, userId: '4', userName: 'Flow Artist', value: 9800, level: 32, change: 2 },
        { rank: 5, userId: '5', userName: 'Breath Seeker', value: 8500, level: 28, change: 0 },
        { rank: 6, userId: '6', userName: 'Balance Pro', value: 7200, level: 25, change: -2 },
        { rank: 7, userId: '7', userName: 'Mindful One', value: 6100, level: 22, change: 1 },
        { rank: 8, userId: '8', userName: 'Inner Peace', value: 5400, level: 20, change: 0 },
        { rank: 9, userId: '9', userName: 'Chakra Guide', value: 4800, level: 18, change: 3 },
        { rank: 10, userId: '10', userName: 'Spirit Walker', value: 4200, level: 16, change: -1 },
      ]);
      setStats({
        totalUsers: 12500,
        activeUsers: 3200,
        averageXP: 2450,
        topStreak: 365,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await recalculateLeaderboardRanks();
      toast.success('Sıralamalar yeniden hesaplandı');
      loadData();
    } catch {
      toast.error('Hesaplama başarısız');
    } finally {
      setRecalculating(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <IconTrophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <IconMedal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <IconMedal className="h-5 w-5 text-amber-600" />;
    return <span className="text-muted-foreground font-medium">{rank}</span>;
  };

  const getValueLabel = () => {
    if (activeTab === 'xp') return 'XP';
    if (activeTab === 'streak') return 'Gün';
    if (activeTab === 'minutes') return 'Dakika';
    return 'Oturum';
  };

  const getValueIcon = () => {
    if (activeTab === 'xp') return <IconStar className="h-4 w-4 text-yellow-500" />;
    if (activeTab === 'streak') return <IconFlame className="h-4 w-4 text-orange-500" />;
    if (activeTab === 'minutes') return <IconClock className="h-4 w-4 text-blue-500" />;
    return <IconTrophy className="h-4 w-4 text-purple-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Toplam Kullanıcı</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aktif Kullanıcı</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeUsers?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ortalama XP</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageXP?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>En Yüksek Seri</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              <IconFlame className="h-5 w-5 text-orange-500" />
              {stats?.topStreak || 0} gün
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liderlik Tablosu</CardTitle>
              <CardDescription>En iyi performans gösteren kullanıcılar</CardDescription>
            </div>
            <Button variant="outline" onClick={handleRecalculate} disabled={recalculating}>
              {recalculating ? (
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <IconRefresh className="mr-2 h-4 w-4" />
              )}
              Yeniden Hesapla
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="xp">
                  <IconStar className="mr-1 h-4 w-4" />
                  XP
                </TabsTrigger>
                <TabsTrigger value="streak">
                  <IconFlame className="mr-1 h-4 w-4" />
                  Seri
                </TabsTrigger>
                <TabsTrigger value="minutes">
                  <IconClock className="mr-1 h-4 w-4" />
                  Dakika
                </TabsTrigger>
                <TabsTrigger value="sessions">
                  <IconTrophy className="mr-1 h-4 w-4" />
                  Oturum
                </TabsTrigger>
              </TabsList>
              {activeTab === 'xp' && (
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Günlük</SelectItem>
                    <SelectItem value="weekly">Haftalık</SelectItem>
                    <SelectItem value="monthly">Aylık</SelectItem>
                    <SelectItem value="allTime">Tüm Zamanlar</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <TabsContent value={activeTab} className="mt-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <IconLoader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Sıra</TableHead>
                      <TableHead>Kullanıcı</TableHead>
                      <TableHead className="text-right">{getValueLabel()}</TableHead>
                      {activeTab === 'xp' && <TableHead className="text-right">Seviye</TableHead>}
                      <TableHead className="text-right">Değişim</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Veri bulunamadı
                        </TableCell>
                      </TableRow>
                    ) : (
                      entries.map((entry) => (
                        <TableRow key={entry.userId} className={entry.rank <= 3 ? 'bg-muted/30' : ''}>
                          <TableCell>
                            <div className="flex items-center justify-center w-8 h-8">
                              {getRankIcon(entry.rank)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={entry.avatarUrl} />
                                <AvatarFallback>
                                  {entry.userName.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{entry.userName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {getValueIcon()}
                              <span className="font-semibold">{entry.value.toLocaleString()}</span>
                            </div>
                          </TableCell>
                          {activeTab === 'xp' && (
                            <TableCell className="text-right">
                              <Badge variant="outline">Lv. {entry.level}</Badge>
                            </TableCell>
                          )}
                          <TableCell className="text-right">
                            {entry.change !== undefined && entry.change !== 0 && (
                              <Badge variant={entry.change > 0 ? 'default' : 'destructive'}>
                                {entry.change > 0 ? '+' : ''}{entry.change}
                              </Badge>
                            )}
                            {entry.change === 0 && (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
