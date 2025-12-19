import { z } from 'zod';

// Experience Level
export const experienceLevelEnum = z.enum(['BEGINNER', 'SOME', 'INTERMEDIATE', 'ADVANCED']);
export type ExperienceLevel = z.infer<typeof experienceLevelEnum>;

// Practice Frequency
export const practiceFrequencyEnum = z.enum(['DAILY', 'FEW_TIMES_WEEK', 'WEEKLY', 'OCCASIONALLY']);
export type PracticeFrequency = z.infer<typeof practiceFrequencyEnum>;

// Preferred Time
export const preferredTimeEnum = z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'FLEXIBLE']);
export type PreferredTime = z.infer<typeof preferredTimeEnum>;

// Goals
export const onboardingGoalsEnum = z.enum([
  'STRESS_RELIEF',
  'BETTER_SLEEP',
  'FOCUS',
  'FLEXIBILITY',
  'ANXIETY',
  'MINDFULNESS',
  'ENERGY',
  'WEIGHT_LOSS',
  'STRENGTH',
  'RELAXATION',
]);

// Interests
export const onboardingInterestsEnum = z.enum([
  'YOGA',
  'MEDITATION',
  'BREATHWORK',
  'PILATES',
  'SOUNDSCAPES',
  'SLEEP_STORIES',
  'JOURNALING',
]);

// Health Conditions
export const healthConditionsEnum = z.enum([
  'BACK_PAIN',
  'ANXIETY',
  'INSOMNIA',
  'DEPRESSION',
  'JOINT_PAIN',
  'HIGH_BLOOD_PRESSURE',
  'PREGNANCY',
  'NONE',
]);

// Save Onboarding Answer
export const saveOnboardingAnswerSchema = z.object({
  step: z.number().int().min(1).max(10),

  // Step answers
  experienceLevel: experienceLevelEnum.optional(),
  goals: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  practiceFrequency: practiceFrequencyEnum.optional(),
  preferredDuration: z.number().int().min(5).max(120).optional(),
  preferredTime: preferredTimeEnum.optional(),
  healthConditions: z.array(z.string()).optional(),

  // Raw answers for storage
  answers: z.record(z.string(), z.any()).optional(),
});

export type SaveOnboardingAnswerInput = z.infer<typeof saveOnboardingAnswerSchema>;

// Complete Onboarding
export const completeOnboardingSchema = z.object({
  experienceLevel: experienceLevelEnum.optional(),
  goals: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
  practiceFrequency: practiceFrequencyEnum.optional(),
  preferredDuration: z.number().int().min(5).max(120).optional(),
  preferredTime: preferredTimeEnum.optional(),
  healthConditions: z.array(z.string()).default([]),
  answers: z.record(z.string(), z.any()).optional(),
});

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;

// Update Onboarding
export const updateOnboardingSchema = z.object({
  experienceLevel: experienceLevelEnum.optional(),
  goals: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  practiceFrequency: practiceFrequencyEnum.optional(),
  preferredDuration: z.number().int().min(5).max(120).optional(),
  preferredTime: preferredTimeEnum.optional(),
  healthConditions: z.array(z.string()).optional(),
  answers: z.record(z.string(), z.any()).optional(),
});

export type UpdateOnboardingInput = z.infer<typeof updateOnboardingSchema>;
