import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  handleGetPreferences,
  handleUpdatePreferences,
  handleResetPreferences,
  handleGetAvailableOptions,
  handleUnsubscribe,
  handleResubscribe,
  handleGetQuietHoursStatus,
} from '../controllers/notificationPreferenceController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: NotificationPreferences
 *   description: User notification preference management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     NotificationPreference:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         emailEnabled:
 *           type: boolean
 *           description: Enable/disable email notifications
 *         smsEnabled:
 *           type: boolean
 *           description: Enable/disable SMS notifications
 *         pushEnabled:
 *           type: boolean
 *           description: Enable/disable push notifications
 *         inAppEnabled:
 *           type: boolean
 *           description: Enable/disable in-app notifications
 *         marketingEmails:
 *           type: boolean
 *           description: Receive marketing emails
 *         marketingSms:
 *           type: boolean
 *           description: Receive marketing SMS
 *         challengeReminders:
 *           type: boolean
 *           description: Receive challenge reminders
 *         challengeUpdates:
 *           type: boolean
 *           description: Receive challenge updates
 *         sessionReminders:
 *           type: boolean
 *           description: Receive session reminders
 *         weeklyProgress:
 *           type: boolean
 *           description: Receive weekly progress reports
 *         newProgramAlerts:
 *           type: boolean
 *           description: Receive new program alerts
 *         communityUpdates:
 *           type: boolean
 *           description: Receive community updates
 *         paymentAlerts:
 *           type: boolean
 *           description: Receive payment alerts
 *         securityAlerts:
 *           type: boolean
 *           description: Receive security alerts (always enabled)
 *         quietHoursEnabled:
 *           type: boolean
 *           description: Enable quiet hours
 *         quietHoursStart:
 *           type: string
 *           nullable: true
 *           example: "22:00"
 *           description: Quiet hours start time (HH:mm)
 *         quietHoursEnd:
 *           type: string
 *           nullable: true
 *           example: "08:00"
 *           description: Quiet hours end time (HH:mm)
 *         timezone:
 *           type: string
 *           example: "Europe/Istanbul"
 *           description: User timezone for quiet hours
 *         currentlyInQuietHours:
 *           type: boolean
 *           description: Whether user is currently in quiet hours
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     UpdatePreferencesRequest:
 *       type: object
 *       properties:
 *         emailEnabled:
 *           type: boolean
 *         smsEnabled:
 *           type: boolean
 *         pushEnabled:
 *           type: boolean
 *         inAppEnabled:
 *           type: boolean
 *         marketingEmails:
 *           type: boolean
 *         marketingSms:
 *           type: boolean
 *         challengeReminders:
 *           type: boolean
 *         challengeUpdates:
 *           type: boolean
 *         sessionReminders:
 *           type: boolean
 *         weeklyProgress:
 *           type: boolean
 *         newProgramAlerts:
 *           type: boolean
 *         communityUpdates:
 *           type: boolean
 *         paymentAlerts:
 *           type: boolean
 *         quietHoursEnabled:
 *           type: boolean
 *         quietHoursStart:
 *           type: string
 *           nullable: true
 *           example: "22:00"
 *         quietHoursEnd:
 *           type: string
 *           nullable: true
 *           example: "08:00"
 *         timezone:
 *           type: string
 *           example: "Europe/Istanbul"
 *
 *     PreferenceOption:
 *       type: object
 *       properties:
 *         key:
 *           type: string
 *         label:
 *           type: string
 *         description:
 *           type: string
 *         category:
 *           type: string
 *           enum: [channel, marketing, updates, reminders, quiet_hours]
 *         type:
 *           type: string
 *           enum: [boolean, time, timezone]
 *         editable:
 *           type: boolean
 */

/**
 * @swagger
 * /api/notification-preferences:
 *   get:
 *     summary: Get notification preferences
 *     description: Get the authenticated user's notification preferences
 *     tags: [NotificationPreferences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification preferences
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/NotificationPreference'
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, handleGetPreferences);

/**
 * @swagger
 * /api/notification-preferences:
 *   put:
 *     summary: Update notification preferences
 *     description: Update the authenticated user's notification preferences
 *     tags: [NotificationPreferences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePreferencesRequest'
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/NotificationPreference'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put('/', authenticateToken, handleUpdatePreferences);

/**
 * @swagger
 * /api/notification-preferences/reset:
 *   post:
 *     summary: Reset preferences to defaults
 *     description: Reset all notification preferences to default values
 *     tags: [NotificationPreferences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Preferences reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/NotificationPreference'
 *       401:
 *         description: Unauthorized
 */
router.post('/reset', authenticateToken, handleResetPreferences);

/**
 * @swagger
 * /api/notification-preferences/options:
 *   get:
 *     summary: Get available preference options
 *     description: Get list of all available preference options with metadata (for UI)
 *     tags: [NotificationPreferences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available options
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     options:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PreferenceOption'
 *                     grouped:
 *                       type: object
 *                       properties:
 *                         channels:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/PreferenceOption'
 *                         marketing:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/PreferenceOption'
 *                         updates:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/PreferenceOption'
 *                         reminders:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/PreferenceOption'
 *                         quietHours:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/PreferenceOption'
 */
router.get('/options', authenticateToken, handleGetAvailableOptions);

/**
 * @swagger
 * /api/notification-preferences/unsubscribe/{token}:
 *   get:
 *     summary: Unsubscribe via email link
 *     description: Process unsubscribe request from email link (public endpoint)
 *     tags: [NotificationPreferences]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Unsubscribe token from email
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [MARKETING, CHALLENGE_REMINDER, CHALLENGE_UPDATE, SESSION_REMINDER, WEEKLY_PROGRESS, NEW_PROGRAM, COMMUNITY, PAYMENT]
 *         description: Specific notification type to unsubscribe from
 *     responses:
 *       200:
 *         description: Unsubscribed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid or expired token
 */
router.get('/unsubscribe/:token', handleUnsubscribe);

/**
 * @swagger
 * /api/notification-preferences/resubscribe:
 *   post:
 *     summary: Resubscribe to notification type
 *     description: Resubscribe to a previously unsubscribed notification type
 *     tags: [NotificationPreferences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [MARKETING, CHALLENGE_REMINDER, CHALLENGE_UPDATE, SESSION_REMINDER, WEEKLY_PROGRESS, NEW_PROGRAM, COMMUNITY, PAYMENT]
 *                 description: Notification type to resubscribe to
 *     responses:
 *       200:
 *         description: Resubscribed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/resubscribe', authenticateToken, handleResubscribe);

/**
 * @swagger
 * /api/notification-preferences/quiet-hours/status:
 *   get:
 *     summary: Get quiet hours status
 *     description: Check if user is currently in quiet hours
 *     tags: [NotificationPreferences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Quiet hours status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     quietHoursEnabled:
 *                       type: boolean
 *                     quietHoursStart:
 *                       type: string
 *                       nullable: true
 *                     quietHoursEnd:
 *                       type: string
 *                       nullable: true
 *                     timezone:
 *                       type: string
 *                     currentlyInQuietHours:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 */
router.get('/quiet-hours/status', authenticateToken, handleGetQuietHoursStatus);

export default router;
