import { Router } from 'express';
import * as settingsController from '../../controllers/admin/settingsController';

const router = Router();

// System Settings
router.get('/system', settingsController.getSettings);
router.get('/system/public', settingsController.getPublicSettings);
router.get('/system/:key', settingsController.getSetting);
router.put('/system/:key', settingsController.setSetting);
router.delete('/system/:key', settingsController.deleteSetting);

// Feature Flags
router.get('/features', settingsController.getFeatureFlags);
router.post('/features', settingsController.createFeatureFlag);
router.get('/features/:key', settingsController.getFeatureFlag);
router.get('/features/:key/check', settingsController.checkFeatureFlag);
router.put('/features/:key', settingsController.updateFeatureFlag);
router.post('/features/:key/toggle', settingsController.toggleFeatureFlag);
router.delete('/features/:key', settingsController.deleteFeatureFlag);

// Seed
router.post('/seed/settings', settingsController.seedDefaultSettings);
router.post('/seed/features', settingsController.seedDefaultFeatureFlags);

export default router;
