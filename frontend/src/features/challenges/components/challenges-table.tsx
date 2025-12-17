'use client';
import { useEffect, useState } from 'react';
import { getChallenges, deleteChallenge } from '@/lib/api';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { IconDots, IconEdit, IconTrash, IconPlus, IconLoader2 } from '@tabler/icons-react';
import { ChallengeFormDialog } from './challenge-form-dialog';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  dailyGoal: number;
  rewardXp: number;
  participantCount?: number;
  createdAt: string;
}

export function ChallengesTable() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [challengeToDelete, setChallengeToDelete] = useState<Challenge | null>(null);

  useEffect(() => {
    loadChallenges();
  }, [page, search]);

  const loadChallenges = async () => {
    setLoading(true);
    try {
      const data = await getChallenges({ page, limit: 10, search });
      setChallenges(data.challenges || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to load challenges:', error);
      toast.error('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!challengeToDelete) return;
    try {
      await deleteChallenge(challengeToDelete.id);
      toast.success('Challenge deleted successfully');
      loadChallenges();
    } catch (error) {
      console.error('Failed to delete challenge:', error);
      toast.error('Failed to delete challenge');
    } finally {
      setDeleteDialogOpen(false);
      setChallengeToDelete(null);
    }
  };

  const handleDialogClose = (refresh?: boolean) => {
    setDialogOpen(false);
    setSelectedChallenge(null);
    if (refresh) loadChallenges();
  };

  const getChallengeStatus = (challenge: Challenge) => {
    const now = new Date();
    const start = new Date(challenge.startAt);
    const end = new Date(challenge.endAt);

    if (now < start) return { label: 'Upcoming', color: 'bg-blue-500/10 text-blue-500' };
    if (now > end) return { label: 'Ended', color: 'bg-gray-500/10 text-gray-500' };
    return { label: 'Active', color: 'bg-green-500/10 text-green-500' };
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <Input
          placeholder='Search challenges...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='max-w-sm'
        />
        <Button onClick={() => setDialogOpen(true)}>
          <IconPlus className='mr-2 h-4 w-4' />
          Add Challenge
        </Button>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Daily Goal</TableHead>
              <TableHead>Reward XP</TableHead>
              <TableHead className='w-[70px]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className='text-center py-8'>
                  <IconLoader2 className='h-6 w-6 animate-spin mx-auto' />
                </TableCell>
              </TableRow>
            ) : challenges.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='text-center py-8 text-muted-foreground'>
                  No challenges found
                </TableCell>
              </TableRow>
            ) : (
              challenges.map((challenge) => {
                const status = getChallengeStatus(challenge);
                return (
                  <TableRow key={challenge.id}>
                    <TableCell className='font-medium'>{challenge.title}</TableCell>
                    <TableCell>
                      <Badge className={status.color}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className='text-sm'>
                        <div>{format(new Date(challenge.startAt), 'MMM d, yyyy')}</div>
                        <div className='text-muted-foreground'>
                          to {format(new Date(challenge.endAt), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{challenge.dailyGoal} min</TableCell>
                    <TableCell>{challenge.rewardXp} XP</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='icon'>
                            <IconDots className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem onClick={() => handleEdit(challenge)}>
                            <IconEdit className='mr-2 h-4 w-4' />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className='text-destructive'
                            onClick={() => {
                              setChallengeToDelete(challenge);
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
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className='flex items-center justify-between'>
        <p className='text-sm text-muted-foreground'>
          Page {page} of {totalPages}
        </p>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      <ChallengeFormDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        challenge={selectedChallenge}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Challenge</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{challengeToDelete?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className='bg-destructive text-destructive-foreground'>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
