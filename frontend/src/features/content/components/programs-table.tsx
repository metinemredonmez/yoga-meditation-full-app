'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getAdminPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
  publishProgram,
  unpublishProgram,
  uploadMediaToS3,
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
  IconEye,
  IconEyeOff,
  IconPhoto,
  IconClock,
  IconUser,
  IconUpload,
  IconX,
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';

interface Program {
  id: string;
  title: string;
  description: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  durationWeeks: number;
  thumbnailUrl?: string;
  coverImageUrl?: string;
  isPublished: boolean;
  instructor?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  _count?: {
    classes: number;
    enrollments: number;
  };
  createdAt: string;
  updatedAt: string;
}

export function ProgramsTable() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: 'BEGINNER' as Program['level'],
    durationWeeks: 4,
    thumbnailUrl: '',
    coverImageUrl: '',
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const loadPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminPrograms({
        page: pagination.page,
        limit: pagination.limit,
        level: levelFilter !== 'all' ? levelFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
      });
      setPrograms(data.data || []);
      setPagination(prev => ({ ...prev, total: data.pagination?.total || 0 }));
    } catch (error) {
      console.error('Failed to load programs:', error);
      toast.error('Programlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, levelFilter, statusFilter, search]);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  const openEditDialog = (program?: Program) => {
    if (program) {
      setSelectedProgram(program);
      setFormData({
        title: program.title,
        description: program.description,
        level: program.level,
        durationWeeks: program.durationWeeks,
        thumbnailUrl: program.thumbnailUrl || '',
        coverImageUrl: program.coverImageUrl || '',
      });
      setThumbnailPreview(program.thumbnailUrl || '');
      setCoverPreview(program.coverImageUrl || '');
    } else {
      setSelectedProgram(null);
      setFormData({
        title: '',
        description: '',
        level: 'BEGINNER',
        durationWeeks: 4,
        thumbnailUrl: '',
        coverImageUrl: '',
      });
      setThumbnailPreview('');
      setCoverPreview('');
    }
    setThumbnailFile(null);
    setCoverFile(null);
    setEditDialog(true);
  };

  const handleFileSelect = async (
    file: File,
    type: 'thumbnail' | 'cover'
  ) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Sadece resim dosyaları yüklenebilir');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya boyutu 5MB\'dan küçük olmalı');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (type === 'thumbnail') {
        setThumbnailPreview(e.target?.result as string);
        setThumbnailFile(file);
      } else {
        setCoverPreview(e.target?.result as string);
        setCoverFile(file);
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadFiles = async () => {
    let thumbnailUrl = formData.thumbnailUrl;
    let coverImageUrl = formData.coverImageUrl;

    if (thumbnailFile) {
      setUploadingThumbnail(true);
      try {
        const result = await uploadMediaToS3(thumbnailFile, 'thumbnail');
        thumbnailUrl = result.fileUrl;
      } catch (error) {
        toast.error('Thumbnail yüklenemedi');
        setUploadingThumbnail(false);
        return null;
      }
      setUploadingThumbnail(false);
    }

    if (coverFile) {
      setUploadingCover(true);
      try {
        const result = await uploadMediaToS3(coverFile, 'image');
        coverImageUrl = result.fileUrl;
      } catch (error) {
        toast.error('Kapak resmi yüklenemedi');
        setUploadingCover(false);
        return null;
      }
      setUploadingCover(false);
    }

    return { thumbnailUrl, coverImageUrl };
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description) {
      toast.error('Başlık ve açıklama zorunludur');
      return;
    }

    setSaving(true);
    try {
      // Upload files first if any
      const uploadedUrls = await uploadFiles();
      if (uploadedUrls === null) {
        setSaving(false);
        return;
      }

      const dataToSave = {
        ...formData,
        thumbnailUrl: uploadedUrls.thumbnailUrl,
        coverImageUrl: uploadedUrls.coverImageUrl,
      };

      if (selectedProgram) {
        await updateProgram(selectedProgram.id, dataToSave);
        toast.success('Program güncellendi');
      } else {
        await createProgram(dataToSave);
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
      await deleteProgram(selectedProgram.id);
      toast.success('Program silindi');
      setDeleteDialog(false);
      loadPrograms();
    } catch (error) {
      toast.error('Program silinemedi');
    }
  };

  const handleTogglePublish = async (program: Program) => {
    try {
      if (program.isPublished) {
        await unpublishProgram(program.id);
        toast.success('Program yayından kaldırıldı');
      } else {
        await publishProgram(program.id);
        toast.success('Program yayınlandı');
      }
      loadPrograms();
    } catch (error) {
      toast.error('İşlem başarısız');
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

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Program ara..."
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="published">Yayında</SelectItem>
              <SelectItem value="draft">Taslak</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => openEditDialog()}>
          <IconPlus className="h-4 w-4 mr-2" />
          Yeni Program
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Program bulunamadı
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program</TableHead>
                  <TableHead>Seviye</TableHead>
                  <TableHead>Süre</TableHead>
                  <TableHead>Eğitmen</TableHead>
                  <TableHead>Dersler</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {program.thumbnailUrl ? (
                          <img
                            src={program.thumbnailUrl}
                            alt={program.title}
                            className="h-10 w-16 rounded object-cover"
                          />
                        ) : (
                          <div className="h-10 w-16 rounded bg-muted flex items-center justify-center">
                            <IconPhoto className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{program.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {program.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getLevelBadge(program.level)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <IconClock className="h-4 w-4 text-muted-foreground" />
                        {program.durationWeeks} hafta
                      </div>
                    </TableCell>
                    <TableCell>
                      {program.instructor ? (
                        <div className="flex items-center gap-1 text-sm">
                          <IconUser className="h-4 w-4 text-muted-foreground" />
                          {program.instructor.firstName} {program.instructor.lastName}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{program._count?.classes || 0} ders</span>
                    </TableCell>
                    <TableCell>
                      {program.isPublished ? (
                        <Badge className="bg-green-500/10 text-green-600">
                          <IconEye className="h-3 w-3 mr-1" />
                          Yayında
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <IconEyeOff className="h-3 w-3 mr-1" />
                          Taslak
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
                          <DropdownMenuItem onClick={() => openEditDialog(program)}>
                            <IconEdit className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTogglePublish(program)}>
                            {program.isPublished ? (
                              <>
                                <IconEyeOff className="mr-2 h-4 w-4" />
                                Yayından Kaldır
                              </>
                            ) : (
                              <>
                                <IconEye className="mr-2 h-4 w-4" />
                                Yayınla
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedProgram(program);
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
            Toplam {pagination.total} program
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
              {selectedProgram ? 'Programı Düzenle' : 'Yeni Program'}
            </DialogTitle>
            <DialogDescription>
              Yoga programı bilgilerini girin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Başlık</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Program başlığı"
              />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Program açıklaması"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Seviye</Label>
                <Select
                  value={formData.level}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, level: v as Program['level'] }))}
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
                <Label>Süre (Hafta)</Label>
                <Input
                  type="number"
                  value={formData.durationWeeks}
                  onChange={(e) => setFormData(prev => ({ ...prev, durationWeeks: parseInt(e.target.value) || 1 }))}
                  min={1}
                  max={52}
                />
              </div>
            </div>
            {/* Thumbnail Upload */}
            <div>
              <Label>Thumbnail Resmi</Label>
              <div className="mt-2">
                {thumbnailPreview ? (
                  <div className="relative inline-block">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="h-24 w-36 rounded-lg object-cover border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setThumbnailPreview('');
                        setThumbnailFile(null);
                        setFormData(prev => ({ ...prev, thumbnailUrl: '' }));
                      }}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                    >
                      <IconX className="h-3 w-3" />
                    </button>
                    {uploadingThumbnail && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <IconLoader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-24 w-36 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <IconUpload className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Resim Yükle</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file, 'thumbnail');
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Cover Image Upload */}
            <div>
              <Label>Kapak Resmi</Label>
              <div className="mt-2">
                {coverPreview ? (
                  <div className="relative inline-block">
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="h-24 w-full max-w-md rounded-lg object-cover border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCoverPreview('');
                        setCoverFile(null);
                        setFormData(prev => ({ ...prev, coverImageUrl: '' }));
                      }}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                    >
                      <IconX className="h-3 w-3" />
                    </button>
                    {uploadingCover && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <IconLoader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-24 w-full border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <IconUpload className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Kapak Resmi Yükle (1200x400 önerilir)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file, 'cover');
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedProgram ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Programı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{selectedProgram?.title}&quot; programını silmek istediğinize emin misiniz?
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
    </div>
  );
}
