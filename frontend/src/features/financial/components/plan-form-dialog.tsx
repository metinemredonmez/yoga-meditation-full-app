'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createSubscriptionPlan, updateSubscriptionPlan } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { IconLoader2, IconX, IconPlus } from '@tabler/icons-react';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  tier: z.string().min(1, 'Tier is required'),
  priceMonthly: z.number().min(0, 'Price must be positive'),
  priceYearly: z.number().min(0, 'Price must be positive'),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface Plan {
  id: string;
  name: string;
  tier: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  isActive: boolean;
}

interface PlanFormDialogProps {
  open: boolean;
  onClose: (refresh?: boolean) => void;
  plan: Plan | null;
}

export function PlanFormDialog({ open, onClose, plan }: PlanFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');
  const isEditing = !!plan;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      tier: 'BASIC',
      priceMonthly: 0,
      priceYearly: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (plan) {
      form.reset({
        name: plan.name,
        tier: plan.tier,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        isActive: plan.isActive,
      });
      setFeatures(plan.features || []);
    } else {
      form.reset({
        name: '',
        tier: 'BASIC',
        priceMonthly: 0,
        priceYearly: 0,
        isActive: true,
      });
      setFeatures([]);
    }
  }, [plan, form]);

  const addFeature = () => {
    if (newFeature.trim() && !features.includes(newFeature.trim())) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const removeFeature = (feature: string) => {
    setFeatures(features.filter((f) => f !== feature));
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const payload = { ...values, features };

      if (isEditing) {
        await updateSubscriptionPlan(plan.id, payload);
        toast.success('Plan updated successfully');
      } else {
        await createSubscriptionPlan(payload);
        toast.success('Plan created successfully');
      }
      onClose(true);
    } catch (error) {
      console.error('Failed to save plan:', error);
      toast.error(isEditing ? 'Failed to update plan' : 'Failed to create plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className='max-w-lg max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Plan' : 'Add Plan'}</DialogTitle>
        </DialogHeader>
        <Form form={form as any} onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder='Premium Plan' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='tier'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tier</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select tier' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='FREE'>Free</SelectItem>
                    <SelectItem value='BASIC'>Basic</SelectItem>
                    <SelectItem value='PREMIUM'>Premium</SelectItem>
                    <SelectItem value='ENTERPRISE'>Enterprise</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='grid grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name='priceMonthly'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Price (₺)</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      min={0}
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='priceYearly'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Yearly Price (₺)</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      min={0}
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className='space-y-2'>
            <FormLabel>Features</FormLabel>
            <div className='flex gap-2'>
              <Input
                placeholder='Add a feature...'
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addFeature();
                  }
                }}
              />
              <Button type='button' variant='outline' onClick={addFeature}>
                <IconPlus className='h-4 w-4' />
              </Button>
            </div>
            <div className='flex flex-wrap gap-2 mt-2'>
              {features.map((feature, i) => (
                <Badge key={i} variant='secondary' className='gap-1'>
                  {feature}
                  <button
                    type='button'
                    onClick={() => removeFeature(feature)}
                    className='ml-1 hover:text-destructive'
                  >
                    <IconX className='h-3 w-3' />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <FormField
            control={form.control}
            name='isActive'
            render={({ field }) => (
              <FormItem className='flex items-center justify-between rounded-lg border p-3'>
                <div className='space-y-0.5'>
                  <FormLabel>Active</FormLabel>
                  <p className='text-sm text-muted-foreground'>
                    Make this plan available for subscription
                  </p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <div className='flex justify-end gap-2 pt-4'>
            <Button type='button' variant='outline' onClick={() => onClose()}>
              Cancel
            </Button>
            <Button type='submit' disabled={loading}>
              {loading && <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />}
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
