import { z } from 'zod';

export const requestResetBodySchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const validateTokenParamsSchema = z.object({
  token: z.string().min(64, 'Invalid token format'),
});

// Strong password schema with complexity requirements
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

export const resetPasswordBodySchema = z.object({
  token: z.string().min(64, 'Invalid token format'),
  newPassword: passwordSchema,
});
