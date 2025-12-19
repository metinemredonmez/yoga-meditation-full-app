import { prisma } from '../../utils/database';
import { Prisma } from '@prisma/client';
import { HttpError } from '../../middleware/errorHandler';

// ============================================
// Announcements
// ============================================

export interface AnnouncementFilters {
  type?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getAnnouncements(filters: AnnouncementFilters) {
  const { type, isActive, search, page = 1, limit = 20 } = filters;

  const where: Prisma.announcementsWhereInput = {};
  if (type) where.type = type;
  if (isActive !== undefined) where.isActive = isActive;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { message: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [announcements, total] = await Promise.all([
    prisma.announcements.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.announcements.count({ where }),
  ]);

  return {
    announcements,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getAnnouncement(announcementId: string) {
  const announcement = await prisma.announcements.findUnique({
    where: { id: announcementId },
  });

  if (!announcement) throw new HttpError(404, 'Announcement not found');
  return announcement;
}

export async function createAnnouncement(
  createdById: string,
  data: {
    title: string;
    message: string;
    type?: string;
    position?: string;
    dismissible?: boolean;
    targetUrl?: string;
    targetAudience?: object;
    startsAt?: Date;
    endsAt?: Date;
  }
) {
  return prisma.announcements.create({
    data: {
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      position: data.position || 'top',
      dismissible: data.dismissible ?? true,
      targetUrl: data.targetUrl,
      targetAudience: data.targetAudience as Prisma.InputJsonValue,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      isActive: true,
      createdById,
    },
  });
}

export async function updateAnnouncement(
  announcementId: string,
  data: {
    title?: string;
    message?: string;
    type?: string;
    position?: string;
    dismissible?: boolean;
    targetUrl?: string;
    targetAudience?: object;
    startsAt?: Date | null;
    endsAt?: Date | null;
    isActive?: boolean;
  }
) {
  const announcement = await prisma.announcements.findUnique({ where: { id: announcementId } });
  if (!announcement) throw new HttpError(404, 'Announcement not found');

  return prisma.announcements.update({
    where: { id: announcementId },
    data: {
      title: data.title,
      message: data.message,
      type: data.type,
      position: data.position,
      dismissible: data.dismissible,
      targetUrl: data.targetUrl,
      targetAudience: data.targetAudience as Prisma.InputJsonValue,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      isActive: data.isActive,
    },
  });
}

export async function deleteAnnouncement(announcementId: string) {
  const announcement = await prisma.announcements.findUnique({ where: { id: announcementId } });
  if (!announcement) throw new HttpError(404, 'Announcement not found');

  await prisma.announcements.delete({ where: { id: announcementId } });
  return { deleted: true };
}

export async function toggleAnnouncementStatus(announcementId: string) {
  const announcement = await prisma.announcements.findUnique({ where: { id: announcementId } });
  if (!announcement) throw new HttpError(404, 'Announcement not found');

  return prisma.announcements.update({
    where: { id: announcementId },
    data: { isActive: !announcement.isActive },
  });
}

// ============================================
// Public Announcement API
// ============================================

export async function getActiveAnnouncements(_audience?: string) {
  const now = new Date();

  const where: Prisma.announcementsWhereInput = {
    isActive: true,
    OR: [
      { startsAt: null, endsAt: null },
      { startsAt: { lte: now }, endsAt: null },
      { startsAt: null, endsAt: { gte: now } },
      { startsAt: { lte: now }, endsAt: { gte: now } },
    ],
  };

  return prisma.announcements.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      position: true,
      dismissible: true,
      targetUrl: true,
      targetAudience: true,
    },
  });
}

export async function dismissAnnouncement(announcementId: string, userId: string) {
  // This would typically store the dismissal in a separate table
  // For now, we'll just verify the announcement exists
  const announcement = await prisma.announcements.findUnique({
    where: { id: announcementId },
  });

  if (!announcement) throw new HttpError(404, 'Announcement not found');
  if (!announcement.dismissible) throw new HttpError(400, 'This announcement cannot be dismissed');

  // In a real implementation, you'd store this in a UserAnnouncementDismissal table
  return { dismissed: true, announcementId, userId };
}
