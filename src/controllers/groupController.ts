import type { Request, Response, NextFunction } from 'express';
import * as groupService from '../services/groupService';
import { HttpError } from '../middleware/errorHandler';
import type { GroupRole } from '@prisma/client';

// ============================================
// Group Controllers
// ============================================

export async function getGroups(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { search, isPrivate, isOfficial, page, limit } = req.query;

    const result = await groupService.getGroups(
      {
        search: search as string,
        isPrivate: isPrivate === 'true' ? true : isPrivate === 'false' ? false : undefined,
        isOfficial: isOfficial === 'true' ? true : isOfficial === 'false' ? false : undefined,
      },
      {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      },
    );

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getGroupById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const userId = (req as any).user?.userId;

    const group = await groupService.getGroupById(id);

    if (!group) {
      throw new HttpError(404, 'Group not found');
    }

    // Check if user is a member (for private groups)
    let isMember = false;
    let role: GroupRole | null = null;
    if (userId) {
      isMember = await groupService.isMember(id, userId);
      role = await groupService.getMemberRole(id, userId);
    }

    // For private groups, only members can see
    if (group.isPrivate && !isMember) {
      throw new HttpError(403, 'This is a private group');
    }

    res.json({ success: true, data: { ...group, isMember, role } });
  } catch (error) {
    next(error);
  }
}

export async function getGroupBySlug(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const slug = req.params.slug!;
    const userId = (req as any).user?.userId;

    const group = await groupService.getGroupBySlug(slug);

    if (!group) {
      throw new HttpError(404, 'Group not found');
    }

    let isMember = false;
    let role: GroupRole | null = null;
    if (userId) {
      isMember = await groupService.isMember(group.id, userId);
      role = await groupService.getMemberRole(group.id, userId);
    }

    if (group.isPrivate && !isMember) {
      throw new HttpError(403, 'This is a private group');
    }

    res.json({ success: true, data: { ...group, isMember, role } });
  } catch (error) {
    next(error);
  }
}

export async function createGroup(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user.userId;
    const { name, slug, description, coverImage, isPrivate } = req.body;

    const group = await groupService.createGroup({
      name,
      slug,
      description,
      coverImage,
      isPrivate,
      createdById: userId,
    });

    res.status(201).json({ success: true, data: group });
  } catch (error) {
    next(error);
  }
}

export async function updateGroup(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    // Check permissions
    const memberRole = await groupService.getMemberRole(id, userId);
    if (
      memberRole !== 'OWNER' &&
      memberRole !== 'ADMIN' &&
      userRole !== 'ADMIN'
    ) {
      throw new HttpError(403, 'Not authorized to update this group');
    }

    const { name, slug, description, coverImage, isPrivate, isOfficial } = req.body;

    // Only system admin can set isOfficial
    const updateData: any = { name, slug, description, coverImage, isPrivate };
    if (userRole === 'ADMIN' && isOfficial !== undefined) {
      updateData.isOfficial = isOfficial;
    }

    const group = await groupService.updateGroup(id, updateData);
    res.json({ success: true, data: group });
  } catch (error) {
    next(error);
  }
}

