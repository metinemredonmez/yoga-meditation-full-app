import { z } from 'zod';

export const favoriteTypeSchema = z.enum(['PROGRAM', 'POSE', 'CLASS']);

export const addFavoriteBodySchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  itemType: favoriteTypeSchema,
});

export const removeFavoriteBodySchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  itemType: favoriteTypeSchema,
});

export const toggleFavoriteBodySchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  itemType: favoriteTypeSchema,
});

export const getFavoritesQuerySchema = z.object({
  itemType: favoriteTypeSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const checkFavoriteParamsSchema = z.object({
  itemType: favoriteTypeSchema,
  itemId: z.string().min(1, 'Item ID is required'),
});

export const bulkCheckFavoritesBodySchema = z.object({
  items: z
    .array(
      z.object({
        itemId: z.string().min(1),
        itemType: favoriteTypeSchema,
      }),
    )
    .min(1, 'At least one item is required')
    .max(100, 'Maximum 100 items allowed'),
});

export type AddFavoriteInput = z.infer<typeof addFavoriteBodySchema>;
export type RemoveFavoriteInput = z.infer<typeof removeFavoriteBodySchema>;
export type ToggleFavoriteInput = z.infer<typeof toggleFavoriteBodySchema>;
export type GetFavoritesQuery = z.infer<typeof getFavoritesQuerySchema>;
export type CheckFavoriteParams = z.infer<typeof checkFavoriteParamsSchema>;
export type BulkCheckFavoritesInput = z.infer<typeof bulkCheckFavoritesBodySchema>;
