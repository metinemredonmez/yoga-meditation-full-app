import { PrismaClient, Prisma } from '@prisma/client';
import { chatCompletion, ChatMessage } from './openaiService';
import { generateSpeechAndSave } from './ttsService';
import { SYSTEM_PROMPTS } from '../../config/aiPrompts';

const prisma = new PrismaClient();

// Generate daily insight for a user
export const generateDailyInsight = async (userId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if insight already exists for today
  const existingInsight = await prisma.daily_insights.findUnique({
    where: {
      userId_date: { userId, date: today },
    },
  });

  if (existingInsight) {
    return existingInsight;
  }

  // Collect user metrics
  const metricsSnapshot = await collectUserMetrics(userId);

  // Generate insights using AI
  const insights = await generateInsightContent(userId, metricsSnapshot);

  // Create daily insight
  const dailyInsight = await prisma.daily_insights.create({
    data: {
      userId,
      date: today,
      summary: insights.summary,
      achievements: insights.achievements,
      suggestions: insights.suggestions,
      affirmation: insights.affirmation,
      tip: insights.tip,
      metricsSnapshot: metricsSnapshot as Prisma.InputJsonValue,
    },
  });

  return dailyInsight;
};

// Get daily insight
export const getDailyInsight = async (userId: string, date?: Date) => {
  const targetDate = date || new Date();
  targetDate.setHours(0, 0, 0, 0);

  return prisma.daily_insights.findUnique({
    where: {
      userId_date: { userId, date: targetDate },
    },
  });
};

// Mark insight as viewed
export const markInsightViewed = async (insightId: string) => {
  return prisma.daily_insights.update({
    where: { id: insightId },
    data: {
      isViewed: true,
      viewedAt: new Date(),
    },
  });
};

// Get insight history
export const getInsightHistory = async (
  userId: string,
  limit: number = 30
) => {
  return prisma.daily_insights.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: limit,
  });
};

// Generate insight audio
export const generateInsightAudio = async (insightId: string) => {
  const insight = await prisma.daily_insights.findUnique({
    where: { id: insightId },
  });

  if (!insight) {
    throw new Error('Insight not found');
  }

  // Build audio script
  const script = buildAudioScript(insight);

  // Generate audio
  const audio = await generateSpeechAndSave(
    script,
    { voice: 'nova', speed: 1.0 },
    insight.userId
  );

  // Update insight with audio URL
  await prisma.daily_insights.update({
    where: { id: insightId },
    data: { audioUrl: audio.audioUrl },
  });

  return audio;
};

// Collect user metrics for insight generation
const collectUserMetrics = async (userId: string) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    classesCompletedYesterday,
    totalClassesCompleted,
    currentStreak,
    challengeProgress,
    recentActivity,
  ] = await Promise.all([
    // Classes completed yesterday
    prisma.video_progress.count({
      where: {
        userId,
        completed: true,
        updatedAt: {
          gte: yesterday,
          lt: today,
        },
      },
    }),

    // Total classes completed
    prisma.video_progress.count({
      where: {
        userId,
        completed: true,
      },
    }),

    // Current streak (from user level if exists)
    prisma.user_levels
      .findUnique({
        where: { userId },
        select: { currentStreak: true },
      })
      .then((ul) => ul?.currentStreak || 0),

    // Active challenge progress
    prisma.challenge_enrollments.findMany({
      where: {
        userId,
      },
      include: {
        challenges: {
          select: {
            title: true,
          },
        },
      },
      take: 3,
    }),

    // Recent activity summary
    prisma.user_behaviors.findMany({
      where: {
        userId,
        createdAt: {
          gte: yesterday,
        },
      },
      take: 20,
    }),
  ]);

  return {
    classesCompletedYesterday,
    totalClassesCompleted,
    currentStreak,
    activeChallenges: challengeProgress.map((cp: any) => ({
      title: cp.challenge.title,
      recentActivity: true,
    })),
    recentActivityCount: recentActivity.length,
    collectedAt: new Date().toISOString(),
  };
};

// Generate insight content using AI
const generateInsightContent = async (
  userId: string,
  metrics: ReturnType<typeof collectUserMetrics> extends Promise<infer T> ? T : never
) => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { firstName: true },
  });

  const prompt = `
Generate a personalized daily insight for ${user?.firstName || 'this user'} based on these metrics:

- Classes completed yesterday: ${metrics.classesCompletedYesterday}
- Total classes completed: ${metrics.totalClassesCompleted}
- Current streak: ${metrics.currentStreak} days
- Active challenges: ${metrics.activeChallenges.map((c: any) => c.title).join(', ') || 'None'}
- Recent activity: ${metrics.recentActivityCount > 0 ? 'Active' : 'Inactive'}

Please provide:
1. A brief summary (2-3 sentences) about their progress
2. Up to 3 achievements to celebrate (or encouraging words if none)
3. Up to 3 suggestions for what they could do next
4. A short affirmation related to yoga/wellness
5. A daily tip related to yoga practice

Format as JSON:
{
  "summary": "...",
  "achievements": ["...", "..."],
  "suggestions": ["...", "..."],
  "affirmation": "...",
  "tip": "..."
}
`;

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPTS.DAILY_INSIGHT },
    { role: 'user', content: prompt },
  ];

  const response = await chatCompletion(messages, {
    temperature: 0.8,
    maxTokens: 500,
  }, userId);

  try {
    // Parse JSON response
    const content = response.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as {
        summary: string;
        achievements: string[];
        suggestions: string[];
        affirmation: string;
        tip: string;
      };
    }
  } catch (error) {
    console.error('Failed to parse insight response:', error);
  }

  // Fallback if parsing fails
  return {
    summary: 'Keep up the great work on your yoga journey!',
    achievements: ['Showing up for yourself today'],
    suggestions: ['Try a new class', 'Practice some breathing exercises'],
    affirmation: 'You are growing stronger with every practice.',
    tip: 'Remember to stay hydrated before and after your practice.',
  };
};

// Build audio script from insight
const buildAudioScript = (insight: {
  summary: string;
  achievements: string[];
  suggestions: string[];
  affirmation: string | null;
  tip: string | null;
}) => {
  const parts: string[] = [];

  parts.push('Good morning! Here is your daily yoga insight.');
  parts.push(insight.summary);

  if (insight.achievements.length > 0) {
    parts.push('Let\'s celebrate your achievements:');
    insight.achievements.forEach((a) => parts.push(a));
  }

  if (insight.suggestions.length > 0) {
    parts.push('Here are some suggestions for today:');
    insight.suggestions.forEach((s) => parts.push(s));
  }

  if (insight.affirmation) {
    parts.push('Your affirmation for today:');
    parts.push(insight.affirmation);
  }

  if (insight.tip) {
    parts.push('Daily tip:');
    parts.push(insight.tip);
  }

  parts.push('Have a wonderful practice!');

  return parts.join(' ... ');
};

// Generate all daily insights (cron job - run early morning)
export const generateAllDailyInsights = async () => {
  // Get all active users
  const activeUsers = await prisma.users.findMany({
    where: {
      // Only users who have been active in the last 30 days
      video_progress: {
        some: {
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      },
    },
    select: { id: true },
    take: 1000, // Limit to avoid overloading
  });

  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
  };

  for (const user of activeUsers) {
    results.processed++;
    try {
      await generateDailyInsight(user.id);
      results.succeeded++;

      // Add small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      results.failed++;
      console.error(`Failed to generate insight for user ${user.id}:`, error);
    }
  }

  return results;
};
