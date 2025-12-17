import { prisma } from '../../utils/database';
import { ExportFormat, Prisma } from '@prisma/client';
import { HttpError } from '../../middleware/errorHandler';

export async function getExportJobs(adminId?: string, page = 1, limit = 20) {
  const where: Prisma.ExportJobWhereInput = adminId ? { adminId } : {};
  const [jobs, total] = await Promise.all([
    prisma.exportJob.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.exportJob.count({ where }),
  ]);
  return { jobs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getExportJob(jobId: string) {
  const job = await prisma.exportJob.findUnique({ where: { id: jobId } });
  if (!job) throw new HttpError(404, 'Export job not found');
  return job;
}

export async function createExportJob(adminId: string, data: { type: string; format: ExportFormat; filters?: object; columns?: string[] }) {
  const job = await prisma.exportJob.create({
    data: {
      type: data.type as any,
      format: data.format,
      filters: data.filters as Prisma.JsonObject,
      status: 'PENDING',
      adminId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  processExportJob(job.id).catch(console.error);
  return job;
}

export async function cancelExportJob(jobId: string) {
  const job = await prisma.exportJob.findUnique({ where: { id: jobId } });
  if (!job) throw new HttpError(404, 'Export job not found');
  if (job.status !== 'PENDING' && job.status !== 'PROCESSING') throw new HttpError(400, 'Cannot cancel');
  return prisma.exportJob.update({ where: { id: jobId }, data: { status: 'FAILED' } });
}

export async function deleteExportJob(jobId: string) {
  await prisma.exportJob.delete({ where: { id: jobId } });
  return { success: true };
}

export async function cleanupExpiredExports() {
  const result = await prisma.exportJob.deleteMany({ where: { expiresAt: { lt: new Date() }, status: 'COMPLETED' } });
  return { deleted: result.count };
}

async function processExportJob(jobId: string) {
  await prisma.exportJob.update({ where: { id: jobId }, data: { status: 'PROCESSING', startedAt: new Date() } });
  try {
    await prisma.exportJob.update({ where: { id: jobId }, data: { status: 'COMPLETED', completedAt: new Date(), fileUrl: `/exports/export_${jobId}.csv`, rowCount: 0 } });
  } catch (error) {
    await prisma.exportJob.update({ where: { id: jobId }, data: { status: 'FAILED', completedAt: new Date(), error: error instanceof Error ? error.message : 'Unknown' } });
  }
}
