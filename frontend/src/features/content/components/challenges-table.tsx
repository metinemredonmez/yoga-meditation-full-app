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
  startAt: string;
  endAt: string;
  targetDays: number;
  coverUrl?: string;
  _count?: {
    challenge_enrollments: number;
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
    startAt: '',
    endAt: '',
    targetDays: 7,
    coverUrl: '',
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
      setChallenges(data.challenges || []);
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
        startAt: challenge.startAt.split('T')[0],
        endAt: challenge.endAt.split('T')[0],
        targetDays: challenge.targetDays,
        coverUrl: challenge.coverUrl || '',
      });
    } else {
      setSelectedChallenge(null);
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      setFormData({
        title: '',
        description: '',
        startAt: today.toISOString().split('T')[0],
        endAt: nextWeek.toISOString().split('T')[0],
        targetDays: 7,
        coverUrl: '',
      });
    }
    setEditDialog(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description || !formData.startAt || !formData.endAt) {
      toast.error('Tüm zorunlu alanları doldurun');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        startAt: new Date(formData.startAt).toISOString(),
        endAt: new Date(formData.endAt).toISOString(),
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
    const start = new Date(challenge.startAt);
    const end = new Date(challenge.endAt);

    if (isFuture(start)) return 'UPCOMING';
    if (isPast(end)) return 'ENDED';
    return 'ACTIVE';
  };

  const getStatusBadge = (challenge: Challenge) => {
    const status = getStatus(challenge);
    switch (status) {
      case 'UPCOMING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700 border border-cyan-200 dark:bg-cyan-400/20 dark:text-cyan-400 dark:border-cyan-400/30 transition-all duration-300">
            Yaklaşan
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200 dark:bg-green-400/20 dark:text-green-400 dark:border-green-400/30 transition-all duration-300">
            Aktif
          </span>
        );
      case 'ENDED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-400/20 dark:text-slate-400 dark:border-slate-400/30 transition-all duration-300">
            Bitti
          </span>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getProgress = (challenge: Challenge) => {
    const start = new Date(challenge.startAt);
    const end = new Date(challenge.endAt);
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
                        <div className="relative h-10 w-16 flex-shrink-0">
                          {challenge.coverUrl ? (
                            <img
                              src={challenge.coverUrl}
                              alt={challenge.title}
                              className="h-10 w-16 rounded object-cover absolute inset-0"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          ) : null}
                          <div className="h-10 w-16 rounded bg-gradient-to-br from-violet-100 to-violet-200 dark:from-violet-400/30 dark:to-violet-500/40 flex items-center justify-center border border-violet-200 dark:border-violet-400/30">
                            <IconTrophy className="h-5 w-5 text-violet-500 dark:text-violet-400" />
                          </div>
                        </div>
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
                          {format(new Date(challenge.startAt), 'dd MMM', { locale: tr })}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          - {format(new Date(challenge.endAt), 'dd MMM yyyy', { locale: tr })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <IconTarget className="h-4 w-4 text-muted-foreground" />
                        {challenge.targetDays} gün
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <IconUsers className="h-4 w-4 text-muted-foreground" />
                        {challenge._count?.challenge_enrollments || 0}
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
                  value={formData.startAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, startAt: e.target.value }))}
                />
              </div>
              <div>
                <Label>Bitiş Tarihi</Label>
                <Input
                  type="date"
                  value={formData.endAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, endAt: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Hedef Gün Sayısı</Label>
              <Input
                type="number"
                value={formData.targetDays}
                onChange={(e) => setFormData(prev => ({ ...prev, targetDays: parseInt(e.target.value) || 1 }))}
                min={1}
                placeholder="7"
              />
            </div>
            <div>
              <Label>Kapak Resmi URL</Label>
              <Input
                value={formData.coverUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, coverUrl: e.target.value }))}
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
