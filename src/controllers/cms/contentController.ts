import { Request, Response, NextFunction } from 'express';
import * as contentService from '../../services/cms/contentService';
import { ContentType, ContentStatus } from '@prisma/client';

// ============================================
// Content
// ============================================

export async function getContents(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await contentService.getContents({
      type: req.query.type as ContentType | undefined,
      status: req.query.status as ContentStatus | undefined,
      categoryId: req.query.categoryId as string | undefined,
      authorId: req.query.authorId as string | undefined,
      search: req.query.search as string | undefined,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      isPublic: req.query.isPublic === 'true' ? true : req.query.isPublic === 'false' ? false : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getContent(req: Request, res: Response, next: NextFunction) {
  try {
    const content = await contentService.getContent(req.params.id!);
    res.json({ success: true, content });
  } catch (error) {
    next(error);
  }
}

export async function getContentBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const content = await contentService.getContentBySlug(req.params.slug!);
    res.json({ success: true, content });
  } catch (error) {
    next(error);
  }
}

export async function createContent(req: Request, res: Response, next: NextFunction) {
  try {
    const authorId = req.user!.id;
    const content = await contentService.createContent(authorId, req.body);
    res.status(201).json({ success: true, content });
  } catch (error) {
    next(error);
  }
}

export async function updateContent(req: Request, res: Response, next: NextFunction) {
  try {
    const content = await contentService.updateContent(req.params.id!, req.body);
    res.json({ success: true, content });
  } catch (error) {
    next(error);
  }
}

export async function updateContentStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = req.body;
    const content = await contentService.updateContentStatus(req.params.id!, status);
    res.json({ success: true, content });
  } catch (error) {
    next(error);
  }
}

export async function deleteContent(req: Request, res: Response, next: NextFunction) {
  try {
    await contentService.deleteContent(req.params.id!);
    res.json({ success: true, message: 'Content deleted' });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Content Versions
// ============================================

export async function createContentVersion(req: Request, res: Response, next: NextFunction) {
  try {
    const createdById = req.user!.id;
    const { changeNote } = req.body;
    const version = await contentService.createContentVersion(req.params.contentId!, createdById, changeNote);
    res.status(201).json({ success: true, version });
  } catch (error) {
    next(error);
  }
}

export async function getContentVersions(req: Request, res: Response, next: NextFunction) {
  try {
    const versions = await contentService.getContentVersions(req.params.contentId!);
    res.json({ success: true, versions });
  } catch (error) {
    next(error);
  }
}

export async function getContentVersion(req: Request, res: Response, next: NextFunction) {
  try {
    const version = await contentService.getContentVersion(req.params.versionId!);
    res.json({ success: true, version });
  } catch (error) {
    next(error);
  }
}

export async function restoreContentVersion(req: Request, res: Response, next: NextFunction) {
  try {
    const content = await contentService.restoreContentVersion(req.params.versionId!);
    res.json({ success: true, content });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Categories
// ============================================

export async function getCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const parentId = req.query.parentId as string | undefined;
    const categories = await contentService.getCategories(parentId === 'null' ? null : parentId);
    res.json({ success: true, categories });
  } catch (error) {
    next(error);
  }
}

export async function getCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await contentService.getCategory(req.params.id!);
    res.json({ success: true, category });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await contentService.createCategory(req.body);
    res.status(201).json({ success: true, category });
  } catch (error) {
    next(error);
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await contentService.updateCategory(req.params.id!, req.body);
    res.json({ success: true, category });
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    await contentService.deleteCategory(req.params.id!);
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Tags
// ============================================

export async function getTags(req: Request, res: Response, next: NextFunction) {
  try {
    const tags = await contentService.getTags(req.query.search as string | undefined);
    res.json({ success: true, tags });
  } catch (error) {
    next(error);
  }
}

export async function getTag(req: Request, res: Response, next: NextFunction) {
  try {
    const tag = await contentService.getTag(req.params.id!);
    res.json({ success: true, tag });
  } catch (error) {
    next(error);
  }
}

export async function createTag(req: Request, res: Response, next: NextFunction) {
  try {
    const tag = await contentService.createTag(req.body);
    res.status(201).json({ success: true, tag });
  } catch (error) {
    next(error);
  }
}

export async function updateTag(req: Request, res: Response, next: NextFunction) {
  try {
    const tag = await contentService.updateTag(req.params.id!, req.body);
    res.json({ success: true, tag });
  } catch (error) {
    next(error);
  }
}

export async function deleteTag(req: Request, res: Response, next: NextFunction) {
  try {
    await contentService.deleteTag(req.params.id!);
    res.json({ success: true, message: 'Tag deleted' });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Templates
// ============================================

export async function getTemplates(req: Request, res: Response, next: NextFunction) {
  try {
    const templates = await contentService.getTemplates(req.query.type as ContentType | undefined);
    res.json({ success: true, templates });
  } catch (error) {
    next(error);
  }
}

export async function getTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const template = await contentService.getTemplate(req.params.id!);
    res.json({ success: true, template });
  } catch (error) {
    next(error);
  }
}

export async function createTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const createdById = req.user!.id;
    const template = await contentService.createTemplate(createdById, req.body);
    res.status(201).json({ success: true, template });
  } catch (error) {
    next(error);
  }
}

export async function updateTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const template = await contentService.updateTemplate(req.params.id!, req.body);
    res.json({ success: true, template });
  } catch (error) {
    next(error);
  }
}

export async function deleteTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    await contentService.deleteTemplate(req.params.id!);
    res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Public Content API
// ============================================

export async function getPublishedContents(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await contentService.getPublishedContents({
      type: req.query.type as ContentType | undefined,
      categorySlug: req.query.category as string | undefined,
      tagSlug: req.query.tag as string | undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getPublishedContent(req: Request, res: Response, next: NextFunction) {
  try {
    const content = await contentService.getPublishedContent(req.params.slug!);
    res.json({ success: true, content });
  } catch (error) {
    next(error);
  }
}
