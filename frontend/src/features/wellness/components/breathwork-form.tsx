'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  createBreathwork,
  updateBreathwork,
  getAdminBreathworkById,
  getInstructors,
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
  IconWind,
  IconSettings,
  IconInfoCircle,
  IconX,
  IconPlus,
} from '@tabler/icons-react';
import { toast } from 'sonner';

interface BreathworkFormProps {
  breathworkId?: string;
}

interface Instructor {
  id: string;
  displayName: string;
  user?: {
    firstName: string;
    lastName: string;
  };
}

const CATEGORY_OPTIONS = [
  { value: 'CALM', label: 'Sakinleştirici', color: 'bg-blue-100 text-blue-700' },
  { value: 'ENERGY', label: 'Enerji Verici', color: 'bg-amber-100 text-amber-700' },
  { value: 'FOCUS', label: 'Odaklanma', color: 'bg-purple-100 text-purple-700' },
  { value: 'SLEEP', label: 'Uyku', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'STRESS_RELIEF', label: 'Stres Giderme', color: 'bg-green-100 text-green-700' },
  { value: 'ANXIETY', label: 'Kaygı Azaltma', color: 'bg-rose-100 text-rose-700' },
  { value: 'MORNING', label: 'Sabah', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'EVENING', label: 'Akşam', color: 'bg-slate-100 text-slate-700' },
];

const PATTERN_OPTIONS = [
  { value: 'BOX_BREATHING', label: 'Kutu Nefes (4-4-4-4)', description: 'Nefes al, tut, ver, tut' },
  { value: 'FOUR_SEVEN_EIGHT', label: '4-7-8 Tekniği', description: 'Uyku ve rahatlama için' },
  { value: 'TRIANGLE', label: 'Üçgen Nefes', description: 'Nefes al, tut, ver' },
  { value: 'RELAXING', label: 'Rahatlatıcı', description: 'Yavaş ve derin' },
  { value: 'ENERGIZING', label: 'Enerjik', description: 'Hızlı ve canlandırıcı' },
  { value: 'CUSTOM', label: 'Özel', description: 'Kendi paternini oluştur' },
];

const DIFFICULTY_OPTIONS = [
  { value: 'BEGINNER', label: 'Başlangıç', color: 'text-green-600' },
  { value: 'INTERMEDIATE', label: 'Orta', color: 'text-amber-600' },
  { value: 'ADVANCED', label: 'İleri', color: 'text-rose-600' },
];

const TAG_SUGGESTIONS = [
  'nefes',
  'rahatlama',
  'uyku',
  'enerji',
  'odaklanma',
  'stres',
  'sabah',
  'akşam',
  'kaygı',
  'meditasyon',
];

