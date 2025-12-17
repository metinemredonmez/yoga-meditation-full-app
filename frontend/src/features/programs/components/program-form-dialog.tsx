'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createProgram, updateProgram } from '@/lib/api';
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

const programSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  durationWeeks: z.number().min(1, 'Duration must be at least 1 week'),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  isPublished: z.boolean(),
});

type ProgramFormData = z.infer<typeof programSchema>;

interface Program {
  id: string;
  title: string;
  description: string;
  level: string;
  durationWeeks: number;
  coverImageUrl: string | null;
  isPublished: boolean;
}

interface ProgramFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program?: Program | null;
  onSuccess: () => void;
}

export function ProgramFormDialog({
  open,
  onOpenChange,
  program,
  onSuccess,
}: ProgramFormDialogProps) {
  const isEdit = !!program;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProgramFormData>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      title: '',
      description: '',
      level: 'BEGINNER',
      durationWeeks: 4,
      coverImageUrl: '',
      isPublished: false,
    },
  });

  useEffect(() => {
    if (program) {
      reset({
        title: program.title,
        description: program.description,
        level: program.level as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
        durationWeeks: program.durationWeeks,
        coverImageUrl: program.coverImageUrl || '',
        isPublished: program.isPublished,
      });
    } else {
      reset({
        title: '',
        description: '',
        level: 'BEGINNER',
        durationWeeks: 4,
        coverImageUrl: '',
        isPublished: false,
      });
    }
  }, [program, reset]);

  const onSubmit = async (data: ProgramFormData) => {
    try {
      if (isEdit && program) {
        await updateProgram(program.id, data);
        toast.success('Program updated successfully');
      } else {
        await createProgram(data);
        toast.success('Program created successfully');
      }
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(isEdit ? 'Failed to update program' : 'Failed to create program');
    }
  };

  const isPublished = watch('isPublished');
  const level = watch('level');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Program' : 'Create Program'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Yoga for Beginners"
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
              placeholder="A comprehensive yoga program for beginners..."
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
              {errors.level && (
                <p className="text-sm text-destructive">{errors.level.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationWeeks">Duration (weeks)</Label>
              <Input
                id="durationWeeks"
                type="number"
                min={1}
                {...register('durationWeeks', { valueAsNumber: true })}
              />
              {errors.durationWeeks && (
                <p className="text-sm text-destructive">{errors.durationWeeks.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverImageUrl">Cover Image URL (optional)</Label>
            <Input
              id="coverImageUrl"
              placeholder="https://example.com/image.jpg"
              {...register('coverImageUrl')}
            />
            {errors.coverImageUrl && (
              <p className="text-sm text-destructive">{errors.coverImageUrl.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="isPublished">Published</Label>
              <p className="text-sm text-muted-foreground">
                Make this program visible to users
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
