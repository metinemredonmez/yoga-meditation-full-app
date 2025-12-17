import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import type { GroupRole, Prisma } from '@prisma/client';

// ============================================
// Community Group Service
// ============================================

export interface GroupFilters {
  search?: string;
  isPrivate?: boolean;
  isOfficial?: boolean;
  createdById?: string;
}

export async function getGroups(
  filters: GroupFilters = {},
  pagination: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;

  const where: Prisma.CommunityGroupWhereInput = {};

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  if (filters.isPrivate !== undefined) where.isPrivate = filters.isPrivate;
  if (filters.isOfficial !== undefined) where.isOfficial = filters.isOfficial;
  if (filters.createdById) where.createdById = filters.createdById;

  const [groups, total] = await Promise.all([
    prisma.communityGroup.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: {
          select: { members: true, posts: true },
        },
      },
      orderBy: [{ isOfficial: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.communityGroup.count({ where }),
  ]);

  return {
    groups,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getGroupById(id: string) {
  return prisma.communityGroup.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: { id: true, firstName: true, lastName: true },
      },
      _count: {
        select: { members: true, posts: true },
      },
    },
  });
}

export async function getGroupBySlug(slug: string) {
  return prisma.communityGroup.findUnique({
    where: { slug },
    include: {
      createdBy: {
        select: { id: true, firstName: true, lastName: true },
      },
      _count: {
        select: { members: true, posts: true },
      },
    },
  });
}

export async function createGroup(data: {
  name: string;
  slug: string;
  description?: string;
  coverImage?: string;
  isPrivate?: boolean;
  createdById: string;
}) {
  const group = await prisma.communityGroup.create({
    data: {
      ...data,
      // Auto-add creator as owner
      members: {
        create: {
          userId: data.createdById,
          role: 'OWNER',
        },
      },
    },
    include: {
      createdBy: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  logger.info({ groupId: group.id, createdById: data.createdById }, 'Group created');
  return group;
}

export async function updateGroup(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    description: string;
    coverImage: string;
    isPrivate: boolean;
    isOfficial: boolean;
  }>,
) {
  const group = await prisma.communityGroup.update({
    where: { id },
    data,
    include: {
      createdBy: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  logger.info({ groupId: id }, 'Group updated');
  return group;
}

export async function deleteGroup(id: string) {
  await prisma.communityGroup.delete({
    where: { id },
  });

  logger.info({ groupId: id }, 'Group deleted');
}

// ============================================
// Group Membership Service
// ============================================

export async function getGroupMembers(
  groupId: string,
  pagination: { page?: number; limit?: number } = {},
  role?: GroupRole,
) {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;

  const where: Prisma.GroupMemberWhereInput = { groupId };
  if (role) where.role = role;

  const [members, total] = await Promise.all([
    prisma.groupMember.findMany({
      where,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, bio: true },
        },
      },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
      skip,
      take: limit,
    }),
    prisma.groupMember.count({ where }),
  ]);

  return {
    members,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function joinGroup(groupId: string, userId: string) {
  const group = await prisma.communityGroup.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    return { joined: false, message: 'Group not found' };
  }

  // Check if already a member
  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });

  if (existing) {
    return { joined: true, message: 'Already a member' };
  }

  // For private groups, might need approval (for now, direct join)
  await prisma.groupMember.create({
    data: { groupId, userId, role: 'MEMBER' },
  });

  logger.info({ groupId, userId }, 'User joined group');
  return { joined: true, message: 'Joined group' };
}

export async function leaveGroup(groupId: string, userId: string) {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });

  if (!membership) {
    return { left: true, message: 'Not a member' };
  }

  // Owner cannot leave
  if (membership.role === 'OWNER') {
    return { left: false, message: 'Owner cannot leave the group' };
  }

  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId } },
  });

  logger.info({ groupId, userId }, 'User left group');
  return { left: true, message: 'Left group' };
}

export async function updateMemberRole(
  groupId: string,
  userId: string,
  newRole: GroupRole,
) {
  await prisma.groupMember.update({
    where: { groupId_userId: { groupId, userId } },
    data: { role: newRole },
  });

  logger.info({ groupId, userId, role: newRole }, 'Member role updated');
}

