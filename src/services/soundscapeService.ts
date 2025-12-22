import { prisma } from '../utils/database';
import { SoundscapeCategory } from '@prisma/client';
import type {
  SoundscapeFilters,
  CreateMixInput,
  UpdateMixInput,
  CreateSoundscapeInput,
  UpdateSoundscapeInput,
} from '../validation/soundscapeSchemas';

// ==================== USER SERVICES ====================

export async function getSoundscapes(filters: SoundscapeFilters) {
  const { category, isPremium, isMixable, search, page, limit, sortBy, sortOrder } = filters;

  const where: any = {
    isPublished: true,
  };

  if (category) where.category = category;
  if (isPremium !== undefined) where.isPremium = isPremium;
  if (isMixable !== undefined) where.isMixable = isMixable;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { tags: { has: search.toLowerCase() } },
    ];
  }

  const [soundscapes, total] = await Promise.all([
    prisma.soundscapes.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.soundscapes.count({ where }),
  ]);

  return {
    soundscapes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getSoundscape(id: string, userId?: string) {
  const soundscape = await prisma.soundscapes.findUnique({
    where: { id, isPublished: true },
  });

  if (!soundscape) return null;

  let isFavorite = false;
  if (userId) {
    const favorite = await prisma.soundscape_favorites.findUnique({
      where: { soundscapeId_userId: { soundscapeId: id, userId } },
    });
    isFavorite = !!favorite;
  }

  return { ...soundscape, isFavorite };
}

export async function getCategories() {
  const categories = await prisma.soundscapes.groupBy({
    by: ['category'],
    where: { isPublished: true },
    _count: { category: true },
    orderBy: { _count: { category: 'desc' } },
  });

  return categories.map((c: { category: SoundscapeCategory; _count: { category: number } }) => ({
    category: c.category,
    count: c._count.category,
  }));
}

export async function getSoundscapesByCategory(category: SoundscapeCategory, limit: number = 20) {
  return prisma.soundscapes.findMany({
    where: { category, isPublished: true },
    take: limit,
    orderBy: { playCount: 'desc' },
  });
}

export async function getMixableSoundscapes() {
  return prisma.soundscapes.findMany({
    where: { isPublished: true, isMixable: true },
    orderBy: [{ category: 'asc' }, { title: 'asc' }],
  });
}

export async function searchSoundscapes(query: string, limit: number = 20) {
  return prisma.soundscapes.findMany({
    where: {
      isPublished: true,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { tags: { has: query.toLowerCase() } },
      ],
    },
    take: limit,
    orderBy: { playCount: 'desc' },
  });
}

export async function incrementPlayCount(id: string) {
  return prisma.soundscapes.update({
    where: { id },
    data: { playCount: { increment: 1 } },
  });
}

// ==================== FAVORITES ====================

export async function addFavorite(userId: string, soundscapeId: string) {
  return prisma.soundscape_favorites.create({
    data: { userId, soundscapeId },
  });
}

export async function removeFavorite(userId: string, soundscapeId: string) {
  return prisma.soundscape_favorites.delete({
    where: { soundscapeId_userId: { soundscapeId, userId } },
  });
}

