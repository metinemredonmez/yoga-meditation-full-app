import { z } from 'zod';

// ============================================
// Profile Schemas
// ============================================

export const createProfileSchema = z.object({
  displayName: z.string().min(2).max(100),
  bio: z.string().max(2000).optional(),
  shortBio: z.string().max(200).optional(),
  profileImageUrl: z.string().url().optional(),
  coverImageUrl: z.string().url().optional(),
  specializations: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  socialLinks: z
    .object({
      website: z.string().url().optional(),
      instagram: z.string().optional(),
      youtube: z.string().optional(),
      facebook: z.string().optional(),
      twitter: z.string().optional(),
    })
    .optional(),
  experienceYears: z.number().min(0).max(50).optional(),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  bio: z.string().max(2000).optional(),
  shortBio: z.string().max(200).optional(),
  profileImageUrl: z.string().url().or(z.literal('')).optional(),
  coverImageUrl: z.string().url().or(z.literal('')).optional(),
  specializations: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  socialLinks: z
    .object({
      website: z.string().url().or(z.literal('')).optional(),
      instagram: z.string().optional(),
      youtube: z.string().optional(),
      facebook: z.string().optional(),
      twitter: z.string().optional(),
    })
    .optional(),
  experienceYears: z.number().min(0).max(50).optional(),
});

// ============================================
// Payout Schemas
// ============================================

export const requestPayoutSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(['BANK_TRANSFER', 'PAYPAL', 'STRIPE_CONNECT', 'WISE']),
  notes: z.string().max(500).optional(),
});

export const updatePayoutSettingsSchema = z.object({
  preferredMethod: z.enum(['BANK_TRANSFER', 'PAYPAL', 'STRIPE_CONNECT', 'WISE']).optional(),
  autoPayoutEnabled: z.boolean().optional(),
  autoPayoutThreshold: z.number().positive().optional(),
  autoPayoutDay: z.number().min(1).max(28).optional(),
  bankDetails: z
    .object({
      accountName: z.string(),
      accountNumber: z.string(),
      bankName: z.string(),
      routingNumber: z.string().optional(),
      swiftCode: z.string().optional(),
      iban: z.string().optional(),
    })
    .optional(),
  paypalEmail: z.string().email().optional(),
  wiseEmail: z.string().email().optional(),
  taxId: z.string().optional(),
  taxCountry: z.string().length(2).optional(),
});

// ============================================
// Review Schemas
// ============================================

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  content: z.string().max(2000).optional(),
  programId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(200).optional(),
  content: z.string().max(2000).optional(),
});

export const replyToReviewSchema = z.object({
  reply: z.string().min(1).max(2000),
});

export const reportReviewSchema = z.object({
  reason: z.string().min(10).max(500),
});

// ============================================
// Follower Schemas
// ============================================

export const toggleNotificationsSchema = z.object({
  enabled: z.boolean(),
});

// ============================================
// Admin Schemas
// ============================================

export const approveInstructorSchema = z.object({
  tier: z.enum(['STARTER', 'PRO', 'ELITE', 'PLATFORM_OWNER']).optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  notes: z.string().max(500).optional(),
});

export const rejectInstructorSchema = z.object({
  reason: z.string().min(10).max(500),
});

export const updateTierSchema = z.object({
  tier: z.enum(['STARTER', 'PRO', 'ELITE', 'PLATFORM_OWNER']),
  commissionRate: z.number().min(0).max(100).optional(),
  reason: z.string().max(500).optional(),
});

export const moderateReviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'FLAGGED']),
  reason: z.string().max(500).optional(),
});

export const completePayoutSchema = z.object({
  transactionId: z.string(),
  notes: z.string().max(500).optional(),
});

export const failPayoutSchema = z.object({
  reason: z.string().min(10).max(500).optional(),
  failedReason: z.string().min(10).max(500).optional(),
});

export const recordEarningSchema = z.object({
  type: z.enum(['BONUS', 'ADJUSTMENT', 'REFUND']),
  amount: z.number(),
  description: z.string().max(500).optional(),
});

// ============================================
// Query Schemas
// ============================================

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const instructorListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']).optional(),
  tier: z.enum(['STARTER', 'PRO', 'ELITE', 'PLATFORM_OWNER']).optional(),
  search: z.string().optional(),
});

export const dateRangeQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
