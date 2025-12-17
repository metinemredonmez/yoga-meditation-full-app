import { z } from 'zod';

const permissionPattern = /^(\*|read|write|delete):(\*|[a-z_]+)$/;

export const createApiKeyBodySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  permissions: z
    .array(
      z.string().regex(permissionPattern, {
        message: 'Invalid permission format. Use "action:resource" (e.g., "read:programs", "write:progress", "*:*")',
      })
    )
    .min(1, 'At least one permission is required')
    .max(20, 'Maximum 20 permissions allowed')
    .optional()
    .default(['read:*']),
  rateLimit: z
    .number()
    .int()
    .min(1, 'Rate limit must be at least 1')
    .max(1000, 'Rate limit must be at most 1000')
    .optional()
    .default(60),
  expiresAt: z
    .string()
    .datetime({ offset: true })
    .optional()
    .refine(
      (val) => !val || new Date(val) > new Date(),
      'Expiration date must be in the future'
    ),
});

export const apiKeyIdParamsSchema = z.object({
  keyId: z.string().min(1, 'Key ID is required'),
});

export type CreateApiKeyBody = z.infer<typeof createApiKeyBodySchema>;
export type ApiKeyIdParams = z.infer<typeof apiKeyIdParamsSchema>;
