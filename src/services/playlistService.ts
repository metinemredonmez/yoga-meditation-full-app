import { prisma } from '../utils/database';
import type { PlaylistType, PlaylistContentType, PlaylistItemType } from '@prisma/client';
import type {
  CreatePlaylistInput,
  UpdatePlaylistInput,
  PlaylistFilters,
  AddPlaylistItemInput,
  UpdatePlaylistItemInput,
  ReorderPlaylistItemsInput,
  FeaturedPlaylistsQuery,
  AdminCreatePlaylistInput,
  AdminUpdatePlaylistInput,
  AdminPlaylistFilters,
} from '../validation/playlistSchemas';

// ==================== USER PLAYLISTS ====================

export async function getUserPlaylists(userId: string, filters: PlaylistFilters) {
  const { type, contentType, isPublic, isFeatured, search, page, limit, sortBy, sortOrder } = filters;

  const where: any = {
    OR: [
      { userId }, // User's own playlists
      { isPublic: true, isPublished: true }, // Public playlists
    ],
  };

  if (type) where.type = type;
  if (contentType) where.contentType = contentType;
  if (isPublic !== undefined) where.isPublic = isPublic;
  if (isFeatured !== undefined) where.isFeatured = isFeatured;

  if (search) {
    where.AND = [
      {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      },
    ];
  }

  const [playlists, total] = await Promise.all([
    prisma.playlists.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        _count: {
          select: { items: true, savedBy: true },
        },
      },
    }),
    prisma.playlists.count({ where }),
  ]);

  return {
    playlists,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getMyPlaylists(userId: string, filters: PlaylistFilters) {
  const { contentType, search, page, limit, sortBy, sortOrder } = filters;

  const where: any = { userId };

  if (contentType) where.contentType = contentType;

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [playlists, total] = await Promise.all([
    prisma.playlists.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: {
          select: { items: true },
        },
      },
    }),
    prisma.playlists.count({ where }),
  ]);

  return {
    playlists,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getPlaylist(userId: string, id: string) {
  const playlist = await prisma.playlists.findFirst({
    where: {
      id,
      OR: [
        { userId },
        { isPublic: true, isPublished: true },
      ],
    },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      },
      items: {
        orderBy: { sortOrder: 'asc' },
        include: {
          meditation: {
            select: {
              id: true,
              slug: true,
              title: true,
              titleEn: true,
              coverImage: true,
              duration: true,
              isPremium: true,
            },
          },
          breathwork: {
            select: {
              id: true,
              slug: true,
              title: true,
              titleEn: true,
              coverImage: true,
              totalDuration: true,
              isPremium: true,
            },
          },
          soundscape: {
            select: {
              id: true,
              slug: true,
              title: true,
              titleEn: true,
              coverImage: true,
              duration: true,
              isPremium: true,
            },
          },
          sleepStory: {
            select: {
              id: true,
              slug: true,
              title: true,
              titleEn: true,
              coverImageUrl: true,
              duration: true,
              isPremium: true,
            },
          },
        },
      },
      _count: {
        select: { savedBy: true },
      },
    },
  });

  return playlist;
}

export async function createPlaylist(userId: string, input: CreatePlaylistInput) {
  return prisma.playlists.create({
    data: {
      userId,
      name: input.name,
      nameEn: input.nameEn,
      description: input.description,
      descriptionEn: input.descriptionEn,
      coverImage: input.coverImage,
      color: input.color,
      contentType: input.contentType as PlaylistContentType,
      type: 'CUSTOM',
      isPublic: input.isPublic,
    },
    include: {
      _count: {
        select: { items: true },
      },
    },
  });
}

export async function updatePlaylist(userId: string, id: string, input: UpdatePlaylistInput) {
  const existing = await prisma.playlists.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error('Playlist not found');
  }

  return prisma.playlists.update({
    where: { id },
    data: {
      ...input,
      contentType: input.contentType as PlaylistContentType | undefined,
    },
    include: {
      _count: {
        select: { items: true },
      },
    },
  });
}

export async function deletePlaylist(userId: string, id: string) {
  const existing = await prisma.playlists.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error('Playlist not found');
  }

  return prisma.playlists.delete({
    where: { id },
  });
}

// ==================== PLAYLIST ITEMS ====================

export async function addPlaylistItem(userId: string, playlistId: string, input: AddPlaylistItemInput) {
  const playlist = await prisma.playlists.findFirst({
    where: { id: playlistId, userId },
  });

  if (!playlist) {
    throw new Error('Playlist not found');
  }

  // Validate content exists
  const contentField = getContentField(input.contentType);
  const contentModel = getContentModel(input.contentType);
  const content = await (prisma as any)[contentModel].findUnique({
    where: { id: input.contentId },
  });

  if (!content) {
    throw new Error(`${input.contentType} not found`);
  }

  // Get max sort order
  const maxOrder = await prisma.playlist_items.aggregate({
    where: { playlistId },
    _max: { sortOrder: true },
  });

  const sortOrder = input.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1;

  // Create item
  const item = await prisma.playlist_items.create({
    data: {
      playlistId,
      contentType: input.contentType as PlaylistItemType,
      [contentField]: input.contentId,
      note: input.note,
      sortOrder,
    },
    include: {
      meditation: true,
      breathwork: true,
      soundscape: true,
      sleepStory: true,
    },
  });

  // Update playlist stats
  await updatePlaylistStats(playlistId);

  return item;
}

