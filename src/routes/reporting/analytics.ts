import { Router } from 'express';
import { analyticsController } from '../../controllers/reporting';

const router = Router();

// Overview dashboard
router.get('/overview', analyticsController.getOverview);

// User analytics
router.get('/users', analyticsController.getUsers);

// Revenue analytics
router.get('/revenue', analyticsController.getRevenue);
router.get('/revenue/by-plan', analyticsController.getRevenueByPlan);
router.get('/revenue/by-country', analyticsController.getRevenueByCountry);

// Subscription analytics
router.get('/subscriptions', analyticsController.getSubscriptions);

// Content analytics
router.get('/content', analyticsController.getContent);

// Engagement analytics
router.get('/engagement', analyticsController.getEngagement);

// Instructor analytics
router.get('/instructors', analyticsController.getInstructors);
router.get('/instructors/:id', analyticsController.getInstructors);

// Real-time stats
router.get('/realtime', analyticsController.getRealtime);

// Period comparison
router.get('/compare', analyticsController.compare);

// Specific reports
router.get('/mrr', analyticsController.getMRR);
router.get('/arr', analyticsController.getARR);
router.get('/ltv', analyticsController.getLTV);
router.get('/churn', analyticsController.getChurn);
router.get('/retention', analyticsController.getRetention);

export default router;
