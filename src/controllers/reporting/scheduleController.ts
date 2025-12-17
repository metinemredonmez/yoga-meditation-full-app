import { Request, Response, NextFunction } from 'express';
import {
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getSchedule,
  getUserSchedules,
  executeSchedule,
  pauseSchedule,
  resumeSchedule,
  getScheduleHistory,
} from '../../services/reporting/scheduleService';
import {
  ScheduleFrequency,
  DateRangeType,
  ExportFormat,
  DeliveryMethod,
} from '@prisma/client';

// Create schedule
export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const {
      definitionId,
      name,
      description,
      frequency,
      cronExpression,
      timezone,
      hour,
      minute,
      dayOfWeek,
      dayOfMonth,
      filters,
      columns,
      dateRangeType,
      exportFormat,
      deliveryMethod,
      recipients,
      webhookUrl,
    } = req.body;

    const schedule = await createSchedule(
      definitionId,
      {
        name,
        description,
        frequency: frequency as ScheduleFrequency,
        cronExpression,
        timezone,
        hour,
        minute,
        dayOfWeek,
        dayOfMonth,
        filters: filters || {},
        columns: columns || [],
        dateRangeType: dateRangeType as DateRangeType,
        exportFormat: exportFormat as ExportFormat,
        deliveryMethod: deliveryMethod as DeliveryMethod,
        recipients,
        webhookUrl,
      },
      userId
    );

    res.status(201).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
};

// Get user's schedules
export const list = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const schedules = await getUserSchedules(userId);

    res.json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    next(error);
  }
};

// Get single schedule
export const get = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;

    const schedule = await getSchedule(id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found',
      });
    }

    // Check ownership
    if (schedule.createdById !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
};

// Update schedule
export const update = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;

    const existingSchedule = await getSchedule(id);

    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found',
      });
    }

    // Check ownership
    if (
      existingSchedule.createdById !== req.user!.id &&
      req.user!.role !== 'ADMIN'
    ) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const schedule = await updateSchedule(id, req.body);

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
};

// Delete schedule
export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;

    const existingSchedule = await getSchedule(id);

    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found',
      });
    }

    // Check ownership
    if (
      existingSchedule.createdById !== req.user!.id &&
      req.user!.role !== 'ADMIN'
    ) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    await deleteSchedule(id);

    res.json({
      success: true,
      message: 'Schedule deleted',
    });
  } catch (error) {
    next(error);
  }
};

// Pause schedule
export const pause = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;

    const existingSchedule = await getSchedule(id);

    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found',
      });
    }

    // Check ownership
    if (
      existingSchedule.createdById !== req.user!.id &&
      req.user!.role !== 'ADMIN'
    ) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const schedule = await pauseSchedule(id);

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
};

// Resume schedule
export const resume = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;

    const existingSchedule = await getSchedule(id);

    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found',
      });
    }

    // Check ownership
    if (
      existingSchedule.createdById !== req.user!.id &&
      req.user!.role !== 'ADMIN'
    ) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const schedule = await resumeSchedule(id);

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
};

// Get schedule execution history
export const getHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const existingSchedule = await getSchedule(id);

    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found',
      });
    }

    // Check ownership
    if (
      existingSchedule.createdById !== req.user!.id &&
      req.user!.role !== 'ADMIN'
    ) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const history = await getScheduleHistory(id, limit);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

// Run schedule now (manual execution)
export const runNow = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;

    const existingSchedule = await getSchedule(id);

    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found',
      });
    }

    // Check ownership
    if (
      existingSchedule.createdById !== req.user!.id &&
      req.user!.role !== 'ADMIN'
    ) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Execute asynchronously
    executeSchedule(id).catch(error => {
      console.error(`Schedule ${id} execution failed:`, error);
    });

    res.json({
      success: true,
      message: 'Schedule execution started',
    });
  } catch (error) {
    next(error);
  }
};
