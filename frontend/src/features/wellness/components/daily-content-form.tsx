'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAdminDailyContentByDate,
  createDailyContent,
  updateDailyContent,
  getAdminDailyQuotes,
  getAdminMeditations,
  getAdminBreathworkSessions,
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
import { IconLoader2, IconArrowLeft, IconQuote, IconBrain, IconWind } from '@tabler/icons-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface DailyContentFormProps {
  date: string; // YYYY-MM-DD format
}

interface Quote {
  id: string;
  text: string;
  author?: string;
}

interface Meditation {
  id: string;
  title: string;
  durationSeconds?: number;
}

interface Breathwork {
  id: string;
  title: string;
}

export function DailyContentForm({ date }: DailyContentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contentId, setContentId] = useState<string | null>(null);
  const isEditing = !!contentId;

  // Options
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [breathworks, setBreathworks] = useState<Breathwork[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [formData, setFormData] = useState({
    date: date,
    quoteId: '',
    meditationId: '',
    breathworkId: '',
    tip: '',
    tipEn: '',
    challenge: '',
    challengeEn: '',
    isPublished: true,
  });

  useEffect(() => {
    loadOptions();
    loadExistingContent();
  }, [date]);

  const loadOptions = async () => {
    setLoadingOptions(true);
    try {
      const [quotesData, meditationsData, breathworkData] = await Promise.all([
        getAdminDailyQuotes({ isActive: true }),
        getAdminMeditations({ isPublished: true, limit: 100 }),
        getAdminBreathworkSessions({ isPublished: true, limit: 100 }),
      ]);

      setQuotes(quotesData.quotes || quotesData.dailyQuotes || []);
      setMeditations(meditationsData.meditations || []);
      setBreathworks(breathworkData.sessions || breathworkData.breathworkSessions || []);
    } catch (error) {
      console.error('Failed to load options:', error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const loadExistingContent = async () => {
    setLoading(true);
    try {
      const data = await getAdminDailyContentByDate(date);
      if (data && data.id) {
        setContentId(data.id);
        setFormData({
          date: date,
          quoteId: data.quote?.id || '',
          meditationId: data.meditation?.id || '',
          breathworkId: data.breathwork?.id || '',
          tip: data.tip || '',
          tipEn: data.tipEn || '',
          challenge: data.challenge || '',
          challengeEn: data.challengeEn || '',
          isPublished: data.isPublished ?? true,
        });
      }
    } catch (error: any) {
      // 404 means no content for this date, which is fine
      if (error.response?.status !== 404) {
        console.error('Failed to load daily content:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    try {
      const payload = {
        ...formData,
        quoteId: formData.quoteId || undefined,
        meditationId: formData.meditationId || undefined,
        breathworkId: formData.breathworkId || undefined,
        tip: formData.tip || undefined,
        tipEn: formData.tipEn || undefined,
        challenge: formData.challenge || undefined,
        challengeEn: formData.challengeEn || undefined,
      };

      if (isEditing) {
        await updateDailyContent(contentId!, payload);
        toast.success('Günlük içerik güncellendi');
      } else {
        await createDailyContent(payload);
        toast.success('Günlük içerik oluşturuldu');
      }
      router.push('/dashboard/wellness/daily-content');
    } catch (error: any) {
      console.error('Failed to save daily content:', error);
      toast.error(error.response?.data?.error || 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    return ` (${mins} dk)`;
  };

  if (loading || loadingOptions) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const displayDate = new Date(date);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/wellness/daily-content')}
        >
          <IconArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {format(displayDate, 'd MMMM yyyy', { locale: tr })}
          </h2>
          <p className="text-muted-foreground">
            {isEditing
              ? 'Bu günün içeriğini düzenleyin'
              : 'Bu gün için yeni içerik oluşturun'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quote Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconQuote className="h-5 w-5" />
                  Günün Sözü
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="quoteId">Söz Seçin</Label>
                  <Select
                    value={formData.quoteId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, quoteId: value === 'none' ? '' : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Söz seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Seçilmedi</SelectItem>
                      {quotes.map((quote) => (
                        <SelectItem key={quote.id} value={quote.id}>
                          &quot;{quote.text.substring(0, 50)}...&quot;
                          {quote.author && ` - ${quote.author}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Günün Sözleri sayfasından yeni söz ekleyebilirsiniz
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Content Selection */}
            <Card>
              <CardHeader>
                <CardTitle>İçerik Seçimi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="meditationId" className="flex items-center gap-2">
                    <IconBrain className="h-4 w-4" />
                    Günün Meditasyonu
                  </Label>
                  <Select
                    value={formData.meditationId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, meditationId: value === 'none' ? '' : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Meditasyon seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Seçilmedi</SelectItem>
                      {meditations.map((med) => (
                        <SelectItem key={med.id} value={med.id}>
                          {med.title}{formatDuration(med.durationSeconds)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="breathworkId" className="flex items-center gap-2">
                    <IconWind className="h-4 w-4" />
                    Günün Nefes Egzersizi
                  </Label>
                  <Select
                    value={formData.breathworkId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, breathworkId: value === 'none' ? '' : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Nefes egzersizi seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Seçilmedi</SelectItem>
                      {breathworks.map((bw) => (
                        <SelectItem key={bw.id} value={bw.id}>
                          {bw.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tips & Challenge */}
            <Card>
              <CardHeader>
                <CardTitle>İpucu & Challenge</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tip">Günün İpucu (TR)</Label>
                    <Textarea
                      id="tip"
                      value={formData.tip}
                      onChange={(e) =>
                        setFormData({ ...formData, tip: e.target.value })
                      }
                      placeholder="Örn: Günün ilk saatinde 5 dakikalık meditasyon..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipEn">Günün İpucu (EN)</Label>
                    <Textarea
                      id="tipEn"
                      value={formData.tipEn}
                      onChange={(e) =>
                        setFormData({ ...formData, tipEn: e.target.value })
                      }
                      placeholder="Tip in English..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="challenge">Günün Challenge (TR)</Label>
                    <Textarea
                      id="challenge"
                      value={formData.challenge}
                      onChange={(e) =>
                        setFormData({ ...formData, challenge: e.target.value })
                      }
                      placeholder="Örn: Bugün 3 kez derin nefes al"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="challengeEn">Günün Challenge (EN)</Label>
                    <Textarea
                      id="challengeEn"
                      value={formData.challengeEn}
                      onChange={(e) =>
                        setFormData({ ...formData, challengeEn: e.target.value })
                      }
                      placeholder="Challenge in English..."
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
                <CardTitle>Ayarlar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Tarih</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    disabled
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Yayınla</Label>
                    <p className="text-xs text-muted-foreground">
                      İçerik kullanıcılara gösterilsin mi?
                    </p>
                  </div>
                  <Switch
                    checked={formData.isPublished}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isPublished: checked })
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
                  onClick={() => router.push('/dashboard/wellness/daily-content')}
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
