'use client';
import { useEffect, useState } from 'react';
import { getPoses, deletePose } from '@/lib/api';
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
import { PoseFormDialog } from './pose-form-dialog';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface Pose {
  id: string;
  name: string;
  sanskritName: string | null;
  description: string | null;
  difficulty: string;
  benefits: string[];
  imageUrl: string | null;
  videoUrl: string | null;
  createdAt: string;
}

export function PosesTable() {
  const [poses, setPoses] = useState<Pose[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPose, setSelectedPose] = useState<Pose | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [poseToDelete, setPoseToDelete] = useState<Pose | null>(null);

  useEffect(() => {
    loadPoses();
  }, [page, search]);

  const loadPoses = async () => {
    setLoading(true);
    try {
      const data = await getPoses({ page, limit: 10, search });
      setPoses(data.poses || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to load poses:', error);
      toast.error('Failed to load poses');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pose: Pose) => {
    setSelectedPose(pose);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!poseToDelete) return;
    try {
      await deletePose(poseToDelete.id);
      toast.success('Pose deleted successfully');
      loadPoses();
    } catch (error) {
      console.error('Failed to delete pose:', error);
      toast.error('Failed to delete pose');
    } finally {
      setDeleteDialogOpen(false);
      setPoseToDelete(null);
    }
  };

  const handleDialogClose = (refresh?: boolean) => {
    setDialogOpen(false);
    setSelectedPose(null);
    if (refresh) loadPoses();
  };

  const getDifficultyColor = (difficulty: string | null | undefined) => {
    if (!difficulty) return 'bg-gray-500/10 text-gray-500';
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-500/10 text-green-500';
      case 'intermediate':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'advanced':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <Input
          placeholder='Search poses...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='max-w-sm'
        />
        <Button onClick={() => setDialogOpen(true)}>
          <IconPlus className='mr-2 h-4 w-4' />
          Add Pose
        </Button>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Sanskrit Name</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Benefits</TableHead>
              <TableHead className='w-[70px]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className='text-center py-8'>
                  <IconLoader2 className='h-6 w-6 animate-spin mx-auto' />
                </TableCell>
              </TableRow>
            ) : poses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className='text-center py-8 text-muted-foreground'>
                  No poses found
                </TableCell>
              </TableRow>
            ) : (
              poses.map((pose) => (
                <TableRow key={pose.id}>
                  <TableCell className='font-medium'>{pose.name}</TableCell>
                  <TableCell>{pose.sanskritName || '-'}</TableCell>
                  <TableCell>
                    <Badge className={getDifficultyColor(pose.difficulty)}>
                      {pose.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className='flex gap-1 flex-wrap'>
                      {(pose.benefits || []).slice(0, 2).map((benefit, i) => (
                        <Badge key={i} variant='outline' className='text-xs'>
                          {benefit}
                        </Badge>
                      ))}
                      {(pose.benefits || []).length > 2 && (
                        <Badge variant='outline' className='text-xs'>
                          +{pose.benefits.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon'>
                          <IconDots className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem onClick={() => handleEdit(pose)}>
                          <IconEdit className='mr-2 h-4 w-4' />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className='text-destructive'
                          onClick={() => {
                            setPoseToDelete(pose);
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

      <PoseFormDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        pose={selectedPose}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pose</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{poseToDelete?.name}&quot;? This action cannot be undone.
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
