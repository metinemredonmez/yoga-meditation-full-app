import { prisma } from '../../utils/database';
import { ContentStatus, ContentType, Prisma } from '@prisma/client';
import { HttpError } from '../../middleware/errorHandler';

// ============================================
// Content
// ============================================

export interface ContentFilters {
  type?: ContentType;
  status?: ContentStatus;
  categoryId?: string;
  authorId?: string;
  search?: string;
  tags?: string[];
  isPublic?: boolean;
  page?: number;
  limit?: number;
}

export async function getContents(filters: ContentFilters) {
  const { type, status, categoryId, authorId, search, tags, isPublic, page = 1, limit = 20 } = filters;

  const where: Prisma.ContentWhereInput = {};
  if (type) where.type = type;
  if (status) where.status = status;
  if (categoryId) where.categoryId = categoryId;
  if (authorId) where.authorId = authorId;
  if (isPublic !== undefined) where.isPublic = isPublic;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { excerpt: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (tags && tags.length > 0) {
    where.tags = { some: { slug: { in: tags } } };
  }

  const [contents, total] = await Promise.all([
    prisma.content.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        tags: { select: { id: true, name: true, slug: true } },
        _count: { select: { versions: true } },
      },
    }),
    prisma.content.count({ where }),
  ]);

  return {
    contents,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getContent(contentId: string) {
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      tags: { select: { id: true, name: true, slug: true } },
      versions: {
        orderBy: { version: 'desc' },
        take: 10,
        select: { id: true, version: true, createdAt: true, authorId: true },
      },
    },
  });

  if (!content) throw new HttpError(404, 'Content not found');
  return content;
}

export async function getContentBySlug(slug: string) {
  const content = await prisma.content.findUnique({
    where: { slug },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      tags: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!content) throw new HttpError(404, 'Content not found');
  return content;
}

export async function createContent(
  authorId: string,
  data: {
    title: string;
    slug: string;
    type: ContentType;
    excerpt?: string;
    body: string;
    bodyJson?: object;
    categoryId?: string;
    tagIds?: string[];
    featuredImageId?: string;
    isPublic?: boolean;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
  }
) {
  const existing = await prisma.content.findUnique({ where: { slug: data.slug } });
  if (existing) throw new HttpError(400, 'Content with this slug already exists');

  return prisma.content.create({
    data: {
      title: data.title,
      slug: data.slug,
      type: data.type,
      excerpt: data.excerpt,
      body: data.body,
      bodyJson: data.bodyJson as Prisma.InputJsonValue,
      status: 'DRAFT',
      categoryId: data.categoryId,
      featuredImageId: data.featuredImageId,
      isPublic: data.isPublic ?? true,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      metaKeywords: data.metaKeywords || [],
      authorId,
      tags: data.tagIds ? { connect: data.tagIds.map((id) => ({ id })) } : undefined,
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      tags: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function updateContent(
  contentId: string,
  data: {
    title?: string;
    slug?: string;
    excerpt?: string;
    body?: string;
    bodyJson?: object;
    categoryId?: string | null;
    tagIds?: string[];
    featuredImageId?: string | null;
    isPublic?: boolean;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
  }
) {
  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content) throw new HttpError(404, 'Content not found');

  if (data.slug && data.slug !== content.slug) {
    const existing = await prisma.content.findUnique({ where: { slug: data.slug } });
    if (existing) throw new HttpError(400, 'Content with this slug already exists');
  }

  return prisma.content.update({
    where: { id: contentId },
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      body: data.body,
      bodyJson: data.bodyJson as Prisma.InputJsonValue,
      categoryId: data.categoryId,
      featuredImageId: data.featuredImageId,
      isPublic: data.isPublic,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      metaKeywords: data.metaKeywords,
      tags: data.tagIds ? { set: data.tagIds.map((id) => ({ id })) } : undefined,
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      tags: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function updateContentStatus(contentId: string, status: ContentStatus) {
  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content) throw new HttpError(404, 'Content not found');

  const updateData: Prisma.ContentUpdateInput = { status };

  if (status === 'PUBLISHED' && !content.publishedAt) {
    updateData.publishedAt = new Date();
  }

  return prisma.content.update({
    where: { id: contentId },
    data: updateData,
  });
}

export async function deleteContent(contentId: string) {
  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content) throw new HttpError(404, 'Content not found');

  await prisma.content.delete({ where: { id: contentId } });
  return { deleted: true };
}

// ============================================
// Content Versions
// ============================================

export async function createContentVersion(contentId: string, authorId: string, changeNote?: string) {
  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content) throw new HttpError(404, 'Content not found');

  const lastVersion = await prisma.contentVersion.findFirst({
    where: { contentId },
    orderBy: { version: 'desc' },
  });

  const newVersion = (lastVersion?.version || 0) + 1;

  return prisma.contentVersion.create({
    data: {
      contentId,
      version: newVersion,
      title: content.title,
      body: content.body,
      bodyJson: content.bodyJson as Prisma.InputJsonValue,
      changeNote,
      authorId,
    },
  });
}

export async function getContentVersions(contentId: string) {
  return prisma.contentVersion.findMany({
    where: { contentId },
    orderBy: { version: 'desc' },
  });
}

export async function getContentVersion(versionId: string) {
  const version = await prisma.contentVersion.findUnique({
    where: { id: versionId },
    include: {
      content: { select: { id: true, title: true, slug: true } },
    },
  });

  if (!version) throw new HttpError(404, 'Content version not found');
  return version;
}

export async function restoreContentVersion(versionId: string) {
  const version = await prisma.contentVersion.findUnique({
    where: { id: versionId },
    include: { content: true },
  });

  if (!version) throw new HttpError(404, 'Content version not found');

  return prisma.content.update({
    where: { id: version.contentId },
    data: {
      title: version.title,
      body: version.body,
      bodyJson: version.bodyJson as Prisma.InputJsonValue,
    },
  });
}

// ============================================
// Content Categories
// ============================================

export async function getCategories(parentId?: string | null) {
  const where: Prisma.ContentCategoryWhereInput = {};
  if (parentId !== undefined) where.parentId = parentId;

  return prisma.contentCategory.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
    include: {
      parent: { select: { id: true, name: true, slug: true } },
      _count: { select: { contents: true, children: true } },
    },
  });
}

export async function getCategory(categoryId: string) {
  const category = await prisma.contentCategory.findUnique({
    where: { id: categoryId },
    include: {
      parent: { select: { id: true, name: true, slug: true } },
      children: { select: { id: true, name: true, slug: true } },
      _count: { select: { contents: true } },
    },
  });

  if (!category) throw new HttpError(404, 'Category not found');
  return category;
}

export async function createCategory(data: {
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  sortOrder?: number;
}) {
  const existing = await prisma.contentCategory.findUnique({ where: { slug: data.slug } });
  if (existing) throw new HttpError(400, 'Category with this slug already exists');

  return prisma.contentCategory.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      parentId: data.parentId,
      sortOrder: data.sortOrder ?? 0,
    },
  });
}

