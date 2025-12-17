import { Request, Response, NextFunction } from 'express';
import * as noteService from '../../services/admin/noteService';

// ============================================
// Admin Notes
// ============================================

export async function getNotes(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = {
      entityType: req.query.entityType as string,
      entityId: req.query.entityId as string,
      createdById: req.query.createdById as string,
      isPinned: req.query.isPinned === 'true' ? true : req.query.isPinned === 'false' ? false : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    const result = await noteService.getNotes(filters);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getEntityNotes(req: Request, res: Response, next: NextFunction) {
  try {
    const entityType = req.params.entityType!;
    const entityId = req.params.entityId!;

    const notes = await noteService.getEntityNotes(entityType, entityId);
    res.json({ success: true, notes });
  } catch (error) {
    next(error);
  }
}

export async function getNote(req: Request, res: Response, next: NextFunction) {
  try {
    const noteId = req.params.id!;
    const note = await noteService.getNote(noteId);
    res.json({ success: true, note });
  } catch (error) {
    next(error);
  }
}

export async function createNote(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const { entityType, entityId, content, isPinned, isInternal } = req.body;

    const note = await noteService.createNote(adminId, {
      entityType,
      entityId,
      content,
      isPinned,
      isInternal,
    });

    res.status(201).json({ success: true, note });
  } catch (error) {
    next(error);
  }
}

export async function updateNote(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const noteId = req.params.id!;
    const { content, isPinned, isInternal } = req.body;

    const note = await noteService.updateNote(noteId, adminId, {
      content,
      isPinned,
      isInternal,
    });

    res.json({ success: true, note });
  } catch (error) {
    next(error);
  }
}

export async function deleteNote(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const noteId = req.params.id!;

    await noteService.deleteNote(noteId, adminId);
    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    next(error);
  }
}

export async function pinNote(req: Request, res: Response, next: NextFunction) {
  try {
    const noteId = req.params.id!;
    const { isPinned } = req.body;

    const note = await noteService.pinNote(noteId, isPinned);
    res.json({ success: true, note });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Saved Reports
// ============================================

export async function getSavedReports(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await noteService.getSavedReports(adminId, page, limit);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getSavedReport(req: Request, res: Response, next: NextFunction) {
  try {
    const reportId = req.params.id!;
    const report = await noteService.getSavedReport(reportId);
    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
}

export async function createSavedReport(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const { name, description, reportType, filters, columns, sortBy, sortOrder, isShared } = req.body;

    const report = await noteService.createSavedReport(adminId, {
      name,
      description,
      reportType,
      filters,
      columns,
      sortBy,
      sortOrder,
      isShared,
    });

    res.status(201).json({ success: true, report });
  } catch (error) {
    next(error);
  }
}

export async function updateSavedReport(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const reportId = req.params.id!;
    const { name, description, filters, columns, sortBy, sortOrder, isShared } = req.body;

    const report = await noteService.updateSavedReport(reportId, adminId, {
      name,
      description,
      filters,
      columns,
      sortBy,
      sortOrder,
      isShared,
    });

    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
}

export async function deleteSavedReport(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const reportId = req.params.id!;

    await noteService.deleteSavedReport(reportId, adminId);
    res.json({ success: true, message: 'Saved report deleted' });
  } catch (error) {
    next(error);
  }
}

export async function duplicateSavedReport(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const reportId = req.params.id!;
    const { name } = req.body;

    const report = await noteService.duplicateSavedReport(reportId, adminId, name);
    res.status(201).json({ success: true, report });
  } catch (error) {
    next(error);
  }
}
