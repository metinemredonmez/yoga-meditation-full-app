import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { mediaUploadSchema, mediaIdParamSchema } from '../validation/mediaSchemas';
import {
  createSignedUploadUrl,
  createSignedDownloadUrl,
  buildCdnUrl,
  validateContentType,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_AUDIO_TYPES,
  MediaFolder,
} from '../services/storageService';
import { logger } from '../utils/logger';
import { prisma } from '../utils/database';

const folderMap: Record<string, MediaFolder> = {
  video: 'videos',
  image: 'images',
  thumbnail: 'thumbnails',
  pose: 'poses',
  podcast: 'podcasts',
};

export async function generateUploadUrl(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = mediaUploadSchema.parse(req.body);

    // Content type validation
    let allowedTypes: string[];
    if (payload.type === 'video') {
      allowedTypes = ALLOWED_VIDEO_TYPES;
    } else if (payload.type === 'podcast') {
      allowedTypes = ALLOWED_AUDIO_TYPES;
    } else {
      allowedTypes = ALLOWED_IMAGE_TYPES;
    }

    if (!validateContentType(payload.contentType, allowedTypes)) {
      return res.status(400).json({
        error: 'Invalid content type',
        allowed: allowedTypes,
      });
    }

    const folder = folderMap[payload.type] ?? 'videos';
    const result = await createSignedUploadUrl({
      filename: payload.filename,
      contentType: payload.contentType,
      userId: req.user.userId,
      folder,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        actorRole: req.user.role,
        action: 'media.upload_url_generated',
        metadata: {
          filename: payload.filename,
          type: payload.type,
          key: result.key,
        },
      },
    });

    return res.status(201).json({
      message: 'Upload URL generated',
      upload: {
        id: result.id,
        uploadUrl: result.uploadUrl,
        fileUrl: result.fileUrl,
        expiresAt: result.expiresAt.toISOString(),
        key: result.key,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to generate signed upload URL');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMedia(req: Request, res: Response) {
  try {
    const { id } = mediaIdParamSchema.parse(req.params);
    const fileUrl = buildCdnUrl(id);

    return res.json({
      id,
      fileUrl,
      message: 'Media URL retrieved',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid media id', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to retrieve media');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getSignedMediaUrl(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = mediaIdParamSchema.parse(req.params);

    // Private content requires signed download URL
    const signedUrl = await createSignedDownloadUrl(id);

    return res.json({
      message: 'Signed URL generated',
      signedUrl,
      expiresIn: 3600,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid media id', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to get signed media URL');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
