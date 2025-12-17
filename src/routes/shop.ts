import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validateQuery } from '../middleware/validateRequest';
import * as shopController from '../controllers/shopController';
import { shopQuerySchema, leaderboardQuerySchema } from '../validation/gamificationSchemas';

const router = Router();

// ============================================
// Shop Item Routes
// ============================================

// Get shop items (public, but shows user-specific availability if authenticated)
router.get('/', optionalAuth, validateQuery(shopQuerySchema), shopController.getShopItems);

// Get shop item by ID
router.get('/item/:id', shopController.getShopItemById);

// ============================================
// Purchase Routes (Authenticated)
// ============================================

// Purchase item
router.post('/purchase/:itemId', authenticate, shopController.purchaseItem);

// Use purchased item
router.post('/use/:id', authenticate, shopController.usePurchase);

// ============================================
// Purchase History
// ============================================

// Get purchase history
router.get(
  '/history',
  authenticate,
  validateQuery(leaderboardQuerySchema),
  shopController.getPurchaseHistory,
);

// Get unused purchases
router.get('/unused', authenticate, shopController.getUnusedPurchases);

export default router;
