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

  return prisma.avatar_frames.findMany({
    where,
    orderBy: [{ rarity: 'desc' }, { name: 'asc' }],
  });
}

export async function getFrameById(id: string) {
  return prisma.avatar_frames.findUnique({
    where: { id },
  });
}

// ============================================
// User Frames
// ============================================

export async function getUserFrames(userId: string) {
  const userFrames = await prisma.user_avatar_frames.findMany({
    where: { userId },
    include: { avatar_frames: true },
    orderBy: { earnedAt: 'desc' },
  });

  return userFrames;
}

export async function unlockFrame(userId: string, frameId: string) {
  // Check if already owned
  const existing = await prisma.user_avatar_frames.findFirst({
    where: { userId, frameId },
  });

  if (existing) {
    return { success: false, message: 'Frame already owned', userFrame: existing };
  }

  const userFrame = await prisma.user_avatar_frames.create({
    data: { userId, frameId },
    include: { avatar_frames: true },
  });

  logger.info({ userId, frameId }, 'Avatar frame unlocked');

  return { success: true, userFrame };
}

export async function equipFrame(userId: string, frameId: string) {
  // Check if user owns the frame
  const userFrame = await prisma.user_avatar_frames.findFirst({
    where: { userId, frameId },
  });

  if (!userFrame) {
    return { success: false, message: 'Frame not owned' };
  }

  // Unequip current frame
  await prisma.user_avatar_frames.updateMany({
    where: { userId, isEquipped: true },
    data: { isEquipped: false },
  });

  // Equip new frame
  await prisma.user_avatar_frames.update({
    where: { id: userFrame.id },
    data: { isEquipped: true },
  });

  // Update user's equipped frame ID
  await prisma.users.update({
    where: { id: userId },
    data: { equippedFrameId: frameId },
  });

  logger.info({ userId, frameId }, 'Avatar frame equipped');

  return { success: true };
}

export async function unequipFrame(userId: string) {
  await prisma.user_avatar_frames.updateMany({
    where: { userId, isEquipped: true },
    data: { isEquipped: false },
  });

  await prisma.users.update({
    where: { id: userId },
    data: { equippedFrameId: null },
  });

  return { success: true };
}

export async function getEquippedFrame(userId: string) {
  const equippedFrame = await prisma.user_avatar_frames.findFirst({
    where: { userId, isEquipped: true },
    include: { avatar_frames: true },
  });

  return equippedFrame?.avatar_frames || null;
}

// ============================================
// Frame Unlock Checks
// ============================================

export async function checkFrameUnlocks(userId: string) {
  const newFrames: any[] = [];

  // Get all frames with unlock conditions
  const frames = await prisma.avatar_frames.findMany({
    where: { isActive: true },
  });

  // Get user's current frames
  const userFrames = await prisma.user_avatar_frames.findMany({
    where: { userId },
    select: { frameId: true },
  });
  const ownedFrameIds = new Set(userFrames.map((uf) => uf.frameId));

  // Get user stats
  const [userLevel, achievements, user] = await Promise.all([
    prisma.user_levels.findUnique({ where: { userId } }),
    prisma.user_achievements.findMany({
      where: { userId, isCompleted: true },
      select: { achievementId: true },
    }),
    prisma.users.findUnique({
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
  return prisma.avatar_frames.create({ data });
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
  return prisma.avatar_frames.update({
    where: { id },
    data,
  });
}

export async function deleteFrame(id: string) {
  // Remove from all users first
  await prisma.user_avatar_frames.deleteMany({ where: { frameId: id } });
  return prisma.avatar_frames.delete({ where: { id } });
}

export async function grantFrameToUser(userId: string, frameId: string) {
  return unlockFrame(userId, frameId);
}

export async function revokeFrameFromUser(userId: string, frameId: string) {
  const userFrame = await prisma.user_avatar_frames.findFirst({
    where: { userId, frameId },
  });

  if (!userFrame) {
    return { success: false, message: 'User does not have this frame' };
  }

  // Unequip if equipped
  if (userFrame.isEquipped) {
    await prisma.users.update({
      where: { id: userId },
      data: { equippedFrameId: null },
    });
  }

  await prisma.user_avatar_frames.delete({ where: { id: userFrame.id } });

  return { success: true };
}