export async function updatePlaylistItem(userId: string, playlistId: string, itemId: string, input: UpdatePlaylistItemInput) {
  const playlist = await prisma.playlists.findFirst({
    where: { id: playlistId, userId },
  });

  if (!playlist) {
    throw new Error('Playlist not found');
  }

  const item = await prisma.playlist_items.findFirst({
    where: { id: itemId, playlistId },
  });

  if (!item) {
    throw new Error('Playlist item not found');
  }

  return prisma.playlist_items.update({
    where: { id: itemId },
    data: input,
    include: {
      meditation: true,
      breathwork: true,
      soundscape: true,
      sleepStory: true,
    },
  });
}

export async function removePlaylistItem(userId: string, playlistId: string, itemId: string) {
  const playlist = await prisma.playlists.findFirst({
    where: { id: playlistId, userId },
  });

  if (!playlist) {
    throw new Error('Playlist not found');
  }

  const item = await prisma.playlist_items.findFirst({
    where: { id: itemId, playlistId },
  });

  if (!item) {
    throw new Error('Playlist item not found');
  }

  await prisma.playlist_items.delete({
    where: { id: itemId },
  });

  // Update playlist stats
  await updatePlaylistStats(playlistId);
}

export async function reorderPlaylistItems(userId: string, playlistId: string, input: ReorderPlaylistItemsInput) {
  const playlist = await prisma.playlists.findFirst({
    where: { id: playlistId, userId },
  });

  if (!playlist) {
    throw new Error('Playlist not found');
  }

  // Update all items
  await prisma.$transaction(
    input.items.map((item) =>
      prisma.playlist_items.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    )
  );

  return prisma.playlist_items.findMany({
    where: { playlistId },
    orderBy: { sortOrder: 'asc' },
    include: {
      meditation: true,
      breathwork: true,
      soundscape: true,
      sleepStory: true,
    },
  });
}

// ==================== SAVE/UNSAVE PLAYLISTS ====================

export async function savePlaylist(userId: string, playlistId: string) {
  const playlist = await prisma.playlists.findFirst({
    where: {
      id: playlistId,
      isPublic: true,
      isPublished: true,
    },
  });

  if (!playlist) {
    throw new Error('Playlist not found');
  }

  // Check if already saved
  const existing = await prisma.saved_playlists.findUnique({
    where: {
      userId_playlistId: { userId, playlistId },
    },
  });

  if (existing) {
    throw new Error('Playlist already saved');
  }

  const saved = await prisma.saved_playlists.create({
    data: { userId, playlistId },
  });

  // Increment save count
  await prisma.playlists.update({
    where: { id: playlistId },
    data: { saveCount: { increment: 1 } },
  });

  return saved;
}

export async function unsavePlaylist(userId: string, playlistId: string) {
  const saved = await prisma.saved_playlists.findUnique({
    where: {
      userId_playlistId: { userId, playlistId },
    },
  });

  if (!saved) {
    throw new Error('Playlist not saved');
  }

  await prisma.saved_playlists.delete({
    where: { id: saved.id },
  });

  // Decrement save count
  await prisma.playlists.update({
    where: { id: playlistId },
    data: { saveCount: { decrement: 1 } },
  });
}

export async function getSavedPlaylists(userId: string, page: number = 1, limit: number = 20) {
  const [saved, total] = await Promise.all([
    prisma.saved_playlists.findMany({
      where: { userId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        playlist: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
            _count: {
              select: { items: true, savedBy: true },
            },
          },
        },
      },
    }),
    prisma.saved_playlists.count({ where: { userId } }),
  ]);

  return {
    playlists: saved.map((s) => s.playlist),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ==================== FEATURED PLAYLISTS ====================

export async function getFeaturedPlaylists(query: FeaturedPlaylistsQuery) {
  const { contentType, limit } = query;

  const where: any = {
    isFeatured: true,
    isPublic: true,
    isPublished: true,
  };

  if (contentType) where.contentType = contentType;

  return prisma.playlists.findMany({
    where,
    take: limit,
    orderBy: [{ sortOrder: 'asc' }, { playCount: 'desc' }],
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      },
      _count: {
        select: { items: true, savedBy: true },
      },
    },
  });
}

export async function getSystemPlaylists(contentType?: string) {
  const where: any = {
    isSystem: true,
    isPublished: true,
  };

  if (contentType) where.contentType = contentType;

  return prisma.playlists.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: {
      _count: {
        select: { items: true },
      },
    },
  });
}

// ==================== PLAY TRACKING ====================

