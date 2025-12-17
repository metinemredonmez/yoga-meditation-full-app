import { z } from 'zod';

export const lessonTypeSchema = z.enum(['PROGRAM_SESSION', 'CLASS']);

export const updateProgressBodySchema = z.object({
  lessonId: z.string().min(1, 'lessonId is required'),
  lessonType: lessonTypeSchema,
  currentTime: z.number().int().min(0, 'currentTime must be non-negative'),
  duration: z.number().int().min(1, 'duration must be positive'),
});

export const getProgressParamsSchema = z.object({
  lessonId: z.string().min(1, 'lessonId is required'),
});

export const getProgressQuerySchema = z.object({
  lessonType: lessonTypeSchema,
});

export const getUserProgressQuerySchema = z.object({
  lessonType: lessonTypeSchema.optional(),
  completedOnly: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
});

export const markCompletedParamsSchema = z.object({
  lessonId: z.string().min(1, 'lessonId is required'),
});

export const markCompletedBodySchema = z.object({
  lessonType: lessonTypeSchema,
});

export const resetProgressParamsSchema = z.object({
  lessonId: z.string().min(1, 'lessonId is required'),
});

export const resetProgressQuerySchema = z.object({
  lessonType: lessonTypeSchema,
});

export type UpdateProgressInput = z.infer<typeof updateProgressBodySchema>;
export type GetProgressParams = z.infer<typeof getProgressParamsSchema>;
export type GetProgressQuery = z.infer<typeof getProgressQuerySchema>;
export type GetUserProgressQuery = z.infer<typeof getUserProgressQuerySchema>;
