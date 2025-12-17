import { z } from 'zod';

// ============================================
// Forum Schemas
// ============================================

export const createCategoryBodySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
  sortOrder: z.number().int().min(0).optional(),
  parentId: z.string().cuid().optional(),
});

export const updateCategoryBodySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  parentId: z.string().cuid().nullable().optional(),
});

export const createTopicBodySchema = z.object({
  title: z.string().min(5).max(200),
  slug: z.string().min(5).max(200).regex(/^[a-z0-9-]+$/),
  content: z.string().min(10).max(50000),
  categoryId: z.string().cuid(),
  tagIds: z.array(z.string().cuid()).optional(),
});

export const updateTopicBodySchema = z.object({
  title: z.string().min(5).max(200).optional(),
  slug: z.string().min(5).max(200).regex(/^[a-z0-9-]+$/).optional(),
  content: z.string().min(10).max(50000).optional(),
  categoryId: z.string().cuid().optional(),
  isPinned: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  tagIds: z.array(z.string().cuid()).optional(),
});

export const createPostBodySchema = z.object({
  content: z.string().min(1).max(50000),
  parentId: z.string().cuid().optional(),
});

export const updatePostBodySchema = z.object({
  content: z.string().min(1).max(50000),
});

export const createTagBodySchema = z.object({
  name: z.string().min(2).max(50),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  color: z.string().max(20).optional(),
});

// ============================================
// Comment Schemas
// ============================================

export const createCommentBodySchema = z.object({
  content: z.string().min(1).max(10000),
  targetType: z.enum(['PROGRAM', 'CLASS', 'POSE', 'CHALLENGE']),
  programId: z.string().cuid().optional(),
  classId: z.string().cuid().optional(),
  poseId: z.string().cuid().optional(),
  challengeId: z.string().cuid().optional(),
  parentId: z.string().cuid().optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

export const updateCommentBodySchema = z.object({
  content: z.string().min(1).max(10000),
  rating: z.number().int().min(1).max(5).optional(),
});

// ============================================
// Social Schemas
// ============================================

export const createBadgeBodySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().min(10).max(500),
  icon: z.string().min(1).max(200),
  color: z.string().max(20).optional(),
  category: z.enum(['PRACTICE', 'STREAK', 'SOCIAL', 'ACHIEVEMENT', 'SPECIAL']),
  requirement: z.record(z.string(), z.unknown()),
  points: z.number().int().min(0).optional(),
});

export const updateBadgeBodySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().min(10).max(500).optional(),
  icon: z.string().min(1).max(200).optional(),
  color: z.string().max(20).optional(),
  category: z.enum(['PRACTICE', 'STREAK', 'SOCIAL', 'ACHIEVEMENT', 'SPECIAL']).optional(),
  requirement: z.record(z.string(), z.unknown()).optional(),
  points: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const createShareBodySchema = z.object({
  platform: z.enum(['FACEBOOK', 'TWITTER', 'INSTAGRAM', 'WHATSAPP', 'LINKEDIN', 'COPY_LINK']),
  shareType: z.enum(['PROGRESS', 'ACHIEVEMENT', 'BADGE', 'PROGRAM', 'CLASS', 'CHALLENGE', 'PROFILE']),
  targetId: z.string(),
  targetType: z.string(),
  shareUrl: z.string().url().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ============================================
// Messaging Schemas
// ============================================

export const sendMessageBodySchema = z.object({
  receiverId: z.string().cuid(),
  content: z.string().min(1).max(5000),
});

// ============================================
// Group Schemas
// ============================================

export const createGroupBodySchema = z.object({
  name: z.string().min(3).max(100),
  slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional(),
  coverImage: z.string().url().optional(),
  isPrivate: z.boolean().optional(),
});

export const updateGroupBodySchema = z.object({
  name: z.string().min(3).max(100).optional(),
  slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(2000).optional(),
  coverImage: z.string().url().optional(),
  isPrivate: z.boolean().optional(),
  isOfficial: z.boolean().optional(),
});

export const createGroupPostBodySchema = z.object({
  content: z.string().min(1).max(10000),
  mediaUrls: z.array(z.string().url()).optional(),
});

export const updateGroupPostBodySchema = z.object({
  content: z.string().min(1).max(10000).optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  isPinned: z.boolean().optional(),
});

export const updateMemberRoleBodySchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'MODERATOR', 'MEMBER']),
});

// ============================================
// Report Schemas
// ============================================

export const createReportBodySchema = z.object({
  targetType: z.enum(['TOPIC', 'POST', 'COMMENT', 'USER']),
  targetId: z.string().cuid(),
  reason: z.enum(['SPAM', 'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'MISINFORMATION', 'COPYRIGHT', 'OTHER']),
  description: z.string().max(1000).optional(),
});

export const resolveReportBodySchema = z.object({
  resolution: z.string().min(1).max(500),
  action: z.enum(['hide', 'delete', 'ban', 'none']).optional(),
});

export const updateReportStatusBodySchema = z.object({
  status: z.enum(['PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED']),
  resolution: z.string().max(500).optional(),
});

// ============================================
// Common Params Schema
// ============================================

export const idParamsSchema = z.object({
  id: z.string().cuid(),
});
