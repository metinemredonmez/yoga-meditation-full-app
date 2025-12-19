import { z } from 'zod';

// ==================== ENUMS ====================
export const playlistTypeEnum = z.enum(['CUSTOM', 'SYSTEM', 'CURATED', 'GENERATED', 'COURSE']);
export const playlistContentTypeEnum = z.enum(['MEDITATION', 'BREATHWORK', 'SOUNDSCAPE', 'SLEEP', 'MIXED']);
export const playlistItemTypeEnum = z.enum(['MEDITATION', 'BREATHWORK', 'SOUNDSCAPE', 'SLEEP_STORY']);

// ==================== PLAYLIST SCHEMAS ====================

// Create playlist
export const createPlaylistSchema = z.object({
  name: z.string().min(1).max(100),
  nameEn: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  descriptionEn: z.string().max(500).optional(),
  coverImage: z.string().url().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  contentType: playlistContentTypeEnum.optional().default('MIXED'),
  isPublic: z.boolean().optional().default(false),
});
export type CreatePlaylistInput = z.infer<typeof createPlaylistSchema>;

// Update playlist
export const updatePlaylistSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  nameEn: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  descriptionEn: z.string().max(500).optional(),
  coverImage: z.string().url().optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  contentType: playlistContentTypeEnum.optional(),
  isPublic: z.boolean().optional(),
});
export type UpdatePlaylistInput = z.infer<typeof updatePlaylistSchema>;

// Playlist filters
export const playlistFiltersSchema = z.object({
  type: playlistTypeEnum.optional(),
  contentType: playlistContentTypeEnum.optional(),
  isPublic: z.preprocess((val) => val === 'true' ? true : val === 'false' ? false : val, z.boolean().optional()),
  isFeatured: z.preprocess((val) => val === 'true' ? true : val === 'false' ? false : val, z.boolean().optional()),
  search: z.string().optional(),
  page: z.preprocess((val) => Number(val) || 1, z.number().min(1).default(1)),
  limit: z.preprocess((val) => Number(val) || 20, z.number().min(1).max(100).default(20)),
  sortBy: z.enum(['createdAt', 'name', 'playCount', 'saveCount', 'sortOrder']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
export type PlaylistFilters = z.infer<typeof playlistFiltersSchema>;

// ==================== PLAYLIST ITEM SCHEMAS ====================

// Add item to playlist
export const addPlaylistItemSchema = z.object({
  contentType: playlistItemTypeEnum,
  contentId: z.string().cuid(),
  note: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).optional(),
});
export type AddPlaylistItemInput = z.infer<typeof addPlaylistItemSchema>;

// Update playlist item
export const updatePlaylistItemSchema = z.object({
  note: z.string().max(500).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});
export type UpdatePlaylistItemInput = z.infer<typeof updatePlaylistItemSchema>;

// Reorder items
export const reorderPlaylistItemsSchema = z.object({
  items: z.array(z.object({
    id: z.string().cuid(),
    sortOrder: z.number().int().min(0),
  })),
});
export type ReorderPlaylistItemsInput = z.infer<typeof reorderPlaylistItemsSchema>;

// ==================== SYSTEM/FEATURED PLAYLISTS ====================

// Get featured playlists
export const featuredPlaylistsSchema = z.object({
  contentType: playlistContentTypeEnum.optional(),
  limit: z.preprocess((val) => Number(val) || 10, z.number().min(1).max(50).default(10)),
});
export type FeaturedPlaylistsQuery = z.infer<typeof featuredPlaylistsSchema>;

// ==================== ADMIN SCHEMAS ====================

// Admin create playlist
export const adminCreatePlaylistSchema = z.object({
  name: z.string().min(1).max(100),
  nameEn: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  descriptionEn: z.string().max(500).optional(),
  coverImage: z.string().url().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  type: playlistTypeEnum.optional().default('SYSTEM'),
  contentType: playlistContentTypeEnum.optional().default('MIXED'),
  isSystem: z.boolean().optional().default(true),
  isPublic: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  isPublished: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).optional().default(0),
});
export type AdminCreatePlaylistInput = z.infer<typeof adminCreatePlaylistSchema>;

// Admin update playlist
export const adminUpdatePlaylistSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  nameEn: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  descriptionEn: z.string().max(500).optional(),
  coverImage: z.string().url().optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  type: playlistTypeEnum.optional(),
  contentType: playlistContentTypeEnum.optional(),
  isSystem: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});
export type AdminUpdatePlaylistInput = z.infer<typeof adminUpdatePlaylistSchema>;

// Admin filters
export const adminPlaylistFiltersSchema = z.object({
  type: playlistTypeEnum.optional(),
  contentType: playlistContentTypeEnum.optional(),
  isSystem: z.preprocess((val) => val === 'true' ? true : val === 'false' ? false : val, z.boolean().optional()),
  isPublic: z.preprocess((val) => val === 'true' ? true : val === 'false' ? false : val, z.boolean().optional()),
  isFeatured: z.preprocess((val) => val === 'true' ? true : val === 'false' ? false : val, z.boolean().optional()),
  isPublished: z.preprocess((val) => val === 'true' ? true : val === 'false' ? false : val, z.boolean().optional()),
  search: z.string().optional(),
  page: z.preprocess((val) => Number(val) || 1, z.number().min(1).default(1)),
  limit: z.preprocess((val) => Number(val) || 20, z.number().min(1).max(100).default(20)),
  sortBy: z.enum(['createdAt', 'name', 'playCount', 'saveCount', 'sortOrder']).optional().default('sortOrder'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});
export type AdminPlaylistFilters = z.infer<typeof adminPlaylistFiltersSchema>;
