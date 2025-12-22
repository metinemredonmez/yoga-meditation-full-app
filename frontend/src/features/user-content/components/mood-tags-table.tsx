'use client';

import { useEffect, useState, useCallback } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  IconLoader2,
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconSearch,
  IconTags,
  IconMoodSmile,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface MoodTag {
  id: string;
  name: string;
  nameEn?: string;
  category?: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
}

const CATEGORIES = [
  { value: 'EMOTION', label: 'Duygu' },
  { value: 'ACTIVITY', label: 'Aktivite' },
  { value: 'LOCATION', label: 'Konum' },
  { value: 'WEATHER', label: 'Hava' },
  { value: 'SOCIAL', label: 'Sosyal' },
  { value: 'HEALTH', label: 'Sağlık' },
  { value: 'OTHER', label: 'Diğer' },
];

const DEFAULT_COLORS = [
  '#8B5CF6', '#EC4899', '#06B6D4', '#10B981',
  '#F59E0B', '#EF4444', '#6366F1', '#14B8A6',
];

const EMOJI_PRESETS = ['😊', '😢', '😴', '🧘', '🏃', '🏠', '☀️', '🌧️', '👥', '💪', '🎯', '❤️'];

export function MoodTagsTable() {
  const [tags, setTags] = useState<MoodTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedTag, setSelectedTag] = useState<MoodTag | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [stats, setStats] = useState<{ total: number; active: number; byCategory: Record<string, number> } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    category: 'EMOTION',
    icon: '😊',
    color: '#8B5CF6',
    sortOrder: 0,
    isActive: true,
  });

  const loadTags = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/mood-tags', {
        params: { limit: 100, category: (categoryFilter && categoryFilter !== 'all') ? categoryFilter : undefined, search: search || undefined },
      });
      setTags(data.data || []);
    } catch (error) {
      console.error('Failed to load mood tags:', error);
      toast.error('Etiketler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, search]);

  const loadStats = useCallback(async () => {
    try {
      const { data } = await api.get('/api/admin/mood-tags/stats');
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  useEffect(() => {
    loadTags();
    loadStats();
  }, [loadTags, loadStats]);

  const openEditDialog = (tag?: MoodTag) => {
    if (tag) {
      setSelectedTag(tag);
      setFormData({
        name: tag.name,
        nameEn: tag.nameEn || '',
        category: tag.category || 'EMOTION',
        icon: tag.icon || '😊',
        color: tag.color || '#8B5CF6',
        sortOrder: tag.sortOrder,
        isActive: tag.isActive,
      });
    } else {
      setSelectedTag(null);
      setFormData({
        name: '',
        nameEn: '',
        category: 'EMOTION',
        icon: '😊',
        color: DEFAULT_COLORS[tags.length % DEFAULT_COLORS.length],
        sortOrder: tags.length,
        isActive: true,
      });
    }
    setEditDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Etiket adı zorunludur');
      return;
    }

    setSaving(true);
    try {
      if (selectedTag) {
        await api.put(`/api/admin/mood-tags/${selectedTag.id}`, formData);
        toast.success('Etiket güncellendi');
      } else {
        await api.post('/api/admin/mood-tags', formData);
        toast.success('Etiket oluşturuldu');
      }
      setEditDialog(false);
      loadTags();
      loadStats();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'İşlem başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTag) return;
    try {
      await api.delete(`/api/admin/mood-tags/${selectedTag.id}`);
      toast.success('Etiket silindi');
      setDeleteDialog(false);
      loadTags();
      loadStats();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Etiket silinemedi');
    }
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.label || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      EMOTION: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
      ACTIVITY: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      LOCATION: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      WEATHER: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
      SOCIAL: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      HEALTH: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      OTHER: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
    };
    return colors[category] || colors.OTHER;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Etiket</CardTitle>
              <IconTags className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif</CardTitle>
              <IconMoodSmile className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pasif</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-400">{stats.total - stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kategori</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(stats.byCategory || {}).length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full sm:w-[200px]"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => openEditDialog()}>
          <IconPlus className="h-4 w-4 mr-2" />
          Yeni Etiket
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : tags.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Etiket bulunamadı
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">İkon</TableHead>
                  <TableHead>Etiket Adı</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Renk</TableHead>
                  <TableHead>Sıra</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell>
                      <span className="text-2xl">{tag.icon || '🏷️'}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{tag.name}</p>
                        {tag.nameEn && (
                          <p className="text-xs text-muted-foreground">{tag.nameEn}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getCategoryColor(tag.category || 'OTHER')}>
                        {getCategoryLabel(tag.category || 'OTHER')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div
                        className="h-6 w-6 rounded-full border-2 border-white shadow"
                        style={{ backgroundColor: tag.color || '#8B5CF6' }}
                      />
                    </TableCell>
                    <TableCell>{tag.sortOrder}</TableCell>
                    <TableCell>
                      {tag.isActive ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Pasif</Badge>
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
                          <DropdownMenuItem onClick={() => openEditDialog(tag)}>
                            <IconEdit className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedTag(tag);
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

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedTag ? 'Etiketi Düzenle' : 'Yeni Etiket'}</DialogTitle>
            <DialogDescription>Mood etiketi bilgilerini girin</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Etiket Adı (TR) *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Mutlu"
                />
              </div>
              <div className="space-y-2">
                <Label>Etiket Adı (EN)</Label>
                <Input
                  value={formData.nameEn}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nameEn: e.target.value }))}
                  placeholder="Happy"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>İkon (Emoji)</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {EMOJI_PRESETS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={`text-2xl p-1 rounded hover:bg-muted ${
                      formData.icon === emoji ? 'bg-muted ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setFormData((prev) => ({ ...prev, icon: emoji }))}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
                placeholder="Emoji girin"
              />
            </div>

            <div className="space-y-2">
              <Label>Renk</Label>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`h-7 w-7 rounded-full border-2 transition-all ${
                        formData.color === color ? 'border-foreground scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData((prev) => ({ ...prev, color }))}
                    />
                  ))}
                </div>
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                  className="w-10 h-7 p-0 border-0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sıralama</Label>
                <Input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium text-sm">Aktif</div>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isActive: checked }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedTag ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Etiketi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{selectedTag?.name}&quot; etiketini silmek istediğinize emin misiniz?
              Bu işlem geri alınamaz.
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
