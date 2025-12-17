import { Router } from 'express';
import * as adminCommunicationController from '../controllers/adminCommunicationController';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRoles('ADMIN'));

// ============================================
// Message Templates
// ============================================

/**
 * @swagger
 * /api/admin/communication/templates:
 *   get:
 *     summary: List message templates
 *     tags: [Admin Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: channel
 *         schema:
 *           type: string
 *           enum: [EMAIL, PUSH, SMS, IN_APP]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Templates list
 */
router.get('/templates', adminCommunicationController.listTemplates);

/**
 * @swagger
 * /api/admin/communication/templates/{id}:
 *   get:
 *     summary: Get template by ID
 *     tags: [Admin Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template details
 */
router.get('/templates/:id', adminCommunicationController.getTemplate);

/**
 * @swagger
 * /api/admin/communication/templates:
 *   post:
 *     summary: Create message template
 *     tags: [Admin Communication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - slug
 *               - channel
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               subject:
 *                 type: string
 *               bodyHtml:
 *                 type: string
 *               bodyText:
 *                 type: string
 *               bodyPush:
 *                 type: string
 *               bodySms:
 *                 type: string
 *               channel:
 *                 type: string
 *               category:
 *                 type: string
 *               variables:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Template created
 */
router.post('/templates', adminCommunicationController.createTemplate);

/**
 * @swagger
 * /api/admin/communication/templates/{id}:
 *   put:
 *     summary: Update message template
 *     tags: [Admin Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template updated
 */
router.put('/templates/:id', adminCommunicationController.updateTemplate);

/**
 * @swagger
 * /api/admin/communication/templates/{id}:
 *   delete:
 *     summary: Delete message template
 *     tags: [Admin Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template deleted
 */
router.delete('/templates/:id', adminCommunicationController.deleteTemplate);

/**
 * @swagger
 * /api/admin/communication/templates/{id}/test:
 *   post:
 *     summary: Test message template
 *     tags: [Admin Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               testEmail:
 *                 type: string
 *               testUserId:
 *                 type: string
 *               variables:
 *                 type: object
 *     responses:
 *       200:
 *         description: Test result
 */
router.post('/templates/:id/test', adminCommunicationController.testTemplate);

// ============================================
// Campaigns
// ============================================

/**
 * @swagger
 * /api/admin/communication/campaigns:
 *   get:
 *     summary: List campaigns
 *     tags: [Admin Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: channel
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Campaigns list
 */
router.get('/campaigns', adminCommunicationController.listCampaigns);

/**
 * @swagger
 * /api/admin/communication/campaigns/{id}:
 *   get:
 *     summary: Get campaign by ID
 *     tags: [Admin Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign details
 */
router.get('/campaigns/:id', adminCommunicationController.getCampaign);

/**
 * @swagger
 * /api/admin/communication/campaigns:
 *   post:
 *     summary: Create campaign
 *     tags: [Admin Communication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - templateId
 *               - channel
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               templateId:
 *                 type: string
 *               targetAudience:
 *                 type: object
 *               channel:
 *                 type: string
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Campaign created
 */
router.post('/campaigns', adminCommunicationController.createCampaign);

/**
 * @swagger
 * /api/admin/communication/campaigns/{id}:
 *   put:
 *     summary: Update campaign
 *     tags: [Admin Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign updated
 */
router.put('/campaigns/:id', adminCommunicationController.updateCampaign);

/**
 * @swagger
 * /api/admin/communication/campaigns/{id}:
 *   delete:
 *     summary: Delete campaign
 *     tags: [Admin Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign deleted
 */
router.delete('/campaigns/:id', adminCommunicationController.deleteCampaign);

/**
 * @swagger
 * /api/admin/communication/campaigns/{id}/schedule:
 *   post:
 *     summary: Schedule campaign
 *     tags: [Admin Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - scheduledAt
 *             properties:
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Campaign scheduled
 */
router.post('/campaigns/:id/schedule', adminCommunicationController.scheduleCampaign);

/**
 * @swagger
 * /api/admin/communication/campaigns/{id}/execute:
 *   post:
 *     summary: Execute campaign immediately
 *     tags: [Admin Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign executed
 */
