import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  otpSendRateLimiter,
  otpHourlyRateLimiter,
  otpVerifyRateLimiter,
  smsGeneralRateLimiter,
} from '../middleware/smsRateLimiter';
import {
  handleSendOtp,
  handleVerifyOtp,
  handleResendOtp,
  handleVerifyPhone,
  handleUpdatePhone,
  handleSendPhoneVerification,
  handleGetSmsStatus,
  handleTwilioWebhook,
} from '../controllers/smsController';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     OtpPurpose:
 *       type: string
 *       enum: [PHONE_VERIFY, LOGIN, PASSWORD_RESET]
 *     OtpResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         expiresAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/sms/send-otp:
 *   post:
 *     tags: [SMS]
 *     summary: Send OTP code
 *     description: Send an OTP code to a phone number. Rate limited to 1 per minute, 5 per hour.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - purpose
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number in E.164 format or local format
 *                 example: "+905551234567"
 *               purpose:
 *                 $ref: '#/components/schemas/OtpPurpose'
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OtpResponse'
 *       400:
 *         description: Validation error
 *       429:
 *         description: Rate limit exceeded
 */
router.post(
  '/send-otp',
  smsGeneralRateLimiter,
  otpHourlyRateLimiter,
  otpSendRateLimiter,
  handleSendOtp,
);

/**
 * @swagger
 * /api/sms/verify-otp:
 *   post:
 *     tags: [SMS]
 *     summary: Verify OTP code
 *     description: Verify an OTP code. Rate limited to prevent brute force.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - code
 *               - purpose
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+905551234567"
 *               code:
 *                 type: string
 *                 description: 6-digit OTP code
 *                 example: "123456"
 *               purpose:
 *                 $ref: '#/components/schemas/OtpPurpose'
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 verified:
 *                   type: boolean
 *       400:
 *         description: Invalid OTP or validation error
 *       429:
 *         description: Too many verification attempts
 */
router.post(
  '/verify-otp',
  smsGeneralRateLimiter,
  otpVerifyRateLimiter,
  handleVerifyOtp,
);

/**
 * @swagger
 * /api/sms/resend-otp:
 *   post:
 *     tags: [SMS]
 *     summary: Resend OTP code
 *     description: Resend OTP code. Must wait 1 minute between requests.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - purpose
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+905551234567"
 *               purpose:
 *                 $ref: '#/components/schemas/OtpPurpose'
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *       429:
 *         description: Rate limit - must wait before resending
 */
router.post(
  '/resend-otp',
  smsGeneralRateLimiter,
  otpHourlyRateLimiter,
  handleResendOtp,
);

/**
 * @swagger
 * /api/sms/verify-phone:
 *   post:
 *     tags: [SMS]
 *     summary: Verify user's phone number
 *     description: Verify the authenticated user's phone number with OTP
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: 6-digit OTP code
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Phone verified successfully
 *       400:
 *         description: Invalid OTP or no phone to verify
 *       401:
 *         description: Authentication required
 */
router.post(
  '/verify-phone',
  authenticateToken,
  otpVerifyRateLimiter,
  handleVerifyPhone,
);

/**
 * @swagger
 * /api/sms/send-verification:
 *   post:
 *     tags: [SMS]
 *     summary: Send phone verification OTP
 *     description: Send OTP to the authenticated user's phone for verification
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification OTP sent
 *       400:
 *         description: No phone number or already verified
 *       401:
 *         description: Authentication required
 */
router.post(
  '/send-verification',
  authenticateToken,
  otpHourlyRateLimiter,
  otpSendRateLimiter,
  handleSendPhoneVerification,
);

/**
 * @swagger
 * /api/sms/phone:
 *   put:
 *     tags: [SMS]
 *     summary: Update phone number
 *     description: Update the authenticated user's phone number. Sends verification OTP.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+905551234567"
 *     responses:
 *       200:
 *         description: Phone updated, verification OTP sent
 *       400:
 *         description: Phone number in use or validation error
 *       401:
 *         description: Authentication required
 */
router.put('/phone', authenticateToken, handleUpdatePhone);

/**
 * @swagger
 * /api/sms/status:
 *   get:
 *     tags: [SMS]
 *     summary: Get SMS service status
 *     description: Check if SMS service is configured and enabled
 *     responses:
 *       200:
 *         description: SMS service status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 configured:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.get('/status', handleGetSmsStatus);

/**
 * @swagger
 * /api/sms/webhook/twilio:
 *   post:
 *     tags: [SMS]
 *     summary: Twilio webhook for delivery status
 *     description: Receives delivery status updates from Twilio
 *     requestBody:
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               MessageSid:
 *                 type: string
 *               MessageStatus:
 *                 type: string
 *               ErrorCode:
 *                 type: string
 *               ErrorMessage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/webhook/twilio', handleTwilioWebhook);

export default router;
