import { InstructorStatus, InstructorTier, Prisma } from '@prisma/client';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

// ============================================
// Types
// ============================================

interface CreateInstructorProfileInput {
  displayName: string;
  slug?: string;
  bio?: string;
  shortBio?: string;
  profileImageUrl?: string;
  coverImageUrl?: string;
  introVideoUrl?: string;
  specializations?: string[];
  certifications?: Array<{
    name: string;
    issuer: string;
    year: number;
    imageUrl?: string;
    verified?: boolean;
  }>;
  yearsOfExperience?: number;
  languages?: string[];
  socialLinks?: {
    instagram?: string;
    youtube?: string;
    website?: string;
    facebook?: string;
  };
  location?: string;
  timezone?: string;
}

interface UpdateInstructorProfileInput {
  displayName?: string;
  bio?: string;
  shortBio?: string;
  profileImageUrl?: string;
  coverImageUrl?: string;
  introVideoUrl?: string;
  specializations?: string[];
  certifications?: Array<{
    name: string;
    issuer: string;
    year: number;
    imageUrl?: string;
    verified?: boolean;
  }>;
  yearsOfExperience?: number;
  languages?: string[];
  socialLinks?: {
    instagram?: string;
    youtube?: string;
    website?: string;
    facebook?: string;
  };
  location?: string;
  timezone?: string;
}

interface InstructorFilters {
  status?: InstructorStatus;
  tier?: InstructorTier;
  isVerified?: boolean;
  isFeatured?: boolean;
  specializations?: string[];
  minRating?: number;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: 'rating' | 'students' | 'createdAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// Slug Generation
// ============================================

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function generateUniqueSlug(baseName: string): Promise<string> {
  let slug = generateSlug(baseName);
  let suffix = 0;

  while (true) {
    const finalSlug = suffix === 0 ? slug : `${slug}-${suffix}`;
    const existing = await prisma.instructorProfile.findUnique({
      where: { slug: finalSlug },
    });

    if (!existing) {
      return finalSlug;
    }

    suffix++;
  }
}

// ============================================
// Tier Benefits
// ============================================

interface TierBenefits {
  commissionRate: number; // Platform commission (e.g., 0.30 = 30%)
  instructorRate: number; // Instructor share (e.g., 0.70 = 70%)
  tierBonus: number;
  features: string[];
}

export function calculateTierBenefits(tier: InstructorTier): TierBenefits {
  const benefits: Record<InstructorTier, TierBenefits> = {
    STARTER: {
      commissionRate: 0.30,
      instructorRate: 0.70,
      tierBonus: 0,
      features: [
        'Basic analytics',
        'Standard support',
        'Monthly payouts',
      ],
    },
    PRO: {
      commissionRate: 0.25,
      instructorRate: 0.75,
      tierBonus: 0.05,
      features: [
        'Advanced analytics',
        'Priority support',
        'Bi-weekly payouts',
        'Featured badge',
        'Co-instructor feature',
      ],
    },
    ELITE: {
      commissionRate: 0.20,
      instructorRate: 0.80,
      tierBonus: 0.10,
      features: [
        'Premium analytics',
        '24/7 support',
        'Weekly payouts',
        'Verified badge',
        'Homepage featuring',
        'Custom revenue splits',
        'Early access to features',
      ],
    },
    PLATFORM_OWNER: {
      commissionRate: 0,
      instructorRate: 1.0,
      tierBonus: 0,
      features: [
        'Full platform access',
        'All features enabled',
        'No commission',
        'Instant payouts',
      ],
    },
  };

  return benefits[tier];
}

// ============================================
// Profile Management
// ============================================

/**
 * Create instructor profile for a user
 */
export async function createInstructorProfile(
  userId: string,
  input: CreateInstructorProfileInput,
) {
  // Check if user already has an instructor profile
  const existing = await prisma.instructorProfile.findUnique({
    where: { userId },
  });

  if (existing) {
    throw new Error('User already has an instructor profile');
  }

  // Generate unique slug
  const slug = input.slug
    ? await generateUniqueSlug(input.slug)
    : await generateUniqueSlug(input.displayName);

  const profile = await prisma.instructorProfile.create({
    data: {
      userId,
      displayName: input.displayName,
      slug,
      bio: input.bio,
      shortBio: input.shortBio,
      profileImageUrl: input.profileImageUrl,
      coverImageUrl: input.coverImageUrl,
      introVideoUrl: input.introVideoUrl,
      specializations: input.specializations || [],
      certifications: input.certifications as Prisma.InputJsonValue,
      yearsOfExperience: input.yearsOfExperience || 0,
      languages: input.languages || [],
      socialLinks: input.socialLinks as Prisma.InputJsonValue,
      location: input.location,
      timezone: input.timezone || 'Europe/Istanbul',
      status: 'PENDING',
      tier: 'STARTER',
    },
    include: {
      user: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
    },
  });

  logger.info({ userId, profileId: profile.id }, 'Instructor profile created');

  return profile;
}

/**
 * Update instructor profile
 */
export async function updateInstructorProfile(
  instructorId: string,
  input: UpdateInstructorProfileInput,
) {
  const profile = await prisma.instructorProfile.update({
    where: { id: instructorId },
    data: {
      displayName: input.displayName,
      bio: input.bio,
      shortBio: input.shortBio,
      profileImageUrl: input.profileImageUrl,
      coverImageUrl: input.coverImageUrl,
      introVideoUrl: input.introVideoUrl,
      specializations: input.specializations,
      certifications: input.certifications as Prisma.InputJsonValue,
      yearsOfExperience: input.yearsOfExperience,
      languages: input.languages,
      socialLinks: input.socialLinks as Prisma.InputJsonValue,
      location: input.location,
      timezone: input.timezone,
    },
    include: {
      user: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
    },
  });

  logger.info({ instructorId }, 'Instructor profile updated');

  return profile;
}

/**
 * Get instructor by slug (public)
 */
export async function getInstructorBySlug(slug: string) {
  return prisma.instructorProfile.findUnique({
    where: { slug, status: 'APPROVED' },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      _count: {
        select: {
          followers: true,
          reviews: { where: { status: 'APPROVED' } },
        },
      },
    },
  });
}

