import { Request, Response, NextFunction } from 'express';
import * as maintenanceService from '../../services/admin/maintenanceService';
import * as auditService from '../../services/admin/auditService';
import { AdminAction } from '@prisma/client';

// ============================================
// Maintenance Windows
// ============================================

export async function getMaintenanceWindows(req: Request, res: Response, next: NextFunction) {
  try {
    const includeCompleted = req.query.includeCompleted === 'true';
    const windows = await maintenanceService.getMaintenanceWindows(includeCompleted);
    res.json({ success: true, windows });
  } catch (error) {
    next(error);
  }
}

export async function getActiveMaintenanceWindow(req: Request, res: Response, next: NextFunction) {
  try {
    const window = await maintenanceService.getActiveMaintenanceWindow();
    res.json({ success: true, window });
  } catch (error) {
    next(error);
  }
}

export async function getUpcomingMaintenanceWindows(req: Request, res: Response, next: NextFunction) {
  try {
    const windows = await maintenanceService.getUpcomingMaintenanceWindows();
    res.json({ success: true, windows });
  } catch (error) {
    next(error);
  }
}

export async function createMaintenanceWindow(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const { title, message, type, startTime, endTime, affectedServices } = req.body;

    const window = await maintenanceService.createMaintenanceWindow(adminId, {
      title,
      message,
      type,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      affectedServices,
    });

    await auditService.logAdminAction(
      adminId,
      AdminAction.MAINTENANCE_MODE_TOGGLE,
      'maintenance_window',
      window.id,
      { title, type, startTime, endTime }
    );

    res.status(201).json({ success: true, window });
  } catch (error) {
    next(error);
  }
}

export async function updateMaintenanceWindow(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const windowId = req.params.id!;
    const { title, message, type, startTime, endTime, affectedServices } = req.body;

    const window = await maintenanceService.updateMaintenanceWindow(windowId, {
      title,
      message,
      type,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      affectedServices,
    });

    await auditService.logAdminAction(
      adminId,
      AdminAction.MAINTENANCE_MODE_TOGGLE,
      'maintenance_window',
      windowId,
      { title, type, startTime, endTime }
    );

    res.json({ success: true, window });
  } catch (error) {
    next(error);
  }
}

export async function cancelMaintenanceWindow(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const windowId = req.params.id!;

    const window = await maintenanceService.cancelMaintenanceWindow(windowId);

    await auditService.logAdminAction(
      adminId,
      AdminAction.MAINTENANCE_MODE_TOGGLE,
      'maintenance_window',
      windowId
    );

    res.json({ success: true, window });
  } catch (error) {
    next(error);
  }
}

export async function deleteMaintenanceWindow(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const windowId = req.params.id!;

    await maintenanceService.deleteMaintenanceWindow(windowId);

    await auditService.logAdminAction(
      adminId,
      AdminAction.MAINTENANCE_MODE_TOGGLE,
      'maintenance_window',
      windowId
    );

    res.json({ success: true, message: 'Maintenance window deleted' });
  } catch (error) {
    next(error);
  }
}

// ============================================
// System Maintenance
// ============================================

export async function clearCache(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const { cacheType } = req.body;

    const result = await maintenanceService.clearCache(cacheType);

    await auditService.logAdminAction(
      adminId,
      AdminAction.CACHE_CLEAR,
      'system',
      undefined,
      { cacheType, types: result.types }
    );

    res.json({ success: true, message: 'Cache cleared', types: result.types });
  } catch (error) {
    next(error);
  }
}

export async function cleanupExpiredData(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;

    const result = await maintenanceService.cleanupExpiredData();

    await auditService.logAdminAction(
      adminId,
      AdminAction.BULK_ACTION,
      'system',
      undefined,
      { cleaned: result.cleaned }
    );

    res.json({ success: true, message: 'Cleanup completed', cleaned: result.cleaned });
  } catch (error) {
    next(error);
  }
}

export async function runDatabaseOptimization(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await maintenanceService.runDatabaseOptimization();
    res.json({ success: true, message: 'Optimization completed', duration: result.duration });
  } catch (error) {
    next(error);
  }
}

export async function getSystemMetrics(req: Request, res: Response, next: NextFunction) {
  try {
    const metrics = await maintenanceService.getSystemMetrics();
    res.json({ success: true, metrics });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Health & Backup
// ============================================

export async function runHealthCheck(req: Request, res: Response, next: NextFunction) {
  try {
    const health = await maintenanceService.runHealthCheck();
    res.json({ success: true, health });
  } catch (error) {
    next(error);
  }
}

export async function getBackupStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const status = await maintenanceService.getBackupStatus();
    res.json({ success: true, status });
  } catch (error) {
    next(error);
  }
}

export async function triggerBackup(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const { type } = req.body;

    const result = await maintenanceService.triggerBackup(type);

    await auditService.logAdminAction(
      adminId,
      AdminAction.BULK_ACTION,
      'backup',
      result.jobId,
      { type }
    );

    res.json({ success: true, message: 'Backup triggered', jobId: result.jobId, status: result.status });
  } catch (error) {
    next(error);
  }
}
