'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getAdminChallenges,
  createChallenge,
  updateChallenge,
  deleteChallenge,
} from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  IconLoader2,
  IconPlus,
  IconSearch,
  IconDots,
  IconEdit,
  IconTrash,
  IconTrophy,
  IconUsers,
  IconCalendar,
  IconTarget,
  IconFlame,
  IconMedal,
  IconStar,
  IconClock,
  IconUpload,
  IconSettings,
  IconChartBar,
} from '@tabler/icons-react';
import { format, differenceInDays, isPast, isFuture } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';

type DifficultyType = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
type GoalType = 'DURATION' | 'SESSIONS' | 'FREE';

interface Challenge {
  id: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  targetDays: number;
  coverUrl?: string;
  difficulty?: DifficultyType;
  categories?: string[];
  xpReward?: number;
  badgeId?: string;
  dailyGoalMinutes?: number;
  dailyGoalType?: GoalType;
  maxParticipants?: number;
  showLeaderboard?: boolean;
  _count?: {
    challenge_enrollments: number;
  };
  createdAt: string;
}

const CHALLENGE_CATEGORIES = [
  'Yoga',
  'Pilates',
  'Meditasyon',
  'Nefes',
  'Esneklik',
  'Güç',
  'Denge',
  'Stres Azaltma',
];

const BADGES = [
  { id: 'warrior', name: '🏆 Savaşçı', xp: 500 },
  { id: 'champion', name: '🥇 Şampiyon', xp: 1000 },
  { id: 'master', name: '👑 Usta', xp: 1500 },
  { id: 'legend', name: '⭐ Efsane', xp: 2000 },
];

