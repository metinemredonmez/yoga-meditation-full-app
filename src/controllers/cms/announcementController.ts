import { Request, Response, NextFunction } from 'express';
import * as announcementService from '../../services/cms/announcementService';

// ============================================
// Admin Announcement Management
// ============================================

export async function getAnnouncements(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await announcementService.getAnnouncements({
      type: req.query.type as string | undefined,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      search: req.query.search as string | undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    const announcement = await announcementService.getAnnouncement(req.params.id!);
    res.json({ success: true, announcement });
  } catch (error) {
    next(error);
  }
}

export async function createAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    const createdById = req.user!.id;
    const announcement = await announcementService.createAnnouncement(createdById, req.body);
    res.status(201).json({ success: true, announcement });
  } catch (error) {
    next(error);
  }
}

export async function updateAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    const announcement = await announcementService.updateAnnouncement(req.params.id!, req.body);
    res.json({ success: true, announcement });
  } catch (error) {
    next(error);
  }
}

export async function deleteAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    await announcementService.deleteAnnouncement(req.params.id!);
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    next(error);
  }
}

export async function toggleAnnouncementStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const announcement = await announcementService.toggleAnnouncementStatus(req.params.id!);
    res.json({ success: true, announcement });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Public Announcement API
// ============================================

export async function getActiveAnnouncements(req: Request, res: Response, next: NextFunction) {
  try {
    const audience = req.query.audience as string | undefined;
    const announcements = await announcementService.getActiveAnnouncements(audience);
    res.json({ success: true, announcements });
  } catch (error) {
    next(error);
  }
}

export async function dismissAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const result = await announcementService.dismissAnnouncement(req.params.id!, userId);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}
