import { z } from 'zod';

export const requestResetBodySchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const validateTokenParamsSchema = z.object({
  token: z.string().min(64, 'Invalid token format'),
});

export const resetPasswordBodySchema = z.object({
  token: z.string().min(64, 'Invalid token format'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),
});
