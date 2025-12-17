'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IconPlus,
  IconSearch,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconEye,
  IconUpload,
  IconSend,
  IconLoader2,
  IconVideo,
  IconClock,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import {
  getMyClasses,
  createMyClass,
  updateMyClass,
  deleteMyClass,
  submitClassForReview,
} from '@/lib/api';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface MyClass {
  id: string;
  title: string;
  description: string;
  duration: number;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED';
  videoUrl?: string;
  thumbnailUrl?: string;
  viewCount: number;
  studentCount: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

const levelLabels: Record<string, string> = {
  BEGINNER: 'Başlangıç',
  INTERMEDIATE: 'Orta',
  ADVANCED: 'İleri',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Taslak',
  PENDING: 'Onay Bekliyor',
  PUBLISHED: 'Yayında',
  REJECTED: 'Reddedildi',
};

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  PUBLISHED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
};

export function MyClassesTable() {
  const [classes, setClasses] = useState<MyClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dialog states
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState<MyClass | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 30,
    level: 'BEGINNER' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
    videoUrl: '',
    thumbnailUrl: '',
  });

  useEffect(() => {
    loadClasses();
  }, [search, statusFilter]);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const data = await getMyClasses({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setClasses(data.items || data);
    } catch (error) {
      // Mock data
      setClasses([
        {
          id: '1',
          title: 'Sabah Yoga Akışı',
          description: 'Güne enerjik başlamak için ideal yoga dersi',
          duration: 30,
          level: 'BEGINNER',
          status: 'PUBLISHED',
          viewCount: 1250,
          studentCount: 320,
          rating: 4.8,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Güç Yoga',
          description: 'Kas gücünü artıran ileri seviye yoga',
          duration: 45,
          level: 'ADVANCED',
          status: 'PUBLISHED',
          viewCount: 890,
          studentCount: 210,
          rating: 4.9,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          title: 'Akşam Meditasyonu',
          description: 'Rahatlatıcı akşam meditasyonu',
          duration: 20,
          level: 'BEGINNER',
          status: 'PENDING',
          viewCount: 0,
          studentCount: 0,
          rating: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedClass(null);
    setFormData({
      title: '',
      description: '',
      duration: 30,
      level: 'BEGINNER',
      videoUrl: '',
      thumbnailUrl: '',
    });
    setEditDialog(true);
  };

  const handleEdit = (cls: MyClass) => {
    setSelectedClass(cls);
    setFormData({
      title: cls.title,
      description: cls.description,
      duration: cls.duration,
      level: cls.level,
      videoUrl: cls.videoUrl || '',
      thumbnailUrl: cls.thumbnailUrl || '',
    });
    setEditDialog(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description) {
      toast.error('Lütfen gerekli alanları doldurun');
      return;
    }

    setSaving(true);
    try {
      if (selectedClass) {
        await updateMyClass(selectedClass.id, formData);
        toast.success('Ders güncellendi');
      } else {
        await createMyClass(formData);
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
      await deleteMyClass(selectedClass.id);
      toast.success('Ders silindi');
      setDeleteDialog(false);
      loadClasses();
    } catch (error) {
      toast.error('Silme işlemi başarısız');
    }
  };

  const handleSubmitForReview = async (cls: MyClass) => {
    try {
      await submitClassForReview(cls.id);
      toast.success('Ders onaya gönderildi');
      loadClasses();
    } catch (error) {
      toast.error('Gönderme işlemi başarısız');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Derslerim</CardTitle>
            <CardDescription>Oluşturduğunuz yoga derslerini yönetin</CardDescription>
          </div>
          <Button onClick={handleCreate}>
            <IconPlus className="mr-2 h-4 w-4" />
            Yeni Ders
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ders ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="DRAFT">Taslak</SelectItem>
              <SelectItem value="PENDING">Onay Bekliyor</SelectItem>
              <SelectItem value="PUBLISHED">Yayında</SelectItem>
              <SelectItem value="REJECTED">Reddedildi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ders</TableHead>
                <TableHead>Seviye</TableHead>
                <TableHead>Süre</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Görüntülenme</TableHead>
                <TableHead>Puan</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <IconLoader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : classes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Henüz ders oluşturmadınız
                  </TableCell>
                </TableRow>
              ) : (
                classes.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-14 rounded bg-muted flex items-center justify-center">
                          <IconVideo className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{cls.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {cls.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{levelLabels[cls.level]}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <IconClock className="h-4 w-4 text-muted-foreground" />
                        {cls.duration} dk
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[cls.status]}>
                        {statusLabels[cls.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{cls.viewCount.toLocaleString()}</TableCell>
                    <TableCell>
                      {cls.rating > 0 ? (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          {cls.rating.toFixed(1)}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <IconDotsVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(cls)}>
                            <IconEdit className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          {cls.status === 'DRAFT' && (
                            <DropdownMenuItem onClick={() => handleSubmitForReview(cls)}>
                              <IconSend className="mr-2 h-4 w-4" />
                              Onaya Gönder
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedClass(cls);
                              setDeleteDialog(true);
                            }}
                            className="text-destructive"
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
      </CardContent>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedClass ? 'Dersi Düzenle' : 'Yeni Ders Oluştur'}</DialogTitle>
            <DialogDescription>
              Ders bilgilerini girin. Video yüklemek için ayrı bir sekme kullanın.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Ders Adı *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Örn: Sabah Yoga Akışı"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Açıklama *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ders hakkında detaylı açıklama..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="level">Seviye</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED') =>
                    setFormData({ ...formData, level: value })
                  }
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
              <div className="grid gap-2">
                <Label htmlFor="duration">Süre (dakika)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                  min={1}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="videoUrl">Video URL</Label>
              <div className="flex gap-2">
                <Input
                  id="videoUrl"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://..."
                />
                <Button variant="outline" size="icon">
                  <IconUpload className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="thumbnailUrl">Kapak Görseli URL</Label>
              <div className="flex gap-2">
                <Input
                  id="thumbnailUrl"
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  placeholder="https://..."
                />
                <Button variant="outline" size="icon">
                  <IconUpload className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedClass ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dersi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{selectedClass?.title}&quot; dersini silmek istediğinize emin misiniz?
              Bu işlem geri alınamaz.
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
    </Card>
  );
}
