'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAdminReminderTemplateById,
  createReminderTemplate,
  updateReminderTemplate,
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
import { IconLoader2, IconArrowLeft, IconCheck, IconBell } from '@tabler/icons-react';
import { toast } from 'sonner';

interface ReminderTemplateFormProps {
  templateId?: string;
}

const TYPE_OPTIONS = [
  { value: 'MORNING', label: 'Sabah' },
  { value: 'EVENING', label: 'Akşam' },
  { value: 'PRACTICE', label: 'Pratik' },
  { value: 'MOOD', label: 'Mood Kayıt' },
  { value: 'JOURNAL', label: 'Günlük' },
  { value: 'HYDRATION', label: 'Su İçme' },
  { value: 'POSTURE', label: 'Duruş' },
  { value: 'BREAK', label: 'Mola' },
  { value: 'BEDTIME', label: 'Yatma Vakti' },
  { value: 'CUSTOM', label: 'Özel' },
];

const EMOJI_OPTIONS = ['🔔', '☀️', '🌙', '🧘', '📝', '💧', '🧍', '☕', '😴', '⏰', '🌟', '💪', '🎯', '❤️', '🍃', '🌈', '✨', '🙏', '🌸', '🧠'];

export function ReminderTemplateForm({ templateId }: ReminderTemplateFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!templateId);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    titleEn: '',
    type: 'MORNING',
    message: '',
    messageEn: '',
    time: '08:00',
    icon: '🔔',
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
      const data = await getAdminReminderTemplateById(templateId!);
      setFormData({
        title: data.title || '',
        titleEn: data.titleEn || '',
        type: data.type || 'MORNING',
        message: data.message || '',
        messageEn: data.messageEn || '',
        time: data.time || '08:00',
        icon: data.icon || '🔔',
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive ?? true,
      });
    } catch (error) {
      toast.error('Şablon yüklenemedi');
      router.push('/dashboard/user-content/reminder-templates');
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

    setSaving(true);
    try {
      if (templateId) {
        await updateReminderTemplate(templateId, formData);
        toast.success('Şablon güncellendi');
      } else {
        await createReminderTemplate(formData);
        toast.success('Şablon oluşturuldu');
      }
      router.push('/dashboard/user-content/reminder-templates');
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
              {templateId ? 'Hatırlatıcı Şablonu Düzenle' : 'Yeni Hatırlatıcı Şablonu'}
            </h1>
            <p className="text-muted-foreground">
              Kullanıcılar için hazır hatırlatıcı şablonu oluşturun
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
                    placeholder="Sabah Meditasyonu"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Şablon Adı (EN)</Label>
                  <Input
                    value={formData.titleEn}
                    onChange={(e) =>
                      setFormData({ ...formData, titleEn: e.target.value })
                    }
                    placeholder="Morning Meditation"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hatırlatıcı Tipi *</Label>
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
                  <Label>Varsayılan Saat</Label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mesaj İçeriği</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Varsayılan Mesaj (TR)</Label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    placeholder="Güne huzurlu bir başlangıç yapmaya ne dersin?"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Varsayılan Mesaj (EN)</Label>
                  <Textarea
                    value={formData.messageEn}
                    onChange={(e) =>
                      setFormData({ ...formData, messageEn: e.target.value })
                    }
                    placeholder="How about starting the day peacefully?"
                    rows={3}
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
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xl">{formData.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">
                        {formData.title || 'Şablon Adı'}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {formData.time}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formData.message || 'Mesaj içeriği'}
                    </p>
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
