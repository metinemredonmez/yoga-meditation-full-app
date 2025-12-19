'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAdminJournalPromptById,
  createJournalPrompt,
  updateJournalPrompt,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IconLoader2, IconArrowLeft } from '@tabler/icons-react';
import { toast } from 'sonner';

interface JournalPromptFormProps {
  promptId?: string;
}

const TYPE_OPTIONS = [
  { value: 'FREE_WRITE', label: 'Serbest Yazı' },
  { value: 'GRATITUDE', label: 'Şükran' },
  { value: 'REFLECTION', label: 'Yansıma' },
  { value: 'DREAM', label: 'Rüya' },
  { value: 'MOOD', label: 'Duygu' },
  { value: 'PRACTICE_NOTES', label: 'Pratik Notları' },
  { value: 'INTENTION', label: 'Niyet' },
  { value: 'AFFIRMATION', label: 'Olumlama' },
  { value: 'MORNING_PAGES', label: 'Sabah Sayfaları' },
  { value: 'EVENING_REVIEW', label: 'Akşam Değerlendirmesi' },
];

const CATEGORY_OPTIONS = [
  { value: 'daily', label: 'Günlük' },
  { value: 'weekly', label: 'Haftalık' },
  { value: 'morning', label: 'Sabah' },
  { value: 'deep', label: 'Derin' },
  { value: 'gratitude', label: 'Şükran' },
];

export function JournalPromptForm({ promptId }: JournalPromptFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEditing = !!promptId;

  const [formData, setFormData] = useState({
    prompt: '',
    promptEn: '',
    type: 'FREE_WRITE',
    category: '',
    sortOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    if (promptId) {
      loadPrompt();
    }
  }, [promptId]);

  const loadPrompt = async () => {
    setLoading(true);
    try {
      const data = await getAdminJournalPromptById(promptId!);
      const prompt = data.prompt || data;
      setFormData({
        prompt: prompt.prompt || '',
        promptEn: prompt.promptEn || '',
        type: prompt.type || 'FREE_WRITE',
        category: prompt.category || '',
        sortOrder: prompt.sortOrder || 0,
        isActive: prompt.isActive ?? true,
      });
    } catch (error) {
      console.error('Failed to load journal prompt:', error);
      toast.error('Günlük sorusu yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.prompt.trim()) {
      toast.error('Prompt alanı zorunludur');
      return;
    }

    if (!formData.type) {
      toast.error('Tip seçimi zorunludur');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        category: formData.category || undefined,
      };

      if (isEditing) {
        await updateJournalPrompt(promptId!, payload);
        toast.success('Günlük sorusu güncellendi');
      } else {
        await createJournalPrompt(payload);
        toast.success('Günlük sorusu oluşturuldu');
      }
      router.push('/dashboard/journal/prompts');
    } catch (error: any) {
      console.error('Failed to save journal prompt:', error);
      toast.error(error.response?.data?.error || 'Kayıt başarısız');
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/journal/prompts')}
        >
          <IconArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isEditing ? 'Günlük Sorusu Düzenle' : 'Yeni Günlük Sorusu'}
          </h2>
          <p className="text-muted-foreground">
            {isEditing
              ? 'Mevcut günlük sorusunu düzenleyin'
              : 'Yeni bir günlük sorusu oluşturun'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Soru İçeriği</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt">Prompt (TR) *</Label>
                  <Textarea
                    id="prompt"
                    value={formData.prompt}
                    onChange={(e) =>
                      setFormData({ ...formData, prompt: e.target.value })
                    }
                    placeholder="Bugün için minnettarlık duyduğun 3 şey nedir?"
                    rows={4}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Kullanıcılara gösterilecek günlük yazma sorusu
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="promptEn">Prompt (EN)</Label>
                  <Textarea
                    id="promptEn"
                    value={formData.promptEn}
                    onChange={(e) =>
                      setFormData({ ...formData, promptEn: e.target.value })
                    }
                    placeholder="What are 3 things you're grateful for today?"
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    İngilizce versiyonu (opsiyonel)
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sınıflandırma</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Günlük Tipi *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tip seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Sorunun hangi günlük tipine ait olduğu
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category: value === 'none' ? '' : value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kategori seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Seçilmedi</SelectItem>
                        {CATEGORY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Ek kategori (opsiyonel)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ayarlar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Sıralama</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                    }
                    min={0}
                  />
                  <p className="text-xs text-muted-foreground">
                    Düşük değerler önce görünür
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Aktif</Label>
                    <p className="text-xs text-muted-foreground">
                      Soru kullanıcılara gösterilsin mi?
                    </p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>İşlemler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? (
                    <>
                      <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : isEditing ? (
                    'Güncelle'
                  ) : (
                    'Oluştur'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/dashboard/journal/prompts')}
                >
                  İptal
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
