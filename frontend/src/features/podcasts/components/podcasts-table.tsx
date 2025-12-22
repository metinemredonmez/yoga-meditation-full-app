'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAdminPodcasts,
  deletePodcast,
  publishPodcast,
  unpublishPodcast
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  IconLoader2,
  IconSearch,
  IconPlus,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconPlayerPlay,
  IconPlayerPause,
  IconRss,
  IconMicrophone,
  IconUsers,
  IconHeadphones,
  IconChartBar
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Podcast {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  coverImage: string | null;
  category: string;
  hostName: string | null;
  status: string;
  rssEnabled: boolean;
  totalEpisodes: number;
  totalListens: number;
  subscriberCount: number;
  host: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface PodcastsResponse {
  podcasts: Podcast[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const CATEGORIES = [
  { value: 'all', label: 'Tüm Kategoriler' },
  { value: 'WELLNESS', label: 'Wellness' },
  { value: 'MEDITATION', label: 'Meditasyon' },
  { value: 'YOGA_INSTRUCTION', label: 'Yoga Eğitimi' },
  { value: 'BREATHWORK', label: 'Nefes Çalışması' },
  { value: 'PHILOSOPHY', label: 'Felsefe' },
  { value: 'INTERVIEWS', label: 'Röportajlar' },
  { value: 'MUSIC', label: 'Müzik' },
  { value: 'STORIES', label: 'Hikayeler' },
  { value: 'GUIDED_PRACTICE', label: 'Rehberli Pratik' },
  { value: 'MINDFULNESS', label: 'Farkındalık' }
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tüm Durumlar' },
  { value: 'DRAFT', label: 'Taslak' },
  { value: 'PUBLISHED', label: 'Yayında' },
  { value: 'ARCHIVED', label: 'Arşivlendi' }
];

export function PodcastsTable() {
  const router = useRouter();
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });

  const loadPodcasts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 10 };
      if (search) params.q = search;
      if (category !== 'all') params.category = category;
      if (status !== 'all') params.status = status;

      const response: PodcastsResponse = await getAdminPodcasts(params);
      setPodcasts(response.podcasts || []);
      setPagination({
        total: response.pagination?.total || 0,
        pages: response.pagination?.pages || 0
      });
    } catch (error) {
      console.error('Failed to load podcasts:', error);
      toast.error('Podcast\'ler yüklenemedi');
      setPodcasts([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, status]);

  useEffect(() => {
    loadPodcasts();
  }, [loadPodcasts]);

  useEffect(() => {
    setPage(1);
  }, [search, category, status]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" podcast'ini silmek istediğinizden emin misiniz?`)) return;
    try {
      await deletePodcast(id);
      toast.success('Podcast silindi');
      loadPodcasts();
    } catch (error) {
      console.error('Failed to delete podcast:', error);
      toast.error('Podcast silinemedi');
    }
  };

  const handleTogglePublish = async (podcast: Podcast) => {
    try {
      if (podcast.status === 'PUBLISHED') {
        await unpublishPodcast(podcast.id);
        toast.success('Podcast yayından kaldırıldı');
      } else {
        await publishPodcast(podcast.id);
        toast.success('Podcast yayınlandı');
      }
      loadPodcasts();
    } catch (error) {
      console.error('Failed to toggle publish:', error);
      toast.error('İşlem başarısız');
    }
  };

  const getStatusBadge = (podcastStatus: string) => {
    switch (podcastStatus) {
      case 'PUBLISHED':
        return <Badge className="bg-green-500/10 text-green-600">Yayında</Badge>;
      case 'DRAFT':
        return <Badge className="bg-yellow-500/10 text-yellow-600">Taslak</Badge>;
      case 'ARCHIVED':
        return <Badge className="bg-gray-500/10 text-gray-600">Arşiv</Badge>;
      default:
        return <Badge variant="outline">{podcastStatus}</Badge>;
    }
  };

  const getCategoryLabel = (cat: string) => {
    const found = CATEGORIES.find(c => c.value === cat);
    return found?.label || cat;
  };

  if (loading && podcasts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Podcast ara..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <Button onClick={() => router.push('/dashboard/podcasts/new')}>
          <IconPlus className="h-4 w-4 mr-2" />
          Yeni Podcast
        </Button>
      </div>

      {/* Table */}
      {podcasts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconMicrophone className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Henüz podcast bulunamadı</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push('/dashboard/podcasts/new')}
            >
              <IconPlus className="h-4 w-4 mr-2" />
              İlk Podcast&apos;i Oluştur
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Podcast</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Sunucu</TableHead>
                <TableHead className="text-center">Bölümler</TableHead>
                <TableHead className="text-center">Dinleme</TableHead>
                <TableHead className="text-center">Abone</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {podcasts.map((podcast) => (
                <TableRow
                  key={podcast.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/dashboard/podcasts/${podcast.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 rounded-lg">
                        <AvatarImage src={podcast.coverImage || undefined} />
                        <AvatarFallback className="rounded-lg bg-primary/10">
                          <IconMicrophone className="h-6 w-6 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium line-clamp-1">{podcast.title}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {podcast.shortDescription || podcast.description}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getCategoryLabel(podcast.category)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {podcast.host ? (
                        <>
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={podcast.host.avatarUrl || undefined} />
                            <AvatarFallback>
                              {(podcast.host.firstName?.[0] || '') + (podcast.host.lastName?.[0] || '')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">
                            {podcast.host.firstName} {podcast.host.lastName}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {podcast.hostName || 'Belirtilmedi'}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <IconHeadphones className="h-4 w-4 text-muted-foreground" />
                      <span>{podcast.totalEpisodes}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <IconChartBar className="h-4 w-4 text-muted-foreground" />
                      <span>{podcast.totalListens.toLocaleString('tr-TR')}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <IconUsers className="h-4 w-4 text-muted-foreground" />
                      <span>{podcast.subscriberCount.toLocaleString('tr-TR')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(podcast.status)}
                      {podcast.rssEnabled && (
                        <IconRss className="h-4 w-4 text-orange-500" title="RSS Aktif" />
                      )}
                    </div>
                  </TableCell>
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
                            router.push(`/dashboard/podcasts/${podcast.id}`);
                          }}
                        >
                          <IconEdit className="h-4 w-4 mr-2" />
                          Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/podcasts/${podcast.id}/episodes`);
                          }}
                        >
                          <IconHeadphones className="h-4 w-4 mr-2" />
                          Bölümler
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/podcasts/${podcast.id}/analytics`);
                          }}
                        >
                          <IconChartBar className="h-4 w-4 mr-2" />
                          Analitik
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePublish(podcast);
                          }}
                        >
                          {podcast.status === 'PUBLISHED' ? (
                            <>
                              <IconPlayerPause className="h-4 w-4 mr-2" />
                              Yayından Kaldır
                            </>
                          ) : (
                            <>
                              <IconPlayerPlay className="h-4 w-4 mr-2" />
                              Yayınla
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(podcast.id, podcast.title);
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
            Toplam {pagination.total} podcast
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
