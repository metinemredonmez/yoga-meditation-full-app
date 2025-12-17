import { Router } from 'express';
import {
  handleRequestReset,
  handleValidateToken,
  handleResetPassword,
} from '../controllers/passwordResetController';
import { validateBody, validateParams } from '../middleware/validateRequest';
import {
  requestResetBodySchema,
  validateTokenParamsSchema,
  resetPasswordBodySchema,
} from '../validation/passwordResetSchemas';

const router = Router();

/**
 * @swagger
 * /api/password-reset/request:
 *   post:
 *     tags: [Password Reset]
 *     summary: Request password reset email
 *     description: Sends a password reset email if the account exists. Always returns success to prevent email enumeration.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Request processed (always returns success)
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
 *         description: Invalid email format
 */
router.post('/request', validateBody(requestResetBodySchema), handleRequestReset);

/**
 * @swagger
 * /api/password-reset/validate/{token}:
 *   get:
 *     tags: [Password Reset]
 *     summary: Validate reset token
 *     description: Checks if a password reset token is valid and not expired
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The password reset token
 *     responses:
 *       200:
 *         description: Token validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 */
router.get('/validate/:token', validateParams(validateTokenParamsSchema), handleValidateToken);

/**
 * @swagger
 * /api/password-reset/reset:
 *   post:
 *     tags: [Password Reset]
 *     summary: Reset password with token
 *     description: Resets the user password using a valid reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: The password reset token from email
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: New password (min 8 chars, must include uppercase, lowercase, and number)
 *     responses:
 *       200:
 *         description: Password reset successful
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
 *         description: Invalid or expired token, or invalid password format
 */
router.post('/reset', validateBody(resetPasswordBodySchema), handleResetPassword);

export default router;
