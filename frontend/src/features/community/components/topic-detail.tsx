'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getForumTopicById,
  getForumPostsByTopic,
  updateForumTopic,
  deleteForumTopic,
  deleteForumPost,
} from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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
  IconArrowLeft,
  IconLoader2,
  IconEye,
  IconMessage,
  IconClock,
  IconUser,
  IconDots,
  IconTrash,
  IconPin,
  IconPinned,
  IconLock,
  IconLockOpen,
  IconStar,
  IconStarFilled,
  IconHeart,
  IconCheck,
} from '@tabler/icons-react';
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';

interface ForumPost {
  id: string;
  content: string;
  likeCount: number;
  isAcceptedAnswer: boolean;
  authorId: string;
  author?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

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
  tags?: Array<{ id: string; name: string; color: string }>;
  createdAt: string;
  updatedAt: string;
}

interface TopicDetailProps {
  id: string;
}

export function TopicDetail({ id }: TopicDetailProps) {
  const router = useRouter();
  const [topic, setTopic] = useState<ForumTopic | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTopicDialog, setDeleteTopicDialog] = useState(false);
  const [deletePostDialog, setDeletePostDialog] = useState(false);
  const [postToDelete, setPostToDelete] = useState<ForumPost | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [topicData, postsData] = await Promise.all([
        getForumTopicById(id),
        getForumPostsByTopic(id, { limit: 100 }),
      ]);
      setTopic(topicData.data);
      setPosts(postsData.data || []);
    } catch (error) {
      console.error('Failed to load topic:', error);
      toast.error('Konu yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePin = async () => {
    if (!topic) return;
    try {
      await updateForumTopic(topic.id, { isPinned: !topic.isPinned });
      toast.success(topic.isPinned ? 'Sabitleme kaldırıldı' : 'Konu sabitlendi');
      loadData();
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const handleToggleLock = async () => {
    if (!topic) return;
    try {
      await updateForumTopic(topic.id, { isLocked: !topic.isLocked });
      toast.success(topic.isLocked ? 'Kilit kaldırıldı' : 'Konu kilitlendi');
      loadData();
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const handleToggleFeatured = async () => {
    if (!topic) return;
    try {
      await updateForumTopic(topic.id, { isFeatured: !topic.isFeatured });
      toast.success(topic.isFeatured ? 'Öne çıkarma kaldırıldı' : 'Konu öne çıkarıldı');
      loadData();
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const handleDeleteTopic = async () => {
    if (!topic) return;
    try {
      await deleteForumTopic(topic.id);
      toast.success('Konu silindi');
      router.push('/dashboard/community/topics');
    } catch (error) {
      toast.error('Konu silinemedi');
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    try {
      await deleteForumPost(postToDelete.id);
      toast.success('Yanıt silindi');
      setDeletePostDialog(false);
      setPostToDelete(null);
      loadData();
    } catch (error) {
      toast.error('Yanıt silinemedi');
    }
  };

  const getAuthorName = (author?: { firstName: string | null; lastName: string | null; email: string }) => {
    if (author?.firstName && author?.lastName) {
      return `${author.firstName} ${author.lastName}`;
    }
    return author?.email?.split('@')[0] || 'Anonim';
  };

  const getInitials = (author?: { firstName: string | null; lastName: string | null; email: string }) => {
    if (author?.firstName && author?.lastName) {
      return `${author.firstName[0]}${author.lastName[0]}`.toUpperCase();
    }
    return author?.email?.substring(0, 2).toUpperCase() || 'AN';
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <IconLoader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className='flex flex-col items-center justify-center py-12'>
        <p className='text-muted-foreground mb-4'>Konu bulunamadı</p>
        <Button onClick={() => router.push('/dashboard/community/topics')}>
          <IconArrowLeft className='h-4 w-4 mr-2' />
          Konulara Dön
        </Button>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-start gap-4'>
        <Button variant='ghost' size='icon' onClick={() => router.push('/dashboard/community/topics')}>
          <IconArrowLeft className='h-4 w-4' />
        </Button>
        <div className='flex-1'>
          <div className='flex items-center gap-2 mb-2'>
            {topic.isPinned && <IconPinned className='h-5 w-5 text-blue-500' />}
            {topic.isLocked && <IconLock className='h-5 w-5 text-orange-500' />}
            {topic.isFeatured && <IconStarFilled className='h-5 w-5 text-yellow-500' />}
            <h2 className='text-2xl font-bold tracking-tight'>{topic.title}</h2>
          </div>
          <div className='flex items-center gap-3 text-sm text-muted-foreground'>
            {topic.category && (
              <Badge
                variant='outline'
                style={{ borderColor: topic.category.color, color: topic.category.color }}
              >
                {topic.category.name}
              </Badge>
            )}
            <span className='flex items-center gap-1'>
              <IconEye className='h-4 w-4' />
              {topic.viewCount} görüntülenme
            </span>
            <span className='flex items-center gap-1'>
              <IconMessage className='h-4 w-4' />
              {posts.length} yanıt
            </span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='icon'>
              <IconDots className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onClick={handleTogglePin}>
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
            <DropdownMenuItem onClick={handleToggleLock}>
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
            <DropdownMenuItem onClick={handleToggleFeatured}>
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
              onClick={() => setDeleteTopicDialog(true)}
            >
              <IconTrash className='mr-2 h-4 w-4' />
              Konuyu Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Topic Content */}
      <Card>
        <CardHeader>
          <div className='flex items-center gap-3'>
            <Avatar className='h-10 w-10'>
              <AvatarFallback>{getInitials(topic.author)}</AvatarFallback>
            </Avatar>
            <div>
              <p className='font-medium'>{getAuthorName(topic.author)}</p>
              <p className='text-xs text-muted-foreground'>
                {format(new Date(topic.createdAt), 'dd MMM yyyy HH:mm', { locale: tr })}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='prose prose-sm max-w-none dark:prose-invert'>
            {topic.content}
          </div>
          {topic.tags && topic.tags.length > 0 && (
            <div className='flex gap-2 mt-4'>
              {topic.tags.map((tag) => (
                <Badge key={tag.id} variant='secondary' style={{ backgroundColor: tag.color + '20', color: tag.color }}>
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Replies */}
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>Yanıtlar ({posts.length})</h3>

        {posts.length === 0 ? (
          <Card>
            <CardContent className='py-8 text-center text-muted-foreground'>
              Henüz yanıt yok
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className={post.isAcceptedAnswer ? 'border-green-500' : ''}>
              <CardHeader className='pb-2'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <Avatar className='h-8 w-8'>
                      <AvatarFallback className='text-xs'>{getInitials(post.author)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className='font-medium text-sm'>{getAuthorName(post.author)}</p>
                      <p className='text-xs text-muted-foreground'>
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: tr })}
                      </p>
                    </div>
                    {post.isAcceptedAnswer && (
                      <Badge className='bg-green-500/10 text-green-600'>
                        <IconCheck className='h-3 w-3 mr-1' />
                        Kabul Edildi
                      </Badge>
                    )}
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='flex items-center gap-1 text-sm text-muted-foreground'>
                      <IconHeart className='h-4 w-4' />
                      {post.likeCount}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon' className='h-8 w-8'>
                          <IconDots className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem
                          className='text-destructive'
                          onClick={() => {
                            setPostToDelete(post);
                            setDeletePostDialog(true);
                          }}
                        >
                          <IconTrash className='mr-2 h-4 w-4' />
                          Yanıtı Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className='prose prose-sm max-w-none dark:prose-invert'>
                  {post.content}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Topic Dialog */}
      <AlertDialog open={deleteTopicDialog} onOpenChange={setDeleteTopicDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konu Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu konuyu ve tüm yanıtlarını silmek istediğinize emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTopic} className='bg-destructive text-destructive-foreground'>
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Post Dialog */}
      <AlertDialog open={deletePostDialog} onOpenChange={setDeletePostDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Yanıt Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu yanıtı silmek istediğinize emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePost} className='bg-destructive text-destructive-foreground'>
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
