import { Request, Response, NextFunction } from 'express';
import { ReportCategory } from '@prisma/client';
import {
  getReportDefinitions,
  getReportDefinitionBySlug,
} from '../../services/reporting/reportDefinitionService';
import {
  generateReport,
  createReportInstance,
  getReportInstance,
  getUserReportInstances,
  deleteReportInstance,
  refreshReportInstance,
} from '../../services/reporting/reportService';

// Get all report definitions
export const getDefinitions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const category = req.query.category as ReportCategory | undefined;
    const userRole = req.user?.role;

    const definitions = await getReportDefinitions(
      category,
      userRole
    );

    res.json({
      success: true,
      data: definitions,
    });
  } catch (error) {
    next(error);
  }
};

// Get single report definition
export const getDefinition = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const slug = req.params.slug as string;

    const definition = await getReportDefinitionBySlug(slug);

    if (!definition) {
      return res.status(404).json({
        success: false,
        error: 'Report definition not found',
      });
    }

    res.json({
      success: true,
      data: definition,
    });
  } catch (error) {
    next(error);
  }
};

// Generate report (without saving instance)
export const generate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      definitionId,
      definitionSlug,
      filters,
      columns,
      groupBy,
      sortBy,
      sortOrder,
      dateRangeType,
      dateFrom,
      dateTo,
      page,
      limit,
    } = req.body;

    const idOrSlug = definitionId || definitionSlug;
    if (!idOrSlug) {
      return res.status(400).json({
        success: false,
        error: 'Either definitionId or definitionSlug is required',
      });
    }

    const reportData = await generateReport(idOrSlug, {
      filters,
      columns,
      groupBy,
      sortBy,
      sortOrder,
      dateRangeType,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      page,
      limit,
    });

    res.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    next(error);
  }
};

// Create report instance (save report configuration)
export const createInstance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const {
      definitionId,
      name,
      filters,
      columns,
      groupBy,
      sortBy,
      sortOrder,
      dateRangeType,
      dateFrom,
      dateTo,
      chartType,
      chartConfig,
    } = req.body;

    const instance = await createReportInstance(
      definitionId,
      {
        filters,
        columns,
        groupBy,
        sortBy,
        sortOrder,
        dateRangeType,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
      },
      userId
    );

    res.status(201).json({
      success: true,
      data: instance,
    });
  } catch (error) {
    next(error);
  }
};

// Get user's report instances
export const getInstances = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const instances = await getUserReportInstances(userId);

    res.json({
      success: true,
      data: instances,
    });
  } catch (error) {
    next(error);
  }
};

// Get single report instance
export const getInstance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;

    const instance = await getReportInstance(id);

    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Report instance not found',
      });
    }

    // Check ownership
    if (instance.createdById !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: instance,
    });
  } catch (error) {
    next(error);
  }
};

// Delete report instance
export const removeInstance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const instance = await getReportInstance(id);

    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Report instance not found',
      });
    }

    // Check ownership
    if (instance.createdById !== userId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    await deleteReportInstance(id);

    res.json({
      success: true,
      message: 'Report instance deleted',
    });
  } catch (error) {
    next(error);
  }
};

// Refresh report instance data
export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;

    const instance = await getReportInstance(id);

    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Report instance not found',
      });
    }

    // Check ownership
    if (instance.createdById !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const refreshedData = await refreshReportInstance(id);

    res.json({
      success: true,
      data: refreshedData,
    });
  } catch (error) {
    next(error);
  }
};