export async function removeMember(groupId: string, userId: string) {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });

  if (!membership) {
    return { removed: false, message: 'Not a member' };
  }

  if (membership.role === 'OWNER') {
    return { removed: false, message: 'Cannot remove owner' };
  }

  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId } },
  });

  logger.info({ groupId, userId }, 'Member removed from group');
  return { removed: true, message: 'Member removed' };
}

export async function isMember(groupId: string, userId: string) {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  return !!membership;
}

export async function getMemberRole(groupId: string, userId: string) {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  return membership?.role || null;
}

export async function getUserGroups(
  userId: string,
  pagination: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;

  const [memberships, total] = await Promise.all([
    prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            _count: {
              select: { members: true, posts: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.groupMember.count({ where: { userId } }),
  ]);

  return {
    groups: memberships.map((m) => ({
      ...m.group,
      role: m.role,
      joinedAt: m.joinedAt,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================
// Group Post Service
// ============================================

export async function getGroupPosts(
  groupId: string,
  pagination: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    prisma.groupPost.findMany({
      where: { groupId },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.groupPost.count({ where: { groupId } }),
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

export async function getGroupPostById(id: string) {
  return prisma.groupPost.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true },
      },
      comments: {
        include: {
          author: {
            select: { id: true, firstName: true, lastName: true },
          },
          replies: {
            include: {
              author: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
            take: 3,
          },
        },
        where: { parentId: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: {
        select: { likes: true, comments: true },
      },
    },
  });
}

export async function createGroupPost(data: {
  groupId: string;
  authorId: string;
  content: string;
  mediaUrls?: string[];
}) {
  const post = await prisma.groupPost.create({
    data,
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  logger.info({ postId: post.id, groupId: data.groupId }, 'Group post created');
  return post;
}

export async function updateGroupPost(
  id: string,
  data: {
    content?: string;
    mediaUrls?: string[];
    isPinned?: boolean;
  },
) {
  const post = await prisma.groupPost.update({
    where: { id },
    data,
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  logger.info({ postId: id }, 'Group post updated');
  return post;
}

export async function deleteGroupPost(id: string) {
  await prisma.groupPost.delete({
    where: { id },
  });

  logger.info({ postId: id }, 'Group post deleted');
}

// ============================================
// Group Post Like Service
// ============================================

export async function likeGroupPost(postId: string, userId: string) {
  const existing = await prisma.groupPostLike.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  if (existing) {
    return { liked: true, message: 'Already liked' };
  }

  await prisma.groupPostLike.create({
    data: { postId, userId },
  });

  return { liked: true, message: 'Post liked' };
}

export async function unlikeGroupPost(postId: string, userId: string) {
  const existing = await prisma.groupPostLike.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  if (!existing) {
    return { liked: false, message: 'Not liked' };
  }

  await prisma.groupPostLike.delete({
    where: { postId_userId: { postId, userId } },
  });

  return { liked: false, message: 'Post unliked' };
}

// ============================================
// Group Post Comment Service
// ============================================

export async function getPostComments(
  postId: string,
  pagination: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;

  const [comments, total] = await Promise.all([
    prisma.groupPostComment.findMany({
      where: { postId, parentId: null },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true },
        },
        replies: {
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.groupPostComment.count({ where: { postId, parentId: null } }),
  ]);

  return {
    comments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function createPostComment(data: {
  postId: string;
  authorId: string;
  content: string;
  parentId?: string;
}) {
  const comment = await prisma.groupPostComment.create({
    data,
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  logger.info({ commentId: comment.id, postId: data.postId }, 'Group post comment created');
  return comment;
}

export async function updatePostComment(
  id: string,
  data: { content: string },
) {
  const comment = await prisma.groupPostComment.update({
    where: { id },
    data,
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  logger.info({ commentId: id }, 'Group post comment updated');
  return comment;
}

export async function deletePostComment(id: string) {
  await prisma.groupPostComment.delete({
    where: { id },
  });

  logger.info({ commentId: id }, 'Group post comment deleted');
}
