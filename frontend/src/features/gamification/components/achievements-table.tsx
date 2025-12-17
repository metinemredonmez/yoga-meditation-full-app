'use client';

import { useEffect, useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  IconPlus,
  IconSearch,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconLoader2,
  IconTrophy,
  IconStar,
  IconEyeOff,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import {
  getAchievements,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  getAchievementCategories,
} from '@/lib/api';

interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  xpReward: number;
  condition: string;
  conditionValue: number;
  isSecret: boolean;
  badgeImageUrl?: string;
  isActive: boolean;
  unlockedCount?: number;
  createdAt: string;
}

const conditionTypes = [
  { value: 'CLASSES_COMPLETED', label: 'Tamamlanan Ders Sayısı' },
  { value: 'TOTAL_MINUTES', label: 'Toplam Dakika' },
  { value: 'STREAK_DAYS', label: 'Seri Gün Sayısı' },
  { value: 'PROGRAMS_COMPLETED', label: 'Tamamlanan Program' },
  { value: 'CHALLENGES_WON', label: 'Kazanılan Challenge' },
  { value: 'XP_EARNED', label: 'Kazanılan XP' },
  { value: 'LEVEL_REACHED', label: 'Ulaşılan Seviye' },
  { value: 'REFERRALS_COUNT', label: 'Davet Edilen Kişi' },
  { value: 'REVIEWS_GIVEN', label: 'Verilen Yorum' },
];

