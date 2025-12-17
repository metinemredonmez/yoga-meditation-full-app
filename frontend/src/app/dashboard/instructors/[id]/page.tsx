'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import {
  getInstructorById,
  approveInstructor,
  rejectInstructor,
  getInstructorEarnings,
  createInstructorPayout,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  IconArrowLeft,
  IconCheck,
  IconX,
  IconLoader2,
  IconMail,
  IconCalendar,
  IconStar,
  IconUsers,
  IconCurrencyLira,
  IconCreditCard,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Link from 'next/link';

interface InstructorDetail {
  id: string;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  avatarUrl: string | null;
  bio: string | null;
  specialties: string[];
  certifications: string[];
  rating: number | null;
  totalStudents: number;
  totalClasses: number;
  totalEarnings: number;
  pendingPayout: number;
  createdAt: string;
}

interface Earnings {
  totalEarnings: number;
  pendingPayout: number;
  paidOut: number;
  lastPayoutDate: string | null;
}

export default function InstructorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const instructorId = params.id as string;

  const [instructor, setInstructor] = useState<InstructorDetail | null>(null);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');

  useEffect(() => {
    loadInstructor();
  }, [instructorId]);

  const loadInstructor = async () => {
    setLoading(true);
    try {
      const data = await getInstructorById(instructorId);
      setInstructor(data);

      // Load earnings
      try {
        const earningsData = await getInstructorEarnings(instructorId);
        setEarnings(earningsData);
      } catch {
        // Earnings might not be available
      }
    } catch (error) {
      console.error('Failed to load instructor:', error);
      toast.error('Failed to load instructor details');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!instructor) return;
    try {
      await approveInstructor(instructor.id);
      toast.success('Instructor approved successfully');
      loadInstructor();
    } catch (error) {
      console.error('Failed to approve instructor:', error);
      toast.error('Failed to approve instructor');
    } finally {
      setApproveDialogOpen(false);
    }
  };

  const handleReject = async () => {
    if (!instructor) return;
    try {
      await rejectInstructor(instructor.id, rejectReason);
      toast.success('Instructor rejected');
      loadInstructor();
    } catch (error) {
      console.error('Failed to reject instructor:', error);
      toast.error('Failed to reject instructor');
    } finally {
      setRejectDialogOpen(false);
      setRejectReason('');
    }
  };

  const handlePayout = async () => {
    if (!instructor || !payoutAmount) return;
    try {
      await createInstructorPayout(instructor.id, parseFloat(payoutAmount));
      toast.success('Payout created successfully');
      loadInstructor();
    } catch (error) {
      console.error('Failed to create payout:', error);
      toast.error('Failed to create payout');
    } finally {
      setPayoutDialogOpen(false);
      setPayoutAmount('');
    }
  };

  const getInitials = (instructor: InstructorDetail) => {
    if (instructor.firstName && instructor.lastName) {
      return `${instructor.firstName[0]}${instructor.lastName[0]}`.toUpperCase();
    }
    return instructor.email.substring(0, 2).toUpperCase();
  };

  const getDisplayName = (instructor: InstructorDetail) => {
    if (instructor.firstName && instructor.lastName) {
      return `${instructor.firstName} ${instructor.lastName}`;
    }
    return instructor.email.split('@')[0];
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED': return 'bg-green-500/10 text-green-500';
      case 'PENDING': return 'bg-yellow-500/10 text-yellow-500';
      case 'REJECTED': return 'bg-red-500/10 text-red-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className='flex items-center justify-center h-96'>
          <IconLoader2 className='h-8 w-8 animate-spin' />
        </div>
      </PageContainer>
    );
  }

  if (!instructor) {
    return (
      <PageContainer>
        <div className='flex flex-col items-center justify-center h-96 gap-4'>
          <p className='text-muted-foreground'>Instructor not found</p>
          <Button variant='outline' onClick={() => router.back()}>
            <IconArrowLeft className='mr-2 h-4 w-4' />
            Go Back
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        {/* Header */}
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' asChild>
            <Link href='/dashboard/instructors'>
              <IconArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
          <div className='flex-1'>
            <h2 className='text-2xl font-bold tracking-tight'>Instructor Details</h2>
            <p className='text-muted-foreground'>View and manage instructor information</p>
          </div>
        </div>

        {/* Instructor Profile Card */}
        <Card>
          <CardContent className='pt-6'>
            <div className='flex flex-col md:flex-row gap-6'>
              <Avatar className='h-24 w-24'>
                <AvatarImage src={instructor.avatarUrl || undefined} />
                <AvatarFallback className='text-2xl'>{getInitials(instructor)}</AvatarFallback>
              </Avatar>
              <div className='flex-1 space-y-4'>
                <div>
                  <h3 className='text-xl font-semibold'>{getDisplayName(instructor)}</h3>
                  <p className='text-muted-foreground'>{instructor.email}</p>
                </div>
                <div className='flex flex-wrap gap-2'>
                  <Badge className={getStatusBadgeColor(instructor.status)}>{instructor.status}</Badge>
                  {instructor.rating && (
                    <Badge variant='outline' className='gap-1'>
                      <IconStar className='h-3 w-3 text-yellow-500 fill-yellow-500' />
                      {instructor.rating.toFixed(1)}
                    </Badge>
                  )}
                </div>
                <div className='flex flex-wrap gap-4 text-sm text-muted-foreground'>
                  <div className='flex items-center gap-1'>
                    <IconMail className='h-4 w-4' />
                    {instructor.email}
                  </div>
                  <div className='flex items-center gap-1'>
                    <IconCalendar className='h-4 w-4' />
                    Applied {format(new Date(instructor.createdAt), 'MMM d, yyyy')}
                  </div>
                  <div className='flex items-center gap-1'>
                    <IconUsers className='h-4 w-4' />
                    {instructor.totalStudents} students
                  </div>
                </div>
                {instructor.specialties && instructor.specialties.length > 0 && (
                  <div className='flex flex-wrap gap-2'>
                    {instructor.specialties.map((s, i) => (
                      <Badge key={i} variant='secondary'>
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className='flex flex-col gap-2'>
                {instructor.status === 'PENDING' && (
                  <>
                    <Button onClick={() => setApproveDialogOpen(true)}>
                      <IconCheck className='mr-2 h-4 w-4' />
                      Approve
                    </Button>
                    <Button variant='destructive' onClick={() => setRejectDialogOpen(true)}>
                      <IconX className='mr-2 h-4 w-4' />
                      Reject
                    </Button>
                  </>
                )}
                {instructor.status === 'APPROVED' && (
                  <Button variant='outline' onClick={() => setPayoutDialogOpen(true)}>
                    <IconCreditCard className='mr-2 h-4 w-4' />
                    Create Payout
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className='grid gap-4 md:grid-cols-4'>
          <Card>
            <CardHeader className='pb-2'>
              <CardDescription>Total Students</CardDescription>
              <CardTitle className='text-3xl'>{instructor.totalStudents || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardDescription>Total Classes</CardDescription>
              <CardTitle className='text-3xl'>{instructor.totalClasses || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardDescription>Total Earnings</CardDescription>
              <CardTitle className='text-3xl flex items-center gap-1'>
                <IconCurrencyLira className='h-6 w-6' />
                {(earnings?.totalEarnings || instructor.totalEarnings || 0).toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardDescription>Pending Payout</CardDescription>
              <CardTitle className='text-3xl flex items-center gap-1'>
                <IconCurrencyLira className='h-6 w-6' />
                {(earnings?.pendingPayout || instructor.pendingPayout || 0).toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue='bio' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='bio'>Bio & Certifications</TabsTrigger>
            <TabsTrigger value='classes'>Classes</TabsTrigger>
            <TabsTrigger value='earnings'>Earnings</TabsTrigger>
          </TabsList>

          <TabsContent value='bio' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle>Bio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-muted-foreground'>
                  {instructor.bio || 'No bio provided'}
                </p>
              </CardContent>
            </Card>

            {instructor.certifications && instructor.certifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Certifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex flex-wrap gap-2'>
                    {instructor.certifications.map((cert, i) => (
                      <Badge key={i} variant='outline'>
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value='classes'>
            <Card>
              <CardHeader>
                <CardTitle>Classes</CardTitle>
                <CardDescription>Classes taught by this instructor</CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-muted-foreground text-center py-8'>
                  Classes list coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='earnings'>
            <Card>
              <CardHeader>
                <CardTitle>Earnings History</CardTitle>
                <CardDescription>Payout history and earnings breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-muted-foreground text-center py-8'>
                  Earnings history coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Approve Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Instructor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve {instructor.email} as an instructor?
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
            <DialogTitle>Reject Application</DialogTitle>
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

      {/* Payout Dialog */}
      <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Payout</DialogTitle>
          </DialogHeader>
          <div className='py-4 space-y-4'>
            <div className='space-y-2'>
              <Label>Amount (₺)</Label>
              <Input
                type='number'
                placeholder='0.00'
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
              />
            </div>
            <p className='text-sm text-muted-foreground'>
              Available balance: ₺{(earnings?.pendingPayout || 0).toLocaleString()}
            </p>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setPayoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePayout} disabled={!payoutAmount || parseFloat(payoutAmount) <= 0}>
              Create Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
