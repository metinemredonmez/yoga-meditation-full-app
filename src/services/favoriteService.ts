import { FavoriteType, Prisma } from '@prisma/client';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

export interface FavoriteItem {
  id: string;
  itemId: string;
  itemType: FavoriteType;
  createdAt: Date;
}

export interface FavoriteWithDetails {
  id: string;
  itemId: string;
  itemType: FavoriteType;
  createdAt: Date;
  item: ProgramDetails | PoseDetails | ClassDetails | null;
}

export interface ProgramDetails {
  id: string;
  title: string;
  description: string;
  level: string;
  durationMin: number;
  coverUrl: string | null;
}

export interface PoseDetails {
  id: string;
  englishName: string;
  sanskritName: string | null;
  difficulty: string;
  bodyArea: string;
  imageUrl: string | null;
}

export interface ClassDetails {
  id: string;
  title: string;
  description: string | null;
  schedule: Date;
  instructor: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FavoriteCounts {
  programs: number;
  poses: number;
  classes: number;
  total: number;
}

export async function addFavorite(
  userId: string,
  itemId: string,
  itemType: FavoriteType,
): Promise<FavoriteItem> {
  // Use upsert to handle duplicate gracefully
  const favorite = await prisma.favorite.upsert({
    where: {
      userId_itemId_itemType: { userId, itemId, itemType },
    },
    create: {
      userId,
      itemId,
      itemType,
    },
    update: {}, // No update needed, just return existing
  });

  logger.info({ userId, itemId, itemType }, 'Favorite added');

  return {
    id: favorite.id,
    itemId: favorite.itemId,
    itemType: favorite.itemType,
    createdAt: favorite.createdAt,
  };
}

export async function removeFavorite(
  userId: string,
  itemId: string,
  itemType: FavoriteType,
): Promise<boolean> {
  try {
    await prisma.favorite.delete({
      where: {
        userId_itemId_itemType: { userId, itemId, itemType },
      },
    });

    logger.info({ userId, itemId, itemType }, 'Favorite removed');
    return true;
  } catch (error) {
    // If not found, return false silently
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return false;
    }
    throw error;
  }
}

export async function toggleFavorite(
  userId: string,
  itemId: string,
  itemType: FavoriteType,
): Promise<{ isFavorite: boolean; favorite?: FavoriteItem }> {
  const existing = await prisma.favorite.findUnique({
    where: {
      userId_itemId_itemType: { userId, itemId, itemType },
    },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: { id: existing.id },
    });
    logger.info({ userId, itemId, itemType }, 'Favorite toggled off');
    return { isFavorite: false };
  }

  const favorite = await prisma.favorite.create({
    data: { userId, itemId, itemType },
  });

  logger.info({ userId, itemId, itemType }, 'Favorite toggled on');

  return {
    isFavorite: true,
    favorite: {
      id: favorite.id,
      itemId: favorite.itemId,
      itemType: favorite.itemType,
      createdAt: favorite.createdAt,
    },
  };
}

export async function isFavorite(
  userId: string,
  itemId: string,
  itemType: FavoriteType,
): Promise<boolean> {
  const count = await prisma.favorite.count({
    where: { userId, itemId, itemType },
  });
  return count > 0;
}

export async function getUserFavorites(
  userId: string,
  itemType?: FavoriteType,
  pagination: PaginationParams = {},
): Promise<PaginatedResult<FavoriteWithDetails>> {
  const page = pagination.page || 1;
  const limit = pagination.limit || 20;
  const skip = (page - 1) * limit;

  const where: Prisma.FavoriteWhereInput = { userId };
  if (itemType) {
    where.itemType = itemType;
  }

  const [favorites, total] = await Promise.all([
    prisma.favorite.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.favorite.count({ where }),
  ]);

  // Fetch item details for each favorite
  const items = await Promise.all(
    favorites.map(async (fav) => {
      const item = await getItemDetails(fav.itemId, fav.itemType);
      return {
        id: fav.id,
        itemId: fav.itemId,
        itemType: fav.itemType,
        createdAt: fav.createdAt,
        item,
      };
    }),
  );

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getFavoritesByType(
  userId: string,
  itemType: FavoriteType,
  pagination: PaginationParams = {},
): Promise<PaginatedResult<FavoriteWithDetails>> {
  return getUserFavorites(userId, itemType, pagination);
}

export async function getFavoriteCounts(userId: string): Promise<FavoriteCounts> {
  const [programs, poses, classes] = await Promise.all([
    prisma.favorite.count({ where: { userId, itemType: 'PROGRAM' } }),
    prisma.favorite.count({ where: { userId, itemType: 'POSE' } }),
    prisma.favorite.count({ where: { userId, itemType: 'CLASS' } }),
  ]);

  return {
    programs,
    poses,
    classes,
    total: programs + poses + classes,
  };
}

export async function bulkCheckFavorites(
  userId: string,
  items: Array<{ itemId: string; itemType: FavoriteType }>,
): Promise<Map<string, boolean>> {
  if (items.length === 0) {
    return new Map();
  }

  // Build OR conditions for all items
  const orConditions: Prisma.FavoriteWhereInput[] = items.map((item) => ({
    itemId: item.itemId,
    itemType: item.itemType,
  }));

  const favorites = await prisma.favorite.findMany({
    where: {
      userId,
      OR: orConditions,
    },
    select: {
      itemId: true,
      itemType: true,
    },
  });

  // Create a map of existing favorites
  const favoriteSet = new Set(
    favorites.map((f) => `${f.itemType}:${f.itemId}`),
  );

  // Build result map
  const result = new Map<string, boolean>();
  items.forEach((item) => {
    const key = `${item.itemType}:${item.itemId}`;
    result.set(key, favoriteSet.has(key));
  });

  return result;
}

async function getItemDetails(
  itemId: string,
  itemType: FavoriteType,
): Promise<ProgramDetails | PoseDetails | ClassDetails | null> {
  switch (itemType) {
    case 'PROGRAM': {
      const program = await prisma.program.findUnique({
        where: { id: itemId },
        select: {
          id: true,
          title: true,
          description: true,
          level: true,
          durationMin: true,
          coverUrl: true,
        },
      });
      return program;
    }
    case 'POSE': {
      const pose = await prisma.pose.findUnique({
        where: { id: itemId },
        select: {
          id: true,
          englishName: true,
          sanskritName: true,
          difficulty: true,
          bodyArea: true,
          imageUrl: true,
        },
      });
      return pose;
    }
    case 'CLASS': {
      const classItem = await prisma.class.findUnique({
        where: { id: itemId },
        select: {
          id: true,
          title: true,
          description: true,
          schedule: true,
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
      return classItem;
    }
    default:
      return null;
  }
}

export async function checkItemExists(
  itemId: string,
  itemType: FavoriteType,
): Promise<boolean> {
  switch (itemType) {
    case 'PROGRAM': {
      const count = await prisma.program.count({ where: { id: itemId } });
      return count > 0;
    }
    case 'POSE': {
      const count = await prisma.pose.count({ where: { id: itemId } });
      return count > 0;
    }
    case 'CLASS': {
      const count = await prisma.class.count({ where: { id: itemId } });
      return count > 0;
    }
    default:
      return false;
  }
}
