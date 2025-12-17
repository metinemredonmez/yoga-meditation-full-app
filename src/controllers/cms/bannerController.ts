import { Request, Response, NextFunction } from 'express';
import * as bannerService from '../../services/cms/bannerService';

// ============================================
// Admin Banner Management
// ============================================

export async function getBanners(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await bannerService.getBanners({
      position: req.query.position as string | undefined,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getBanner(req: Request, res: Response, next: NextFunction) {
  try {
    const banner = await bannerService.getBanner(req.params.id!);
    res.json({ success: true, banner });
  } catch (error) {
    next(error);
  }
}

export async function createBanner(req: Request, res: Response, next: NextFunction) {
  try {
    const createdById = req.user!.id;
    const banner = await bannerService.createBanner(createdById, req.body);
    res.status(201).json({ success: true, banner });
  } catch (error) {
    next(error);
  }
}

export async function updateBanner(req: Request, res: Response, next: NextFunction) {
  try {
    const banner = await bannerService.updateBanner(req.params.id!, req.body);
    res.json({ success: true, banner });
  } catch (error) {
    next(error);
  }
}

export async function deleteBanner(req: Request, res: Response, next: NextFunction) {
  try {
    await bannerService.deleteBanner(req.params.id!);
    res.json({ success: true, message: 'Banner deleted' });
  } catch (error) {
    next(error);
  }
}

export async function toggleBannerStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const banner = await bannerService.toggleBannerStatus(req.params.id!);
    res.json({ success: true, banner });
  } catch (error) {
    next(error);
  }
}

export async function reorderBanners(req: Request, res: Response, next: NextFunction) {
  try {
    const { bannerIds } = req.body;
    await bannerService.reorderBanners(bannerIds);
    res.json({ success: true, message: 'Banners reordered' });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Public Banner API
// ============================================

export async function getActiveBanners(req: Request, res: Response, next: NextFunction) {
  try {
    const banners = await bannerService.getActiveBanners(req.query.position as string | undefined);
    res.json({ success: true, banners });
  } catch (error) {
    next(error);
  }
}
