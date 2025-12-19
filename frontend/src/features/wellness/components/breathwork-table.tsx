'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAdminBreathwork,
  deleteBreathwork,
  updateBreathwork,
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
  IconEye,
  IconEyeOff,
  IconStar,
  IconStarFilled,
  IconCrown,
  IconWind,
  IconClock,
} from '@tabler/icons-react';
import { toast } from 'sonner';

type DifficultyType = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
type CategoryType = 'CALM' | 'ENERGY' | 'FOCUS' | 'SLEEP' | 'ANXIETY' | 'MORNING' | 'EVENING' | 'QUICK' | 'YOGA';
type PatternType = 'BOX_BREATHING' | 'FOUR_SEVEN_EIGHT' | 'RELAXING_BREATH' | 'ENERGIZING_BREATH' | 'CUSTOM';

interface Breathwork {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: CategoryType;
  pattern: PatternType;
  difficulty: DifficultyType;
  inhale: number;
  hold1: number;
  exhale: number;
  hold2: number;
  cycles: number;
  coverImage?: string;
  isPremium: boolean;
  isFeatured: boolean;
  isActive: boolean;
  playCount: number;
  createdAt: string;
}

const CATEGORY_LABELS: Record<CategoryType, string> = {
  CALM: 'Sakinlik',
  ENERGY: 'Enerji',
  FOCUS: 'Odaklanma',
  SLEEP: 'Uyku',
  ANXIETY: 'Kaygı',
  MORNING: 'Sabah',
  EVENING: 'Akşam',
  QUICK: 'Hızlı',
  YOGA: 'Yoga',
};

const PATTERN_LABELS: Record<PatternType, string> = {
  BOX_BREATHING: 'Kutu Nefesi',
  FOUR_SEVEN_EIGHT: '4-7-8',
  RELAXING_BREATH: 'Gevşeme',
  ENERGIZING_BREATH: 'Enerji',
  CUSTOM: 'Özel',
};

