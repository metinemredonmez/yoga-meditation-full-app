import { z } from 'zod';
import { NotificationType } from '@prisma/client';

// HH:mm time format validation
const timeFormatRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

const timeFormat = z.string().regex(timeFormatRegex, {
  message: 'Invalid time format. Expected HH:mm (e.g., 22:00)',
});

// Common timezones list for validation (could be expanded)
const timezoneSchema = z.string().refine(
  (tz) => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  },
  { message: 'Invalid timezone' },
);

export const updatePreferencesBodySchema = z
  .object({
    // Channel preferences
    emailEnabled: z.boolean().optional(),
    smsEnabled: z.boolean().optional(),
    pushEnabled: z.boolean().optional(),
    inAppEnabled: z.boolean().optional(),

    // Marketing preferences
    marketingEmails: z.boolean().optional(),
    marketingSms: z.boolean().optional(),

    // Notification type preferences
    challengeReminders: z.boolean().optional(),
    challengeUpdates: z.boolean().optional(),
    sessionReminders: z.boolean().optional(),
    weeklyProgress: z.boolean().optional(),
    newProgramAlerts: z.boolean().optional(),
    communityUpdates: z.boolean().optional(),
    paymentAlerts: z.boolean().optional(),
    // Note: securityAlerts is intentionally excluded - cannot be changed by user

    // Quiet hours
    quietHoursEnabled: z.boolean().optional(),
    quietHoursStart: z.union([timeFormat, z.null()]).optional(),
    quietHoursEnd: z.union([timeFormat, z.null()]).optional(),
    timezone: timezoneSchema.optional(),
  })
  .refine(
    (data) => {
      // If quietHoursEnabled is true, both start and end must be provided
      if (data.quietHoursEnabled === true) {
        if (data.quietHoursStart === null || data.quietHoursEnd === null) {
          return false;
        }
      }
      return true;
    },
    {
      message: 'Both quietHoursStart and quietHoursEnd must be set when enabling quiet hours',
      path: ['quietHoursEnabled'],
    },
  );

export type UpdatePreferencesBody = z.infer<typeof updatePreferencesBodySchema>;

// Unsubscribe token parameter
export const unsubscribeParamsSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export type UnsubscribeParams = z.infer<typeof unsubscribeParamsSchema>;

// Unsubscribe query (optional type filter)
export const unsubscribeQuerySchema = z.object({
  type: z.nativeEnum(NotificationType).optional(),
});

export type UnsubscribeQuery = z.infer<typeof unsubscribeQuerySchema>;

// Resubscribe body
export const resubscribeBodySchema = z.object({
  type: z.nativeEnum(NotificationType),
});

export type ResubscribeBody = z.infer<typeof resubscribeBodySchema>;

// Generate unsubscribe token body
export const generateUnsubscribeTokenBodySchema = z.object({
  type: z.nativeEnum(NotificationType).optional(),
});

export type GenerateUnsubscribeTokenBody = z.infer<typeof generateUnsubscribeTokenBodySchema>;
