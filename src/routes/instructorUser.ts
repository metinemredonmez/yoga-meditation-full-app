import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as instructorFollowerService from '../services/instructorFollowerService';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import { Response } from 'express';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// User's Following List
// ============================================

/**
 * Get list of instructors the user is following
 */
router.get('/following', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const following = await instructorFollowerService.getFollowing(userId, { page, limit });

    res.json({
      success: true,
      data: following,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get following list');
    res.status(500).json({
      success: false,
      error: 'Failed to get following list',
    });
  }
});

/**
 * Check if user is following specific instructors (bulk check)
 */
router.post('/following/check', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { instructorIds } = req.body;

    if (!Array.isArray(instructorIds)) {
      return res.status(400).json({
        success: false,
        error: 'instructorIds must be an array',
      });
    }

    const results: Record<string, boolean> = {};

    await Promise.all(
      instructorIds.map(async (instructorId: string) => {
        results[instructorId] = await instructorFollowerService.isFollowing(
          userId,
          instructorId,
        );
      }),
    );

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to check following status');
    res.status(500).json({
      success: false,
      error: 'Failed to check following status',
    });
  }
});

export default router;
