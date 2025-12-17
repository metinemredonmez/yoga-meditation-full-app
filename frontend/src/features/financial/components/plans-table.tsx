'use client';
import { useEffect, useState } from 'react';
import { getSubscriptionPlans, deleteSubscriptionPlan } from '@/lib/api';
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
import { IconDots, IconEdit, IconTrash, IconPlus, IconLoader2, IconCheck } from '@tabler/icons-react';
import { PlanFormDialog } from './plan-form-dialog';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  tier: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  isActive: boolean;
  subscriberCount: number;
  createdAt: string;
}

export function PlansTable() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const data = await getSubscriptionPlans();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Failed to load plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan: Plan) => {
    setSelectedPlan(plan);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!planToDelete) return;
    try {
      await deleteSubscriptionPlan(planToDelete.id);
      toast.success('Plan deleted successfully');
      loadPlans();
    } catch (error) {
      console.error('Failed to delete plan:', error);
      toast.error('Failed to delete plan');
    } finally {
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  const handleDialogClose = (refresh?: boolean) => {
    setDialogOpen(false);
    setSelectedPlan(null);
    if (refresh) loadPlans();
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
      <div className='flex justify-end'>
        <Button onClick={() => setDialogOpen(true)}>
          <IconPlus className='mr-2 h-4 w-4' />
          Add Plan
        </Button>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Monthly</TableHead>
              <TableHead>Yearly</TableHead>
              <TableHead>Features</TableHead>
              <TableHead>Subscribers</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='w-[70px]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className='text-center py-8'>
                  <IconLoader2 className='h-6 w-6 animate-spin mx-auto' />
                </TableCell>
              </TableRow>
            ) : plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className='text-center py-8 text-muted-foreground'>
                  No plans found
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className='font-medium'>{plan.name}</TableCell>
                  <TableCell>
                    <Badge className={getTierBadgeColor(plan.tier)}>{plan.tier}</Badge>
                  </TableCell>
                  <TableCell>₺{plan.priceMonthly.toLocaleString()}/mo</TableCell>
                  <TableCell>₺{plan.priceYearly.toLocaleString()}/yr</TableCell>
                  <TableCell>
                    <div className='flex flex-wrap gap-1 max-w-[200px]'>
                      {plan.features.slice(0, 2).map((f, i) => (
                        <Badge key={i} variant='outline' className='text-xs'>
                          <IconCheck className='h-3 w-3 mr-1' />
                          {f}
                        </Badge>
                      ))}
                      {plan.features.length > 2 && (
                        <Badge variant='outline' className='text-xs'>
                          +{plan.features.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{plan.subscriberCount || 0}</TableCell>
                  <TableCell>
                    <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                      {plan.isActive ? 'Active' : 'Inactive'}
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
                        <DropdownMenuItem onClick={() => handleEdit(plan)}>
                          <IconEdit className='mr-2 h-4 w-4' />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className='text-destructive'
                          onClick={() => {
                            setPlanToDelete(plan);
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

      <PlanFormDialog open={dialogOpen} onClose={handleDialogClose} plan={selectedPlan} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{planToDelete?.name}&quot;? This action cannot be undone.
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
