import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth';
import {
  getSecuritySettings,
  changePassword,
  toggle2FA,
  terminateAllSessions,
  getPreferences,
  updatePreferences,
  getClassPreferences,
  updateClassPreferences,
  getCalendarIntegrations,
  updateCalendarIntegration,
  deactivateAccount,
  deleteAccount,
} from '../../controllers/instructorSettingsController';

const router = Router();

// Security
router.get('/security', authenticateToken, getSecuritySettings);
router.post('/security/change-password', authenticateToken, changePassword);
router.post('/security/toggle-2fa', authenticateToken, toggle2FA);
router.post('/security/terminate-sessions', authenticateToken, terminateAllSessions);

// Preferences (language, timezone, etc.)
router.get('/preferences', authenticateToken, getPreferences);
router.put('/preferences', authenticateToken, updatePreferences);

// Class preferences
router.get('/class-preferences', authenticateToken, getClassPreferences);
router.put('/class-preferences', authenticateToken, updateClassPreferences);

// Calendar integrations
router.get('/calendar-integrations', authenticateToken, getCalendarIntegrations);
router.post('/calendar-integrations', authenticateToken, updateCalendarIntegration);

// Account actions
router.post('/account/deactivate', authenticateToken, deactivateAccount);
router.post('/account/delete', authenticateToken, deleteAccount);

export default router;
