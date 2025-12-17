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
  IconStar,
  IconCoin,
  IconCalendar,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import {
  getQuests,
  createQuest,
  updateQuest,
  deleteQuest,
} from '@/lib/api';

interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SPECIAL';
  xpReward: number;
  coinReward: number;
  condition: string;
  conditionValue: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  completedCount?: number;
  createdAt: string;
}

const questTypes = [
  { value: 'DAILY', label: 'Günlük', color: 'bg-blue-500' },
  { value: 'WEEKLY', label: 'Haftalık', color: 'bg-purple-500' },
  { value: 'MONTHLY', label: 'Aylık', color: 'bg-orange-500' },
  { value: 'SPECIAL', label: 'Özel', color: 'bg-pink-500' },
];

const conditionTypes = [
  { value: 'COMPLETE_CLASSES', label: 'Ders Tamamla' },
  { value: 'PRACTICE_MINUTES', label: 'Dakika Pratik Yap' },
  { value: 'MAINTAIN_STREAK', label: 'Seri Koru' },
  { value: 'EARN_XP', label: 'XP Kazan' },
  { value: 'COMPLETE_PROGRAM', label: 'Program Tamamla' },
  { value: 'WATCH_LIVE', label: 'Canlı Ders İzle' },
  { value: 'LEAVE_REVIEW', label: 'Yorum Bırak' },
  { value: 'SHARE_PROGRESS', label: 'İlerleme Paylaş' },
  { value: 'INVITE_FRIEND', label: 'Arkadaş Davet Et' },
];

