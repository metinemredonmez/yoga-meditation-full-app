'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAdminMoodEntries, getMoodEntryStats } from '@/lib/api';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IconLoader2,
  IconMoodHappy,
  IconMoodSad,
  IconMoodNeutral,
  IconMoodCry,
  IconMoodSmile,
  IconMoodWink,
  IconMoodAngry,
  IconSearch,
  IconCalendar,
  IconUser,
  IconHeart,
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface MoodEntry {
  id: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  mood: string;
  moodScore: number;
  note?: string;
  tags?: string[];
  activities?: string[];
  sleepQuality?: number;
  energyLevel?: number;
  stressLevel?: number;
  createdAt: string;
}

interface Stats {
  total: number;
  today: number;
  thisWeek: number;
  averageMood: number;
}

const MOOD_OPTIONS: Record<string, { label: string; color: string; icon: any }> = {
  VERY_SAD: { label: 'Çok Üzgün', color: 'bg-red-500', icon: IconMoodCry },
  SAD: { label: 'Üzgün', color: 'bg-orange-500', icon: IconMoodSad },
  NEUTRAL: { label: 'Nötr', color: 'bg-gray-500', icon: IconMoodNeutral },
  HAPPY: { label: 'Mutlu', color: 'bg-green-500', icon: IconMoodSmile },
  VERY_HAPPY: { label: 'Çok Mutlu', color: 'bg-emerald-500', icon: IconMoodHappy },
  EXCITED: { label: 'Heyecanlı', color: 'bg-yellow-500', icon: IconMoodWink },
  CALM: { label: 'Sakin', color: 'bg-blue-500', icon: IconMoodNeutral },
  ANXIOUS: { label: 'Kaygılı', color: 'bg-purple-500', icon: IconMoodSad },
  ANGRY: { label: 'Kızgın', color: 'bg-rose-500', icon: IconMoodAngry },
  GRATEFUL: { label: 'Minnettar', color: 'bg-pink-500', icon: IconHeart },
};

export function MoodEntriesTable() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (moodFilter && moodFilter !== 'all') params.mood = moodFilter;
      if (dateFilter) params.date = dateFilter;

      const data = await getAdminMoodEntries(params);
      setEntries(data.entries || data.moodEntries || []);

      // Load stats
      try {
        const statsData = await getMoodEntryStats();
        setStats(statsData);
      } catch {
        // Stats endpoint may not exist
      }
    } catch (error) {
      console.error('Failed to load mood entries:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, moodFilter, dateFilter]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const getMoodIcon = (mood: string) => {
    const MoodIcon = MOOD_OPTIONS[mood]?.icon || IconMoodNeutral;
    return <MoodIcon className="h-5 w-5" />;
  };

  const renderLevelBar = (level: number | undefined, color: string) => {
    if (level === undefined || level === null) return '-';
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full ${color} rounded-full`}
            style={{ width: `${(level / 10) * 100}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">{level}/10</span>
      </div>
    );
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
                  <p className="text-sm text-muted-foreground">Toplam Kayıt</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <IconMoodHappy className="h-8 w-8 text-violet-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bugün</p>
                  <p className="text-2xl font-bold text-green-600">{stats.today}</p>
                </div>
                <IconCalendar className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bu Hafta</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.thisWeek}</p>
                </div>
                <IconCalendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ort. Mood</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {stats.averageMood?.toFixed(1) || '-'}
                  </p>
                </div>
                <IconMoodSmile className="h-8 w-8 text-amber-500" />
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
                placeholder="Kullanıcı ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={moodFilter} onValueChange={setMoodFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Mood" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                {Object.entries(MOOD_OPTIONS).map(([value, { label }]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-[160px]"
            />
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
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Mood kaydı bulunamadı
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>Mood</TableHead>
                  <TableHead>Skor</TableHead>
                  <TableHead>Uyku Kalitesi</TableHead>
                  <TableHead>Enerji</TableHead>
                  <TableHead>Stres</TableHead>
                  <TableHead>Not</TableHead>
                  <TableHead>Etiketler</TableHead>
                  <TableHead>Tarih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <IconUser className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {entry.user?.name || 'Anonim'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.user?.email || entry.userId.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`${MOOD_OPTIONS[entry.mood]?.color || 'bg-gray-500'} text-white`}
                      >
                        <span className="mr-1">{getMoodIcon(entry.mood)}</span>
                        {MOOD_OPTIONS[entry.mood]?.label || entry.mood}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{entry.moodScore}/10</span>
                    </TableCell>
                    <TableCell>
                      {renderLevelBar(entry.sleepQuality, 'bg-indigo-500')}
                    </TableCell>
                    <TableCell>
                      {renderLevelBar(entry.energyLevel, 'bg-amber-500')}
                    </TableCell>
                    <TableCell>
                      {renderLevelBar(entry.stressLevel, 'bg-red-500')}
                    </TableCell>
                    <TableCell>
                      {entry.note ? (
                        <p className="text-sm text-muted-foreground truncate max-w-[150px]">
                          {entry.note}
                        </p>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {entry.tags?.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {entry.tags && entry.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{entry.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(entry.createdAt), 'dd MMM yyyy HH:mm', {
                          locale: tr,
                        })}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
