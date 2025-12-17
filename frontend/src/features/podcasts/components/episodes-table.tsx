'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAdminEpisodes,
  deleteEpisode,
  publishEpisode,
  getAdminPodcastById
} from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  IconLoader2,
  IconSearch,
  IconPlus,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconPlayerPlay,
  IconArrowLeft,
  IconHeadphones,
  IconClock,
  IconCalendar
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { format, formatDuration, intervalToDuration } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Episode {
  id: string;
  title: string;
  slug: string;
  description: string;
  audioUrl: string | null;
  duration: number | null;
  status: string;
  episodeNumber: number;
  seasonNumber: number | null;
  playCount: number;
  isExplicit: boolean;
  publishedAt: string | null;
  createdAt: string;
}

interface Podcast {
  id: string;
  title: string;
  slug: string;
}

interface EpisodesTableProps {
  podcastId: string;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tüm Durumlar' },
  { value: 'DRAFT', label: 'Taslak' },
  { value: 'PROCESSING', label: 'İşleniyor' },
  { value: 'PUBLISHED', label: 'Yayında' },
  { value: 'ARCHIVED', label: 'Arşiv' }
];

export function EpisodesTable({ podcastId }: EpisodesTableProps) {
  const router = useRouter();
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });

  const loadPodcast = async () => {
    try {
      const response = await getAdminPodcastById(podcastId);
      setPodcast(response.podcast);
    } catch (error) {
      console.error('Failed to load podcast:', error);
    }
  };

  const loadEpisodes = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 10 };
      if (search) params.q = search;
      if (status !== 'all') params.status = status;

      const response = await getAdminEpisodes(podcastId, params);
      setEpisodes(response.episodes || []);
      setPagination({
        total: response.pagination?.total || 0,
        pages: response.pagination?.pages || 0
      });
    } catch (error) {
      console.error('Failed to load episodes:', error);
      toast.error('Bölümler yüklenemedi');
      setEpisodes([]);
    } finally {
      setLoading(false);
    }
  }, [podcastId, page, search, status]);

  useEffect(() => {
    loadPodcast();
  }, [podcastId]);

  useEffect(() => {
    loadEpisodes();
  }, [loadEpisodes]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" bölümünü silmek istediğinizden emin misiniz?`)) return;
    try {
      await deleteEpisode(podcastId, id);
      toast.success('Bölüm silindi');
      loadEpisodes();
    } catch (error) {
      console.error('Failed to delete episode:', error);
      toast.error('Bölüm silinemedi');
    }
  };

  const handlePublish = async (episodeId: string) => {
    try {
      await publishEpisode(podcastId, episodeId);
      toast.success('Bölüm yayınlandı');
      loadEpisodes();
    } catch (error) {
      console.error('Failed to publish episode:', error);
      toast.error('Bölüm yayınlanamadı');
    }
  };

  const getStatusBadge = (episodeStatus: string) => {
    switch (episodeStatus) {
      case 'PUBLISHED':
        return <Badge className="bg-green-500/10 text-green-600">Yayında</Badge>;
      case 'DRAFT':
        return <Badge className="bg-yellow-500/10 text-yellow-600">Taslak</Badge>;
      case 'PROCESSING':
        return <Badge className="bg-blue-500/10 text-blue-600">İşleniyor</Badge>;
      case 'ARCHIVED':
        return <Badge className="bg-gray-500/10 text-gray-600">Arşiv</Badge>;
      default:
        return <Badge variant="outline">{episodeStatus}</Badge>;
    }
  };

  const formatDurationString = (seconds: number | null) => {
    if (!seconds) return '-';
    const duration = intervalToDuration({ start: 0, end: seconds * 1000 });
    const hours = duration.hours || 0;
    const minutes = duration.minutes || 0;
    const secs = duration.seconds || 0;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading && episodes.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/podcasts')}
        >
          <IconArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Bölümler</h2>
          <p className="text-muted-foreground">
            {podcast?.title || 'Podcast'} - Bölüm Yönetimi
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Bölüm ara..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => router.push(`/dashboard/podcasts/${podcastId}/episodes/new`)}>
          <IconPlus className="h-4 w-4 mr-2" />
          Yeni Bölüm
        </Button>
      </div>

      {/* Table */}
      {episodes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconHeadphones className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Henüz bölüm bulunamadı</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push(`/dashboard/podcasts/${podcastId}/episodes/new`)}
            >
              <IconPlus className="h-4 w-4 mr-2" />
              İlk Bölümü Ekle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">#</TableHead>
                <TableHead>Başlık</TableHead>
                <TableHead className="w-[100px]">Süre</TableHead>
                <TableHead className="w-[100px]">Dinleme</TableHead>
                <TableHead className="w-[120px]">Yayın Tarihi</TableHead>
                <TableHead className="w-[100px]">Durum</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {episodes.map((episode) => (
                <TableRow
                  key={episode.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/dashboard/podcasts/${podcastId}/episodes/${episode.id}`)}
                >
                  <TableCell>
                    <div className="flex flex-col items-center">
                      {episode.seasonNumber && (
                        <span className="text-xs text-muted-foreground">S{episode.seasonNumber}</span>
                      )}
                      <span className="font-medium">E{episode.episodeNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium line-clamp-1">{episode.title}</span>
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {episode.description}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <IconClock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDurationString(episode.duration)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <IconHeadphones className="h-4 w-4 text-muted-foreground" />
                      <span>{episode.playCount.toLocaleString('tr-TR')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {episode.publishedAt ? (
                      <div className="flex items-center gap-1">
                        <IconCalendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(episode.publishedAt), 'dd MMM yyyy', { locale: tr })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(episode.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <IconDotsVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/podcasts/${podcastId}/episodes/${episode.id}`);
                          }}
                        >
                          <IconEdit className="h-4 w-4 mr-2" />
                          Düzenle
                        </DropdownMenuItem>
                        {episode.status === 'DRAFT' && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePublish(episode.id);
                            }}
                          >
                            <IconPlayerPlay className="h-4 w-4 mr-2" />
                            Yayınla
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(episode.id, episode.title);
                          }}
                        >
                          <IconTrash className="h-4 w-4 mr-2" />
                          Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Toplam {pagination.total} bölüm
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Önceki
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === pagination.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Sonraki
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