export function BreathworkTable() {
  const router = useRouter();
  const [breathworks, setBreathworks] = useState<Breathwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [patternFilter, setPatternFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedBreathwork, setSelectedBreathwork] = useState<Breathwork | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  const loadBreathworks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminBreathwork({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        pattern: patternFilter !== 'all' ? patternFilter : undefined,
        difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined,
      });
      setBreathworks(data.breathworks || data.items || []);
      setPagination(prev => ({ ...prev, total: data.pagination?.total || data.total || 0 }));
    } catch (error) {
      console.error('Failed to load breathworks:', error);
      toast.error('Nefes egzersizleri yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, categoryFilter, patternFilter, difficultyFilter]);

  useEffect(() => {
    loadBreathworks();
  }, [loadBreathworks]);

  const handleDelete = async () => {
    if (!selectedBreathwork) return;
    try {
      await deleteBreathwork(selectedBreathwork.id);
      toast.success('Nefes egzersizi silindi');
      setDeleteDialog(false);
      loadBreathworks();
    } catch (error) {
      toast.error('Nefes egzersizi silinemedi');
    }
  };

  const handleTogglePublish = async (breathwork: Breathwork) => {
    try {
      await updateBreathwork(breathwork.id, { isActive: !breathwork.isActive });
      toast.success(breathwork.isActive ? 'Yayından kaldırıldı' : 'Yayınlandı');
      loadBreathworks();
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const handleToggleFeatured = async (breathwork: Breathwork) => {
    try {
      await updateBreathwork(breathwork.id, { isFeatured: !breathwork.isFeatured });
      toast.success(breathwork.isFeatured ? 'Öne çıkan kaldırıldı' : 'Öne çıkarıldı');
      loadBreathworks();
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const formatPattern = (breathwork: Breathwork) => {
    return `${breathwork.inhale}-${breathwork.hold1}-${breathwork.exhale}-${breathwork.hold2}`;
  };

  const calculateDuration = (breathwork: Breathwork) => {
    const cycleSeconds = breathwork.inhale + breathwork.hold1 + breathwork.exhale + breathwork.hold2;
    const totalSeconds = cycleSeconds * breathwork.cycles;
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyBadge = (difficulty: DifficultyType) => {
    switch (difficulty) {
      case 'BEGINNER':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-400/20 dark:text-green-400">
            Başlangıç
          </span>
        );
      case 'INTERMEDIATE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-400">
            Orta
          </span>
        );
      case 'ADVANCED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-400/20 dark:text-rose-400">
            İleri
          </span>
        );
      default:
        return null;
    }
  };

  const getCategoryBadge = (category: CategoryType) => {
    const colors: Record<CategoryType, string> = {
      CALM: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-400/20 dark:text-cyan-400',
      ENERGY: 'bg-orange-100 text-orange-700 dark:bg-orange-400/20 dark:text-orange-400',
      FOCUS: 'bg-violet-100 text-violet-700 dark:bg-violet-400/20 dark:text-violet-400',
      SLEEP: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-400/20 dark:text-indigo-400',
      ANXIETY: 'bg-pink-100 text-pink-700 dark:bg-pink-400/20 dark:text-pink-400',
      MORNING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-400/20 dark:text-yellow-400',
      EVENING: 'bg-purple-100 text-purple-700 dark:bg-purple-400/20 dark:text-purple-400',
      QUICK: 'bg-teal-100 text-teal-700 dark:bg-teal-400/20 dark:text-teal-400',
      YOGA: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-400',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[category]}`}>
        {CATEGORY_LABELS[category]}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nefes egzersizi ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kategoriler</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={patternFilter} onValueChange={setPatternFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Pattern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Patternler</SelectItem>
              {Object.entries(PATTERN_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Seviye" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Seviyeler</SelectItem>
              <SelectItem value="BEGINNER">Başlangıç</SelectItem>
              <SelectItem value="INTERMEDIATE">Orta</SelectItem>
              <SelectItem value="ADVANCED">İleri</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => router.push('/dashboard/wellness/breathwork/new')}>
          <IconPlus className="h-4 w-4 mr-2" />
          Yeni Nefes Egzersizi
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : breathworks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nefes egzersizi bulunamadı
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]"></TableHead>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Pattern</TableHead>
                  <TableHead>Döngü</TableHead>
                  <TableHead>Süre</TableHead>
                  <TableHead>Seviye</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead>Kullanım</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {breathworks.map((breathwork) => (
                  <TableRow key={breathwork.id}>
                    <TableCell>
                      <div className="relative h-10 w-10 flex-shrink-0">
                        {breathwork.coverImage ? (
                          <img
                            src={breathwork.coverImage}
                            alt={breathwork.title}
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-gradient-to-br from-cyan-100 to-cyan-200 dark:from-cyan-400/30 dark:to-cyan-500/40 flex items-center justify-center">
                            <IconWind className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium line-clamp-1">{breathwork.title}</p>
                        <p className="text-xs text-muted-foreground">{breathwork.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryBadge(breathwork.category)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <Badge variant="outline" className="w-fit">
                          {PATTERN_LABELS[breathwork.pattern] || breathwork.pattern}
                        </Badge>
                        <span className="text-xs text-muted-foreground mt-1">
                          {formatPattern(breathwork)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{breathwork.cycles}x</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <IconClock className="h-3 w-3 text-muted-foreground" />
                        {calculateDuration(breathwork)}
                      </div>
                    </TableCell>
                    <TableCell>{getDifficultyBadge(breathwork.difficulty)}</TableCell>
                    <TableCell>
                      {breathwork.isPremium ? (
                        <IconCrown className="h-4 w-4 text-amber-500" />
                      ) : (
                        <span className="text-muted-foreground text-sm">Ücretsiz</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{breathwork.playCount}</span>
                    </TableCell>
                    <TableCell>
                      {breathwork.isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-400/20 dark:text-green-400">
                          Yayında
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-400/20 dark:text-slate-400">
                          Taslak
                        </span>
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
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/dashboard/wellness/breathwork/${breathwork.id}`)
                            }
                          >
                            <IconEdit className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTogglePublish(breathwork)}>
                            {breathwork.isActive ? (
                              <>
                                <IconEyeOff className="mr-2 h-4 w-4" />
                                Yayından Kaldır
                              </>
                            ) : (
                              <>
                                <IconEye className="mr-2 h-4 w-4" />
                                Yayınla
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleFeatured(breathwork)}>
                            {breathwork.isFeatured ? (
                              <>
                                <IconStar className="mr-2 h-4 w-4" />
                                Öne Çıkan Kaldır
                              </>
                            ) : (
                              <>
                                <IconStarFilled className="mr-2 h-4 w-4" />
                                Öne Çıkar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedBreathwork(breathwork);
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
            Toplam {pagination.total} nefes egzersizi
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page === 1}
            >
              Önceki
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page * pagination.limit >= pagination.total}
            >
              Sonraki
            </Button>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nefes Egzersizi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{selectedBreathwork?.title}&quot; nefes egzersizini silmek istediğinize
              emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
