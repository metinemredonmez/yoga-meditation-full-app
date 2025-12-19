'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAdminDailyQuoteById,
  createDailyQuote,
  updateDailyQuote,
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

interface DailyQuoteFormProps {
  quoteId?: string;
}

const CATEGORY_OPTIONS = [
  { value: 'MOTIVATION', label: 'Motivasyon' },
  { value: 'MINDFULNESS', label: 'Farkındalık' },
  { value: 'HAPPINESS', label: 'Mutluluk' },
  { value: 'PEACE', label: 'Huzur' },
  { value: 'SELF_LOVE', label: 'Öz Sevgi' },
  { value: 'YOGA', label: 'Yoga' },
  { value: 'SUFI', label: 'Sufi' },
  { value: 'GRATITUDE', label: 'Şükran' },
];

export function DailyQuoteForm({ quoteId }: DailyQuoteFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEditing = !!quoteId;

  const [formData, setFormData] = useState({
    text: '',
    textEn: '',
    author: '',
    category: '',
    language: 'tr',
    scheduledDate: '',
    isActive: true,
  });

  useEffect(() => {
    if (quoteId) {
      loadQuote();
    }
  }, [quoteId]);

  const loadQuote = async () => {
    setLoading(true);
    try {
      const data = await getAdminDailyQuoteById(quoteId!);
      const quote = data.quote || data;
      setFormData({
        text: quote.text || '',
        textEn: quote.textEn || '',
        author: quote.author || '',
        category: quote.category || '',
        language: quote.language || 'tr',
        scheduledDate: quote.scheduledDate
          ? new Date(quote.scheduledDate).toISOString().split('T')[0]
          : '',
        isActive: quote.isActive ?? true,
      });
    } catch (error) {
      console.error('Failed to load daily quote:', error);
      toast.error('Günün sözü yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.text.trim()) {
      toast.error('Söz alanı zorunludur');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        category: formData.category || undefined,
        scheduledDate: formData.scheduledDate || undefined,
      };

      if (isEditing) {
        await updateDailyQuote(quoteId!, payload);
        toast.success('Günün sözü güncellendi');
      } else {
        await createDailyQuote(payload);
        toast.success('Günün sözü oluşturuldu');
      }
      router.push('/dashboard/wellness/daily-quotes');
    } catch (error: any) {
      console.error('Failed to save daily quote:', error);
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
          onClick={() => router.push('/dashboard/wellness/daily-quotes')}
        >
          <IconArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isEditing ? 'Günün Sözü Düzenle' : 'Yeni Günün Sözü'}
          </h2>
          <p className="text-muted-foreground">
            {isEditing
              ? 'Mevcut günün sözünü düzenleyin'
              : 'Yeni bir günün sözü oluşturun'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Söz İçeriği</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="text">Söz (TR) *</Label>
                  <Textarea
                    id="text"
                    value={formData.text}
                    onChange={(e) =>
                      setFormData({ ...formData, text: e.target.value })
                    }
                    placeholder="Hayat, her gün yeni bir başlangıç fırsatıdır."
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="textEn">Söz (EN)</Label>
                  <Textarea
                    id="textEn"
                    value={formData.textEn}
                    onChange={(e) =>
                      setFormData({ ...formData, textEn: e.target.value })
                    }
                    placeholder="Life is a new opportunity to start every day."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="author">Yazar</Label>
                  <Input
                    id="author"
                    value={formData.author}
                    onChange={(e) =>
                      setFormData({ ...formData, author: e.target.value })
                    }
                    placeholder="Anonim, Rumi, vb."
                  />
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Dil</Label>
                    <Select
                      value={formData.language}
                      onValueChange={(value) =>
                        setFormData({ ...formData, language: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tr">Türkçe</SelectItem>
                        <SelectItem value="en">İngilizce</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Planlama</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">Planlanmış Tarih</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduledDate: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Belirli bir gün için planla (opsiyonel)
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Aktif</Label>
                    <p className="text-xs text-muted-foreground">
                      Söz kullanıcılara gösterilsin mi?
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
                  onClick={() => router.push('/dashboard/wellness/daily-quotes')}
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
