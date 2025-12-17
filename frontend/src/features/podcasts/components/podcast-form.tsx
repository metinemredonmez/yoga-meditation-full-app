'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  createPodcast,
  updatePodcast,
  getAdminPodcastById,
  getInstructors,
  uploadFileToS3
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IconLoader2, IconUpload, IconMicrophone, IconArrowLeft } from '@tabler/icons-react';
import { toast } from 'sonner';

const podcastSchema = z.object({
  title: z.string().min(1, 'Başlık gerekli'),
  description: z.string().min(10, 'Açıklama en az 10 karakter olmalı'),
  shortDescription: z.string().optional(),
  category: z.string().min(1, 'Kategori seçin'),
  hostId: z.string().optional(),
  hostName: z.string().optional(),
  hostBio: z.string().optional(),
  language: z.string().default('tr'),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  isExplicit: z.boolean().default(false),
  rssEnabled: z.boolean().default(true)
});

type PodcastFormData = z.infer<typeof podcastSchema>;

const CATEGORIES = [
  { value: 'WELLNESS', label: 'Wellness' },
  { value: 'MEDITATION', label: 'Meditasyon' },
  { value: 'YOGA_INSTRUCTION', label: 'Yoga Eğitimi' },
  { value: 'BREATHWORK', label: 'Nefes Çalışması' },
  { value: 'PHILOSOPHY', label: 'Felsefe' },
  { value: 'INTERVIEWS', label: 'Röportajlar' },
  { value: 'MUSIC', label: 'Müzik' },
  { value: 'STORIES', label: 'Hikayeler' },
  { value: 'GUIDED_PRACTICE', label: 'Rehberli Pratik' },
  { value: 'MINDFULNESS', label: 'Farkındalık' }
];

const LANGUAGES = [
  { value: 'tr', label: 'Türkçe' },
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' }
];

interface Instructor {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}

interface PodcastFormProps {
  podcastId?: string;
}

