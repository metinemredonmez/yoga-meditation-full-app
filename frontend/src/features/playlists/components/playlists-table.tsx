'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAdminPlaylists,
  deletePlaylist,
  getPlaylistStats,
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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  IconPlaylist,
  IconStar,
  IconWorld,
  IconSettings,
  IconPlayerPlay,
  IconBookmark,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface Playlist {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  coverImage?: string;
  color?: string;
  type: string;
  contentType: string;
  itemCount: number;
  totalDuration: number;
  playCount: number;
  saveCount: number;
  isSystem: boolean;
  isPublic: boolean;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
}

interface Stats {
  total: number;
  system: number;
  public: number;
  featured: number;
}

const TYPE_OPTIONS: Record<string, { label: string; color: string }> = {
  CUSTOM: { label: 'Özel', color: 'bg-gray-500' },
  SYSTEM: { label: 'Sistem', color: 'bg-blue-500' },
  CURATED: { label: 'Editör', color: 'bg-purple-500' },
  GENERATED: { label: 'Otomatik', color: 'bg-green-500' },
  COURSE: { label: 'Kurs', color: 'bg-amber-500' },
};

const CONTENT_TYPE_OPTIONS: Record<string, { label: string; color: string }> = {
  MIXED: { label: 'Karışık', color: 'bg-violet-500' },
  MEDITATION: { label: 'Meditasyon', color: 'bg-indigo-500' },
  BREATHWORK: { label: 'Nefes', color: 'bg-cyan-500' },
  SOUNDSCAPE: { label: 'Ses', color: 'bg-emerald-500' },
  SLEEP: { label: 'Uyku', color: 'bg-slate-500' },
};

export function PlaylistsTable() {
  const router = useRouter();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState('');
  const [systemFilter, setSystemFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');

  const loadPlaylists = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (typeFilter) params.type = typeFilter;
      if (contentTypeFilter) params.contentType = contentTypeFilter;
      if (systemFilter) params.isSystem = systemFilter === 'true';
      if (featuredFilter) params.isFeatured = featuredFilter === 'true';

      const data = await getAdminPlaylists(params);
      setPlaylists(data.playlists || []);

      // Load stats
      try {
        const statsData = await getPlaylistStats();
        setStats(statsData);
      } catch {
        // Stats endpoint may not exist
      }
    } catch (error) {
      console.error('Failed to load playlists:', error);
      toast.error('Playlistler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, contentTypeFilter, systemFilter, featuredFilter]);

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  const handleDelete = async () => {
    if (!selectedPlaylist) return;
    try {
      await deletePlaylist(selectedPlaylist.id);
      toast.success('Playlist silindi');
      setDeleteDialog(false);
      loadPlaylists();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Silme işlemi başarısız');
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Toplam</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <IconPlaylist className="h-8 w-8 text-violet-500" />
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
                  <p className="text-sm text-muted-foreground">Herkese Açık</p>
                  <p className="text-2xl font-bold text-green-600">{stats.public}</p>
                </div>
                <IconWorld className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Öne Çıkan</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.featured}</p>
                </div>
                <IconStar className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tip" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {Object.entries(TYPE_OPTIONS).map(([value, { label }]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="İçerik Tipi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {Object.entries(CONTENT_TYPE_OPTIONS).map(([value, { label }]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={systemFilter} onValueChange={setSystemFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Sistem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="true">Sistem</SelectItem>
                  <SelectItem value="false">Kullanıcı</SelectItem>
                </SelectContent>
              </Select>

              <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Öne Çıkan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="true">Öne Çıkan</SelectItem>
                  <SelectItem value="false">Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => router.push('/dashboard/playlists/new')}>
              <IconPlus className="h-4 w-4 mr-2" />
              Yeni Playlist
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
          ) : playlists.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Playlist bulunamadı
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]"></TableHead>
                  <TableHead>Playlist Adı</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>İçerik Tipi</TableHead>
                  <TableHead>İçerik</TableHead>
                  <TableHead>Süre</TableHead>
                  <TableHead>Oynatma</TableHead>
                  <TableHead>Kaydetme</TableHead>
                  <TableHead>Sistem</TableHead>
                  <TableHead>Public</TableHead>
                  <TableHead>Öne Çıkan</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {playlists.map((playlist) => (
                  <TableRow key={playlist.id}>
                    <TableCell>
                      {playlist.coverImage ? (
                        <div className="relative h-10 w-10 rounded overflow-hidden">
                          <Image
                            src={playlist.coverImage}
                            alt={playlist.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className="h-10 w-10 rounded flex items-center justify-center"
                          style={{ backgroundColor: playlist.color || '#8B5CF6' }}
                        >
                          <IconPlaylist className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{playlist.name}</p>
                        {playlist.nameEn && (
                          <p className="text-xs text-muted-foreground">{playlist.nameEn}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`${TYPE_OPTIONS[playlist.type]?.color || 'bg-gray-500'} text-white`}
                      >
                        {TYPE_OPTIONS[playlist.type]?.label || playlist.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`border-2`}
                      >
                        {CONTENT_TYPE_OPTIONS[playlist.contentType]?.label || playlist.contentType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{playlist.itemCount}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatDuration(playlist.totalDuration)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <IconPlayerPlay className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono text-sm">{playlist.playCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <IconBookmark className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono text-sm">{playlist.saveCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch checked={playlist.isSystem} disabled />
                    </TableCell>
                    <TableCell>
                      <Switch checked={playlist.isPublic} disabled />
                    </TableCell>
                    <TableCell>
                      {playlist.isFeatured && (
                        <IconStar className="h-4 w-4 text-amber-500 fill-amber-500" />
                      )}
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
                              router.push(`/dashboard/playlists/${playlist.id}`)
                            }
                          >
                            <IconEdit className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedPlaylist(playlist);
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
            <AlertDialogTitle>Playlist Sil</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{selectedPlaylist?.name}&quot; playlistini silmek istediğinize
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
