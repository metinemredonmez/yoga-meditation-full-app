import { z } from 'zod';

export const blockIPBodySchema = z.object({
  ipAddress: z
    .string()
    .min(1, 'IP address is required')
    .regex(
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
      'Invalid IP address format'
    ),
  reason: z
    .string()
    .min(1, 'Reason is required')
    .max(500, 'Reason must be at most 500 characters'),
  expiresAt: z
    .string()
    .datetime({ offset: true })
    .optional()
    .refine(
      (val) => !val || new Date(val) > new Date(),
      'Expiration date must be in the future'
    ),
});

export const unblockIPParamsSchema = z.object({
  ipAddress: z
    .string()
    .min(1, 'IP address is required')
    .regex(
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
      'Invalid IP address format'
    ),
});

export const resetUserRateLimitParamsSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export const rateLimitStatsQuerySchema = z.object({
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  { message: 'Start date must be before or equal to end date' }
);

export type BlockIPBody = z.infer<typeof blockIPBodySchema>;
export type UnblockIPParams = z.infer<typeof unblockIPParamsSchema>;
export type ResetUserRateLimitParams = z.infer<typeof resetUserRateLimitParamsSchema>;
export type RateLimitStatsQuery = z.infer<typeof rateLimitStatsQuerySchema>;
