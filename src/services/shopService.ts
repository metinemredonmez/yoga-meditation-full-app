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

  const items = await prisma.shop_items.findMany({
    where,
    orderBy: [{ type: 'asc' }, { priceXP: 'asc' }],
  });

  // If userId provided, check if user can purchase each item
  if (userId) {
    const userBadges = await prisma.user_badges.findMany({
      where: { userId },
      select: { badgeId: true },
    });
    const userBadgeIds = new Set(userBadges.map((b) => b.badgeId));

    // Placeholder for user level (user_levels removed)
    const userLevel = { level: 1, currentXP: 0 };

    return items.map((item) => ({
      ...item,
      canPurchase: checkItemRequirements(item, userLevel, userBadgeIds),
      reason: getRequirementReason(item, userLevel, userBadgeIds),
    }));
  }

  return items;
}

export async function getShopItemById(id: string) {
  return prisma.shop_items.findUnique({
    where: { id },
  });
}

function checkItemRequirements(
  item: { minLevel: number | null; requiredBadgeId: string | null; stock: number | null; priceXP: number },
  userLevel: { level: number; currentXP: number },
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
  item: { minLevel: number | null; requiredBadgeId: string | null; stock: number | null; priceXP: number },
  userLevel: { level: number; currentXP: number },
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
  const item = await prisma.shop_items.findUnique({
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
  // Placeholder for user level (user_levels removed)
  const userLevel = { level: 1, currentXP: 0 };

  if (item.minLevel && userLevel.level < item.minLevel) {
    return { success: false, message: `Requires level ${item.minLevel}` };
  }

  if (item.requiredBadgeId) {
    const hasBadge = await prisma.user_badges.findUnique({
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
  const transactions: any[] = [
    // Create purchase record
    prisma.shop_purchases.create({
      data: {
        userId,
        itemId,
        pricePaid: item.priceXP,
        currency: 'XP',
      },
    }),
  ];

  // Update stock if applicable
  if (item.stock !== null) {
    transactions.push(
      prisma.shop_items.update({
        where: { id: itemId },
        data: {
          stock: { decrement: 1 },
          soldCount: { increment: 1 },
        },
      })
    );
  }

  const [purchase] = await prisma.$transaction(transactions);

  // Auto-use certain item types
  if (item.type === 'STREAK_FREEZE') {
    await streakService.grantStreakFreeze(userId, 'PURCHASED');
    await prisma.shop_purchases.update({
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
  const purchase = await prisma.shop_purchases.findFirst({
    where: { id: purchaseId, userId },
    include: { shop_items: true },
  });

  if (!purchase) {
    return { success: false, message: 'Purchase not found' };
  }

  if (purchase.isUsed) {
    return { success: false, message: 'Item already used' };
  }

  // Process usage based on item type
  switch (purchase.shop_items.type) {
    case 'STREAK_FREEZE':
      await streakService.grantStreakFreeze(userId, 'PURCHASED');
      break;

    case 'AVATAR_FRAME':
      // Grant frame to user
      await prisma.user_avatar_frames.upsert({
        where: {
          userId_frameId: { userId, frameId: purchase.shop_items.value },
        },
        create: {
          userId,
          frameId: purchase.shop_items.value,
        },
        update: {},
      });
      break;

    case 'TITLE':
      // Grant title to user
      await prisma.user_titles.upsert({
        where: {
          userId_titleId: { userId, titleId: purchase.shop_items.value },
        },
        create: {
          userId,
          titleId: purchase.shop_items.value,
        },
        update: {},
      });
      break;

    case 'BADGE':
      // Grant badge to user
      await prisma.user_badges.upsert({
        where: {
          userId_badgeId: { userId, badgeId: purchase.shop_items.value },
        },
        create: {
          userId,
          badgeId: purchase.shop_items.value,
        },
        update: {},
      });
      break;

    default:
      // Other item types may need manual handling
      break;
  }

  // Mark as used
  await prisma.shop_purchases.update({
    where: { id: purchaseId },
    data: { isUsed: true, usedAt: new Date() },
  });

  logger.info({ userId, purchaseId }, 'Shop purchase used');

  return { success: true, itemType: purchase.shop_items.type };
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
    prisma.shop_purchases.findMany({
      where: { userId },
      include: { shop_items: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.shop_purchases.count({ where: { userId } }),
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
  return prisma.shop_purchases.findMany({
    where: { userId, isUsed: false },
    include: { shop_items: true },
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
  return prisma.shop_items.create({ data });
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
  return prisma.shop_items.update({
    where: { id },
    data,
  });
}

export async function deleteShopItem(id: string) {
  return prisma.shop_items.delete({ where: { id } });
}

// ============================================
// Shop Stats
// ============================================

export async function getShopStats() {
  const [totalItems, totalSales, totalRevenue, popularItems] =
    await Promise.all([
      prisma.shop_items.count({ where: { isActive: true } }),
      prisma.shop_purchases.count(),
      prisma.shop_purchases.aggregate({ _sum: { pricePaid: true } }),
      prisma.shop_items.findMany({
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