export function QuestsTable() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'DAILY' as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SPECIAL',
    xpReward: 50,
    coinReward: 10,
    condition: 'COMPLETE_CLASSES',
    conditionValue: 1,
    isActive: true,
    startDate: '',
    endDate: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [typeFilter, currentPage, pageSize]);

  const loadData = async () => {
    try {
      const data = await getQuests({
        type: typeFilter !== 'all' ? typeFilter as Quest['type'] : undefined,
        page: currentPage,
        limit: pageSize,
      });
      setQuests(data?.quests || data?.data || data || []);
      setTotalItems(data?.total || data?.pagination?.total || quests.length);
    } catch {
      // Mock data
      const mockData = [
        {
          id: '1',
          title: 'Sabah Yogası',
          description: '1 sabah dersi tamamla',
          type: 'DAILY' as const,
          xpReward: 50,
          coinReward: 10,
          condition: 'COMPLETE_CLASSES',
          conditionValue: 1,
          isActive: true,
          completedCount: 234,
          createdAt: '2024-01-01',
        },
        {
          id: '2',
          title: 'Haftalık Hedef',
          description: '5 ders tamamla',
          type: 'WEEKLY' as const,
          xpReward: 200,
          coinReward: 50,
          condition: 'COMPLETE_CLASSES',
          conditionValue: 5,
          isActive: true,
          completedCount: 89,
          createdAt: '2024-01-01',
        },
        {
          id: '3',
          title: 'Yılbaşı Özel',
          description: '31 Aralık gece yarısı pratik yap',
          type: 'SPECIAL' as const,
          xpReward: 500,
          coinReward: 100,
          condition: 'PRACTICE_MINUTES',
          conditionValue: 30,
          isActive: true,
          startDate: '2024-12-31',
          endDate: '2025-01-01',
          completedCount: 12,
          createdAt: '2024-12-01',
        },
      ];
      setQuests(mockData);
      setTotalItems(mockData.length);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createQuest({
        ...formData,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
      });
      toast.success('Görev oluşturuldu');
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
    if (!selectedQuest) return;
    setSaving(true);
    try {
      await updateQuest(selectedQuest.id, {
        ...formData,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
      });
      toast.success('Görev güncellendi');
      setIsEditOpen(false);
      loadData();
    } catch {
      toast.error('Güncelleme başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedQuest) return;
    setSaving(true);
    try {
      await deleteQuest(selectedQuest.id);
      toast.success('Görev silindi');
      setIsDeleteOpen(false);
      loadData();
    } catch {
      toast.error('Silme başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (quest: Quest) => {
    try {
      await updateQuest(quest.id, { isActive: !quest.isActive });
      toast.success(quest.isActive ? 'Görev devre dışı bırakıldı' : 'Görev aktifleştirildi');
      loadData();
    } catch {
      toast.error('Güncelleme başarısız');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'DAILY',
      xpReward: 50,
      coinReward: 10,
      condition: 'COMPLETE_CLASSES',
      conditionValue: 1,
      isActive: true,
      startDate: '',
      endDate: '',
    });
  };

  const openEditDialog = (quest: Quest) => {
    setSelectedQuest(quest);
    setFormData({
      title: quest.title,
      description: quest.description,
      type: quest.type,
      xpReward: quest.xpReward,
      coinReward: quest.coinReward,
      condition: quest.condition,
      conditionValue: quest.conditionValue,
      isActive: quest.isActive,
      startDate: quest.startDate || '',
      endDate: quest.endDate || '',
    });
    setIsEditOpen(true);
  };

  const getTypeInfo = (type: string) => questTypes.find(t => t.value === type);

  const filteredQuests = quests.filter((q) =>
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.description.toLowerCase().includes(searchQuery.toLowerCase())
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
              placeholder="Görev ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tür" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Türler</SelectItem>
              {questTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
              <IconPlus className="mr-2 h-4 w-4" />
              Yeni Görev
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Yeni Görev Oluştur</DialogTitle>
              <DialogDescription>
                Kullanıcıların tamamlayabileceği yeni bir görev tanımlayın
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Görev Adı</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Sabah Yogası"
                />
              </div>
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Bu görevi tamamlamak için..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Görev Türü</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v as Quest['type'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {questTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Koşul Değeri</Label>
                  <Input
                    type="number"
                    value={formData.conditionValue}
                    onChange={(e) => setFormData({ ...formData, conditionValue: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>XP Ödülü</Label>
                  <Input
                    type="number"
                    value={formData.xpReward}
                    onChange={(e) => setFormData({ ...formData, xpReward: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Coin Ödülü</Label>
                  <Input
                    type="number"
                    value={formData.coinReward}
                    onChange={(e) => setFormData({ ...formData, coinReward: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              {formData.type === 'SPECIAL' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Başlangıç Tarihi</Label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bitiş Tarihi</Label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(v) => setFormData({ ...formData, isActive: v })}
                />
                <Label>Aktif</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>İptal</Button>
              <Button onClick={handleCreate} disabled={saving || !formData.title}>
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
              <TableHead>Görev</TableHead>
              <TableHead>Tür</TableHead>
              <TableHead>Koşul</TableHead>
              <TableHead className="text-right">Ödüller</TableHead>
              <TableHead className="text-right">Tamamlayan</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Görev bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              filteredQuests.map((quest) => {
                const typeInfo = getTypeInfo(quest.type);
                return (
                  <TableRow key={quest.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{quest.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {quest.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={typeInfo?.color}>{typeInfo?.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {conditionTypes.find(c => c.value === quest.condition)?.label || quest.condition}
                        <span className="text-muted-foreground"> x{quest.conditionValue}</span>
                      </div>
                      {quest.startDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <IconCalendar className="h-3 w-3" />
                          {new Date(quest.startDate).toLocaleDateString('tr-TR')} - {quest.endDate ? new Date(quest.endDate).toLocaleDateString('tr-TR') : ''}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-3">
                        <div className="flex items-center gap-1">
                          <IconStar className="h-4 w-4 text-yellow-500" />
                          {quest.xpReward}
                        </div>
                        <div className="flex items-center gap-1">
                          <IconCoin className="h-4 w-4 text-amber-500" />
                          {quest.coinReward}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {quest.completedCount?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell>
                      <Badge variant={quest.isActive ? 'default' : 'secondary'}>
                        {quest.isActive ? 'Aktif' : 'Pasif'}
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
                          <DropdownMenuItem onClick={() => openEditDialog(quest)}>
                            <IconEdit className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(quest)}>
                            {quest.isActive ? 'Devre Dışı Bırak' : 'Aktifleştir'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedQuest(quest);
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
            <DialogTitle>Görevi Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Görev Adı</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                <Label>Görev Türü</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v as Quest['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {questTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Koşul Değeri</Label>
                <Input
                  type="number"
                  value={formData.conditionValue}
                  onChange={(e) => setFormData({ ...formData, conditionValue: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>XP Ödülü</Label>
                <Input
                  type="number"
                  value={formData.xpReward}
                  onChange={(e) => setFormData({ ...formData, xpReward: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Coin Ödülü</Label>
                <Input
                  type="number"
                  value={formData.coinReward}
                  onChange={(e) => setFormData({ ...formData, coinReward: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            {formData.type === 'SPECIAL' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Başlangıç Tarihi</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bitiş Tarihi</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(v) => setFormData({ ...formData, isActive: v })}
              />
              <Label>Aktif</Label>
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
            <DialogTitle>Görevi Sil</DialogTitle>
            <DialogDescription>
              &quot;{selectedQuest?.title}&quot; görevini silmek istediğinize emin misiniz?
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
