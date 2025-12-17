import { z } from 'zod';

export const refreshTokenBodySchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const logoutBodySchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const logoutAllBodySchema = z.object({
  confirmLogoutAll: z.literal(true, {
    message: 'Must confirm logout all devices',
  }),
});

export const revokeSessionParamsSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenBodySchema>;
export type LogoutInput = z.infer<typeof logoutBodySchema>;
export type LogoutAllInput = z.infer<typeof logoutAllBodySchema>;
export type RevokeSessionParams = z.infer<typeof revokeSessionParamsSchema>;
