import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import type { Prisma } from '@prisma/client';

// ============================================
// Forum Category Service
// ============================================

export async function getCategories(options: {
  includeInactive?: boolean;
  parentId?: string | null;
} = {}) {
  const { includeInactive = false, parentId = null } = options;

  const where: Prisma.ForumCategoryWhereInput = {
    parentId,
  };

  if (!includeInactive) {
    where.isActive = true;
  }

  return prisma.forumCategory.findMany({
    where,
    include: {
      children: {
        where: includeInactive ? {} : { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
      _count: {
        select: { topics: true },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.forumCategory.findUnique({
    where: { slug },
    include: {
      parent: true,
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
      _count: {
        select: { topics: true },
      },
    },
  });
}

export async function createCategory(data: {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
  parentId?: string;
}) {
  const category = await prisma.forumCategory.create({
    data,
  });

  logger.info({ categoryId: category.id }, 'Forum category created');
  return category;
}

export async function updateCategory(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    description: string;
    icon: string;
    color: string;
    sortOrder: number;
    isActive: boolean;
    parentId: string | null;
  }>,
) {
  const category = await prisma.forumCategory.update({
    where: { id },
    data,
  });

  logger.info({ categoryId: id }, 'Forum category updated');
  return category;
}

export async function deleteCategory(id: string) {
  // Check for child categories
  const childCount = await prisma.forumCategory.count({
    where: { parentId: id },
  });

  if (childCount > 0) {
    throw new Error('Cannot delete category with child categories');
  }

  // Check for topics
  const topicCount = await prisma.forumTopic.count({
    where: { categoryId: id },
  });

  if (topicCount > 0) {
    throw new Error('Cannot delete category with topics');
  }

  await prisma.forumCategory.delete({
    where: { id },
  });

  logger.info({ categoryId: id }, 'Forum category deleted');
}

// ============================================
// Forum Topic Service
// ============================================

export interface TopicFilters {
  categoryId?: string;
  authorId?: string;
  isPinned?: boolean;
  isLocked?: boolean;
  isFeatured?: boolean;
  tagIds?: string[];
  search?: string;
}

export async function getTopics(
  filters: TopicFilters = {},
  pagination: { page?: number; limit?: number } = {},
  sort: { field?: string; order?: 'asc' | 'desc' } = {},
) {
  const { page = 1, limit = 20 } = pagination;
  const { field = 'createdAt', order = 'desc' } = sort;
  const skip = (page - 1) * limit;

  const where: Prisma.ForumTopicWhereInput = {};

  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.authorId) where.authorId = filters.authorId;
  if (filters.isPinned !== undefined) where.isPinned = filters.isPinned;
  if (filters.isLocked !== undefined) where.isLocked = filters.isLocked;
  if (filters.isFeatured !== undefined) where.isFeatured = filters.isFeatured;

  if (filters.tagIds && filters.tagIds.length > 0) {
    where.tags = {
      some: {
        tagId: { in: filters.tagIds },
      },
    };
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { content: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [topics, total] = await Promise.all([
    prisma.forumTopic.findMany({
      where,
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
        tags: {
          include: { tag: true },
        },
        lastReplyBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: {
          select: { posts: true, followers: true },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { [field]: order },
      ],
      skip,
      take: limit,
    }),
    prisma.forumTopic.count({ where }),
  ]);

  return {
    topics,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getTopicById(id: string, incrementView = false) {
  if (incrementView) {
    await prisma.forumTopic.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  return prisma.forumTopic.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true, bio: true },
      },
      category: {
        select: { id: true, name: true, slug: true },
      },
      tags: {
        include: { tag: true },
      },
      lastReplyBy: {
        select: { id: true, firstName: true, lastName: true },
      },
      _count: {
        select: { posts: true, followers: true },
      },
    },
  });
}

export async function getTopicBySlug(slug: string, incrementView = false) {
  const topic = await prisma.forumTopic.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!topic) return null;
  return getTopicById(topic.id, incrementView);
}

export async function createTopic(data: {
  title: string;
  slug: string;
  content: string;
  categoryId: string;
  authorId: string;
  tagIds?: string[];
}) {
  const { tagIds, ...topicData } = data;

  const topic = await prisma.forumTopic.create({
    data: {
      ...topicData,
      tags: tagIds
        ? {
            create: tagIds.map((tagId) => ({ tagId })),
          }
        : undefined,
    },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true },
      },
      category: {
        select: { id: true, name: true, slug: true },
      },
      tags: {
        include: { tag: true },
      },
    },
  });

  logger.info({ topicId: topic.id, authorId: data.authorId }, 'Forum topic created');
  return topic;
}

