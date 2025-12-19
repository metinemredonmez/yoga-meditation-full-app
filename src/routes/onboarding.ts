import { Router } from 'express';
import * as onboardingController from '../controllers/onboardingController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Onboarding flow
router.get('/', onboardingController.getOnboarding);
router.post('/start', onboardingController.startOnboarding);
router.post('/answer', onboardingController.saveAnswer);
router.put('/', onboardingController.updateOnboarding);
router.post('/skip', onboardingController.skipOnboarding);
router.post('/complete', onboardingController.completeOnboarding);
router.post('/reset', onboardingController.resetOnboarding);

// Recommendations
router.get('/recommendations', onboardingController.getRecommendations);

export default router;
