'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAdminTimerPresets,
  deleteTimerPreset,
  getTimerPresetStats,
} from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  IconLoader2,
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconClock,
  IconBell,
  IconGripVertical,
  IconInfinity,
  IconSettings,
} from '@tabler/icons-react';
import { toast } from 'sonner';

interface TimerPreset {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  icon?: string;
  color?: string;
  duration: number;
  intervalBell?: number;
  startBell?: string;
  endBell?: string;
  backgroundSound?: {
    id: string;
    title: string;
  };
  isSystem: boolean;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
}

interface Stats {
  total: number;
  system: number;
  custom: number;
}

const BELL_OPTIONS: Record<string, string> = {
  bell_tibetan: 'Tibet Çanağı',
  bell_chime: 'Çan',
  bell_gong: 'Gong',
  bell_singing: 'Şarkı Çanağı',
  bell_soft: 'Yumuşak',
};

export function TimerPresetsTable() {
  const router = useRouter();
  const [presets, setPresets] = useState<TimerPreset[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<TimerPreset | null>(null);

  // Filters
  const [systemFilter, setSystemFilter] = useState('');

  const loadPresets = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (systemFilter) params.isSystem = systemFilter === 'true';

      const data = await getAdminTimerPresets(params);
      setPresets(data.presets || data.timerPresets || []);

      // Load stats
      try {
        const statsData = await getTimerPresetStats();
        setStats(statsData);
      } catch {
        // Stats endpoint may not exist
      }
    } catch (error) {
      console.error('Failed to load timer presets:', error);
      toast.error('Zamanlayıcı presetleri yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [systemFilter]);

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  const handleDelete = async () => {
    if (!selectedPreset) return;
    try {
      await deleteTimerPreset(selectedPreset.id);
      toast.success('Zamanlayıcı preseti silindi');
      setDeleteDialog(false);
      loadPresets();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Silme işlemi başarısız');
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return null; // Open-ended
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainMins = mins % 60;
      return `${hours}h ${remainMins}m`;
    }
    return secs > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${mins}m`;
  };

  const getBellLabel = (value?: string) => {
    if (!value) return '-';
    return BELL_OPTIONS[value] || value;
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Toplam</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <IconClock className="h-8 w-8 text-violet-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sistem</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.system}</p>
                </div>
                <IconSettings className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Özel</p>
                  <p className="text-2xl font-bold text-green-600">{stats.custom}</p>
                </div>
                <IconClock className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <Select value={systemFilter} onValueChange={setSystemFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tüm Presetler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="true">Sistem Presetleri</SelectItem>
                <SelectItem value="false">Özel Presetler</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => router.push('/dashboard/wellness/timer/new')}>
              <IconPlus className="h-4 w-4 mr-2" />
              Yeni Preset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : presets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Zamanlayıcı preseti bulunamadı
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="w-[50px]">İkon</TableHead>
                  <TableHead>Preset Adı</TableHead>
                  <TableHead>İngilizce</TableHead>
                  <TableHead>Süre</TableHead>
                  <TableHead>Ara Zil</TableHead>
                  <TableHead>Başlangıç Zili</TableHead>
                  <TableHead>Bitiş Zili</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Sıra</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {presets
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((preset) => (
                    <TableRow key={preset.id}>
                      <TableCell>
                        <IconGripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      </TableCell>
                      <TableCell>
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-lg"
                          style={{ backgroundColor: preset.color || '#8B5CF6' }}
                        >
                          {preset.icon || '⏱️'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{preset.name}</div>
                      </TableCell>
                      <TableCell>
                        {preset.nameEn ? (
                          <span className="text-muted-foreground">{preset.nameEn}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {preset.duration === 0 ? (
                          <span className="inline-flex items-center gap-1 text-amber-600">
                            <IconInfinity className="h-4 w-4" />
                            Açık Uçlu
                          </span>
                        ) : (
                          <span className="font-mono">
                            {formatDuration(preset.duration)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {preset.intervalBell ? (
                          <span className="font-mono text-sm">
                            {formatDuration(preset.intervalBell)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {preset.startBell ? (
                          <div className="flex items-center gap-1">
                            <IconBell className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{getBellLabel(preset.startBell)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {preset.endBell ? (
                          <div className="flex items-center gap-1">
                            <IconBell className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{getBellLabel(preset.endBell)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {preset.isSystem ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-400/20 dark:text-blue-400">
                            Sistem
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-400/20 dark:text-green-400">
                            Özel
                          </span>
                        )}
                        {preset.isDefault && (
                          <span className="inline-flex items-center ml-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-400">
                            Varsayılan
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{preset.sortOrder}</span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <IconDots className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/dashboard/wellness/timer/${preset.id}`)
                              }
                            >
                              <IconEdit className="mr-2 h-4 w-4" />
                              Düzenle
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedPreset(preset);
                                setDeleteDialog(true);
                              }}
                            >
                              <IconTrash className="mr-2 h-4 w-4" />
                              Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Zamanlayıcı Preseti Sil</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{selectedPreset?.name}&quot; presetini silmek istediğinize
              emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
