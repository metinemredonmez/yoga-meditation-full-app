'use client';
import { useEffect, useState, useCallback } from 'react';
import { getInstructors, approveInstructor, rejectInstructor } from '@/lib/api';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  IconDots,
  IconCheck,
  IconX,
  IconLoader2,
  IconEye,
  IconSearch,
  IconStar,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface Instructor {
  id: string;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  avatarUrl: string | null;
  bio: string | null;
  specialties: string[];
  rating: number | null;
  totalStudents: number;
  totalClasses: number;
  createdAt: string;
}

export function InstructorsTable() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Approve dialog
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [instructorToApprove, setInstructorToApprove] = useState<Instructor | null>(null);

  // Reject dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [instructorToReject, setInstructorToReject] = useState<Instructor | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadInstructors = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;

      const data = await getInstructors(params);
      setInstructors(data.instructors || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to load instructors:', error);
      toast.error('Failed to load instructors');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    loadInstructors();
  }, [loadInstructors]);

  const handleApprove = async () => {
    if (!instructorToApprove) return;
    try {
      await approveInstructor(instructorToApprove.id);
      toast.success('Instructor approved successfully');
      loadInstructors();
    } catch (error) {
      console.error('Failed to approve instructor:', error);
      toast.error('Failed to approve instructor');
    } finally {
      setApproveDialogOpen(false);
      setInstructorToApprove(null);
    }
  };

  const handleReject = async () => {
    if (!instructorToReject) return;
    try {
      await rejectInstructor(instructorToReject.id, rejectReason);
      toast.success('Instructor rejected');
      loadInstructors();
    } catch (error) {
      console.error('Failed to reject instructor:', error);
      toast.error('Failed to reject instructor');
    } finally {
      setRejectDialogOpen(false);
      setInstructorToReject(null);
      setRejectReason('');
    }
  };

  const getInitials = (instructor: Instructor) => {
    if (instructor.firstName && instructor.lastName) {
      return `${instructor.firstName[0]}${instructor.lastName[0]}`.toUpperCase();
    }
    return instructor.email.substring(0, 2).toUpperCase();
  };

  const getDisplayName = (instructor: Instructor) => {
    if (instructor.firstName && instructor.lastName) {
      return `${instructor.firstName} ${instructor.lastName}`;
    }
    return instructor.email.split('@')[0];
  };

  const getStatusBadgeColor = (status: string | null | undefined) => {
    if (!status) return 'bg-gray-500/10 text-gray-500';
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return 'bg-green-500/10 text-green-500';
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'REJECTED':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className='space-y-4'>
      {/* Filters */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div className='relative flex-1'>
          <IconSearch className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search instructors...'
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className='pl-9'
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className='w-[150px]'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Status</SelectItem>
            <SelectItem value='PENDING'>Pending</SelectItem>
            <SelectItem value='APPROVED'>Approved</SelectItem>
            <SelectItem value='REJECTED'>Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Instructor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Specialties</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Classes</TableHead>
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
            ) : instructors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className='text-center py-8 text-muted-foreground'>
                  No instructors found
                </TableCell>
              </TableRow>
            ) : (
              instructors.map((instructor) => (
                <TableRow key={instructor.id}>
                  <TableCell>
                    <div className='flex items-center gap-3'>
                      <Avatar className='h-8 w-8'>
                        <AvatarImage src={instructor.avatarUrl || undefined} />
                        <AvatarFallback>{getInitials(instructor)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className='font-medium'>{getDisplayName(instructor)}</p>
                        <p className='text-sm text-muted-foreground'>{instructor.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(instructor.status)}>
                      {instructor.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className='flex flex-wrap gap-1'>
                      {(instructor.specialties || []).slice(0, 2).map((s, i) => (
                        <Badge key={i} variant='outline' className='text-xs'>
                          {s}
                        </Badge>
                      ))}
                      {(instructor.specialties || []).length > 2 && (
                        <Badge variant='outline' className='text-xs'>
                          +{instructor.specialties.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {instructor.rating ? (
                      <div className='flex items-center gap-1'>
                        <IconStar className='h-4 w-4 text-yellow-500 fill-yellow-500' />
                        <span>{instructor.rating.toFixed(1)}</span>
                      </div>
                    ) : (
                      <span className='text-muted-foreground'>N/A</span>
                    )}
                  </TableCell>
                  <TableCell>{instructor.totalStudents || 0}</TableCell>
                  <TableCell>{instructor.totalClasses || 0}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon'>
                          <IconDots className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/instructors/${instructor.id}`}>
                            <IconEye className='mr-2 h-4 w-4' />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        {instructor.status === 'PENDING' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setInstructorToApprove(instructor);
                                setApproveDialogOpen(true);
                              }}
                            >
                              <IconCheck className='mr-2 h-4 w-4' />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className='text-destructive'
                              onClick={() => {
                                setInstructorToReject(instructor);
                                setRejectDialogOpen(true);
                              }}
                            >
                              <IconX className='mr-2 h-4 w-4' />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
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
          Showing {instructors.length} of {totalCount} instructors
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

      {/* Approve Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Instructor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve {instructorToApprove?.email} as an instructor?
              They will be able to create and manage classes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Instructor Application</DialogTitle>
          </DialogHeader>
          <div className='py-4'>
            <Textarea
              placeholder='Reason for rejection (optional)'
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleReject}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