export function PodcastForm({ podcastId }: PodcastFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [instructors, setInstructors] = useState<Instructor[]>([]);

  const isEditing = !!podcastId;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<PodcastFormData>({
    resolver: zodResolver(podcastSchema),
    defaultValues: {
      language: 'tr',
      isExplicit: false,
      rssEnabled: true
    }
  });

  const selectedHostId = watch('hostId');
  const isExplicit = watch('isExplicit');
  const rssEnabled = watch('rssEnabled');

  useEffect(() => {
    loadInstructors();
    if (podcastId) {
      loadPodcast();
    }
  }, [podcastId]);

  const loadInstructors = async () => {
    try {
      const response = await getInstructors({ limit: 100 });
      setInstructors(response.instructors || []);
    } catch (error) {
      console.error('Failed to load instructors:', error);
    }
  };

  const loadPodcast = async () => {
    if (!podcastId) return;
    setLoading(true);
    try {
      const response = await getAdminPodcastById(podcastId);
      const podcast = response.podcast;
      if (podcast) {
        setValue('title', podcast.title);
        setValue('description', podcast.description);
        setValue('shortDescription', podcast.shortDescription || '');
        setValue('category', podcast.category);
        setValue('hostId', podcast.hostId || '');
        setValue('hostName', podcast.hostName || '');
        setValue('hostBio', podcast.hostBio || '');
        setValue('language', podcast.language || 'tr');
        setValue('websiteUrl', podcast.websiteUrl || '');
        setValue('isExplicit', podcast.isExplicit);
        setValue('rssEnabled', podcast.rssEnabled);
        setCoverImage(podcast.coverImage);
      }
    } catch (error) {
      console.error('Failed to load podcast:', error);
      toast.error('Podcast yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Sadece resim dosyaları yüklenebilir');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya boyutu 5MB\'dan küçük olmalı');
      return;
    }

    setUploadingCover(true);
    try {
      const { uploadUrl, fileUrl } = await import('@/lib/api').then(m =>
        m.default.post('/api/media/upload-url', {
          filename: file.name,
          contentType: file.type,
          type: 'image'
        }).then(res => res.data)
      );

      await uploadFileToS3(uploadUrl, file);
      setCoverImage(fileUrl);
      toast.success('Kapak resmi yüklendi');
    } catch (error) {
      console.error('Failed to upload cover:', error);
      toast.error('Kapak resmi yüklenemedi');
    } finally {
      setUploadingCover(false);
    }
  };

  const onSubmit = async (data: PodcastFormData) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        coverImage: coverImage || undefined,
        websiteUrl: data.websiteUrl || undefined,
        shortDescription: data.shortDescription || undefined,
        hostId: data.hostId || undefined,
        hostName: data.hostName || undefined,
        hostBio: data.hostBio || undefined
      };

      if (isEditing && podcastId) {
        await updatePodcast(podcastId, payload);
        toast.success('Podcast güncellendi');
      } else {
        const response = await createPodcast(payload);
        toast.success('Podcast oluşturuldu');
        router.push(`/dashboard/podcasts/${response.podcast.id}`);
        return;
      }
      router.push('/dashboard/podcasts');
    } catch (error) {
      console.error('Failed to save podcast:', error);
      toast.error(isEditing ? 'Podcast güncellenemedi' : 'Podcast oluşturulamadı');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <IconArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">
            {isEditing ? 'Podcast Düzenle' : 'Yeni Podcast'}
          </h2>
          <p className="text-muted-foreground">
            {isEditing ? 'Podcast bilgilerini güncelleyin' : 'Yeni bir podcast oluşturun'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Temel Bilgiler</CardTitle>
              <CardDescription>
                Podcast'in başlık, açıklama ve kategori bilgileri
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Başlık *</Label>
                <Input
                  id="title"
                  placeholder="Podcast başlığı"
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">Kısa Açıklama</Label>
                <Input
                  id="shortDescription"
                  placeholder="Kısa bir açıklama (isteğe bağlı)"
                  {...register('shortDescription')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Açıklama *</Label>
                <Textarea
                  id="description"
                  placeholder="Podcast'in detaylı açıklaması"
                  rows={5}
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori *</Label>
                  <Select
                    value={watch('category')}
                    onValueChange={(value) => setValue('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-destructive">{errors.category.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Dil</Label>
                  <Select
                    value={watch('language')}
                    onValueChange={(value) => setValue('language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Dil seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sunucu Bilgileri</CardTitle>
              <CardDescription>
                Podcast sunucusu seçin veya manuel olarak girin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hostId">Eğitmen</Label>
                <Select
                  value={selectedHostId}
                  onValueChange={(value) => setValue('hostId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Eğitmen seçin (isteğe bağlı)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Seçilmedi</SelectItem>
                    {instructors.map((instructor) => (
                      <SelectItem key={instructor.id} value={instructor.id}>
                        {instructor.firstName} {instructor.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Sistemde kayıtlı bir eğitmen seçebilirsiniz
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hostName">Sunucu Adı</Label>
                <Input
                  id="hostName"
                  placeholder="Manuel sunucu adı (isteğe bağlı)"
                  {...register('hostName')}
                />
                <p className="text-xs text-muted-foreground">
                  Eğitmen seçilmezse bu ad kullanılır
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hostBio">Sunucu Biyografisi</Label>
                <Textarea
                  id="hostBio"
                  placeholder="Sunucu hakkında kısa bilgi"
                  rows={3}
                  {...register('hostBio')}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Cover & Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kapak Resmi</CardTitle>
              <CardDescription>
                3000x3000 piksel önerilir
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-40 w-40 rounded-lg">
                  <AvatarImage src={coverImage || undefined} />
                  <AvatarFallback className="rounded-lg bg-primary/10">
                    <IconMicrophone className="h-16 w-16 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <Label
                  htmlFor="cover-upload"
                  className="cursor-pointer flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted transition-colors"
                >
                  {uploadingCover ? (
                    <IconLoader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <IconUpload className="h-4 w-4" />
                  )}
                  Resim Yükle
                </Label>
                <input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverUpload}
                  disabled={uploadingCover}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ayarlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>RSS Feed</Label>
                  <p className="text-xs text-muted-foreground">
                    Podcast uygulamalarında yayınla
                  </p>
                </div>
                <Switch
                  checked={rssEnabled}
                  onCheckedChange={(checked) => setValue('rssEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Explicit İçerik</Label>
                  <p className="text-xs text-muted-foreground">
                    18+ içerik uyarısı
                  </p>
                </div>
                <Switch
                  checked={isExplicit}
                  onCheckedChange={(checked) => setValue('isExplicit', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Website URL</Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  placeholder="https://..."
                  {...register('websiteUrl')}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              İptal
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving && <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Güncelle' : 'Oluştur'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
