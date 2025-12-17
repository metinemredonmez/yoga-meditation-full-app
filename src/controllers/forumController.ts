import type { Request, Response, NextFunction } from 'express';
import * as forumService from '../services/forumService';
import { HttpError } from '../middleware/errorHandler';

// ============================================
// Category Controllers
// ============================================

export async function getCategories(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const parentId = req.query.parentId as string | undefined;

    const categories = await forumService.getCategories({
      includeInactive,
      parentId: parentId || null,
    });

    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
}

export async function getCategoryBySlug(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const slug = req.params.slug!;
    const category = await forumService.getCategoryBySlug(slug);

    if (!category) {
      throw new HttpError(404, 'Category not found');
    }

    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { name, slug, description, icon, color, sortOrder, parentId } = req.body;

    const category = await forumService.createCategory({
      name,
      slug,
      description,
      icon,
      color,
      sortOrder,
      parentId,
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
}

export async function updateCategory(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const { name, slug, description, icon, color, sortOrder, isActive, parentId } = req.body;

    const category = await forumService.updateCategory(id, {
      name,
      slug,
      description,
      icon,
      color,
      sortOrder,
      isActive,
      parentId,
    });

    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    await forumService.deleteCategory(id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Topic Controllers
// ============================================

export async function getTopics(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const {
      categoryId,
      authorId,
      isPinned,
      isLocked,
      isFeatured,
      tagIds,
      search,
      page,
      limit,
      sortField,
      sortOrder,
    } = req.query;

    const result = await forumService.getTopics(
      {
        categoryId: categoryId as string,
        authorId: authorId as string,
        isPinned: isPinned === 'true' ? true : isPinned === 'false' ? false : undefined,
        isLocked: isLocked === 'true' ? true : isLocked === 'false' ? false : undefined,
        isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
        tagIds: tagIds ? (tagIds as string).split(',') : undefined,
        search: search as string,
      },
      {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      },
      {
        field: sortField as string,
        order: sortOrder as 'asc' | 'desc',
      },
    );

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getTopicById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const topic = await forumService.getTopicById(id, true);

    if (!topic) {
      throw new HttpError(404, 'Topic not found');
    }

    // Check if user is following
    const userId = (req as any).user?.userId;
    let isFollowing = false;
    if (userId) {
      isFollowing = await forumService.isFollowingTopic(id, userId);
    }

    res.json({ success: true, data: { ...topic, isFollowing } });
  } catch (error) {
    next(error);
  }
}

export async function getTopicBySlug(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const slug = req.params.slug!;
    const topic = await forumService.getTopicBySlug(slug, true);

    if (!topic) {
      throw new HttpError(404, 'Topic not found');
    }

    // Check if user is following
    const userId = (req as any).user?.userId;
    let isFollowing = false;
    if (userId) {
      isFollowing = await forumService.isFollowingTopic(topic.id, userId);
    }

    res.json({ success: true, data: { ...topic, isFollowing } });
  } catch (error) {
    next(error);
  }
}

export async function createTopic(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user.userId;
    const { title, slug, content, categoryId, tagIds } = req.body;

    const topic = await forumService.createTopic({
      title,
      slug,
      content,
      categoryId,
      authorId: userId,
      tagIds,
    });

    res.status(201).json({ success: true, data: topic });
  } catch (error) {
    next(error);
  }
}

export async function updateTopic(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    // Check ownership or admin
    const existingTopic = await forumService.getTopicById(id);
    if (!existingTopic) {
      throw new HttpError(404, 'Topic not found');
    }

    if (existingTopic.authorId !== userId && userRole !== 'ADMIN') {
      throw new HttpError(403, 'Not authorized to update this topic');
    }

    const { title, slug, content, categoryId, isPinned, isLocked, isFeatured, tagIds } = req.body;

    // Only admins can change pin/lock/featured status
    const updateData: any = { title, slug, content, categoryId, tagIds };
    if (userRole === 'ADMIN') {
      if (isPinned !== undefined) updateData.isPinned = isPinned;
      if (isLocked !== undefined) updateData.isLocked = isLocked;
      if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    }

    const topic = await forumService.updateTopic(id, updateData);
    res.json({ success: true, data: topic });
  } catch (error) {
    next(error);
  }
}

