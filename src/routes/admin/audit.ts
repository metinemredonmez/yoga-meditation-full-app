import { Router } from 'express';
import * as auditController from '../../controllers/admin/auditController';

const router = Router();

router.get('/', auditController.getAuditLogs);
router.get('/search', auditController.searchAuditLogs);
router.get('/export', auditController.exportAuditLogs);
router.get('/stats', auditController.getAuditStats);
router.get('/admin/:adminId', auditController.getAdminActivitySummary);
router.get('/entity/:entityType/:entityId', auditController.getEntityAuditHistory);
router.get('/:id', auditController.getAuditLogDetails);

export default router;
