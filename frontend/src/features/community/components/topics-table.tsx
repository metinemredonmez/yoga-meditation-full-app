'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getForumTopics,
  getForumCategories,
  updateForumTopic,
  deleteForumTopic,
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  IconLoader2,
  IconSearch,
  IconDots,
  IconEye,
  IconTrash,
  IconPin,
  IconPinned,
  IconLock,
  IconLockOpen,
  IconStar,
  IconStarFilled,
  IconMessage,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import Link from 'next/link';

interface ForumTopic {
  id: string;
  title: string;
  slug: string;
  content: string;
  viewCount: number;
  replyCount: number;
  isPinned: boolean;
  isLocked: boolean;
  isFeatured: boolean;
  authorId: string;
  categoryId: string;
  author?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  category?: {
    id: string;
    name: string;
    color: string;
  };
  _count?: {
    posts: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface ForumCategory {
  id: string;
  name: string;
  slug: string;
}

export function TopicsTable() {
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<ForumTopic | null>(null);

  const loadCategories = async () => {
    try {
      const data = await getForumCategories();
      setCategories(data.data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadTopics = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 20 };
      if (search) params.search = search;
      if (categoryFilter !== 'all') params.categoryId = categoryFilter;
      if (statusFilter === 'pinned') params.isPinned = true;
      if (statusFilter === 'locked') params.isLocked = true;
      if (statusFilter === 'featured') params.isFeatured = true;

      const data = await getForumTopics(params);
      setTopics(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to load topics:', error);
      toast.error('Konular yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, statusFilter]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  const handleTogglePin = async (topic: ForumTopic) => {
    try {
      await updateForumTopic(topic.id, { isPinned: !topic.isPinned });
      toast.success(topic.isPinned ? 'Sabitleme kaldırıldı' : 'Konu sabitlendi');
      loadTopics();
    } catch (error) {
      console.error('Failed to toggle pin:', error);
      toast.error('İşlem başarısız');
    }
  };

  const handleToggleLock = async (topic: ForumTopic) => {
    try {
      await updateForumTopic(topic.id, { isLocked: !topic.isLocked });
      toast.success(topic.isLocked ? 'Kilit kaldırıldı' : 'Konu kilitlendi');
      loadTopics();
    } catch (error) {
      console.error('Failed to toggle lock:', error);
      toast.error('İşlem başarısız');
    }
  };

  const handleToggleFeatured = async (topic: ForumTopic) => {
    try {
      await updateForumTopic(topic.id, { isFeatured: !topic.isFeatured });
      toast.success(topic.isFeatured ? 'Öne çıkarma kaldırıldı' : 'Konu öne çıkarıldı');
      loadTopics();
    } catch (error) {
      console.error('Failed to toggle featured:', error);
      toast.error('İşlem başarısız');
    }
  };

  const handleDelete = async () => {
    if (!topicToDelete) return;
    try {
      await deleteForumTopic(topicToDelete.id);
      toast.success('Konu silindi');
      setDeleteDialogOpen(false);
      setTopicToDelete(null);
      loadTopics();
    } catch (error) {
      console.error('Failed to delete topic:', error);
      toast.error('Konu silinemedi');
    }
  };

  const getAuthorName = (topic: ForumTopic) => {
    if (topic.author?.firstName && topic.author?.lastName) {
      return `${topic.author.firstName} ${topic.author.lastName}`;
    }
    return topic.author?.email?.split('@')[0] || 'Anonim';
  };

  const getInitials = (topic: ForumTopic) => {
    if (topic.author?.firstName && topic.author?.lastName) {
      return `${topic.author.firstName[0]}${topic.author.lastName[0]}`.toUpperCase();
    }
    return topic.author?.email?.substring(0, 2).toUpperCase() || 'AN';
  };

  return (
    <div className='space-y-4'>
      {/* Filters */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div className='relative flex-1'>
          <IconSearch className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Konu ara...'
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className='pl-9'
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Kategori' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Tüm Kategoriler</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className='w-[150px]'>
            <SelectValue placeholder='Durum' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Tümü</SelectItem>
            <SelectItem value='pinned'>Sabitlenmiş</SelectItem>
            <SelectItem value='locked'>Kilitli</SelectItem>
            <SelectItem value='featured'>Öne Çıkan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Konu</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Yazar</TableHead>
              <TableHead>Yanıt</TableHead>
              <TableHead>Görüntülenme</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead className='w-[70px]'>İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className='text-center py-8'>
                  <IconLoader2 className='h-6 w-6 animate-spin mx-auto' />
                </TableCell>
              </TableRow>
            ) : topics.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className='text-center py-8 text-muted-foreground'>
                  Konu bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              topics.map((topic) => (
                <TableRow key={topic.id}>
                  <TableCell>
                    <div className='flex items-start gap-2'>
                      <div className='flex flex-col gap-1'>
                        <div className='flex items-center gap-2'>
                          {topic.isPinned && <IconPinned className='h-4 w-4 text-blue-500' />}
                          {topic.isLocked && <IconLock className='h-4 w-4 text-orange-500' />}
                          {topic.isFeatured && <IconStarFilled className='h-4 w-4 text-yellow-500' />}
                          <Link
                            href={`/dashboard/community/topics/${topic.id}`}
                            className='font-medium hover:underline line-clamp-1'
                          >
                            {topic.title}
                          </Link>
                        </div>
                        <p className='text-xs text-muted-foreground line-clamp-1'>
                          {topic.content.substring(0, 100)}...
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {topic.category && (
                      <Badge
                        variant='outline'
                        style={{ borderColor: topic.category.color, color: topic.category.color }}
                      >
                        {topic.category.name}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <Avatar className='h-6 w-6'>
                        <AvatarFallback className='text-xs'>{getInitials(topic)}</AvatarFallback>
                      </Avatar>
                      <span className='text-sm'>{getAuthorName(topic)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-1'>
                      <IconMessage className='h-4 w-4 text-muted-foreground' />
                      {topic._count?.posts || topic.replyCount || 0}
                    </div>
                  </TableCell>
                  <TableCell>{topic.viewCount}</TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    {formatDistanceToNow(new Date(topic.createdAt), {
                      addSuffix: true,
                      locale: tr,
                    })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon'>
                          <IconDots className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/community/topics/${topic.id}`}>
                            <IconEye className='mr-2 h-4 w-4' />
                            Görüntüle
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleTogglePin(topic)}>
                          {topic.isPinned ? (
                            <>
                              <IconPin className='mr-2 h-4 w-4' />
                              Sabitlemeyi Kaldır
                            </>
                          ) : (
                            <>
                              <IconPinned className='mr-2 h-4 w-4' />
                              Sabitle
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleLock(topic)}>
                          {topic.isLocked ? (
                            <>
                              <IconLockOpen className='mr-2 h-4 w-4' />
                              Kilidi Kaldır
                            </>
                          ) : (
                            <>
                              <IconLock className='mr-2 h-4 w-4' />
                              Kilitle
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleFeatured(topic)}>
                          {topic.isFeatured ? (
                            <>
                              <IconStar className='mr-2 h-4 w-4' />
                              Öne Çıkarmayı Kaldır
                            </>
                          ) : (
                            <>
                              <IconStarFilled className='mr-2 h-4 w-4' />
                              Öne Çıkar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className='text-destructive'
                          onClick={() => {
                            setTopicToDelete(topic);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <IconTrash className='mr-2 h-4 w-4' />
                          Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className='flex items-center justify-between'>
        <p className='text-sm text-muted-foreground'>
          {totalCount} konudan {topics.length} tanesi gösteriliyor
        </p>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Önceki
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Sonraki
          </Button>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konu Sil</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{topicToDelete?.title}&quot; konusunu silmek istediğinize emin misiniz?
              Bu işlem tüm yanıtları da silecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className='bg-destructive text-destructive-foreground'>
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
