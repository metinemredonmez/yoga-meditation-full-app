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
  IconSend,
  IconLoader2,
  IconBook,
  IconCalendar,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import {
  getMyPrograms,
  createMyProgram,
  updateMyProgram,
  deleteMyProgram,
  submitProgramForReview,
} from '@/lib/api';

interface MyProgram {
  id: string;
  title: string;
  description: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  durationWeeks: number;
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED';
  thumbnailUrl?: string;
  coverImageUrl?: string;
  classCount: number;
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

export function MyProgramsTable() {
  const [programs, setPrograms] = useState<MyProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dialog states
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<MyProgram | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: 'BEGINNER' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
    durationWeeks: 4,
    thumbnailUrl: '',
    coverImageUrl: '',
  });

  useEffect(() => {
    loadPrograms();
  }, [search, statusFilter]);

  const loadPrograms = async () => {
    setLoading(true);
    try {
      const data = await getMyPrograms({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setPrograms(data.items || data);
    } catch (error) {
      // Mock data
      setPrograms([
        {
          id: '1',
          title: '30 Günde Yoga Temelleri',
          description: 'Yeni başlayanlar için kapsamlı yoga programı',
          level: 'BEGINNER',
          durationWeeks: 4,
          status: 'PUBLISHED',
          classCount: 30,
          studentCount: 850,
          rating: 4.9,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'İleri Seviye Vinyasa',
          description: 'Deneyimli yogiler için güçlü akış programı',
          level: 'ADVANCED',
          durationWeeks: 8,
          status: 'PUBLISHED',
          classCount: 24,
          studentCount: 320,
          rating: 4.8,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          title: 'Stres Yönetimi',
          description: 'Meditasyon ve nefes teknikleri',
          level: 'BEGINNER',
          durationWeeks: 2,
          status: 'DRAFT',
          classCount: 14,
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
    setSelectedProgram(null);
    setFormData({
      title: '',
      description: '',
      level: 'BEGINNER',
      durationWeeks: 4,
      thumbnailUrl: '',
      coverImageUrl: '',
    });
    setEditDialog(true);
  };

  const handleEdit = (program: MyProgram) => {
    setSelectedProgram(program);
    setFormData({
      title: program.title,
      description: program.description,
      level: program.level,
      durationWeeks: program.durationWeeks,
      thumbnailUrl: program.thumbnailUrl || '',
      coverImageUrl: program.coverImageUrl || '',
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
      if (selectedProgram) {
        await updateMyProgram(selectedProgram.id, formData);
        toast.success('Program güncellendi');
      } else {
        await createMyProgram(formData);
        toast.success('Program oluşturuldu');
      }
      setEditDialog(false);
      loadPrograms();
    } catch (error) {
      toast.error('İşlem başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProgram) return;
    try {
      await deleteMyProgram(selectedProgram.id);
      toast.success('Program silindi');
      setDeleteDialog(false);
      loadPrograms();
    } catch (error) {
      toast.error('Silme işlemi başarısız');
    }
  };

  const handleSubmitForReview = async (program: MyProgram) => {
    try {
      await submitProgramForReview(program.id);
      toast.success('Program onaya gönderildi');
      loadPrograms();
    } catch (error) {
      toast.error('Gönderme işlemi başarısız');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Programlarım</CardTitle>
            <CardDescription>Oluşturduğunuz yoga programlarını yönetin</CardDescription>
          </div>
          <Button onClick={handleCreate}>
            <IconPlus className="mr-2 h-4 w-4" />
            Yeni Program
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Program ara..."
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
                <TableHead>Program</TableHead>
                <TableHead>Seviye</TableHead>
                <TableHead>Süre</TableHead>
                <TableHead>Ders Sayısı</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Öğrenci</TableHead>
                <TableHead>Puan</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <IconLoader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : programs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Henüz program oluşturmadınız
                  </TableCell>
                </TableRow>
              ) : (
                programs.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-14 rounded bg-muted flex items-center justify-center">
                          <IconBook className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{program.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {program.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{levelLabels[program.level]}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <IconCalendar className="h-4 w-4 text-muted-foreground" />
                        {program.durationWeeks} hafta
                      </div>
                    </TableCell>
                    <TableCell>{program.classCount} ders</TableCell>
                    <TableCell>
                      <Badge className={statusColors[program.status]}>
                        {statusLabels[program.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{program.studentCount.toLocaleString()}</TableCell>
                    <TableCell>
                      {program.rating > 0 ? (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          {program.rating.toFixed(1)}
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
                          <DropdownMenuItem onClick={() => handleEdit(program)}>
                            <IconEdit className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          {program.status === 'DRAFT' && (
                            <DropdownMenuItem onClick={() => handleSubmitForReview(program)}>
                              <IconSend className="mr-2 h-4 w-4" />
                              Onaya Gönder
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedProgram(program);
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
            <DialogTitle>{selectedProgram ? 'Programı Düzenle' : 'Yeni Program Oluştur'}</DialogTitle>
            <DialogDescription>
              Program bilgilerini girin. Dersler ayrı olarak eklenecektir.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Program Adı *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Örn: 30 Günde Yoga Temelleri"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Açıklama *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Program hakkında detaylı açıklama..."
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
                <Label htmlFor="durationWeeks">Süre (hafta)</Label>
                <Input
                  id="durationWeeks"
                  type="number"
                  value={formData.durationWeeks}
                  onChange={(e) => setFormData({ ...formData, durationWeeks: parseInt(e.target.value) || 1 })}
                  min={1}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="thumbnailUrl">Küçük Resim URL</Label>
              <Input
                id="thumbnailUrl"
                value={formData.thumbnailUrl}
                onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="coverImageUrl">Kapak Görseli URL</Label>
              <Input
                id="coverImageUrl"
                value={formData.coverImageUrl}
                onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedProgram ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Programı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{selectedProgram?.title}&quot; programını silmek istediğinize emin misiniz?
              Bu işlem tüm dersleri de silecektir.
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
