import { Request, Response } from 'express';
import { getUsageReport, getRevenueReport } from '../services/adminReportService';
import { logger } from '../utils/logger';

export async function handleUsageReport(req: Request, res: Response) {
  try {
    const report = await getUsageReport();
    return res.json({ report });
  } catch (error) {
    logger.error({ err: error }, 'Failed to generate admin usage report');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleRevenueReport(req: Request, res: Response) {
  try {
    const report = await getRevenueReport();
    return res.json({ report });
  } catch (error) {
    logger.error({ err: error }, 'Failed to generate admin revenue report');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