export async function incrementPlayCount(playlistId: string) {
  return prisma.playlists.update({
    where: { id: playlistId },
    data: { playCount: { increment: 1 } },
  });
}

// ==================== ADMIN FUNCTIONS ====================

export async function getAdminPlaylists(filters: AdminPlaylistFilters) {
  const { type, contentType, isSystem, isPublic, isFeatured, isPublished, search, page, limit, sortBy, sortOrder } = filters;

  const where: any = {};

  if (type) where.type = type;
  if (contentType) where.contentType = contentType;
  if (isSystem !== undefined) where.isSystem = isSystem;
  if (isPublic !== undefined) where.isPublic = isPublic;
  if (isFeatured !== undefined) where.isFeatured = isFeatured;
  if (isPublished !== undefined) where.isPublished = isPublished;

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [playlists, total] = await Promise.all([
    prisma.playlists.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: {
          select: { items: true, savedBy: true },
        },
      },
    }),
    prisma.playlists.count({ where }),
  ]);

  return {
    playlists,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function adminCreatePlaylist(input: AdminCreatePlaylistInput) {
  return prisma.playlists.create({
    data: {
      name: input.name,
      nameEn: input.nameEn,
      description: input.description,
      descriptionEn: input.descriptionEn,
      coverImage: input.coverImage,
      color: input.color,
      type: input.type as PlaylistType,
      contentType: input.contentType as PlaylistContentType,
      isSystem: input.isSystem,
      isPublic: input.isPublic,
      isFeatured: input.isFeatured,
      isPublished: input.isPublished,
      sortOrder: input.sortOrder,
    },
    include: {
      _count: {
        select: { items: true },
      },
    },
  });
}

export async function adminUpdatePlaylist(id: string, input: AdminUpdatePlaylistInput) {
  return prisma.playlists.update({
    where: { id },
    data: {
      ...input,
      type: input.type as PlaylistType | undefined,
      contentType: input.contentType as PlaylistContentType | undefined,
    },
    include: {
      _count: {
        select: { items: true, savedBy: true },
      },
    },
  });
}

export async function adminDeletePlaylist(id: string) {
  return prisma.playlists.delete({
    where: { id },
  });
}

export async function adminAddPlaylistItem(playlistId: string, input: AddPlaylistItemInput) {
  // Validate content exists
  const contentField = getContentField(input.contentType);
  const contentModel = getContentModel(input.contentType);
  const content = await (prisma as any)[contentModel].findUnique({
    where: { id: input.contentId },
  });

  if (!content) {
    throw new Error(`${input.contentType} not found`);
  }

  // Get max sort order
  const maxOrder = await prisma.playlist_items.aggregate({
    where: { playlistId },
    _max: { sortOrder: true },
  });

  const sortOrder = input.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1;

  // Create item
  const item = await prisma.playlist_items.create({
    data: {
      playlistId,
      contentType: input.contentType as PlaylistItemType,
      [contentField]: input.contentId,
      note: input.note,
      sortOrder,
    },
    include: {
      meditation: true,
      breathwork: true,
      soundscape: true,
      sleepStory: true,
    },
  });

  // Update playlist stats
  await updatePlaylistStats(playlistId);

  return item;
}

export async function adminRemovePlaylistItem(playlistId: string, itemId: string) {
  await prisma.playlist_items.delete({
    where: { id: itemId },
  });

  // Update playlist stats
  await updatePlaylistStats(playlistId);
}

// ==================== HELPER FUNCTIONS ====================

function getContentField(contentType: string): string {
  switch (contentType) {
    case 'MEDITATION':
      return 'meditationId';
    case 'BREATHWORK':
      return 'breathworkId';
    case 'SOUNDSCAPE':
      return 'soundscapeId';
    case 'SLEEP_STORY':
      return 'sleepStoryId';
    default:
      throw new Error('Invalid content type');
  }
}

function getContentModel(contentType: string): string {
  switch (contentType) {
    case 'MEDITATION':
      return 'meditations';
    case 'BREATHWORK':
      return 'breathworks';
    case 'SOUNDSCAPE':
      return 'soundscapes';
    case 'SLEEP_STORY':
      return 'sleep_stories';
    default:
      throw new Error('Invalid content type');
  }
}

async function updatePlaylistStats(playlistId: string) {
  const items = await prisma.playlist_items.findMany({
    where: { playlistId },
    include: {
      meditation: { select: { duration: true } },
      breathwork: { select: { totalDuration: true } },
      soundscape: { select: { duration: true } },
      sleepStory: { select: { duration: true } },
    },
  });

  let totalDuration = 0;
  items.forEach((item) => {
    if (item.meditation) totalDuration += item.meditation.duration;
    if (item.breathwork) totalDuration += item.breathwork.totalDuration;
    if (item.soundscape && item.soundscape.duration) totalDuration += item.soundscape.duration;
    if (item.sleepStory) totalDuration += item.sleepStory.duration;
  });

  await prisma.playlists.update({
    where: { id: playlistId },
    data: {
      itemCount: items.length,
      totalDuration,
    },
  });
}
