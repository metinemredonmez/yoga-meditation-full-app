import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';
import {
  processOfflineSync,
  getOfflineContent,
  markContentForOffline,
  removeOfflineContent,
  getOfflineContentList,
  getDeltaUpdate
} from '../services/offlineSyncService';
import { logger } from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(authenticateToken);
router.use(authRateLimiter);

/**
 * @openapi
 * /api/offline/sync:
 *   post:
 *     tags:
 *       - Offline
 *     summary: Sync offline data
 *     description: Process offline actions and get server changes
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lastSyncAt:
 *                 type: string
 *                 format: date-time
 *               offlineActions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [progress, favorite, bookmark, rating, note]
 *                     action:
 *                       type: string
 *                       enum: [create, update, delete]
 *                     entityType:
 *                       type: string
 *                     entityId:
 *                       type: string
 *                     data:
 *                       type: object
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     clientId:
 *                       type: string
 *               deviceId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sync result
 */
router.post('/sync', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { lastSyncAt, offlineActions = [], deviceId } = req.body;

    const result = await processOfflineSync(userId, {
      lastSyncAt: lastSyncAt ? new Date(lastSyncAt) : null,
      offlineActions: offlineActions.map((a: Record<string, unknown>) => ({
        ...a,
        timestamp: new Date(a.timestamp as string)
      })),
      deviceId
    });

    res.json(result);
  } catch (error) {
    logger.error({ err: error }, 'Offline sync failed');
    res.status(500).json({ error: 'Sync failed' });
  }
});

/**
 * @openapi
 * /api/offline/delta:
 *   get:
 *     tags:
 *       - Offline
 *     summary: Get delta updates
 *     description: Get incremental updates since last sync version
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: version
 *         schema:
 *           type: integer
 *         description: Last sync version
 *     responses:
 *       200:
 *         description: Delta updates
 */
router.get('/delta', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const lastSyncVersion = parseInt(req.query.version as string) || 0;

    const result = await getDeltaUpdate(userId, lastSyncVersion);
    res.json(result);
  } catch (error) {
    logger.error({ err: error }, 'Delta update failed');
    res.status(500).json({ error: 'Failed to get delta updates' });
  }
});

/**
 * @openapi
 * /api/offline/content:
 *   get:
 *     tags:
 *       - Offline
 *     summary: Get offline content list
 *     description: Get list of content marked for offline access
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Offline content list
 */
router.get('/content', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const contents = await getOfflineContentList(userId);
    res.json({ contents });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get offline content list');
    res.status(500).json({ error: 'Failed to get offline content' });
  }
});

/**
 * @openapi
 * /api/offline/content/download:
 *   post:
 *     tags:
 *       - Offline
 *     summary: Mark content for offline download
 *     description: Mark specific content to be available offline
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentId
 *               - contentType
 *             properties:
 *               contentId:
 *                 type: string
 *               contentType:
 *                 type: string
 *                 enum: [class, program, podcast]
 *     responses:
 *       200:
 *         description: Content marked for download
 */
router.post('/content/download', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { contentId, contentType } = req.body;

    if (!contentId || !contentType) {
      return res.status(400).json({ error: 'contentId and contentType required' });
    }

    const result = await markContentForOffline(userId, contentId, contentType);

    if (result.success) {
      res.json({
        success: true,
        downloadUrl: result.downloadUrl,
        message: 'Content marked for offline access'
      });
    } else {
      res.status(500).json({ error: 'Failed to mark content for offline' });
    }
  } catch (error) {
    logger.error({ err: error }, 'Failed to mark content for offline');
    res.status(500).json({ error: 'Failed to mark content for offline' });
  }
});

/**
 * @openapi
 * /api/offline/content/{contentId}:
 *   delete:
 *     tags:
 *       - Offline
 *     summary: Remove offline content
 *     description: Remove content from offline storage
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content removed
 */
router.delete('/content/:contentId', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { contentId } = req.params;

    const success = await removeOfflineContent(userId, contentId);

    if (success) {
      res.json({ success: true, message: 'Content removed from offline' });
    } else {
      res.status(500).json({ error: 'Failed to remove content' });
    }
  } catch (error) {
    logger.error({ err: error }, 'Failed to remove offline content');
    res.status(500).json({ error: 'Failed to remove offline content' });
  }
});

/**
 * @openapi
 * /api/offline/content/batch:
 *   post:
 *     tags:
 *       - Offline
 *     summary: Get multiple contents for offline
 *     description: Get full content data for multiple items
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Content data
 */
router.post('/content/batch', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { contentIds = [] } = req.body;

    if (!Array.isArray(contentIds) || contentIds.length === 0) {
      return res.status(400).json({ error: 'contentIds array required' });
    }

    // Limit to 50 items per request
    const limitedIds = contentIds.slice(0, 50);
    const contents = await getOfflineContent(userId, limitedIds);

    res.json({ contents });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get batch content');
    res.status(500).json({ error: 'Failed to get content' });
  }
});

export default router;
