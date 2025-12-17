import { z } from 'zod';

export const poseDifficultyEnum = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);

export const poseFiltersSchema = z.object({
  difficulty: poseDifficultyEnum.optional(),
  bodyArea: z.string().min(1).optional(),
  q: z.string().min(1).optional(),
});

export const createPoseSchema = z.object({
  sanskritName: z.string().optional(),
  englishName: z.string().min(1, 'English name is required'),
  difficulty: poseDifficultyEnum,
  bodyArea: z.string().min(1, 'Body area is required'),
  description: z.string().min(1, 'Description is required'),
  imageUrl: z.string().url().optional(),
});

export const updatePoseSchema = createPoseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided to update the pose',
  });

export const poseIdParamSchema = z.object({
  poseId: z.string().min(1, 'Invalid pose id'),
});

export type PoseFilters = z.infer<typeof poseFiltersSchema>;
export type CreatePoseInput = z.infer<typeof createPoseSchema>;
export type UpdatePoseInput = z.infer<typeof updatePoseSchema>;
