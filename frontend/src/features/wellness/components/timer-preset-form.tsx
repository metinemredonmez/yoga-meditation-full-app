'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  createTimerPreset,
  updateTimerPreset,
  getAdminTimerPresetById,
  getAdminSoundscapes,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IconLoader2,
  IconArrowLeft,
  IconDeviceFloppy,
  IconBell,
  IconPlayerPlay,
} from '@tabler/icons-react';
import { toast } from 'sonner';

interface TimerPresetFormProps {
  presetId?: string;
}

interface Soundscape {
  id: string;
  title: string;
  isMixable: boolean;
}

const BELL_OPTIONS = [
  { value: 'bell_tibetan', label: 'Tibet Çanağı', description: 'Derin ve rahatlatıcı' },
  { value: 'bell_chime', label: 'Çan', description: 'Keskin ve net' },
  { value: 'bell_gong', label: 'Gong', description: 'Güçlü ve yankılanan' },
  { value: 'bell_singing', label: 'Şarkı Çanağı', description: 'Melodili ve huzurlu' },
  { value: 'bell_soft', label: 'Yumuşak', description: 'Hafif ve nazik' },
];

const ICON_OPTIONS = [
  '⏱️', '🧘', '🧘‍♀️', '🧘‍♂️', '🕐', '⏰', '🌙', '☀️', '🌅', '🌄',
  '🔔', '🎵', '💆', '💆‍♀️', '🌸', '🍃', '🌊', '🔥', '✨', '💫',
];

const COLOR_OPTIONS = [
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#6366F1', // indigo
  '#14B8A6', // teal
  '#3B82F6', // blue
  '#8B5CF6', // purple
];

