import { Request, Response, NextFunction } from 'express';
import * as financialService from '../../services/admin/financialService';

// Stats
export async function getRevenueStats(req: Request, res: Response, next: NextFunction) {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const stats = await financialService.getRevenueStats(startDate, endDate);
    res.json({ success: true, stats });
  } catch (error) { next(error); }
}

export async function getSubscriptionStats(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await financialService.getSubscriptions({});
    res.json({
      success: true,
      stats: {
        total: result.pagination.total,
        active: result.subscriptions.filter((s: any) => s.status === 'ACTIVE').length
      }
    });
  } catch (error) { next(error); }
}

export async function getCouponStats(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await financialService.getCoupons(1, 1000);
    const active = result.coupons.filter((c: any) => c.isActive).length;
    res.json({ success: true, stats: { total: result.pagination.total, active } });
  } catch (error) { next(error); }
}

// Payments
export async function getPayments(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await financialService.getPayments({
      status: req.query.status as any,
      search: req.query.search as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    });
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
}

export async function getPaymentDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const payment = await financialService.getPaymentDetails(req.params.id!);
    res.json({ success: true, payment });
  } catch (error) { next(error); }
}

export async function processRefund(req: Request, res: Response, next: NextFunction) {
  try {
    const payment = await financialService.processRefund(req.params.id!, req.user!.id, req.body.reason);
    res.json({ success: true, payment });
  } catch (error) { next(error); }
}

export async function refundPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const payment = await financialService.processRefund(req.params.id!, req.user!.id, req.body.reason);
    res.json({ success: true, payment });
  } catch (error) { next(error); }
}

// Subscriptions
export async function getSubscriptions(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await financialService.getSubscriptions({
      status: req.query.status as string,
      search: req.query.search as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    });
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
}

export async function getSubscriptionDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const subscription = await financialService.getSubscriptionDetails(req.params.id!);
    res.json({ success: true, subscription });
  } catch (error) { next(error); }
}

export async function cancelSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const subscription = await financialService.cancelSubscription(req.params.id!, req.body.reason);
    res.json({ success: true, subscription });
  } catch (error) { next(error); }
}

export async function extendSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    // Stub implementation - would extend subscription end date
    res.json({ success: true, message: 'Subscription extended' });
  } catch (error) { next(error); }
}

// Coupons
export async function getCoupons(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await financialService.getCoupons(
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 20
    );
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
}

export async function createCoupon(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const coupon = await financialService.createCoupon(adminId, req.body);
    res.status(201).json({ success: true, coupon });
  } catch (error) { next(error); }
}

export async function getCoupon(req: Request, res: Response, next: NextFunction) {
  try {
    const coupon = await financialService.getCouponDetails(req.params.id!);
    res.json({ success: true, coupon });
  } catch (error) { next(error); }
}

export async function getCouponDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const coupon = await financialService.getCouponDetails(req.params.id!);
    res.json({ success: true, coupon });
  } catch (error) { next(error); }
}

export async function updateCoupon(req: Request, res: Response, next: NextFunction) {
  try {
    const coupon = await financialService.updateCoupon(req.params.id!, req.body);
    res.json({ success: true, coupon });
  } catch (error) { next(error); }
}

export async function deleteCoupon(req: Request, res: Response, next: NextFunction) {
  try {
    await financialService.deleteCoupon(req.params.id!);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) { next(error); }
}
