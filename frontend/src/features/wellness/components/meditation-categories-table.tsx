'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getMeditationCategories,
  createMeditationCategory,
  updateMeditationCategory,
  deleteMeditationCategory,
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
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
  IconGripVertical,
} from '@tabler/icons-react';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  nameTr?: string;
  slug: string;
  description?: string;
  descriptionTr?: string;
  iconUrl?: string;
  imageUrl?: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
  _count?: {
    meditations: number;
  };
}

const DEFAULT_COLORS = [
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#6366F1', // indigo
  '#14B8A6', // teal
];

export function MeditationCategoriesTable() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    nameTr: '',
    slug: '',
    description: '',
    descriptionTr: '',
    iconUrl: '',
    imageUrl: '',
    color: '#8B5CF6',
    sortOrder: 0,
    isActive: true,
  });

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMeditationCategories({ includeInactive: true });
      setCategories(data.categories || data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast.error('Kategoriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[ğ]/g, 'g')
      .replace(/[ü]/g, 'u')
      .replace(/[ş]/g, 's')
      .replace(/[ı]/g, 'i')
      .replace(/[ö]/g, 'o')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const openEditDialog = (category?: Category) => {
    if (category) {
      setSelectedCategory(category);
      setFormData({
        name: category.name,
        nameTr: category.nameTr || '',
        slug: category.slug,
        description: category.description || '',
        descriptionTr: category.descriptionTr || '',
        iconUrl: category.iconUrl || '',
        imageUrl: category.imageUrl || '',
        color: category.color || '#8B5CF6',
        sortOrder: category.sortOrder,
        isActive: category.isActive,
      });
    } else {
      setSelectedCategory(null);
      setFormData({
        name: '',
        nameTr: '',
        slug: '',
        description: '',
        descriptionTr: '',
        iconUrl: '',
        imageUrl: '',
        color: DEFAULT_COLORS[categories.length % DEFAULT_COLORS.length],
        sortOrder: categories.length,
        isActive: true,
      });
    }
    setEditDialog(true);
  };

  const handleNameChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      name: value,
      slug: prev.slug || generateSlug(value),
    }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast.error('İsim ve slug zorunludur');
      return;
    }

    setSaving(true);
    try {
      if (selectedCategory) {
        await updateMeditationCategory(selectedCategory.id, formData);
        toast.success('Kategori güncellendi');
      } else {
        await createMeditationCategory(formData);
        toast.success('Kategori oluşturuldu');
      }
      setEditDialog(false);
      loadCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'İşlem başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    try {
      await deleteMeditationCategory(selectedCategory.id);
      toast.success('Kategori silindi');
      setDeleteDialog(false);
      loadCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Kategori silinemedi');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Meditasyon kategorilerini yönetin
          </p>
        </div>
        <Button onClick={() => openEditDialog()}>
          <IconPlus className="h-4 w-4 mr-2" />
          Yeni Kategori
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Kategori bulunamadı
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="w-[50px]">Renk</TableHead>
                  <TableHead>Kategori Adı</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Meditasyon</TableHead>
                  <TableHead>Sıra</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <IconGripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      </TableCell>
                      <TableCell>
                        <div
                          className="h-6 w-6 rounded-full border-2 border-white shadow"
                          style={{ backgroundColor: category.color || '#8B5CF6' }}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{category.name}</p>
                          {category.nameTr && (
                            <p className="text-xs text-muted-foreground">
                              {category.nameTr}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {category.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {category._count?.meditations || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{category.sortOrder}</span>
                      </TableCell>
                      <TableCell>
                        {category.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-400/20 dark:text-green-400">
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-400/20 dark:text-slate-400">
                            Pasif
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
                            <DropdownMenuItem onClick={() => openEditDialog(category)}>
                              <IconEdit className="mr-2 h-4 w-4" />
                              Düzenle
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedCategory(category);
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? 'Kategori Düzenle' : 'Yeni Kategori'}
            </DialogTitle>
            <DialogDescription>Kategori bilgilerini girin</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori Adı (TR) *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Stres Azaltma"
                />
              </div>
              <div className="space-y-2">
                <Label>Kategori Adı (EN)</Label>
                <Input
                  value={formData.nameTr}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nameTr: e.target.value }))
                  }
                  placeholder="Stress Relief"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Slug *</Label>
              <Input
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, slug: e.target.value }))
                }
                placeholder="stres-azaltma"
              />
            </div>

            <div className="space-y-2">
              <Label>Açıklama</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Kategori açıklaması"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Renk</Label>
              <div className="flex items-center gap-2">
                <div className="flex gap-2">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`h-8 w-8 rounded-full border-2 transition-all ${
                        formData.color === color
                          ? 'border-foreground scale-110'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData((prev) => ({ ...prev, color }))}
                    />
                  ))}
                </div>
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, color: e.target.value }))
                  }
                  className="w-12 h-8 p-0 border-0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>İkon URL</Label>
                <Input
                  value={formData.iconUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, iconUrl: e.target.value }))
                  }
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Sıralama</Label>
                <Input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sortOrder: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium text-sm">Aktif</div>
                <div className="text-xs text-muted-foreground">
                  Kategoriyi göster
                </div>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedCategory ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kategori Sil</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{selectedCategory?.name}&quot; kategorisini silmek istediğinize emin
              misiniz?
              {(selectedCategory?._count?.meditations ?? 0) > 0 && (
                <span className="block mt-2 text-amber-600">
                  Bu kategoride {selectedCategory?._count?.meditations} meditasyon
                  bulunuyor.
                </span>
              )}
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