export async function deleteGroup(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    // Check permissions
    const memberRole = await groupService.getMemberRole(id, userId);
    if (memberRole !== 'OWNER' && userRole !== 'ADMIN') {
      throw new HttpError(403, 'Not authorized to delete this group');
    }

    await groupService.deleteGroup(id);
    res.json({ success: true, message: 'Group deleted' });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Membership Controllers
// ============================================

export async function getGroupMembers(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const { page, limit, role } = req.query;

    const result = await groupService.getGroupMembers(
      id,
      {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      },
      role as GroupRole,
    );

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function joinGroup(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const userId = (req as any).user.userId;

    const result = await groupService.joinGroup(id, userId);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function leaveGroup(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const userId = (req as any).user.userId;

    const result = await groupService.leaveGroup(id, userId);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function updateMemberRole(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const memberId = req.params.memberId!;
    const userId = (req as any).user.userId;
    const { role: newRole } = req.body;

    // Check permissions
    const memberRole = await groupService.getMemberRole(id, userId);
    if (memberRole !== 'OWNER' && memberRole !== 'ADMIN') {
      throw new HttpError(403, 'Not authorized to change member roles');
    }

    // Only owner can promote to admin/owner
    if ((newRole === 'OWNER' || newRole === 'ADMIN') && memberRole !== 'OWNER') {
      throw new HttpError(403, 'Only owner can promote to admin');
    }

    await groupService.updateMemberRole(id, memberId, newRole);
    res.json({ success: true, message: 'Member role updated' });
  } catch (error) {
    next(error);
  }
}

export async function removeMember(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const memberId = req.params.memberId!;
    const userId = (req as any).user.userId;

    // Check permissions
    const memberRole = await groupService.getMemberRole(id, userId);
    if (memberRole !== 'OWNER' && memberRole !== 'ADMIN' && memberRole !== 'MODERATOR') {
      throw new HttpError(403, 'Not authorized to remove members');
    }

    const result = await groupService.removeMember(id, memberId);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getMyGroups(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user.userId;
    const { page, limit } = req.query;

    const result = await groupService.getUserGroups(userId, {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Group Post Controllers
// ============================================

export async function getGroupPosts(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const userId = (req as any).user?.userId;
    const { page, limit } = req.query;

    // Check if member for private groups
    const group = await groupService.getGroupById(id);
    if (!group) {
      throw new HttpError(404, 'Group not found');
    }

    if (group.isPrivate && userId) {
      const isMember = await groupService.isMember(id, userId);
      if (!isMember) {
        throw new HttpError(403, 'This is a private group');
      }
    }

    const result = await groupService.getGroupPosts(id, {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getGroupPost(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const postId = req.params.postId!;

    const post = await groupService.getGroupPostById(postId);

    if (!post) {
      throw new HttpError(404, 'Post not found');
    }

    res.json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
}

export async function createGroupPost(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const userId = (req as any).user.userId;
    const { content, mediaUrls } = req.body;

    // Check if member
    const isMember = await groupService.isMember(id, userId);
    if (!isMember) {
      throw new HttpError(403, 'Must be a member to post');
    }

    const post = await groupService.createGroupPost({
      groupId: id,
      authorId: userId,
      content,
      mediaUrls,
    });

    res.status(201).json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
}

export async function updateGroupPost(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const postId = req.params.postId!;
    const userId = (req as any).user.userId;
    const { content, mediaUrls, isPinned } = req.body;

    const existingPost = await groupService.getGroupPostById(postId);
    if (!existingPost) {
      throw new HttpError(404, 'Post not found');
    }

    // Check permissions
    const memberRole = await groupService.getMemberRole(id, userId);
    const isAuthor = existingPost.authorId === userId;

    if (!isAuthor && !['OWNER', 'ADMIN', 'MODERATOR'].includes(memberRole || '')) {
      throw new HttpError(403, 'Not authorized to update this post');
    }

    // Only moderators+ can pin
    const updateData: any = { content, mediaUrls };
    if (isPinned !== undefined && ['OWNER', 'ADMIN', 'MODERATOR'].includes(memberRole || '')) {
      updateData.isPinned = isPinned;
    }

    const post = await groupService.updateGroupPost(postId, updateData);
    res.json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
}

export async function deleteGroupPost(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const postId = req.params.postId!;
    const userId = (req as any).user.userId;

    const existingPost = await groupService.getGroupPostById(postId);
    if (!existingPost) {
      throw new HttpError(404, 'Post not found');
    }

    const memberRole = await groupService.getMemberRole(id, userId);
    const isAuthor = existingPost.authorId === userId;

    if (!isAuthor && !['OWNER', 'ADMIN', 'MODERATOR'].includes(memberRole || '')) {
      throw new HttpError(403, 'Not authorized to delete this post');
    }

    await groupService.deleteGroupPost(postId);
    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Group Post Like Controllers
// ============================================

export async function likeGroupPost(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const postId = req.params.postId!;
    const userId = (req as any).user.userId;

    const result = await groupService.likeGroupPost(postId, userId);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function unlikeGroupPost(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const postId = req.params.postId!;
    const userId = (req as any).user.userId;

    const result = await groupService.unlikeGroupPost(postId, userId);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Group Post Comment Controllers
// ============================================

export async function getPostComments(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const postId = req.params.postId!;
    const { page, limit } = req.query;

    const result = await groupService.getPostComments(postId, {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function createPostComment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const postId = req.params.postId!;
    const userId = (req as any).user.userId;
    const { content, parentId } = req.body;

    const comment = await groupService.createPostComment({
      postId,
      authorId: userId,
      content,
      parentId,
    });

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
}

export async function updatePostComment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const commentId = req.params.commentId!;
    const userId = (req as any).user.userId;
    const { content } = req.body;

    // Verify ownership (simplified - would need getCommentById in real implementation)
    const comment = await groupService.updatePostComment(commentId, { content });
    res.json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
}

export async function deletePostComment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const commentId = req.params.commentId!;

    await groupService.deletePostComment(commentId);
    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
}
