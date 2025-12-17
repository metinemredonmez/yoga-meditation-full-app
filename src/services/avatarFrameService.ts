import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { FrameUnlockType, TitleRarity } from '@prisma/client';

// ============================================
// Frame Queries
// ============================================

export async function getFrames(filters?: { rarity?: TitleRarity; isActive?: boolean }) {
  const where: any = {
    isActive: filters?.isActive ?? true,
  };

  if (filters?.rarity) {
    where.rarity = filters.rarity;
  }

  return prisma.avatarFrame.findMany({
    where,
    orderBy: [{ rarity: 'desc' }, { name: 'asc' }],
  });
}

export async function getFrameById(id: string) {
  return prisma.avatarFrame.findUnique({
    where: { id },
  });
}

// ============================================
// User Frames
// ============================================

export async function getUserFrames(userId: string) {
  const userFrames = await prisma.userAvatarFrame.findMany({
    where: { userId },
    include: { frame: true },
    orderBy: { earnedAt: 'desc' },
  });

  return userFrames;
}

export async function unlockFrame(userId: string, frameId: string) {
  // Check if already owned
  const existing = await prisma.userAvatarFrame.findUnique({
    where: { userId_frameId: { userId, frameId } },
  });

  if (existing) {
    return { success: false, message: 'Frame already owned', userFrame: existing };
  }

  const userFrame = await prisma.userAvatarFrame.create({
    data: { userId, frameId },
    include: { frame: true },
  });

  logger.info({ userId, frameId }, 'Avatar frame unlocked');

  return { success: true, userFrame };
}

export async function equipFrame(userId: string, frameId: string) {
  // Check if user owns the frame
  const userFrame = await prisma.userAvatarFrame.findUnique({
    where: { userId_frameId: { userId, frameId } },
  });

  if (!userFrame) {
    return { success: false, message: 'Frame not owned' };
  }

  // Unequip current frame
  await prisma.userAvatarFrame.updateMany({
    where: { userId, isEquipped: true },
    data: { isEquipped: false },
  });

  // Equip new frame
  await prisma.userAvatarFrame.update({
    where: { id: userFrame.id },
    data: { isEquipped: true },
  });

  // Update user's equipped frame ID
  await prisma.user.update({
    where: { id: userId },
    data: { equippedFrameId: frameId },
  });

  logger.info({ userId, frameId }, 'Avatar frame equipped');

  return { success: true };
}

export async function unequipFrame(userId: string) {
  await prisma.userAvatarFrame.updateMany({
    where: { userId, isEquipped: true },
    data: { isEquipped: false },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { equippedFrameId: null },
  });

  return { success: true };
}

export async function getEquippedFrame(userId: string) {
  const equippedFrame = await prisma.userAvatarFrame.findFirst({
    where: { userId, isEquipped: true },
    include: { frame: true },
  });

  return equippedFrame?.frame || null;
}

// ============================================
// Frame Unlock Checks
// ============================================

export async function checkFrameUnlocks(userId: string) {
  const newFrames: any[] = [];

  // Get all frames with unlock conditions
  const frames = await prisma.avatarFrame.findMany({
    where: { isActive: true },
  });

  // Get user's current frames
  const userFrames = await prisma.userAvatarFrame.findMany({
    where: { userId },
    select: { frameId: true },
  });
  const ownedFrameIds = new Set(userFrames.map((uf) => uf.frameId));

  // Get user stats
  const [userLevel, achievements, user] = await Promise.all([
    prisma.userLevel.findUnique({ where: { userId } }),
    prisma.userAchievement.findMany({
      where: { userId, isCompleted: true },
      select: { achievementId: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    }),
  ]);

  const completedAchievementIds = new Set(
    achievements.map((a) => a.achievementId),
  );

  for (const frame of frames) {
    if (ownedFrameIds.has(frame.id)) continue;

    let shouldUnlock = false;

    switch (frame.unlockType) {
      case 'LEVEL':
        if (userLevel && userLevel.level >= parseInt(frame.unlockValue || '0')) {
          shouldUnlock = true;
        }
        break;

      case 'ACHIEVEMENT':
        if (frame.unlockValue && completedAchievementIds.has(frame.unlockValue)) {
          shouldUnlock = true;
        }
        break;

      case 'SUBSCRIPTION':
        if (user?.subscriptionTier === frame.unlockValue) {
          shouldUnlock = true;
        }
        break;

      case 'EVENT':
        // Event frames are unlocked through event rewards
        break;

      case 'PURCHASE':
        // Purchase frames are handled by shop
        break;
    }

    if (shouldUnlock) {
      const result = await unlockFrame(userId, frame.id);
      if (result.success) {
        newFrames.push(result.userFrame);
      }
    }
  }

  return newFrames;
}

// ============================================
// Admin Functions
// ============================================

export async function createFrame(data: {
  name: string;
  imageUrl: string;
  unlockType: FrameUnlockType;
  unlockValue?: string;
  rarity: TitleRarity;
  isAnimated?: boolean;
}) {
  return prisma.avatarFrame.create({ data });
}

export async function updateFrame(
  id: string,
  data: Partial<{
    name: string;
    imageUrl: string;
    unlockType: FrameUnlockType;
    unlockValue: string;
    rarity: TitleRarity;
    isAnimated: boolean;
    isActive: boolean;
  }>,
) {
  return prisma.avatarFrame.update({
    where: { id },
    data,
  });
}

export async function deleteFrame(id: string) {
  // Remove from all users first
  await prisma.userAvatarFrame.deleteMany({ where: { frameId: id } });
  return prisma.avatarFrame.delete({ where: { id } });
}

export async function grantFrameToUser(userId: string, frameId: string) {
  return unlockFrame(userId, frameId);
}

export async function revokeFrameFromUser(userId: string, frameId: string) {
  const userFrame = await prisma.userAvatarFrame.findUnique({
    where: { userId_frameId: { userId, frameId } },
  });

  if (!userFrame) {
    return { success: false, message: 'User does not have this frame' };
  }

  // Unequip if equipped
  if (userFrame.isEquipped) {
    await prisma.user.update({
      where: { id: userId },
      data: { equippedFrameId: null },
    });
  }

  await prisma.userAvatarFrame.delete({ where: { id: userFrame.id } });

  return { success: true };
}