router.post('/campaigns/:id/execute', adminCommunicationController.executeCampaign);

/**
 * @swagger
 * /api/admin/communication/campaigns/{id}/pause:
 *   post:
 *     summary: Pause campaign
 *     tags: [Admin Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign paused
 */
router.post('/campaigns/:id/pause', adminCommunicationController.pauseCampaign);

/**
 * @swagger
 * /api/admin/communication/campaigns/{id}/resume:
 *   post:
 *     summary: Resume campaign
 *     tags: [Admin Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign resumed
 */
router.post('/campaigns/:id/resume', adminCommunicationController.resumeCampaign);

/**
 * @swagger
 * /api/admin/communication/campaigns/{id}/cancel:
 *   post:
 *     summary: Cancel campaign
 *     tags: [Admin Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign cancelled
 */
router.post('/campaigns/:id/cancel', adminCommunicationController.cancelCampaign);

/**
 * @swagger
 * /api/admin/communication/campaigns/{id}/stats:
 *   get:
 *     summary: Get campaign statistics
 *     tags: [Admin Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign statistics
 */
router.get('/campaigns/:id/stats', adminCommunicationController.getCampaignStats);

/**
 * @swagger
 * /api/admin/communication/campaigns/audience/preview:
 *   post:
 *     summary: Preview target audience
 *     tags: [Admin Communication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subscriptionStatus:
 *                 type: array
 *                 items:
 *                   type: string
 *               subscriptionTier:
 *                 type: array
 *                 items:
 *                   type: string
 *               lastActiveFrom:
 *                 type: string
 *                 format: date
 *               lastActiveTo:
 *                 type: string
 *                 format: date
 *               engagementScoreMin:
 *                 type: integer
 *               engagementScoreMax:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Audience preview
 */
router.post('/campaigns/audience/preview', adminCommunicationController.getTargetAudiencePreview);

// ============================================
// Scheduled Messages
// ============================================

/**
 * @swagger
 * /api/admin/communication/scheduled:
 *   get:
 *     summary: List scheduled messages
 *     tags: [Admin Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Scheduled messages list
 */
router.get('/scheduled', adminCommunicationController.listScheduledMessages);

/**
 * @swagger
 * /api/admin/communication/scheduled/{id}:
 *   delete:
 *     summary: Cancel scheduled message
 *     tags: [Admin Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message cancelled
 */
router.delete('/scheduled/:id', adminCommunicationController.cancelScheduledMessage);

// ============================================
// Statistics
// ============================================

/**
 * @swagger
 * /api/admin/communication/stats:
 *   get:
 *     summary: Get communication statistics
 *     tags: [Admin Communication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Communication statistics
 */
router.get('/stats', adminCommunicationController.getCommunicationStats);

/**
 * @swagger
 * /api/admin/communication/stats/daily:
 *   get:
 *     summary: Get daily statistics
 *     tags: [Admin Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Daily statistics
 */
router.get('/stats/daily', adminCommunicationController.getDailyStats);

/**
 * @swagger
 * /api/admin/communication/stats/by-template:
 *   get:
 *     summary: Get statistics by template
 *     tags: [Admin Communication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics by template
 */
router.get('/stats/by-template', adminCommunicationController.getStatsByTemplate);

/**
 * @swagger
 * /api/admin/communication/stats/by-channel:
 *   get:
 *     summary: Get statistics by channel
 *     tags: [Admin Communication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics by channel
 */
router.get('/stats/by-channel', adminCommunicationController.getStatsByChannel);

// ============================================
// Jobs
// ============================================

/**
 * @swagger
 * /api/admin/communication/jobs/{jobName}/trigger:
 *   post:
 *     summary: Manually trigger a job
 *     tags: [Admin Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobName
 *         required: true
 *         schema:
 *           type: string
 *           enum: [scheduled_messages, weekly_digests, monthly_digests, inactive_users, campaigns]
 *     responses:
 *       200:
 *         description: Job triggered
 */
router.post('/jobs/:jobName/trigger', adminCommunicationController.triggerJobHandler);

export default router;
