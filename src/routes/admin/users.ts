import { Router } from 'express';
import * as userController from '../../controllers/admin/userController';

const router = Router();

// User listing & search
router.get('/', userController.getUsers);
router.get('/banned', userController.getBannedUsers);
router.get('/warnings', userController.getWarnings);

// User details & management
router.get('/:id', userController.getUserDetails);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.get('/:id/activity', userController.getUserActivityLog);

// User actions
router.post('/:id/reset-password', userController.resetUserPassword);
router.post('/:id/ban', userController.banUser);
router.post('/:id/unban', userController.unbanUser);
router.post('/:id/warn', userController.warnUser);
router.post('/:id/role', userController.changeUserRole);

// Warnings
router.post('/warnings/:warningId/acknowledge', userController.acknowledgeWarning);

export default router;
