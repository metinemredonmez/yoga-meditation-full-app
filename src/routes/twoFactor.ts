import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as twoFactorController from '../controllers/twoFactorController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get 2FA status
router.get('/status', twoFactorController.getStatus);

// Initialize 2FA setup (generates QR code and backup codes)
router.post('/setup', twoFactorController.initSetup);

// Verify and complete 2FA setup
router.post('/verify-setup', twoFactorController.verifySetup);

// Verify 2FA token (for login verification)
router.post('/verify', twoFactorController.verify);

// Disable 2FA (requires password)
router.post('/disable', twoFactorController.disableTwoFactor);

// Regenerate backup codes
router.post('/regenerate-codes', twoFactorController.regenerateCodes);

export default router;
