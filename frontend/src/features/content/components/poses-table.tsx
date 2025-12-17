'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getAdminPoses,
  createPose,
  updatePose,
  deletePose,
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
  IconPhoto,
  IconStretching,
} from '@tabler/icons-react';
import { toast } from 'sonner';

interface Pose {
  id: string;
  englishName: string;
  sanskritName?: string;
  description: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  bodyAreas: string[];
  benefits?: string[];
  instructions?: string[];
  imageUrl?: string;
  videoUrl?: string;
  createdAt: string;
}

const BODY_AREAS = [
  'Sırt', 'Omuz', 'Kalça', 'Bacak', 'Kol', 'Karın', 'Göğüs', 'Boyun', 'Tüm Vücut'
];

export function PosesTable() {
  const [poses, setPoses] = useState<Pose[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedPose, setSelectedPose] = useState<Pose | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  const [formData, setFormData] = useState({
    englishName: '',
    sanskritName: '',
    description: '',
    difficulty: 'BEGINNER' as Pose['difficulty'],
    bodyAreas: [] as string[],
    benefits: '',
    instructions: '',
    imageUrl: '',
    videoUrl: '',
  });

  const loadPoses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminPoses({
        page: pagination.page,
        limit: pagination.limit,
        difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined,
        search: search || undefined,
      });
      setPoses(data.poses || []);
      setPagination(prev => ({ ...prev, total: data.pagination?.total || 0 }));
    } catch (error) {
      console.error('Failed to load poses:', error);
      toast.error('Pozlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, difficultyFilter, search]);

  useEffect(() => {
    loadPoses();
  }, [loadPoses]);

  const openEditDialog = (pose?: Pose) => {
    if (pose) {
      setSelectedPose(pose);
      setFormData({
        englishName: pose.englishName,
        sanskritName: pose.sanskritName || '',
        description: pose.description,
        difficulty: pose.difficulty,
        bodyAreas: pose.bodyAreas || [],
        benefits: pose.benefits?.join('\n') || '',
        instructions: pose.instructions?.join('\n') || '',
        imageUrl: pose.imageUrl || '',
        videoUrl: pose.videoUrl || '',
      });
    } else {
      setSelectedPose(null);
      setFormData({
        englishName: '',
        sanskritName: '',
        description: '',
        difficulty: 'BEGINNER',
        bodyAreas: [],
        benefits: '',
        instructions: '',
        imageUrl: '',
        videoUrl: '',
      });
    }
    setEditDialog(true);
  };

  const handleSave = async () => {
    if (!formData.englishName || !formData.description) {
      toast.error('İngilizce ad ve açıklama zorunludur');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        benefits: formData.benefits.split('\n').filter(Boolean),
        instructions: formData.instructions.split('\n').filter(Boolean),
      };

      if (selectedPose) {
        await updatePose(selectedPose.id, payload);
        toast.success('Poz güncellendi');
      } else {
        await createPose(payload);
        toast.success('Poz oluşturuldu');
      }
      setEditDialog(false);
      loadPoses();
    } catch (error) {
      toast.error('İşlem başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPose) return;
    try {
      await deletePose(selectedPose.id);
      toast.success('Poz silindi');
      setDeleteDialog(false);
      loadPoses();
    } catch (error) {
      toast.error('Poz silinemedi');
    }
  };

  const toggleBodyArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      bodyAreas: prev.bodyAreas.includes(area)
        ? prev.bodyAreas.filter(a => a !== area)
        : [...prev.bodyAreas, area]
    }));
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200 dark:bg-green-400/20 dark:text-green-400 dark:border-green-400/30 transition-all duration-300">
            Başlangıç
          </span>
        );
      case 'INTERMEDIATE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700 border border-cyan-200 dark:bg-cyan-400/20 dark:text-cyan-400 dark:border-cyan-400/30 transition-all duration-300">
            Orta
          </span>
        );
      case 'ADVANCED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-400/20 dark:text-violet-400 dark:border-violet-400/30 transition-all duration-300">
            İleri
          </span>
        );
      default:
        return <Badge variant="outline">{difficulty}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Poz ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Zorluk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Zorluklar</SelectItem>
              <SelectItem value="BEGINNER">Başlangıç</SelectItem>
              <SelectItem value="INTERMEDIATE">Orta</SelectItem>
              <SelectItem value="ADVANCED">İleri</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => openEditDialog()}>
          <IconPlus className="h-4 w-4 mr-2" />
          Yeni Poz
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : poses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Poz bulunamadı
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Poz</TableHead>
                  <TableHead>Sanskrit</TableHead>
                  <TableHead>Zorluk</TableHead>
                  <TableHead>Vücut Bölgeleri</TableHead>
                  <TableHead>Medya</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {poses.map((pose) => (
                  <TableRow key={pose.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {pose.imageUrl ? (
                          <img
                            src={pose.imageUrl}
                            alt={pose.englishName}
                            className="h-10 w-10 rounded object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="h-10 w-10 rounded bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-400/20 dark:to-pink-500/20 items-center justify-center border border-pink-200 dark:border-pink-400/30"
                          style={{ display: pose.imageUrl ? 'none' : 'flex' }}
                        >
                          <IconStretching className="h-5 w-5 text-pink-500 dark:text-pink-400" />
                        </div>
                        <div>
                          <p className="font-medium">{pose.englishName}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {pose.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {pose.sanskritName ? (
                        <span className="text-sm italic">{pose.sanskritName}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getDifficultyBadge(pose.difficulty)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {pose.bodyAreas?.slice(0, 2).map((area, idx) => (
                          <span
                            key={area}
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border transition-all duration-300 ${
                              idx === 0
                                ? 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-400/20 dark:text-pink-400 dark:border-pink-400/30'
                                : 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-400/20 dark:text-indigo-400 dark:border-indigo-400/30'
                            }`}
                          >
                            {area}
                          </span>
                        ))}
                        {(pose.bodyAreas?.length || 0) > 2 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-400/20 dark:text-slate-400 dark:border-slate-400/30 transition-all duration-300">
                            +{pose.bodyAreas!.length - 2}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {pose.imageUrl && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700 border border-cyan-200 dark:bg-cyan-400/20 dark:text-cyan-400 dark:border-cyan-400/30 transition-all duration-300">
                            <IconPhoto className="h-3 w-3 mr-1" />
                            Resim
                          </span>
                        )}
                        {pose.videoUrl && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-400/20 dark:text-violet-400 dark:border-violet-400/30 transition-all duration-300">
                            Video
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <IconDots className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(pose)}>
                            <IconEdit className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedPose(pose);
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
            Toplam {pagination.total} poz
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPose ? 'Pozu Düzenle' : 'Yeni Poz'}
            </DialogTitle>
            <DialogDescription>
              Yoga pozu bilgilerini girin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>İngilizce Ad</Label>
                <Input
                  value={formData.englishName}
                  onChange={(e) => setFormData(prev => ({ ...prev, englishName: e.target.value }))}
                  placeholder="Downward Dog"
                />
              </div>
              <div>
                <Label>Sanskrit Ad</Label>
                <Input
                  value={formData.sanskritName}
                  onChange={(e) => setFormData(prev => ({ ...prev, sanskritName: e.target.value }))}
                  placeholder="Adho Mukha Svanasana"
                />
              </div>
            </div>
            <div>
              <Label>Açıklama</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Poz açıklaması"
                rows={2}
              />
            </div>
            <div>
              <Label>Zorluk</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(v) => setFormData(prev => ({ ...prev, difficulty: v as Pose['difficulty'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEGINNER">Başlangıç</SelectItem>
                  <SelectItem value="INTERMEDIATE">Orta</SelectItem>
                  <SelectItem value="ADVANCED">İleri</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Vücut Bölgeleri</Label>
              <div className="flex flex-wrap gap-2">
                {BODY_AREAS.map((area, index) => {
                  const isSelected = formData.bodyAreas.includes(area);
                  const colors = [
                    { selected: 'bg-pink-100 text-pink-700 border-pink-300 dark:bg-pink-400/30 dark:text-pink-300 dark:border-pink-400/50', unselected: 'border-pink-200 text-pink-600 hover:bg-pink-50 dark:border-pink-400/30 dark:text-pink-400 dark:hover:bg-pink-400/10' },
                    { selected: 'bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-400/30 dark:text-violet-300 dark:border-violet-400/50', unselected: 'border-violet-200 text-violet-600 hover:bg-violet-50 dark:border-violet-400/30 dark:text-violet-400 dark:hover:bg-violet-400/10' },
                    { selected: 'bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-400/30 dark:text-cyan-300 dark:border-cyan-400/50', unselected: 'border-cyan-200 text-cyan-600 hover:bg-cyan-50 dark:border-cyan-400/30 dark:text-cyan-400 dark:hover:bg-cyan-400/10' },
                    { selected: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-400/30 dark:text-green-300 dark:border-green-400/50', unselected: 'border-green-200 text-green-600 hover:bg-green-50 dark:border-green-400/30 dark:text-green-400 dark:hover:bg-green-400/10' },
                    { selected: 'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-400/30 dark:text-indigo-300 dark:border-indigo-400/50', unselected: 'border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-400/30 dark:text-indigo-400 dark:hover:bg-indigo-400/10' },
                    { selected: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-400/30 dark:text-amber-300 dark:border-amber-400/50', unselected: 'border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-400/30 dark:text-amber-400 dark:hover:bg-amber-400/10' },
                    { selected: 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-400/30 dark:text-rose-300 dark:border-rose-400/50', unselected: 'border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-400/30 dark:text-rose-400 dark:hover:bg-rose-400/10' },
                    { selected: 'bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-400/30 dark:text-teal-300 dark:border-teal-400/50', unselected: 'border-teal-200 text-teal-600 hover:bg-teal-50 dark:border-teal-400/30 dark:text-teal-400 dark:hover:bg-teal-400/10' },
                    { selected: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-400/30 dark:text-purple-300 dark:border-purple-400/50', unselected: 'border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-400/30 dark:text-purple-400 dark:hover:bg-purple-400/10' },
                  ];
                  const colorSet = colors[index % colors.length];
                  return (
                    <span
                      key={area}
                      onClick={() => toggleBodyArea(area)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border cursor-pointer transition-all duration-200 ${
                        isSelected ? colorSet.selected : colorSet.unselected
                      }`}
                    >
                      {area}
                    </span>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>Faydalar (her satıra bir)</Label>
              <Textarea
                value={formData.benefits}
                onChange={(e) => setFormData(prev => ({ ...prev, benefits: e.target.value }))}
                placeholder="Esnekliği artırır&#10;Stresi azaltır"
                rows={3}
              />
            </div>
            <div>
              <Label>Talimatlar (her satıra bir adım)</Label>
              <Textarea
                value={formData.instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="1. Dört ayak pozisyonuna gelin&#10;2. Kalçalarınızı yukarı kaldırın"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Resim URL</Label>
                <Input
                  value={formData.imageUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>Video URL</Label>
                <Input
                  value={formData.videoUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                  placeholder="https://..."
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
              {selectedPose ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pozu Sil</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{selectedPose?.englishName}&quot; pozunu silmek istediğinize emin misiniz?
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
