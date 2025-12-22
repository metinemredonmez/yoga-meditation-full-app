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
  IconPhoto,
  IconX,
  IconMusic,
  IconPlayerPlay,
  IconCheck,
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
  category?: string;
  videoUrl?: string;
  audioUrl?: string;
  thumbnailUrl?: string;
  isPremium?: boolean;
  tags?: string[];
  viewCount: number;
  studentCount: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

const categories = [
  { value: 'YOGA', label: 'Yoga' },
  { value: 'MEDITATION', label: 'Meditasyon' },
  { value: 'BREATHWORK', label: 'Nefes Çalışması' },
  { value: 'PILATES', label: 'Pilates' },
  { value: 'STRETCHING', label: 'Esneme' },
  { value: 'STRENGTH', label: 'Güç' },
  { value: 'RELAXATION', label: 'Rahatlama' },
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
    category: 'YOGA',
    videoUrl: '',
    audioUrl: '',
    thumbnailUrl: '',
    isPremium: false,
    tags: '' as string,
  });

  // Upload states
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

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
      category: 'YOGA',
      videoUrl: '',
      audioUrl: '',
      thumbnailUrl: '',
      isPremium: false,
      tags: '',
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
      category: cls.category || 'YOGA',
      videoUrl: cls.videoUrl || '',
      audioUrl: cls.audioUrl || '',
      thumbnailUrl: cls.thumbnailUrl || '',
      isPremium: cls.isPremium || false,
      tags: cls.tags?.join(', ') || '',
    });
    setEditDialog(true);
  };

  // Simulated file upload function
  const handleFileUpload = async (
    file: File,
    type: 'video' | 'audio' | 'thumbnail'
  ) => {
    const setUploading = {
      video: setUploadingVideo,
      audio: setUploadingAudio,
      thumbnail: setUploadingThumbnail,
    }[type];

    setUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
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
      // In production, this would be an actual upload to your storage service
      // For now, we'll create a fake URL after simulating upload
      await new Promise((resolve) => setTimeout(resolve, 2000));

      clearInterval(interval);
      setUploadProgress(100);

      // Create a mock URL (in production, this would come from your upload service)
      const mockUrl = `https://storage.example.com/${type}s/${Date.now()}-${file.name}`;

      if (type === 'video') {
        setFormData((prev) => ({ ...prev, videoUrl: mockUrl }));
      } else if (type === 'audio') {
        setFormData((prev) => ({ ...prev, audioUrl: mockUrl }));
      } else {
        setFormData((prev) => ({ ...prev, thumbnailUrl: mockUrl }));
      }

      toast.success(`${type === 'video' ? 'Video' : type === 'audio' ? 'Ses' : 'Görsel'} yüklendi`);
    } catch (error) {
      toast.error('Yükleme başarısız');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedClass ? 'Dersi Düzenle' : 'Yeni Ders Oluştur'}</DialogTitle>
            <DialogDescription>
              Ders bilgilerini, medya dosyalarını ve ayarları girin.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Bilgiler</TabsTrigger>
              <TabsTrigger value="media">Medya</TabsTrigger>
              <TabsTrigger value="settings">Ayarlar</TabsTrigger>
            </TabsList>

            {/* Info Tab */}
            <TabsContent value="info" className="space-y-4 mt-4">
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
                  <Label htmlFor="duration">Süre (dakika)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                    min={1}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tags">Etiketler</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="yoga, sabah, enerji (virgülle ayırın)"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="space-y-6 mt-4">
              {/* Video Upload/URL */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <IconVideo className="h-4 w-4" />
                  Video
                </Label>

                {/* Video Source Tabs */}
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="upload">Yükle</TabsTrigger>
                    <TabsTrigger value="youtube">YouTube</TabsTrigger>
                    <TabsTrigger value="vimeo">Vimeo</TabsTrigger>
                    <TabsTrigger value="url">URL</TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="mt-3">
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  {formData.videoUrl ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <IconCheck className="h-5 w-5" />
                        <span>Video yüklendi</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate max-w-md mx-auto">
                        {formData.videoUrl}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData({ ...formData, videoUrl: '' })}
                      >
                        <IconX className="h-4 w-4 mr-1" />
                        Kaldır
                      </Button>
                    </div>
                  ) : uploadingVideo ? (
                    <div className="space-y-2">
                      <IconLoader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                      <p className="text-sm">Video yükleniyor...</p>
                      <Progress value={uploadProgress} className="max-w-xs mx-auto" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <IconUpload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Video dosyasını sürükleyin veya seçin
                      </p>
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'video');
                        }}
                      />
                      <Button
                        variant="outline"
                        onClick={() => videoInputRef.current?.click()}
                      >
                        Video Seç
                      </Button>
                      <p className="text-xs text-muted-foreground">MP4, MOV, WebM (max 500MB)</p>
                    </div>
                  )}
                    </div>
                  </TabsContent>

                  <TabsContent value="youtube" className="mt-3">
                    <div className="space-y-3">
                      <Input
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={formData.videoUrl?.includes('youtube') ? formData.videoUrl : ''}
                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        YouTube video URL&apos;sini yapıştırın (örn: https://www.youtube.com/watch?v=dQw4w9WgXcQ)
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="vimeo" className="mt-3">
                    <div className="space-y-3">
                      <Input
                        placeholder="https://vimeo.com/..."
                        value={formData.videoUrl?.includes('vimeo') ? formData.videoUrl : ''}
                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Vimeo video URL&apos;sini yapıştırın (örn: https://vimeo.com/123456789)
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="url" className="mt-3">
                    <div className="space-y-3">
                      <Input
                        placeholder="https://example.com/video.mp4"
                        value={formData.videoUrl && !formData.videoUrl.includes('youtube') && !formData.videoUrl.includes('vimeo') ? formData.videoUrl : ''}
                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Dailymotion veya diğer platformlardan direkt video URL&apos;si
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Audio Upload (Optional) */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <IconMusic className="h-4 w-4" />
                  Ses Dosyası (Opsiyonel)
                </Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  {formData.audioUrl ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <IconCheck className="h-5 w-5" />
                        <span>Ses dosyası yüklendi</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate max-w-md mx-auto">
                        {formData.audioUrl}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData({ ...formData, audioUrl: '' })}
                      >
                        <IconX className="h-4 w-4 mr-1" />
                        Kaldır
                      </Button>
                    </div>
                  ) : uploadingAudio ? (
                    <div className="space-y-2">
                      <IconLoader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                      <p className="text-sm">Ses yükleniyor...</p>
                      <Progress value={uploadProgress} className="max-w-xs mx-auto" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <IconMusic className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Ses dosyasını sürükleyin veya seçin
                      </p>
                      <input
                        ref={audioInputRef}
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'audio');
                        }}
                      />
                      <Button
                        variant="outline"
                        onClick={() => audioInputRef.current?.click()}
                      >
                        Ses Dosyası Seç
                      </Button>
                      <p className="text-xs text-muted-foreground">MP3, WAV, AAC (max 100MB)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Thumbnail Upload */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <IconPhoto className="h-4 w-4" />
                  Kapak Görseli
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
                      <p className="text-sm">Görsel yükleniyor...</p>
                      <Progress value={uploadProgress} className="max-w-xs mx-auto" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <IconPhoto className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Kapak görselini sürükleyin veya seçin
                      </p>
                      <input
                        ref={thumbnailInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'thumbnail');
                        }}
                      />
                      <Button
                        variant="outline"
                        onClick={() => thumbnailInputRef.current?.click()}
                      >
                        Görsel Seç
                      </Button>
                      <p className="text-xs text-muted-foreground">JPG, PNG, WebP (max 5MB, 16:9 önerilir)</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6 mt-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Premium İçerik</Label>
                  <p className="text-sm text-muted-foreground">
                    Bu dersi sadece premium üyelere göster
                  </p>
                </div>
                <Switch
                  checked={formData.isPremium}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPremium: checked })}
                />
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <Label className="text-base">Ders Durumu</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedClass ? (
                    <>
                      Mevcut durum:{' '}
                      <Badge className={statusColors[selectedClass.status]}>
                        {statusLabels[selectedClass.status]}
                      </Badge>
                    </>
                  ) : (
                    'Yeni dersler "Taslak" olarak kaydedilir. Yayınlamak için onaya gönderin.'
                  )}
                </p>
                {selectedClass?.status === 'REJECTED' && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Bu ders reddedildi. Düzenleyip tekrar onaya gönderebilirsiniz.
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <Label className="text-base">İpuçları</Label>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Video kalitesi için 1080p veya üzeri önerilir</li>
                  <li>İyi aydınlatma ve net ses önemlidir</li>
                  <li>Kapak görseli dikkat çekici olmalı</li>
                  <li>Açıklama SEO için detaylı olmalı</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving || uploadingVideo || uploadingAudio || uploadingThumbnail}>
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