export async function updateCategory(
  categoryId: string,
  data: {
    name?: string;
    slug?: string;
    description?: string;
    parentId?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  }
) {
  const category = await prisma.contentCategory.findUnique({ where: { id: categoryId } });
  if (!category) throw new HttpError(404, 'Category not found');

  if (data.slug && data.slug !== category.slug) {
    const existing = await prisma.contentCategory.findUnique({ where: { slug: data.slug } });
    if (existing) throw new HttpError(400, 'Category with this slug already exists');
  }

  if (data.parentId === categoryId) {
    throw new HttpError(400, 'Category cannot be its own parent');
  }

  return prisma.contentCategory.update({
    where: { id: categoryId },
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      parentId: data.parentId,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    },
  });
}

export async function deleteCategory(categoryId: string) {
  const category = await prisma.contentCategory.findUnique({
    where: { id: categoryId },
    include: { _count: { select: { contents: true, children: true } } },
  });

  if (!category) throw new HttpError(404, 'Category not found');
  if (category._count.contents > 0 || category._count.children > 0) {
    throw new HttpError(400, 'Category must be empty before deletion');
  }

  await prisma.contentCategory.delete({ where: { id: categoryId } });
  return { deleted: true };
}

// ============================================
// Content Tags
// ============================================

export async function getTags(search?: string) {
  const where: Prisma.ContentTagWhereInput = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
    ];
  }

  return prisma.contentTag.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { contents: true } },
    },
  });
}

export async function getTag(tagId: string) {
  const tag = await prisma.contentTag.findUnique({
    where: { id: tagId },
    include: {
      _count: { select: { contents: true } },
    },
  });

  if (!tag) throw new HttpError(404, 'Tag not found');
  return tag;
}

