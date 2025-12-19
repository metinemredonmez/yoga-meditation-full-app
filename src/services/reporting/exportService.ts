import { PrismaClient, ExportFormat, ExportStatus, Prisma } from '@prisma/client';
import { generateReport, getReportInstance, ReportConfig } from './reportService';
import { uploadFile, getSignedUrl, deleteFile } from '../storageService';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';

const prisma = new PrismaClient();

// Create export from report instance
export const createExport = async (
  instanceId: string,
  format: ExportFormat,
  userId: string
) => {
  const instance = await getReportInstance(instanceId);
  if (!instance) {
    throw new Error('Report instance not found');
  }

  const fileName = generateFileName(instance.report_definitions.name, format);

  return prisma.report_exports.create({
    data: {
      instanceId,
      format,
      fileName,
      status: 'PENDING',
      requestedById: userId,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
    },
  });
};

// Create direct export without instance
export const createDirectExport = async (
  reportType: string,
  filters: Record<string, unknown>,
  format: ExportFormat,
  userId: string
) => {
  const fileName = generateFileName(reportType, format);

  return prisma.report_exports.create({
    data: {
      reportType,
      filters: filters as Prisma.InputJsonValue,
      format,
      fileName,
      status: 'PENDING',
      requestedById: userId,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
    },
  });
};

// Process export (generate file)
export const processExport = async (exportId: string) => {
  const exportRecord = await prisma.report_exports.findUnique({
    where: { id: exportId },
    include: {
      report_instances: {
        include: { report_definitions: true },
      },
    },
  });

  if (!exportRecord) {
    throw new Error('Export not found');
  }

  // Update status to processing
  await prisma.report_exports.update({
    where: { id: exportId },
    data: {
      status: 'PROCESSING',
      startedAt: new Date(),
    },
  });

  try {
    // Get report data
    let data: unknown[];
    let columns: string[];

    if (exportRecord.report_instances) {
      const reportData = await generateReport(exportRecord.report_instances.definitionId, {
        filters: exportRecord.report_instances.filters as Record<string, unknown>,
        columns: exportRecord.report_instances.columns,
        dateRangeType: exportRecord.report_instances.dateRangeType,
        dateFrom: exportRecord.report_instances.dateFrom || undefined,
        dateTo: exportRecord.report_instances.dateTo || undefined,
        limit: 10000, // Max rows for export
      });
      data = reportData.data as unknown[];
      columns = exportRecord.report_instances.columns;
    } else if (exportRecord.reportType && exportRecord.filters) {
      const reportData = await generateReport(exportRecord.reportType, {
        filters: exportRecord.filters as Record<string, unknown>,
        limit: 10000,
      });
      data = reportData.data as unknown[];
      columns = Object.keys(data[0] || {});
    } else {
      throw new Error('Invalid export configuration');
    }

    // Generate file based on format
    let buffer: Buffer;
    let contentType: string;

    switch (exportRecord.format) {
      case 'CSV':
        buffer = await generateCSV(data, columns);
        contentType = 'text/csv';
        break;
      case 'EXCEL':
        buffer = await generateExcel(data, columns, {
          sheetName: exportRecord.report_instances?.report_definitions.name || 'Report',
        });
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'PDF':
        buffer = await generatePDF(data, columns, {
          title: exportRecord.report_instances?.report_definitions.name || 'Report',
        });
        contentType = 'application/pdf';
        break;
      case 'JSON':
        buffer = Buffer.from(JSON.stringify(data, null, 2));
        contentType = 'application/json';
        break;
      default:
        throw new Error(`Unsupported format: ${exportRecord.format}`);
    }

    // Upload to S3
    const fileUrl = await uploadExportFile(exportId, buffer, exportRecord.format, contentType);

    // Update export record
    await prisma.report_exports.update({
      where: { id: exportId },
      data: {
        status: 'COMPLETED',
        fileUrl,
        fileSize: buffer.length,
        totalRows: data.length,
        processedRows: data.length,
        progress: 100,
        completedAt: new Date(),
      },
    });

    return { fileUrl, fileSize: buffer.length };
  } catch (error) {
    await prisma.report_exports.update({
      where: { id: exportId },
      data: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      },
    });
    throw error;
  }
};

// Generate CSV
export const generateCSV = async (
  data: unknown[],
  columns: string[]
): Promise<Buffer> => {
  if (data.length === 0) {
    return Buffer.from('');
  }

  const fields = columns.length > 0 ? columns : Object.keys(data[0] as object);
  const parser = new Parser({ fields });
  const csv = parser.parse(data);

  return Buffer.from(csv, 'utf-8');
};

// Generate Excel
export const generateExcel = async (
  data: unknown[],
  columns: string[],
  options: {
    sheetName?: string;
    headerStyle?: Partial<ExcelJS.Style>;
  } = {}
): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Yoga App';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(options.sheetName || 'Report');

  // Define columns
  const cols = columns.length > 0 ? columns : Object.keys((data[0] as object) || {});
  worksheet.columns = cols.map(col => ({
    header: formatColumnHeader(col),
    key: col,
    width: 20,
  }));

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Add data
  data.forEach(row => {
    worksheet.addRow(row as Record<string, unknown>);
  });

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    if (column.eachCell) {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = Math.min(maxLength + 2, 50);
    }
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
};

