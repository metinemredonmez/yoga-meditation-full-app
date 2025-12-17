import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validateRequest';
import { authenticatedRateLimiter } from '../middleware/rateLimiter';
import {
  handleCreateApiKey,
  handleListApiKeys,
  handleRevokeApiKey,
  handleRotateApiKey,
  handleGetApiKeyUsage,
} from '../controllers/apiKeyController';
import {
  createApiKeyBodySchema,
  apiKeyIdParamsSchema,
} from '../validation/apiKeySchemas';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: API Keys
 *   description: API key management for authenticated users
 */

/**
 * @swagger
 * /api/api-keys:
 *   post:
 *     summary: Create a new API key
 *     tags: [API Keys]
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: Friendly name for the API key
 *                 example: "Mobile App Key"
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of permissions (format action:resource)
 *                 example: ["read:programs", "write:progress"]
 *               rateLimit:
 *                 type: integer
 *                 description: Requests per minute limit
 *                 default: 60
 *                 minimum: 1
 *                 maximum: 1000
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: When the key expires (optional)
 *     responses:
 *       201:
 *         description: API key created successfully
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
 *                     keyId:
 *                       type: string
 *                     key:
 *                       type: string
 *                       description: Full API key (only shown once)
 *                     prefix:
 *                       type: string
 *                     name:
 *                       type: string
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                     rateLimit:
 *                       type: integer
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  authenticateToken,
  authenticatedRateLimiter,
  validateBody(createApiKeyBodySchema),
  handleCreateApiKey
);

/**
 * @swagger
 * /api/api-keys:
 *   get:
 *     summary: List all API keys for the authenticated user
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of API keys
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       prefix:
 *                         type: string
 *                       permissions:
 *                         type: array
 *                         items:
 *                           type: string
 *                       rateLimit:
 *                         type: integer
 *                       isActive:
 *                         type: boolean
 *                       lastUsedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       usageCount:
 *                         type: integer
 *                       expiresAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 count:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  authenticateToken,
  authenticatedRateLimiter,
  handleListApiKeys
);

/**
 * @swagger
 * /api/api-keys/{keyId}:
 *   delete:
 *     summary: Revoke an API key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: keyId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the API key to revoke
 *     responses:
 *       200:
 *         description: API key revoked successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: API key not found
 */
router.delete(
  '/:keyId',
  authenticateToken,
  authenticatedRateLimiter,
  validateParams(apiKeyIdParamsSchema),
  handleRevokeApiKey
);

/**
 * @swagger
 * /api/api-keys/{keyId}/rotate:
 *   post:
 *     summary: Rotate an API key (revoke old, create new with same settings)
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: keyId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the API key to rotate
 *     responses:
 *       200:
 *         description: API key rotated successfully
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
 *                     keyId:
 *                       type: string
 *                     key:
 *                       type: string
 *                       description: New API key (only shown once)
 *                     prefix:
 *                       type: string
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: API key not found
 */
router.post(
  '/:keyId/rotate',
  authenticateToken,
  authenticatedRateLimiter,
  validateParams(apiKeyIdParamsSchema),
  handleRotateApiKey
);

/**
 * @swagger
 * /api/api-keys/{keyId}/usage:
 *   get:
 *     summary: Get usage statistics for an API key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: keyId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the API key
 *     responses:
 *       200:
 *         description: API key usage statistics
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
 *                     keyId:
 *                       type: string
 *                     name:
 *                       type: string
 *                     usageCount:
 *                       type: integer
 *                     lastUsedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     rateLimit:
 *                       type: integer
 *                     isActive:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: API key not found
 */
router.get(
  '/:keyId/usage',
  authenticateToken,
  authenticatedRateLimiter,
  validateParams(apiKeyIdParamsSchema),
  handleGetApiKeyUsage
);

export default router;