export function TimerPresetForm({ presetId }: TimerPresetFormProps) {
  const router = useRouter();
  const isEdit = !!presetId;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [soundscapes, setSoundscapes] = useState<Soundscape[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    description: '',
    icon: '⏱️',
    color: '#8B5CF6',
    duration: 600, // 10 minutes default
    intervalBell: 0,
    startBell: '',
    endBell: '',
    intervalBellSound: '',
    backgroundSoundId: '',
    backgroundVolume: 50,
    isSystem: true,
    isDefault: false,
    sortOrder: 0,
  });

  const loadData = useCallback(async () => {
    try {
      // Load mixable soundscapes for background sound
      const soundscapeData = await getAdminSoundscapes({ isMixable: true, limit: 100 });
      setSoundscapes(soundscapeData.soundscapes || []);

      if (presetId) {
        const preset = await getAdminTimerPresetById(presetId);
        if (preset) {
          setFormData({
            name: preset.name || '',
            nameEn: preset.nameEn || '',
            description: preset.description || '',
            icon: preset.icon || '⏱️',
            color: preset.color || '#8B5CF6',
            duration: preset.duration || 600,
            intervalBell: preset.intervalBell || 0,
            startBell: preset.startBell || '',
            endBell: preset.endBell || '',
            intervalBellSound: preset.intervalBellSound || '',
            backgroundSoundId: preset.backgroundSoundId || '',
            backgroundVolume: preset.backgroundVolume || 50,
            isSystem: preset.isSystem ?? true,
            isDefault: preset.isDefault || false,
            sortOrder: preset.sortOrder || 0,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Veri yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [presetId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Preset adı zorunludur');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        duration: Number(formData.duration),
        intervalBell: Number(formData.intervalBell) || undefined,
        backgroundVolume: Number(formData.backgroundVolume),
        sortOrder: Number(formData.sortOrder),
      };

      if (isEdit) {
        await updateTimerPreset(presetId!, payload);
        toast.success('Zamanlayıcı preseti güncellendi');
      } else {
        await createTimerPreset(payload);
        toast.success('Zamanlayıcı preseti oluşturuldu');
      }
      router.push('/dashboard/wellness/timer');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'İşlem başarısız');
    } finally {
      setSaving(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return 'Açık Uçlu';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainMins = mins % 60;
      return `${hours} saat ${remainMins} dakika`;
    }
    return secs > 0 ? `${mins} dakika ${secs} saniye` : `${mins} dakika`;
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
            onClick={() => router.push('/dashboard/wellness/timer')}
          >
            <IconArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">
              {isEdit ? 'Zamanlayıcı Preseti Düzenle' : 'Yeni Zamanlayıcı Preseti'}
            </h2>
            <p className="text-muted-foreground">
              Zamanlayıcı preset bilgilerini girin
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            İptal
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <IconDeviceFloppy className="h-4 w-4 mr-2" />
            )}
            {isEdit ? 'Güncelle' : 'Kaydet'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Temel Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Preset Adı (TR) *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="10 Dakika Meditasyon"
                />
              </div>
              <div className="space-y-2">
                <Label>Preset Adı (EN)</Label>
                <Input
                  value={formData.nameEn}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nameEn: e.target.value }))
                  }
                  placeholder="10 Minute Meditation"
                />
              </div>
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Preset açıklaması"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>İkon</Label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      className={`h-10 w-10 rounded-lg border-2 text-xl flex items-center justify-center transition-all ${
                        formData.icon === icon
                          ? 'border-primary scale-110'
                          : 'border-transparent hover:border-muted-foreground/30'
                      }`}
                      onClick={() => setFormData((prev) => ({ ...prev, icon }))}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Renk</Label>
                <div className="flex items-center gap-2">
                  <div className="flex gap-2">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`h-8 w-8 rounded-full border-2 transition-all ${
                          formData.color === color
                            ? 'border-foreground scale-110'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData((prev) => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, color: e.target.value }))
                    }
                    className="w-12 h-8 p-0 border-0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zamanlama</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Süre (saniye)</Label>
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
                    min={0}
                  />
                  <span className="text-sm text-muted-foreground">
                    = {formatDuration(formData.duration)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Açık uçlu zamanlayıcı için 0 girin
                </p>
              </div>

              <div className="space-y-2">
                <Label>Ara Zil Süresi (saniye)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    value={formData.intervalBell}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        intervalBell: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-32"
                    min={0}
                  />
                  {formData.intervalBell > 0 && (
                    <span className="text-sm text-muted-foreground">
                      Her {formatDuration(formData.intervalBell)} bir zil çalar
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ara zil istemiyorsanız boş bırakın
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Zil Sesleri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Başlangıç Zili</Label>
                <Select
                  value={formData.startBell || 'none'}
                  onValueChange={(v) =>
                    setFormData((prev) => ({
                      ...prev,
                      startBell: v === 'none' ? '' : v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Zil seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Zil yok</SelectItem>
                    {BELL_OPTIONS.map((bell) => (
                      <SelectItem key={bell.value} value={bell.value}>
                        <div className="flex items-center gap-2">
                          <IconBell className="h-4 w-4" />
                          <span>{bell.label}</span>
                          <span className="text-muted-foreground text-xs">
                            - {bell.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Bitiş Zili</Label>
                <Select
                  value={formData.endBell || 'none'}
                  onValueChange={(v) =>
                    setFormData((prev) => ({
                      ...prev,
                      endBell: v === 'none' ? '' : v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Zil seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Zil yok</SelectItem>
                    {BELL_OPTIONS.map((bell) => (
                      <SelectItem key={bell.value} value={bell.value}>
                        <div className="flex items-center gap-2">
                          <IconBell className="h-4 w-4" />
                          <span>{bell.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.intervalBell > 0 && (
                <div className="space-y-2">
                  <Label>Ara Zil Sesi</Label>
                  <Select
                    value={formData.intervalBellSound || 'none'}
                    onValueChange={(v) =>
                      setFormData((prev) => ({
                        ...prev,
                        intervalBellSound: v === 'none' ? '' : v,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Zil seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Zil yok</SelectItem>
                      {BELL_OPTIONS.map((bell) => (
                        <SelectItem key={bell.value} value={bell.value}>
                          <div className="flex items-center gap-2">
                            <IconBell className="h-4 w-4" />
                            <span>{bell.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Arka Plan Sesi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    <SelectValue placeholder="Ses seçin" />
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
              </div>

              {formData.backgroundSoundId && (
                <div className="space-y-2">
                  <Label>Ses Seviyesi: {formData.backgroundVolume}%</Label>
                  <Slider
                    value={[formData.backgroundVolume]}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, backgroundVolume: value[0] }))
                    }
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ayarlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Sistem Preseti</div>
                  <div className="text-sm text-muted-foreground">
                    Tüm kullanıcılara görünür
                  </div>
                </div>
                <Switch
                  checked={formData.isSystem}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isSystem: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Varsayılan</div>
                  <div className="text-sm text-muted-foreground">
                    Zamanlayıcı açıldığında seçili gelir
                  </div>
                </div>
                <Switch
                  checked={formData.isDefault}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isDefault: checked }))
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
        </div>
      </div>
    </div>
  );
}
