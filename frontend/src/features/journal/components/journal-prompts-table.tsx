'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAdminJournalPrompts,
  deleteJournalPrompt,
  getJournalPromptStats,
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
  IconPencil,
  IconHeart,
  IconMoon,
  IconMoodHappy,
  IconSun,
  IconStar,
  IconSparkles,
  IconGripVertical,
} from '@tabler/icons-react';
import { toast } from 'sonner';

interface JournalPrompt {
  id: string;
  prompt: string;
  promptEn?: string;
  type: string;
  category?: string;
  useCount: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
  byType: Record<string, number>;
}

const TYPE_OPTIONS: Record<string, { label: string; color: string }> = {
  FREE_WRITE: { label: 'Serbest Yazı', color: 'bg-gray-500' },
  GRATITUDE: { label: 'Şükran', color: 'bg-pink-500' },
  REFLECTION: { label: 'Yansıma', color: 'bg-blue-500' },
  DREAM: { label: 'Rüya', color: 'bg-purple-500' },
  MOOD: { label: 'Duygu', color: 'bg-yellow-500' },
  PRACTICE_NOTES: { label: 'Pratik Notları', color: 'bg-green-500' },
  INTENTION: { label: 'Niyet', color: 'bg-indigo-500' },
  AFFIRMATION: { label: 'Olumlama', color: 'bg-rose-500' },
  MORNING_PAGES: { label: 'Sabah Sayfaları', color: 'bg-amber-500' },
  EVENING_REVIEW: { label: 'Akşam Değerlendirmesi', color: 'bg-slate-500' },
};

const CATEGORY_OPTIONS: Record<string, string> = {
  daily: 'Günlük',
  weekly: 'Haftalık',
  morning: 'Sabah',
  deep: 'Derin',
  gratitude: 'Şükran',
};

export function JournalPromptsTable() {
  const router = useRouter();
  const [prompts, setPrompts] = useState<JournalPrompt[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<JournalPrompt | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  const loadPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (typeFilter) params.type = typeFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (activeFilter) params.isActive = activeFilter === 'true';

      const data = await getAdminJournalPrompts(params);
      setPrompts(data.prompts || data.journalPrompts || []);

      // Load stats
      try {
        const statsData = await getJournalPromptStats();
        setStats(statsData);
      } catch {
        // Stats endpoint may not exist
      }
    } catch (error) {
      console.error('Failed to load journal prompts:', error);
      toast.error('Günlük soruları yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, categoryFilter, activeFilter]);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  const handleDelete = async () => {
    if (!selectedPrompt) return;
    try {
      await deleteJournalPrompt(selectedPrompt.id);
      toast.success('Günlük sorusu silindi');
      setDeleteDialog(false);
      loadPrompts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Silme işlemi başarısız');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'GRATITUDE':
        return <IconHeart className="h-4 w-4" />;
      case 'DREAM':
        return <IconMoon className="h-4 w-4" />;
      case 'MOOD':
        return <IconMoodHappy className="h-4 w-4" />;
      case 'MORNING_PAGES':
        return <IconSun className="h-4 w-4" />;
      case 'AFFIRMATION':
        return <IconSparkles className="h-4 w-4" />;
      case 'INTENTION':
        return <IconStar className="h-4 w-4" />;
      default:
        return <IconPencil className="h-4 w-4" />;
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
                <IconPencil className="h-8 w-8 text-violet-500" />
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
                <IconSparkles className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pasif</p>
                  <p className="text-2xl font-bold text-gray-500">{stats.inactive}</p>
                </div>
                <IconPencil className="h-8 w-8 text-gray-400" />
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
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tüm Tipler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {Object.entries(TYPE_OPTIONS).map(([value, { label }]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {Object.entries(CATEGORY_OPTIONS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
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

            <Button onClick={() => router.push('/dashboard/journal/prompts/new')}>
              <IconPlus className="h-4 w-4 mr-2" />
              Yeni Soru
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
          ) : prompts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Günlük sorusu bulunamadı
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead className="min-w-[300px]">Prompt (TR)</TableHead>
                  <TableHead className="min-w-[300px]">Prompt (EN)</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Kullanım</TableHead>
                  <TableHead>Sıra</TableHead>
                  <TableHead>Aktif</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prompts
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((prompt) => (
                    <TableRow key={prompt.id}>
                      <TableCell>
                        <IconGripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`${TYPE_OPTIONS[prompt.type]?.color || 'bg-gray-500'} text-white`}
                        >
                          <span className="flex items-center gap-1">
                            {getTypeIcon(prompt.type)}
                            {TYPE_OPTIONS[prompt.type]?.label || prompt.type}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{truncateText(prompt.prompt, 80)}</span>
                      </TableCell>
                      <TableCell>
                        {prompt.promptEn ? (
                          <span className="text-sm text-muted-foreground">
                            {truncateText(prompt.promptEn, 80)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {prompt.category ? (
                          <Badge variant="outline">
                            {CATEGORY_OPTIONS[prompt.category] || prompt.category}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{prompt.useCount}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{prompt.sortOrder}</span>
                      </TableCell>
                      <TableCell>
                        <Switch checked={prompt.isActive} disabled />
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
                                router.push(`/dashboard/journal/prompts/${prompt.id}`)
                              }
                            >
                              <IconEdit className="mr-2 h-4 w-4" />
                              Düzenle
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedPrompt(prompt);
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
            <AlertDialogTitle>Günlük Sorusu Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu soruyu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
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