export async function deleteTopic(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    // Check ownership or admin
    const existingTopic = await forumService.getTopicById(id);
    if (!existingTopic) {
      throw new HttpError(404, 'Topic not found');
    }

    if (existingTopic.authorId !== userId && userRole !== 'ADMIN') {
      throw new HttpError(403, 'Not authorized to delete this topic');
    }

    await forumService.deleteTopic(id);
    res.json({ success: true, message: 'Topic deleted' });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Post Controllers
// ============================================

export async function getPostsByTopic(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const topicId = req.params.topicId!;
    const { page, limit } = req.query;

    const result = await forumService.getPostsByTopic(topicId, {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function createPost(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const topicId = req.params.topicId!;
    const userId = (req as any).user.userId;
    const { content, parentId } = req.body;

    // Check if topic exists and is not locked
    const topic = await forumService.getTopicById(topicId);
    if (!topic) {
      throw new HttpError(404, 'Topic not found');
    }
    if (topic.isLocked) {
      throw new HttpError(403, 'Topic is locked');
    }

    const post = await forumService.createPost({
      content,
      topicId,
      authorId: userId,
      parentId,
    });

    res.status(201).json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
}

export async function updatePost(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const { content } = req.body;

    // Get the post to check ownership
    const existingPost = await forumService.getPostsByTopic('dummy'); // We need a getPostById function
    // For simplicity, we'll use prisma directly here
    const { prisma } = await import('../utils/database');
    const post = await prisma.forumPost.findUnique({ where: { id } });

    if (!post) {
      throw new HttpError(404, 'Post not found');
    }

    if (post.authorId !== userId && userRole !== 'ADMIN') {
      throw new HttpError(403, 'Not authorized to update this post');
    }

    const updatedPost = await forumService.updatePost(id, { content });
    res.json({ success: true, data: updatedPost });
  } catch (error) {
    next(error);
  }
}

export async function deletePost(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    const { prisma } = await import('../utils/database');
    const post = await prisma.forumPost.findUnique({ where: { id } });

    if (!post) {
      throw new HttpError(404, 'Post not found');
    }

    if (post.authorId !== userId && userRole !== 'ADMIN') {
      throw new HttpError(403, 'Not authorized to delete this post');
    }

    await forumService.deletePost(id);
    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    next(error);
  }
}

export async function markPostAsAccepted(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const topicId = req.params.topicId!;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    // Only topic author or admin can mark as accepted
    const topic = await forumService.getTopicById(topicId);
    if (!topic) {
      throw new HttpError(404, 'Topic not found');
    }

    if (topic.authorId !== userId && userRole !== 'ADMIN') {
      throw new HttpError(403, 'Only topic author can mark answer as accepted');
    }

    const post = await forumService.markPostAsAccepted(id, topicId);
    res.json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Like Controllers
// ============================================

export async function likePost(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const userId = (req as any).user.userId;

    const result = await forumService.likePost(id, userId);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function unlikePost(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const userId = (req as any).user.userId;

    const result = await forumService.unlikePost(id, userId);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Tag Controllers
// ============================================

export async function getTags(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const tags = await forumService.getTags();
    res.json({ success: true, data: tags });
  } catch (error) {
    next(error);
  }
}

export async function createTag(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { name, slug, color } = req.body;
    const tag = await forumService.createTag({ name, slug, color });
    res.status(201).json({ success: true, data: tag });
  } catch (error) {
    next(error);
  }
}

export async function deleteTag(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    await forumService.deleteTag(id);
    res.json({ success: true, message: 'Tag deleted' });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Follow Controllers
// ============================================

export async function followTopic(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const userId = (req as any).user.userId;

    const result = await forumService.followTopic(id, userId);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function unfollowTopic(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id!;
    const userId = (req as any).user.userId;

    const result = await forumService.unfollowTopic(id, userId);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Stats Controllers
// ============================================

export async function getForumStats(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const stats = await forumService.getForumStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}
