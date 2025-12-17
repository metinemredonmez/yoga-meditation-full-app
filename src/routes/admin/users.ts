import { Router } from 'express';
import { requireSuperAdmin } from '../../middleware/auth';
import * as userController from '../../controllers/admin/userController';
import * as userDetailsController from '../../controllers/admin/userDetailsController';

const router = Router();

// ==================== USER LISTING ====================
router.get('/', userController.getUsers);
router.get('/banned', userController.getBannedUsers);
router.get('/warnings', userController.getWarnings);

// ==================== USER DETAILS - TAB ENDPOINTS ====================
// Tab 1: Overview
router.get('/:id/overview', userDetailsController.getUserOverview);

// Tab 2: Activity
router.get('/:id/activity', userDetailsController.getUserActivity);
router.get('/:id/login-history', userDetailsController.getUserLoginHistory);
router.get('/:id/sessions', userDetailsController.getUserActiveSessions);
router.delete('/:id/sessions/:sessionId', userDetailsController.revokeUserSession);
router.delete('/:id/sessions', userDetailsController.revokeAllUserSessions);

// Tab 3: Progress
router.get('/:id/progress', userDetailsController.getUserProgress);

// Tab 4: Payments
router.get('/:id/payments', userDetailsController.getUserPayments);
router.post('/:id/extend-subscription', userDetailsController.extendSubscription);
router.post('/:id/grant-premium', userDetailsController.grantPremium);

// Tab 5: Support
router.get('/:id/support', userDetailsController.getUserSupport);
router.post('/:id/notes', userDetailsController.addAdminNote);
router.delete('/:id/notes/:noteId', userDetailsController.deleteAdminNote);
router.patch('/:id/notes/:noteId/pin', userDetailsController.toggleNotePin);

// Tab 6: Admin Actions
router.post('/:id/xp', userDetailsController.addXP);
router.post('/:id/badges', userDetailsController.grantBadge);
router.post('/:id/titles', userDetailsController.grantTitle);
router.post('/:id/streak-freeze', userDetailsController.addStreakFreeze);
router.post('/:id/verify-email', userDetailsController.verifyUserEmail);
router.post('/:id/verify-phone', userDetailsController.verifyUserPhone);
router.get('/:id/export', userDetailsController.exportUserData);

// Tab 7: Teacher (only for TEACHER role users)
router.get('/:id/teacher', userDetailsController.getTeacherProfile);
router.patch('/:id/instructor/status', userDetailsController.updateInstructorStatus);
router.patch('/:id/instructor/tier', userDetailsController.updateInstructorTier);
router.post('/:id/instructor/verify', userDetailsController.toggleInstructorVerified);
router.post('/:id/instructor/feature', userDetailsController.toggleInstructorFeatured);
router.patch('/:id/instructor/commission', userDetailsController.updateCommissionRate);

// ==================== BASIC USER MANAGEMENT ====================
router.get('/:id', userController.getUserDetails);
router.put('/:id', userController.updateUser);
router.post('/:id/reset-password', userController.resetUserPassword);
router.post('/:id/ban', userController.banUser);
router.post('/:id/unban', userController.unbanUser);
router.post('/:id/warn', userController.warnUser);
router.post('/:id/role', userController.changeUserRole);

// ==================== SUPER ADMIN ONLY ====================
// Delete user - SUPER_ADMIN only
router.delete('/:id', requireSuperAdmin, userController.deleteUser);

// ==================== WARNINGS ====================
router.post('/warnings/:warningId/acknowledge', userController.acknowledgeWarning);

export default router;