/**
 * Get instructor by ID
 */
export async function getInstructorById(id: string) {
  return prisma.instructorProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      payoutSettings: true,
    },
  });
}

/**
 * Get instructor by user ID
 */
export async function getInstructorByUserId(userId: string) {
  return prisma.instructorProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      payoutSettings: true,
    },
  });
}

/**
 * Get all instructors with filters and pagination
 */
export async function getAllInstructors(
  filters: InstructorFilters = {},
  pagination: PaginationOptions = {},
) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = pagination;

  const where: Prisma.InstructorProfileWhereInput = {
    status: filters.status || 'APPROVED',
  };

  if (filters.tier) {
    where.tier = filters.tier;
  }

  if (filters.isVerified !== undefined) {
    where.isVerified = filters.isVerified;
  }

  if (filters.isFeatured !== undefined) {
    where.isFeatured = filters.isFeatured;
  }

  if (filters.specializations && filters.specializations.length > 0) {
    where.specializations = {
      hasSome: filters.specializations,
    };
  }

  if (filters.minRating !== undefined) {
    where.averageRating = {
      gte: filters.minRating,
    };
  }

  const orderBy: Prisma.InstructorProfileOrderByWithRelationInput = {};
  switch (sortBy) {
    case 'rating':
      orderBy.averageRating = sortOrder;
      break;
    case 'students':
      orderBy.totalStudents = sortOrder;
      break;
    case 'name':
      orderBy.displayName = sortOrder;
      break;
    default:
      orderBy.createdAt = sortOrder;
  }

  const [items, total] = await Promise.all([
    prisma.instructorProfile.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { followers: true },
        },
      },
    }),
    prisma.instructorProfile.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get featured instructors
 */