export function BreathworkForm({ breathworkId }: BreathworkFormProps) {
  const router = useRouter();
  const isEdit = !!breathworkId;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [activeTab, setActiveTab] = useState('general');

  const [formData, setFormData] = useState({
    title: '',
    titleTr: '',
    slug: '',
    description: '',
    descriptionTr: '',
    category: 'CALM',
    pattern: 'BOX_BREATHING',
    instructorId: '',
    difficulty: 'BEGINNER',
    // Pattern configuration
    inhaleSeconds: 4,
    hold1Seconds: 4,
    exhaleSeconds: 4,
    hold2Seconds: 4,
    cycles: 10,
    // Media
    audioUrl: '',
    audioUrlTr: '',
    imageUrl: '',
    thumbnailUrl: '',
    backgroundMusicUrl: '',
    // Additional
    tags: [] as string[],
    benefits: [] as string[],
    benefitsTr: [] as string[],
    instructions: '',
    instructionsTr: '',
    // Settings
    isFree: false,
    isPremium: false,
    isFeatured: false,
    isActive: false,
    sortOrder: 0,
  });

  const [newTag, setNewTag] = useState('');
  const [newBenefit, setNewBenefit] = useState('');

  // Calculate total duration
  const totalDuration = (formData.inhaleSeconds + formData.hold1Seconds + formData.exhaleSeconds + formData.hold2Seconds) * formData.cycles;

  const loadData = useCallback(async () => {
    try {
      const instData = await getInstructors({ limit: 100 });
      setInstructors(instData.instructors || []);

      if (breathworkId) {
        const breathwork = await getAdminBreathworkById(breathworkId);
        if (breathwork) {
          setFormData({
            title: breathwork.title || '',
            titleTr: breathwork.titleTr || '',
            slug: breathwork.slug || '',
            description: breathwork.description || '',
            descriptionTr: breathwork.descriptionTr || '',
            category: breathwork.category || 'CALM',
            pattern: breathwork.pattern || 'BOX_BREATHING',
            instructorId: breathwork.instructorId || '',
            difficulty: breathwork.difficulty || 'BEGINNER',
            inhaleSeconds: breathwork.inhaleSeconds || 4,
            hold1Seconds: breathwork.hold1Seconds || 4,
            exhaleSeconds: breathwork.exhaleSeconds || 4,
            hold2Seconds: breathwork.hold2Seconds || 4,
            cycles: breathwork.cycles || 10,
            audioUrl: breathwork.audioUrl || '',
            audioUrlTr: breathwork.audioUrlTr || '',
            imageUrl: breathwork.imageUrl || '',
            thumbnailUrl: breathwork.thumbnailUrl || '',
            backgroundMusicUrl: breathwork.backgroundMusicUrl || '',
            tags: breathwork.tags || [],
            benefits: breathwork.benefits || [],
            benefitsTr: breathwork.benefitsTr || [],
            instructions: breathwork.instructions || '',
            instructionsTr: breathwork.instructionsTr || '',
            isFree: breathwork.isFree || false,
            isPremium: breathwork.isPremium || false,
            isFeatured: breathwork.isFeatured || false,
            isActive: breathwork.isActive || false,
            sortOrder: breathwork.sortOrder || 0,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Veri yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [breathworkId]);

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

  const applyPatternPreset = (pattern: string) => {
    const presets: Record<string, { inhale: number; hold1: number; exhale: number; hold2: number }> = {
      BOX_BREATHING: { inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
      FOUR_SEVEN_EIGHT: { inhale: 4, hold1: 7, exhale: 8, hold2: 0 },
      TRIANGLE: { inhale: 4, hold1: 4, exhale: 4, hold2: 0 },
      RELAXING: { inhale: 4, hold1: 2, exhale: 6, hold2: 2 },
      ENERGIZING: { inhale: 2, hold1: 0, exhale: 2, hold2: 0 },
      CUSTOM: { inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
    };
    const preset = presets[pattern] || presets.BOX_BREATHING;
    setFormData((prev) => ({
      ...prev,
      pattern,
      inhaleSeconds: preset.inhale,
      hold1Seconds: preset.hold1,
      exhaleSeconds: preset.exhale,
      hold2Seconds: preset.hold2,
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

  const addBenefit = () => {
    if (newBenefit) {
      setFormData((prev) => ({
        ...prev,
        benefits: [...prev.benefits, newBenefit],
      }));
      setNewBenefit('');
    }
  };

  const removeBenefit = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
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
        inhaleSeconds: Number(formData.inhaleSeconds),
        hold1Seconds: Number(formData.hold1Seconds),
        exhaleSeconds: Number(formData.exhaleSeconds),
        hold2Seconds: Number(formData.hold2Seconds),
        cycles: Number(formData.cycles),
        durationSeconds: totalDuration,
        sortOrder: Number(formData.sortOrder),
      };

      if (isEdit) {
        await updateBreathwork(breathworkId!, payload);
        toast.success('Nefes egzersizi güncellendi');
      } else {
        await createBreathwork(payload);
        toast.success('Nefes egzersizi oluşturuldu');
      }
      router.push('/dashboard/wellness/breathwork');
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
            onClick={() => router.push('/dashboard/wellness/breathwork')}
          >
            <IconArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">
              {isEdit ? 'Nefes Egzersizi Düzenle' : 'Yeni Nefes Egzersizi'}
            </h2>
            <p className="text-muted-foreground">
              Nefes egzersizi bilgilerini girin
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
          <TabsTrigger value="pattern" className="gap-1">
            <IconWind className="h-4 w-4" />
            <span className="hidden sm:inline">Pattern</span>
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
                    placeholder="Kutu Nefes Egzersizi"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Başlık (EN)</Label>
                  <Input
                    value={formData.titleTr}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, titleTr: e.target.value }))
                    }
                    placeholder="Box Breathing Exercise"
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
                  placeholder="kutu-nefes-egzersizi"
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
                    placeholder="Egzersiz açıklaması"
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
                    placeholder="Exercise description"
                    rows={4}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
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
                  <Label>Eğitmen</Label>
                  <Select
                    value={formData.instructorId || 'none'}
                    onValueChange={(v) =>
                      setFormData((prev) => ({
                        ...prev,
                        instructorId: v === 'none' ? '' : v,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Eğitmen seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Eğitmen yok</SelectItem>
                      {instructors.map((inst) => (
                        <SelectItem key={inst.id} value={inst.id}>
                          {inst.displayName ||
                            `${inst.user?.firstName} ${inst.user?.lastName}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Zorluk Seviyesi *</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(v) =>
                      setFormData((prev) => ({ ...prev, difficulty: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seviye seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className={opt.color}>{opt.label}</span>
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
              <CardTitle>Etiketler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-cyan-100 text-cyan-700 dark:bg-cyan-400/20 dark:text-cyan-400"
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

        {/* Pattern Tab */}
        <TabsContent value="pattern" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Nefes Patern Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Patern Tipi *</Label>
                <Select
                  value={formData.pattern}
                  onValueChange={(v) => applyPatternPreset(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Patern seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {PATTERN_OPTIONS.map((pat) => (
                      <SelectItem key={pat.value} value={pat.value}>
                        <div>
                          <span className="font-medium">{pat.label}</span>
                          <span className="text-muted-foreground ml-2 text-sm">
                            - {pat.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pattern Visualization */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="text-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                    <div className="text-xs text-muted-foreground">Nefes Al</div>
                    <div className="text-2xl font-bold text-blue-600">{formData.inhaleSeconds}s</div>
                  </div>
                  <span className="text-muted-foreground">→</span>
                  <div className="text-center px-4 py-2 bg-amber-100 dark:bg-amber-900/30 rounded">
                    <div className="text-xs text-muted-foreground">Tut</div>
                    <div className="text-2xl font-bold text-amber-600">{formData.hold1Seconds}s</div>
                  </div>
                  <span className="text-muted-foreground">→</span>
                  <div className="text-center px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded">
                    <div className="text-xs text-muted-foreground">Nefes Ver</div>
                    <div className="text-2xl font-bold text-green-600">{formData.exhaleSeconds}s</div>
                  </div>
                  <span className="text-muted-foreground">→</span>
                  <div className="text-center px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded">
                    <div className="text-xs text-muted-foreground">Tut</div>
                    <div className="text-2xl font-bold text-purple-600">{formData.hold2Seconds}s</div>
                  </div>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  Patern: {formData.inhaleSeconds}-{formData.hold1Seconds}-{formData.exhaleSeconds}-{formData.hold2Seconds} × {formData.cycles} döngü
                </div>
              </div>

              <div className="grid grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>Nefes Al (sn)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={formData.inhaleSeconds}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        inhaleSeconds: parseInt(e.target.value) || 4,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tut 1 (sn)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    value={formData.hold1Seconds}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        hold1Seconds: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nefes Ver (sn)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={formData.exhaleSeconds}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        exhaleSeconds: parseInt(e.target.value) || 4,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tut 2 (sn)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    value={formData.hold2Seconds}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        hold2Seconds: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Döngü Sayısı</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={formData.cycles}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        cycles: parseInt(e.target.value) || 10,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="p-4 bg-primary/10 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-medium">Toplam Süre</div>
                  <div className="text-sm text-muted-foreground">
                    ({formData.inhaleSeconds} + {formData.hold1Seconds} + {formData.exhaleSeconds} + {formData.hold2Seconds}) × {formData.cycles} döngü
                  </div>
                </div>
                <div className="text-3xl font-bold">{formatDuration(totalDuration)}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Talimatlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Talimatlar (TR)</Label>
                  <Textarea
                    value={formData.instructions}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, instructions: e.target.value }))
                    }
                    placeholder="Egzersiz nasıl yapılmalı..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Talimatlar (EN)</Label>
                  <Textarea
                    value={formData.instructionsTr}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, instructionsTr: e.target.value }))
                    }
                    placeholder="How to do this exercise..."
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Faydalar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {formData.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="flex-1 p-2 bg-muted rounded">{benefit}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeBenefit(index)}
                    >
                      <IconX className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  placeholder="Örn: Stresi azaltır"
                  onKeyDown={(e) => e.key === 'Enter' && addBenefit()}
                />
                <Button variant="outline" size="icon" onClick={addBenefit}>
                  <IconPlus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Ses Dosyaları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Rehberli Ses (TR)</Label>
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
                <Label>Rehberli Ses (EN)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={formData.audioUrlTr}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, audioUrlTr: e.target.value }))
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
                        if (file) handleFileUpload(file, 'audio', 'audioUrlTr');
                      }}
                    />
                    <Button variant="outline" size="icon" disabled={uploading} asChild>
                      <span>
                        <IconUpload className="h-4 w-4" />
                      </span>
                    </Button>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Arka Plan Müziği (Opsiyonel)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={formData.backgroundMusicUrl}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        backgroundMusicUrl: e.target.value,
                      }))
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
                        if (file) handleFileUpload(file, 'audio', 'backgroundMusicUrl');
                      }}
                    />
                    <Button variant="outline" size="icon" disabled={uploading} asChild>
                      <span>
                        <IconUpload className="h-4 w-4" />
                      </span>
                    </Button>
                  </label>
                </div>
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
                    Egzersizi kullanıcılara göster
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
