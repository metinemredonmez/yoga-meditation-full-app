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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  IconUpload,
  IconLink,
  IconBrandYoutube,
  IconBrandVimeo,
  IconPlayerRecord,
  IconPhoto,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { toast } from 'sonner';

type VideoSourceType = 'UPLOAD' | 'YOUTUBE' | 'DAILYMOTION' | 'VIMEO' | 'EXTERNAL' | null;
type VideoQualityType = 'SD_360P' | 'SD_480P' | 'HD_720P' | 'HD_1080P' | 'QHD_1440P' | 'UHD_4K' | null;
type VideoFormatType = 'MP4' | 'WEBM' | 'MOV' | 'AVI' | 'MKV' | null;

interface YogaClass {
  id: string;
  title: string;
  description: string;
  duration: number;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  videoUrl?: string;
  videoSource?: VideoSourceType;
  videoQuality?: VideoQualityType;
  videoFormat?: VideoFormatType;
  videoId?: string;
  videoDuration?: number;
  thumbnailUrl?: string;
  program?: {
    id: string;
    title: string;
  };
  users?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  _count?: {
    bookings: number;
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
    videoSource: null as VideoSourceType,
    videoQuality: null as VideoQualityType,
    videoFormat: null as VideoFormatType,
    videoId: '',
    thumbnailUrl: '',
  });

  const [videoSourceTab, setVideoSourceTab] = useState<string>('youtube');
  const [videoPreview, setVideoPreview] = useState<{ valid: boolean; title?: string; thumbnail?: string } | null>(null);
  const [checkingVideo, setCheckingVideo] = useState(false);

  const loadClasses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminClasses({
        page: pagination.page,
        limit: pagination.limit,
        level: levelFilter !== 'all' ? levelFilter : undefined,
        search: search || undefined,
      });
      setClasses(data.classes || []);
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

  // Video URL'den platform ve ID çıkarma
  const extractVideoInfo = (url: string): { source: VideoSourceType; videoId: string } | null => {
    if (!url) return null;

    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (youtubeMatch) return { source: 'YOUTUBE', videoId: youtubeMatch[1] };

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) return { source: 'VIMEO', videoId: vimeoMatch[1] };

    // Dailymotion
    const dailymotionMatch = url.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/);
    if (dailymotionMatch) return { source: 'DAILYMOTION', videoId: dailymotionMatch[1] };

    return { source: 'EXTERNAL', videoId: '' };
  };

  // Video ID'den embed URL oluşturma
  const getEmbedUrl = (source: VideoSourceType, videoId: string): string => {
    switch (source) {
      case 'YOUTUBE':
        return `https://www.youtube.com/embed/${videoId}`;
      case 'VIMEO':
        return `https://player.vimeo.com/video/${videoId}`;
      case 'DAILYMOTION':
        return `https://www.dailymotion.com/embed/video/${videoId}`;
      default:
        return '';
    }
  };

  // Video URL'i kontrol et
  const checkVideoUrl = async (url: string) => {
    if (!url) {
      setVideoPreview(null);
      return;
    }

    setCheckingVideo(true);
    const info = extractVideoInfo(url);

    if (info && info.source !== 'EXTERNAL') {
      setFormData(prev => ({
        ...prev,
        videoSource: info.source,
        videoId: info.videoId,
      }));

      // YouTube için thumbnail al
      if (info.source === 'YOUTUBE') {
        setVideoPreview({
          valid: true,
          thumbnail: `https://img.youtube.com/vi/${info.videoId}/mqdefault.jpg`,
        });
      } else {
        setVideoPreview({ valid: true });
      }
    } else {
      setFormData(prev => ({
        ...prev,
        videoSource: 'EXTERNAL',
        videoId: '',
      }));
      setVideoPreview({ valid: false });
    }

    setCheckingVideo(false);
  };

  const openEditDialog = (yogaClass?: YogaClass) => {
    if (yogaClass) {
      setSelectedClass(yogaClass);
      setFormData({
        title: yogaClass.title,
        description: yogaClass.description,
        duration: yogaClass.duration,
        level: yogaClass.level,
        videoUrl: yogaClass.videoUrl || '',
        videoSource: yogaClass.videoSource || null,
        videoQuality: yogaClass.videoQuality || null,
        videoFormat: yogaClass.videoFormat || null,
        videoId: yogaClass.videoId || '',
        thumbnailUrl: yogaClass.thumbnailUrl || '',
      });

      // Video kaynağına göre tab seç
      if (yogaClass.videoSource) {
        const tabMap: Record<string, string> = {
          'YOUTUBE': 'youtube',
          'VIMEO': 'vimeo',
          'DAILYMOTION': 'dailymotion',
          'UPLOAD': 'upload',
          'EXTERNAL': 'url',
        };
        setVideoSourceTab(tabMap[yogaClass.videoSource] || 'youtube');
      }

      // Video preview
      if (yogaClass.videoUrl) {
        checkVideoUrl(yogaClass.videoUrl);
      }
    } else {
      setSelectedClass(null);
      setFormData({
        title: '',
        description: '',
        duration: 30,
        level: 'BEGINNER',
        videoUrl: '',
        videoSource: null,
        videoQuality: null,
        videoFormat: null,
        videoId: '',
        thumbnailUrl: '',
      });
      setVideoSourceTab('youtube');
      setVideoPreview(null);
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
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200 dark:bg-green-400/20 dark:text-green-400 dark:border-green-400/30">
            Başlangıç
          </span>
        );
      case 'INTERMEDIATE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700 border border-cyan-200 dark:bg-cyan-400/20 dark:text-cyan-400 dark:border-cyan-400/30">
            Orta
          </span>
        );
      case 'ADVANCED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-400/20 dark:text-violet-400 dark:border-violet-400/30">
            İleri
          </span>
        );
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
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="h-10 w-16 rounded bg-gradient-to-br from-cyan-500/20 to-cyan-600/30 dark:from-cyan-400/30 dark:to-cyan-500/40 items-center justify-center border border-cyan-400/50 dark:border-cyan-400/40"
                          style={{ display: yogaClass.thumbnailUrl ? 'none' : 'flex' }}
                        >
                          <IconVideo className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <div>
                          <p className="font-medium">{yogaClass.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {yogaClass._count?.bookings || 0} rezervasyon
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
                      {yogaClass.users ? (
                        <div className="flex items-center gap-1 text-sm">
                          <IconUser className="h-4 w-4 text-muted-foreground" />
                          {yogaClass.users.firstName} {yogaClass.users.lastName}
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
                        <div className="flex items-center gap-1">
                          {yogaClass.videoSource === 'YOUTUBE' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-700 border border-pink-200 dark:bg-pink-400/20 dark:text-pink-400 dark:border-pink-400/30">
                              <IconBrandYoutube className="h-3 w-3 mr-1" />
                              YouTube
                            </span>
                          )}
                          {yogaClass.videoSource === 'VIMEO' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700 border border-cyan-200 dark:bg-cyan-400/20 dark:text-cyan-400 dark:border-cyan-400/30">
                              <IconBrandVimeo className="h-3 w-3 mr-1" />
                              Vimeo
                            </span>
                          )}
                          {yogaClass.videoSource === 'DAILYMOTION' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-400/20 dark:text-indigo-400 dark:border-indigo-400/30">
                              <IconPlayerRecord className="h-3 w-3 mr-1" />
                              Daily
                            </span>
                          )}
                          {yogaClass.videoSource === 'UPLOAD' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-400/20 dark:text-violet-400 dark:border-violet-400/30">
                              <IconUpload className="h-3 w-3 mr-1" />
                              Yüklendi
                            </span>
                          )}
                          {(yogaClass.videoSource === 'EXTERNAL' || !yogaClass.videoSource) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200 dark:bg-green-400/20 dark:text-green-400 dark:border-green-400/30">
                              <IconPlayerPlay className="h-3 w-3 mr-1" />
                              Mevcut
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-400/20 dark:text-slate-400 dark:border-slate-400/30">
                          Yok
                        </span>
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
            {/* Video Kaynağı Seçimi */}
            <div className="space-y-3">
              <Label>Video Kaynağı</Label>
              <Tabs value={videoSourceTab} onValueChange={setVideoSourceTab}>
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="youtube" className="flex items-center gap-1">
                    <IconBrandYoutube className="h-4 w-4" />
                    <span className="hidden sm:inline">YouTube</span>
                  </TabsTrigger>
                  <TabsTrigger value="vimeo" className="flex items-center gap-1">
                    <IconBrandVimeo className="h-4 w-4" />
                    <span className="hidden sm:inline">Vimeo</span>
                  </TabsTrigger>
                  <TabsTrigger value="dailymotion" className="flex items-center gap-1">
                    <IconPlayerRecord className="h-4 w-4" />
                    <span className="hidden sm:inline">Daily</span>
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="flex items-center gap-1">
                    <IconUpload className="h-4 w-4" />
                    <span className="hidden sm:inline">Yükle</span>
                  </TabsTrigger>
                  <TabsTrigger value="url" className="flex items-center gap-1">
                    <IconLink className="h-4 w-4" />
                    <span className="hidden sm:inline">URL</span>
                  </TabsTrigger>
                </TabsList>

                {/* YouTube Tab */}
                <TabsContent value="youtube" className="space-y-3">
                  <div>
                    <Label className="text-sm text-muted-foreground">YouTube Video URL</Label>
                    <Input
                      value={formData.videoUrl}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, videoUrl: e.target.value }));
                        checkVideoUrl(e.target.value);
                      }}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>
                  {checkingVideo && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <IconLoader2 className="h-4 w-4 animate-spin" />
                      Video kontrol ediliyor...
                    </div>
                  )}
                  {videoPreview && formData.videoSource === 'YOUTUBE' && (
                    <div className="border rounded-lg p-3 bg-muted/30">
                      <div className="flex items-start gap-3">
                        {videoPreview.thumbnail && (
                          <img
                            src={videoPreview.thumbnail}
                            alt="Video önizleme"
                            className="w-32 h-20 rounded object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-green-600">
                            <IconCheck className="h-4 w-4" />
                            <span className="text-sm font-medium">Video bulundu!</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Video ID: {formData.videoId}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Vimeo Tab */}
                <TabsContent value="vimeo" className="space-y-3">
                  <div>
                    <Label className="text-sm text-muted-foreground">Vimeo Video URL</Label>
                    <Input
                      value={formData.videoUrl}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, videoUrl: e.target.value }));
                        checkVideoUrl(e.target.value);
                      }}
                      placeholder="https://vimeo.com/123456789"
                    />
                  </div>
                  {videoPreview && formData.videoSource === 'VIMEO' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <IconCheck className="h-4 w-4" />
                      <span className="text-sm">Video ID: {formData.videoId}</span>
                    </div>
                  )}
                </TabsContent>

                {/* Dailymotion Tab */}
                <TabsContent value="dailymotion" className="space-y-3">
                  <div>
                    <Label className="text-sm text-muted-foreground">Dailymotion Video URL</Label>
                    <Input
                      value={formData.videoUrl}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, videoUrl: e.target.value }));
                        checkVideoUrl(e.target.value);
                      }}
                      placeholder="https://www.dailymotion.com/video/xyz123"
                    />
                  </div>
                  {videoPreview && formData.videoSource === 'DAILYMOTION' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <IconCheck className="h-4 w-4" />
                      <span className="text-sm">Video ID: {formData.videoId}</span>
                    </div>
                  )}
                </TabsContent>

                {/* Upload Tab */}
                <TabsContent value="upload" className="space-y-3">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <IconUpload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-sm font-medium">Dosya sürükle veya tıkla</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      MP4, MOV, WebM (max 2GB)
                    </p>
                    <input
                      type="file"
                      className="hidden"
                      accept="video/mp4,video/webm,video/quicktime"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">Format</Label>
                      <Select
                        value={formData.videoFormat || ''}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, videoFormat: v as VideoFormatType, videoSource: 'UPLOAD' }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MP4">MP4</SelectItem>
                          <SelectItem value="WEBM">WebM</SelectItem>
                          <SelectItem value="MOV">MOV</SelectItem>
                          <SelectItem value="AVI">AVI</SelectItem>
                          <SelectItem value="MKV">MKV</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Kalite</Label>
                      <Select
                        value={formData.videoQuality || ''}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, videoQuality: v as VideoQualityType }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SD_360P">360p (SD)</SelectItem>
                          <SelectItem value="SD_480P">480p (SD)</SelectItem>
                          <SelectItem value="HD_720P">720p (HD)</SelectItem>
                          <SelectItem value="HD_1080P">1080p (Full HD)</SelectItem>
                          <SelectItem value="QHD_1440P">1440p (2K)</SelectItem>
                          <SelectItem value="UHD_4K">4K (Ultra HD)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                {/* External URL Tab */}
                <TabsContent value="url" className="space-y-3">
                  <div>
                    <Label className="text-sm text-muted-foreground">Harici Video URL</Label>
                    <Input
                      value={formData.videoUrl}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        videoUrl: e.target.value,
                        videoSource: 'EXTERNAL'
                      }))}
                      placeholder="https://example.com/video.mp4"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">Format</Label>
                      <Select
                        value={formData.videoFormat || ''}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, videoFormat: v as VideoFormatType }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MP4">MP4</SelectItem>
                          <SelectItem value="WEBM">WebM</SelectItem>
                          <SelectItem value="MOV">MOV</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Kalite</Label>
                      <Select
                        value={formData.videoQuality || ''}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, videoQuality: v as VideoQualityType }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SD_480P">480p</SelectItem>
                          <SelectItem value="HD_720P">720p</SelectItem>
                          <SelectItem value="HD_1080P">1080p</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Thumbnail */}
            <div className="space-y-3">
              <Label>Kapak Görseli</Label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    value={formData.thumbnailUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                    placeholder="https://... veya YouTube'dan otomatik al"
                  />
                </div>
                {videoPreview?.thumbnail && !formData.thumbnailUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, thumbnailUrl: videoPreview.thumbnail! }))}
                  >
                    <IconPhoto className="h-4 w-4 mr-1" />
                    YouTube&apos;dan Al
                  </Button>
                )}
              </div>
              {formData.thumbnailUrl && (
                <div className="relative w-32 h-20">
                  <img
                    src={formData.thumbnailUrl}
                    alt="Kapak önizleme"
                    className="w-full h-full rounded object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, thumbnailUrl: '' }))}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <IconX className="h-3 w-3" />
                  </button>
                </div>
              )}
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