export async function getFeaturedInstructors(limit: number = 6) {
  return prisma.instructorProfile.findMany({
    where: {
      status: 'APPROVED',
      isFeatured: true,
    },
    orderBy: { averageRating: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

/**
 * Search instructors
 */
export async function searchInstructors(
  query: string,
  filters: InstructorFilters = {},
  pagination: PaginationOptions = {},
) {
  const { page = 1, limit = 20 } = pagination;

  const where: Prisma.InstructorProfileWhereInput = {
    status: 'APPROVED',
    OR: [
      { displayName: { contains: query, mode: 'insensitive' } },
      { bio: { contains: query, mode: 'insensitive' } },
      { shortBio: { contains: query, mode: 'insensitive' } },
      { specializations: { has: query } },
    ],
  };

  if (filters.specializations && filters.specializations.length > 0) {
    where.specializations = {
      hasSome: filters.specializations,
    };
  }

  if (filters.minRating !== undefined) {
    where.averageRating = {
      gte: filters.minRating,
    };
  }

  const [items, total] = await Promise.all([
    prisma.instructorProfile.findMany({
      where,
      orderBy: { averageRating: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.instructorProfile.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ============================================
// Verification
// ============================================

interface VerificationDocument {
  type: string;
  url: string;
  uploadedAt: Date;
}

/**
 * Submit instructor for verification
 */
export async function submitForVerification(
  instructorId: string,
  documents?: VerificationDocument[],
) {
  const data: Prisma.InstructorProfileUpdateInput = {
    status: 'PENDING',
  };

  if (documents) {
    data.verificationDocs = documents as unknown as Prisma.InputJsonValue;
  }

  const profile = await prisma.instructorProfile.update({
    where: { id: instructorId },
    data,
  });

  logger.info({ instructorId }, 'Instructor submitted for verification');

  return profile;
}

/**
 * Approve instructor (admin)
 */
export async function approveInstructor(
  instructorId: string,
  adminId: string,
  options: { tier?: InstructorTier; commissionRate?: number; notes?: string } = {},
) {
  const data: Prisma.InstructorProfileUpdateInput = {
    status: 'APPROVED',
    isVerified: true,
    verifiedAt: new Date(),
    rejectionReason: null,
  };

  if (options.tier) {
    data.tier = options.tier;
  }

  if (options.commissionRate !== undefined) {
    data.commissionRate = options.commissionRate;
  }

  const profile = await prisma.instructorProfile.update({
    where: { id: instructorId },
    data,
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'INSTRUCTOR_APPROVED',
      metadata: { instructorId, instructorUserId: profile.userId, ...options },
    },
  });

  logger.info({ instructorId, adminId }, 'Instructor approved');

  return profile;
}

/**
 * Reject instructor (admin)
 */
export async function rejectInstructor(
  instructorId: string,
  adminId: string,
  reason: string,
) {
  const profile = await prisma.instructorProfile.update({
    where: { id: instructorId },
    data: {
      status: 'REJECTED',
      rejectionReason: reason,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'INSTRUCTOR_REJECTED',
      metadata: { instructorId, reason },
    },
  });

  logger.info({ instructorId, adminId, reason }, 'Instructor rejected');

  return profile;
}

/**
 * Suspend instructor (admin)
 */
export async function suspendInstructor(
  instructorId: string,
  adminId: string,
  reason: string,
) {
  const profile = await prisma.instructorProfile.update({
    where: { id: instructorId },
    data: {
      status: 'SUSPENDED',
      suspensionReason: reason,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'INSTRUCTOR_SUSPENDED',
      metadata: { instructorId, reason },
    },
  });

  logger.info({ instructorId, adminId, reason }, 'Instructor suspended');

  return profile;
}

/**
 * Reactivate instructor (admin)
 */
export async function reactivateInstructor(instructorId: string, adminId: string) {
  const profile = await prisma.instructorProfile.update({
    where: { id: instructorId },
    data: {
      status: 'APPROVED',
      suspensionReason: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'INSTRUCTOR_REACTIVATED',
      metadata: { instructorId },
    },
  });

  logger.info({ instructorId, adminId }, 'Instructor reactivated');

  return profile;
}

// ============================================
// Tier Management
// ============================================

/**
 * Update instructor tier (admin)
 */
export async function updateInstructorTier(
  instructorId: string,
  tier: InstructorTier,
  customRate?: number,
) {
  const benefits = calculateTierBenefits(tier);

  const profile = await prisma.instructorProfile.update({
    where: { id: instructorId },
    data: {
      tier,
      commissionRate: benefits.commissionRate,
      customPayoutRate: customRate,
    },
  });

  logger.info({ instructorId, tier, customRate }, 'Instructor tier updated');

  return profile;
}

/**
 * Update instructor commission rate (admin)
 */
export async function updateCommissionRate(
  instructorId: string,
  commissionRate: number,
) {
  if (commissionRate < 0 || commissionRate > 1) {
    throw new Error('Commission rate must be between 0 and 1');
  }

  const profile = await prisma.instructorProfile.update({
    where: { id: instructorId },
    data: {
      commissionRate,
    },
  });

  logger.info({ instructorId, commissionRate }, 'Instructor commission rate updated');

  return profile;
}

// ============================================
// Content
// ============================================

/**
 * Get instructor's programs
 */
export async function getInstructorPrograms(instructorId: string) {
  const instructor = await prisma.instructorProfile.findUnique({
    where: { id: instructorId },
  });

  if (!instructor) {
    throw new Error('Instructor not found');
  }

  return prisma.program.findMany({
    where: {
      OR: [
        { instructorId: instructor.userId },
        { coInstructorIds: { has: instructor.userId } },
      ],
    },
    include: {
      sessions: true,
      tags: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get instructor's classes
 */
export async function getInstructorClasses(instructorId: string) {
  const instructor = await prisma.instructorProfile.findUnique({
    where: { id: instructorId },
  });

  if (!instructor) {
    throw new Error('Instructor not found');
  }

  return prisma.class.findMany({
    where: {
      OR: [
        { instructorId: instructor.userId },
        { coInstructorIds: { has: instructor.userId } },
      ],
    },
    orderBy: { schedule: 'desc' },
  });
}

/**
 * Get all instructor content
 */
export async function getInstructorContent(instructorId: string) {
  const [programs, classes] = await Promise.all([
    getInstructorPrograms(instructorId),
    getInstructorClasses(instructorId),
  ]);

  return {
    programs,
    classes,
    totalPrograms: programs.length,
    totalClasses: classes.length,
  };
}

/**
 * Check if user is content owner (for free access)
 */
export async function isContentOwner(
  userId: string,
  contentId: string,
  contentType: 'PROGRAM' | 'CLASS',
): Promise<boolean> {
  if (contentType === 'PROGRAM') {
    const program = await prisma.program.findUnique({
      where: { id: contentId },
    });

    if (!program) return false;

    return (
      program.instructorId === userId ||
      program.coInstructorIds.includes(userId)
    );
  }

  if (contentType === 'CLASS') {
    const classItem = await prisma.class.findUnique({
      where: { id: contentId },
    });

    if (!classItem) return false;

    return (
      classItem.instructorId === userId ||
      classItem.coInstructorIds.includes(userId)
    );
  }

  return false;
}

// ============================================
// Stats Update
// ============================================

/**
 * Update instructor stats (called by cron job)
 */
export async function updateInstructorStats(instructorId: string) {
  const instructor = await prisma.instructorProfile.findUnique({
    where: { id: instructorId },
  });

  if (!instructor) return;

  // Count programs
  const totalPrograms = await prisma.program.count({
    where: {
      OR: [
        { instructorId: instructor.userId },
        { coInstructorIds: { has: instructor.userId } },
      ],
    },
  });

  // Count classes
  const totalClasses = await prisma.class.count({
    where: {
      OR: [
        { instructorId: instructor.userId },
        { coInstructorIds: { has: instructor.userId } },
      ],
    },
  });

  // Calculate average rating
  const reviewStats = await prisma.instructorReview.aggregate({
    where: {
      instructorId,
      status: 'APPROVED',
    },
    _avg: { rating: true },
    _count: true,
  });

  // Count unique students (from bookings)
  const bookings = await prisma.booking.findMany({
    where: {
      class: {
        instructorId: instructor.userId,
      },
      status: 'CONFIRMED',
    },
    select: { userId: true },
    distinct: ['userId'],
  });

  const totalStudents = bookings.length;

  // Update profile
  await prisma.instructorProfile.update({
    where: { id: instructorId },
    data: {
      totalPrograms,
      totalClasses,
      totalStudents,
      averageRating: reviewStats._avg.rating || 0,
      totalReviews: reviewStats._count,
    },
  });

  logger.debug({ instructorId }, 'Instructor stats updated');
}

/**
 * Update all instructor stats (for cron job)
 */
export async function updateAllInstructorStats() {
  const instructors = await prisma.instructorProfile.findMany({
    where: { status: 'APPROVED' },
    select: { id: true },
  });

  for (const instructor of instructors) {
    await updateInstructorStats(instructor.id);
  }

  logger.info({ count: instructors.length }, 'All instructor stats updated');
}

// ============================================
// Admin Queries
// ============================================

/**
 * Get pending instructors for admin review
 */
export async function getPendingInstructors() {
  return prisma.instructorProfile.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        },
      },
    },
  });
}

/**
 * Get instructor details for admin
 */
export async function getInstructorDetailsForAdmin(instructorId: string) {
  return prisma.instructorProfile.findUnique({
    where: { id: instructorId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          phoneNumber: true,
        },
      },
      payoutSettings: true,
      _count: {
        select: {
          earnings: true,
          payouts: true,
          reviews: true,
          followers: true,
        },
      },
    },
  });
}