export async function getUserFavorites(userId: string, page: number = 1, limit: number = 20) {
  const [favorites, total] = await Promise.all([
    prisma.soundscape_favorites.findMany({
      where: { userId },
      include: { soundscape: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.soundscape_favorites.count({ where: { userId } }),
  ]);

  return {
    soundscapes: favorites.map((f: any) => ({ ...f.soundscape, isFavorite: true })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ==================== MIXES ====================

export async function getUserMixes(userId: string, page: number = 1, limit: number = 20) {
  const [mixes, total] = await Promise.all([
    prisma.user_sound_mixes.findMany({
      where: { userId },
      include: {
        items: {
          include: { soundscape: true },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.user_sound_mixes.count({ where: { userId } }),
  ]);

  return {
    mixes,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getMix(mixId: string, userId?: string) {
  const mix = await prisma.user_sound_mixes.findUnique({
    where: { id: mixId },
    include: {
      items: {
        include: { soundscape: true },
      },
      user: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  if (!mix) return null;

  // Check access
  if (!mix.isPublic && mix.userId !== userId) {
    return null;
  }

  return mix;
}

export async function getPublicMixes(page: number = 1, limit: number = 20) {
  const [mixes, total] = await Promise.all([
    prisma.user_sound_mixes.findMany({
      where: { isPublic: true },
      include: {
        items: {
          include: { soundscape: true },
        },
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { playCount: 'desc' },
    }),
    prisma.user_sound_mixes.count({ where: { isPublic: true } }),
  ]);

  return {
    mixes,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function createMix(userId: string, input: CreateMixInput) {
  const { items, ...mixData } = input;

  const mix = await prisma.user_sound_mixes.create({
    data: {
      ...mixData,
      userId,
      items: {
        create: items.map((item) => ({
          soundscapeId: item.soundscapeId,
          volume: item.volume,
        })),
      },
    },
    include: {
      items: {
        include: { soundscape: true },
      },
    },
  });

  return mix;
}

export async function updateMix(userId: string, mixId: string, input: UpdateMixInput) {
  const existing = await prisma.user_sound_mixes.findUnique({
    where: { id: mixId },
  });

  if (!existing || existing.userId !== userId) {
    throw new Error('Mix not found');
  }

  const { items, ...mixData } = input;

  // If items provided, replace all
  if (items) {
    await prisma.sound_mix_items.deleteMany({
      where: { mixId },
    });
  }

  const mix = await prisma.user_sound_mixes.update({
    where: { id: mixId },
    data: {
      ...mixData,
      ...(items && {
        items: {
          create: items.map((item) => ({
            soundscapeId: item.soundscapeId,
            volume: item.volume,
          })),
        },
      }),
    },
    include: {
      items: {
        include: { soundscape: true },
      },
    },
  });

  return mix;
}

export async function deleteMix(userId: string, mixId: string) {
  const existing = await prisma.user_sound_mixes.findUnique({
    where: { id: mixId },
  });

  if (!existing || existing.userId !== userId) {
    throw new Error('Mix not found');
  }

  await prisma.user_sound_mixes.delete({
    where: { id: mixId },
  });
}

export async function incrementMixPlayCount(mixId: string) {
  return prisma.user_sound_mixes.update({
    where: { id: mixId },
    data: { playCount: { increment: 1 } },
  });
}

// ==================== ADMIN SERVICES ====================

export async function getAdminSoundscapes(filters: SoundscapeFilters) {
  const { category, isPremium, isFree, isMixable, isLoop, isPublished, search, page, limit, sortBy, sortOrder } = filters;

  const where: any = {};

  if (category) where.category = category;
  if (isPremium !== undefined) where.isPremium = isPremium;
  if (isFree !== undefined) where.isPremium = !isFree; // isFree = not premium
  if (isMixable !== undefined) where.isMixable = isMixable;
  if (isLoop !== undefined) where.isLoop = isLoop;
  if (isPublished !== undefined) where.isPublished = isPublished;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [soundscapes, total] = await Promise.all([
    prisma.soundscapes.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.soundscapes.count({ where }),
  ]);

  return {
    soundscapes,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getSoundscapeStats() {
  const [total, active, premium, free, byCategory, totalPlays] = await Promise.all([
    prisma.soundscapes.count(),
    prisma.soundscapes.count({ where: { isPublished: true } }),
    prisma.soundscapes.count({ where: { isPremium: true } }),
    prisma.soundscapes.count({ where: { isPremium: false } }),
    prisma.soundscapes.groupBy({
      by: ['category'],
      _count: { category: true },
    }),
    prisma.soundscapes.aggregate({
      _sum: { playCount: true },
    }),
  ]);

  return {
    total,
    active,
    premium,
    free,
    byCategory: byCategory.map((c: { category: SoundscapeCategory; _count: { category: number } }) => ({ category: c.category, count: c._count.category })),
    totalPlays: totalPlays._sum.playCount || 0,
  };
}

export async function createSoundscape(input: CreateSoundscapeInput) {
  return prisma.soundscapes.create({
    data: input,
  });
}

export async function updateSoundscape(id: string, input: UpdateSoundscapeInput) {
  return prisma.soundscapes.update({
    where: { id },
    data: input,
  });
}

export async function deleteSoundscape(id: string) {
  return prisma.soundscapes.delete({
    where: { id },
  });
}