export async function createTag(data: { name: string; slug: string; color?: string }) {
  const existing = await prisma.contentTag.findUnique({ where: { slug: data.slug } });
  if (existing) throw new HttpError(400, 'Tag with this slug already exists');

  return prisma.contentTag.create({
    data: {
      name: data.name,
      slug: data.slug,
      color: data.color,
    },
  });
}

export async function updateTag(tagId: string, data: { name?: string; slug?: string; color?: string }) {
  const tag = await prisma.contentTag.findUnique({ where: { id: tagId } });
  if (!tag) throw new HttpError(404, 'Tag not found');

  if (data.slug && data.slug !== tag.slug) {
    const existing = await prisma.contentTag.findUnique({ where: { slug: data.slug } });
    if (existing) throw new HttpError(400, 'Tag with this slug already exists');
  }

  return prisma.contentTag.update({
    where: { id: tagId },
    data: {
      name: data.name,
      slug: data.slug,
      color: data.color,
    },
  });
}

export async function deleteTag(tagId: string) {
  const tag = await prisma.contentTag.findUnique({ where: { id: tagId } });
  if (!tag) throw new HttpError(404, 'Tag not found');

  await prisma.contentTag.delete({ where: { id: tagId } });
  return { deleted: true };
}

// ============================================
// Content Templates
// ============================================

export async function getTemplates(type?: ContentType) {
  const where: Prisma.ContentTemplateWhereInput = {};
  if (type) where.type = type;

  return prisma.contentTemplate.findMany({
    where,
    orderBy: { name: 'asc' },
  });
}

export async function getTemplate(templateId: string) {
  const template = await prisma.contentTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) throw new HttpError(404, 'Template not found');
  return template;
}

export async function createTemplate(
  createdById: string,
  data: {
    name: string;
    slug: string;
    description?: string;
    type: ContentType;
    schema: object;
    defaultBody?: object;
  }
) {
  const existing = await prisma.contentTemplate.findUnique({ where: { slug: data.slug } });
  if (existing) throw new HttpError(400, 'Template with this slug already exists');

  return prisma.contentTemplate.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      type: data.type,
      schema: data.schema as Prisma.InputJsonValue,
      defaultBody: data.defaultBody as Prisma.InputJsonValue,
      createdById,
    },
  });
}

export async function updateTemplate(
  templateId: string,
  data: {
    name?: string;
    description?: string;
    schema?: object;
    defaultBody?: object;
    isActive?: boolean;
  }
) {
  const template = await prisma.contentTemplate.findUnique({ where: { id: templateId } });
  if (!template) throw new HttpError(404, 'Template not found');

  return prisma.contentTemplate.update({
    where: { id: templateId },
    data: {
      name: data.name,
      description: data.description,
      schema: data.schema as Prisma.InputJsonValue,
      defaultBody: data.defaultBody as Prisma.InputJsonValue,
      isActive: data.isActive,
    },
  });
}

export async function deleteTemplate(templateId: string) {
  const template = await prisma.contentTemplate.findUnique({ where: { id: templateId } });
  if (!template) throw new HttpError(404, 'Template not found');

  await prisma.contentTemplate.delete({ where: { id: templateId } });
  return { deleted: true };
}

// ============================================
// Public Content API
// ============================================

export async function getPublishedContents(filters: {
  type?: ContentType;
  categorySlug?: string;
  tagSlug?: string;
  page?: number;
  limit?: number;
}) {
  const { type, categorySlug, tagSlug, page = 1, limit = 20 } = filters;

  const where: Prisma.ContentWhereInput = {
    status: 'PUBLISHED',
    isPublic: true,
  };

  if (type) where.type = type;
  if (categorySlug) where.category = { slug: categorySlug };
  if (tagSlug) where.tags = { some: { slug: tagSlug } };

  const [contents, total] = await Promise.all([
    prisma.content.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        excerpt: true,
        publishedAt: true,
        authorId: true,
        category: { select: { name: true, slug: true } },
        tags: { select: { name: true, slug: true } },
        metaTitle: true,
        metaDescription: true,
      },
    }),
    prisma.content.count({ where }),
  ]);

  return {
    contents,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getPublishedContent(slug: string) {
  const content = await prisma.content.findFirst({
    where: { slug, status: 'PUBLISHED', isPublic: true },
    include: {
      category: { select: { name: true, slug: true } },
      tags: { select: { name: true, slug: true } },
    },
  });

  if (!content) throw new HttpError(404, 'Content not found');

  // Increment view count
  await prisma.content.update({
    where: { id: content.id },
    data: { viewCount: { increment: 1 } },
  });

  return content;
}
