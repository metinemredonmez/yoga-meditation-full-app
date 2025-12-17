import { Request, Response } from 'express';
import { RecommendationContext, RecommendationFeedback } from '@prisma/client';
import {
  generateRecommendations,
  getPersonalizedFeed,
  getContinueWatching,
  recordRecommendationView,
  recordRecommendationClick,
  recordRecommendationDismiss,
  getSimilarContent,
} from '../../services/ai/recommendationService';

// Get personalized feed
export const getFeed = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { page = '1', limit = '20' } = req.query;

    const recommendations = await getPersonalizedFeed(
      userId,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: recommendations,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      },
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get personalized feed',
    });
  }
};

// Get continue watching recommendations
export const getContinue = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { limit = '5' } = req.query;

    const recommendations = await getContinueWatching(
      userId,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error('Get continue watching error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get continue watching',
    });
  }
};

// Generate new recommendations
export const refreshRecommendations = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { context = 'HOME_FEED', limit = 20 } = req.body;

    await generateRecommendations(
      userId,
      context as RecommendationContext,
      limit
    );

    // Return fresh recommendations
    const recommendations = await getPersonalizedFeed(userId, 1, limit);

    res.json({
      success: true,
      data: recommendations,
      message: 'Recommendations refreshed',
    });
  } catch (error) {
    console.error('Refresh recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh recommendations',
    });
  }
};

// Record recommendation view
export const trackView = async (req: Request, res: Response) => {
  try {
    const recommendationId = req.params.recommendationId as string;

    await recordRecommendationView(recommendationId);

    res.json({
      success: true,
      message: 'View recorded',
    });
  } catch (error) {
    console.error('Track view error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track view',
    });
  }
};

// Record recommendation click
export const trackClick = async (req: Request, res: Response) => {
  try {
    const recommendationId = req.params.recommendationId as string;

    await recordRecommendationClick(recommendationId);

    res.json({
      success: true,
      message: 'Click recorded',
    });
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track click',
    });
  }
};

// Dismiss recommendation
export const dismiss = async (req: Request, res: Response) => {
  try {
    const recommendationId = req.params.recommendationId as string;
    const { feedback } = req.body;

    await recordRecommendationDismiss(
      recommendationId,
      feedback as RecommendationFeedback | undefined
    );

    res.json({
      success: true,
      message: 'Recommendation dismissed',
    });
  } catch (error) {
    console.error('Dismiss error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to dismiss recommendation',
    });
  }
};

// Get similar content
export const getSimilar = async (req: Request, res: Response) => {
  try {
    const entityType = req.params.entityType as string;
    const entityId = req.params.entityId as string;
    const { limit = '5' } = req.query;

    const similar = await getSimilarContent(
      entityType,
      entityId,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: similar,
    });
  } catch (error) {
    console.error('Get similar error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get similar content',
    });
  }
};
