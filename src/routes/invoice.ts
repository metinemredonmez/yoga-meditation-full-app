import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  getUserInvoicesHandler,
  getInvoiceHandler,
  getInvoicePdfHandler,
  getAllInvoicesHandler,
  getInvoiceByIdHandler,
  voidInvoiceHandler,
  getInvoiceStatsHandler,
  getInvoicePdfAdminHandler,
  downloadInvoicePdfHandler,
  createDetailedInvoiceHandler,
  markInvoicePaidHandler,
  listTaxRatesHandler,
  getTaxRateByCountryHandler,
  createTaxRateHandler,
  updateTaxRateHandler,
  deleteTaxRateHandler,
} from '../controllers/invoiceController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Invoices
 *   description: Invoice management
 */

// ==================== User Routes ====================

/**
 * @swagger
 * /api/invoices:
 *   get:
 *     summary: Get user's invoices
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, OPEN, PAID, VOID, UNCOLLECTIBLE]
 *     responses:
 *       200:
 *         description: User's invoices
 */
router.get('/', authenticate, getUserInvoicesHandler);

/**
 * @swagger
 * /api/invoices/{invoiceId}:
 *   get:
 *     summary: Get single invoice
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice details
 *       404:
 *         description: Invoice not found
 */
router.get('/:invoiceId', authenticate, getInvoiceHandler);

/**
 * @swagger
 * /api/invoices/{invoiceId}/pdf:
 *   get:
 *     summary: Get invoice PDF URL
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF URL
 *       404:
 *         description: Invoice or PDF not found
 */
router.get('/:invoiceId/pdf', authenticate, getInvoicePdfHandler);

// ==================== Admin Routes ====================

/**
 * @swagger
 * /api/invoices/admin/all:
 *   get:
 *     summary: Get all invoices (admin)
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: All invoices
 */
router.get('/admin/all', authenticate, requireAdmin, getAllInvoicesHandler);

/**
 * @swagger
 * /api/invoices/admin/stats:
 *   get:
 *     summary: Get invoice statistics (admin)
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Invoice statistics
 */
router.get('/admin/stats', authenticate, requireAdmin, getInvoiceStatsHandler);

/**
 * @swagger
 * /api/invoices/admin/{invoiceId}:
 *   get:
 *     summary: Get invoice by ID (admin)
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice details
 *       404:
 *         description: Invoice not found
 */
router.get('/admin/:invoiceId', authenticate, requireAdmin, getInvoiceByIdHandler);

/**
 * @swagger
 * /api/invoices/admin/{invoiceId}/pdf:
 *   get:
 *     summary: Get invoice PDF URL (admin)
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF URL
 */
router.get('/admin/:invoiceId/pdf', authenticate, requireAdmin, getInvoicePdfAdminHandler);

/**
 * @swagger
 * /api/invoices/admin/{invoiceId}/void:
 *   post:
 *     summary: Void an invoice (admin)
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invoice voided
 *       400:
 *         description: Cannot void this invoice
 *       404:
 *         description: Invoice not found
 */
router.post('/admin/:invoiceId/void', authenticate, requireAdmin, voidInvoiceHandler);

/**
 * @swagger
 * /api/invoices/admin/{invoiceId}/mark-paid:
 *   post:
 *     summary: Mark invoice as paid (admin)
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amountPaid:
 *                 type: number
 *     responses:
 *       200:
 *         description: Invoice marked as paid
 *       404:
 *         description: Invoice not found
 */
router.post('/admin/:invoiceId/mark-paid', authenticate, requireAdmin, markInvoicePaidHandler);

/**
 * @swagger
 * /api/invoices/admin/create:
 *   post:
 *     summary: Create detailed invoice (admin)
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - items
 *             properties:
 *               userId:
 *                 type: string
 *               subscriptionId:
 *                 type: string
 *               paymentId:
 *                 type: string
 *               invoiceType:
 *                 type: string
 *                 enum: [SUBSCRIPTION, ONE_TIME, REFUND, CREDIT]
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     description:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unitPrice:
 *                       type: number
 *               currency:
 *                 type: string
 *               taxRate:
 *                 type: number
 *               discountAmount:
 *                 type: number
 *               billingName:
 *                 type: string
 *               billingEmail:
 *                 type: string
 *               billingAddress:
 *                 type: string
 *               billingCity:
 *                 type: string
 *               billingCountry:
 *                 type: string
 *               billingZip:
 *                 type: string
 *               taxId:
 *                 type: string
 *               notes:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date
 *               periodStart:
 *                 type: string
 *                 format: date
 *               periodEnd:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Invoice created
 */
router.post('/admin/create', authenticate, requireAdmin, createDetailedInvoiceHandler);

/**
 * @swagger
 * /api/invoices/{invoiceId}/download:
 *   get:
 *     summary: Download invoice PDF
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Invoice not found
 */
router.get('/:invoiceId/download', authenticate, downloadInvoicePdfHandler);

// ==================== Tax Rate Routes ====================

/**
 * @swagger
 * /api/invoices/tax-rates:
 *   get:
 *     summary: List all tax rates
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tax rates list
 */
router.get('/tax-rates', authenticate, listTaxRatesHandler);

/**
 * @swagger
 * /api/invoices/tax-rates/by-country:
 *   get:
 *     summary: Get tax rate by country
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: country
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tax rate for country
 */
router.get('/tax-rates/by-country', authenticate, getTaxRateByCountryHandler);

/**
 * @swagger
 * /api/invoices/admin/tax-rates:
 *   post:
 *     summary: Create tax rate (admin)
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - country
 *               - rate
 *             properties:
 *               name:
 *                 type: string
 *               country:
 *                 type: string
 *               state:
 *                 type: string
 *               rate:
 *                 type: number
 *               description:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Tax rate created
 */
router.post('/admin/tax-rates', authenticate, requireAdmin, createTaxRateHandler);

/**
 * @swagger
 * /api/invoices/admin/tax-rates/{id}:
 *   put:
 *     summary: Update tax rate (admin)
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               rate:
 *                 type: number
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tax rate updated
 */
router.put('/admin/tax-rates/:id', authenticate, requireAdmin, updateTaxRateHandler);

/**
 * @swagger
 * /api/invoices/admin/tax-rates/{id}:
 *   delete:
 *     summary: Delete tax rate (admin)
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tax rate deleted
 */
router.delete('/admin/tax-rates/:id', authenticate, requireAdmin, deleteTaxRateHandler);

export default router;
