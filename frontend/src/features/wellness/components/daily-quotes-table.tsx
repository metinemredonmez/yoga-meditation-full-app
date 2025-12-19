'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAdminDailyQuotes,
  deleteDailyQuote,
  getDailyQuoteStats,
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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconQuote,
  IconCalendar,
  IconLanguage,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface DailyQuote {
  id: string;
  text: string;
  textEn?: string;
  author?: string;
  category?: string;
  language: string;
  scheduledDate?: string;
  isActive: boolean;
  createdAt: string;
}

interface Stats {
  total: number;
  active: number;
  scheduled: number;
}

const CATEGORY_OPTIONS: Record<string, { label: string; color: string }> = {
  MOTIVATION: { label: 'Motivasyon', color: 'bg-orange-500' },
  MINDFULNESS: { label: 'Farkındalık', color: 'bg-blue-500' },
  HAPPINESS: { label: 'Mutluluk', color: 'bg-yellow-500' },
  PEACE: { label: 'Huzur', color: 'bg-green-500' },
  SELF_LOVE: { label: 'Öz Sevgi', color: 'bg-pink-500' },
  YOGA: { label: 'Yoga', color: 'bg-purple-500' },
  SUFI: { label: 'Sufi', color: 'bg-amber-700' },
  GRATITUDE: { label: 'Şükran', color: 'bg-rose-500' },
};

export function DailyQuotesTable() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<DailyQuote[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<DailyQuote | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  const loadQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (categoryFilter) params.category = categoryFilter;
      if (languageFilter) params.language = languageFilter;
      if (activeFilter) params.isActive = activeFilter === 'true';

      const data = await getAdminDailyQuotes(params);
      setQuotes(data.quotes || data.dailyQuotes || []);

      // Load stats
      try {
        const statsData = await getDailyQuoteStats();
        setStats(statsData);
      } catch {
        // Stats endpoint may not exist
      }
    } catch (error) {
      console.error('Failed to load daily quotes:', error);
      toast.error('Günün sözleri yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, languageFilter, activeFilter]);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  const handleDelete = async () => {
    if (!selectedQuote) return;
    try {
      await deleteDailyQuote(selectedQuote.id);
      toast.success('Söz silindi');
      setDeleteDialog(false);
      loadQuotes();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Silme işlemi başarısız');
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Toplam</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <IconQuote className="h-8 w-8 text-violet-500" />
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
                <IconQuote className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Planlanmış</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
                </div>
                <IconCalendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kategoriler</SelectItem>
                  {Object.entries(CATEGORY_OPTIONS).map(([value, { label }]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Dil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="tr">Türkçe</SelectItem>
                  <SelectItem value="en">İngilizce</SelectItem>
                </SelectContent>
              </Select>

              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="true">Aktif</SelectItem>
                  <SelectItem value="false">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => router.push('/dashboard/wellness/daily-quotes/new')}>
              <IconPlus className="h-4 w-4 mr-2" />
              Yeni Söz
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
          ) : quotes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Günün sözü bulunamadı
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[300px]">Söz</TableHead>
                  <TableHead>Yazar</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Dil</TableHead>
                  <TableHead>Planlanmış Tarih</TableHead>
                  <TableHead>Aktif</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">&quot;{truncateText(quote.text, 100)}&quot;</p>
                        {quote.textEn && (
                          <p className="text-sm text-muted-foreground">
                            &quot;{truncateText(quote.textEn, 80)}&quot;
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {quote.author ? (
                        <span className="text-sm">{quote.author}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {quote.category ? (
                        <Badge
                          variant="secondary"
                          className={`${CATEGORY_OPTIONS[quote.category]?.color || 'bg-gray-500'} text-white`}
                        >
                          {CATEGORY_OPTIONS[quote.category]?.label || quote.category}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <IconLanguage className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm uppercase">{quote.language}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {quote.scheduledDate ? (
                        <div className="flex items-center gap-1">
                          <IconCalendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {format(new Date(quote.scheduledDate), 'd MMM yyyy', {
                              locale: tr,
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch checked={quote.isActive} disabled />
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
                              router.push(`/dashboard/wellness/daily-quotes/${quote.id}`)
                            }
                          >
                            <IconEdit className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedQuote(quote);
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

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Günün Sözü Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu sözü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
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
