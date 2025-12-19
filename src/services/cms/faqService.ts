import { prisma } from '../../utils/database';
import { Prisma } from '@prisma/client';
import { HttpError } from '../../middleware/errorHandler';

// ============================================
// FAQ Categories
// ============================================

export async function getFaqCategories(includeItems = false) {
  if (includeItems) {
    return prisma.faq_categories.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        faq_items: {
          where: { isPublished: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  return prisma.faq_categories.findMany({
    orderBy: { sortOrder: 'asc' },
  });
}

export async function getFaqCategory(categoryId: string) {
  const category = await prisma.faq_categories.findUnique({
    where: { id: categoryId },
    include: {
      faq_items: { orderBy: { sortOrder: 'asc' } },
    },
  });

  if (!category) throw new HttpError(404, 'FAQ category not found');
  return category;
}

export async function createFaqCategory(data: {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
}) {
  const existing = await prisma.faq_categories.findUnique({ where: { slug: data.slug } });
  if (existing) throw new HttpError(400, 'FAQ category with this slug already exists');

  return prisma.faq_categories.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      icon: data.icon,
      sortOrder: data.sortOrder ?? 0,
      isActive: true,
    },
  });
}

export async function updateFaqCategory(
  categoryId: string,
  data: {
    name?: string;
    slug?: string;
    description?: string;
    icon?: string;
    sortOrder?: number;
    isActive?: boolean;
  }
) {
  const category = await prisma.faq_categories.findUnique({ where: { id: categoryId } });
  if (!category) throw new HttpError(404, 'FAQ category not found');

  if (data.slug && data.slug !== category.slug) {
    const existing = await prisma.faq_categories.findUnique({ where: { slug: data.slug } });
    if (existing) throw new HttpError(400, 'FAQ category with this slug already exists');
  }

  return prisma.faq_categories.update({
    where: { id: categoryId },
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      icon: data.icon,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    },
  });
}

export async function deleteFaqCategory(categoryId: string) {
  const category = await prisma.faq_categories.findUnique({
    where: { id: categoryId },
    include: { faq_items: { select: { id: true } } },
  });

  if (!category) throw new HttpError(404, 'FAQ category not found');
  if (category.faq_items.length > 0) {
    throw new HttpError(400, 'Category must be empty before deletion');
  }

  await prisma.faq_categories.delete({ where: { id: categoryId } });
  return { deleted: true };
}

export async function reorderFaqCategories(categoryIds: string[]) {
  const updates = categoryIds.map((id, index) =>
    prisma.faq_categories.update({
      where: { id },
      data: { sortOrder: index },
    })
  );

  await prisma.$transaction(updates);
  return { success: true };
}

// ============================================
// FAQ Items
// ============================================

export interface FaqItemFilters {
  categoryId?: string;
  isPublished?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getFaqItems(filters: FaqItemFilters) {
  const { categoryId, isPublished, search, page = 1, limit = 20 } = filters;

  const where: Prisma.faq_itemsWhereInput = {};
  if (categoryId) where.categoryId = categoryId;
  if (isPublished !== undefined) where.isPublished = isPublished;
  if (search) {
    where.OR = [
      { question: { contains: search, mode: 'insensitive' } },
      { answer: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.faq_items.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        faq_categories: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.faq_items.count({ where }),
  ]);

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getFaqItem(itemId: string) {
  const item = await prisma.faq_items.findUnique({
    where: { id: itemId },
    include: {
      faq_categories: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!item) throw new HttpError(404, 'FAQ item not found');
  return item;
}

export async function createFaqItem(data: {
  question: string;
  answer: string;
  categoryId: string;
  sortOrder?: number;
}) {
  const category = await prisma.faq_categories.findUnique({ where: { id: data.categoryId } });
  if (!category) throw new HttpError(404, 'FAQ category not found');

  return prisma.faq_items.create({
    data: {
      question: data.question,
      answer: data.answer,
      categoryId: data.categoryId,
      sortOrder: data.sortOrder ?? 0,
      isPublished: true,
    },
    include: {
      faq_categories: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function updateFaqItem(
  itemId: string,
  data: {
    question?: string;
    answer?: string;
    categoryId?: string;
    sortOrder?: number;
    isPublished?: boolean;
  }
) {
  const item = await prisma.faq_items.findUnique({ where: { id: itemId } });
  if (!item) throw new HttpError(404, 'FAQ item not found');

  if (data.categoryId) {
    const category = await prisma.faq_categories.findUnique({ where: { id: data.categoryId } });
    if (!category) throw new HttpError(404, 'FAQ category not found');
  }

  return prisma.faq_items.update({
    where: { id: itemId },
    data: {
      question: data.question,
      answer: data.answer,
      categoryId: data.categoryId,
      sortOrder: data.sortOrder,
      isPublished: data.isPublished,
    },
    include: {
      faq_categories: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function deleteFaqItem(itemId: string) {
  const item = await prisma.faq_items.findUnique({ where: { id: itemId } });
  if (!item) throw new HttpError(404, 'FAQ item not found');

  await prisma.faq_items.delete({ where: { id: itemId } });
  return { deleted: true };
}

export async function toggleFaqItemStatus(itemId: string) {
  const item = await prisma.faq_items.findUnique({ where: { id: itemId } });
  if (!item) throw new HttpError(404, 'FAQ item not found');

  return prisma.faq_items.update({
    where: { id: itemId },
    data: { isPublished: !item.isPublished },
  });
}

export async function reorderFaqItems(itemIds: string[]) {
  const updates = itemIds.map((id, index) =>
    prisma.faq_items.update({
      where: { id },
      data: { sortOrder: index },
    })
  );

  await prisma.$transaction(updates);
  return { success: true };
}

// ============================================
// Public FAQ API
// ============================================

export async function getPublicFaqs(categorySlug?: string) {
  const where: Prisma.faq_categoriesWhereInput = { isActive: true };
  if (categorySlug) where.slug = categorySlug;

  return prisma.faq_categories.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      icon: true,
      faq_items: {
        where: { isPublished: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          question: true,
          answer: true,
        },
      },
    },
  });
}

export async function searchFaqs(query: string) {
  return prisma.faq_items.findMany({
    where: {
      isPublished: true,
      faq_categories: { isActive: true },
      OR: [
        { question: { contains: query, mode: 'insensitive' } },
        { answer: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      question: true,
      answer: true,
      faq_categories: { select: { name: true, slug: true } },
    },
    take: 20,
  });
}

export async function markFaqHelpful(itemId: string, helpful: boolean) {
  const item = await prisma.faq_items.findUnique({ where: { id: itemId } });
  if (!item) throw new HttpError(404, 'FAQ item not found');

  return prisma.faq_items.update({
    where: { id: itemId },
    data: helpful ? { helpfulYes: { increment: 1 } } : { helpfulNo: { increment: 1 } },
  });
}
