import { prisma } from '../../utils/database';
import { Prisma } from '@prisma/client';
import { HttpError } from '../../middleware/errorHandler';

// ============================================
// FAQ Categories
// ============================================

export async function getFaqCategories(includeItems = false) {
  if (includeItems) {
    return prisma.faqCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        faqs: {
          where: { isPublished: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  return prisma.faqCategory.findMany({
    orderBy: { sortOrder: 'asc' },
  });
}

export async function getFaqCategory(categoryId: string) {
  const category = await prisma.faqCategory.findUnique({
    where: { id: categoryId },
    include: {
      faqs: { orderBy: { sortOrder: 'asc' } },
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
  const existing = await prisma.faqCategory.findUnique({ where: { slug: data.slug } });
  if (existing) throw new HttpError(400, 'FAQ category with this slug already exists');

  return prisma.faqCategory.create({
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
  const category = await prisma.faqCategory.findUnique({ where: { id: categoryId } });
  if (!category) throw new HttpError(404, 'FAQ category not found');

  if (data.slug && data.slug !== category.slug) {
    const existing = await prisma.faqCategory.findUnique({ where: { slug: data.slug } });
    if (existing) throw new HttpError(400, 'FAQ category with this slug already exists');
  }

  return prisma.faqCategory.update({
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
  const category = await prisma.faqCategory.findUnique({
    where: { id: categoryId },
    include: { faqs: { select: { id: true } } },
  });

  if (!category) throw new HttpError(404, 'FAQ category not found');
  if (category.faqs.length > 0) {
    throw new HttpError(400, 'Category must be empty before deletion');
  }

  await prisma.faqCategory.delete({ where: { id: categoryId } });
  return { deleted: true };
}

export async function reorderFaqCategories(categoryIds: string[]) {
  const updates = categoryIds.map((id, index) =>
    prisma.faqCategory.update({
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

  const where: Prisma.FaqItemWhereInput = {};
  if (categoryId) where.categoryId = categoryId;
  if (isPublished !== undefined) where.isPublished = isPublished;
  if (search) {
    where.OR = [
      { question: { contains: search, mode: 'insensitive' } },
      { answer: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.faqItem.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.faqItem.count({ where }),
  ]);

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getFaqItem(itemId: string) {
  const item = await prisma.faqItem.findUnique({
    where: { id: itemId },
    include: {
      category: { select: { id: true, name: true, slug: true } },
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
  const category = await prisma.faqCategory.findUnique({ where: { id: data.categoryId } });
  if (!category) throw new HttpError(404, 'FAQ category not found');

  return prisma.faqItem.create({
    data: {
      question: data.question,
      answer: data.answer,
      categoryId: data.categoryId,
      sortOrder: data.sortOrder ?? 0,
      isPublished: true,
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
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
  const item = await prisma.faqItem.findUnique({ where: { id: itemId } });
  if (!item) throw new HttpError(404, 'FAQ item not found');

  if (data.categoryId) {
    const category = await prisma.faqCategory.findUnique({ where: { id: data.categoryId } });
    if (!category) throw new HttpError(404, 'FAQ category not found');
  }

  return prisma.faqItem.update({
    where: { id: itemId },
    data: {
      question: data.question,
      answer: data.answer,
      categoryId: data.categoryId,
      sortOrder: data.sortOrder,
      isPublished: data.isPublished,
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function deleteFaqItem(itemId: string) {
  const item = await prisma.faqItem.findUnique({ where: { id: itemId } });
  if (!item) throw new HttpError(404, 'FAQ item not found');

  await prisma.faqItem.delete({ where: { id: itemId } });
  return { deleted: true };
}

export async function toggleFaqItemStatus(itemId: string) {
  const item = await prisma.faqItem.findUnique({ where: { id: itemId } });
  if (!item) throw new HttpError(404, 'FAQ item not found');

  return prisma.faqItem.update({
    where: { id: itemId },
    data: { isPublished: !item.isPublished },
  });
}

export async function reorderFaqItems(itemIds: string[]) {
  const updates = itemIds.map((id, index) =>
    prisma.faqItem.update({
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
  const where: Prisma.FaqCategoryWhereInput = { isActive: true };
  if (categorySlug) where.slug = categorySlug;

  return prisma.faqCategory.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      icon: true,
      faqs: {
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
  return prisma.faqItem.findMany({
    where: {
      isPublished: true,
      category: { isActive: true },
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
      category: { select: { name: true, slug: true } },
    },
    take: 20,
  });
}

export async function markFaqHelpful(itemId: string, helpful: boolean) {
  const item = await prisma.faqItem.findUnique({ where: { id: itemId } });
  if (!item) throw new HttpError(404, 'FAQ item not found');

  return prisma.faqItem.update({
    where: { id: itemId },
    data: helpful ? { helpfulYes: { increment: 1 } } : { helpfulNo: { increment: 1 } },
  });
}
