import { Request, Response, NextFunction } from 'express';
import * as faqService from '../../services/cms/faqService';

// ============================================
// FAQ Categories
// ============================================

export async function getFaqCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const includeItems = req.query.includeItems === 'true';
    const categories = await faqService.getFaqCategories(includeItems);
    res.json({ success: true, categories });
  } catch (error) {
    next(error);
  }
}

export async function getFaqCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await faqService.getFaqCategory(req.params.id!);
    res.json({ success: true, category });
  } catch (error) {
    next(error);
  }
}

export async function createFaqCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await faqService.createFaqCategory(req.body);
    res.status(201).json({ success: true, category });
  } catch (error) {
    next(error);
  }
}

export async function updateFaqCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await faqService.updateFaqCategory(req.params.id!, req.body);
    res.json({ success: true, category });
  } catch (error) {
    next(error);
  }
}

export async function deleteFaqCategory(req: Request, res: Response, next: NextFunction) {
  try {
    await faqService.deleteFaqCategory(req.params.id!);
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
}

export async function reorderFaqCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const { categoryIds } = req.body;
    await faqService.reorderFaqCategories(categoryIds);
    res.json({ success: true, message: 'Categories reordered' });
  } catch (error) {
    next(error);
  }
}

// ============================================
// FAQ Items
// ============================================

export async function getFaqItems(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await faqService.getFaqItems({
      categoryId: req.query.categoryId as string | undefined,
      isPublished: req.query.isPublished === 'true' ? true : req.query.isPublished === 'false' ? false : undefined,
      search: req.query.search as string | undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getFaqItem(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await faqService.getFaqItem(req.params.id!);
    res.json({ success: true, item });
  } catch (error) {
    next(error);
  }
}

export async function createFaqItem(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await faqService.createFaqItem(req.body);
    res.status(201).json({ success: true, item });
  } catch (error) {
    next(error);
  }
}

export async function updateFaqItem(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await faqService.updateFaqItem(req.params.id!, req.body);
    res.json({ success: true, item });
  } catch (error) {
    next(error);
  }
}

export async function deleteFaqItem(req: Request, res: Response, next: NextFunction) {
  try {
    await faqService.deleteFaqItem(req.params.id!);
    res.json({ success: true, message: 'FAQ item deleted' });
  } catch (error) {
    next(error);
  }
}

export async function toggleFaqItemStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await faqService.toggleFaqItemStatus(req.params.id!);
    res.json({ success: true, item });
  } catch (error) {
    next(error);
  }
}

export async function reorderFaqItems(req: Request, res: Response, next: NextFunction) {
  try {
    const { itemIds } = req.body;
    await faqService.reorderFaqItems(itemIds);
    res.json({ success: true, message: 'Items reordered' });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Public FAQ API
// ============================================

export async function getPublicFaqs(req: Request, res: Response, next: NextFunction) {
  try {
    const faqs = await faqService.getPublicFaqs(req.query.category as string | undefined);
    res.json({ success: true, faqs });
  } catch (error) {
    next(error);
  }
}

export async function searchFaqs(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.json({ success: true, results: [] });
    }
    const results = await faqService.searchFaqs(query);
    res.json({ success: true, results });
  } catch (error) {
    next(error);
  }
}
