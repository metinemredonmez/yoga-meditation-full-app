import { Request, Response } from 'express';
import {
  generateDailyInsight,
  getDailyInsight,
  markInsightViewed,
  getInsightHistory,
  generateInsightAudio,
} from '../../services/ai/insightService';

// Get today's daily insight
export const getTodayInsight = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Try to get existing insight
    let insight = await getDailyInsight(userId);

    // If no insight exists, generate one
    if (!insight) {
      insight = await generateDailyInsight(userId);
    }

    res.json({
      success: true,
      data: insight,
    });
  } catch (error) {
    console.error('Get today insight error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get daily insight',
    });
  }
};

// Get insight for specific date
export const getInsightByDate = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const date = req.params.date as string;

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format',
      });
    }

    const insight = await getDailyInsight(userId, targetDate);

    if (!insight) {
      return res.status(404).json({
        success: false,
        error: 'No insight found for this date',
      });
    }

    res.json({
      success: true,
      data: insight,
    });
  } catch (error) {
    console.error('Get insight by date error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get insight',
    });
  }
};

// Mark insight as viewed
export const markViewed = async (req: Request, res: Response) => {
  try {
    const insightId = req.params.insightId as string;

    const insight = await markInsightViewed(insightId);

    res.json({
      success: true,
      data: insight,
    });
  } catch (error) {
    console.error('Mark viewed error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark insight as viewed',
    });
  }
};

// Get insight history
export const getHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { limit = '30' } = req.query;

    const insights = await getInsightHistory(
      userId,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get insight history',
    });
  }
};

// Generate audio for insight
export const generateAudio = async (req: Request, res: Response) => {
  try {
    const insightId = req.params.insightId as string;

    const audio = await generateInsightAudio(insightId);

    res.json({
      success: true,
      data: audio,
    });
  } catch (error) {
    console.error('Generate audio error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate audio',
    });
  }
};

// Force regenerate today's insight
export const regenerateInsight = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // This will create a new insight even if one exists
    // (generateDailyInsight checks for existing, but admin can bypass)
    const insight = await generateDailyInsight(userId);

    res.json({
      success: true,
      data: insight,
      message: 'Insight regenerated',
    });
  } catch (error) {
    console.error('Regenerate insight error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to regenerate insight',
    });
  }
};
