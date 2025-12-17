import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { ShopItemType } from '@prisma/client';
import * as xpService from './xpService';
import * as streakService from './streakService';

// ============================================
// Shop Items
// ============================================

export async function getShopItems(
  userId?: string,
  filters?: { type?: ShopItemType; available?: boolean },
) {
  const now = new Date();

  const where: any = {
    isActive: true,
  };

  if (filters?.type) {
    where.type = filters.type;
  }

  if (filters?.available !== false) {
    where.AND = [
      { OR: [{ availableFrom: null }, { availableFrom: { lte: now } }] },
      { OR: [{ availableUntil: null }, { availableUntil: { gte: now } }] },
      { OR: [{ stock: null }, { stock: { gt: 0 } }] },
    ];
  }

  const items = await prisma.shopItem.findMany({
    where,
    orderBy: [{ type: 'asc' }, { priceXP: 'asc' }],
  });

  // If userId provided, check if user can purchase each item
  if (userId) {
    const userLevel = await xpService.getOrCreateUserLevel(userId);
    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true },
    });
    const userBadgeIds = new Set(userBadges.map((b) => b.badgeId));

    return items.map((item) => ({
      ...item,
      canPurchase: checkItemRequirements(item, userLevel, userBadgeIds),
      reason: getRequirementReason(item, userLevel, userBadgeIds),
    }));
  }

  return items;
}

export async function getShopItemById(id: string) {
  return prisma.shopItem.findUnique({
    where: { id },
  });
}

function checkItemRequirements(
  item: any,
  userLevel: any,
  userBadgeIds: Set<string>,
): boolean {
  // Check level requirement
  if (item.minLevel && userLevel.level < item.minLevel) {
    return false;
  }

  // Check badge requirement
  if (item.requiredBadgeId && !userBadgeIds.has(item.requiredBadgeId)) {
    return false;
  }

  // Check if in stock
  if (item.stock !== null && item.stock <= 0) {
    return false;
  }

  // Check XP balance
  if (userLevel.currentXP < item.priceXP) {
    return false;
  }

  return true;
}

function getRequirementReason(
  item: any,
  userLevel: any,
  userBadgeIds: Set<string>,
): string | null {
  if (item.minLevel && userLevel.level < item.minLevel) {
    return `Requires level ${item.minLevel}`;
  }

  if (item.requiredBadgeId && !userBadgeIds.has(item.requiredBadgeId)) {
    return 'Requires specific badge';
  }

  if (item.stock !== null && item.stock <= 0) {
    return 'Out of stock';
  }

  if (userLevel.currentXP < item.priceXP) {
    return `Not enough XP (need ${item.priceXP - userLevel.currentXP} more)`;
  }

  return null;
}

// ============================================
// Purchase
// ============================================

export async function purchaseItem(userId: string, itemId: string) {
  const item = await prisma.shopItem.findUnique({
    where: { id: itemId },
  });

  if (!item) {
    return { success: false, message: 'Item not found' };
  }

  if (!item.isActive) {
    return { success: false, message: 'Item is not available' };
  }

  // Check availability
  const now = new Date();
  if (item.availableFrom && item.availableFrom > now) {
    return { success: false, message: 'Item is not yet available' };
  }
  if (item.availableUntil && item.availableUntil < now) {
    return { success: false, message: 'Item is no longer available' };
  }

  // Check stock
  if (item.stock !== null && item.stock <= 0) {
    return { success: false, message: 'Item is out of stock' };
  }

  // Check requirements
  const userLevel = await xpService.getOrCreateUserLevel(userId);

  if (item.minLevel && userLevel.level < item.minLevel) {
    return { success: false, message: `Requires level ${item.minLevel}` };
  }

  if (item.requiredBadgeId) {
    const hasBadge = await prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId: item.requiredBadgeId } },
    });
    if (!hasBadge) {
      return { success: false, message: 'Missing required badge' };
    }
  }

  // Check XP balance
  if (userLevel.currentXP < item.priceXP) {
    return { success: false, message: 'Not enough XP' };
  }

  // Process purchase
  const [purchase] = await prisma.$transaction([
    // Create purchase record
    prisma.shopPurchase.create({
      data: {
        userId,
        itemId,
        pricePaid: item.priceXP,
        currency: 'XP',
      },
    }),
    // Deduct XP
    prisma.userLevel.update({
      where: { userId },
      data: {
        currentXP: { decrement: item.priceXP },
      },
    }),
    // Update stock if applicable
    ...(item.stock !== null
      ? [
          prisma.shopItem.update({
            where: { id: itemId },
            data: {
              stock: { decrement: 1 },
              soldCount: { increment: 1 },
            },
          }),
        ]
      : []),
  ]);

  // Auto-use certain item types
  if (item.type === 'STREAK_FREEZE') {
    await streakService.grantStreakFreeze(userId, 'PURCHASED');
    await prisma.shopPurchase.update({
      where: { id: purchase.id },
      data: { isUsed: true, usedAt: new Date() },
    });
  }

  logger.info({ userId, itemId, price: item.priceXP }, 'Shop item purchased');

  return {
    success: true,
    purchase,
    item,
    newXPBalance: userLevel.currentXP - item.priceXP,
  };
}

