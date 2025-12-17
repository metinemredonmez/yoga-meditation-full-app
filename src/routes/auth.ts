import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  handleRefreshToken,
  handleLogout,
  handleLogoutAll,
  handleGetSessions,
  handleRevokeSession,
} from '../controllers/authController';

const router = Router();

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     description: Exchange a valid refresh token for a new access token and optionally a new refresh token (if rotation is enabled)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token
 *     responses:
 *       200:
 *         description: New tokens issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 expiresIn:
 *                   type: number
 *                   description: Access token expiry in seconds
 *                 tokenType:
 *                   type: string
 *                   example: Bearer
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', handleRefreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout current session
 *     description: Revoke the provided refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully logged out
 *       400:
 *         description: Invalid or already revoked token
 */
router.post('/logout', handleLogout);

/**
 * @swagger
 * /api/auth/logout-all:
 *   post:
 *     tags: [Auth]
 *     summary: Logout from all devices
 *     description: Revoke all refresh tokens for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - confirmLogoutAll
 *             properties:
 *               confirmLogoutAll:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Successfully logged out from all devices
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 sessionsRevoked:
 *                   type: number
 *       401:
 *         description: Authentication required
 */
router.post('/logout-all', authenticateToken, handleLogoutAll);

/**
 * @swagger
 * /api/auth/sessions:
 *   get:
 *     tags: [Auth]
 *     summary: Get active sessions
 *     description: List all active sessions for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       userAgent:
 *                         type: string
 *                         nullable: true
 *                       ipAddress:
 *                         type: string
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       isCurrent:
 *                         type: boolean
 *                 count:
 *                   type: number
 *       401:
 *         description: Authentication required
 */
router.get('/sessions', authenticateToken, handleGetSessions);

/**
 * @swagger
 * /api/auth/sessions/{sessionId}:
 *   delete:
 *     tags: [Auth]
 *     summary: Revoke a specific session
 *     description: Revoke a specific session by its ID (familyId)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The session ID to revoke
 *     responses:
 *       200:
 *         description: Session revoked successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Session not found or already revoked
 */
router.delete('/sessions/:sessionId', authenticateToken, handleRevokeSession);

export default router;
