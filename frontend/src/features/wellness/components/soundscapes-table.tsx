'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAdminSoundscapes,
  deleteSoundscape,
  getSoundscapeStats,
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
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  IconLoader2,
  IconSearch,
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconMusic,
  IconVolume,
  IconRepeat,
  IconLayersSubtract,
  IconCrown,
  IconPlayerPlay,
} from '@tabler/icons-react';
import { toast } from 'sonner';

interface Soundscape {
  id: string;
  title: string;
  titleEn?: string;
  slug: string;
  category: string;
  duration: number | null;
  audioUrl?: string;
  coverImage?: string;
  isLoop: boolean;
  isMixable: boolean;
  isPremium: boolean;
  isPublished: boolean;
  defaultVolume: number;
  playCount?: number;
  createdAt: string;
}

interface Stats {
  total: number;
  active: number;
  premium: number;
  free: number;
}

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'Tümü' },
  { value: 'RAIN', label: 'Yağmur', color: 'bg-blue-100 text-blue-700' },
  { value: 'THUNDER', label: 'Gök Gürültüsü', color: 'bg-purple-100 text-purple-700' },
  { value: 'OCEAN', label: 'Okyanus', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'FOREST', label: 'Orman', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'BIRDS', label: 'Kuşlar', color: 'bg-green-100 text-green-700' },
  { value: 'FIRE', label: 'Ateş', color: 'bg-orange-100 text-orange-700' },
  { value: 'WHITE_NOISE', label: 'Beyaz Gürültü', color: 'bg-zinc-100 text-zinc-700' },
  { value: 'PINK_NOISE', label: 'Pembe Gürültü', color: 'bg-pink-100 text-pink-700' },
  { value: 'BROWN_NOISE', label: 'Kahverengi Gürültü', color: 'bg-amber-100 text-amber-700' },
  { value: 'CAFE', label: 'Kafe', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'CITY', label: 'Şehir', color: 'bg-gray-100 text-gray-700' },
  { value: 'WIND', label: 'Rüzgar', color: 'bg-slate-100 text-slate-700' },
  { value: 'WATER', label: 'Su', color: 'bg-sky-100 text-sky-700' },
  { value: 'TIBETAN_BOWLS', label: 'Tibet Kasesi', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'MUSIC', label: 'Müzik', color: 'bg-violet-100 text-violet-700' },
  { value: 'OTHER', label: 'Diğer', color: 'bg-neutral-100 text-neutral-700' },
];

