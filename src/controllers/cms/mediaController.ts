import { Request, Response, NextFunction } from 'express';
import * as mediaService from '../../services/cms/mediaService';
import { MediaType, MediaStatus } from '@prisma/client';

// ============================================
// Media Files
// ============================================

export async function getMediaFiles(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await mediaService.getMediaFiles({
      type: req.query.type as MediaType | undefined,
      status: req.query.status as MediaStatus | undefined,
      folderId: req.query.folderId as string | undefined,
      search: req.query.search as string | undefined,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getMediaFile(req: Request, res: Response, next: NextFunction) {
  try {
    const file = await mediaService.getMediaFile(req.params.id!);
    res.json({ success: true, file });
  } catch (error) {
    next(error);
  }
}

export async function createMediaFile(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const file = await mediaService.createMediaFile(adminId, req.body);
    res.status(201).json({ success: true, file });
  } catch (error) {
    next(error);
  }
}

export async function updateMediaFile(req: Request, res: Response, next: NextFunction) {
  try {
    const file = await mediaService.updateMediaFile(req.params.id!, req.body);
    res.json({ success: true, file });
  } catch (error) {
    next(error);
  }
}

export async function updateMediaStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, errorMessage } = req.body;
    const file = await mediaService.updateMediaStatus(req.params.id!, status, errorMessage);
    res.json({ success: true, file });
  } catch (error) {
    next(error);
  }
}

export async function deleteMediaFile(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await mediaService.deleteMediaFile(req.params.id!);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function bulkDeleteMediaFiles(req: Request, res: Response, next: NextFunction) {
  try {
    const { fileIds } = req.body;
    const result = await mediaService.bulkDeleteMediaFiles(fileIds);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Media Variants
// ============================================

export async function createMediaVariant(req: Request, res: Response, next: NextFunction) {
  try {
    const variant = await mediaService.createMediaVariant(req.params.mediaId!, req.body);
    res.status(201).json({ success: true, variant });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Media Folders
// ============================================

export async function getMediaFolders(req: Request, res: Response, next: NextFunction) {
  try {
    const parentId = req.query.parentId as string | undefined;
    const folders = await mediaService.getMediaFolders(parentId === 'null' ? null : parentId);
    res.json({ success: true, folders });
  } catch (error) {
    next(error);
  }
}

export async function getMediaFolder(req: Request, res: Response, next: NextFunction) {
  try {
    const folder = await mediaService.getMediaFolder(req.params.id!);
    res.json({ success: true, folder });
  } catch (error) {
    next(error);
  }
}

export async function createMediaFolder(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const folder = await mediaService.createMediaFolder(adminId, req.body);
    res.status(201).json({ success: true, folder });
  } catch (error) {
    next(error);
  }
}

export async function updateMediaFolder(req: Request, res: Response, next: NextFunction) {
  try {
    const folder = await mediaService.updateMediaFolder(req.params.id!, req.body);
    res.json({ success: true, folder });
  } catch (error) {
    next(error);
  }
}

export async function deleteMediaFolder(req: Request, res: Response, next: NextFunction) {
  try {
    await mediaService.deleteMediaFolder(req.params.id!);
    res.json({ success: true, message: 'Folder deleted' });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Media Usage
// ============================================

export async function trackMediaUsage(req: Request, res: Response, next: NextFunction) {
  try {
    const { entityType, entityId, fieldName } = req.body;
    const usage = await mediaService.trackMediaUsage(req.params.mediaId!, entityType, entityId, fieldName);
    res.json({ success: true, usage });
  } catch (error) {
    next(error);
  }
}

export async function removeMediaUsage(req: Request, res: Response, next: NextFunction) {
  try {
    const { entityType, entityId, fieldName } = req.body;
    await mediaService.removeMediaUsage(req.params.mediaId!, entityType, entityId, fieldName);
    res.json({ success: true, message: 'Usage removed' });
  } catch (error) {
    next(error);
  }
}

export async function getMediaUsages(req: Request, res: Response, next: NextFunction) {
  try {
    const usages = await mediaService.getMediaUsages(req.params.mediaId!);
    res.json({ success: true, usages });
  } catch (error) {
    next(error);
  }
}
