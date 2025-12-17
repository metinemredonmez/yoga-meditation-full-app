import { prisma } from '../../utils/database';
import { Prisma, PaymentStatus, CouponType } from '@prisma/client';
import { HttpError } from '../../middleware/errorHandler';

const toNumber = (val: Prisma.Decimal | number | null) => {
  if (val === null) return 0;
  if (typeof val === 'number') return val;
  return parseFloat(val.toString());
};

export async function getPayments(options: { status?: PaymentStatus; search?: string; startDate?: Date; endDate?: Date; page?: number; limit?: number }) {
  const { status, search, startDate, endDate, page = 1, limit = 20 } = options;
  const where: Prisma.PaymentWhereInput = {};
  if (status) where.status = status;
  if (startDate || endDate) { where.createdAt = {}; if (startDate) (where.createdAt as any).gte = startDate; if (endDate) (where.createdAt as any).lte = endDate; }
  if (search) where.OR = [{ user: { email: { contains: search, mode: 'insensitive' } } }];
  const [payments, total] = await Promise.all([
    prisma.payment.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } } }),
    prisma.payment.count({ where }),
  ]);
  return { payments, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getPaymentDetails(paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } } });
  if (!payment) throw new HttpError(404, 'Payment not found');
  return payment;
}

export async function processRefund(paymentId: string, _adminId: string, reason?: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new HttpError(404, 'Payment not found');
  if (payment.status === 'REFUNDED') throw new HttpError(400, 'Already refunded');
  return prisma.payment.update({ where: { id: paymentId }, data: { status: 'REFUNDED' } });
}

export async function getSubscriptions(options: { status?: string; search?: string; page?: number; limit?: number }) {
  const { status, search, page = 1, limit = 20 } = options;
  const where: Prisma.SubscriptionWhereInput = {};
  if (status) where.status = status as any;
  if (search) where.OR = [{ user: { email: { contains: search, mode: 'insensitive' } } }];
  const [subscriptions, total] = await Promise.all([
    prisma.subscription.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, email: true, firstName: true, lastName: true } }, plan: true } }),
    prisma.subscription.count({ where }),
  ]);
  return { subscriptions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getSubscriptionDetails(subscriptionId: string) {
  const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId }, include: { user: { select: { id: true, email: true, firstName: true, lastName: true } }, plan: true } });
  if (!subscription) throw new HttpError(404, 'Subscription not found');
  return subscription;
}

export async function cancelSubscription(subscriptionId: string, reason?: string) {
  return prisma.subscription.update({ where: { id: subscriptionId }, data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: reason } });
}

export async function getRevenueStats(startDate?: Date, endDate?: Date) {
  const where: Prisma.PaymentWhereInput = { status: 'COMPLETED' };
  if (startDate || endDate) { where.createdAt = {}; if (startDate) (where.createdAt as any).gte = startDate; if (endDate) (where.createdAt as any).lte = endDate; }
  const aggregate = await prisma.payment.aggregate({ where, _sum: { amount: true }, _count: true, _avg: { amount: true } });
  return { totalRevenue: toNumber(aggregate._sum.amount), transactionCount: aggregate._count, averageTransaction: toNumber(aggregate._avg.amount) };
}

export async function getCoupons(page = 1, limit = 20) {
  const [coupons, total] = await Promise.all([prisma.coupon.findMany({ skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }), prisma.coupon.count()]);
  return { coupons, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function createCoupon(adminId: string, data: { code: string; discountType: 'PERCENTAGE' | 'FIXED'; discountValue: number; maxUses?: number; expiresAt?: Date }) {
  return prisma.coupon.create({
    data: {
      code: data.code.toUpperCase(),
      type: data.discountType as CouponType,
      value: data.discountValue,
      maxUses: data.maxUses,
      expiresAt: data.expiresAt,
      isActive: true,
      createdById: adminId,
    },
  });
}

export async function updateCoupon(couponId: string, data: { code?: string; isActive?: boolean }) {
  return prisma.coupon.update({ where: { id: couponId }, data: { ...data, code: data.code?.toUpperCase() } });
}

export async function deleteCoupon(couponId: string) {
  await prisma.coupon.delete({ where: { id: couponId } });
  return { success: true };
}

export async function getCouponDetails(couponId: string) {
  const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
  if (!coupon) throw new HttpError(404, 'Coupon not found');
  return coupon;
}
