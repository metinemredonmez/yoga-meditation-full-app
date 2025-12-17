import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateQuery } from '../middleware/validateRequest';
import * as customizationController from '../controllers/customizationController';
import { titleQuerySchema, frameQuerySchema } from '../validation/gamificationSchemas';

const router = Router();

// ============================================
// Title Routes
// ============================================

// Get all titles
router.get('/titles', validateQuery(titleQuerySchema), customizationController.getTitles);

// Get title by ID
router.get('/titles/:id', customizationController.getTitleById);

// Get user's titles
router.get('/titles/user/list', authenticate, customizationController.getUserTitles);

// Equip title
router.post('/titles/:id/equip', authenticate, customizationController.equipTitle);

// Unequip title
router.post('/titles/unequip', authenticate, customizationController.unequipTitle);

// ============================================
// Avatar Frame Routes
// ============================================

// Get all frames
router.get('/frames', validateQuery(frameQuerySchema), customizationController.getFrames);

// Get frame by ID
router.get('/frames/:id', customizationController.getFrameById);

// Get user's frames
router.get('/frames/user/list', authenticate, customizationController.getUserFrames);

// Equip frame
router.post('/frames/:id/equip', authenticate, customizationController.equipFrame);

// Unequip frame
router.post('/frames/unequip', authenticate, customizationController.unequipFrame);

export default router;
