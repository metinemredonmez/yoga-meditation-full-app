import { prisma } from '../../utils/database';
import { MediaType, MediaStatus, Prisma } from '@prisma/client';
import { HttpError } from '../../middleware/errorHandler';

// ============================================
// Media Files
// ============================================

export interface MediaFilters {
  type?: MediaType;
  status?: MediaStatus;
  folderId?: string | null;
  search?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}

export async function getMediaFiles(filters: MediaFilters) {
  const { type, status, folderId, search, tags, page = 1, limit = 20 } = filters;

  const where: Prisma.media_filesWhereInput = {};
  if (type) where.type = type;
  if (status) where.status = status;
  if (folderId !== undefined) where.folderId = folderId;
  if (search) {
    where.OR = [
      { filename: { contains: search, mode: 'insensitive' } },
      { originalName: { contains: search, mode: 'insensitive' } },
      { alt: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (tags && tags.length > 0) {
    where.tags = { hasEvery: tags };
  }

  const [files, total] = await Promise.all([
    prisma.media_files.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        media_folders: { select: { id: true, name: true, slug: true } },
        media_variants: true,
        _count: { select: { media_usages: true } },
      },
    }),
    prisma.media_files.count({ where }),
  ]);

  return {
    files,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getMediaFile(fileId: string) {
  const file = await prisma.media_files.findUnique({
    where: { id: fileId },
    include: {
      media_folders: { select: { id: true, name: true, slug: true } },
      media_variants: true,
      media_usages: true,
    },
  });

  if (!file) throw new HttpError(404, 'Media file not found');
  return file;
}

export async function createMediaFile(
  uploadedById: string,
  data: {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    storageKey: string;
    type: MediaType;
    width?: number;
    height?: number;
    duration?: number;
    folderId?: string;
    alt?: string;
    caption?: string;
    tags?: string[];
    metadata?: object;
  }
) {
  return prisma.media_files.create({
    data: {
      filename: data.filename,
      originalName: data.originalName,
      mimeType: data.mimeType,
      size: data.size,
      url: data.url,
      storageKey: data.storageKey,
      type: data.type,
      status: 'PROCESSING',
      width: data.width,
      height: data.height,
      duration: data.duration,
      folderId: data.folderId,
      alt: data.alt,
      caption: data.caption,
      tags: data.tags || [],
      metadata: data.metadata as Prisma.InputJsonValue,
      uploadedById,
    },
    include: {
      media_folders: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function updateMediaFile(
  fileId: string,
  data: {
    filename?: string;
    alt?: string;
    caption?: string;
    tags?: string[];
    folderId?: string | null;
    metadata?: object;
  }
) {
  const file = await prisma.media_files.findUnique({ where: { id: fileId } });
  if (!file) throw new HttpError(404, 'Media file not found');

  return prisma.media_files.update({
    where: { id: fileId },
    data: {
      filename: data.filename,
      alt: data.alt,
      caption: data.caption,
      tags: data.tags,
      folderId: data.folderId,
      metadata: data.metadata as Prisma.InputJsonValue,
    },
    include: {
      media_folders: { select: { id: true, name: true, slug: true } },
      media_variants: true,
    },
  });
}

export async function updateMediaStatus(fileId: string, status: MediaStatus, errorMessage?: string) {
  return prisma.media_files.update({
    where: { id: fileId },
    data: {
      status,
      errorMessage,
      processedAt: status === 'READY' ? new Date() : undefined,
    },
  });
}

export async function deleteMediaFile(fileId: string) {
  const file = await prisma.media_files.findUnique({
    where: { id: fileId },
    include: { _count: { select: { media_usages: true } } },
  });

  if (!file) throw new HttpError(404, 'Media file not found');
  if (file._count.media_usages > 0) {
    throw new HttpError(400, 'Cannot delete media file that is in use');
  }

  await prisma.media_files.delete({ where: { id: fileId } });
  return { deleted: true, storageKey: file.storageKey };
}

export async function bulkDeleteMediaFiles(fileIds: string[]) {
  const filesInUse = await prisma.media_files.findMany({
    where: {
      id: { in: fileIds },
      media_usages: { some: {} },
    },
    select: { id: true },
  });

  const inUseIds = new Set(filesInUse.map((f) => f.id));
  const deletableIds = fileIds.filter((id) => !inUseIds.has(id));

  if (deletableIds.length === 0) {
    throw new HttpError(400, 'All selected files are in use');
  }

  const files = await prisma.media_files.findMany({
    where: { id: { in: deletableIds } },
    select: { id: true, storageKey: true },
  });

  await prisma.media_files.deleteMany({ where: { id: { in: deletableIds } } });

  return {
    deleted: deletableIds.length,
    skipped: fileIds.length - deletableIds.length,
    storageKeys: files.map((f) => f.storageKey),
  };
}

// ============================================
// Media Variants
// ============================================

export async function createMediaVariant(
  mediaId: string,
  data: {
    variantType: string;
    url: string;
    storageKey: string;
    width?: number;
    height?: number;
    size: number;
    format: string;
  }
) {
  return prisma.media_variants.create({
    data: {
      mediaId,
      variantType: data.variantType,
      url: data.url,
      storageKey: data.storageKey,
      width: data.width,
      height: data.height,
      size: data.size,
      format: data.format,
    },
  });
}

// ============================================
// Media Folders
// ============================================

export async function getMediaFolders(parentId?: string | null) {
  const where: Prisma.media_foldersWhereInput = {};
  if (parentId !== undefined) where.parentId = parentId;

  return prisma.media_folders.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { media_files: true, other_media_folders: true } },
    },
  });
}

export async function getMediaFolder(folderId: string) {
  const folder = await prisma.media_folders.findUnique({
    where: { id: folderId },
    include: {
      media_folders: { select: { id: true, name: true, slug: true } },
      other_media_folders: { select: { id: true, name: true, slug: true } },
      _count: { select: { media_files: true } },
    },
  });

  if (!folder) throw new HttpError(404, 'Folder not found');
  return folder;
}

export async function createMediaFolder(
  createdById: string,
  data: {
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
  }
) {
  const existing = await prisma.media_folders.findUnique({ where: { slug: data.slug } });
  if (existing) throw new HttpError(400, 'Folder with this slug already exists');

  return prisma.media_folders.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      parentId: data.parentId,
      createdById,
    },
    include: {
      media_folders: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function updateMediaFolder(
  folderId: string,
  data: {
    name?: string;
    description?: string;
    parentId?: string | null;
  }
) {
  const folder = await prisma.media_folders.findUnique({ where: { id: folderId } });
  if (!folder) throw new HttpError(404, 'Folder not found');

  // Prevent circular references
  if (data.parentId === folderId) {
    throw new HttpError(400, 'Folder cannot be its own parent');
  }

  return prisma.media_folders.update({
    where: { id: folderId },
    data: {
      name: data.name,
      description: data.description,
      parentId: data.parentId,
    },
    include: {
      media_folders: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function deleteMediaFolder(folderId: string) {
  const folder = await prisma.media_folders.findUnique({
    where: { id: folderId },
    include: { _count: { select: { media_files: true, other_media_folders: true } } },
  });

  if (!folder) throw new HttpError(404, 'Folder not found');
  if (folder._count.media_files > 0 || folder._count.other_media_folders > 0) {
    throw new HttpError(400, 'Folder must be empty before deletion');
  }

  await prisma.media_folders.delete({ where: { id: folderId } });
  return { deleted: true };
}

// ============================================
// Media Usage Tracking
// ============================================

export async function trackMediaUsage(
  mediaId: string,
  entityType: string,
  entityId: string,
  fieldName: string
) {
  return prisma.media_usages.upsert({
    where: {
      mediaId_entityType_entityId_fieldName: {
        mediaId,
        entityType,
        entityId,
        fieldName,
      },
    },
    update: {},
    create: {
      mediaId,
      entityType,
      entityId,
      fieldName,
    },
  });
}

export async function removeMediaUsage(
  mediaId: string,
  entityType: string,
  entityId: string,
  fieldName: string
) {
  await prisma.media_usages.deleteMany({
    where: { mediaId, entityType, entityId, fieldName },
  });
}

export async function getMediaUsages(mediaId: string) {
  return prisma.media_usages.findMany({
    where: { mediaId },
  });
}
