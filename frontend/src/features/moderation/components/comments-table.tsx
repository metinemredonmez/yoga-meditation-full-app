'use client';
import { useEffect, useState, useCallback } from 'react';
import { getModerationComments, deleteComment, hideComment } from '@/lib/api';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { IconDots, IconLoader2, IconSearch, IconTrash, IconEyeOff } from '@tabler/icons-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  content: string;
  userEmail: string;
  userName: string;
  contentType: string;
  contentTitle: string;
  status: string;
  flagCount: number;
  createdAt: string;
}

export function CommentsTable() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;

      const data = await getModerationComments(params);
      setComments(data.comments || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to load comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleDelete = async () => {
    if (!commentToDelete) return;
    try {
      await deleteComment(commentToDelete.id);
      toast.success('Comment deleted');
      loadComments();
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment');
    } finally {
      setDeleteDialogOpen(false);
      setCommentToDelete(null);
    }
  };

  const handleHide = async (comment: Comment) => {
    try {
      await hideComment(comment.id);
      toast.success('Comment hidden');
      loadComments();
    } catch (error) {
      console.error('Failed to hide comment:', error);
      toast.error('Failed to hide comment');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'VISIBLE': return 'bg-green-500/10 text-green-500';
      case 'HIDDEN': return 'bg-yellow-500/10 text-yellow-500';
      case 'DELETED': return 'bg-red-500/10 text-red-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex flex-col sm:flex-row gap-4'>
        <div className='relative flex-1'>
          <IconSearch className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search comments...'
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className='pl-9'
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className='w-[150px]'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Status</SelectItem>
            <SelectItem value='VISIBLE'>Visible</SelectItem>
            <SelectItem value='HIDDEN'>Hidden</SelectItem>
            <SelectItem value='FLAGGED'>Flagged</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Content</TableHead>
              <TableHead>User</TableHead>
              <TableHead>On</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className='w-[70px]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className='text-center py-8'>
                  <IconLoader2 className='h-6 w-6 animate-spin mx-auto' />
                </TableCell>
              </TableRow>
            ) : comments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className='text-center py-8 text-muted-foreground'>
                  No comments found
                </TableCell>
              </TableRow>
            ) : (
              comments.map((comment) => (
                <TableRow key={comment.id}>
                  <TableCell className='max-w-[300px]'>
                    <p className='text-sm truncate'>{comment.content}</p>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className='font-medium text-sm'>{comment.userName}</p>
                      <p className='text-xs text-muted-foreground'>{comment.userEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className='text-sm font-medium'>{comment.contentType}</p>
                      <p className='text-xs text-muted-foreground truncate max-w-[150px]'>{comment.contentTitle}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(comment.status)}>{comment.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {comment.flagCount > 0 ? (
                      <Badge variant='destructive'>{comment.flagCount}</Badge>
                    ) : (
                      <span className='text-muted-foreground'>0</span>
                    )}
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon'>
                          <IconDots className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        {comment.status !== 'HIDDEN' && (
                          <DropdownMenuItem onClick={() => handleHide(comment)}>
                            <IconEyeOff className='mr-2 h-4 w-4' />
                            Hide
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className='text-destructive'
                          onClick={() => {
                            setCommentToDelete(comment);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <IconTrash className='mr-2 h-4 w-4' />
                          Delete
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

      <div className='flex items-center justify-between'>
        <p className='text-sm text-muted-foreground'>Showing {comments.length} of {totalCount} comments</p>
        <div className='flex gap-2'>
          <Button variant='outline' size='sm' onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
          <Button variant='outline' size='sm' onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className='bg-destructive text-destructive-foreground'>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
