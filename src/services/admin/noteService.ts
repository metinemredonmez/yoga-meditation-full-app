import { prisma } from '../../utils/database';
import { Prisma } from '@prisma/client';
import { HttpError } from '../../middleware/errorHandler';

// ============================================
// Admin Notes
// ============================================

// Get notes with filters
export async function getNotes(filters: {
  entityType?: string;
  entityId?: string;
  createdById?: string;
  isPinned?: boolean;
  page?: number;
  limit?: number;
}) {
  const { entityType, entityId, createdById, isPinned, page = 1, limit = 20 } = filters;
  const where: Prisma.AdminNoteWhereInput = {};
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (createdById) where.adminId = createdById;
  if (isPinned !== undefined) where.isPinned = isPinned;

  const [notes, total] = await Promise.all([
    prisma.adminNote.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        admin: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    }),
    prisma.adminNote.count({ where }),
  ]);

  return {
    notes,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// Get notes for a specific entity
export async function getEntityNotes(entityType: string, entityId: string) {
  return prisma.adminNote.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: 'desc' },
    include: {
      admin: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
}

// Get note by ID
export async function getNote(noteId: string) {
  const note = await prisma.adminNote.findUnique({
    where: { id: noteId },
    include: {
      admin: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });

  if (!note) throw new HttpError(404, 'Note not found');
  return note;
}

// Create admin note
export async function createNote(
  adminId: string,
  data: {
    entityType: string;
    entityId: string;
    content: string;
    isPinned?: boolean;
    isInternal?: boolean;
  }
) {
  return prisma.adminNote.create({
    data: {
      adminId,
      entityType: data.entityType,
      entityId: data.entityId,
      content: data.content,
      isPinned: data.isPinned || false,
    },
    include: {
      admin: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
}

// Update admin note
export async function updateNote(
  noteId: string,
  adminId: string,
  data: { content?: string; isPinned?: boolean; isInternal?: boolean }
) {
  const note = await prisma.adminNote.findUnique({ where: { id: noteId } });
  if (!note) throw new HttpError(404, 'Note not found');
  if (note.adminId !== adminId) throw new HttpError(403, 'Not authorized');

  return prisma.adminNote.update({
    where: { id: noteId },
    data: {
      content: data.content,
      isPinned: data.isPinned,
    },
    include: {
      admin: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
}

// Delete admin note
export async function deleteNote(noteId: string, adminId: string) {
  const note = await prisma.adminNote.findUnique({ where: { id: noteId } });
  if (!note) throw new HttpError(404, 'Note not found');
  if (note.adminId !== adminId) throw new HttpError(403, 'Not authorized');

  await prisma.adminNote.delete({ where: { id: noteId } });
  return { success: true };
}

// Pin/unpin note
export async function pinNote(noteId: string, isPinned: boolean) {
  const note = await prisma.adminNote.findUnique({ where: { id: noteId } });
  if (!note) throw new HttpError(404, 'Note not found');

  return prisma.adminNote.update({
    where: { id: noteId },
    data: { isPinned },
    include: {
      admin: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
}

// ============================================
// Saved Reports
// ============================================

export async function getSavedReports(adminId?: string, page = 1, limit = 20) {
  const where: Prisma.SavedReportWhereInput = adminId ? { adminId } : {};

  const [reports, total] = await Promise.all([
    prisma.savedReport.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.savedReport.count({ where }),
  ]);

  return {
    reports,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getSavedReport(reportId: string) {
  const report = await prisma.savedReport.findUnique({ where: { id: reportId } });
  if (!report) throw new HttpError(404, 'Report not found');
  return report;
}

export async function createSavedReport(
  adminId: string,
  data: {
    name: string;
    description?: string;
    reportType: string;
    filters: object;
    columns: string[];
    sortBy?: string;
    sortOrder?: string;
    isShared?: boolean;
  }
) {
  return prisma.savedReport.create({
    data: {
      adminId,
      name: data.name,
      description: data.description,
      reportType: data.reportType,
      filters: data.filters as Prisma.JsonObject,
      columns: data.columns,
      sortBy: data.sortBy,
      sortOrder: data.sortOrder,
      isShared: data.isShared || false,
    },
  });
}

export async function updateSavedReport(
  reportId: string,
  adminId: string,
  data: {
    name?: string;
    description?: string;
    filters?: object;
    columns?: string[];
    sortBy?: string;
    sortOrder?: string;
    isShared?: boolean;
  }
) {
  const report = await prisma.savedReport.findUnique({ where: { id: reportId } });
  if (!report) throw new HttpError(404, 'Report not found');
  if (report.adminId !== adminId) throw new HttpError(403, 'Not authorized');

  return prisma.savedReport.update({
    where: { id: reportId },
    data: {
      name: data.name,
      description: data.description,
      filters: data.filters ? (data.filters as Prisma.JsonObject) : undefined,
      columns: data.columns,
      sortBy: data.sortBy,
      sortOrder: data.sortOrder,
      isShared: data.isShared,
    },
  });
}

export async function deleteSavedReport(reportId: string, adminId: string) {
  const report = await prisma.savedReport.findUnique({ where: { id: reportId } });
  if (!report) throw new HttpError(404, 'Report not found');
  if (report.adminId !== adminId) throw new HttpError(403, 'Not authorized');

  await prisma.savedReport.delete({ where: { id: reportId } });
  return { success: true };
}

export async function duplicateSavedReport(reportId: string, adminId: string, newName?: string) {
  const report = await prisma.savedReport.findUnique({ where: { id: reportId } });
  if (!report) throw new HttpError(404, 'Report not found');

  return prisma.savedReport.create({
    data: {
      adminId,
      name: newName || `${report.name} (Copy)`,
      description: report.description,
      reportType: report.reportType,
      filters: report.filters as Prisma.JsonObject,
      columns: report.columns,
      sortBy: report.sortBy,
      sortOrder: report.sortOrder,
      isShared: false,
    },
  });
}
