import { z } from 'zod';

export const programLevelEnum = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);

export const tagKindEnum = z.enum(['LEVEL', 'FOCUS', 'EQUIPMENT']);

export const programFiltersSchema = z.object({
  level: programLevelEnum.optional(),
  durationMax: z.coerce.number().int().positive().optional(),
  tag: z.string().min(1).optional(),
  q: z.string().min(1).optional(),
});

const baseProgramSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  level: programLevelEnum,
  durationMin: z.number().int().positive(),
  coverUrl: z.string().url().optional(),
  tags: z.array(z.string().min(1)).default([]),
});

export const createProgramSchema = baseProgramSchema;

export const updateProgramSchema = baseProgramSchema.partial();

export const programIdParamSchema = z.object({
  programId: z.string().min(1),
});

export const programDetailParamSchema = z.object({
  id: z.string().min(1),
});

export const programSessionIdParamSchema = z.object({
  sessionId: z.string().min(1),
});

export const createProgramSessionSchema = z.object({
  order: z.number().int().positive(),
  title: z.string().min(1),
  durationMin: z.number().int().positive(),
  videoUrl: z.string().url().optional(),
  poseIds: z.array(z.string().min(1)).optional(),
});

export const updateProgramSessionSchema = z
  .object({
    order: z.number().int().positive().optional(),
    title: z.string().min(1).optional(),
    durationMin: z.number().int().positive().optional(),
    videoUrl: z.string().url().optional(),
    poseIds: z.array(z.string().min(1)).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update a session',
  });

export type ProgramFilters = z.infer<typeof programFiltersSchema>;
export type CreateProgramInput = z.infer<typeof createProgramSchema>;
export type UpdateProgramInput = z.infer<typeof updateProgramSchema>;
export type CreateProgramSessionInput = z.infer<typeof createProgramSessionSchema>;
export type UpdateProgramSessionInput = z.infer<typeof updateProgramSessionSchema>;