export function AchievementsTable() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    icon: '',
    xpReward: 100,
    condition: 'CLASSES_COMPLETED',
    conditionValue: 1,
    isSecret: false,
    badgeImageUrl: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [categoryFilter, currentPage, pageSize]);

  const loadData = async () => {
    try {
      const [achievementsData, categoriesData] = await Promise.all([
        getAchievements({
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          page: currentPage,
          limit: pageSize,
        }),
        getAchievementCategories(),
      ]);
      setAchievements(achievementsData?.achievements || achievementsData?.data || achievementsData || []);
      setTotalItems(achievementsData?.total || achievementsData?.pagination?.total || achievements.length);
      setCategories(categoriesData?.categories || categoriesData || []);
    } catch {
      // Mock data
      const mockData = [
        {
          id: '1',
          name: 'İlk Adım',
          description: 'İlk yoga dersini tamamla',
          category: 'BEGINNER',
          icon: '🌱',
          xpReward: 50,
          condition: 'CLASSES_COMPLETED',
          conditionValue: 1,
          isSecret: false,
          isActive: true,
          unlockedCount: 1250,
          createdAt: '2024-01-01',
        },
        {
          id: '2',
          name: 'Haftalık Yogi',
          description: '7 gün üst üste pratik yap',
          category: 'STREAK',
          icon: '🔥',
          xpReward: 200,
          condition: 'STREAK_DAYS',
          conditionValue: 7,
          isSecret: false,
          isActive: true,
          unlockedCount: 450,
          createdAt: '2024-01-01',
        },
        {
          id: '3',
          name: 'Gizli Usta',
          description: '???',
          category: 'SECRET',
          icon: '🎭',
          xpReward: 500,
          condition: 'LEVEL_REACHED',
          conditionValue: 50,
          isSecret: true,
          isActive: true,
          unlockedCount: 12,
          createdAt: '2024-01-01',
        },
      ];
      setAchievements(mockData);
      setTotalItems(mockData.length);
      setCategories(['BEGINNER', 'INTERMEDIATE', 'STREAK', 'SOCIAL', 'SECRET']);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createAchievement(formData);
      toast.success('Başarı oluşturuldu');
      setIsCreateOpen(false);
      resetForm();
      loadData();
    } catch {
      toast.error('Oluşturma başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedAchievement) return;
    setSaving(true);
    try {
      await updateAchievement(selectedAchievement.id, formData);
      toast.success('Başarı güncellendi');
      setIsEditOpen(false);
      loadData();
    } catch {
      toast.error('Güncelleme başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAchievement) return;
    setSaving(true);
    try {
      await deleteAchievement(selectedAchievement.id);
      toast.success('Başarı silindi');
      setIsDeleteOpen(false);
      loadData();
    } catch {
      toast.error('Silme başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (achievement: Achievement) => {
    try {
      await updateAchievement(achievement.id, { isActive: !achievement.isActive });
      toast.success(achievement.isActive ? 'Başarı devre dışı bırakıldı' : 'Başarı aktifleştirildi');
      loadData();
    } catch {
      toast.error('Güncelleme başarısız');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      icon: '',
      xpReward: 100,
      condition: 'CLASSES_COMPLETED',
      conditionValue: 1,
      isSecret: false,
      badgeImageUrl: '',
    });
  };

  const openEditDialog = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setFormData({
      name: achievement.name,
      description: achievement.description,
      category: achievement.category,
      icon: achievement.icon,
      xpReward: achievement.xpReward,
      condition: achievement.condition,
      conditionValue: achievement.conditionValue,
      isSecret: achievement.isSecret,
      badgeImageUrl: achievement.badgeImageUrl || '',
    });
    setIsEditOpen(true);
  };

  const filteredAchievements = achievements.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Başarı ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kategoriler</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
              <IconPlus className="mr-2 h-4 w-4" />
              Yeni Başarı
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Yeni Başarı Oluştur</DialogTitle>
              <DialogDescription>
                Kullanıcıların kazanabileceği yeni bir başarı tanımlayın
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3 space-y-2">
                  <Label>Başarı Adı</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="İlk Adım"
                  />
                </div>
                <div className="space-y-2">
                  <Label>İkon</Label>
                  <Input
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="🏆"
                    className="text-center text-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Bu başarıyı kazanmak için..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                      <SelectItem value="NEW">+ Yeni Kategori</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>XP Ödülü</Label>
                  <Input
                    type="number"
                    value={formData.xpReward}
                    onChange={(e) => setFormData({ ...formData, xpReward: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Koşul Tipi</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(v) => setFormData({ ...formData, condition: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {conditionTypes.map((ct) => (
                        <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Koşul Değeri</Label>
                  <Input
                    type="number"
                    value={formData.conditionValue}
                    onChange={(e) => setFormData({ ...formData, conditionValue: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Rozet Resmi URL (opsiyonel)</Label>
                <Input
                  value={formData.badgeImageUrl}
                  onChange={(e) => setFormData({ ...formData, badgeImageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isSecret}
                  onCheckedChange={(v) => setFormData({ ...formData, isSecret: v })}
                />
                <Label>Gizli Başarı (kullanıcılar açmadan göremez)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>İptal</Button>
              <Button onClick={handleCreate} disabled={saving || !formData.name}>
                {saving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                Oluştur
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Başarı</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Koşul</TableHead>
              <TableHead className="text-right">XP</TableHead>
              <TableHead className="text-right">Açan</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAchievements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Başarı bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              filteredAchievements.map((achievement) => (
                <TableRow key={achievement.id}>
                  <TableCell>
                    <div className="text-2xl">{achievement.icon || '🏆'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium flex items-center gap-1">
                          {achievement.name}
                          {achievement.isSecret && (
                            <IconEyeOff className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {achievement.isSecret ? '???' : achievement.description}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{achievement.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {conditionTypes.find(c => c.value === achievement.condition)?.label || achievement.condition}
                      <span className="text-muted-foreground"> ≥ {achievement.conditionValue}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <IconStar className="h-4 w-4 text-yellow-500" />
                      {achievement.xpReward}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {achievement.unlockedCount?.toLocaleString() || 0}
                  </TableCell>
                  <TableCell>
                    <Badge variant={achievement.isActive ? 'default' : 'secondary'}>
                      {achievement.isActive ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <IconDotsVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(achievement)}>
                          <IconEdit className="mr-2 h-4 w-4" />
                          Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(achievement)}>
                          <IconTrophy className="mr-2 h-4 w-4" />
                          {achievement.isActive ? 'Devre Dışı Bırak' : 'Aktifleştir'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSelectedAchievement(achievement);
                            setIsDeleteOpen(true);
                          }}
                        >
                          <IconTrash className="mr-2 h-4 w-4" />
                          Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination
        currentPage={currentPage}
        totalPages={Math.ceil(totalItems / pageSize)}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={(page) => setCurrentPage(page)}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
      />

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Başarıyı Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3 space-y-2">
                <Label>Başarı Adı</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>İkon</Label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="text-center text-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Açıklama</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>XP Ödülü</Label>
                <Input
                  type="number"
                  value={formData.xpReward}
                  onChange={(e) => setFormData({ ...formData, xpReward: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Koşul Tipi</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(v) => setFormData({ ...formData, condition: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {conditionTypes.map((ct) => (
                      <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Koşul Değeri</Label>
                <Input
                  type="number"
                  value={formData.conditionValue}
                  onChange={(e) => setFormData({ ...formData, conditionValue: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isSecret}
                onCheckedChange={(v) => setFormData({ ...formData, isSecret: v })}
              />
              <Label>Gizli Başarı</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>İptal</Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Başarıyı Sil</DialogTitle>
            <DialogDescription>
              &quot;{selectedAchievement?.name}&quot; başarısını silmek istediğinize emin misiniz?
              Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>İptal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
