import { Request, Response, NextFunction } from 'express';
import {
  getInvoice,
  getUserInvoices,
  getAllInvoices,
  getInvoicePdfUrl,
  voidInvoice,
  getInvoiceStats,
  generateInvoicePDF,
  createDetailedInvoice,
  markInvoiceAsPaid,
  createTaxRate,
  listTaxRates,
  updateTaxRate,
  deleteTaxRate,
  getTaxRateByCountry,
} from '../services/invoiceService';
import { logger } from '../utils/logger';

// ==================== User Endpoints ====================

/**
 * Get user's invoices
 */
export async function getUserInvoicesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as any;

    const result = await getUserInvoices(userId, { status, page, limit });

    res.json({
      success: true,
      data: result.invoices,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single invoice
 */
export async function getInvoiceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { invoiceId } = req.params;

    if (!invoiceId) {
      return res.status(400).json({ success: false, error: 'Invoice ID required' });
    }

    const invoice = await getInvoice(invoiceId);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found',
      });
    }

    // Verify the invoice belongs to the user
    if (invoice.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get invoice PDF URL
 */
export async function getInvoicePdfHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { invoiceId } = req.params;

    if (!invoiceId) {
      return res.status(400).json({ success: false, error: 'Invoice ID required' });
    }

    const invoice = await getInvoice(invoiceId);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found',
      });
    }

    // Verify the invoice belongs to the user
    if (invoice.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const pdfUrl = await getInvoicePdfUrl(invoiceId);

    if (!pdfUrl) {
      return res.status(404).json({
        success: false,
        error: 'Invoice PDF not available',
      });
    }

    return res.json({
      success: true,
      data: {
        pdfUrl,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ==================== Admin Endpoints ====================

/**
 * Get all invoices (admin)
 */
export async function getAllInvoicesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as any;
    const filterUserId = req.query.userId as string | undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const filters: any = { status, page, limit };
    if (filterUserId) filters.userId = filterUserId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const result = await getAllInvoices(filters);

    res.json({
      success: true,
      data: result.invoices,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get invoice by ID (admin)
 */
export async function getInvoiceByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { invoiceId } = req.params;

    if (!invoiceId) {
      return res.status(400).json({ success: false, error: 'Invoice ID required' });
    }

    const invoice = await getInvoice(invoiceId);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found',
      });
    }

    return res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Void an invoice (admin)
 */
export async function voidInvoiceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const adminUserId = req.user!.userId;
    const { invoiceId } = req.params;
    const { reason } = req.body;

    if (!invoiceId) {
      return res.status(400).json({ success: false, error: 'Invoice ID required' });
    }

    const invoice = await voidInvoice(invoiceId, reason);

    logger.info({ adminUserId, invoiceId, reason }, 'Invoice voided by admin');

    return res.json({
      success: true,
      data: invoice,
    });
  } catch (error: any) {
    if (error.message === 'Invoice not found') {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found',
      });
    }
    if (error.message.includes('Cannot void')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
}

/**
 * Get invoice statistics (admin)
 */
export async function getInvoiceStatsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const filters: any = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const stats = await getInvoiceStats(filters);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get invoice PDF URL (admin)
 */
export async function getInvoicePdfAdminHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { invoiceId } = req.params;

    if (!invoiceId) {
      return res.status(400).json({ success: false, error: 'Invoice ID required' });
    }

    const pdfUrl = await getInvoicePdfUrl(invoiceId);

    if (!pdfUrl) {
      return res.status(404).json({
        success: false,
        error: 'Invoice PDF not available',
      });
    }

    return res.json({
      success: true,
      data: {
        pdfUrl,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Download invoice PDF (generates on-the-fly)
 */
export async function downloadInvoicePdfHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { invoiceId } = req.params;

    if (!invoiceId) {
      return res.status(400).json({ success: false, error: 'Invoice ID required' });
    }

    const invoice = await getInvoice(invoiceId);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found',
      });
    }

    // Verify the invoice belongs to the user (unless admin or super admin)
    if (invoice.userId !== userId && req.user!.role !== 'ADMIN' && req.user!.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const pdfBuffer = await generateInvoicePDF(invoiceId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}

/**
 * Create detailed invoice (admin)
 */
export async function createDetailedInvoiceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      userId,
      subscriptionId,
      paymentId,
      invoiceType,
      items,
      currency,
      taxRate,
      discountAmount,
      billingName,
      billingEmail,
      billingAddress,
      billingCity,
      billingCountry,
      billingZip,
      taxId,
      notes,
      dueDate,
      periodStart,
      periodEnd,
    } = req.body;

    if (!userId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'userId and items are required',
      });
    }

    const invoice = await createDetailedInvoice({
      userId,
      subscriptionId,
      paymentId,
      invoiceType,
      items,
      currency,
      taxRate,
      discountAmount,
      billingName,
      billingEmail,
      billingAddress,
      billingCity,
      billingCountry,
      billingZip,
      taxId,
      notes,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      periodStart: periodStart ? new Date(periodStart) : undefined,
      periodEnd: periodEnd ? new Date(periodEnd) : undefined,
    });

    res.status(201).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark invoice as paid (admin)
 */
export async function markInvoicePaidHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { invoiceId } = req.params;
    const { amountPaid } = req.body;

    if (!invoiceId) {
      return res.status(400).json({ success: false, error: 'Invoice ID required' });
    }

    const invoice = await markInvoiceAsPaid(invoiceId, amountPaid);

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error: any) {
    if (error.message === 'Invoice not found') {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found',
      });
    }
    next(error);
  }
}

// ==================== Tax Rate Endpoints ====================

/**
 * List tax rates
 */
export async function listTaxRatesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const taxRates = await listTaxRates();
    res.json({
      success: true,
      data: taxRates,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get tax rate by country
 */
export async function getTaxRateByCountryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { country, state } = req.query;

    if (!country) {
      return res.status(400).json({
        success: false,
        error: 'Country is required',
      });
    }

    const rate = await getTaxRateByCountry(country as string, state as string | undefined);

    res.json({
      success: true,
      data: { rate },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create tax rate (admin)
 */
export async function createTaxRateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, country, state, rate, description, isDefault } = req.body;

    if (!name || !country || rate === undefined) {
      return res.status(400).json({
        success: false,
        error: 'name, country, and rate are required',
      });
    }

    const taxRate = await createTaxRate({
      name,
      country,
      state,
      rate,
      description,
      isDefault,
    });

    res.status(201).json({
      success: true,
      data: taxRate,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update tax rate (admin)
 */
export async function updateTaxRateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { name, rate, description, isActive, isDefault } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Tax rate ID required',
      });
    }

    const taxRate = await updateTaxRate(id, {
      name,
      rate,
      description,
      isActive,
      isDefault,
    });

    res.json({
      success: true,
      data: taxRate,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete tax rate (admin)
 */
export async function deleteTaxRateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Tax rate ID required',
      });
    }

    await deleteTaxRate(id);

    res.json({
      success: true,
      message: 'Tax rate deleted',
    });
  } catch (error) {
    next(error);
  }
}
