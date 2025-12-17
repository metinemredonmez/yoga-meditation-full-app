import { prisma } from '../../utils/database';
import { Prisma } from '@prisma/client';
import { HttpError } from '../../middleware/errorHandler';

// ============================================
// Banners
// ============================================

export interface BannerFilters {
  position?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export async function getBanners(filters: BannerFilters) {
  const { position, isActive, page = 1, limit = 20 } = filters;

  const where: Prisma.BannerWhereInput = {};
  if (position) where.position = position;
  if (isActive !== undefined) where.isActive = isActive;

  const [banners, total] = await Promise.all([
    prisma.banner.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.banner.count({ where }),
  ]);

  return {
    banners,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getBanner(bannerId: string) {
  const banner = await prisma.banner.findUnique({
    where: { id: bannerId },
  });

  if (!banner) throw new HttpError(404, 'Banner not found');
  return banner;
}

export async function createBanner(
  createdById: string,
  data: {
    name: string;
    title?: string;
    subtitle?: string;
    imageUrl: string;
    mobileImageUrl?: string;
    linkUrl?: string;
    linkTarget?: string;
    buttonText?: string;
    buttonStyle?: string;
    position: string;
    startsAt?: Date;
    endsAt?: Date;
    sortOrder?: number;
    targetAudience?: object;
  }
) {
  return prisma.banner.create({
    data: {
      name: data.name,
      title: data.title,
      subtitle: data.subtitle,
      imageUrl: data.imageUrl,
      mobileImageUrl: data.mobileImageUrl,
      linkUrl: data.linkUrl,
      linkTarget: data.linkTarget || '_self',
      buttonText: data.buttonText,
      buttonStyle: data.buttonStyle,
      position: data.position,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      sortOrder: data.sortOrder ?? 0,
      isActive: true,
      targetAudience: data.targetAudience as Prisma.InputJsonValue,
      createdById,
    },
  });
}

export async function updateBanner(
  bannerId: string,
  data: {
    name?: string;
    title?: string;
    subtitle?: string;
    imageUrl?: string;
    mobileImageUrl?: string | null;
    linkUrl?: string;
    linkTarget?: string;
    buttonText?: string;
    buttonStyle?: string;
    position?: string;
    startsAt?: Date | null;
    endsAt?: Date | null;
    sortOrder?: number;
    isActive?: boolean;
    targetAudience?: object;
  }
) {
  const banner = await prisma.banner.findUnique({ where: { id: bannerId } });
  if (!banner) throw new HttpError(404, 'Banner not found');

  return prisma.banner.update({
    where: { id: bannerId },
    data: {
      name: data.name,
      title: data.title,
      subtitle: data.subtitle,
      imageUrl: data.imageUrl,
      mobileImageUrl: data.mobileImageUrl,
      linkUrl: data.linkUrl,
      linkTarget: data.linkTarget,
      buttonText: data.buttonText,
      buttonStyle: data.buttonStyle,
      position: data.position,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
      targetAudience: data.targetAudience as Prisma.InputJsonValue,
    },
  });
}

export async function deleteBanner(bannerId: string) {
  const banner = await prisma.banner.findUnique({ where: { id: bannerId } });
  if (!banner) throw new HttpError(404, 'Banner not found');

  await prisma.banner.delete({ where: { id: bannerId } });
  return { deleted: true };
}

export async function toggleBannerStatus(bannerId: string) {
  const banner = await prisma.banner.findUnique({ where: { id: bannerId } });
  if (!banner) throw new HttpError(404, 'Banner not found');

  return prisma.banner.update({
    where: { id: bannerId },
    data: { isActive: !banner.isActive },
  });
}

export async function reorderBanners(bannerIds: string[]) {
  const updates = bannerIds.map((id, index) =>
    prisma.banner.update({
      where: { id },
      data: { sortOrder: index },
    })
  );

  await prisma.$transaction(updates);
  return { success: true };
}

// ============================================
// Public Banner API
// ============================================

export async function getActiveBanners(position?: string) {
  const now = new Date();

  const where: Prisma.BannerWhereInput = {
    isActive: true,
    OR: [
      { startsAt: null, endsAt: null },
      { startsAt: { lte: now }, endsAt: null },
      { startsAt: null, endsAt: { gte: now } },
      { startsAt: { lte: now }, endsAt: { gte: now } },
    ],
  };

  if (position) where.position = position;

  return prisma.banner.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      title: true,
      subtitle: true,
      imageUrl: true,
      mobileImageUrl: true,
      linkUrl: true,
      linkTarget: true,
      buttonText: true,
      buttonStyle: true,
      position: true,
      targetAudience: true,
    },
  });
}

export async function incrementBannerImpressions(bannerId: string) {
  return prisma.banner.update({
    where: { id: bannerId },
    data: { impressions: { increment: 1 } },
  });
}

export async function incrementBannerClicks(bannerId: string) {
  return prisma.banner.update({
    where: { id: bannerId },
    data: { clicks: { increment: 1 } },
  });
}
