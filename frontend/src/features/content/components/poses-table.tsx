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
      setPoses(data.data || []);
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
        return <Badge className="bg-green-500/10 text-green-600">Başlangıç</Badge>;
      case 'INTERMEDIATE':
        return <Badge className="bg-yellow-500/10 text-yellow-600">Orta</Badge>;
      case 'ADVANCED':
        return <Badge className="bg-red-500/10 text-red-600">İleri</Badge>;
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
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                            <IconStretching className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
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
                        {pose.bodyAreas?.slice(0, 2).map(area => (
                          <Badge key={area} variant="secondary" className="text-xs">
                            {area}
                          </Badge>
                        ))}
                        {(pose.bodyAreas?.length || 0) > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{pose.bodyAreas!.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {pose.imageUrl && (
                          <Badge variant="outline" className="text-xs">
                            <IconPhoto className="h-3 w-3 mr-1" />
                            Resim
                          </Badge>
                        )}
                        {pose.videoUrl && (
                          <Badge variant="outline" className="text-xs">
                            Video
                          </Badge>
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
                {BODY_AREAS.map(area => (
                  <Badge
                    key={area}
                    variant={formData.bodyAreas.includes(area) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleBodyArea(area)}
                  >
                    {area}
                  </Badge>
                ))}
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
