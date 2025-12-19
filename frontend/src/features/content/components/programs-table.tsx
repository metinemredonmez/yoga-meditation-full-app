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
  getInstructors,
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
  IconEye,
  IconEyeOff,
  IconPhoto,
  IconClock,
  IconUser,
  IconUpload,
  IconX,
  IconBrandYoutube,
  IconBrandVimeo,
  IconPlayerRecord,
  IconLink,
  IconCheck,
  IconCurrencyLira,
  IconTag,
  IconArchive,
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';

type VideoSourceType = 'UPLOAD' | 'YOUTUBE' | 'DAILYMOTION' | 'VIMEO' | 'EXTERNAL' | null;
type ProgramStatusType = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
type AccessType = 'FREE' | 'PREMIUM' | 'PAID';

interface Instructor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Program {
  id: string;
  title: string;
  description: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  durationWeeks: number;
  thumbnailUrl?: string;
  coverUrl?: string;
  isPublished: boolean;
  status?: ProgramStatusType;
  accessType?: AccessType;
  price?: number;
  currency?: string;
  categories?: string[];
  promoVideoUrl?: string;
  promoVideoSource?: VideoSourceType;
  promoVideoId?: string;
  instructorId?: string;
  instructor?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  tags?: { id: string; name: string }[];
  _count?: {
    sessions: number;
    comments: number;
  };
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  'Hatha Yoga',
  'Vinyasa',
  'Ashtanga',
  'Yin Yoga',
  'Restoratif',
  'Kundalini',
  'Meditasyon',
  'Nefes',
  'Prenatal',
  'Çocuk Yogası',
];

