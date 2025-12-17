import { Router } from 'express';
import * as noteController from '../../controllers/admin/noteController';

const router = Router();

// Admin Notes
router.get('/', noteController.getNotes);
router.post('/', noteController.createNote);
router.get('/entity/:entityType/:entityId', noteController.getEntityNotes);
router.get('/:id', noteController.getNote);
router.put('/:id', noteController.updateNote);
router.delete('/:id', noteController.deleteNote);
router.post('/:id/pin', noteController.pinNote);

// Saved Reports
router.get('/reports', noteController.getSavedReports);
router.post('/reports', noteController.createSavedReport);
router.get('/reports/:id', noteController.getSavedReport);
router.put('/reports/:id', noteController.updateSavedReport);
router.delete('/reports/:id', noteController.deleteSavedReport);
router.post('/reports/:id/duplicate', noteController.duplicateSavedReport);

export default router;
