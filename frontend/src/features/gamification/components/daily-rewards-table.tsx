'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import {
  IconPlus,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconLoader2,
  IconStar,
  IconCoin,
  IconGift,
  IconRefresh,
  IconSparkles,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import {
  getDailyRewards,
  createDailyReward,
  updateDailyReward,
  deleteDailyReward,
  seedDailyRewards,
} from '@/lib/api';

interface DailyReward {
  id: string;
  day: number;
  xpReward: number;
  coinReward: number;
  bonusType?: string;
  bonusValue?: number;
  isMilestone: boolean;
}

const bonusTypes = [
  { value: 'NONE', label: 'Yok' },
  { value: 'STREAK_FREEZE', label: 'Seri Dondurma' },
  { value: 'XP_MULTIPLIER', label: 'XP Çarpanı' },
  { value: 'EXCLUSIVE_CONTENT', label: 'Özel İçerik' },
  { value: 'RANDOM_REWARD', label: 'Rastgele Ödül' },
];

export function DailyRewardsTable() {
  const [rewards, setRewards] = useState<DailyReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<DailyReward | null>(null);
  const [formData, setFormData] = useState({
    day: 1,
    xpReward: 10,
    coinReward: 5,
    bonusType: 'NONE',
    bonusValue: 0,
    isMilestone: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getDailyRewards();
      setRewards(data?.rewards || data || []);
    } catch {
      // Mock data - 30 day cycle
      const mockRewards: DailyReward[] = [];
      for (let i = 1; i <= 30; i++) {
        const isMilestone = i % 7 === 0 || i === 30;
        mockRewards.push({
          id: String(i),
          day: i,
          xpReward: isMilestone ? 100 : 10 + Math.floor(i / 5) * 5,
          coinReward: isMilestone ? 50 : 5 + Math.floor(i / 5) * 2,
          bonusType: i === 7 ? 'STREAK_FREEZE' : i === 14 ? 'XP_MULTIPLIER' : i === 30 ? 'EXCLUSIVE_CONTENT' : undefined,
          bonusValue: i === 14 ? 2 : undefined,
          isMilestone,
        });
      }
      setRewards(mockRewards);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedDailyRewards();
      toast.success('Varsayılan ödüller oluşturuldu');
      loadData();
    } catch {
      toast.error('Oluşturma başarısız');
    } finally {
      setSeeding(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createDailyReward({
        ...formData,
        bonusType: formData.bonusType !== 'NONE' ? formData.bonusType : undefined,
        bonusValue: formData.bonusValue || undefined,
      });
      toast.success('Ödül oluşturuldu');
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
    if (!selectedReward) return;
    setSaving(true);
    try {
      await updateDailyReward(selectedReward.id, {
        ...formData,
        bonusType: formData.bonusType !== 'NONE' ? formData.bonusType : undefined,
        bonusValue: formData.bonusValue || undefined,
      });
      toast.success('Ödül güncellendi');
      setIsEditOpen(false);
      loadData();
    } catch {
      toast.error('Güncelleme başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedReward) return;
    setSaving(true);
    try {
      await deleteDailyReward(selectedReward.id);
      toast.success('Ödül silindi');
      setIsDeleteOpen(false);
      loadData();
    } catch {
      toast.error('Silme başarısız');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      day: rewards.length + 1,
      xpReward: 10,
      coinReward: 5,
      bonusType: 'NONE',
      bonusValue: 0,
      isMilestone: false,
    });
  };

  const openEditDialog = (reward: DailyReward) => {
    setSelectedReward(reward);
    setFormData({
      day: reward.day,
      xpReward: reward.xpReward,
      coinReward: reward.coinReward,
      bonusType: reward.bonusType || 'NONE',
      bonusValue: reward.bonusValue || 0,
      isMilestone: reward.isMilestone,
    });
    setIsEditOpen(true);
  };

  // Group rewards by weeks
  const weeks: DailyReward[][] = [];
  for (let i = 0; i < rewards.length; i += 7) {
    weeks.push(rewards.slice(i, i + 7));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Toplam Gün</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rewards.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Toplam XP</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              <IconStar className="h-5 w-5 text-yellow-500" />
              {rewards.reduce((sum, r) => sum + r.xpReward, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Toplam Coin</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              <IconCoin className="h-5 w-5 text-amber-500" />
              {rewards.reduce((sum, r) => sum + r.coinReward, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Milestone Günleri</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              <IconSparkles className="h-5 w-5 text-purple-500" />
              {rewards.filter(r => r.isMilestone).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleSeed} disabled={seeding}>
          {seeding ? (
            <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <IconRefresh className="mr-2 h-4 w-4" />
          )}
          Varsayılanları Yükle
        </Button>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
              <IconPlus className="mr-2 h-4 w-4" />
              Yeni Gün Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Günlük Ödül</DialogTitle>
              <DialogDescription>
                Yeni bir gün için ödül tanımlayın
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Gün</Label>
                  <Input
                    type="number"
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: parseInt(e.target.value) || 1 })}
                    min={1}
                    max={365}
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bonus Türü</Label>
                  <Select
                    value={formData.bonusType}
                    onValueChange={(v) => setFormData({ ...formData, bonusType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bonusTypes.map((bt) => (
                        <SelectItem key={bt.value} value={bt.value}>{bt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Bonus Değeri</Label>
                  <Input
                    type="number"
                    value={formData.bonusValue}
                    onChange={(e) => setFormData({ ...formData, bonusValue: parseInt(e.target.value) || 0 })}
                    disabled={formData.bonusType === 'NONE'}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isMilestone}
                  onCheckedChange={(v) => setFormData({ ...formData, isMilestone: v })}
                />
                <Label>Milestone Günü (özel vurgu)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>İptal</Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                Oluştur
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Weekly Tables */}
      {weeks.map((week, weekIndex) => (
        <Card key={weekIndex}>
          <CardHeader>
            <CardTitle className="text-lg">Hafta {weekIndex + 1}</CardTitle>
            <CardDescription>
              Gün {weekIndex * 7 + 1} - {Math.min((weekIndex + 1) * 7, rewards.length)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Gün</TableHead>
                  <TableHead className="text-right">XP</TableHead>
                  <TableHead className="text-right">Coin</TableHead>
                  <TableHead>Bonus</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {week.map((reward) => (
                  <TableRow key={reward.id} className={reward.isMilestone ? 'bg-purple-50 dark:bg-purple-950/20' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {reward.isMilestone ? (
                          <Badge className="bg-purple-500">
                            <IconGift className="mr-1 h-3 w-3" />
                            {reward.day}
                          </Badge>
                        ) : (
                          <span className="font-medium">{reward.day}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <IconStar className="h-4 w-4 text-yellow-500" />
                        {reward.xpReward}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <IconCoin className="h-4 w-4 text-amber-500" />
                        {reward.coinReward}
                      </div>
                    </TableCell>
                    <TableCell>
                      {reward.bonusType && reward.bonusType !== 'NONE' && (
                        <Badge variant="outline">
                          {bonusTypes.find(b => b.value === reward.bonusType)?.label}
                          {reward.bonusValue ? ` x${reward.bonusValue}` : ''}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <IconDotsVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(reward)}>
                            <IconEdit className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedReward(reward);
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
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ödülü Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Gün</Label>
                <Input
                  type="number"
                  value={formData.day}
                  onChange={(e) => setFormData({ ...formData, day: parseInt(e.target.value) || 1 })}
                  min={1}
                  max={365}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bonus Türü</Label>
                <Select
                  value={formData.bonusType}
                  onValueChange={(v) => setFormData({ ...formData, bonusType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bonusTypes.map((bt) => (
                      <SelectItem key={bt.value} value={bt.value}>{bt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Bonus Değeri</Label>
                <Input
                  type="number"
                  value={formData.bonusValue}
                  onChange={(e) => setFormData({ ...formData, bonusValue: parseInt(e.target.value) || 0 })}
                  disabled={formData.bonusType === 'NONE'}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isMilestone}
                onCheckedChange={(v) => setFormData({ ...formData, isMilestone: v })}
              />
              <Label>Milestone Günü</Label>
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
            <DialogTitle>Ödülü Sil</DialogTitle>
            <DialogDescription>
              Gün {selectedReward?.day} ödülünü silmek istediğinize emin misiniz?
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
