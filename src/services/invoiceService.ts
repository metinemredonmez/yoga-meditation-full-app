import { InvoiceStatus, InvoiceType, Prisma } from '@prisma/client';
import { prisma } from '../utils/database';
import { getStripeClient, isStripeConfigured } from '../utils/stripe';
import { logger } from '../utils/logger';
import PDFDocument from 'pdfkit';

/**
 * Generate unique invoice number
 */
function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${year}${month}-${random}`;
}

/**
 * Create invoice from payment
 */
export async function createInvoiceFromPayment(paymentId: string) {
  const payment = await prisma.payments.findUnique({
    where: { id: paymentId },
    include: { users: true, subscriptions: true },
  });

  if (!payment) {
    throw new Error('Payment not found');
  }

  // Check if invoice already exists for this payment
  const existingInvoice = await prisma.invoices.findFirst({
    where: { paymentId },
  });

  if (existingInvoice) {
    return existingInvoice;
  }

  const invoice = await prisma.invoices.create({
    data: {
      userId: payment.userId,
      subscriptionId: payment.subscriptionId,
      paymentId: payment.id,
      stripeInvoiceId: payment.stripeInvoiceId,
      invoiceNumber: generateInvoiceNumber(),
      subtotal: payment.amount,
      amountDue: payment.amount,
      amountPaid: payment.status === 'COMPLETED' ? payment.amount : new Prisma.Decimal(0),
      currency: payment.currency,
      status: payment.status === 'COMPLETED' ? 'PAID' : 'OPEN',
      paidAt: payment.paidAt,
    },
  });

  logger.info({ invoiceId: invoice.id, paymentId }, 'Invoice created from payment');

  return invoice;
}

/**
 * Get invoice by ID
 */
export async function getInvoice(invoiceId: string) {
  return prisma.invoices.findUnique({
    where: { id: invoiceId },
    include: {
      users: { select: { id: true, email: true, firstName: true, lastName: true } },
      subscriptions: { include: { plan: true } },
      payments: true,
    },
  });
}

/**
 * Get invoices for a user
 */
export async function getUserInvoices(
  userId: string,
  filters?: {
    status?: InvoiceStatus;
    page?: number;
    limit?: number;
  }
) {
  const where: Prisma.invoicesWhereInput = { userId };

  if (filters?.status) {
    where.status = filters.status;
  }

  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const skip = (page - 1) * limit;

  const [invoices, total] = await Promise.all([
    prisma.invoices.findMany({
      where,
      include: {
        subscriptions: { include: { plan: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.invoices.count({ where }),
  ]);

  return {
    invoices,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get all invoices (admin)
 */
export async function getAllInvoices(filters?: {
  status?: InvoiceStatus;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const where: Prisma.invoicesWhereInput = {};

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.userId) {
    where.userId = filters.userId;
  }

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const skip = (page - 1) * limit;

  const [invoices, total] = await Promise.all([
    prisma.invoices.findMany({
      where,
      include: {
        users: { select: { id: true, email: true, firstName: true, lastName: true } },
        subscriptions: { include: { plan: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.invoices.count({ where }),
  ]);

  return {
    invoices,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get invoice PDF URL
 */
export async function getInvoicePdfUrl(invoiceId: string): Promise<string | null> {
  const invoice = await prisma.invoices.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice) {
    return null;
  }

  // If we have a Stripe invoice ID, get the PDF from Stripe
  if (invoice.stripeInvoiceId && isStripeConfigured()) {
    const stripe = getStripeClient();
    const stripeInvoice = await stripe.invoices.retrieve(invoice.stripeInvoiceId);
    return stripeInvoice.invoice_pdf || null;
  }

  // Return stored PDF URL if available
  return invoice.invoicePdf;
}

/**
 * Void an invoice
 */
export async function voidInvoice(invoiceId: string, reason?: string) {
  const invoice = await prisma.invoices.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  if (invoice.status === 'PAID') {
    throw new Error('Cannot void a paid invoice');
  }

  if (invoice.status === 'VOID') {
    throw new Error('Invoice is already voided');
  }

  // Void in Stripe if applicable
  if (invoice.stripeInvoiceId && isStripeConfigured()) {
    const stripe = getStripeClient();
    await stripe.invoices.voidInvoice(invoice.stripeInvoiceId);
  }

  const updated = await prisma.invoices.update({
    where: { id: invoiceId },
    data: { status: 'VOID' },
  });

  logger.info({ invoiceId, reason }, 'Invoice voided');

  return updated;
}

/**
 * Process Stripe invoice webhook
 */
export async function processStripeInvoiceWebhook(stripeInvoice: {
  id: string;
  customer: string;
  subscriptions: string | null;
  status: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  invoice_pdf: string | null;
  paid: boolean;
  due_date: number | null;
}) {
  // Find user by Stripe customer ID
  const user = await prisma.users.findFirst({
    where: { stripeCustomerId: stripeInvoice.customer },
  });

  if (!user) {
    logger.warn({ stripeCustomerId: stripeInvoice.customer }, 'User not found for Stripe invoice');
    return;
  }

  // Find subscription if available
  let subscriptionId: string | undefined;
  if (stripeInvoice.subscriptions) {
    const subscription = await prisma.subscriptions.findFirst({
      where: { stripeSubscriptionId: stripeInvoice.subscriptions },
    });
    subscriptionId = subscription?.id;
  }

  // Check if invoice already exists
  let invoice = await prisma.invoices.findFirst({
    where: { stripeInvoiceId: stripeInvoice.id },
  });

  const invoiceStatus = mapStripeInvoiceStatus(stripeInvoice.status);

  if (invoice) {
    // Update existing invoice
    invoice = await prisma.invoices.update({
      where: { id: invoice.id },
      data: {
        status: invoiceStatus,
        amountPaid: new Prisma.Decimal(stripeInvoice.amount_paid / 100),
        invoicePdf: stripeInvoice.invoice_pdf,
        paidAt: stripeInvoice.paid ? new Date() : null,
      },
    });
  } else {
    // Create new invoice
    invoice = await prisma.invoices.create({
      data: {
        userId: user.id,
        subscriptionId,
        stripeInvoiceId: stripeInvoice.id,
        invoiceNumber: generateInvoiceNumber(),
        subtotal: new Prisma.Decimal(stripeInvoice.amount_due / 100),
        amountDue: new Prisma.Decimal(stripeInvoice.amount_due / 100),
        amountPaid: new Prisma.Decimal(stripeInvoice.amount_paid / 100),
        currency: stripeInvoice.currency.toUpperCase(),
        status: invoiceStatus,
        invoicePdf: stripeInvoice.invoice_pdf || undefined,
        dueDate: stripeInvoice.due_date ? new Date(stripeInvoice.due_date * 1000) : null,
        paidAt: stripeInvoice.paid ? new Date() : null,
      },
    });
  }

  logger.info(
    { invoiceId: invoice.id, stripeInvoiceId: stripeInvoice.id, status: invoiceStatus },
    'Stripe invoice webhook processed'
  );

  return invoice;
}

function mapStripeInvoiceStatus(stripeStatus: string): InvoiceStatus {
  switch (stripeStatus) {
    case 'draft':
      return 'DRAFT';
    case 'open':
      return 'OPEN';
    case 'paid':
      return 'PAID';
    case 'void':
      return 'VOID';
    case 'uncollectible':
      return 'UNCOLLECTIBLE';
    default:
      return 'DRAFT';
  }
}

/**
 * Get invoice statistics
 */
export async function getInvoiceStats(filters?: {
  startDate?: Date;
  endDate?: Date;
}) {
  const where: Prisma.invoicesWhereInput = {};

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  const [
    totalInvoices,
    paidInvoices,
    openInvoices,
    voidedInvoices,
    totalRevenue,
  ] = await Promise.all([
    prisma.invoices.count({ where }),
    prisma.invoices.count({ where: { ...where, status: 'PAID' } }),
    prisma.invoices.count({ where: { ...where, status: 'OPEN' } }),
    prisma.invoices.count({ where: { ...where, status: 'VOID' } }),
    prisma.invoices.aggregate({
      where: { ...where, status: 'PAID' },
      _sum: { amountPaid: true },
    }),
  ]);

  return {
    totalInvoices,
    paidInvoices,
    openInvoices,
    voidedInvoices,
    totalRevenue: Number(totalRevenue._sum.amountPaid) || 0,
  };
}

/**
 * Create a detailed invoice with items
 */
export interface CreateDetailedInvoiceInput {
  userId: string;
  subscriptionId?: string;
  paymentId?: string;
  invoiceType?: InvoiceType;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
  currency?: string;
  taxRate?: number;
  discountAmount?: number;
  billingName?: string;
  billingEmail?: string;
  billingAddress?: string;
  billingCity?: string;
  billingCountry?: string;
  billingZip?: string;
  taxId?: string;
  notes?: string;
  dueDate?: Date;
  periodStart?: Date;
  periodEnd?: Date;
}

export async function createDetailedInvoice(input: CreateDetailedInvoiceInput) {
  const invoiceNumber = generateInvoiceNumber();

  // Calculate subtotal from items
  const subtotal = input.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  // Calculate tax
  const taxRate = input.taxRate || 0;
  const taxAmount = subtotal * taxRate;

  // Calculate discount
  const discountAmount = input.discountAmount || 0;

  // Calculate amount due
  const amountDue = subtotal + taxAmount - discountAmount;

  const invoice = await prisma.invoices.create({
    data: {
      userId: input.userId,
      subscriptionId: input.subscriptionId,
      paymentId: input.paymentId,
      invoiceNumber,
      invoiceType: input.invoiceType || InvoiceType.SUBSCRIPTION,
      subtotal: new Prisma.Decimal(subtotal),
      taxAmount: new Prisma.Decimal(taxAmount),
      taxRate: new Prisma.Decimal(taxRate),
      discountAmount: new Prisma.Decimal(discountAmount),
      amountDue: new Prisma.Decimal(amountDue),
      currency: input.currency || 'TRY',
      status: InvoiceStatus.DRAFT,
      billingName: input.billingName,
      billingEmail: input.billingEmail,
      billingAddress: input.billingAddress,
      billingCity: input.billingCity,
      billingCountry: input.billingCountry,
      billingZip: input.billingZip,
      taxId: input.taxId,
      notes: input.notes,
      dueDate: input.dueDate,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      invoice_items: {
        create: input.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: new Prisma.Decimal(item.unitPrice),
          amount: new Prisma.Decimal(item.quantity * item.unitPrice),
        })),
      },
    },
    include: {
      invoice_items: true,
      users: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  logger.info({ invoiceId: invoice.id, invoiceNumber }, 'Detailed invoice created');
  return invoice;
}

/**
 * Mark invoice as paid
 */
export async function markInvoiceAsPaid(invoiceId: string, amountPaid?: number) {
  const invoice = await prisma.invoices.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  const paidAmount = amountPaid || Number(invoice.amountDue);

  const updatedInvoice = await prisma.invoices.update({
    where: { id: invoiceId },
    data: {
      status: InvoiceStatus.PAID,
      amountPaid: new Prisma.Decimal(paidAmount),
      paidAt: new Date(),
    },
    include: {
      invoice_items: true,
    },
  });

  logger.info({ invoiceId, amountPaid: paidAmount }, 'Invoice marked as paid');
  return updatedInvoice;
}

/**
 * Generate PDF for an invoice
 */
export async function generateInvoicePDF(invoiceId: string): Promise<Buffer> {
  const invoice = await prisma.invoices.findUnique({
    where: { id: invoiceId },
    include: {
      invoice_items: true,
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
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).text('FATURA / INVOICE', { align: 'center' });
    doc.moveDown();

    // Company Info
    doc.fontSize(12).text('Yoga App', { align: 'left' });
    doc.fontSize(10).text('Istanbul, Turkey', { align: 'left' });
    doc.moveDown();

    // Invoice Details
    doc.fontSize(10);
    doc.text(`Fatura No: ${invoice.invoiceNumber}`);
    doc.text(`Tarih: ${invoice.createdAt.toLocaleDateString('tr-TR')}`);
    if (invoice.dueDate) {
      doc.text(`Vade Tarihi: ${invoice.dueDate.toLocaleDateString('tr-TR')}`);
    }
    doc.text(`Durum: ${invoice.status}`);
    doc.moveDown();

    // Billing Info
    doc.fontSize(12).text('Fatura Bilgileri:', { underline: true });
    doc.fontSize(10);
    if (invoice.billingName) doc.text(`Ad: ${invoice.billingName}`);
    if (invoice.billingEmail) doc.text(`E-posta: ${invoice.billingEmail}`);
    if (invoice.billingAddress) doc.text(`Adres: ${invoice.billingAddress}`);
    if (invoice.billingCity) doc.text(`Sehir: ${invoice.billingCity}`);
    if (invoice.billingCountry) doc.text(`Ulke: ${invoice.billingCountry}`);
    if (invoice.taxId) doc.text(`Vergi No: ${invoice.taxId}`);
    doc.moveDown();

    // Period
    if (invoice.periodStart && invoice.periodEnd) {
      doc.text(
        `Donem: ${invoice.periodStart.toLocaleDateString('tr-TR')} - ${invoice.periodEnd.toLocaleDateString('tr-TR')}`
      );
      doc.moveDown();
    }

    // Items Table Header
    const tableTop = doc.y;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Aciklama', 50, tableTop);
    doc.text('Adet', 300, tableTop, { width: 50, align: 'center' });
    doc.text('Birim Fiyat', 350, tableTop, { width: 80, align: 'right' });
    doc.text('Tutar', 450, tableTop, { width: 80, align: 'right' });
    doc.moveDown();

    // Items
    doc.font('Helvetica');
    let y = doc.y;
    for (const item of invoice.invoice_items) {
      doc.text(item.description, 50, y, { width: 240 });
      doc.text(String(item.quantity), 300, y, { width: 50, align: 'center' });
      doc.text(`${Number(item.unitPrice).toFixed(2)} ${invoice.currency}`, 350, y, {
        width: 80,
        align: 'right',
      });
      doc.text(`${Number(item.amount).toFixed(2)} ${invoice.currency}`, 450, y, {
        width: 80,
        align: 'right',
      });
      y += 20;
    }

    doc.moveDown(2);

    // Totals
    const totalsX = 350;
    y = doc.y;

    doc.text('Ara Toplam:', totalsX, y);
    doc.text(`${Number(invoice.subtotal).toFixed(2)} ${invoice.currency}`, 450, y, {
      width: 80,
      align: 'right',
    });
    y += 15;

    if (Number(invoice.taxAmount) > 0) {
      doc.text(`KDV (%${Number(invoice.taxRate) * 100}):`, totalsX, y);
      doc.text(`${Number(invoice.taxAmount).toFixed(2)} ${invoice.currency}`, 450, y, {
        width: 80,
        align: 'right',
      });
      y += 15;
    }

    if (Number(invoice.discountAmount) > 0) {
      doc.text('Indirim:', totalsX, y);
      doc.text(`-${Number(invoice.discountAmount).toFixed(2)} ${invoice.currency}`, 450, y, {
        width: 80,
        align: 'right',
      });
      y += 15;
    }

    doc.font('Helvetica-Bold');
    doc.text('Toplam:', totalsX, y);
    doc.text(`${Number(invoice.amountDue).toFixed(2)} ${invoice.currency}`, 450, y, {
      width: 80,
      align: 'right',
    });

    // Notes
    if (invoice.notes) {
      doc.moveDown(2);
      doc.font('Helvetica');
      doc.fontSize(10).text('Notlar:', { underline: true });
      doc.text(invoice.notes);
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(8).text('Bu fatura elektronik olarak olusturulmustur.', {
      align: 'center',
    });

    doc.end();
  });
}

/**
 * Save invoice PDF path
 */
export async function saveInvoicePdfPath(invoiceId: string, pdfPath: string): Promise<void> {
  await prisma.invoices.update({
    where: { id: invoiceId },
    data: { invoicePdf: pdfPath },
  });

  logger.info({ invoiceId, pdfPath }, 'Invoice PDF path saved');
}

/**
 * Get tax rate by country
 */
export async function getTaxRateByCountry(country: string, state?: string): Promise<number> {
  const taxRate = await prisma.tax_rates.findFirst({
    where: {
      country,
      state: state || null,
      isActive: true,
    },
  });

  if (taxRate) {
    return Number(taxRate.rate);
  }

  // Return default tax rate if no specific rate found
  const defaultRate = await prisma.tax_rates.findFirst({
    where: {
      isDefault: true,
      isActive: true,
    },
  });

  return defaultRate ? Number(defaultRate.rate) : 0;
}

/**
 * Create tax rate
 */
export async function createTaxRate(data: {
  name: string;
  country: string;
  state?: string;
  rate: number;
  description?: string;
  isDefault?: boolean;
}) {
  return prisma.tax_rates.create({
    data: {
      name: data.name,
      country: data.country,
      state: data.state,
      rate: new Prisma.Decimal(data.rate),
      description: data.description,
      isDefault: data.isDefault || false,
    },
  });
}

/**
 * List all tax rates
 */
export async function listTaxRates() {
  return prisma.tax_rates.findMany({
    where: { isActive: true },
    orderBy: [{ isDefault: 'desc' }, { country: 'asc' }],
  });
}

/**
 * Update tax rate
 */
export async function updateTaxRate(
  id: string,
  data: {
    name?: string;
    rate?: number;
    description?: string;
    isActive?: boolean;
    isDefault?: boolean;
  }
) {
  return prisma.tax_rates.update({
    where: { id },
    data: {
      name: data.name,
      rate: data.rate !== undefined ? new Prisma.Decimal(data.rate) : undefined,
      description: data.description,
      isActive: data.isActive,
      isDefault: data.isDefault,
    },
  });
}

/**
 * Delete tax rate
 */
export async function deleteTaxRate(id: string) {
  return prisma.tax_rates.update({
    where: { id },
    data: { isActive: false },
  });
}