export async function updateTopic(
  id: string,
  data: Partial<{
    title: string;
    slug: string;
    content: string;
    categoryId: string;
    isPinned: boolean;
    isLocked: boolean;
    isFeatured: boolean;
    tagIds: string[];
  }>,
) {
  const { tagIds, ...topicData } = data;

  // If tagIds provided, update tags
  if (tagIds !== undefined) {
    await prisma.forumTopicTag.deleteMany({
      where: { topicId: id },
    });

    if (tagIds.length > 0) {
      await prisma.forumTopicTag.createMany({
        data: tagIds.map((tagId) => ({ topicId: id, tagId })),
      });
    }
  }

  const topic = await prisma.forumTopic.update({
    where: { id },
    data: topicData,
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true },
      },
      category: {
        select: { id: true, name: true, slug: true },
      },
      tags: {
        include: { tag: true },
      },
    },
  });

  logger.info({ topicId: id }, 'Forum topic updated');
  return topic;
}

export async function deleteTopic(id: string) {
  await prisma.forumTopic.delete({
    where: { id },
  });

  logger.info({ topicId: id }, 'Forum topic deleted');
}

// ============================================
// Forum Post Service
// ============================================

export async function getPostsByTopic(
  topicId: string,
  pagination: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    prisma.forumPost.findMany({
      where: { topicId, parentId: null },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, bio: true },
        },
        replies: {
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true },
            },
            _count: {
              select: { likes: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { likes: true },
        },
      },
      orderBy: [
        { isAccepted: 'desc' },
        { createdAt: 'asc' },
      ],
      skip,
      take: limit,
    }),
    prisma.forumPost.count({ where: { topicId, parentId: null } }),
  ]);

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function createPost(data: {
  content: string;
  topicId: string;
  authorId: string;
  parentId?: string;
}) {
  const post = await prisma.forumPost.create({
    data,
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  // Update topic reply count and last reply info
  await prisma.forumTopic.update({
    where: { id: data.topicId },
    data: {
      replyCount: { increment: 1 },
      lastReplyAt: new Date(),
      lastReplyById: data.authorId,
    },
  });

  logger.info({ postId: post.id, topicId: data.topicId }, 'Forum post created');
  return post;
}

export async function updatePost(
  id: string,
  data: { content: string },
) {
  const post = await prisma.forumPost.update({
    where: { id },
    data: {
      content: data.content,
      isEdited: true,
      editedAt: new Date(),
    },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  logger.info({ postId: id }, 'Forum post updated');
  return post;
}

export async function deletePost(id: string) {
  const post = await prisma.forumPost.findUnique({
    where: { id },
    select: { topicId: true },
  });

  if (!post) return;

  await prisma.forumPost.delete({
    where: { id },
  });

  // Update topic reply count
  await prisma.forumTopic.update({
    where: { id: post.topicId },
    data: {
      replyCount: { decrement: 1 },
    },
  });

  logger.info({ postId: id }, 'Forum post deleted');
}

export async function markPostAsAccepted(id: string, topicId: string) {
  // Unmark any previously accepted post
  await prisma.forumPost.updateMany({
    where: { topicId, isAccepted: true },
    data: { isAccepted: false },
  });

  // Mark the new post as accepted
  const post = await prisma.forumPost.update({
    where: { id },
    data: { isAccepted: true },
  });

  logger.info({ postId: id, topicId }, 'Forum post marked as accepted');
  return post;
}

// ============================================
// Forum Post Like Service
// ============================================

export async function likePost(postId: string, userId: string) {
  const existing = await prisma.forumPostLike.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  if (existing) {
    return { liked: true, message: 'Already liked' };
  }

  await prisma.forumPostLike.create({
    data: { postId, userId },
  });

  logger.debug({ postId, userId }, 'Forum post liked');
  return { liked: true, message: 'Post liked' };
}

export async function unlikePost(postId: string, userId: string) {
  const existing = await prisma.forumPostLike.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  if (!existing) {
    return { liked: false, message: 'Not liked' };
  }

  await prisma.forumPostLike.delete({
    where: { postId_userId: { postId, userId } },
  });

  logger.debug({ postId, userId }, 'Forum post unliked');
  return { liked: false, message: 'Post unliked' };
}

export async function hasUserLikedPost(postId: string, userId: string) {
  const like = await prisma.forumPostLike.findUnique({
    where: { postId_userId: { postId, userId } },
  });
  return !!like;
}

// ============================================
// Forum Tag Service
// ============================================

export async function getTags() {
  return prisma.forumTag.findMany({
    include: {
      _count: {
        select: { topics: true },
      },
    },
    orderBy: { name: 'asc' },
  });
}

export async function createTag(data: { name: string; slug: string; color?: string }) {
  return prisma.forumTag.create({ data });
}

export async function deleteTag(id: string) {
  await prisma.forumTag.delete({ where: { id } });
}

// ============================================
// Topic Follow Service
// ============================================

export async function followTopic(topicId: string, userId: string) {
  const existing = await prisma.forumTopicFollower.findUnique({
    where: { topicId_userId: { topicId, userId } },
  });

  if (existing) {
    return { following: true, message: 'Already following' };
  }

  await prisma.forumTopicFollower.create({
    data: { topicId, userId },
  });

  logger.debug({ topicId, userId }, 'Topic followed');
  return { following: true, message: 'Topic followed' };
}

export async function unfollowTopic(topicId: string, userId: string) {
  const existing = await prisma.forumTopicFollower.findUnique({
    where: { topicId_userId: { topicId, userId } },
  });

  if (!existing) {
    return { following: false, message: 'Not following' };
  }

  await prisma.forumTopicFollower.delete({
    where: { topicId_userId: { topicId, userId } },
  });

  logger.debug({ topicId, userId }, 'Topic unfollowed');
  return { following: false, message: 'Topic unfollowed' };
}

export async function isFollowingTopic(topicId: string, userId: string) {
  const follow = await prisma.forumTopicFollower.findUnique({
    where: { topicId_userId: { topicId, userId } },
  });
  return !!follow;
}

export async function getTopicFollowers(topicId: string) {
  return prisma.forumTopicFollower.findMany({
    where: { topicId },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });
}

// ============================================
// Forum Statistics
// ============================================

export async function getForumStats() {
  const [
    totalCategories,
    totalTopics,
    totalPosts,
    totalTags,
    recentTopics,
    popularTopics,
  ] = await Promise.all([
    prisma.forumCategory.count({ where: { isActive: true } }),
    prisma.forumTopic.count(),
    prisma.forumPost.count(),
    prisma.forumTag.count(),
    prisma.forumTopic.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        category: { select: { name: true, slug: true } },
      },
    }),
    prisma.forumTopic.findMany({
      take: 5,
      orderBy: { viewCount: 'desc' },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        category: { select: { name: true, slug: true } },
      },
    }),
  ]);

  return {
    totalCategories,
    totalTopics,
    totalPosts,
    totalTags,
    recentTopics,
    popularTopics,
  };
}
