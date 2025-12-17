import { Request, Response, NextFunction } from 'express';
import {
  createExport,
  createDirectExport,
  processExport,
  getExportStatus,
  getUserExports,
  getExportDownloadUrl,
  cancelExport,
  deleteExportFile,
} from '../../services/reporting/exportService';
import { ExportFormat } from '@prisma/client';

// Create export from report instance
export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { instanceId, reportType, filters, format } = req.body;

    let exportRecord;

    if (instanceId) {
      exportRecord = await createExport(
        instanceId,
        format as ExportFormat,
        userId
      );
    } else if (reportType) {
      exportRecord = await createDirectExport(
        reportType,
        filters || {},
        format as ExportFormat,
        userId
      );
    } else {
      return res.status(400).json({
        success: false,
        error: 'Either instanceId or reportType is required',
      });
    }

    // Start processing asynchronously
    processExport(exportRecord.id).catch(error => {
      console.error(`Export ${exportRecord.id} failed:`, error);
    });

    res.status(201).json({
      success: true,
      data: {
        id: exportRecord.id,
        status: exportRecord.status,
        fileName: exportRecord.fileName,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get export status
export const getStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;

    const status = await getExportStatus(id);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Export not found',
      });
    }

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

// Get user's exports
export const list = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const exports = await getUserExports(userId);

    res.json({
      success: true,
      data: exports,
    });
  } catch (error) {
    next(error);
  }
};

// Download export
export const download = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;

    const downloadUrl = await getExportDownloadUrl(id);

    res.json({
      success: true,
      data: {
        downloadUrl,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      if (error.message.includes('expired')) {
        return res.status(410).json({
          success: false,
          error: error.message,
        });
      }
      if (error.message.includes('not ready')) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
    }
    next(error);
  }
};

// Cancel export
export const cancel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;

    const status = await getExportStatus(id);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Export not found',
      });
    }

    if (status.status !== 'PENDING' && status.status !== 'PROCESSING') {
      return res.status(400).json({
        success: false,
        error: 'Export cannot be cancelled',
      });
    }

    await cancelExport(id);

    res.json({
      success: true,
      message: 'Export cancelled',
    });
  } catch (error) {
    next(error);
  }
};

// Delete export
export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;

    await deleteExportFile(id);

    res.json({
      success: true,
      message: 'Export deleted',
    });
  } catch (error) {
    next(error);
  }
};
