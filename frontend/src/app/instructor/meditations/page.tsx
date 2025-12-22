'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  IconHeadphones,
  IconPhoto,
  IconX,
  IconCheck,
  IconUpload,
  IconMusic,
  IconPlayerPlay,
  IconClock,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';

interface MyMeditation {
  id: string;
  title: string;
  description: string;
  audioUrl?: string;
  coverImage?: string;
  duration: number;
  category: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED';
  isPremium: boolean;
  playCount: number;
  averageRating: number;
  createdAt: string;
}

const categories = [
  { value: 'mindfulness', label: 'Farkındalık' },
  { value: 'sleep', label: 'Uyku' },
  { value: 'stress', label: 'Stres Yönetimi' },
  { value: 'focus', label: 'Odaklanma' },
  { value: 'anxiety', label: 'Kaygı' },
  { value: 'morning', label: 'Sabah' },
  { value: 'evening', label: 'Akşam' },
];

const difficultyLabels: Record<string, string> = {
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

export default function MyMeditationsPage() {
  const [meditations, setMeditations] = useState<MyMeditation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dialog states
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedMeditation, setSelectedMeditation] = useState<MyMeditation | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'mindfulness',
    difficulty: 'BEGINNER' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
    duration: 10,
    audioUrl: '',
    coverImage: '',
    isPremium: false,
    tags: '',
    benefits: '',
  });

  // Upload states
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMeditations();
  }, [search, statusFilter]);

  const loadMeditations = async () => {
    setLoading(true);
    try {
      // TODO: API call - getMyMeditations
      // Mock data for now
      setMeditations([
        {
          id: '1',
          title: 'Sabah Farkındalık Meditasyonu',
          description: 'Güne huzurlu bir başlangıç için 10 dakikalık meditasyon',
          audioUrl: '/uploads/demo/meditation-demo.mp3',
          coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400',
          duration: 600,
          category: 'morning',
          difficulty: 'BEGINNER',
          status: 'PUBLISHED',
          isPremium: false,
          playCount: 1250,
          averageRating: 4.8,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Derin Uyku Meditasyonu',
          description: 'Uyumadan önce zihni sakinleştiren 20 dakikalık meditasyon',
          audioUrl: '',
          coverImage: 'https://images.unsplash.com/photo-1511295742362-92c96b1cf484?w=400',
          duration: 1200,
          category: 'sleep',
          difficulty: 'BEGINNER',
          status: 'DRAFT',
          isPremium: true,
          playCount: 0,
          averageRating: 0,
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          title: 'Stres Azaltma Seansı',
          description: 'Yoğun günlerin ortasında rahatlama',
          audioUrl: '',
          coverImage: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400',
          duration: 900,
          category: 'stress',
          difficulty: 'INTERMEDIATE',
          status: 'PENDING',
          isPremium: false,
          playCount: 0,
          averageRating: 0,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      toast.error('Meditasyonlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedMeditation(null);
    setFormData({
      title: '',
      description: '',
      category: 'mindfulness',
      difficulty: 'BEGINNER',
      duration: 10,
      audioUrl: '',
      coverImage: '',
      isPremium: false,
      tags: '',
      benefits: '',
    });
    setEditDialog(true);
  };

  const handleEdit = (meditation: MyMeditation) => {
    setSelectedMeditation(meditation);
    setFormData({
      title: meditation.title,
      description: meditation.description,
      category: meditation.category,
      difficulty: meditation.difficulty,
      duration: Math.floor(meditation.duration / 60),
      audioUrl: meditation.audioUrl || '',
      coverImage: meditation.coverImage || '',
      isPremium: meditation.isPremium,
      tags: '',
      benefits: '',
    });
    setEditDialog(true);
  };

  // Audio upload handler
  const handleAudioUpload = async (file: File) => {
    setUploadingAudio(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 10;
      });
    }, 400);

    try {
      // TODO: Real upload - use storageService
      await new Promise((resolve) => setTimeout(resolve, 2500));
      clearInterval(interval);
      setUploadProgress(100);

      const mockUrl = `/uploads/audio/${Date.now()}-${file.name}`;
      setFormData((prev) => ({ ...prev, audioUrl: mockUrl }));
      toast.success('Ses dosyası yüklendi');
    } catch (error) {
      toast.error('Ses yükleme başarısız');
    } finally {
      setUploadingAudio(false);
      setUploadProgress(0);
    }
  };

  // Cover upload handler
  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true);
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
      setFormData((prev) => ({ ...prev, coverImage: mockUrl }));
      toast.success('Kapak görseli yüklendi');
    } catch (error) {
      toast.error('Görsel yükleme başarısız');
    } finally {
      setUploadingCover(false);
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
      // TODO: API call - createMyMeditation / updateMyMeditation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (selectedMeditation) {
        toast.success('Meditasyon güncellendi');
      } else {
        toast.success('Meditasyon oluşturuldu');
      }
      setEditDialog(false);
      loadMeditations();
    } catch (error) {
      toast.error('İşlem başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMeditation) return;
    try {
      // TODO: API call - deleteMyMeditation
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success('Meditasyon silindi');
      setDeleteDialog(false);
      loadMeditations();
    } catch (error) {
      toast.error('Silme işlemi başarısız');
    }
  };

  const handleSubmitForReview = async (meditation: MyMeditation) => {
    try {
      // TODO: API call - submitMeditationForReview
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success('Meditasyon onaya gönderildi');
      loadMeditations();
    } catch (error) {
      toast.error('Gönderme işlemi başarısız');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} dk`;
  };

  return (
    <PageContainer>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <IconHeadphones className="h-5 w-5" />
                Meditasyonlarım
              </CardTitle>
              <CardDescription>
                Kendi meditasyon içeriklerinizi oluşturun ve yönetin
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <IconPlus className="mr-2 h-4 w-4" />
              Yeni Meditasyon
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Meditasyon ara..."
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
                  <TableHead>Meditasyon</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Süre</TableHead>
                  <TableHead>Seviye</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Dinlenme</TableHead>
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
                ) : meditations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Henüz meditasyon oluşturmadınız
                    </TableCell>
                  </TableRow>
                ) : (
                  meditations.map((meditation) => (
                    <TableRow key={meditation.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                            {meditation.coverImage ? (
                              <img
                                src={meditation.coverImage}
                                alt={meditation.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <IconHeadphones className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {meditation.title}
                              {meditation.isPremium && (
                                <Badge variant="secondary" className="text-xs">Premium</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {meditation.description}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {categories.find((c) => c.value === meditation.category)?.label || meditation.category}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <IconClock className="h-4 w-4 text-muted-foreground" />
                          {formatDuration(meditation.duration)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{difficultyLabels[meditation.difficulty]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[meditation.status]}>
                          {statusLabels[meditation.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{meditation.playCount.toLocaleString()}</TableCell>
                      <TableCell>
                        {meditation.averageRating > 0 ? (
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">★</span>
                            {meditation.averageRating.toFixed(1)}
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
                            <DropdownMenuItem onClick={() => handleEdit(meditation)}>
                              <IconEdit className="mr-2 h-4 w-4" />
                              Düzenle
                            </DropdownMenuItem>
                            {meditation.status === 'DRAFT' && (
                              <DropdownMenuItem onClick={() => handleSubmitForReview(meditation)}>
                                <IconSend className="mr-2 h-4 w-4" />
                                Onaya Gönder
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedMeditation(meditation);
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
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedMeditation ? 'Meditasyonu Düzenle' : 'Yeni Meditasyon Oluştur'}
            </DialogTitle>
            <DialogDescription>
              Meditasyon bilgilerini ve ses dosyasını düzenleyin
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
                <Label htmlFor="title">Meditasyon Adı *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Örn: Sabah Farkındalık Meditasyonu"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Açıklama *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Meditasyon hakkında detaylı açıklama..."
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
                  <Label htmlFor="difficulty">Seviye</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED') =>
                      setFormData({ ...formData, difficulty: value })
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
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 1 })}
                    min={1}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tags">Etiketler</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="meditasyon, sabah, huzur (virgülle ayırın)"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="benefits">Faydaları</Label>
                <Textarea
                  id="benefits"
                  value={formData.benefits}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  placeholder="Bu meditasyonun faydalarını açıklayın..."
                  rows={2}
                />
              </div>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="space-y-6 mt-4">
              {/* Audio Upload */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <IconMusic className="h-4 w-4" />
                  Ses Dosyası *
                </Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  {formData.audioUrl ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <IconCheck className="h-5 w-5" />
                        <span>Ses dosyası yüklendi</span>
                      </div>
                      <audio controls className="mx-auto">
                        <source src={formData.audioUrl} type="audio/mpeg" />
                      </audio>
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
                      <p className="text-sm">Ses dosyası yükleniyor...</p>
                      <Progress value={uploadProgress} className="max-w-xs mx-auto" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <IconMusic className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Meditasyon ses dosyasını yükleyin
                      </p>
                      <input
                        ref={audioInputRef}
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAudioUpload(file);
                        }}
                      />
                      <Button
                        variant="outline"
                        onClick={() => audioInputRef.current?.click()}
                      >
                        Ses Dosyası Seç
                      </Button>
                      <p className="text-xs text-muted-foreground">MP3, WAV, M4A (max 100MB)</p>
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
                  {formData.coverImage ? (
                    <div className="space-y-2">
                      <img
                        src={formData.coverImage}
                        alt="Cover"
                        className="w-32 h-32 object-cover rounded-lg mx-auto"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData({ ...formData, coverImage: '' })}
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
                      <IconPhoto className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Meditasyon kapak görseli
                      </p>
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleCoverUpload(file);
                        }}
                      />
                      <Button
                        variant="outline"
                        onClick={() => coverInputRef.current?.click()}
                      >
                        Görsel Seç
                      </Button>
                      <p className="text-xs text-muted-foreground">JPG, PNG (max 2MB, 1:1 önerilir)</p>
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
                    Bu meditasyonu sadece premium üyelere göster
                  </p>
                </div>
                <Switch
                  checked={formData.isPremium}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPremium: checked })}
                />
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <Label className="text-base">Yayın Durumu</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedMeditation ? (
                    <>
                      Mevcut durum:{' '}
                      <Badge className={statusColors[selectedMeditation.status]}>
                        {statusLabels[selectedMeditation.status]}
                      </Badge>
                    </>
                  ) : (
                    'Yeni meditasyonlar "Taslak" olarak kaydedilir. Yayınlamak için onaya gönderin.'
                  )}
                </p>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <Label className="text-base">İpuçları</Label>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Ses kalitesi önemlidir - temiz bir kayıt yapın</li>
                  <li>Süreyi başlangıçta kısa tutun (5-10 dakika)</li>
                  <li>Açıklayıcı bir başlık ve detaylı açıklama yazın</li>
                  <li>Çekici bir kapak görseli kullanın</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving || uploadingAudio || uploadingCover}>
              {saving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedMeditation ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Meditasyonu Sil</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{selectedMeditation?.title}&quot; meditasyonunu silmek istediğinize emin misiniz?
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
    </PageContainer>
  );
}
