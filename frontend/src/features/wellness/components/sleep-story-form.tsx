'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  createSleepStory,
  updateSleepStory,
  getAdminSleepStoryById,
  getAdminSoundscapes,
  uploadMediaToS3,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IconLoader2,
  IconUpload,
  IconArrowLeft,
  IconDeviceFloppy,
  IconMusic,
  IconPhoto,
  IconSettings,
  IconInfoCircle,
  IconX,
  IconPlus,
} from '@tabler/icons-react';
import { toast } from 'sonner';

interface SleepStoryFormProps {
  storyId?: string;
}

interface Soundscape {
  id: string;
  title: string;
  isLoop: boolean;
}

const CATEGORY_OPTIONS = [
  { value: 'NATURE', label: 'Doğa' },
  { value: 'FANTASY', label: 'Fantastik' },
  { value: 'TRAVEL', label: 'Seyahat' },
  { value: 'HISTORY', label: 'Tarih' },
  { value: 'SCIENCE', label: 'Bilim' },
  { value: 'MEDITATION', label: 'Meditasyon' },
  { value: 'AMBIENT', label: 'Ambient' },
  { value: 'CITY', label: 'Şehir' },
  { value: 'TURKISH', label: 'Türk Hikayeleri' },
];

const TAG_SUGGESTIONS = [
  'uyku',
  'rahatlama',
  'doğa',
  'fantastik',
  'seyahat',
  'tarih',
  'bilim',
  'meditasyon',
  'gece',
  'çocuk',
  'yetişkin',
];

