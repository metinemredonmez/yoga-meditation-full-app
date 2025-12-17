import { z } from 'zod';

export const mediaUploadSchema = z.object({
  filename: z.string().min(1, 'filename is required'),
  contentType: z.string().min(1, 'contentType is required'),
  type: z.enum(['video', 'image', 'thumbnail', 'pose', 'podcast']).default('video'),
});

export const mediaIdParamSchema = z.object({
  id: z.string().min(1, 'Invalid media id'),
});

export type MediaUploadInput = z.infer<typeof mediaUploadSchema>;
