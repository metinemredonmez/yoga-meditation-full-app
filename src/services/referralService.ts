import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { ReferralStatus } from '@prisma/client';
import * as xpService from './xpService';
import crypto from 'crypto';

const REFERRAL_XP_REWARD = 200;
const REFERRED_XP_BONUS = 100;

// ============================================
// Referral Code Management
// ============================================

export async function generateReferralCode(userId: string) {
  // Check if user already has a code
  let referralCode = await prisma.referral_codes.findUnique({
    where: { userId },
  });

  if (referralCode) {
    return referralCode;
  }

  // Generate unique code
  const code = generateUniqueCode(userId);

  referralCode = await prisma.referral_codes.create({
    data: {
      userId,
      code,
    },
  });

  logger.info({ userId, code }, 'Referral code generated');

  return referralCode;
}

export async function getReferralCode(userId: string) {
  return prisma.referral_codes.findUnique({
    where: { userId },
  });
}

function generateUniqueCode(userId: string): string {
  const hash = crypto.createHash('md5').update(userId + Date.now()).digest('hex');
  return hash.substring(0, 8).toUpperCase();
}

export async function validateReferralCode(code: string) {
  const referralCode = await prisma.referral_codes.findUnique({
    where: { code },
    include: {
      users: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  if (!referralCode) {
    return { valid: false, message: 'Invalid referral code' };
  }

  if (!referralCode.isActive) {
    return { valid: false, message: 'Referral code is inactive' };
  }

  if (referralCode.expiresAt && referralCode.expiresAt < new Date()) {
    return { valid: false, message: 'Referral code has expired' };
  }

  if (referralCode.maxUsage && referralCode.usageCount >= referralCode.maxUsage) {
    return { valid: false, message: 'Referral code usage limit reached' };
  }

  return {
    valid: true,
    referrerId: referralCode.userId,
    referrerName:
      `${referralCode.users.firstName || ''} ${referralCode.users.lastName || ''}`.trim() ||
      'A Yogi',
    bonusXP: referralCode.bonusXP,
  };
}

// ============================================
// Referral Application
// ============================================

export async function applyReferralCode(
  userId: string,
  code: string,
) {
  // Check if user already used a referral code
  const existingReferral = await prisma.referrals.findUnique({
    where: { referredId: userId },
  });

  if (existingReferral) {
    return { success: false, message: 'You have already used a referral code' };
  }

  // Validate code
  const validation = await validateReferralCode(code);
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  // Can't refer yourself
  if (validation.referrerId === userId) {
    return { success: false, message: 'Cannot use your own referral code' };
  }

  // Create referral record
  const referral = await prisma.referrals.create({
    data: {
      referrerId: validation.referrerId!,
      referredId: userId,
      code,
      status: 'PENDING',
    },
  });

  // Increment usage count
  await prisma.referral_codes.update({
    where: { code },
    data: { usageCount: { increment: 1 } },
  });

  logger.info({ userId, referrerId: validation.referrerId, code }, 'Referral code applied');

  return {
    success: true,
    referral,
    referrerName: validation.referrerName,
    message: 'Referral code applied! Complete a class to activate rewards.',
  };
}

// ============================================
// Referral Conversion
// ============================================

export async function processReferralConversion(referredUserId: string) {
  const referral = await prisma.referrals.findUnique({
    where: { referredId: referredUserId },
  });

  if (!referral || referral.status !== 'PENDING') {
    return null;
  }

  // Award XP to both parties
  const referrerXP = REFERRAL_XP_REWARD;
  const referredXP = REFERRED_XP_BONUS;

  // Get bonus XP from referral code
  const referralCode = await prisma.referral_codes.findFirst({
    where: { code: referral.code },
  });
  const bonusXP = referralCode?.bonusXP || 0;

  // Award to referrer
  await xpService.addXP(
    referral.referrerId,
    referrerXP,
    'REFERRAL',
    'Friend joined through your referral',
  );

  // Award to referred user
  await xpService.addXP(
    referredUserId,
    referredXP + bonusXP,
    'REFERRAL',
    'Welcome bonus for using referral code',
  );

  // Update referral status
  await prisma.referrals.update({
    where: { id: referral.id },
    data: {
      status: 'CONVERTED',
      convertedAt: new Date(),
      referrerRewardGiven: true,
      referredRewardGiven: true,
      referrerXP,
      referredXP: referredXP + bonusXP,
    },
  });

  logger.info(
    { referrerId: referral.referrerId, referredId: referredUserId },
    'Referral converted',
  );

  return {
    referrerXP,
    referredXP: referredXP + bonusXP,
    converted: true,
  };
}

// ============================================
// Referral Stats
// ============================================

export async function getReferralStats(userId: string) {
  const [referralCode, totalReferrals, convertedReferrals, totalXPEarned] =
    await Promise.all([
      prisma.referral_codes.findUnique({ where: { userId } }),
      prisma.referrals.count({ where: { referrerId: userId } }),
      prisma.referrals.count({
        where: { referrerId: userId, status: 'CONVERTED' },
      }),
      prisma.referrals.aggregate({
        where: { referrerId: userId, referrerRewardGiven: true },
        _sum: { referrerXP: true },
      }),
    ]);

  // Get recent referrals
  const recentReferrals = await prisma.referrals.findMany({
    where: { referrerId: userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      users_referrals_referredIdTousers: {
        select: { firstName: true, lastName: true, createdAt: true },
      },
    },
  });

  return {
    referralCode: referralCode?.code || null,
    totalReferrals,
    convertedReferrals,
    pendingReferrals: totalReferrals - convertedReferrals,
    conversionRate:
      totalReferrals > 0 ? (convertedReferrals / totalReferrals) * 100 : 0,
    totalXPEarned: totalXPEarned._sum.referrerXP || 0,
    recentReferrals: recentReferrals.map((r) => ({
      id: r.id,
      status: r.status,
      userName:
        `${r.users_referrals_referredIdTousers.firstName || ''} ${r.users_referrals_referredIdTousers.lastName || ''}`.trim() ||
        'Yogi',
      joinedAt: r.users_referrals_referredIdTousers.createdAt,
      convertedAt: r.convertedAt,
      xpEarned: r.referrerXP,
    })),
  };
}

// ============================================
// Referral Leaderboard
// ============================================

export async function getReferralLeaderboard(
  pagination: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 50 } = pagination;
  const skip = (page - 1) * limit;

  const leaderboard = await prisma.referrals.groupBy({
    by: ['referrerId'],
    where: { status: 'CONVERTED' },
    _count: { id: true },
    _sum: { referrerXP: true },
    orderBy: { _count: { id: 'desc' } },
    skip,
    take: limit,
  });

  // Get user info
  const userIds = leaderboard.map((l) => l.referrerId);
  const users = await prisma.users.findMany({
    where: { id: { in: userIds } },
    select: { id: true, firstName: true, lastName: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  const result = leaderboard.map((l, index) => {
    const user = userMap.get(l.referrerId);
    return {
      rank: skip + index + 1,
      userId: l.referrerId,
      userName: user
        ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Yogi'
        : 'Yogi',
      referralCount: l._count.id,
      totalXPEarned: l._sum.referrerXP || 0,
    };
  });

  const total = await prisma.referrals.groupBy({
    by: ['referrerId'],
    where: { status: 'CONVERTED' },
  });

  return {
    leaderboard: result,
    pagination: {
      page,
      limit,
      total: total.length,
      totalPages: Math.ceil(total.length / limit),
    },
  };
}

// ============================================
// Admin Functions
// ============================================

export async function updateReferralCodeSettings(
  userId: string,
  data: {
    maxUsage?: number | null;
    bonusXP?: number;
    isActive?: boolean;
    expiresAt?: Date | null;
  },
) {
  return prisma.referral_codes.update({
    where: { userId },
    data,
  });
}

export async function expireOldReferrals() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await prisma.referrals.updateMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: thirtyDaysAgo },
    },
    data: {
      status: 'EXPIRED',
    },
  });

  logger.info({ count: result.count }, 'Expired old referrals');

  return result;
}
