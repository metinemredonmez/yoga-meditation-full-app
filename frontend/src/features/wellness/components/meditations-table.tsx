'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAdminMeditations,
  getMeditationCategories,
  deleteMeditation,
  updateMeditation,
  getInstructors,
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
  IconPlayerPlay,
  IconClock,
} from '@tabler/icons-react';
import { toast } from 'sonner';

type DifficultyType = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

interface Meditation {
  id: string;
  title: string;
  titleTr?: string;
  slug: string;
  description: string;
  durationSeconds: number;
  difficulty: DifficultyType;
  audioUrl?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  isPremium: boolean;
  isFeatured: boolean;
  isActive: boolean;
  playCount: number;
  averageRating?: number;
  ratingCount?: number;
  category?: {
    id: string;
    name: string;
  };
  instructor?: {
    id: string;
    displayName: string;
  };
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Instructor {
  id: string;
  displayName: string;
}

export function MeditationsTable() {
  const router = useRouter();
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [premiumFilter, setPremiumFilter] = useState<string>('all');
  const [publishedFilter, setPublishedFilter] = useState<string>('all');
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedMeditation, setSelectedMeditation] = useState<Meditation | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  const loadMeditations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminMeditations({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        categoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
        difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined,
        isPremium: premiumFilter !== 'all' ? premiumFilter === 'true' : undefined,
        isPublished: publishedFilter !== 'all' ? publishedFilter === 'true' : undefined,
      });
      setMeditations(data.meditations || []);
      setPagination(prev => ({ ...prev, total: data.pagination?.total || 0 }));
    } catch (error) {
      console.error('Failed to load meditations:', error);
      toast.error('Meditasyonlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, categoryFilter, difficultyFilter, premiumFilter, publishedFilter]);

  const loadFilters = useCallback(async () => {
    try {
      const [catData, instData] = await Promise.all([
        getMeditationCategories(),
        getInstructors({ limit: 100 }),
      ]);
      setCategories(catData.categories || catData || []);
      setInstructors(instData.instructors || []);
    } catch (error) {
      console.error('Failed to load filters:', error);
    }
  }, []);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    loadMeditations();
  }, [loadMeditations]);

  const handleDelete = async () => {
    if (!selectedMeditation) return;
    try {
      await deleteMeditation(selectedMeditation.id);
      toast.success('Meditasyon silindi');
      setDeleteDialog(false);
      loadMeditations();
    } catch (error) {
      toast.error('Meditasyon silinemedi');
    }
  };

  const handleTogglePublish = async (meditation: Meditation) => {
    try {
      await updateMeditation(meditation.id, { isActive: !meditation.isActive });
      toast.success(meditation.isActive ? 'Yayından kaldırıldı' : 'Yayınlandı');
      loadMeditations();
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const handleToggleFeatured = async (meditation: Meditation) => {
    try {
      await updateMeditation(meditation.id, { isFeatured: !meditation.isFeatured });
      toast.success(meditation.isFeatured ? 'Öne çıkan kaldırıldı' : 'Öne çıkarıldı');
      loadMeditations();
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
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

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Meditasyon ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kategoriler</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Seviye" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Seviyeler</SelectItem>
              <SelectItem value="BEGINNER">Başlangıç</SelectItem>
              <SelectItem value="INTERMEDIATE">Orta</SelectItem>
              <SelectItem value="ADVANCED">İleri</SelectItem>
            </SelectContent>
          </Select>
          <Select value={premiumFilter} onValueChange={setPremiumFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Premium" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="true">Premium</SelectItem>
              <SelectItem value="false">Ücretsiz</SelectItem>
            </SelectContent>
          </Select>
          <Select value={publishedFilter} onValueChange={setPublishedFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="true">Yayında</SelectItem>
              <SelectItem value="false">Taslak</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => router.push('/dashboard/wellness/meditations/new')}>
          <IconPlus className="h-4 w-4 mr-2" />
          Yeni Meditasyon
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : meditations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Meditasyon bulunamadı
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]"></TableHead>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Eğitmen</TableHead>
                  <TableHead>Süre</TableHead>
                  <TableHead>Seviye</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead>Dinlenme</TableHead>
                  <TableHead>Puan</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meditations.map((meditation) => (
                  <TableRow key={meditation.id}>
                    <TableCell>
                      <div className="relative h-10 w-10 flex-shrink-0">
                        {meditation.thumbnailUrl || meditation.imageUrl ? (
                          <img
                            src={meditation.thumbnailUrl || meditation.imageUrl}
                            alt={meditation.title}
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-400/30 dark:to-purple-500/40 flex items-center justify-center">
                            <IconPlayerPlay className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium line-clamp-1">{meditation.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {meditation.slug}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {meditation.category ? (
                        <Badge variant="outline">{meditation.category.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {meditation.instructor?.displayName || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <IconClock className="h-3 w-3 text-muted-foreground" />
                        {formatDuration(meditation.durationSeconds)}
                      </div>
                    </TableCell>
                    <TableCell>{getDifficultyBadge(meditation.difficulty)}</TableCell>
                    <TableCell>
                      {meditation.isPremium ? (
                        <IconCrown className="h-4 w-4 text-amber-500" />
                      ) : (
                        <span className="text-muted-foreground text-sm">Ücretsiz</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{meditation.playCount}</span>
                    </TableCell>
                    <TableCell>
                      {meditation.averageRating ? (
                        <div className="flex items-center gap-1">
                          <IconStarFilled className="h-3 w-3 text-amber-400" />
                          <span className="text-sm">{meditation.averageRating.toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground">
                            ({meditation.ratingCount})
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {meditation.isActive ? (
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
                              router.push(`/dashboard/wellness/meditations/${meditation.id}`)
                            }
                          >
                            <IconEdit className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTogglePublish(meditation)}>
                            {meditation.isActive ? (
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
                          <DropdownMenuItem onClick={() => handleToggleFeatured(meditation)}>
                            {meditation.isFeatured ? (
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
                              setSelectedMeditation(meditation);
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
            Toplam {pagination.total} meditasyon
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
            <AlertDialogTitle>Meditasyon Sil</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{selectedMeditation?.title}&quot; meditasyonunu silmek istediğinize emin
              misiniz?
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
