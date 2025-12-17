import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { TitleUnlockType, TitleRarity } from '@prisma/client';

// ============================================
// Title Queries
// ============================================

export async function getTitles(filters?: { rarity?: TitleRarity; isActive?: boolean }) {
  const where: any = {
    isActive: filters?.isActive ?? true,
  };

  if (filters?.rarity) {
    where.rarity = filters.rarity;
  }

  return prisma.title.findMany({
    where,
    orderBy: [{ rarity: 'desc' }, { name: 'asc' }],
  });
}

export async function getTitleById(id: string) {
  return prisma.title.findUnique({
    where: { id },
  });
}

export async function getTitleBySlug(slug: string) {
  return prisma.title.findUnique({
    where: { slug },
  });
}

// ============================================
// User Titles
// ============================================

export async function getUserTitles(userId: string) {
  const userTitles = await prisma.userTitle.findMany({
    where: { userId },
    include: { title: true },
    orderBy: { earnedAt: 'desc' },
  });

  return userTitles;
}

export async function unlockTitle(userId: string, titleId: string) {
  // Check if already owned
  const existing = await prisma.userTitle.findUnique({
    where: { userId_titleId: { userId, titleId } },
  });

  if (existing) {
    return { success: false, message: 'Title already owned', userTitle: existing };
  }

  const userTitle = await prisma.userTitle.create({
    data: { userId, titleId },
    include: { title: true },
  });

  logger.info({ userId, titleId }, 'Title unlocked');

  return { success: true, userTitle };
}

export async function equipTitle(userId: string, titleId: string) {
  // Check if user owns the title
  const userTitle = await prisma.userTitle.findUnique({
    where: { userId_titleId: { userId, titleId } },
  });

  if (!userTitle) {
    return { success: false, message: 'Title not owned' };
  }

  // Unequip current title
  await prisma.userTitle.updateMany({
    where: { userId, isEquipped: true },
    data: { isEquipped: false },
  });

  // Equip new title
  await prisma.userTitle.update({
    where: { id: userTitle.id },
    data: { isEquipped: true },
  });

  // Update user's equipped title ID
  await prisma.user.update({
    where: { id: userId },
    data: { equippedTitleId: titleId },
  });

  logger.info({ userId, titleId }, 'Title equipped');

  return { success: true };
}

export async function unequipTitle(userId: string) {
  await prisma.userTitle.updateMany({
    where: { userId, isEquipped: true },
    data: { isEquipped: false },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { equippedTitleId: null },
  });

  return { success: true };
}

export async function getEquippedTitle(userId: string) {
  const equippedTitle = await prisma.userTitle.findFirst({
    where: { userId, isEquipped: true },
    include: { title: true },
  });

  return equippedTitle?.title || null;
}

// ============================================
// Title Unlock Checks
// ============================================

export async function checkTitleUnlocks(userId: string) {
  const newTitles: any[] = [];

  // Get all titles with unlock conditions
  const titles = await prisma.title.findMany({
    where: { isActive: true },
  });

  // Get user's current titles
  const userTitles = await prisma.userTitle.findMany({
    where: { userId },
    select: { titleId: true },
  });
  const ownedTitleIds = new Set(userTitles.map((ut) => ut.titleId));

  // Get user stats
  const [userLevel, badgeCount, achievements] = await Promise.all([
    prisma.userLevel.findUnique({ where: { userId } }),
    prisma.userBadge.count({ where: { userId } }),
    prisma.userAchievement.findMany({
      where: { userId, isCompleted: true },
      select: { achievementId: true },
    }),
  ]);

  const completedAchievementIds = new Set(
    achievements.map((a) => a.achievementId),
  );

  for (const title of titles) {
    if (ownedTitleIds.has(title.id)) continue;

    let shouldUnlock = false;

    switch (title.unlockType) {
      case 'LEVEL':
        if (userLevel && userLevel.level >= parseInt(title.unlockValue || '0')) {
          shouldUnlock = true;
        }
        break;

      case 'BADGE_COUNT':
        if (badgeCount >= parseInt(title.unlockValue || '0')) {
          shouldUnlock = true;
        }
        break;

      case 'STREAK':
        if (
          userLevel &&
          userLevel.longestStreak >= parseInt(title.unlockValue || '0')
        ) {
          shouldUnlock = true;
        }
        break;

      case 'ACHIEVEMENT':
        if (title.unlockValue && completedAchievementIds.has(title.unlockValue)) {
          shouldUnlock = true;
        }
        break;

      case 'SPECIAL':
        // Special titles are unlocked manually
        break;

      case 'PURCHASE':
        // Purchase titles are handled by shop
        break;
    }

    if (shouldUnlock) {
      const result = await unlockTitle(userId, title.id);
      if (result.success) {
        newTitles.push(result.userTitle);
      }
    }
  }

  return newTitles;
}

// ============================================
// Admin Functions
// ============================================

export async function createTitle(data: {
  name: string;
  slug: string;
  description?: string;
  unlockType: TitleUnlockType;
  unlockValue?: string;
  rarity: TitleRarity;
  color?: string;
}) {
  return prisma.title.create({ data });
}

export async function updateTitle(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    description: string;
    unlockType: TitleUnlockType;
    unlockValue: string;
    rarity: TitleRarity;
    color: string;
    isActive: boolean;
  }>,
) {
  return prisma.title.update({
    where: { id },
    data,
  });
}

export async function deleteTitle(id: string) {
  // Remove from all users first
  await prisma.userTitle.deleteMany({ where: { titleId: id } });
  return prisma.title.delete({ where: { id } });
}

export async function grantTitleToUser(userId: string, titleId: string) {
  return unlockTitle(userId, titleId);
}

export async function revokeTitleFromUser(userId: string, titleId: string) {
  const userTitle = await prisma.userTitle.findUnique({
    where: { userId_titleId: { userId, titleId } },
  });

  if (!userTitle) {
    return { success: false, message: 'User does not have this title' };
  }

  // Unequip if equipped
  if (userTitle.isEquipped) {
    await prisma.user.update({
      where: { id: userId },
      data: { equippedTitleId: null },
    });
  }

  await prisma.userTitle.delete({ where: { id: userTitle.id } });

  return { success: true };
}
