import { Router } from 'express';
import {
  signup,
  login,
  logout,
  refreshToken,
  getProfile,
  updateProfile,
  updateOwnProfile,
  changePassword,
  deleteOwnAccount,
  getAvatarUploadUrl,
  deleteUser,
} from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';
import { strictRateLimiter, authenticatedRateLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * @openapi
 * /api/users/signup:
 *   post:
 *     tags:
 *       - Users
 *     summary: Register a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupRequest'
 *     responses:
 *       201:
 *         description: User created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       409:
 *         description: Email already in use.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/signup', strictRateLimiter, signup);

/**
 * @openapi
 * /api/users/login:
 *   post:
 *     tags:
 *       - Users
 *     summary: Authenticate user and issue tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', strictRateLimiter, login);

/**
 * @openapi
 * /api/users/logout:
 *   post:
 *     tags:
 *       - Users
 *     summary: Logout user and invalidate tokens
 *     description: Clears HttpOnly auth cookies and revokes refresh token
 *     responses:
 *       200:
 *         description: Logout successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 */
router.post('/logout', logout);

/**
 * @openapi
 * /api/users/refresh-token:
 *   post:
 *     tags:
 *       - Users
 *     summary: Refresh access token using refresh token
 *     description: Uses HttpOnly cookie or request body to get new token pair
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token (optional, can use cookie instead)
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Refresh token required.
 *       403:
 *         description: Invalid or expired refresh token.
 */
router.post('/refresh-token', strictRateLimiter, refreshToken);

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     tags:
 *       - Users
 *     summary: Retrieve the authenticated user's profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns the current user's profile.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication required.
 */
router.get('/me', authenticateToken, authenticatedRateLimiter, getProfile);

/**
 * @openapi
 * /api/users/me:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update own profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully.
 */
router.put('/me', authenticateToken, authenticatedRateLimiter, updateOwnProfile);

/**
 * @openapi
 * /api/users/me/change-password:
 *   post:
 *     tags:
 *       - Users
 *     summary: Change own password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully.
 *       400:
 *         description: Current password is incorrect.
 */
router.post('/me/change-password', authenticateToken, authenticatedRateLimiter, changePassword);

/**
 * @openapi
 * /api/users/me/delete:
 *   post:
 *     tags:
 *       - Users
 *     summary: Delete own account
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account deleted successfully.
 *       400:
 *         description: Password is incorrect.
 */
router.post('/me/delete', authenticateToken, authenticatedRateLimiter, deleteOwnAccount);

/**
 * @openapi
 * /api/users/me/avatar-upload-url:
 *   post:
 *     tags:
 *       - Users
 *     summary: Get presigned URL for avatar upload
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filename
 *               - contentType
 *             properties:
 *               filename:
 *                 type: string
 *               contentType:
 *                 type: string
 *                 enum: [image/jpeg, image/png, image/webp, image/gif]
 *     responses:
 *       200:
 *         description: Returns presigned upload URL.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uploadUrl:
 *                   type: string
 *                 fileUrl:
 *                   type: string
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid file type.
 */
router.post('/me/avatar-upload-url', authenticateToken, authenticatedRateLimiter, getAvatarUploadUrl);

/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update user profile information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       403:
 *         description: Insufficient permissions.
 *       404:
 *         description: User not found.
 */
router.put('/:id', authenticateToken, authenticatedRateLimiter, updateProfile);

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete a user account
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User identifier
 *     responses:
 *       204:
 *         description: Account deleted successfully.
 *       403:
 *         description: Insufficient permissions.
 *       404:
 *         description: User not found.
 */
router.delete('/:id', authenticateToken, authenticatedRateLimiter, deleteUser);

export default router;
