'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAdminGoalTemplateById,
  createGoalTemplate,
  updateGoalTemplate,
} from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IconLoader2, IconArrowLeft, IconCheck } from '@tabler/icons-react';
import { toast } from 'sonner';

interface GoalTemplateFormProps {
  templateId?: string;
}

const TYPE_OPTIONS = [
  { value: 'PRACTICE', label: 'Pratik' },
  { value: 'MEDITATION', label: 'Meditasyon' },
  { value: 'BREATHWORK', label: 'Nefes' },
  { value: 'MINDFULNESS', label: 'Farkındalık' },
  { value: 'FITNESS', label: 'Fitness' },
  { value: 'WELLNESS', label: 'Sağlık' },
  { value: 'LEARNING', label: 'Öğrenme' },
  { value: 'STREAK', label: 'Seri' },
  { value: 'CUSTOM', label: 'Özel' },
];

const PERIOD_OPTIONS = [
  { value: 'DAILY', label: 'Günlük' },
  { value: 'WEEKLY', label: 'Haftalık' },
  { value: 'MONTHLY', label: 'Aylık' },
  { value: 'CUSTOM', label: 'Özel' },
];

const EMOJI_OPTIONS = ['🎯', '🧘', '🧠', '💪', '❤️', '🌟', '🔥', '🌈', '☀️', '🌙', '🍃', '💎', '🏆', '📚', '⚡', '🌊', '🎋', '🌱', '🌿', '🌳'];

export function GoalTemplateForm({ templateId }: GoalTemplateFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!templateId);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    titleEn: '',
    description: '',
    descriptionEn: '',
    type: 'PRACTICE',
    targetValue: 1,
    unit: 'gün',
    period: 'DAILY',
    icon: '🎯',
    sortOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      const data = await getAdminGoalTemplateById(templateId!);
      setFormData({
        title: data.title || '',
        titleEn: data.titleEn || '',
        description: data.description || '',
        descriptionEn: data.descriptionEn || '',
        type: data.type || 'PRACTICE',
        targetValue: data.targetValue || 1,
        unit: data.unit || 'gün',
        period: data.period || 'DAILY',
        icon: data.icon || '🎯',
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive ?? true,
      });
    } catch (error) {
      toast.error('Şablon yüklenemedi');
      router.push('/dashboard/user-content/goal-templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title) {
      toast.error('Şablon adı zorunludur');
      return;
    }

    if (!formData.targetValue || formData.targetValue < 1) {
      toast.error('Hedef değer en az 1 olmalıdır');
      return;
    }

    if (!formData.unit) {
      toast.error('Birim zorunludur');
      return;
    }

    setSaving(true);
    try {
      if (templateId) {
        await updateGoalTemplate(templateId, formData);
        toast.success('Şablon güncellendi');
      } else {
        await createGoalTemplate(formData);
        toast.success('Şablon oluşturuldu');
      }
      router.push('/dashboard/user-content/goal-templates');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'İşlem başarısız');
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            <h1 className="text-2xl font-bold">
              {templateId ? 'Hedef Şablonu Düzenle' : 'Yeni Hedef Şablonu'}
            </h1>
            <p className="text-muted-foreground">
              Kullanıcılar için hazır hedef şablonu oluşturun
            </p>
          </div>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <IconCheck className="h-4 w-4 mr-2" />
          )}
          {templateId ? 'Güncelle' : 'Oluştur'}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Temel Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Şablon Adı (TR) *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="7 Gün Meditasyon"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Şablon Adı (EN)</Label>
                  <Input
                    value={formData.titleEn}
                    onChange={(e) =>
                      setFormData({ ...formData, titleEn: e.target.value })
                    }
                    placeholder="7 Day Meditation"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Açıklama (TR)</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="7 gün boyunca her gün meditasyon yapın"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Açıklama (EN)</Label>
                  <Textarea
                    value={formData.descriptionEn}
                    onChange={(e) =>
                      setFormData({ ...formData, descriptionEn: e.target.value })
                    }
                    placeholder="Meditate every day for 7 days"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hedef Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hedef Tipi *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Periyot *</Label>
                  <Select
                    value={formData.period}
                    onValueChange={(value) =>
                      setFormData({ ...formData, period: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIOD_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hedef Değer *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.targetValue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetValue: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Birim *</Label>
                  <Input
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    placeholder="gün, dakika, adet"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Görünüm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>İkon</Label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <Button
                      key={emoji}
                      type="button"
                      variant={formData.icon === emoji ? 'default' : 'outline'}
                      size="icon"
                      className="text-lg"
                      onClick={() => setFormData({ ...formData, icon: emoji })}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sıralama</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sortOrder: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Düşük değerler önce gösterilir
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Durum</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label>Aktif</Label>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Pasif şablonlar kullanıcılara gösterilmez
              </p>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Önizleme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{formData.icon}</span>
                  <div>
                    <h3 className="font-semibold">
                      {formData.title || 'Şablon Adı'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {formData.description || 'Açıklama'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm font-medium">
                        {formData.targetValue} {formData.unit}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({PERIOD_OPTIONS.find((p) => p.value === formData.period)?.label})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
