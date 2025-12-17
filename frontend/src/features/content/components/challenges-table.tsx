'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getAdminChallenges,
  createChallenge,
  updateChallenge,
  deleteChallenge,
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
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  IconTrophy,
  IconUsers,
  IconCalendar,
  IconTarget,
} from '@tabler/icons-react';
import { format, differenceInDays, isPast, isFuture } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';

interface Challenge {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  goalType: 'DAYS' | 'MINUTES' | 'CLASSES';
  goalValue: number;
  thumbnailUrl?: string;
  _count?: {
    participants: number;
    completions: number;
  };
  createdAt: string;
}

export function ChallengesTable() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    goalType: 'DAYS' as Challenge['goalType'],
    goalValue: 7,
    thumbnailUrl: '',
  });

  const loadChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminChallenges({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
      });
      setChallenges(data.data || []);
      setPagination(prev => ({ ...prev, total: data.pagination?.total || 0 }));
    } catch (error) {
      console.error('Failed to load challenges:', error);
      toast.error('Challenge\'lar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, search]);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  const openEditDialog = (challenge?: Challenge) => {
    if (challenge) {
      setSelectedChallenge(challenge);
      setFormData({
        title: challenge.title,
        description: challenge.description,
        startDate: challenge.startDate.split('T')[0],
        endDate: challenge.endDate.split('T')[0],
        goalType: challenge.goalType,
        goalValue: challenge.goalValue,
        thumbnailUrl: challenge.thumbnailUrl || '',
      });
    } else {
      setSelectedChallenge(null);
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      setFormData({
        title: '',
        description: '',
        startDate: today.toISOString().split('T')[0],
        endDate: nextWeek.toISOString().split('T')[0],
        goalType: 'DAYS',
        goalValue: 7,
        thumbnailUrl: '',
      });
    }
    setEditDialog(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description || !formData.startDate || !formData.endDate) {
      toast.error('Tüm zorunlu alanları doldurun');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      };

      if (selectedChallenge) {
        await updateChallenge(selectedChallenge.id, payload);
        toast.success('Challenge güncellendi');
      } else {
        await createChallenge(payload);
        toast.success('Challenge oluşturuldu');
      }
      setEditDialog(false);
      loadChallenges();
    } catch (error) {
      toast.error('İşlem başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedChallenge) return;
    try {
      await deleteChallenge(selectedChallenge.id);
      toast.success('Challenge silindi');
      setDeleteDialog(false);
      loadChallenges();
    } catch (error) {
      toast.error('Challenge silinemedi');
    }
  };

  const getStatus = (challenge: Challenge) => {
    const start = new Date(challenge.startDate);
    const end = new Date(challenge.endDate);
    const now = new Date();

    if (isFuture(start)) return 'UPCOMING';
    if (isPast(end)) return 'ENDED';
    return 'ACTIVE';
  };

  const getStatusBadge = (challenge: Challenge) => {
    const status = getStatus(challenge);
    switch (status) {
      case 'UPCOMING':
        return <Badge className="bg-blue-500/10 text-blue-600">Yaklaşan</Badge>;
      case 'ACTIVE':
        return <Badge className="bg-green-500/10 text-green-600">Aktif</Badge>;
      case 'ENDED':
        return <Badge variant="outline" className="text-muted-foreground">Bitti</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getGoalLabel = (type: string, value: number) => {
    switch (type) {
      case 'DAYS':
        return `${value} gün`;
      case 'MINUTES':
        return `${value} dakika`;
      case 'CLASSES':
        return `${value} ders`;
      default:
        return `${value}`;
    }
  };

  const getProgress = (challenge: Challenge) => {
    const start = new Date(challenge.startDate);
    const end = new Date(challenge.endDate);
    const now = new Date();
    const total = differenceInDays(end, start);
    const elapsed = differenceInDays(now, start);
    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Challenge ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="upcoming">Yaklaşan</SelectItem>
              <SelectItem value="ended">Biten</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => openEditDialog()}>
          <IconPlus className="h-4 w-4 mr-2" />
          Yeni Challenge
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : challenges.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Challenge bulunamadı
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Challenge</TableHead>
                  <TableHead>Tarihler</TableHead>
                  <TableHead>Hedef</TableHead>
                  <TableHead>Katılımcı</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>İlerleme</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {challenges.map((challenge) => (
                  <TableRow key={challenge.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {challenge.thumbnailUrl ? (
                          <img
                            src={challenge.thumbnailUrl}
                            alt={challenge.title}
                            className="h-10 w-16 rounded object-cover"
                          />
                        ) : (
                          <div className="h-10 w-16 rounded bg-muted flex items-center justify-center">
                            <IconTrophy className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{challenge.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {challenge.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <IconCalendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(challenge.startDate), 'dd MMM', { locale: tr })}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          - {format(new Date(challenge.endDate), 'dd MMM yyyy', { locale: tr })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <IconTarget className="h-4 w-4 text-muted-foreground" />
                        {getGoalLabel(challenge.goalType, challenge.goalValue)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <IconUsers className="h-4 w-4 text-muted-foreground" />
                        {challenge._count?.participants || 0}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(challenge)}</TableCell>
                    <TableCell>
                      {getStatus(challenge) === 'ACTIVE' ? (
                        <div className="w-24">
                          <Progress value={getProgress(challenge)} className="h-2" />
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
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
                          <DropdownMenuItem onClick={() => openEditDialog(challenge)}>
                            <IconEdit className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedChallenge(challenge);
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
            Toplam {pagination.total} challenge
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page === 1}
            >
              Önceki
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page * pagination.limit >= pagination.total}
            >
              Sonraki
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedChallenge ? 'Challenge Düzenle' : 'Yeni Challenge'}
            </DialogTitle>
            <DialogDescription>
              Challenge bilgilerini girin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Başlık</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="30 Günlük Yoga Challenge"
              />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Challenge açıklaması"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Başlangıç Tarihi</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label>Bitiş Tarihi</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Hedef Türü</Label>
                <Select
                  value={formData.goalType}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, goalType: v as Challenge['goalType'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAYS">Gün</SelectItem>
                    <SelectItem value="MINUTES">Dakika</SelectItem>
                    <SelectItem value="CLASSES">Ders</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hedef Değer</Label>
                <Input
                  type="number"
                  value={formData.goalValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, goalValue: parseInt(e.target.value) || 1 }))}
                  min={1}
                />
              </div>
            </div>
            <div>
              <Label>Thumbnail URL</Label>
              <Input
                value={formData.thumbnailUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedChallenge ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Challenge Sil</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{selectedChallenge?.title}&quot; challenge&apos;ını silmek istediğinize emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
