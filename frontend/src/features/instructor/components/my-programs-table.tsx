'use client';

import { useEffect, useState, useRef } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
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
  IconPhoto,
  IconX,
  IconCheck,
  IconUpload,
  IconGripVertical,
  IconVideo,
  IconBrandYoutube,
  IconLink,
  IconPlayerPlay,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import {
  getMyPrograms,
  createMyProgram,
  updateMyProgram,
  deleteMyProgram,
  submitProgramForReview,
  getMyClasses,
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
  isPremium?: boolean;
  category?: string;
  tags?: string[];
  classIds?: string[];
  classCount: number;
  studentCount: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

interface AvailableClass {
  id: string;
  title: string;
  duration: number;
  level: string;
  status: string;
}

const categories = [
  { value: 'YOGA', label: 'Yoga' },
  { value: 'MEDITATION', label: 'Meditasyon' },
  { value: 'BREATHWORK', label: 'Nefes Çalışması' },
  { value: 'PILATES', label: 'Pilates' },
  { value: 'WELLNESS', label: 'Wellness' },
  { value: 'FITNESS', label: 'Fitness' },
];

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
    category: 'YOGA',
    durationWeeks: 4,
    thumbnailUrl: '',
    coverImageUrl: '',
    promoVideoUrl: '',
    isPremium: false,
    tags: '' as string,
    selectedClassIds: [] as string[],
  });

  // Available classes for the program
  const [availableClasses, setAvailableClasses] = useState<AvailableClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Upload states
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPromoVideo, setUploadingPromoVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const promoVideoInputRef = useRef<HTMLInputElement>(null);

  // Video URL state
  const [promoVideoSource, setPromoVideoSource] = useState<'upload' | 'youtube' | 'vimeo' | 'url'>('upload');

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

  // Load available classes when dialog opens
  const loadAvailableClasses = async () => {
    setLoadingClasses(true);
    try {
      const data = await getMyClasses({ status: 'PUBLISHED', limit: 100 });
      setAvailableClasses(data.items || data || []);
    } catch (error) {
      // Mock data
      setAvailableClasses([
        { id: '1', title: 'Sabah Yoga Akışı', duration: 30, level: 'BEGINNER', status: 'PUBLISHED' },
        { id: '2', title: 'Güç Yoga', duration: 45, level: 'ADVANCED', status: 'PUBLISHED' },
        { id: '3', title: 'Akşam Meditasyonu', duration: 20, level: 'BEGINNER', status: 'PUBLISHED' },
      ]);
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleCreate = () => {
    setSelectedProgram(null);
    setFormData({
      title: '',
      description: '',
      level: 'BEGINNER',
      category: 'YOGA',
      durationWeeks: 4,
      thumbnailUrl: '',
      coverImageUrl: '',
      promoVideoUrl: '',
      isPremium: false,
      tags: '',
      selectedClassIds: [],
    });
    setPromoVideoSource('upload');
    loadAvailableClasses();
    setEditDialog(true);
  };

  const handleEdit = (program: MyProgram) => {
    setSelectedProgram(program);
    setFormData({
      title: program.title,
      description: program.description,
      level: program.level,
      category: program.category || 'YOGA',
      durationWeeks: program.durationWeeks,
      thumbnailUrl: program.thumbnailUrl || '',
      coverImageUrl: program.coverImageUrl || '',
      promoVideoUrl: (program as unknown as { promoVideoUrl?: string }).promoVideoUrl || '',
      isPremium: program.isPremium || false,
      tags: program.tags?.join(', ') || '',
      selectedClassIds: program.classIds || [],
    });
    // Detect video source type from URL
    const videoUrl = (program as unknown as { promoVideoUrl?: string }).promoVideoUrl || '';
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      setPromoVideoSource('youtube');
    } else if (videoUrl.includes('vimeo.com')) {
      setPromoVideoSource('vimeo');
    } else if (videoUrl && !videoUrl.includes('storage.')) {
      setPromoVideoSource('url');
    } else {
      setPromoVideoSource('upload');
    }
    loadAvailableClasses();
    setEditDialog(true);
  };

  // Image upload handler
  const handleImageUpload = async (file: File, type: 'thumbnail' | 'cover') => {
    const setUploading = type === 'thumbnail' ? setUploadingThumbnail : setUploadingCover;
    setUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 300);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      clearInterval(interval);
      setUploadProgress(100);

      const mockUrl = `https://storage.example.com/images/${Date.now()}-${file.name}`;

      if (type === 'thumbnail') {
        setFormData((prev) => ({ ...prev, thumbnailUrl: mockUrl }));
      } else {
        setFormData((prev) => ({ ...prev, coverImageUrl: mockUrl }));
      }

      toast.success('Görsel yüklendi');
    } catch (error) {
      toast.error('Yükleme başarısız');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Video upload handler
  const handleVideoUpload = async (file: File) => {
    setUploadingPromoVideo(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 8;
      });
    }, 500);

    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      clearInterval(interval);
      setUploadProgress(100);

      const mockUrl = `https://storage.example.com/videos/${Date.now()}-${file.name}`;
      setFormData((prev) => ({ ...prev, promoVideoUrl: mockUrl }));
      toast.success('Video yüklendi');
    } catch (error) {
      toast.error('Video yükleme başarısız');
    } finally {
      setUploadingPromoVideo(false);
      setUploadProgress(0);
    }
  };

  // Video URL validation helpers
  const extractYoutubeId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const extractVimeoId = (url: string): string | null => {
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return match ? match[1] : null;
  };

  const getVideoPreview = () => {
    const url = formData.promoVideoUrl;
    if (!url) return null;

    if (promoVideoSource === 'youtube') {
      const videoId = extractYoutubeId(url);
      if (videoId) {
        return (
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }
    } else if (promoVideoSource === 'vimeo') {
      const videoId = extractVimeoId(url);
      if (videoId) {
        return (
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
            <iframe
              src={`https://player.vimeo.com/video/${videoId}`}
              className="w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }
    } else if (promoVideoSource === 'url' || promoVideoSource === 'upload') {
      return (
        <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
          <video src={url} controls className="w-full h-full" />
        </div>
      );
    }
    return null;
  };

  // Toggle class selection
  const toggleClassSelection = (classId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedClassIds: prev.selectedClassIds.includes(classId)
        ? prev.selectedClassIds.filter((id) => id !== classId)
        : [...prev.selectedClassIds, classId],
    }));
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProgram ? 'Programı Düzenle' : 'Yeni Program Oluştur'}</DialogTitle>
            <DialogDescription>
              Program bilgilerini, görselleri ve içerikleri düzenleyin.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info">Bilgiler</TabsTrigger>
              <TabsTrigger value="media">Görseller</TabsTrigger>
              <TabsTrigger value="classes">Dersler</TabsTrigger>
              <TabsTrigger value="settings">Ayarlar</TabsTrigger>
            </TabsList>

            {/* Info Tab */}
            <TabsContent value="info" className="space-y-4 mt-4">
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
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                <div className="grid gap-2">
                  <Label htmlFor="tags">Etiketler</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="yoga, başlangıç, sağlık (virgülle ayırın)"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="space-y-6 mt-4">
              {/* Thumbnail Upload */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <IconPhoto className="h-4 w-4" />
                  Küçük Resim (Thumbnail)
                </Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  {formData.thumbnailUrl ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <IconCheck className="h-5 w-5" />
                        <span>Görsel yüklendi</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate max-w-md mx-auto">
                        {formData.thumbnailUrl}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData({ ...formData, thumbnailUrl: '' })}
                      >
                        <IconX className="h-4 w-4 mr-1" />
                        Kaldır
                      </Button>
                    </div>
                  ) : uploadingThumbnail ? (
                    <div className="space-y-2">
                      <IconLoader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                      <p className="text-sm">Yükleniyor...</p>
                      <Progress value={uploadProgress} className="max-w-xs mx-auto" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <IconPhoto className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Liste görünümünde kullanılacak küçük resim
                      </p>
                      <input
                        ref={thumbnailInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, 'thumbnail');
                        }}
                      />
                      <Button
                        variant="outline"
                        onClick={() => thumbnailInputRef.current?.click()}
                      >
                        Görsel Seç
                      </Button>
                      <p className="text-xs text-muted-foreground">JPG, PNG (max 2MB, 1:1 veya 16:9)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Cover Image Upload */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <IconPhoto className="h-4 w-4" />
                  Kapak Görseli
                </Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  {formData.coverImageUrl ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <IconCheck className="h-5 w-5" />
                        <span>Kapak görseli yüklendi</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate max-w-md mx-auto">
                        {formData.coverImageUrl}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData({ ...formData, coverImageUrl: '' })}
                      >
                        <IconX className="h-4 w-4 mr-1" />
                        Kaldır
                      </Button>
                    </div>
                  ) : uploadingCover ? (
                    <div className="space-y-2">
                      <IconLoader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                      <p className="text-sm">Yükleniyor...</p>
                      <Progress value={uploadProgress} className="max-w-xs mx-auto" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <IconUpload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Program detay sayfasında görünecek büyük kapak görseli
                      </p>
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, 'cover');
                        }}
                      />
                      <Button
                        variant="outline"
                        onClick={() => coverInputRef.current?.click()}
                      >
                        Kapak Görseli Seç
                      </Button>
                      <p className="text-xs text-muted-foreground">JPG, PNG (max 5MB, 16:9 önerilir)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Promo Video Section */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <IconVideo className="h-4 w-4" />
                  Tanıtım Videosu
                </Label>
                <p className="text-sm text-muted-foreground">
                  Programa ait kısa bir tanıtım videosu ekleyin
                </p>

                {/* Video Source Tabs */}
                <Tabs value={promoVideoSource} onValueChange={(v) => {
                  setPromoVideoSource(v as typeof promoVideoSource);
                  setFormData({ ...formData, promoVideoUrl: '' });
                }} className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="upload" className="flex items-center gap-1">
                      <IconUpload className="h-3 w-3" />
                      Yükle
                    </TabsTrigger>
                    <TabsTrigger value="youtube" className="flex items-center gap-1">
                      <IconBrandYoutube className="h-3 w-3" />
                      YouTube
                    </TabsTrigger>
                    <TabsTrigger value="vimeo" className="flex items-center gap-1">
                      <IconPlayerPlay className="h-3 w-3" />
                      Vimeo
                    </TabsTrigger>
                    <TabsTrigger value="url" className="flex items-center gap-1">
                      <IconLink className="h-3 w-3" />
                      URL
                    </TabsTrigger>
                  </TabsList>

                  {/* Upload Tab */}
                  <TabsContent value="upload" className="mt-3">
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      {formData.promoVideoUrl && promoVideoSource === 'upload' ? (
                        <div className="space-y-3">
                          {getVideoPreview()}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFormData({ ...formData, promoVideoUrl: '' })}
                          >
                            <IconX className="h-4 w-4 mr-1" />
                            Kaldır
                          </Button>
                        </div>
                      ) : uploadingPromoVideo ? (
                        <div className="space-y-2">
                          <IconLoader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                          <p className="text-sm">Video yükleniyor...</p>
                          <Progress value={uploadProgress} className="max-w-xs mx-auto" />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <IconVideo className="h-8 w-8 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Bilgisayarınızdan video dosyası yükleyin
                          </p>
                          <input
                            ref={promoVideoInputRef}
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleVideoUpload(file);
                            }}
                          />
                          <Button
                            variant="outline"
                            onClick={() => promoVideoInputRef.current?.click()}
                          >
                            Video Seç
                          </Button>
                          <p className="text-xs text-muted-foreground">MP4, MOV, WebM (max 500MB)</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* YouTube Tab */}
                  <TabsContent value="youtube" className="mt-3 space-y-3">
                    <div className="space-y-2">
                      <Input
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={formData.promoVideoUrl}
                        onChange={(e) => setFormData({ ...formData, promoVideoUrl: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        YouTube video linkini yapıştırın (örn: https://www.youtube.com/watch?v=xxxxx veya https://youtu.be/xxxxx)
                      </p>
                    </div>
                    {formData.promoVideoUrl && extractYoutubeId(formData.promoVideoUrl) && (
                      <div className="space-y-2">
                        {getVideoPreview()}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({ ...formData, promoVideoUrl: '' })}
                        >
                          <IconX className="h-4 w-4 mr-1" />
                          Kaldır
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  {/* Vimeo Tab */}
                  <TabsContent value="vimeo" className="mt-3 space-y-3">
                    <div className="space-y-2">
                      <Input
                        placeholder="https://vimeo.com/..."
                        value={formData.promoVideoUrl}
                        onChange={(e) => setFormData({ ...formData, promoVideoUrl: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Vimeo video linkini yapıştırın (örn: https://vimeo.com/123456789)
                      </p>
                    </div>
                    {formData.promoVideoUrl && extractVimeoId(formData.promoVideoUrl) && (
                      <div className="space-y-2">
                        {getVideoPreview()}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({ ...formData, promoVideoUrl: '' })}
                        >
                          <IconX className="h-4 w-4 mr-1" />
                          Kaldır
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  {/* Direct URL Tab */}
                  <TabsContent value="url" className="mt-3 space-y-3">
                    <div className="space-y-2">
                      <Input
                        placeholder="https://example.com/video.mp4"
                        value={formData.promoVideoUrl}
                        onChange={(e) => setFormData({ ...formData, promoVideoUrl: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Video dosyasının doğrudan URL&apos;sini girin (MP4, WebM, MOV)
                      </p>
                    </div>
                    {formData.promoVideoUrl && (
                      <div className="space-y-2">
                        {getVideoPreview()}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({ ...formData, promoVideoUrl: '' })}
                        >
                          <IconX className="h-4 w-4 mr-1" />
                          Kaldır
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>

            {/* Classes Tab */}
            <TabsContent value="classes" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Program Dersleri</Label>
                  <p className="text-sm text-muted-foreground">
                    Programa eklemek istediğiniz dersleri seçin
                  </p>
                </div>
                <Badge variant="outline">
                  {formData.selectedClassIds.length} ders seçili
                </Badge>
              </div>

              {loadingClasses ? (
                <div className="flex items-center justify-center py-8">
                  <IconLoader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : availableClasses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <IconBook className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Henüz yayınlanmış ders bulunmuyor.</p>
                  <p className="text-sm">Önce ders oluşturup yayınlamanız gerekiyor.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {availableClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.selectedClassIds.includes(cls.id)
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => toggleClassSelection(cls.id)}
                    >
                      <Checkbox
                        checked={formData.selectedClassIds.includes(cls.id)}
                        onCheckedChange={() => toggleClassSelection(cls.id)}
                      />
                      <IconGripVertical className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="font-medium">{cls.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {cls.duration} dk • {levelLabels[cls.level]}
                        </div>
                      </div>
                      {formData.selectedClassIds.includes(cls.id) && (
                        <IconCheck className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>İpucu:</strong> Seçtiğiniz dersler programa sırayla eklenecektir.
                  Daha sonra ders sırasını değiştirebilirsiniz.
                </p>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6 mt-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Premium Program</Label>
                  <p className="text-sm text-muted-foreground">
                    Bu programı sadece premium üyelere göster
                  </p>
                </div>
                <Switch
                  checked={formData.isPremium}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPremium: checked })}
                />
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <Label className="text-base">Program Durumu</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedProgram ? (
                    <>
                      Mevcut durum:{' '}
                      <Badge className={statusColors[selectedProgram.status]}>
                        {statusLabels[selectedProgram.status]}
                      </Badge>
                    </>
                  ) : (
                    'Yeni programlar "Taslak" olarak kaydedilir. Yayınlamak için onaya gönderin.'
                  )}
                </p>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <Label className="text-base">Program Oluşturma İpuçları</Label>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>En az 5-10 ders içeren programlar daha etkilidir</li>
                  <li>Dersleri kolaydan zora doğru sıralayın</li>
                  <li>Haftalık hedefler belirleyin</li>
                  <li>Çekici bir kapak görseli kullanın</li>
                  <li>Açıklamada programın faydalarını belirtin</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving || uploadingThumbnail || uploadingCover || uploadingPromoVideo}>
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
