'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  createSoundscape,
  updateSoundscape,
  getAdminSoundscapeById,
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

interface SoundscapeFormProps {
  soundscapeId?: string;
}

const CATEGORY_OPTIONS = [
  { value: 'NATURE', label: 'Doğa' },
  { value: 'RAIN', label: 'Yağmur' },
  { value: 'OCEAN', label: 'Okyanus' },
  { value: 'FOREST', label: 'Orman' },
  { value: 'FIRE', label: 'Ateş' },
  { value: 'WIND', label: 'Rüzgar' },
  { value: 'NIGHT', label: 'Gece' },
  { value: 'CITY', label: 'Şehir' },
  { value: 'MUSIC', label: 'Müzik' },
  { value: 'WHITE_NOISE', label: 'Beyaz Gürültü' },
  { value: 'AMBIENT', label: 'Ambient' },
];

const TAG_SUGGESTIONS = [
  'uyku',
  'rahatlama',
  'odaklanma',
  'çalışma',
  'meditasyon',
  'doğa',
  'yağmur',
  'okyanus',
  'orman',
  'gece',
  'sabah',
  'ambient',
];

export function SoundscapeForm({ soundscapeId }: SoundscapeFormProps) {
  const router = useRouter();
  const isEdit = !!soundscapeId;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const [formData, setFormData] = useState({
    title: '',
    titleTr: '',
    slug: '',
    description: '',
    descriptionTr: '',
    category: 'NATURE',
    durationSeconds: 300,
    // Media
    audioUrl: '',
    imageUrl: '',
    thumbnailUrl: '',
    previewUrl: '',
    // Features
    isLoop: true,
    isMixable: false,
    volume: 100,
    // Additional
    tags: [] as string[],
    // Settings
    isFree: false,
    isPremium: false,
    isFeatured: false,
    isActive: false,
    sortOrder: 0,
  });

  const [newTag, setNewTag] = useState('');

  const loadData = useCallback(async () => {
    try {
      if (soundscapeId) {
        const soundscape = await getAdminSoundscapeById(soundscapeId);
        if (soundscape) {
          setFormData({
            title: soundscape.title || '',
            titleTr: soundscape.titleTr || '',
            slug: soundscape.slug || '',
            description: soundscape.description || '',
            descriptionTr: soundscape.descriptionTr || '',
            category: soundscape.category || 'NATURE',
            durationSeconds: soundscape.durationSeconds || 300,
            audioUrl: soundscape.audioUrl || '',
            imageUrl: soundscape.imageUrl || '',
            thumbnailUrl: soundscape.thumbnailUrl || '',
            previewUrl: soundscape.previewUrl || '',
            isLoop: soundscape.isLoop ?? true,
            isMixable: soundscape.isMixable || false,
            volume: soundscape.volume || 100,
            tags: soundscape.tags || [],
            isFree: soundscape.isFree || false,
            isPremium: soundscape.isPremium || false,
            isFeatured: soundscape.isFeatured || false,
            isActive: soundscape.isActive || false,
            sortOrder: soundscape.sortOrder || 0,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Veri yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [soundscapeId]);

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
    if (!formData.title || !formData.slug) {
      toast.error('Başlık ve slug zorunludur');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        durationSeconds: Number(formData.durationSeconds),
        volume: Number(formData.volume),
        sortOrder: Number(formData.sortOrder),
      };

      if (isEdit) {
        await updateSoundscape(soundscapeId!, payload);
        toast.success('Soundscape güncellendi');
      } else {
        await createSoundscape(payload);
        toast.success('Soundscape oluşturuldu');
      }
      router.push('/dashboard/wellness/soundscapes');
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
            onClick={() => router.push('/dashboard/wellness/soundscapes')}
          >
            <IconArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">
              {isEdit ? 'Soundscape Düzenle' : 'Yeni Soundscape'}
            </h2>
            <p className="text-muted-foreground">
              Ses ortamı bilgilerini girin
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="gap-1">
            <IconInfoCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Genel</span>
          </TabsTrigger>
          <TabsTrigger value="media" className="gap-1">
            <IconMusic className="h-4 w-4" />
            <span className="hidden sm:inline">Medya</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-1">
            <IconPhoto className="h-4 w-4" />
            <span className="hidden sm:inline">Özellikler</span>
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
                    placeholder="Yağmur Sesi"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Başlık (EN)</Label>
                  <Input
                    value={formData.titleTr}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, titleTr: e.target.value }))
                    }
                    placeholder="Rain Sound"
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
                  placeholder="yagmur-sesi"
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
                    placeholder="Soundscape açıklaması"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Açıklama (EN)</Label>
                  <Textarea
                    value={formData.descriptionTr}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, descriptionTr: e.target.value }))
                    }
                    placeholder="Soundscape description"
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
                  <Label>Süre (saniye)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      value={formData.durationSeconds}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          durationSeconds: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-32"
                      min={1}
                    />
                    <span className="text-sm text-muted-foreground">
                      = {formatDuration(formData.durationSeconds)}
                    </span>
                  </div>
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
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-green-100 text-green-700 dark:bg-green-400/20 dark:text-green-400"
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
                <Label>Önizleme (Kısa Versiyon)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={formData.previewUrl}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, previewUrl: e.target.value }))
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
                        if (file) handleFileUpload(file, 'audio', 'previewUrl');
                      }}
                    />
                    <Button variant="outline" size="icon" disabled={uploading} asChild>
                      <span>
                        <IconUpload className="h-4 w-4" />
                      </span>
                    </Button>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Premium olmayan kullanıcılar için kısa önizleme
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Görseller</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kapak Görseli</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={formData.imageUrl}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))
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
                          if (file) handleFileUpload(file, 'image', 'imageUrl');
                        }}
                      />
                      <Button variant="outline" size="icon" disabled={uploading} asChild>
                        <span>
                          <IconUpload className="h-4 w-4" />
                        </span>
                      </Button>
                    </label>
                  </div>
                  {formData.imageUrl && (
                    <img
                      src={formData.imageUrl}
                      alt="Cover"
                      className="h-24 w-24 object-cover rounded mt-2"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Thumbnail</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={formData.thumbnailUrl}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          thumbnailUrl: e.target.value,
                        }))
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
                          if (file) handleFileUpload(file, 'image', 'thumbnailUrl');
                        }}
                      />
                      <Button variant="outline" size="icon" disabled={uploading} asChild>
                        <span>
                          <IconUpload className="h-4 w-4" />
                        </span>
                      </Button>
                    </label>
                  </div>
                  {formData.thumbnailUrl && (
                    <img
                      src={formData.thumbnailUrl}
                      alt="Thumbnail"
                      className="h-24 w-24 object-cover rounded mt-2"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Oynatma Özellikleri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Loop (Döngü)</div>
                  <div className="text-sm text-muted-foreground">
                    Ses sürekli tekrar etsin
                  </div>
                </div>
                <Switch
                  checked={formData.isLoop}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isLoop: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Mixable (Karıştırılabilir)</div>
                  <div className="text-sm text-muted-foreground">
                    Diğer seslerle karıştırılabilir
                  </div>
                </div>
                <Switch
                  checked={formData.isMixable}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isMixable: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Varsayılan Ses Seviyesi (%)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.volume}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        volume: parseInt(e.target.value) || 100,
                      }))
                    }
                    className="w-24"
                  />
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${formData.volume}%` }}
                    />
                  </div>
                </div>
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
                    Soundscape&apos;i kullanıcılara göster
                  </div>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isActive: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Ücretsiz İçerik</div>
                  <div className="text-sm text-muted-foreground">
                    Tüm kullanıcılar erişebilir
                  </div>
                </div>
                <Switch
                  checked={formData.isFree}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      isFree: checked,
                      isPremium: checked ? false : prev.isPremium,
                    }))
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
                    setFormData((prev) => ({
                      ...prev,
                      isPremium: checked,
                      isFree: checked ? false : prev.isFree,
                    }))
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

              <div className="space-y-2">
                <Label>Sıralama</Label>
                <Input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sortOrder: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  Düşük değer = Önce gösterilir
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
