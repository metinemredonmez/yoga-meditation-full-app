'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createPose, updatePose } from '@/lib/api';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { IconLoader2, IconX, IconPlus } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sanskritName: z.string().optional(),
  description: z.string().optional(),
  difficulty: z.string().min(1, 'Difficulty is required'),
  imageUrl: z.string().url().optional().or(z.literal('')),
  videoUrl: z.string().url().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

interface Pose {
  id: string;
  name: string;
  sanskritName: string | null;
  description: string | null;
  difficulty: string;
  benefits: string[];
  imageUrl: string | null;
  videoUrl: string | null;
}

interface PoseFormDialogProps {
  open: boolean;
  onClose: (refresh?: boolean) => void;
  pose: Pose | null;
}

export function PoseFormDialog({ open, onClose, pose }: PoseFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [benefits, setBenefits] = useState<string[]>([]);
  const [newBenefit, setNewBenefit] = useState('');
  const isEditing = !!pose;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      sanskritName: '',
      description: '',
      difficulty: 'beginner',
      imageUrl: '',
      videoUrl: '',
    },
  });

  useEffect(() => {
    if (pose) {
      form.reset({
        name: pose.name,
        sanskritName: pose.sanskritName || '',
        description: pose.description || '',
        difficulty: pose.difficulty,
        imageUrl: pose.imageUrl || '',
        videoUrl: pose.videoUrl || '',
      });
      setBenefits(pose.benefits || []);
    } else {
      form.reset({
        name: '',
        sanskritName: '',
        description: '',
        difficulty: 'beginner',
        imageUrl: '',
        videoUrl: '',
      });
      setBenefits([]);
    }
  }, [pose, form]);

  const addBenefit = () => {
    if (newBenefit.trim() && !benefits.includes(newBenefit.trim())) {
      setBenefits([...benefits, newBenefit.trim()]);
      setNewBenefit('');
    }
  };

  const removeBenefit = (benefit: string) => {
    setBenefits(benefits.filter((b) => b !== benefit));
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const payload = {
        name: values.name,
        difficulty: values.difficulty,
        description: values.description || '',
        sanskritName: values.sanskritName || undefined,
        imageUrl: values.imageUrl || undefined,
        videoUrl: values.videoUrl || undefined,
        benefits,
      };

      if (isEditing) {
        await updatePose(pose.id, payload);
        toast.success('Pose updated successfully');
      } else {
        await createPose(payload);
        toast.success('Pose created successfully');
      }
      onClose(true);
    } catch (error) {
      console.error('Failed to save pose:', error);
      toast.error(isEditing ? 'Failed to update pose' : 'Failed to create pose');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className='max-w-lg max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Pose' : 'Add Pose'}</DialogTitle>
        </DialogHeader>
        <Form form={form as any} onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder='Downward Dog' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='sanskritName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sanskrit Name</FormLabel>
                  <FormControl>
                    <Input placeholder='Adho Mukha Svanasana' {...field} />
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
                      placeholder='A foundational yoga pose...'
                      className='min-h-[80px]'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='difficulty'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Difficulty</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select difficulty' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='beginner'>Beginner</SelectItem>
                      <SelectItem value='intermediate'>Intermediate</SelectItem>
                      <SelectItem value='advanced'>Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='space-y-2'>
              <FormLabel>Benefits</FormLabel>
              <div className='flex gap-2'>
                <Input
                  placeholder='Add a benefit...'
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addBenefit();
                    }
                  }}
                />
                <Button type='button' variant='outline' onClick={addBenefit}>
                  <IconPlus className='h-4 w-4' />
                </Button>
              </div>
              <div className='flex flex-wrap gap-2 mt-2'>
                {benefits.map((benefit, i) => (
                  <Badge key={i} variant='secondary' className='gap-1'>
                    {benefit}
                    <button
                      type='button'
                      onClick={() => removeBenefit(benefit)}
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
              name='imageUrl'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder='https://example.com/image.jpg' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='videoUrl'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Video URL</FormLabel>
                  <FormControl>
                    <Input placeholder='https://example.com/video.mp4' {...field} />
                  </FormControl>
                  <FormMessage />
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
