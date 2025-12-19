import { Router } from 'express';
import { googleLogin, appleLogin } from '../controllers/socialAuthController';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Login with Google
 *     description: Authenticate user using Google OAuth ID token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token from client-side authentication
 *     responses:
 *       200:
 *         description: Successfully authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     avatarUrl:
 *                       type: string
 *                     role:
 *                       type: string
 *                     provider:
 *                       type: string
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Invalid token
 *       500:
 *         description: Server error or OAuth not configured
 */
router.post('/google', authRateLimiter, googleLogin);

/**
 * @swagger
 * /api/auth/apple:
 *   post:
 *     summary: Login with Apple
 *     description: Authenticate user using Apple Sign In identity token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identityToken
 *             properties:
 *               identityToken:
 *                 type: string
 *                 description: Apple identity token from client-side authentication
 *               user:
 *                 type: object
 *                 description: User info (only provided on first sign-in)
 *                 properties:
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *     responses:
 *       200:
 *         description: Successfully authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     avatarUrl:
 *                       type: string
 *                     role:
 *                       type: string
 *                     provider:
 *                       type: string
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Invalid token
 *       500:
 *         description: Server error or OAuth not configured
 */
router.post('/apple', authRateLimiter, appleLogin);

export default router;