export function ChallengesTable() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [activeTab, setActiveTab] = useState('general');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startAt: '',
    endAt: '',
    targetDays: 7,
    coverUrl: '',
    difficulty: 'BEGINNER' as DifficultyType,
    categories: [] as string[],
    xpReward: 500,
    badgeId: '',
    dailyGoalMinutes: 15,
    dailyGoalType: 'DURATION' as GoalType,
    maxParticipants: 0,
    showLeaderboard: true,
  });

  const loadChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminChallenges({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
      });
      setChallenges(data.challenges || []);
      setPagination(prev => ({ ...prev, total: data.pagination?.total || 0 }));
    } catch (error) {
      console.error('Failed to load challenges:', error);
      toast.error('Challenge\'lar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, search]);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  const openEditDialog = (challenge?: Challenge) => {
    if (challenge) {
      setSelectedChallenge(challenge);
      setFormData({
        title: challenge.title,
        description: challenge.description,
        startAt: challenge.startAt.split('T')[0],
        endAt: challenge.endAt.split('T')[0],
        targetDays: challenge.targetDays,
        coverUrl: challenge.coverUrl || '',
        difficulty: challenge.difficulty || 'BEGINNER',
        categories: challenge.categories || [],
        xpReward: challenge.xpReward || 500,
        badgeId: challenge.badgeId || '',
        dailyGoalMinutes: challenge.dailyGoalMinutes || 15,
        dailyGoalType: challenge.dailyGoalType || 'DURATION',
        maxParticipants: challenge.maxParticipants || 0,
        showLeaderboard: challenge.showLeaderboard ?? true,
      });
    } else {
      setSelectedChallenge(null);
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      setFormData({
        title: '',
        description: '',
        startAt: today.toISOString().split('T')[0],
        endAt: nextWeek.toISOString().split('T')[0],
        targetDays: 7,
        coverUrl: '',
        difficulty: 'BEGINNER',
        categories: [],
        xpReward: 500,
        badgeId: '',
        dailyGoalMinutes: 15,
        dailyGoalType: 'DURATION',
        maxParticipants: 0,
        showLeaderboard: true,
      });
    }
    setActiveTab('general');
    setEditDialog(true);
  };

  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
    }));
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description || !formData.startAt || !formData.endAt) {
      toast.error('Tüm zorunlu alanları doldurun');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        startAt: new Date(formData.startAt).toISOString(),
        endAt: new Date(formData.endAt).toISOString(),
        maxParticipants: formData.maxParticipants || null,
      };

      if (selectedChallenge) {
        await updateChallenge(selectedChallenge.id, payload);
        toast.success('Challenge güncellendi');
      } else {
        await createChallenge(payload);
        toast.success('Challenge oluşturuldu');
      }
      setEditDialog(false);
      loadChallenges();
    } catch (error) {
      toast.error('İşlem başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedChallenge) return;
    try {
      await deleteChallenge(selectedChallenge.id);
      toast.success('Challenge silindi');
      setDeleteDialog(false);
      loadChallenges();
    } catch (error) {
      toast.error('Challenge silinemedi');
    }
  };

  const getStatus = (challenge: Challenge) => {
    const start = new Date(challenge.startAt);
    const end = new Date(challenge.endAt);

    if (isFuture(start)) return 'UPCOMING';
    if (isPast(end)) return 'ENDED';
    return 'ACTIVE';
  };

  const getStatusBadge = (challenge: Challenge) => {
    const status = getStatus(challenge);
    switch (status) {
      case 'UPCOMING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700 border border-cyan-200 dark:bg-cyan-400/20 dark:text-cyan-400 dark:border-cyan-400/30 transition-all duration-300">
            Yaklaşan
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200 dark:bg-green-400/20 dark:text-green-400 dark:border-green-400/30 transition-all duration-300">
            Aktif
          </span>
        );
      case 'ENDED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-400/20 dark:text-slate-400 dark:border-slate-400/30 transition-all duration-300">
            Bitti
          </span>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDifficultyBadge = (difficulty?: DifficultyType) => {
    switch (difficulty) {
      case 'BEGINNER':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200 dark:bg-green-400/20 dark:text-green-400 dark:border-green-400/30">
            Kolay
          </span>
        );
      case 'INTERMEDIATE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-400/20 dark:text-amber-400 dark:border-amber-400/30">
            Orta
          </span>
        );
      case 'ADVANCED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-400/20 dark:text-rose-400 dark:border-rose-400/30">
            Zor
          </span>
        );
      default:
        return null;
    }
  };

  const getProgress = (challenge: Challenge) => {
    const start = new Date(challenge.startAt);
    const end = new Date(challenge.endAt);
    const now = new Date();
    const total = differenceInDays(end, start);
    const elapsed = differenceInDays(now, start);
    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Challenge ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="upcoming">Yaklaşan</SelectItem>
              <SelectItem value="ended">Biten</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => openEditDialog()}>
          <IconPlus className="h-4 w-4 mr-2" />
          Yeni Challenge
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : challenges.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Challenge bulunamadı
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Challenge</TableHead>
                  <TableHead>Zorluk</TableHead>
                  <TableHead>Tarihler</TableHead>
                  <TableHead>Hedef</TableHead>
                  <TableHead>Katılımcı</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>İlerleme</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {challenges.map((challenge) => (
                  <TableRow key={challenge.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-16 flex-shrink-0">
                          {challenge.coverUrl ? (
                            <img
                              src={challenge.coverUrl}
                              alt={challenge.title}
                              className="h-10 w-16 rounded object-cover absolute inset-0"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          ) : null}
                          <div className="h-10 w-16 rounded bg-gradient-to-br from-violet-100 to-violet-200 dark:from-violet-400/30 dark:to-violet-500/40 flex items-center justify-center border border-violet-200 dark:border-violet-400/30">
                            <IconTrophy className="h-5 w-5 text-violet-500 dark:text-violet-400" />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">{challenge.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {challenge.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getDifficultyBadge(challenge.difficulty)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <IconCalendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(challenge.startAt), 'dd MMM', { locale: tr })}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          - {format(new Date(challenge.endAt), 'dd MMM yyyy', { locale: tr })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <IconTarget className="h-4 w-4 text-muted-foreground" />
                        {challenge.targetDays} gün
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <IconUsers className="h-4 w-4 text-muted-foreground" />
                        {challenge._count?.challenge_enrollments || 0}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(challenge)}</TableCell>
                    <TableCell>
                      {getStatus(challenge) === 'ACTIVE' ? (
                        <div className="w-24">
                          <Progress value={getProgress(challenge)} className="h-2" />
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <IconDots className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(challenge)}>
                            <IconEdit className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedChallenge(challenge);
                              setDeleteDialog(true);
                            }}
                          >
                            <IconTrash className="mr-2 h-4 w-4" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Toplam {pagination.total} challenge
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page === 1}
            >
              Önceki
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page * pagination.limit >= pagination.total}
            >
              Sonraki
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog with Tabs */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedChallenge ? 'Challenge Düzenle' : 'Yeni Challenge'}
            </DialogTitle>
            <DialogDescription>
              Challenge bilgilerini girin
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general" className="gap-1">
                <IconEdit className="h-4 w-4" />
                <span className="hidden sm:inline">Genel</span>
              </TabsTrigger>
              <TabsTrigger value="goals" className="gap-1">
                <IconTarget className="h-4 w-4" />
                <span className="hidden sm:inline">Hedefler</span>
              </TabsTrigger>
              <TabsTrigger value="rewards" className="gap-1">
                <IconTrophy className="h-4 w-4" />
                <span className="hidden sm:inline">Ödüller</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-1">
                <IconSettings className="h-4 w-4" />
                <span className="hidden sm:inline">Ayarlar</span>
              </TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-5 mt-4">
              <div className="space-y-2">
                <Label>Başlık *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="30 Günlük Yoga Challenge"
                />
              </div>
              <div className="space-y-2">
                <Label>Açıklama *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Challenge açıklaması"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Başlangıç Tarihi *</Label>
                  <Input
                    type="date"
                    value={formData.startAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, startAt: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bitiş Tarihi *</Label>
                  <Input
                    type="date"
                    value={formData.endAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, endAt: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hedef Gün</Label>
                  <Input
                    type="number"
                    value={formData.targetDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetDays: parseInt(e.target.value) || 1 }))}
                    min={1}
                  />
                </div>
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <Label>Zorluk Seviyesi</Label>
                <div className="flex gap-2">
                  {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as DifficultyType[]).map((level, index) => {
                    const isSelected = formData.difficulty === level;
                    const colors = [
                      { selected: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-400/30 dark:text-green-300 dark:border-green-400/50', unselected: 'border-green-200 text-green-600 hover:bg-green-50 dark:border-green-400/30 dark:text-green-400 dark:hover:bg-green-400/10' },
                      { selected: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-400/30 dark:text-amber-300 dark:border-amber-400/50', unselected: 'border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-400/30 dark:text-amber-400 dark:hover:bg-amber-400/10' },
                      { selected: 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-400/30 dark:text-rose-300 dark:border-rose-400/50', unselected: 'border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-400/30 dark:text-rose-400 dark:hover:bg-rose-400/10' },
                    ];
                    const labels = ['Kolay', 'Orta', 'Zor'];
                    return (
                      <span
                        key={level}
                        onClick={() => setFormData(prev => ({ ...prev, difficulty: level }))}
                        className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border cursor-pointer transition-all duration-200 ${
                          isSelected ? colors[index].selected : colors[index].unselected
                        }`}
                      >
                        {labels[index]}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <Label>Kategoriler</Label>
                <div className="flex flex-wrap gap-2">
                  {CHALLENGE_CATEGORIES.map((category, index) => {
                    const isSelected = formData.categories.includes(category);
                    const colors = [
                      { selected: 'bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-400/30 dark:text-violet-300 dark:border-violet-400/50', unselected: 'border-violet-200 text-violet-600 hover:bg-violet-50 dark:border-violet-400/30 dark:text-violet-400 dark:hover:bg-violet-400/10' },
                      { selected: 'bg-pink-100 text-pink-700 border-pink-300 dark:bg-pink-400/30 dark:text-pink-300 dark:border-pink-400/50', unselected: 'border-pink-200 text-pink-600 hover:bg-pink-50 dark:border-pink-400/30 dark:text-pink-400 dark:hover:bg-pink-400/10' },
                      { selected: 'bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-400/30 dark:text-cyan-300 dark:border-cyan-400/50', unselected: 'border-cyan-200 text-cyan-600 hover:bg-cyan-50 dark:border-cyan-400/30 dark:text-cyan-400 dark:hover:bg-cyan-400/10' },
                      { selected: 'bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-400/30 dark:text-teal-300 dark:border-teal-400/50', unselected: 'border-teal-200 text-teal-600 hover:bg-teal-50 dark:border-teal-400/30 dark:text-teal-400 dark:hover:bg-teal-400/10' },
                      { selected: 'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-400/30 dark:text-indigo-300 dark:border-indigo-400/50', unselected: 'border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-400/30 dark:text-indigo-400 dark:hover:bg-indigo-400/10' },
                      { selected: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-400/30 dark:text-amber-300 dark:border-amber-400/50', unselected: 'border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-400/30 dark:text-amber-400 dark:hover:bg-amber-400/10' },
                      { selected: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-400/30 dark:text-purple-300 dark:border-purple-400/50', unselected: 'border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-400/30 dark:text-purple-400 dark:hover:bg-purple-400/10' },
                      { selected: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-400/30 dark:text-emerald-300 dark:border-emerald-400/50', unselected: 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-400/30 dark:text-emerald-400 dark:hover:bg-emerald-400/10' },
                    ];
                    const colorSet = colors[index % colors.length];
                    return (
                      <span
                        key={category}
                        onClick={() => toggleCategory(category)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border cursor-pointer transition-all duration-200 ${
                          isSelected ? colorSet.selected : colorSet.unselected
                        }`}
                      >
                        {category}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Cover Image */}
              <div className="space-y-2">
                <Label>Kapak Resmi URL</Label>
                <Input
                  value={formData.coverUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, coverUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </TabsContent>

            {/* Goals Tab */}
            <TabsContent value="goals" className="space-y-5 mt-4">
              <div className="space-y-2">
                <Label>Günlük Hedef Tipi</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'DURATION', label: 'Süre Bazlı', icon: IconClock, desc: 'Dakika hedefi' },
                    { value: 'SESSIONS', label: 'Ders Bazlı', icon: IconTarget, desc: 'Ders sayısı' },
                    { value: 'FREE', label: 'Serbest', icon: IconStar, desc: 'Kendi temponuzda' },
                  ].map((option) => (
                    <div
                      key={option.value}
                      onClick={() => setFormData(prev => ({ ...prev, dailyGoalType: option.value as GoalType }))}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        formData.dailyGoalType === option.value
                          ? 'border-violet-400 bg-violet-50 dark:bg-violet-400/10 dark:border-violet-400/50'
                          : 'hover:border-muted-foreground/50'
                      }`}
                    >
                      <option.icon className={`h-5 w-5 mb-2 ${formData.dailyGoalType === option.value ? 'text-violet-600 dark:text-violet-400' : 'text-muted-foreground'}`} />
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {formData.dailyGoalType === 'DURATION' && (
                <div>
                  <Label>Günlük Minimum Süre (Dakika)</Label>
                  <Input
                    type="number"
                    value={formData.dailyGoalMinutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, dailyGoalMinutes: parseInt(e.target.value) || 1 }))}
                    min={1}
                    max={180}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Katılımcıların günlük tamamlaması gereken minimum süre
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Rewards Tab */}
            <TabsContent value="rewards" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <IconFlame className="h-4 w-4 text-orange-500" />
                    XP Puanı
                  </Label>
                  <Input
                    type="number"
                    value={formData.xpReward}
                    onChange={(e) => setFormData(prev => ({ ...prev, xpReward: parseInt(e.target.value) || 0 }))}
                    min={0}
                    step={50}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Tamamlayınca kazanılacak XP
                  </p>
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <IconMedal className="h-4 w-4 text-amber-500" />
                    Rozet
                  </Label>
                  <Select
                    value={formData.badgeId || 'none'}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, badgeId: v === 'none' ? '' : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Rozet seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Rozet yok</SelectItem>
                      {BADGES.map((badge) => (
                        <SelectItem key={badge.id} value={badge.id}>
                          {badge.name} (+{badge.xp} XP)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <IconStar className="h-4 w-4 text-yellow-500" />
                  Ödül Önizleme
                </h4>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-500">{formData.xpReward}</div>
                    <div className="text-xs text-muted-foreground">XP Puanı</div>
                  </div>
                  {formData.badgeId && (
                    <div className="text-center">
                      <div className="text-2xl">{BADGES.find(b => b.id === formData.badgeId)?.name.split(' ')[0]}</div>
                      <div className="text-xs text-muted-foreground">{BADGES.find(b => b.id === formData.badgeId)?.name.split(' ').slice(1).join(' ')}</div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4 mt-4">
              <div>
                <Label>Maksimum Katılımcı</Label>
                <Input
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) || 0 }))}
                  min={0}
                  placeholder="0 = Sınırsız"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  0 girilirse sınırsız katılım
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <IconChartBar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Liderlik Tablosu</div>
                    <div className="text-sm text-muted-foreground">Katılımcı sıralamasını göster</div>
                  </div>
                </div>
                <Switch
                  checked={formData.showLeaderboard}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showLeaderboard: checked }))}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedChallenge ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Challenge Sil</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{selectedChallenge?.title}&quot; challenge&apos;ını silmek istediğinize emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
