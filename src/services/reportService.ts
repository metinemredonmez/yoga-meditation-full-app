import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { prisma } from '../utils/database';
import {
  PaymentStatus,
  InvoiceStatus,
  SubscriptionStatus,
  PaymentProvider,
  SubscriptionTier,
} from '@prisma/client';
import { logger } from '../utils/logger';
import * as analyticsService from './analyticsService';

export interface ReportFilters {
  startDate: Date;
  endDate: Date;
  provider?: PaymentProvider;
  tier?: SubscriptionTier;
}

export interface ReportOptions {
  format: 'excel' | 'pdf' | 'json';
  includeDetails?: boolean;
}

/**
 * Generate Revenue Report
 */
export async function generateRevenueReport(
  filters: ReportFilters,
  options: ReportOptions = { format: 'json' }
): Promise<Buffer | object> {
  const { startDate, endDate, provider } = filters;

  // Fetch payments
  const payments = await prisma.payments.findMany({
    where: {
      status: PaymentStatus.COMPLETED,
      paidAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(provider ? { provider } : {}),
    },
    include: {
      users: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      subscriptions: {
        include: {
          plan: true,
        },
      },
    },
    orderBy: { paidAt: 'asc' },
  });

  // Fetch refunds
  const refunds = await prisma.refunds.findMany({
    where: {
      status: 'SUCCEEDED',
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(provider ? { provider } : {}),
    },
    include: {
      payments: {
        include: {
          users: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      },
    },
  });

  // Calculate totals
  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalRefunds = refunds.reduce((sum, r) => sum + Number(r.amount), 0);
  const netRevenue = totalRevenue - totalRefunds;

  // Group by provider
  const byProvider: Record<string, { revenue: number; count: number }> = {};
  for (const payment of payments) {
    const providerEntry = byProvider[payment.provider];
    if (!providerEntry) {
      byProvider[payment.provider] = { revenue: 0, count: 0 };
    }
    const entry = byProvider[payment.provider]!;
    entry.revenue += Number(payment.amount);
    entry.count++;
  }

  // Group by month
  const byMonth: Record<string, { revenue: number; count: number }> = {};
  for (const payment of payments) {
    if (payment.paidAt) {
      const month = `${payment.paidAt.getFullYear()}-${String(payment.paidAt.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[month]) {
        byMonth[month] = { revenue: 0, count: 0 };
      }
      const entry = byMonth[month]!;
      entry.revenue += Number(payment.amount);
      entry.count++;
    }
  }

  const reportData = {
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    summary: {
      totalRevenue,
      totalRefunds,
      netRevenue,
      transactionCount: payments.length,
      refundCount: refunds.length,
    },
    byProvider: Object.entries(byProvider).map(([p, data]) => ({
      provider: p,
      ...data,
    })),
    byMonth: Object.entries(byMonth)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    ...(options.includeDetails
      ? {
          transactions: payments.map((p) => ({
            id: p.id,
            date: p.paidAt,
            amount: Number(p.amount),
            currency: p.currency,
            provider: p.provider,
            users: p.users.email,
            plan: p.subscriptions?.plan.name || 'One-time',
          })),
        }
      : {}),
  };

  if (options.format === 'json') {
    return reportData;
  } else if (options.format === 'excel') {
    return generateRevenueExcel(reportData, payments, refunds);
  } else {
    return generateRevenuePDF(reportData);
  }
}

/**
 * Generate Subscription Report
 */
export async function generateSubscriptionReport(
  filters: ReportFilters,
  options: ReportOptions = { format: 'json' }
): Promise<Buffer | object> {
  const { startDate, endDate, tier } = filters;

  // Active subscriptions at end date
  const activeSubscriptions = await prisma.subscriptions.findMany({
    where: {
      status: {
        in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
      },
      createdAt: { lte: endDate },
      ...(tier
        ? {
            plan: { tier },
          }
        : {}),
    },
    include: {
      users: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      plan: true,
    },
  });

  // New subscriptions in period
  const newSubscriptions = await prisma.subscriptions.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(tier
        ? {
            plan: { tier },
          }
        : {}),
    },
    include: {
      users: {
        select: {
          id: true,
          email: true,
        },
      },
      plan: true,
    },
  });

  // Cancelled subscriptions in period
  const cancelledSubscriptions = await prisma.subscriptions.findMany({
    where: {
      cancelledAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(tier
        ? {
            plan: { tier },
          }
        : {}),
    },
    include: {
      users: {
        select: {
          id: true,
          email: true,
        },
      },
      plan: true,
    },
  });

  // Calculate MRR
  let currentMRR = 0;
  for (const sub of activeSubscriptions) {
    if (sub.interval === 'MONTHLY') {
      currentMRR += Number(sub.plan.priceMonthly);
    } else {
      currentMRR += Number(sub.plan.priceYearly) / 12;
    }
  }

  // Group by tier
  const byTier: Record<string, { count: number; mrr: number }> = {};
  for (const sub of activeSubscriptions) {
    const t = sub.plan.tier;
    if (!byTier[t]) {
      byTier[t] = { count: 0, mrr: 0 };
    }
    byTier[t].count++;
    if (sub.interval === 'MONTHLY') {
      byTier[t].mrr += Number(sub.plan.priceMonthly);
    } else {
      byTier[t].mrr += Number(sub.plan.priceYearly) / 12;
    }
  }

  // Group by provider
  const byProvider: Record<string, number> = {};
  for (const sub of activeSubscriptions) {
    byProvider[sub.provider] = (byProvider[sub.provider] || 0) + 1;
  }

  const reportData = {
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    summary: {
      activeSubscriptions: activeSubscriptions.length,
      newSubscriptions: newSubscriptions.length,
      cancelledSubscriptions: cancelledSubscriptions.length,
      netGrowth: newSubscriptions.length - cancelledSubscriptions.length,
      currentMRR,
      currentARR: currentMRR * 12,
    },
    byTier: Object.entries(byTier).map(([t, data]) => ({
      tier: t,
      ...data,
    })),
    byProvider: Object.entries(byProvider).map(([p, count]) => ({
      provider: p,
      count,
    })),
    ...(options.includeDetails
      ? {
          subscriptions: activeSubscriptions.map((s) => ({
            id: s.id,
            users: s.users.email,
            plan: s.plan.name,
            tier: s.plan.tier,
            interval: s.interval,
            provider: s.provider,
            status: s.status,
            createdAt: s.createdAt,
            currentPeriodEnd: s.currentPeriodEnd,
          })),
        }
      : {}),
  };

  if (options.format === 'json') {
    return reportData;
  } else if (options.format === 'excel') {
    return generateSubscriptionExcel(reportData, activeSubscriptions);
  } else {
    return generateSubscriptionPDF(reportData);
  }
}

/**
 * Generate Invoice Report
 */
export async function generateInvoiceReport(
  filters: ReportFilters,
  options: ReportOptions = { format: 'json' }
): Promise<Buffer | object> {
  const { startDate, endDate } = filters;

  const invoices = await prisma.invoices.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      users: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      invoice_items: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate totals by status
  const byStatus: Record<string, { count: number; amount: number }> = {};
  for (const inv of invoices) {
    if (!byStatus[inv.status]) {
      byStatus[inv.status] = { count: 0, amount: 0 };
    }
    const entry = byStatus[inv.status]!;
    entry.count++;
    entry.amount += Number(inv.amountDue);
  }

  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.amountDue), 0);
  const totalPaid = invoices
    .filter((inv) => inv.status === InvoiceStatus.PAID)
    .reduce((sum, inv) => sum + Number(inv.amountPaid), 0);
  const totalOutstanding = invoices
    .filter((inv) => inv.status === InvoiceStatus.OPEN)
    .reduce((sum, inv) => sum + Number(inv.amountDue), 0);

  const reportData = {
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    summary: {
      totalInvoices: invoices.length,
      totalInvoiced,
      totalPaid,
      totalOutstanding,
      collectionRate: totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0,
    },
    byStatus: Object.entries(byStatus).map(([status, data]) => ({
      status,
      ...data,
    })),
    ...(options.includeDetails
      ? {
          invoices: invoices.map((inv) => ({
            id: inv.id,
            number: inv.invoiceNumber,
            date: inv.createdAt,
            users: inv.users.email,
            amount: Number(inv.amountDue),
            paid: Number(inv.amountPaid),
            status: inv.status,
            dueDate: inv.dueDate,
          })),
        }
      : {}),
  };

  if (options.format === 'json') {
    return reportData;
  } else if (options.format === 'excel') {
    return generateInvoiceExcel(reportData, invoices);
  } else {
    return generateInvoicePDF(reportData);
  }
}

/**
 * Generate Analytics Report
 */
export async function generateAnalyticsReport(
  filters: ReportFilters,
  options: ReportOptions = { format: 'json' }
): Promise<Buffer | object> {
  const { startDate, endDate } = filters;

  const snapshots = await analyticsService.getAnalyticsSnapshots(startDate, endDate);
  const dashboard = await analyticsService.getDashboardMetrics();

  const reportData = {
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    currentMetrics: dashboard.revenue,
    userMetrics: dashboard.users,
    subscriptionMetrics: dashboard.subscriptions,
    breakdown: dashboard.breakdown,
    trend: snapshots.map((s) => ({
      date: s.date,
      mrr: Number(s.mrr),
      arr: Number(s.arr),
      totalUsers: s.totalUsers,
      activeSubscriptions: s.activeSubscriptions,
      churnRate: Number(s.churnRate),
    })),
  };

  if (options.format === 'json') {
    return reportData;
  } else if (options.format === 'excel') {
    return generateAnalyticsExcel(reportData, snapshots);
  } else {
    return generateAnalyticsPDF(reportData);
  }
}

// Excel generation helpers
async function generateRevenueExcel(
  reportData: Record<string, unknown>,
  payments: Array<{
    id: string;
    paidAt: Date | null;
    amount: { toString: () => string };
    currency: string;
    provider: string;
    users: { email: string };
    subscription?: { plan: { name: string } } | null;
  }>,
  refunds: Array<{
    id: string;
    createdAt: Date;
    amount: { toString: () => string };
    reason?: string | null;
    payments: { users: { email: string } };
  }>
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  // Summary sheet
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 25 },
    { header: 'Value', key: 'value', width: 20 },
  ];

  const summary = reportData.summary as {
    totalRevenue: number;
    totalRefunds: number;
    netRevenue: number;
    transactionCount: number;
    refundCount: number;
  };
  summarySheet.addRows([
    { metric: 'Total Revenue', value: summary.totalRevenue },
    { metric: 'Total Refunds', value: summary.totalRefunds },
    { metric: 'Net Revenue', value: summary.netRevenue },
    { metric: 'Transaction Count', value: summary.transactionCount },
    { metric: 'Refund Count', value: summary.refundCount },
  ]);

  // Transactions sheet
  const transactionsSheet = workbook.addWorksheet('Transactions');
  transactionsSheet.columns = [
    { header: 'ID', key: 'id', width: 30 },
    { header: 'Date', key: 'date', width: 20 },
    { header: 'Amount', key: 'amount', width: 15 },
    { header: 'Currency', key: 'currency', width: 10 },
    { header: 'Provider', key: 'provider', width: 15 },
    { header: 'User', key: 'user', width: 30 },
    { header: 'Plan', key: 'plan', width: 20 },
  ];

  for (const p of payments) {
    transactionsSheet.addRow({
      id: p.id,
      date: p.paidAt,
      amount: Number(p.amount),
      currency: p.currency,
      provider: p.provider,
      users: p.users.email,
      plan: p.subscription?.plan.name || 'One-time',
    });
  }

  // Refunds sheet
  const refundsSheet = workbook.addWorksheet('Refunds');
  refundsSheet.columns = [
    { header: 'ID', key: 'id', width: 30 },
    { header: 'Date', key: 'date', width: 20 },
    { header: 'Amount', key: 'amount', width: 15 },
    { header: 'Reason', key: 'reason', width: 30 },
    { header: 'User', key: 'user', width: 30 },
  ];

  for (const r of refunds) {
    refundsSheet.addRow({
      id: r.id,
      date: r.createdAt,
      amount: Number(r.amount),
      reason: r.reason || '',
      users: r.payments.users.email,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

async function generateSubscriptionExcel(
  reportData: Record<string, unknown>,
  subscriptions: Array<{
    id: string;
    users: { email: string };
    plan: { name: string; tier: string };
    interval: string;
    provider: string;
    status: string;
    createdAt: Date;
    currentPeriodEnd: Date | null;
  }>
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  // Summary sheet
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 25 },
    { header: 'Value', key: 'value', width: 20 },
  ];

  const summary = reportData.summary as {
    activeSubscriptions: number;
    newSubscriptions: number;
    cancelledSubscriptions: number;
    netGrowth: number;
    currentMRR: number;
    currentARR: number;
  };
  summarySheet.addRows([
    { metric: 'Active Subscriptions', value: summary.activeSubscriptions },
    { metric: 'New Subscriptions', value: summary.newSubscriptions },
    { metric: 'Cancelled Subscriptions', value: summary.cancelledSubscriptions },
    { metric: 'Net Growth', value: summary.netGrowth },
    { metric: 'Current MRR', value: summary.currentMRR },
    { metric: 'Current ARR', value: summary.currentARR },
  ]);

  // Subscriptions sheet
  const subsSheet = workbook.addWorksheet('Subscriptions');
  subsSheet.columns = [
    { header: 'ID', key: 'id', width: 30 },
    { header: 'User', key: 'user', width: 30 },
    { header: 'Plan', key: 'plan', width: 20 },
    { header: 'Tier', key: 'tier', width: 15 },
    { header: 'Interval', key: 'interval', width: 15 },
    { header: 'Provider', key: 'provider', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Created', key: 'created', width: 20 },
    { header: 'Period End', key: 'periodEnd', width: 20 },
  ];

  for (const s of subscriptions) {
    subsSheet.addRow({
      id: s.id,
      users: s.users.email,
      plan: s.plan.name,
      tier: s.plan.tier,
      interval: s.interval,
      provider: s.provider,
      status: s.status,
      created: s.createdAt,
      periodEnd: s.currentPeriodEnd,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

async function generateInvoiceExcel(
  reportData: Record<string, unknown>,
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    createdAt: Date;
    users: { email: string };
    amountDue: { toString: () => string };
    amountPaid: { toString: () => string };
    status: string;
    dueDate: Date | null;
  }>
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  // Summary sheet
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 25 },
    { header: 'Value', key: 'value', width: 20 },
  ];

  const summary = reportData.summary as {
    totalInvoices: number;
    totalInvoiced: number;
    totalPaid: number;
    totalOutstanding: number;
    collectionRate: number;
  };
  summarySheet.addRows([
    { metric: 'Total Invoices', value: summary.totalInvoices },
    { metric: 'Total Invoiced', value: summary.totalInvoiced },
    { metric: 'Total Paid', value: summary.totalPaid },
    { metric: 'Total Outstanding', value: summary.totalOutstanding },
    { metric: 'Collection Rate (%)', value: summary.collectionRate.toFixed(2) },
  ]);

  // Invoices sheet
  const invoicesSheet = workbook.addWorksheet('Invoices');
  invoicesSheet.columns = [
    { header: 'Invoice #', key: 'number', width: 25 },
    { header: 'Date', key: 'date', width: 20 },
    { header: 'User', key: 'user', width: 30 },
    { header: 'Amount', key: 'amount', width: 15 },
    { header: 'Paid', key: 'paid', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Due Date', key: 'dueDate', width: 20 },
  ];

  for (const inv of invoices) {
    invoicesSheet.addRow({
      number: inv.invoiceNumber,
      date: inv.createdAt,
      users: inv.users.email,
      amount: Number(inv.amountDue),
      paid: Number(inv.amountPaid),
      status: inv.status,
      dueDate: inv.dueDate,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

async function generateAnalyticsExcel(
  reportData: Record<string, unknown>,
  snapshots: Array<{
    date: Date;
    mrr: { toString: () => string };
    arr: { toString: () => string };
    totalUsers: number;
    activeSubscriptions: number;
    churnRate: { toString: () => string };
  }>
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  // Metrics sheet
  const metricsSheet = workbook.addWorksheet('Current Metrics');
  metricsSheet.columns = [
    { header: 'Metric', key: 'metric', width: 25 },
    { header: 'Value', key: 'value', width: 20 },
  ];

  const revenue = reportData.currentMetrics as { mrr: number; arr: number; mrrGrowth: number; ltv: number };
  metricsSheet.addRows([
    { metric: 'MRR', value: revenue.mrr },
    { metric: 'ARR', value: revenue.arr },
    { metric: 'MRR Growth (%)', value: revenue.mrrGrowth.toFixed(2) },
    { metric: 'LTV', value: revenue.ltv },
  ]);

  // Trend sheet
  const trendSheet = workbook.addWorksheet('Trend');
  trendSheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'MRR', key: 'mrr', width: 15 },
    { header: 'ARR', key: 'arr', width: 15 },
    { header: 'Users', key: 'users', width: 12 },
    { header: 'Subscriptions', key: 'subs', width: 15 },
    { header: 'Churn Rate', key: 'churn', width: 12 },
  ];

  for (const s of snapshots) {
    trendSheet.addRow({
      date: s.date,
      mrr: Number(s.mrr),
      arr: Number(s.arr),
      users: s.totalUsers,
      subs: s.activeSubscriptions,
      churn: Number(s.churnRate),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// PDF generation helpers
function generateRevenuePDF(reportData: Record<string, unknown>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const period = reportData.period as { startDate: string; endDate: string };
    const summary = reportData.summary as {
      totalRevenue: number;
      totalRefunds: number;
      netRevenue: number;
      transactionCount: number;
      refundCount: number;
    };

    // Header
    doc.fontSize(20).text('Revenue Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(
      `Period: ${new Date(period.startDate).toLocaleDateString('tr-TR')} - ${new Date(period.endDate).toLocaleDateString('tr-TR')}`,
      { align: 'center' }
    );
    doc.moveDown(2);

    // Summary
    doc.fontSize(14).text('Summary', { underline: true });
    doc.moveDown();
    doc.fontSize(10);
    doc.text(`Total Revenue: ${summary.totalRevenue.toFixed(2)} TRY`);
    doc.text(`Total Refunds: ${summary.totalRefunds.toFixed(2)} TRY`);
    doc.text(`Net Revenue: ${summary.netRevenue.toFixed(2)} TRY`);
    doc.text(`Transaction Count: ${summary.transactionCount}`);
    doc.text(`Refund Count: ${summary.refundCount}`);

    doc.moveDown(2);

    // By Provider
    doc.fontSize(14).text('Revenue by Provider', { underline: true });
    doc.moveDown();
    doc.fontSize(10);
    const byProvider = reportData.byProvider as Array<{ provider: string; revenue: number; count: number }>;
    for (const p of byProvider) {
      doc.text(`${p.provider}: ${p.revenue.toFixed(2)} TRY (${p.count} transactions)`);
    }

    doc.moveDown(2);

    // By Month
    doc.fontSize(14).text('Revenue by Month', { underline: true });
    doc.moveDown();
    doc.fontSize(10);
    const byMonth = reportData.byMonth as Array<{ month: string; revenue: number; count: number }>;
    for (const m of byMonth) {
      doc.text(`${m.month}: ${m.revenue.toFixed(2)} TRY (${m.count} transactions)`);
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(8).text(`Generated: ${new Date().toISOString()}`, { align: 'right' });

    doc.end();
  });
}

function generateSubscriptionPDF(reportData: Record<string, unknown>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const period = reportData.period as { startDate: string; endDate: string };
    const summary = reportData.summary as {
      activeSubscriptions: number;
      newSubscriptions: number;
      cancelledSubscriptions: number;
      netGrowth: number;
      currentMRR: number;
      currentARR: number;
    };

    // Header
    doc.fontSize(20).text('Subscription Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(
      `Period: ${new Date(period.startDate).toLocaleDateString('tr-TR')} - ${new Date(period.endDate).toLocaleDateString('tr-TR')}`,
      { align: 'center' }
    );
    doc.moveDown(2);

    // Summary
    doc.fontSize(14).text('Summary', { underline: true });
    doc.moveDown();
    doc.fontSize(10);
    doc.text(`Active Subscriptions: ${summary.activeSubscriptions}`);
    doc.text(`New Subscriptions: ${summary.newSubscriptions}`);
    doc.text(`Cancelled Subscriptions: ${summary.cancelledSubscriptions}`);
    doc.text(`Net Growth: ${summary.netGrowth}`);
    doc.text(`Current MRR: ${summary.currentMRR.toFixed(2)} TRY`);
    doc.text(`Current ARR: ${summary.currentARR.toFixed(2)} TRY`);

    doc.moveDown(2);

    // By Tier
    doc.fontSize(14).text('Subscriptions by Tier', { underline: true });
    doc.moveDown();
    doc.fontSize(10);
    const byTier = reportData.byTier as Array<{ tier: string; count: number; mrr: number }>;
    for (const t of byTier) {
      doc.text(`${t.tier}: ${t.count} subscriptions (MRR: ${t.mrr.toFixed(2)} TRY)`);
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(8).text(`Generated: ${new Date().toISOString()}`, { align: 'right' });

    doc.end();
  });
}

function generateInvoicePDF(reportData: Record<string, unknown>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const period = reportData.period as { startDate: string; endDate: string };
    const summary = reportData.summary as {
      totalInvoices: number;
      totalInvoiced: number;
      totalPaid: number;
      totalOutstanding: number;
      collectionRate: number;
    };

    // Header
    doc.fontSize(20).text('Invoice Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(
      `Period: ${new Date(period.startDate).toLocaleDateString('tr-TR')} - ${new Date(period.endDate).toLocaleDateString('tr-TR')}`,
      { align: 'center' }
    );
    doc.moveDown(2);

    // Summary
    doc.fontSize(14).text('Summary', { underline: true });
    doc.moveDown();
    doc.fontSize(10);
    doc.text(`Total Invoices: ${summary.totalInvoices}`);
    doc.text(`Total Invoiced: ${summary.totalInvoiced.toFixed(2)} TRY`);
    doc.text(`Total Paid: ${summary.totalPaid.toFixed(2)} TRY`);
    doc.text(`Total Outstanding: ${summary.totalOutstanding.toFixed(2)} TRY`);
    doc.text(`Collection Rate: ${summary.collectionRate.toFixed(2)}%`);

    doc.moveDown(2);

    // By Status
    doc.fontSize(14).text('Invoices by Status', { underline: true });
    doc.moveDown();
    doc.fontSize(10);
    const byStatus = reportData.byStatus as Array<{ status: string; count: number; amount: number }>;
    for (const s of byStatus) {
      doc.text(`${s.status}: ${s.count} invoices (${s.amount.toFixed(2)} TRY)`);
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(8).text(`Generated: ${new Date().toISOString()}`, { align: 'right' });

    doc.end();
  });
}

function generateAnalyticsPDF(reportData: Record<string, unknown>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const period = reportData.period as { startDate: string; endDate: string };
    const metrics = reportData.currentMetrics as { mrr: number; arr: number; mrrGrowth: number; ltv: number };
    const userMetrics = reportData.userMetrics as {
      totalUsers: number;
      newUsersThisMonth: number;
      dailyActiveUsers: number;
    };
    const subMetrics = reportData.subscriptionMetrics as {
      activeSubscriptions: number;
      newSubscriptionsThisMonth: number;
      cancelledThisMonth: number;
    };

    // Header
    doc.fontSize(20).text('Analytics Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(
      `Period: ${new Date(period.startDate).toLocaleDateString('tr-TR')} - ${new Date(period.endDate).toLocaleDateString('tr-TR')}`,
      { align: 'center' }
    );
    doc.moveDown(2);

    // Revenue Metrics
    doc.fontSize(14).text('Revenue Metrics', { underline: true });
    doc.moveDown();
    doc.fontSize(10);
    doc.text(`MRR: ${metrics.mrr.toFixed(2)} TRY`);
    doc.text(`ARR: ${metrics.arr.toFixed(2)} TRY`);
    doc.text(`MRR Growth: ${metrics.mrrGrowth.toFixed(2)}%`);
    doc.text(`Average LTV: ${metrics.ltv.toFixed(2)} TRY`);

    doc.moveDown(2);

    // User Metrics
    doc.fontSize(14).text('User Metrics', { underline: true });
    doc.moveDown();
    doc.fontSize(10);
    doc.text(`Total Users: ${userMetrics.totalUsers}`);
    doc.text(`New Users (This Month): ${userMetrics.newUsersThisMonth}`);
    doc.text(`Daily Active Users: ${userMetrics.dailyActiveUsers}`);

    doc.moveDown(2);

    // Subscription Metrics
    doc.fontSize(14).text('Subscription Metrics', { underline: true });
    doc.moveDown();
    doc.fontSize(10);
    doc.text(`Active Subscriptions: ${subMetrics.activeSubscriptions}`);
    doc.text(`New Subscriptions (This Month): ${subMetrics.newSubscriptionsThisMonth}`);
    doc.text(`Cancelled (This Month): ${subMetrics.cancelledThisMonth}`);

    // Footer
    doc.moveDown(2);
    doc.fontSize(8).text(`Generated: ${new Date().toISOString()}`, { align: 'right' });

    doc.end();
  });
}

/**
 * Schedule report generation (for cron jobs)
 */
export async function generateScheduledReports() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  logger.info('Generating scheduled monthly reports');

  try {
    const [revenueReport, subscriptionReport, invoiceReport] = await Promise.all([
      generateRevenueReport(
        { startDate: startOfMonth, endDate: endOfMonth },
        { format: 'json' }
      ),
      generateSubscriptionReport(
        { startDate: startOfMonth, endDate: endOfMonth },
        { format: 'json' }
      ),
      generateInvoiceReport(
        { startDate: startOfMonth, endDate: endOfMonth },
        { format: 'json' }
      ),
    ]);

    logger.info('Monthly reports generated successfully');

    return {
      revenue: revenueReport,
      subscriptions: subscriptionReport,
      invoice: invoiceReport,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to generate scheduled reports');
    throw error;
  }
}
