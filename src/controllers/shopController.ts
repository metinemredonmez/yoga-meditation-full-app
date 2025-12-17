import { Request, Response, NextFunction } from 'express';
import * as shopService from '../services/shopService';
import { HttpError } from '../middleware/errorHandler';

// ============================================
// Shop Items
// ============================================

export async function getShopItems(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const { type, available } = req.query;

    const items = await shopService.getShopItems(userId, {
      type: type as any,
      available: available !== 'false',
    });

    res.json({
      success: true,
      items,
    });
  } catch (error) {
    next(error);
  }
}

export async function getShopItemById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id!;
    const item = await shopService.getShopItemById(id);

    if (!item) {
      throw new HttpError(404, 'Item not found');
    }

    res.json({
      success: true,
      item,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Purchase
// ============================================

export async function purchaseItem(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const itemId = req.params.itemId!;

    const result = await shopService.purchaseItem(userId, itemId);

    if (!result.success) {
      throw new HttpError(400, result.message || 'Purchase failed');
    }

    res.json({
      success: true,
      message: 'Item purchased successfully',
      purchase: result.purchase,
      newXPBalance: result.newXPBalance,
    });
  } catch (error) {
    next(error);
  }
}

export async function usePurchase(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const purchaseId = req.params.id!;

    const result = await shopService.usePurchase(userId, purchaseId);

    if (!result.success) {
      throw new HttpError(400, result.message || 'Failed to use item');
    }

    res.json({
      success: true,
      message: 'Item used successfully',
      itemType: result.itemType,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Purchase History
// ============================================

export async function getPurchaseHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { page, limit } = req.query;

    const result = await shopService.getPurchaseHistory(userId, {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUnusedPurchases(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const purchases = await shopService.getUnusedPurchases(userId);

    res.json({
      success: true,
      purchases,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Admin Functions
// ============================================

export async function createShopItem(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await shopService.createShopItem(req.body);

    res.status(201).json({
      success: true,
      item,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateShopItem(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id!;
    const item = await shopService.updateShopItem(id, req.body);

    res.json({
      success: true,
      item,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteShopItem(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id!;
    await shopService.deleteShopItem(id);

    res.json({
      success: true,
      message: 'Item deleted',
    });
  } catch (error) {
    next(error);
  }
}

export async function getShopStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await shopService.getShopStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
}
