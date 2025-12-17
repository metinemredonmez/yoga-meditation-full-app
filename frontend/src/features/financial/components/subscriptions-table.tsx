'use client';
import { useEffect, useState, useCallback } from 'react';
import { getSubscriptions, cancelSubscription } from '@/lib/api';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  IconDots,
  IconLoader2,
  IconSearch,
  IconX,
  IconCalendarPlus,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Subscription {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  planName: string;
  planTier: string;
  status: string;
  amount: number;
  currency: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  createdAt: string;
}

export function SubscriptionsTable() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [subscriptionToCancel, setSubscriptionToCancel] = useState<Subscription | null>(null);

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;

      const data = await getSubscriptions(params);
      setSubscriptions(data.subscriptions || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const handleCancel = async () => {
    if (!subscriptionToCancel) return;
    try {
      await cancelSubscription(subscriptionToCancel.id);
      toast.success('Subscription cancelled');
      loadSubscriptions();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setCancelDialogOpen(false);
      setSubscriptionToCancel(null);
    }
  };

  const getStatusBadgeColor = (status: string | null | undefined) => {
    if (!status) return 'bg-gray-500/10 text-gray-500';
    switch (status.toUpperCase()) {
      case 'ACTIVE': return 'bg-green-500/10 text-green-500';
      case 'CANCELLED': return 'bg-red-500/10 text-red-500';
      case 'EXPIRED': return 'bg-gray-500/10 text-gray-500';
      case 'PENDING': return 'bg-yellow-500/10 text-yellow-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getTierBadgeColor = (tier: string | null | undefined) => {
    if (!tier) return 'bg-gray-500/10 text-gray-500';
    switch (tier.toUpperCase()) {
      case 'FREE': return 'bg-gray-500/10 text-gray-500';
      case 'BASIC': return 'bg-blue-500/10 text-blue-500';
      case 'PREMIUM': return 'bg-purple-500/10 text-purple-500';
      case 'ENTERPRISE': return 'bg-amber-500/10 text-amber-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex flex-col sm:flex-row gap-4'>
        <div className='relative flex-1'>
          <IconSearch className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search by email or name...'
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
            <SelectItem value='ACTIVE'>Active</SelectItem>
            <SelectItem value='CANCELLED'>Cancelled</SelectItem>
            <SelectItem value='EXPIRED'>Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Auto Renew</TableHead>
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
            ) : subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className='text-center py-8 text-muted-foreground'>
                  No subscriptions found
                </TableCell>
              </TableRow>
            ) : (
              subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <div>
                      <p className='font-medium'>{sub.userName}</p>
                      <p className='text-sm text-muted-foreground'>{sub.userEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='flex flex-col gap-1'>
                      <span className='font-medium'>{sub.planName}</span>
                      <Badge className={getTierBadgeColor(sub.planTier)}>{sub.planTier}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(sub.status)}>{sub.status}</Badge>
                  </TableCell>
                  <TableCell>
                    ₺{sub.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className='text-sm'>
                      <div>{format(new Date(sub.startDate), 'MMM d, yyyy')}</div>
                      <div className='text-muted-foreground'>to {format(new Date(sub.endDate), 'MMM d, yyyy')}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={sub.autoRenew ? 'default' : 'outline'}>
                      {sub.autoRenew ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon'>
                          <IconDots className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem disabled>
                          <IconCalendarPlus className='mr-2 h-4 w-4' />
                          Extend
                        </DropdownMenuItem>
                        {sub.status === 'ACTIVE' && (
                          <DropdownMenuItem
                            className='text-destructive'
                            onClick={() => {
                              setSubscriptionToCancel(sub);
                              setCancelDialogOpen(true);
                            }}
                          >
                            <IconX className='mr-2 h-4 w-4' />
                            Cancel
                          </DropdownMenuItem>
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

      <div className='flex items-center justify-between'>
        <p className='text-sm text-muted-foreground'>
          Showing {subscriptions.length} of {totalCount} subscriptions
        </p>
        <div className='flex gap-2'>
          <Button variant='outline' size='sm' onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <Button variant='outline' size='sm' onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Next
          </Button>
        </div>
      </div>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this subscription for {subscriptionToCancel?.userEmail}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className='bg-destructive text-destructive-foreground'>
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