export function ProgramsTable() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [activeTab, setActiveTab] = useState('general');
  const [videoSourceTab, setVideoSourceTab] = useState('youtube');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: 'BEGINNER' as Program['level'],
    durationWeeks: 4,
    thumbnailUrl: '',
    coverUrl: '',
    status: 'DRAFT' as ProgramStatusType,
    accessType: 'FREE' as AccessType,
    price: 0,
    currency: 'TRY',
    categories: [] as string[],
    instructorId: '',
    promoVideoUrl: '',
    promoVideoSource: null as VideoSourceType,
    promoVideoId: '',
    tags: [] as string[],
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [tagInput, setTagInput] = useState('');

  // Load instructors
  useEffect(() => {
    const loadInstructors = async () => {
      try {
        const data = await getInstructors({ limit: 100 });
        setInstructors(data.instructors || []);
      } catch (error) {
        console.error('Failed to load instructors:', error);
      }
    };
    loadInstructors();
  }, []);

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
      setPrograms(data.programs || []);
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

  // Video URL parser
  const extractVideoInfo = (url: string): { source: VideoSourceType; videoId: string } | null => {
    if (!url) return null;

    // YouTube (watch, embed, shorts, youtu.be)
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (youtubeMatch) return { source: 'YOUTUBE', videoId: youtubeMatch[1] };

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return { source: 'VIMEO', videoId: vimeoMatch[1] };

    // Dailymotion
    const dailymotionMatch = url.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/);
    if (dailymotionMatch) return { source: 'DAILYMOTION', videoId: dailymotionMatch[1] };

    return { source: 'EXTERNAL', videoId: '' };
  };

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

  const checkVideoUrl = (url: string) => {
    const info = extractVideoInfo(url);
    if (info) {
      setFormData(prev => ({
        ...prev,
        promoVideoUrl: url,
        promoVideoSource: info.source,
        promoVideoId: info.videoId,
      }));
      if (info.source && info.videoId) {
        setVideoPreview(getEmbedUrl(info.source, info.videoId));
      }
    }
  };

  const openEditDialog = (program?: Program) => {
    if (program) {
      setSelectedProgram(program);
      setFormData({
        title: program.title,
        description: program.description,
        level: program.level,
        durationWeeks: program.durationWeeks,
        thumbnailUrl: program.thumbnailUrl || '',
        coverUrl: program.coverUrl || '',
        status: program.status || (program.isPublished ? 'PUBLISHED' : 'DRAFT'),
        accessType: program.accessType || 'FREE',
        price: program.price || 0,
        currency: program.currency || 'TRY',
        categories: program.categories || [],
        instructorId: program.instructorId || '',
        promoVideoUrl: program.promoVideoUrl || '',
        promoVideoSource: program.promoVideoSource || null,
        promoVideoId: program.promoVideoId || '',
        tags: program.tags?.map(t => t.name) || [],
      });
      setThumbnailPreview(program.thumbnailUrl || '');
      setCoverPreview(program.coverUrl || '');
      if (program.promoVideoSource && program.promoVideoId) {
        setVideoPreview(getEmbedUrl(program.promoVideoSource, program.promoVideoId));
      }
    } else {
      setSelectedProgram(null);
      setFormData({
        title: '',
        description: '',
        level: 'BEGINNER',
        durationWeeks: 4,
        thumbnailUrl: '',
        coverUrl: '',
        status: 'DRAFT',
        accessType: 'FREE',
        price: 0,
        currency: 'TRY',
        categories: [],
        instructorId: '',
        promoVideoUrl: '',
        promoVideoSource: null,
        promoVideoId: '',
        tags: [],
      });
      setThumbnailPreview('');
      setCoverPreview('');
      setVideoPreview('');
    }
    setThumbnailFile(null);
    setCoverFile(null);
    setActiveTab('general');
    setEditDialog(true);
  };

  const handleFileSelect = async (
    file: File,
    type: 'thumbnail' | 'cover'
  ) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Sadece resim dosyaları yüklenebilir');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya boyutu 5MB\'dan küçük olmalı');
      return;
    }

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
    let coverUrl = formData.coverUrl;

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
        coverUrl = result.fileUrl;
      } catch (error) {
        toast.error('Kapak resmi yüklenemedi');
        setUploadingCover(false);
        return null;
      }
      setUploadingCover(false);
    }

    return { thumbnailUrl, coverUrl };
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
    }));
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description) {
      toast.error('Başlık ve açıklama zorunludur');
      return;
    }

    setSaving(true);
    try {
      const uploadedUrls = await uploadFiles();
      if (uploadedUrls === null) {
        setSaving(false);
        return;
      }

      const dataToSave = {
        ...formData,
        thumbnailUrl: uploadedUrls.thumbnailUrl,
        coverUrl: uploadedUrls.coverUrl,
        isPublished: formData.status === 'PUBLISHED',
        price: formData.accessType === 'PAID' ? formData.price : null,
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
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  const getStatusBadge = (program: Program) => {
    const status = program.status || (program.isPublished ? 'PUBLISHED' : 'DRAFT');
    switch (status) {
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200 dark:bg-green-400/20 dark:text-green-400 dark:border-green-400/30 transition-all duration-300">
            <IconEye className="h-3 w-3 mr-1" />
            Yayında
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-400/20 dark:text-slate-400 dark:border-slate-400/30 transition-all duration-300">
            <IconArchive className="h-3 w-3 mr-1" />
            Arşivlendi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-600 border border-indigo-200 dark:bg-indigo-400/20 dark:text-indigo-400 dark:border-indigo-400/30 transition-all duration-300">
            <IconEyeOff className="h-3 w-3 mr-1" />
            Taslak
          </span>
        );
    }
  };

  const getAccessBadge = (accessType?: AccessType) => {
    switch (accessType) {
      case 'PREMIUM':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-400/20 dark:text-violet-400 dark:border-violet-400/30 transition-all duration-300">
            Premium
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-700 border border-pink-200 dark:bg-pink-400/20 dark:text-pink-400 dark:border-pink-400/30 transition-all duration-300">
            Ücretli
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-400/20 dark:text-slate-400 dark:border-slate-400/30 transition-all duration-300">
            Ücretsiz
          </span>
        );
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
              <SelectItem value="archived">Arşivlendi</SelectItem>
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
                  <TableHead>Erişim</TableHead>
                  <TableHead>Süre</TableHead>
                  <TableHead>Eğitmen</TableHead>
                  <TableHead>Etiketler</TableHead>
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
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="h-10 w-16 rounded bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-400/20 dark:to-indigo-500/20 items-center justify-center border border-indigo-200 dark:border-indigo-400/30"
                          style={{ display: program.thumbnailUrl ? 'none' : 'flex' }}
                        >
                          <IconPhoto className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="font-medium">{program.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {program.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getLevelBadge(program.level)}</TableCell>
                    <TableCell>{getAccessBadge(program.accessType)}</TableCell>
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
                      {program.tags && program.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {program.tags.slice(0, 3).map((tag, index) => {
                            const colors = [
                              'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-400/20 dark:text-violet-400 dark:border-violet-400/30',
                              'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-400/20 dark:text-pink-400 dark:border-pink-400/30',
                              'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-400/20 dark:text-cyan-400 dark:border-cyan-400/30',
                              'bg-green-100 text-green-700 border-green-200 dark:bg-green-400/20 dark:text-green-400 dark:border-green-400/30',
                              'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-400/20 dark:text-indigo-400 dark:border-indigo-400/30',
                            ];
                            const colorClass = colors[index % colors.length];
                            return (
                              <span
                                key={tag.id}
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border cursor-default transition-all duration-300 ${colorClass}`}
                              >
                                {tag.name}
                              </span>
                            );
                          })}
                          {program.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                              +{program.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(program)}</TableCell>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedProgram ? 'Programı Düzenle' : 'Yeni Program'}
            </DialogTitle>
            <DialogDescription>
              Yoga programı bilgilerini girin
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">Genel</TabsTrigger>
              <TabsTrigger value="media">Medya</TabsTrigger>
              <TabsTrigger value="pricing">Fiyat/Erişim</TabsTrigger>
              <TabsTrigger value="settings">Ayarlar</TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-4 mt-4">
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
                  rows={4}
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

              {/* Instructor Selection */}
              <div>
                <Label>Eğitmen</Label>
                <Select
                  value={formData.instructorId || 'none'}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, instructorId: v === 'none' ? '' : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Eğitmen seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Eğitmen yok</SelectItem>
                    {instructors.filter(i => i.id).map((instructor) => (
                      <SelectItem key={instructor.id} value={instructor.id}>
                        {instructor.firstName} {instructor.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Categories */}
              <div>
                <Label>Kategoriler</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {CATEGORIES.map((category, index) => {
                    const isSelected = formData.categories.includes(category);
                    const colors = [
                      { selected: 'bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-400/30 dark:text-violet-300 dark:border-violet-400/50', unselected: 'border-violet-200 text-violet-600 hover:bg-violet-50 dark:border-violet-400/30 dark:text-violet-400 dark:hover:bg-violet-400/10' },
                      { selected: 'bg-pink-100 text-pink-700 border-pink-300 dark:bg-pink-400/30 dark:text-pink-300 dark:border-pink-400/50', unselected: 'border-pink-200 text-pink-600 hover:bg-pink-50 dark:border-pink-400/30 dark:text-pink-400 dark:hover:bg-pink-400/10' },
                      { selected: 'bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-400/30 dark:text-cyan-300 dark:border-cyan-400/50', unselected: 'border-cyan-200 text-cyan-600 hover:bg-cyan-50 dark:border-cyan-400/30 dark:text-cyan-400 dark:hover:bg-cyan-400/10' },
                      { selected: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-400/30 dark:text-green-300 dark:border-green-400/50', unselected: 'border-green-200 text-green-600 hover:bg-green-50 dark:border-green-400/30 dark:text-green-400 dark:hover:bg-green-400/10' },
                      { selected: 'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-400/30 dark:text-indigo-300 dark:border-indigo-400/50', unselected: 'border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-400/30 dark:text-indigo-400 dark:hover:bg-indigo-400/10' },
                      { selected: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-400/30 dark:text-amber-300 dark:border-amber-400/50', unselected: 'border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-400/30 dark:text-amber-400 dark:hover:bg-amber-400/10' },
                      { selected: 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-400/30 dark:text-rose-300 dark:border-rose-400/50', unselected: 'border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-400/30 dark:text-rose-400 dark:hover:bg-rose-400/10' },
                      { selected: 'bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-400/30 dark:text-teal-300 dark:border-teal-400/50', unselected: 'border-teal-200 text-teal-600 hover:bg-teal-50 dark:border-teal-400/30 dark:text-teal-400 dark:hover:bg-teal-400/10' },
                      { selected: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-400/30 dark:text-purple-300 dark:border-purple-400/50', unselected: 'border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-400/30 dark:text-purple-400 dark:hover:bg-purple-400/10' },
                      { selected: 'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-400/30 dark:text-sky-300 dark:border-sky-400/50', unselected: 'border-sky-200 text-sky-600 hover:bg-sky-50 dark:border-sky-400/30 dark:text-sky-400 dark:hover:bg-sky-400/10' },
                    ];
                    const colorSet = colors[index % colors.length];
                    return (
                      <span
                        key={category}
                        onClick={() => toggleCategory(category)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border cursor-pointer transition-all duration-200 ${
                          isSelected ? colorSet.selected : colorSet.unselected
                        }`}
                      >
                        {isSelected && <IconCheck className="h-3 w-3 mr-1" />}
                        {category}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label>Etiketler</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Etiket ekle"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    <IconTag className="h-4 w-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag, index) => {
                      const colors = [
                        'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-400/20 dark:text-violet-400 dark:border-violet-400/30',
                        'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-400/20 dark:text-pink-400 dark:border-pink-400/30',
                        'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-400/20 dark:text-cyan-400 dark:border-cyan-400/30',
                        'bg-green-100 text-green-700 border-green-200 dark:bg-green-400/20 dark:text-green-400 dark:border-green-400/30',
                        'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-400/20 dark:text-indigo-400 dark:border-indigo-400/30',
                      ];
                      const colorClass = colors[index % colors.length];
                      return (
                        <span
                          key={tag}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all duration-300 ${colorClass}`}
                        >
                          <IconTag className="h-3 w-3" />
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          >
                            <IconX className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="space-y-4 mt-4">
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
                          setFormData(prev => ({ ...prev, coverUrl: '' }));
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

              {/* Promo Video */}
              <div>
                <Label>Tanıtım Videosu</Label>
                <Tabs value={videoSourceTab} onValueChange={setVideoSourceTab} className="mt-2">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="youtube" className="gap-1">
                      <IconBrandYoutube className="h-4 w-4" />
                      YouTube
                    </TabsTrigger>
                    <TabsTrigger value="vimeo" className="gap-1">
                      <IconBrandVimeo className="h-4 w-4" />
                      Vimeo
                    </TabsTrigger>
                    <TabsTrigger value="dailymotion" className="gap-1">
                      <IconPlayerRecord className="h-4 w-4" />
                      Dailymotion
                    </TabsTrigger>
                    <TabsTrigger value="url" className="gap-1">
                      <IconLink className="h-4 w-4" />
                      URL
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="youtube" className="mt-3">
                    <Input
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={formData.promoVideoSource === 'YOUTUBE' ? formData.promoVideoUrl : ''}
                      onChange={(e) => checkVideoUrl(e.target.value)}
                    />
                  </TabsContent>

                  <TabsContent value="vimeo" className="mt-3">
                    <Input
                      placeholder="https://vimeo.com/..."
                      value={formData.promoVideoSource === 'VIMEO' ? formData.promoVideoUrl : ''}
                      onChange={(e) => checkVideoUrl(e.target.value)}
                    />
                  </TabsContent>

                  <TabsContent value="dailymotion" className="mt-3">
                    <Input
                      placeholder="https://www.dailymotion.com/video/..."
                      value={formData.promoVideoSource === 'DAILYMOTION' ? formData.promoVideoUrl : ''}
                      onChange={(e) => checkVideoUrl(e.target.value)}
                    />
                  </TabsContent>

                  <TabsContent value="url" className="mt-3">
                    <Input
                      placeholder="Video URL girin"
                      value={formData.promoVideoSource === 'EXTERNAL' ? formData.promoVideoUrl : ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        promoVideoUrl: e.target.value,
                        promoVideoSource: 'EXTERNAL',
                        promoVideoId: '',
                      }))}
                    />
                  </TabsContent>
                </Tabs>

                {/* Video Preview */}
                {videoPreview && (
                  <div className="mt-4 relative">
                    <iframe
                      src={videoPreview}
                      className="w-full aspect-video rounded-lg"
                      allowFullScreen
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setVideoPreview('');
                        setFormData(prev => ({
                          ...prev,
                          promoVideoUrl: '',
                          promoVideoSource: null,
                          promoVideoId: '',
                        }));
                      }}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                    >
                      <IconX className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="space-y-4 mt-4">
              <div>
                <Label>Erişim Tipi</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  {[
                    { value: 'FREE', label: 'Ücretsiz', desc: 'Herkes erişebilir' },
                    { value: 'PREMIUM', label: 'Premium', desc: 'Premium üyeler' },
                    { value: 'PAID', label: 'Ücretli', desc: 'Tek seferlik ödeme' },
                  ].map((option) => (
                    <div
                      key={option.value}
                      onClick={() => setFormData(prev => ({ ...prev, accessType: option.value as AccessType }))}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.accessType === option.value
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-muted-foreground/50'
                      }`}
                    >
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {formData.accessType === 'PAID' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Fiyat</Label>
                    <div className="relative">
                      <IconCurrencyLira className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        className="pl-9"
                        placeholder="0.00"
                        min={0}
                        step={0.01}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Para Birimi</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, currency: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRY">TRY (₺)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4 mt-4">
              <div>
                <Label>Program Durumu</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, status: v as ProgramStatusType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">
                      <div className="flex items-center gap-2">
                        <IconEyeOff className="h-4 w-4" />
                        Taslak
                      </div>
                    </SelectItem>
                    <SelectItem value="PUBLISHED">
                      <div className="flex items-center gap-2">
                        <IconEye className="h-4 w-4" />
                        Yayında
                      </div>
                    </SelectItem>
                    <SelectItem value="ARCHIVED">
                      <div className="flex items-center gap-2">
                        <IconArchive className="h-4 w-4" />
                        Arşivlendi
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  {formData.status === 'DRAFT' && 'Program henüz yayında değil, düzenleme yapabilirsiniz.'}
                  {formData.status === 'PUBLISHED' && 'Program yayında ve kullanıcılar erişebilir.'}
                  {formData.status === 'ARCHIVED' && 'Program arşivlendi, kullanıcılar erişemez.'}
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
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
