import { Router } from 'express';
import * as analyticsController from '../../controllers/admin/analyticsController';

const router = Router();

router.get('/users', analyticsController.getUserAnalytics);
router.get('/content', analyticsController.getContentAnalytics);
router.get('/revenue', analyticsController.getRevenueAnalytics);
router.get('/challenges', analyticsController.getChallengeAnalytics);
router.get('/realtime', analyticsController.getRealTimeStats);

export default router;
