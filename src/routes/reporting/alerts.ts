import { Router } from 'express';
import { alertController } from '../../controllers/reporting';
import { validateRequest } from '../../middleware/validateRequest';
import { alertRuleBodySchema, alertRuleUpdateBodySchema } from '../../validation/reportingSchemas';

const router = Router();

// Alert Rules
router.get('/rules', alertController.getRules);
router.post('/rules', validateRequest({ body: alertRuleBodySchema }), alertController.createRule);
router.get('/rules/:id', alertController.getRule);
router.put('/rules/:id', validateRequest({ body: alertRuleUpdateBodySchema }), alertController.updateRule);
router.delete('/rules/:id', alertController.deleteRule);
router.post('/rules/:id/mute', alertController.mute);
router.post('/rules/:id/unmute', alertController.unmute);

// Alerts
router.get('/', alertController.listAlerts);
router.get('/stats', alertController.getStats);
router.get('/:id', alertController.getAlertById);
router.post('/:id/acknowledge', alertController.acknowledge);
router.post('/:id/resolve', alertController.resolve);

export default router;
