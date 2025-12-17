import { z } from 'zod';

// ============================================
// Enums
// ============================================

export const liveStreamTypeEnum = z.enum([
  'YOGA_CLASS',
  'MEDITATION',
  'Q_AND_A',
  'WORKSHOP',
  'SPECIAL_EVENT',
]);

export const programLevelEnum = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);

export const subscriptionTierEnum = z.enum(['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']);

export const chatMessageTypeEnum = z.enum(['MESSAGE', 'QUESTION', 'ANNOUNCEMENT', 'SYSTEM']);

export const reactionTypeEnum = z.enum(['LIKE', 'HEART', 'CLAP', 'NAMASTE', 'FIRE']);

// ============================================
// Stream Schemas
// ============================================

export const createStreamSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  thumbnailUrl: z.string().url().optional(),
  type: liveStreamTypeEnum,
  scheduledStartAt: z.string().datetime(),
  scheduledEndAt: z.string().datetime(),
  maxParticipants: z.number().int().min(1).max(1000).optional().default(100),
  isRecorded: z.boolean().optional().default(true),
  requiresSubscription: z.boolean().optional().default(true),
  minimumTier: subscriptionTierEnum.optional(),
  price: z.number().min(0).optional(),
  tags: z.array(z.string()).max(10).optional(),
  level: programLevelEnum.optional().default('BEGINNER'),
  equipment: z.array(z.string()).max(20).optional(),
  chatEnabled: z.boolean().optional().default(true),
  handRaiseEnabled: z.boolean().optional().default(true),
}).refine(
  (data) => {
    const start = new Date(data.scheduledStartAt);
    const end = new Date(data.scheduledEndAt);
    return end > start;
  },
  {
    message: 'End time must be after start time',
    path: ['scheduledEndAt'],
  },
);

export const updateStreamSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  type: liveStreamTypeEnum.optional(),
  scheduledStartAt: z.string().datetime().optional(),
  scheduledEndAt: z.string().datetime().optional(),
  maxParticipants: z.number().int().min(1).max(1000).optional(),
  isRecorded: z.boolean().optional(),
  requiresSubscription: z.boolean().optional(),
  minimumTier: subscriptionTierEnum.optional().nullable(),
  price: z.number().min(0).optional().nullable(),
  tags: z.array(z.string()).max(10).optional(),
  level: programLevelEnum.optional(),
  equipment: z.array(z.string()).max(20).optional(),
  chatEnabled: z.boolean().optional(),
  handRaiseEnabled: z.boolean().optional(),
});

export const streamIdParamsSchema = z.object({
  id: z.string().cuid(),
});

// ============================================
// Participant Schemas
// ============================================

export const joinStreamSchema = z.object({
  agoraUid: z.number().int().positive(),
});

// ============================================
// Chat Schemas
// ============================================

export const chatMessageSchema = z.object({
  message: z.string().min(1).max(500),
  type: chatMessageTypeEnum.optional().default('MESSAGE'),
  replyToId: z.string().cuid().optional(),
});

// ============================================
// Reaction Schemas
// ============================================

export const reactionSchema = z.object({
  type: reactionTypeEnum,
});

// ============================================
// Registration Schemas
// ============================================

export const registrationSchema = z.object({
  paymentId: z.string().optional(),
});

// ============================================
// Schedule Schemas
// ============================================

export const scheduleSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  type: liveStreamTypeEnum,
  recurrenceRule: z.string().min(1), // RRULE format
  dayOfWeek: z.array(z.number().int().min(0).max(6)),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format. Use HH:mm'),
  duration: z.number().int().min(15).max(480), // 15 min to 8 hours
  timezone: z.string().optional().default('Europe/Istanbul'),
});

export const updateScheduleSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  type: liveStreamTypeEnum.optional(),
  recurrenceRule: z.string().min(1).optional(),
  dayOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  duration: z.number().int().min(15).max(480).optional(),
  timezone: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// Query Schemas
// ============================================

export const streamQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
  type: liveStreamTypeEnum.optional(),
  level: programLevelEnum.optional(),
  status: z.enum(['SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED']).optional(),
});

export const chatQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
  since: z.string().datetime().optional(),
});

// ============================================
// Type Exports
// ============================================

export type CreateStreamInput = z.infer<typeof createStreamSchema>;
export type UpdateStreamInput = z.infer<typeof updateStreamSchema>;
export type JoinStreamInput = z.infer<typeof joinStreamSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type ReactionInput = z.infer<typeof reactionSchema>;
export type ScheduleInput = z.infer<typeof scheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
