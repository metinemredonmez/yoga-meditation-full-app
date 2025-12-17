'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClass, updateClass } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';

const classSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  durationMinutes: z.number().min(5, 'Duration must be at least 5 minutes'),
  videoUrl: z.string().url().optional().or(z.literal('')),
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
  isPublished: z.boolean(),
});

type ClassFormData = z.infer<typeof classSchema>;

interface ClassItem {
  id: string;
  title: string;
  description: string;
  level: string;
  durationMinutes: number;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  isPublished: boolean;
}

interface ClassFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classItem?: ClassItem | null;
  onSuccess: () => void;
}

export function ClassFormDialog({
  open,
  onOpenChange,
  classItem,
  onSuccess,
}: ClassFormDialogProps) {
  const isEdit = !!classItem;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      title: '',
      description: '',
      level: 'BEGINNER',
      durationMinutes: 30,
      videoUrl: '',
      thumbnailUrl: '',
      isPublished: false,
    },
  });

  useEffect(() => {
    if (classItem) {
      reset({
        title: classItem.title,
        description: classItem.description,
        level: classItem.level as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
        durationMinutes: classItem.durationMinutes,
        videoUrl: classItem.videoUrl || '',
        thumbnailUrl: classItem.thumbnailUrl || '',
        isPublished: classItem.isPublished,
      });
    } else {
      reset({
        title: '',
        description: '',
        level: 'BEGINNER',
        durationMinutes: 30,
        videoUrl: '',
        thumbnailUrl: '',
        isPublished: false,
      });
    }
  }, [classItem, reset]);

  const onSubmit = async (data: ClassFormData) => {
    try {
      if (isEdit && classItem) {
        await updateClass(classItem.id, data);
        toast.success('Class updated successfully');
      } else {
        await createClass(data);
        toast.success('Class created successfully');
      }
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(isEdit ? 'Failed to update class' : 'Failed to create class');
    }
  };

  const isPublished = watch('isPublished');
  const level = watch('level');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Class' : 'Create Class'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Morning Yoga Flow"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="A gentle morning yoga class..."
              rows={3}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Select
                value={level}
                onValueChange={(value) => setValue('level', value as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEGINNER">Beginner</SelectItem>
                  <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                  <SelectItem value="ADVANCED">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Duration (minutes)</Label>
              <Input
                id="durationMinutes"
                type="number"
                min={5}
                {...register('durationMinutes', { valueAsNumber: true })}
              />
              {errors.durationMinutes && (
                <p className="text-sm text-destructive">{errors.durationMinutes.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="videoUrl">Video URL (optional)</Label>
            <Input
              id="videoUrl"
              placeholder="https://example.com/video.mp4"
              {...register('videoUrl')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnailUrl">Thumbnail URL (optional)</Label>
            <Input
              id="thumbnailUrl"
              placeholder="https://example.com/thumb.jpg"
              {...register('thumbnailUrl')}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="isPublished">Published</Label>
              <p className="text-sm text-muted-foreground">
                Make this class visible to users
              </p>
            </div>
            <Switch
              id="isPublished"
              checked={isPublished}
              onCheckedChange={(checked) => setValue('isPublished', checked)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