export function SleepStoryForm({ storyId }: SleepStoryFormProps) {
  const router = useRouter();
  const isEdit = !!storyId;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [soundscapes, setSoundscapes] = useState<Soundscape[]>([]);
  const [activeTab, setActiveTab] = useState('general');

  const [formData, setFormData] = useState({
    title: '',
    titleEn: '',
    slug: '',
    description: '',
    descriptionEn: '',
    category: 'NATURE',
    narratorName: '',
    duration: 600,
    audioUrl: '',
    coverImageUrl: '',
    backgroundSoundId: '',
    tags: [] as string[],
    isPremium: false,
    isFeatured: false,
    isPublished: false,
  });

  const [newTag, setNewTag] = useState('');

  const loadData = useCallback(async () => {
    try {
      // Load soundscapes for background sound selection
      const soundscapeData = await getAdminSoundscapes({ isLoop: true, limit: 100 });
      setSoundscapes(soundscapeData.soundscapes || []);

      if (storyId) {
        const story = await getAdminSleepStoryById(storyId);
        if (story) {
          setFormData({
            title: story.title || '',
            titleEn: story.titleEn || '',
            slug: story.slug || '',
            description: story.description || '',
            descriptionEn: story.descriptionEn || '',
            category: story.category || 'NATURE',
            narratorName: story.narratorName || '',
            duration: story.duration || 600,
            audioUrl: story.audioUrl || '',
            coverImageUrl: story.coverImageUrl || '',
            backgroundSoundId: story.backgroundSoundId || '',
            tags: story.tags || [],
            isPremium: story.isPremium || false,
            isFeatured: story.isFeatured || false,
            isPublished: story.isPublished || false,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Veri yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[ğ]/g, 'g')
      .replace(/[ü]/g, 'u')
      .replace(/[ş]/g, 's')
      .replace(/[ı]/g, 'i')
      .replace(/[ö]/g, 'o')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      title: value,
      slug: prev.slug || generateSlug(value),
    }));
  };

  const handleFileUpload = async (
    file: File,
    type: 'audio' | 'image',
    field: keyof typeof formData
  ) => {
    setUploading(true);
    try {
      const mediaType = type === 'audio' ? 'podcast' : 'image';
      const result = await uploadMediaToS3(file, mediaType);
      setFormData((prev) => ({ ...prev, [field]: result.fileUrl }));
      toast.success('Dosya yüklendi');
    } catch (error) {
      toast.error('Dosya yüklenemedi');
    } finally {
      setUploading(false);
    }
  };

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, newTag] }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleSave = async () => {
    if (!formData.title || !formData.slug || !formData.audioUrl) {
      toast.error('Başlık, slug ve ses dosyası zorunludur');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        duration: Number(formData.duration),
      };

      if (isEdit) {
        await updateSleepStory(storyId!, payload);
        toast.success('Uyku hikayesi güncellendi');
      } else {
        await createSleepStory(payload);
        toast.success('Uyku hikayesi oluşturuldu');
      }
      router.push('/dashboard/wellness/sleep-stories');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'İşlem başarısız');
    } finally {
      setSaving(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/wellness/sleep-stories')}
          >
            <IconArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">
              {isEdit ? 'Uyku Hikayesi Düzenle' : 'Yeni Uyku Hikayesi'}
            </h2>
            <p className="text-muted-foreground">
              Uyku hikayesi bilgilerini girin
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            İptal
          </Button>
          <Button onClick={handleSave} disabled={saving || uploading}>
            {saving ? (
              <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <IconDeviceFloppy className="h-4 w-4 mr-2" />
            )}
            {isEdit ? 'Güncelle' : 'Kaydet'}
          </Button>
        </div>
      </div>

      {/* Form Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general" className="gap-1">
            <IconInfoCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Genel</span>
          </TabsTrigger>
          <TabsTrigger value="media" className="gap-1">
            <IconMusic className="h-4 w-4" />
            <span className="hidden sm:inline">Medya</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1">
            <IconSettings className="h-4 w-4" />
            <span className="hidden sm:inline">Ayarlar</span>
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Temel Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Başlık (TR) *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Uyku hikayesi başlığı"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Başlık (EN)</Label>
                  <Input
                    value={formData.titleEn}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, titleEn: e.target.value }))
                    }
                    placeholder="Sleep story title"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>URL Slug *</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder="uyku-hikayesi-basligi"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Açıklama (TR)</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Hikaye açıklaması"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Açıklama (EN)</Label>
                  <Textarea
                    value={formData.descriptionEn}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, descriptionEn: e.target.value }))
                    }
                    placeholder="Story description"
                    rows={4}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kategori *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) =>
                      setFormData((prev) => ({ ...prev, category: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Anlatıcı Adı</Label>
                  <Input
                    value={formData.narratorName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, narratorName: e.target.value }))
                    }
                    placeholder="Anlatıcı adı"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Etiketler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-700 dark:bg-indigo-400/20 dark:text-indigo-400"
                  >
                    {tag}
                    <button onClick={() => removeTag(tag)}>
                      <IconX className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Yeni etiket"
                  onKeyDown={(e) => e.key === 'Enter' && addTag()}
                />
                <Button variant="outline" size="icon" onClick={addTag}>
                  <IconPlus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground mr-2">Öneriler:</span>
                {TAG_SUGGESTIONS.filter((t) => !formData.tags.includes(t)).map((tag) => (
                  <button
                    key={tag}
                    className="text-xs px-2 py-1 rounded-full border hover:bg-muted"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }))
                    }
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Ses Dosyası</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Ana Ses Dosyası *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={formData.audioUrl}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, audioUrl: e.target.value }))
                    }
                    placeholder="https://..."
                  />
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'audio', 'audioUrl');
                      }}
                    />
                    <Button variant="outline" size="icon" disabled={uploading} asChild>
                      <span>
                        {uploading ? (
                          <IconLoader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <IconUpload className="h-4 w-4" />
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Süre (saniye) *</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        duration: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-32"
                    min={1}
                  />
                  <span className="text-sm text-muted-foreground">
                    = {formatDuration(formData.duration)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Arka Plan Sesi</Label>
                <Select
                  value={formData.backgroundSoundId || 'none'}
                  onValueChange={(v) =>
                    setFormData((prev) => ({
                      ...prev,
                      backgroundSoundId: v === 'none' ? '' : v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Arka plan sesi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Arka plan yok</SelectItem>
                    {soundscapes.map((sound) => (
                      <SelectItem key={sound.id} value={sound.id}>
                        {sound.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Hikaye dinlenirken arka planda çalacak ses
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kapak Görseli</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Kapak Görseli</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={formData.coverImageUrl}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, coverImageUrl: e.target.value }))
                    }
                    placeholder="https://..."
                  />
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'image', 'coverImageUrl');
                      }}
                    />
                    <Button variant="outline" size="icon" disabled={uploading} asChild>
                      <span>
                        <IconUpload className="h-4 w-4" />
                      </span>
                    </Button>
                  </label>
                </div>
                {formData.coverImageUrl && (
                  <img
                    src={formData.coverImageUrl}
                    alt="Cover"
                    className="h-32 w-32 object-cover rounded mt-2"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Yayın Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Yayınla</div>
                  <div className="text-sm text-muted-foreground">
                    Hikayeyi kullanıcılara göster
                  </div>
                </div>
                <Switch
                  checked={formData.isPublished}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isPublished: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Premium İçerik</div>
                  <div className="text-sm text-muted-foreground">
                    Sadece premium üyeler erişebilir
                  </div>
                </div>
                <Switch
                  checked={formData.isPremium}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isPremium: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Öne Çıkar</div>
                  <div className="text-sm text-muted-foreground">
                    Ana sayfada öne çıkan olarak göster
                  </div>
                </div>
                <Switch
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isFeatured: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
