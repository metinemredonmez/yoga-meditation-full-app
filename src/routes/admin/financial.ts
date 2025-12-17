import { Router } from 'express';
import * as financialController from '../../controllers/admin/financialController';

const router = Router();

// Stats
router.get('/stats/revenue', financialController.getRevenueStats);
router.get('/stats/subscriptions', financialController.getSubscriptionStats);
router.get('/stats/coupons', financialController.getCouponStats);

// Payments
router.get('/payments', financialController.getPayments);
router.get('/payments/:id', financialController.getPaymentDetails);
router.post('/payments/:id/refund', financialController.processRefund);

// Subscriptions
router.get('/subscriptions', financialController.getSubscriptions);
router.post('/subscriptions/:id/cancel', financialController.cancelSubscription);
router.post('/subscriptions/:id/extend', financialController.extendSubscription);

// Coupons
router.get('/coupons', financialController.getCoupons);
router.post('/coupons', financialController.createCoupon);
router.get('/coupons/:id', financialController.getCouponDetails);
router.put('/coupons/:id', financialController.updateCoupon);
router.delete('/coupons/:id', financialController.deleteCoupon);

export default router;
