import { Router } from 'express';
import * as reminderController from '../controllers/userReminderController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Templates
router.get('/templates', reminderController.getTemplates);

// Reminders CRUD
router.get('/', reminderController.getReminders);
router.get('/:id', reminderController.getReminder);
router.post('/', reminderController.createReminder);
router.put('/:id', reminderController.updateReminder);
router.delete('/:id', reminderController.deleteReminder);
router.post('/:id/toggle', reminderController.toggleReminder);

export default router;
