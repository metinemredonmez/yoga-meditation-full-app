'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAdminSleepStories,
  deleteSleepStory,
  getSleepStoryStats,
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
  IconMoon,
  IconCrown,
  IconStar,
  IconPlayerPlay,
  IconMicrophone,
} from '@tabler/icons-react';
import { toast } from 'sonner';

interface SleepStory {
  id: string;
  title: string;
  titleEn?: string;
  slug: string;
  category: string;
  narratorName?: string;
  duration: number;
  audioUrl?: string;
  coverImageUrl?: string;
  backgroundSound?: {
    id: string;
    title: string;
  };
  isPremium: boolean;
  isFeatured: boolean;
  isPublished: boolean;
  playCount?: number;
  averageRating?: number;
  createdAt: string;
}

interface Stats {
  total: number;
  published: number;
  premium: number;
  featured: number;
}

const CATEGORY_OPTIONS = [
  { value: '', label: 'Tümü' },
  { value: 'NATURE', label: 'Doğa', color: 'bg-green-100 text-green-700' },
  { value: 'FANTASY', label: 'Fantastik', color: 'bg-purple-100 text-purple-700' },
  { value: 'TRAVEL', label: 'Seyahat', color: 'bg-blue-100 text-blue-700' },
  { value: 'HISTORY', label: 'Tarih', color: 'bg-amber-100 text-amber-700' },
  { value: 'SCIENCE', label: 'Bilim', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'MEDITATION', label: 'Meditasyon', color: 'bg-violet-100 text-violet-700' },
  { value: 'AMBIENT', label: 'Ambient', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'CITY', label: 'Şehir', color: 'bg-gray-100 text-gray-700' },
  { value: 'TURKISH', label: 'Türk Hikayeleri', color: 'bg-red-100 text-red-700' },
];

export function SleepStoriesTable() {
  const router = useRouter();
  const [stories, setStories] = useState<SleepStory[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedStory, setSelectedStory] = useState<SleepStory | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [premiumFilter, setPremiumFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');
  const [publishedFilter, setPublishedFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const loadStories = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit,
      };
      if (search) params.search = search;
      if (category) params.category = category;
      if (premiumFilter) params.isPremium = premiumFilter === 'true';
      if (featuredFilter) params.isFeatured = featuredFilter === 'true';
      if (publishedFilter) params.isPublished = publishedFilter === 'true';

      const data = await getAdminSleepStories(params);
      setStories(data.sleepStories || data.stories || []);
      setTotalPages(Math.ceil((data.total || 0) / limit));

      // Load stats
      try {
        const statsData = await getSleepStoryStats();
        setStats(statsData);
      } catch {
        // Stats endpoint may not exist
      }
    } catch (error) {
      console.error('Failed to load sleep stories:', error);
      toast.error('Uyku hikayeleri yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [page, search, category, premiumFilter, featuredFilter, publishedFilter]);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  useEffect(() => {
    setPage(1);
  }, [search, category, premiumFilter, featuredFilter, publishedFilter]);

  const handleDelete = async () => {
    if (!selectedStory) return;
    try {
      await deleteSleepStory(selectedStory.id);
      toast.success('Uyku hikayesi silindi');
      setDeleteDialog(false);
      loadStories();
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

  const renderRating = (rating?: number) => {
    if (!rating) return <span className="text-muted-foreground">-</span>;
    return (
      <div className="flex items-center gap-1">
        <IconStar className="h-4 w-4 text-amber-500 fill-amber-500" />
        <span>{rating.toFixed(1)}</span>
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
                  <p className="text-sm text-muted-foreground">Toplam</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <IconMoon className="h-8 w-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Yayında</p>
                  <p className="text-2xl font-bold text-green-600">{stats.published}</p>
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
                  <p className="text-sm text-muted-foreground">Öne Çıkan</p>
                  <p className="text-2xl font-bold text-violet-600">{stats.featured}</p>
                </div>
                <IconStar className="h-8 w-8 text-violet-500" />
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
                  <SelectItem key={cat.value} value={cat.value || 'all'}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={premiumFilter} onValueChange={setPremiumFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Premium" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="true">Premium</SelectItem>
                <SelectItem value="false">Ücretsiz</SelectItem>
              </SelectContent>
            </Select>
            <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Öne Çıkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="true">Evet</SelectItem>
                <SelectItem value="false">Hayır</SelectItem>
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
            <Button onClick={() => router.push('/dashboard/wellness/sleep-stories/new')}>
              <IconPlus className="h-4 w-4 mr-2" />
              Yeni Hikaye
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
          ) : stories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Uyku hikayesi bulunamadı
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Görsel</TableHead>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Anlatıcı</TableHead>
                  <TableHead>Süre</TableHead>
                  <TableHead>Arka Plan</TableHead>
                  <TableHead>Dinlenme</TableHead>
                  <TableHead>Puan</TableHead>
                  <TableHead>Erişim</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stories.map((story) => (
                  <TableRow key={story.id}>
                    <TableCell>
                      {story.coverImageUrl ? (
                        <img
                          src={story.coverImageUrl}
                          alt={story.title}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                          <IconMoon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{story.title}</p>
                        {story.titleEn && (
                          <p className="text-xs text-muted-foreground">
                            {story.titleEn}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
                          story.category
                        )}`}
                      >
                        {getCategoryLabel(story.category)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {story.narratorName ? (
                        <div className="flex items-center gap-1">
                          <IconMicrophone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{story.narratorName}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {formatDuration(story.duration)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {story.backgroundSound ? (
                        <span className="text-sm text-muted-foreground">
                          {story.backgroundSound.title}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {story.playCount?.toLocaleString() || 0}
                      </span>
                    </TableCell>
                    <TableCell>{renderRating(story.averageRating)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {story.isPremium ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-400">
                            <IconCrown className="h-3 w-3 mr-1" />
                            Premium
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-400/20 dark:text-green-400">
                            Ücretsiz
                          </span>
                        )}
                        {story.isFeatured && (
                          <IconStar className="h-4 w-4 text-violet-500 fill-violet-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {story.isPublished ? (
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
                              router.push(`/dashboard/wellness/sleep-stories/${story.id}`)
                            }
                          >
                            <IconEdit className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedStory(story);
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
            <AlertDialogTitle>Uyku Hikayesi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{selectedStory?.title}&quot; hikayesini silmek istediğinize
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
