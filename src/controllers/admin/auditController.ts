import { Request, Response, NextFunction } from 'express';
import * as auditService from '../../services/admin/auditService';
import { AdminAction } from '@prisma/client';

export async function getAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = {
      adminId: req.query.adminId as string,
      action: req.query.action as AdminAction,
      entityType: req.query.entityType as string,
      entityId: req.query.entityId as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
    };

    const result = await auditService.getAuditLogs(filters);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getAuditLogDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const logId = req.params.id!;
    const log = await auditService.getAuditLogDetails(logId);
    res.json({ success: true, log });
  } catch (error) {
    next(error);
  }
}

export async function getEntityAuditHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const entityType = req.params.entityType!;
    const entityId = req.params.entityId!;
    const history = await auditService.getEntityAuditHistory(entityType, entityId);
    res.json({ success: true, history });
  } catch (error) {
    next(error);
  }
}

export async function getAdminActivitySummary(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.params.adminId!;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const summary = await auditService.getAdminActivitySummary(adminId, startDate, endDate);
    res.json({ success: true, summary });
  } catch (error) {
    next(error);
  }
}

export async function getAuditStats(req: Request, res: Response, next: NextFunction) {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const stats = await auditService.getAuditStats(days);
    res.json({ success: true, stats });
  } catch (error) {
    next(error);
  }
}

export async function searchAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await auditService.searchAuditLogs(query, page, limit);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function exportAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = {
      adminId: req.query.adminId as string,
      action: req.query.action as AdminAction,
      entityType: req.query.entityType as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    };

    const logs = await auditService.exportAuditLogs(filters);
    res.json({ success: true, logs, count: logs.length });
  } catch (error) {
    next(error);
  }
}
