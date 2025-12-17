import { z } from 'zod';

export const challengeIdParamSchema = z.object({
  challengeId: z.string().min(1, 'Invalid challenge id'),
});

const isoDateString = z.string().datetime({ message: 'Must be an ISO8601 date string' });

// Enums matching Prisma schema
export const ChallengeDifficultyEnum = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);
export const ChallengeGoalTypeEnum = z.enum(['DURATION', 'SESSIONS', 'FREE']);

export const createChallengeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  startAt: isoDateString,
  endAt: isoDateString,
  targetDays: z.number().int().positive('Target days must be positive'),
  coverUrl: z.string().url().optional().nullable(),
  // New fields
  slug: z.string().min(1).optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  difficulty: ChallengeDifficultyEnum.default('BEGINNER'),
  categories: z.array(z.string()).default([]),
  dailyGoalMinutes: z.number().int().min(1).default(15),
  dailyGoalType: ChallengeGoalTypeEnum.default('DURATION'),
  xpReward: z.number().int().min(0).default(100),
  badgeId: z.string().min(1).optional().nullable(),
  maxParticipants: z.number().int().positive().optional().nullable(),
  showLeaderboard: z.boolean().default(true),
  isActive: z.boolean().default(true),
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
export type ChallengeDifficulty = z.infer<typeof ChallengeDifficultyEnum>;
export type ChallengeGoalType = z.infer<typeof ChallengeGoalTypeEnum>;
