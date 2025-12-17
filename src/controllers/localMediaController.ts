import { Request, Response } from 'express';
import {
  saveFileLocally,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_AUDIO_TYPES,
  validateContentType,
  MediaFolder,
} from '../services/localStorageService';
import { logger } from '../utils/logger';

const folderMap: Record<string, MediaFolder> = {
  video: 'videos',
  image: 'images',
  thumbnail: 'thumbnails',
  pose: 'poses',
  podcast: 'podcasts',
};

export async function uploadLocalFile(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const type = (req.body.type as string) || 'image';
    const contentType = req.file.mimetype;

    // Content type validation
    let allowedTypes: string[];
    if (type === 'video') {
      allowedTypes = ALLOWED_VIDEO_TYPES;
    } else if (type === 'podcast') {
      allowedTypes = ALLOWED_AUDIO_TYPES;
    } else {
      allowedTypes = ALLOWED_IMAGE_TYPES;
    }

    if (!validateContentType(contentType, allowedTypes)) {
      return res.status(400).json({
        error: 'Invalid content type',
        allowed: allowedTypes,
      });
    }

    const folder = folderMap[type] ?? 'images';
    const result = await saveFileLocally({
      file: req.file,
      userId: req.user.userId,
      folder,
    });

    logger.info({ userId: req.user.userId, fileUrl: result.fileUrl }, 'File uploaded successfully');

    return res.status(201).json({
      message: 'File uploaded successfully',
      upload: {
        id: result.id,
        fileUrl: result.fileUrl,
        key: result.key,
        filename: result.filename,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to upload file');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
