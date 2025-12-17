import { z } from 'zod';

export const challengeIdParamSchema = z.object({
  challengeId: z.string().min(1, 'Invalid challenge id'),
});

const isoDateString = z.string().datetime({ message: 'Must be an ISO8601 date string' });

export const createChallengeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  startAt: isoDateString,
  endAt: isoDateString,
  targetDays: z.number().int().positive('Target days must be positive'),
  coverUrl: z.string().url().optional(),
});

export const updateChallengeSchema = createChallengeSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field must be provided to update the challenge',
});

export const challengeCheckSchema = z.object({
  date: isoDateString.optional(),
  programSessionId: z.string().min(1).optional(),
});

export type CreateChallengeInput = z.infer<typeof createChallengeSchema>;
export type UpdateChallengeInput = z.infer<typeof updateChallengeSchema>;
export type ChallengeCheckInput = z.infer<typeof challengeCheckSchema>;