// Generate PDF
export const generatePDF = async (
  data: unknown[],
  columns: string[],
  options: {
    title?: string;
    subtitle?: string;
  } = {}
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Title
    if (options.title) {
      doc.fontSize(20).text(options.title, { align: 'center' });
      doc.moveDown();
    }

    if (options.subtitle) {
      doc.fontSize(12).text(options.subtitle, { align: 'center' });
      doc.moveDown();
    }

    // Generated date
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
    doc.moveDown(2);

    // Table
    const cols = columns.length > 0 ? columns : Object.keys((data[0] as object) || {});
    const colWidth = (doc.page.width - 100) / cols.length;
    const startX = 50;
    let y = doc.y;

    // Header
    doc.fontSize(10).font('Helvetica-Bold');
    cols.forEach((col, i) => {
      doc.text(formatColumnHeader(col), startX + i * colWidth, y, {
        width: colWidth,
        align: 'left',
      });
    });

    y += 20;
    doc.moveTo(startX, y).lineTo(doc.page.width - 50, y).stroke();
    y += 10;

    // Data rows
    doc.font('Helvetica').fontSize(9);
    data.slice(0, 100).forEach((row, rowIndex) => {
      if (y > doc.page.height - 50) {
        doc.addPage();
        y = 50;
      }

      cols.forEach((col, i) => {
        const value = (row as Record<string, unknown>)[col];
        const displayValue = formatCellValue(value);
        doc.text(displayValue, startX + i * colWidth, y, {
          width: colWidth,
          align: 'left',
        });
      });

      y += 15;
    });

    if (data.length > 100) {
      doc.moveDown();
      doc.text(`... and ${data.length - 100} more rows`, { align: 'center' });
    }

    doc.end();
  });
};

// Generate JSON (simple passthrough)
export const generateJSON = (data: unknown[]): string => {
  return JSON.stringify(data, null, 2);
};

// Upload export file to S3
export const uploadExportFile = async (
  exportId: string,
  buffer: Buffer,
  format: ExportFormat,
  contentType: string
): Promise<string> => {
  const extension = format.toLowerCase();
  const key = `exports/${exportId}.${extension}`;

  await uploadFile(key, buffer, contentType);

  return key;
};

// Get download URL
export const getExportDownloadUrl = async (exportId: string): Promise<string> => {
  const exportRecord = await prisma.report_exports.findUnique({
    where: { id: exportId },
  });

  if (!exportRecord || !exportRecord.fileUrl) {
    throw new Error('Export file not found');
  }

  if (exportRecord.status !== 'COMPLETED') {
    throw new Error('Export is not ready for download');
  }

  if (exportRecord.expiresAt && new Date() > exportRecord.expiresAt) {
    throw new Error('Export has expired');
  }

  // Mark as downloaded
  await prisma.report_exports.update({
    where: { id: exportId },
    data: { downloadedAt: new Date() },
  });

  return getSignedUrl(exportRecord.fileUrl, 3600); // 1 hour signed URL
};

// Delete export file
export const deleteExportFile = async (exportId: string): Promise<void> => {
  const exportRecord = await prisma.report_exports.findUnique({
    where: { id: exportId },
  });

  if (exportRecord?.fileUrl) {
    await deleteFile(exportRecord.fileUrl);
  }

  await prisma.report_exports.delete({
    where: { id: exportId },
  });
};

// Cleanup expired exports
export const cleanupExpiredExports = async (): Promise<number> => {
  const expiredExports = await prisma.report_exports.findMany({
    where: {
      expiresAt: { lt: new Date() },
      status: 'COMPLETED',
    },
  });

  for (const exp of expiredExports) {
    if (exp.fileUrl) {
      try {
        await deleteFile(exp.fileUrl);
      } catch (error) {
        console.error(`Failed to delete file for export ${exp.id}:`, error);
      }
    }
  }

  await prisma.report_exports.updateMany({
    where: {
      expiresAt: { lt: new Date() },
      status: 'COMPLETED',
    },
    data: {
      status: 'EXPIRED',
    },
  });

  return expiredExports.length;
};

// Update export progress
export const updateExportProgress = async (
  exportId: string,
  progress: number,
  processedRows: number
) => {
  return prisma.report_exports.update({
    where: { id: exportId },
    data: { progress, processedRows },
  });
};

// Get export status
export const getExportStatus = async (exportId: string) => {
  return prisma.report_exports.findUnique({
    where: { id: exportId },
    select: {
      id: true,
      status: true,
      progress: true,
      processedRows: true,
      totalRows: true,
      error: true,
      fileUrl: true,
      fileName: true,
      fileSize: true,
    },
  });
};

// Get user exports
export const getUserExports = async (userId: string) => {
  return prisma.report_exports.findMany({
    where: { requestedById: userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
};

// Cancel export
export const cancelExport = async (exportId: string) => {
  return prisma.report_exports.update({
    where: { id: exportId },
    data: { status: 'FAILED' }, // Use FAILED instead of CANCELLED as it's not in enum
  });
};

// Helper functions
const generateFileName = (reportName: string, format: ExportFormat): string => {
  const sanitizedName = reportName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const extension = format.toLowerCase();
  return `${sanitizedName}_${timestamp}.${extension}`;
};

const formatColumnHeader = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/_/g, ' ')
    .trim();
};

const formatCellValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};