export function SoundscapesTable() {
  const router = useRouter();
  const [soundscapes, setSoundscapes] = useState<Soundscape[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedSoundscape, setSelectedSoundscape] = useState<Soundscape | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loopFilter, setLoopFilter] = useState('');
  const [mixableFilter, setMixableFilter] = useState('');
  const [premiumFilter, setPremiumFilter] = useState('');
  const [publishedFilter, setPublishedFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const loadSoundscapes = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit,
        includeInactive: true,
      };
      if (search) params.search = search;
      if (category && category !== 'all') params.category = category;
      if (loopFilter && loopFilter !== 'all') params.isLoop = loopFilter === 'true';
      if (mixableFilter && mixableFilter !== 'all') params.isMixable = mixableFilter === 'true';
      if (premiumFilter === 'premium') params.isPremium = true;
      if (premiumFilter === 'free') params.isFree = true;
      if (publishedFilter && publishedFilter !== 'all') params.isPublished = publishedFilter === 'true';

      const data = await getAdminSoundscapes(params);
      setSoundscapes(data.soundscapes || []);
      setTotalPages(Math.ceil((data.pagination?.total || data.total || 0) / limit));

      // Load stats
      const statsData = await getSoundscapeStats();
      setStats(statsData.stats || statsData);
    } catch (error) {
      console.error('Failed to load soundscapes:', error);
      toast.error('Soundscapelar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [page, search, category, loopFilter, mixableFilter, premiumFilter, publishedFilter]);

  useEffect(() => {
    loadSoundscapes();
  }, [loadSoundscapes]);

  useEffect(() => {
    setPage(1);
  }, [search, category, loopFilter, mixableFilter, premiumFilter, publishedFilter]);

  const handleDelete = async () => {
    if (!selectedSoundscape) return;
    try {
      await deleteSoundscape(selectedSoundscape.id);
      toast.success('Soundscape silindi');
      setDeleteDialog(false);
      loadSoundscapes();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Silme işlemi başarısız');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryLabel = (value: string) => {
    return CATEGORY_OPTIONS.find((c) => c.value === value)?.label || value;
  };

  const getCategoryColor = (value: string) => {
    return (
      CATEGORY_OPTIONS.find((c) => c.value === value)?.color ||
      'bg-slate-100 text-slate-700'
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
                  <p className="text-sm text-muted-foreground">Toplam</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <IconMusic className="h-8 w-8 text-violet-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aktif</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <IconPlayerPlay className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Premium</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.premium}</p>
                </div>
                <IconCrown className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ücretsiz</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.free}</p>
                </div>
                <IconVolume className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={loopFilter} onValueChange={setLoopFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Loop" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="true">Loop</SelectItem>
                <SelectItem value="false">Tek Seferlik</SelectItem>
              </SelectContent>
            </Select>
            <Select value={mixableFilter} onValueChange={setMixableFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Mixable" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="true">Mixable</SelectItem>
                <SelectItem value="false">Tek</SelectItem>
              </SelectContent>
            </Select>
            <Select value={premiumFilter} onValueChange={setPremiumFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Erişim" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="free">Ücretsiz</SelectItem>
              </SelectContent>
            </Select>
            <Select value={publishedFilter} onValueChange={setPublishedFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="true">Yayında</SelectItem>
                <SelectItem value="false">Taslak</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => router.push('/dashboard/wellness/soundscapes/new')}>
              <IconPlus className="h-4 w-4 mr-2" />
              Yeni Soundscape
            </Button>
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
          ) : soundscapes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Soundscape bulunamadı
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Görsel</TableHead>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Süre</TableHead>
                  <TableHead>Özellikler</TableHead>
                  <TableHead>Erişim</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {soundscapes.map((soundscape) => (
                  <TableRow key={soundscape.id}>
                    <TableCell>
                      {soundscape.coverImage ? (
                        <img
                          src={soundscape.coverImage}
                          alt={soundscape.title}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                          <IconMusic className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{soundscape.title}</p>
                        {soundscape.titleEn && (
                          <p className="text-xs text-muted-foreground">
                            {soundscape.titleEn}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
                          soundscape.category
                        )}`}
                      >
                        {getCategoryLabel(soundscape.category)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {soundscape.duration ? formatDuration(soundscape.duration) : '∞ Loop'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {soundscape.isLoop && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-400/20 dark:text-blue-400"
                            title="Loop"
                          >
                            <IconRepeat className="h-3 w-3 mr-1" />
                            Loop
                          </span>
                        )}
                        {soundscape.isMixable && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-400/20 dark:text-purple-400"
                            title="Mixable"
                          >
                            <IconLayersSubtract className="h-3 w-3 mr-1" />
                            Mix
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {soundscape.isPremium ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-400">
                          <IconCrown className="h-3 w-3 mr-1" />
                          Premium
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-400/20 dark:text-green-400">
                          Ücretsiz
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {soundscape.isPublished ? (
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
                              router.push(`/dashboard/wellness/soundscapes/${soundscape.id}`)
                            }
                          >
                            <IconEdit className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedSoundscape(soundscape);
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Sayfa {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Önceki
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
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
            <AlertDialogTitle>Soundscape Sil</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{selectedSoundscape?.title}&quot; soundscape&apos;ini silmek istediğinize
              emin misiniz? Bu işlem geri alınamaz.
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
