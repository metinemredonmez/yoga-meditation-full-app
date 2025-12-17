'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createChallenge, updateChallenge } from '@/lib/api';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { IconLoader2 } from '@tabler/icons-react';
import { useState } from 'react';
import { format } from 'date-fns';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startAt: z.string().min(1, 'Start date is required'),
  endAt: z.string().min(1, 'End date is required'),
  dailyGoal: z.number().min(1, 'Daily goal must be at least 1'),
  rewardXp: z.number().min(0, 'Reward XP must be at least 0'),
});

type FormValues = z.infer<typeof formSchema>;

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  dailyGoal: number;
  rewardXp: number;
}

interface ChallengeFormDialogProps {
  open: boolean;
  onClose: (refresh?: boolean) => void;
  challenge: Challenge | null;
}

export function ChallengeFormDialog({ open, onClose, challenge }: ChallengeFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!challenge;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      startAt: '',
      endAt: '',
      dailyGoal: 15,
      rewardXp: 100,
    },
  });

  useEffect(() => {
    if (challenge) {
      form.reset({
        title: challenge.title,
        description: challenge.description || '',
        startAt: format(new Date(challenge.startAt), 'yyyy-MM-dd'),
        endAt: format(new Date(challenge.endAt), 'yyyy-MM-dd'),
        dailyGoal: challenge.dailyGoal,
        rewardXp: challenge.rewardXp,
      });
    } else {
      form.reset({
        title: '',
        description: '',
        startAt: '',
        endAt: '',
        dailyGoal: 15,
        rewardXp: 100,
      });
    }
  }, [challenge, form]);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const payload = {
        title: values.title,
        description: values.description || '',
        startAt: new Date(values.startAt).toISOString(),
        endAt: new Date(values.endAt).toISOString(),
        dailyGoal: values.dailyGoal,
        rewardXp: values.rewardXp,
      };

      if (isEditing) {
        await updateChallenge(challenge.id, payload);
        toast.success('Challenge updated successfully');
      } else {
        await createChallenge(payload);
        toast.success('Challenge created successfully');
      }
      onClose(true);
    } catch (error) {
      console.error('Failed to save challenge:', error);
      toast.error(isEditing ? 'Failed to update challenge' : 'Failed to create challenge');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Challenge' : 'Add Challenge'}</DialogTitle>
        </DialogHeader>
        <Form form={form as any} onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder='30-Day Yoga Challenge' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Challenge description...'
                      className='min-h-[80px]'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='startAt'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='endAt'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='dailyGoal'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Goal (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='rewardXp'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reward XP</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
