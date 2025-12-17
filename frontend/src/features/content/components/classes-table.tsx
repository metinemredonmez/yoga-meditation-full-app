'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getAdminClasses,
  createClass,
  updateClass,
  deleteClass,
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
  IconVideo,
  IconClock,
  IconUser,
  IconPlayerPlay,
} from '@tabler/icons-react';
import { toast } from 'sonner';

interface YogaClass {
  id: string;
  title: string;
  description: string;
  duration: number;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  videoUrl?: string;
  thumbnailUrl?: string;
  program?: {
    id: string;
    title: string;
  };
  instructor?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  _count?: {
    completions: number;
    poses: number;
  };
  createdAt: string;
}

export function ClassesTable() {
  const [classes, setClasses] = useState<YogaClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState<YogaClass | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 30,
    level: 'BEGINNER' as YogaClass['level'],
    videoUrl: '',
    thumbnailUrl: '',
  });

  const loadClasses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminClasses({
        page: pagination.page,
        limit: pagination.limit,
        level: levelFilter !== 'all' ? levelFilter : undefined,
        search: search || undefined,
      });
      setClasses(data.data || []);
      setPagination(prev => ({ ...prev, total: data.pagination?.total || 0 }));
    } catch (error) {
      console.error('Failed to load classes:', error);
      toast.error('Dersler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, levelFilter, search]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const openEditDialog = (yogaClass?: YogaClass) => {
    if (yogaClass) {
      setSelectedClass(yogaClass);
      setFormData({
        title: yogaClass.title,
        description: yogaClass.description,
        duration: yogaClass.duration,
        level: yogaClass.level,
        videoUrl: yogaClass.videoUrl || '',
        thumbnailUrl: yogaClass.thumbnailUrl || '',
      });
    } else {
      setSelectedClass(null);
      setFormData({
        title: '',
        description: '',
        duration: 30,
        level: 'BEGINNER',
        videoUrl: '',
        thumbnailUrl: '',
      });
    }
    setEditDialog(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description) {
      toast.error('Başlık ve açıklama zorunludur');
      return;
    }

    setSaving(true);
    try {
      if (selectedClass) {
        await updateClass(selectedClass.id, formData);
        toast.success('Ders güncellendi');
      } else {
        await createClass(formData);
        toast.success('Ders oluşturuldu');
      }
      setEditDialog(false);
      loadClasses();
    } catch (error) {
      toast.error('İşlem başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedClass) return;
    try {
      await deleteClass(selectedClass.id);
      toast.success('Ders silindi');
      setDeleteDialog(false);
      loadClasses();
    } catch (error) {
      toast.error('Ders silinemedi');
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'BEGINNER':
        return <Badge className="bg-green-500/10 text-green-600">Başlangıç</Badge>;
      case 'INTERMEDIATE':
        return <Badge className="bg-yellow-500/10 text-yellow-600">Orta</Badge>;
      case 'ADVANCED':
        return <Badge className="bg-red-500/10 text-red-600">İleri</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} dk`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}s ${mins}dk` : `${hours} saat`;
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ders ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Seviye" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Seviyeler</SelectItem>
              <SelectItem value="BEGINNER">Başlangıç</SelectItem>
              <SelectItem value="INTERMEDIATE">Orta</SelectItem>
              <SelectItem value="ADVANCED">İleri</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => openEditDialog()}>
          <IconPlus className="h-4 w-4 mr-2" />
          Yeni Ders
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Ders bulunamadı
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ders</TableHead>
                  <TableHead>Seviye</TableHead>
                  <TableHead>Süre</TableHead>
                  <TableHead>Eğitmen</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Video</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((yogaClass) => (
                  <TableRow key={yogaClass.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {yogaClass.thumbnailUrl ? (
                          <img
                            src={yogaClass.thumbnailUrl}
                            alt={yogaClass.title}
                            className="h-10 w-16 rounded object-cover"
                          />
                        ) : (
                          <div className="h-10 w-16 rounded bg-muted flex items-center justify-center">
                            <IconVideo className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{yogaClass.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {yogaClass._count?.poses || 0} poz
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getLevelBadge(yogaClass.level)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <IconClock className="h-4 w-4 text-muted-foreground" />
                        {formatDuration(yogaClass.duration)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {yogaClass.instructor ? (
                        <div className="flex items-center gap-1 text-sm">
                          <IconUser className="h-4 w-4 text-muted-foreground" />
                          {yogaClass.instructor.firstName} {yogaClass.instructor.lastName}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {yogaClass.program ? (
                        <Badge variant="outline">{yogaClass.program.title}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {yogaClass.videoUrl ? (
                        <Badge className="bg-green-500/10 text-green-600">
                          <IconPlayerPlay className="h-3 w-3 mr-1" />
                          Mevcut
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Yok
                        </Badge>
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
                          <DropdownMenuItem onClick={() => openEditDialog(yogaClass)}>
                            <IconEdit className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          {yogaClass.videoUrl && (
                            <DropdownMenuItem onClick={() => window.open(yogaClass.videoUrl, '_blank')}>
                              <IconPlayerPlay className="mr-2 h-4 w-4" />
                              Video İzle
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedClass(yogaClass);
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
            Toplam {pagination.total} ders
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
              {selectedClass ? 'Dersi Düzenle' : 'Yeni Ders'}
            </DialogTitle>
            <DialogDescription>
              Yoga dersi bilgilerini girin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Başlık</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ders başlığı"
              />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Ders açıklaması"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Seviye</Label>
                <Select
                  value={formData.level}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, level: v as YogaClass['level'] }))}
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
                <Label>Süre (Dakika)</Label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }))}
                  min={1}
                  max={180}
                />
              </div>
            </div>
            <div>
              <Label>Video URL</Label>
              <Input
                value={formData.videoUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                placeholder="https://..."
              />
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
              {selectedClass ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dersi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{selectedClass?.title}&quot; dersini silmek istediğinize emin misiniz?
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
