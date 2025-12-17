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
  IconCoin,
  IconDiamond,
  IconShoppingCart,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import {
  getShopItems,
  createShopItem,
  updateShopItem,
  deleteShopItem,
} from '@/lib/api';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: 'STREAK_FREEZE' | 'XP_BOOST' | 'COSMETIC' | 'PREMIUM_CONTENT';
  price: number;
  currency: 'COINS' | 'GEMS';
  imageUrl?: string;
  isLimitedTime: boolean;
  availableUntil?: string;
  maxPurchases?: number;
  isActive: boolean;
  purchaseCount?: number;
  createdAt: string;
}

const categories = [
  { value: 'STREAK_FREEZE', label: 'Seri Dondurma', icon: '❄️' },
  { value: 'XP_BOOST', label: 'XP Boost', icon: '⚡' },
  { value: 'COSMETIC', label: 'Kozmetik', icon: '🎨' },
  { value: 'PREMIUM_CONTENT', label: 'Premium İçerik', icon: '👑' },
];

export function ShopItemsTable() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'STREAK_FREEZE' as ShopItem['category'],
    price: 100,
    currency: 'COINS' as 'COINS' | 'GEMS',
    imageUrl: '',
    isLimitedTime: false,
    availableUntil: '',
    maxPurchases: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [categoryFilter, currentPage, pageSize]);

  const loadData = async () => {
    try {
      const data = await getShopItems({
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        page: currentPage,
        limit: pageSize,
      });
      setItems(data?.items || data?.data || data || []);
      setTotalItems(data?.total || data?.pagination?.total || items.length);
    } catch {
      // Mock data
      const mockData: ShopItem[] = [
        {
          id: '1',
          name: 'Seri Dondurma',
          description: '1 günlük seri dondurma hakkı',
          category: 'STREAK_FREEZE',
          price: 50,
          currency: 'COINS',
          isLimitedTime: false,
          isActive: true,
          purchaseCount: 1250,
          createdAt: '2024-01-01',
        },
        {
          id: '2',
          name: '2x XP Boost',
          description: '24 saat boyunca 2x XP kazan',
          category: 'XP_BOOST',
          price: 100,
          currency: 'COINS',
          isLimitedTime: false,
          isActive: true,
          purchaseCount: 890,
          createdAt: '2024-01-01',
        },
        {
          id: '3',
          name: 'Altın Çerçeve',
          description: 'Profilinde altın çerçeve',
          category: 'COSMETIC',
          price: 50,
          currency: 'GEMS',
          isLimitedTime: false,
          isActive: true,
          purchaseCount: 234,
          createdAt: '2024-01-01',
        },
        {
          id: '4',
          name: 'Yılbaşı Paketi',
          description: 'Özel yılbaşı içerikleri',
          category: 'PREMIUM_CONTENT',
          price: 200,
          currency: 'GEMS',
          isLimitedTime: true,
          availableUntil: '2025-01-15',
          maxPurchases: 1,
          isActive: true,
          purchaseCount: 45,
          createdAt: '2024-12-01',
        },
      ];
      setItems(mockData);
      setTotalItems(mockData.length);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createShopItem({
        ...formData,
        availableUntil: formData.isLimitedTime && formData.availableUntil ? formData.availableUntil : undefined,
        maxPurchases: formData.maxPurchases || undefined,
        imageUrl: formData.imageUrl || undefined,
      });
      toast.success('Ürün oluşturuldu');
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
    if (!selectedItem) return;
    setSaving(true);
    try {
      await updateShopItem(selectedItem.id, {
        ...formData,
        availableUntil: formData.isLimitedTime && formData.availableUntil ? formData.availableUntil : undefined,
        maxPurchases: formData.maxPurchases || undefined,
        imageUrl: formData.imageUrl || undefined,
      });
      toast.success('Ürün güncellendi');
      setIsEditOpen(false);
      loadData();
    } catch {
      toast.error('Güncelleme başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    setSaving(true);
    try {
      await deleteShopItem(selectedItem.id);
      toast.success('Ürün silindi');
      setIsDeleteOpen(false);
      loadData();
    } catch {
      toast.error('Silme başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: ShopItem) => {
    try {
      await updateShopItem(item.id, { isActive: !item.isActive });
      toast.success(item.isActive ? 'Ürün mağazadan kaldırıldı' : 'Ürün mağazaya eklendi');
      loadData();
    } catch {
      toast.error('Güncelleme başarısız');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'STREAK_FREEZE',
      price: 100,
      currency: 'COINS',
      imageUrl: '',
      isLimitedTime: false,
      availableUntil: '',
      maxPurchases: 0,
    });
  };

  const openEditDialog = (item: ShopItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.price,
      currency: item.currency,
      imageUrl: item.imageUrl || '',
      isLimitedTime: item.isLimitedTime,
      availableUntil: item.availableUntil || '',
      maxPurchases: item.maxPurchases || 0,
    });
    setIsEditOpen(true);
  };

  const getCategoryInfo = (category: string) => categories.find(c => c.value === category);

  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.description.toLowerCase().includes(searchQuery.toLowerCase())
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
              placeholder="Ürün ara..."
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
              {categories.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.icon} {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
              <IconPlus className="mr-2 h-4 w-4" />
              Yeni Ürün
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Yeni Mağaza Ürünü</DialogTitle>
              <DialogDescription>
                Kullanıcıların satın alabileceği yeni bir ürün ekleyin
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Ürün Adı</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Seri Dondurma"
                />
              </div>
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Bu ürün ne işe yarar..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v as ShopItem['category'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.icon} {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Para Birimi</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(v) => setFormData({ ...formData, currency: v as 'COINS' | 'GEMS' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COINS">
                        <div className="flex items-center gap-1">
                          <IconCoin className="h-4 w-4 text-amber-500" />
                          Coin
                        </div>
                      </SelectItem>
                      <SelectItem value="GEMS">
                        <div className="flex items-center gap-1">
                          <IconDiamond className="h-4 w-4 text-purple-500" />
                          Gem
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fiyat</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Satın Alma (0 = sınırsız)</Label>
                  <Input
                    type="number"
                    value={formData.maxPurchases}
                    onChange={(e) => setFormData({ ...formData, maxPurchases: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Resim URL (opsiyonel)</Label>
                <Input
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isLimitedTime}
                  onCheckedChange={(v) => setFormData({ ...formData, isLimitedTime: v })}
                />
                <Label>Sınırlı Süreli Teklif</Label>
              </div>
              {formData.isLimitedTime && (
                <div className="space-y-2">
                  <Label>Son Tarih</Label>
                  <Input
                    type="date"
                    value={formData.availableUntil}
                    onChange={(e) => setFormData({ ...formData, availableUntil: e.target.value })}
                  />
                </div>
              )}
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
              <TableHead>Ürün</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-right">Fiyat</TableHead>
              <TableHead className="text-right">Satış</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Ürün bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                const categoryInfo = getCategoryInfo(item.category);
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{categoryInfo?.icon || '📦'}</div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {item.name}
                            {item.isLimitedTime && (
                              <Badge variant="destructive" className="text-xs">Sınırlı</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {item.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{categoryInfo?.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 font-semibold">
                        {item.currency === 'COINS' ? (
                          <IconCoin className="h-4 w-4 text-amber-500" />
                        ) : (
                          <IconDiamond className="h-4 w-4 text-purple-500" />
                        )}
                        {item.price}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <IconShoppingCart className="h-4 w-4 text-muted-foreground" />
                        {item.purchaseCount?.toLocaleString() || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? 'default' : 'secondary'}>
                        {item.isActive ? 'Aktif' : 'Pasif'}
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
                          <DropdownMenuItem onClick={() => openEditDialog(item)}>
                            <IconEdit className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(item)}>
                            {item.isActive ? 'Mağazadan Kaldır' : 'Mağazaya Ekle'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedItem(item);
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
                );
              })
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
            <DialogTitle>Ürünü Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Ürün Adı</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
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
                  onValueChange={(v) => setFormData({ ...formData, category: v as ShopItem['category'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.icon} {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Para Birimi</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(v) => setFormData({ ...formData, currency: v as 'COINS' | 'GEMS' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COINS">Coin</SelectItem>
                    <SelectItem value="GEMS">Gem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fiyat</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Satın Alma</Label>
                <Input
                  type="number"
                  value={formData.maxPurchases}
                  onChange={(e) => setFormData({ ...formData, maxPurchases: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isLimitedTime}
                onCheckedChange={(v) => setFormData({ ...formData, isLimitedTime: v })}
              />
              <Label>Sınırlı Süreli</Label>
            </div>
            {formData.isLimitedTime && (
              <div className="space-y-2">
                <Label>Son Tarih</Label>
                <Input
                  type="date"
                  value={formData.availableUntil}
                  onChange={(e) => setFormData({ ...formData, availableUntil: e.target.value })}
                />
              </div>
            )}
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
            <DialogTitle>Ürünü Sil</DialogTitle>
            <DialogDescription>
              &quot;{selectedItem?.name}&quot; ürününü silmek istediğinize emin misiniz?
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
