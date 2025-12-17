import { Request, Response, NextFunction } from 'express';
import * as navigationService from '../../services/cms/navigationService';

// ============================================
// Navigation Menus
// ============================================

export async function getMenus(req: Request, res: Response, next: NextFunction) {
  try {
    const menus = await navigationService.getMenus();
    res.json({ success: true, menus });
  } catch (error) {
    next(error);
  }
}

export async function getMenu(req: Request, res: Response, next: NextFunction) {
  try {
    const menu = await navigationService.getMenu(req.params.id!);
    res.json({ success: true, menu });
  } catch (error) {
    next(error);
  }
}

export async function getMenuBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const menu = await navigationService.getMenuBySlug(req.params.slug!);
    res.json({ success: true, menu });
  } catch (error) {
    next(error);
  }
}

export async function createMenu(req: Request, res: Response, next: NextFunction) {
  try {
    const createdById = req.user!.id;
    const menu = await navigationService.createMenu(createdById, req.body);
    res.status(201).json({ success: true, menu });
  } catch (error) {
    next(error);
  }
}

export async function updateMenu(req: Request, res: Response, next: NextFunction) {
  try {
    const menu = await navigationService.updateMenu(req.params.id!, req.body);
    res.json({ success: true, menu });
  } catch (error) {
    next(error);
  }
}

export async function deleteMenu(req: Request, res: Response, next: NextFunction) {
  try {
    await navigationService.deleteMenu(req.params.id!);
    res.json({ success: true, message: 'Menu deleted' });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Navigation Items
// ============================================

export async function getMenuItems(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await navigationService.getMenuItems(req.params.menuId!);
    res.json({ success: true, items });
  } catch (error) {
    next(error);
  }
}

export async function getMenuItem(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await navigationService.getMenuItem(req.params.id!);
    res.json({ success: true, item });
  } catch (error) {
    next(error);
  }
}

export async function createMenuItem(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await navigationService.createMenuItem(req.body);
    res.status(201).json({ success: true, item });
  } catch (error) {
    next(error);
  }
}

export async function updateMenuItem(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await navigationService.updateMenuItem(req.params.id!, req.body);
    res.json({ success: true, item });
  } catch (error) {
    next(error);
  }
}

export async function deleteMenuItem(req: Request, res: Response, next: NextFunction) {
  try {
    await navigationService.deleteMenuItem(req.params.id!);
    res.json({ success: true, message: 'Menu item deleted' });
  } catch (error) {
    next(error);
  }
}

export async function reorderMenuItems(req: Request, res: Response, next: NextFunction) {
  try {
    const { itemIds } = req.body;
    await navigationService.reorderMenuItems(itemIds);
    res.json({ success: true, message: 'Items reordered' });
  } catch (error) {
    next(error);
  }
}

export async function moveMenuItem(req: Request, res: Response, next: NextFunction) {
  try {
    const { newParentId, newMenuId } = req.body;
    const item = await navigationService.moveMenuItem(req.params.id!, newParentId, newMenuId);
    res.json({ success: true, item });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Public Navigation API
// ============================================

export async function getPublicMenu(req: Request, res: Response, next: NextFunction) {
  try {
    const menu = await navigationService.getPublicMenu(req.params.slug!);
    res.json({ success: true, menu });
  } catch (error) {
    next(error);
  }
}

export async function getMenusByLocation(req: Request, res: Response, next: NextFunction) {
  try {
    const menus = await navigationService.getMenusByLocation(req.params.location!);
    res.json({ success: true, menus });
  } catch (error) {
    next(error);
  }
}