// ============================================
// Use Purchase
// ============================================

export async function usePurchase(userId: string, purchaseId: string) {
  const purchase = await prisma.shopPurchase.findFirst({
    where: { id: purchaseId, userId },
    include: { item: true },
  });

  if (!purchase) {
    return { success: false, message: 'Purchase not found' };
  }

  if (purchase.isUsed) {
    return { success: false, message: 'Item already used' };
  }

  // Process usage based on item type
  switch (purchase.item.type) {
    case 'STREAK_FREEZE':
      await streakService.grantStreakFreeze(userId, 'PURCHASED');
      break;

    case 'AVATAR_FRAME':
      // Grant frame to user
      await prisma.userAvatarFrame.upsert({
        where: {
          userId_frameId: { userId, frameId: purchase.item.value },
        },
        create: {
          userId,
          frameId: purchase.item.value,
        },
        update: {},
      });
      break;

    case 'TITLE':
      // Grant title to user
      await prisma.userTitle.upsert({
        where: {
          userId_titleId: { userId, titleId: purchase.item.value },
        },
        create: {
          userId,
          titleId: purchase.item.value,
        },
        update: {},
      });
      break;

    case 'BADGE':
      // Grant badge to user
      await prisma.userBadge.upsert({
        where: {
          userId_badgeId: { userId, badgeId: purchase.item.value },
        },
        create: {
          userId,
          badgeId: purchase.item.value,
        },
        update: {},
      });
      break;

    default:
      // Other item types may need manual handling
      break;
  }

  // Mark as used
  await prisma.shopPurchase.update({
    where: { id: purchaseId },
    data: { isUsed: true, usedAt: new Date() },
  });

  logger.info({ userId, purchaseId }, 'Shop purchase used');

  return { success: true, itemType: purchase.item.type };
}

// ============================================
// Purchase History
// ============================================

export async function getPurchaseHistory(
  userId: string,
  pagination: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;

  const [purchases, total] = await Promise.all([
    prisma.shopPurchase.findMany({
      where: { userId },
      include: { item: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.shopPurchase.count({ where: { userId } }),
  ]);

  return {
    purchases,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getUnusedPurchases(userId: string) {
  return prisma.shopPurchase.findMany({
    where: { userId, isUsed: false },
    include: { item: true },
    orderBy: { createdAt: 'desc' },
  });
}

// ============================================
// Admin Functions
// ============================================

export async function createShopItem(data: {
  name: string;
  description: string;
  imageUrl?: string;
  type: ShopItemType;
  value: string;
  priceXP: number;
  priceCoins?: number;
  stock?: number;
  minLevel?: number;
  requiredBadgeId?: string;
  availableFrom?: Date;
  availableUntil?: Date;
}) {
  return prisma.shopItem.create({ data });
}

export async function updateShopItem(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    imageUrl: string;
    type: ShopItemType;
    value: string;
    priceXP: number;
    priceCoins: number;
    stock: number;
    isActive: boolean;
    minLevel: number;
    requiredBadgeId: string;
    availableFrom: Date;
    availableUntil: Date;
  }>,
) {
  return prisma.shopItem.update({
    where: { id },
    data,
  });
}

export async function deleteShopItem(id: string) {
  return prisma.shopItem.delete({ where: { id } });
}

// ============================================
// Shop Stats
// ============================================

export async function getShopStats() {
  const [totalItems, totalSales, totalRevenue, popularItems] =
    await Promise.all([
      prisma.shopItem.count({ where: { isActive: true } }),
      prisma.shopPurchase.count(),
      prisma.shopPurchase.aggregate({ _sum: { pricePaid: true } }),
      prisma.shopItem.findMany({
        where: { isActive: true },
        orderBy: { soldCount: 'desc' },
        take: 5,
        select: { id: true, name: true, soldCount: true, priceXP: true },
      }),
    ]);

  return {
    totalItems,
    totalSales,
    totalRevenue: totalRevenue._sum.pricePaid || 0,
    popularItems,
  };
}
