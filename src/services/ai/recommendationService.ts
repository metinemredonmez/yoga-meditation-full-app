import {
  PrismaClient,
  RecommendationType,
  RecommendationContext,
  RecommendationFeedback,
  Prisma,
} from '@prisma/client';
import { createEmbedding, chatCompletion, ChatMessage } from './openaiService';

const prisma = new PrismaClient();

// Generate recommendations for a user
export const generateRecommendations = async (
  userId: string,
  context: RecommendationContext,
  limit: number = 10
): Promise<void> => {
  // Get user preferences and history
  const [user, userPreference, recentBehaviors, existingRecommendations] =
    await Promise.all([
      prisma.users.findUnique({
        where: { id: userId },
        include: {
          video_progress: {
            orderBy: { updatedAt: 'desc' },
            take: 50,
          },
          favorites: { take: 20 },
        },
      }),
      prisma.user_ai_preferences.findUnique({
        where: { userId },
      }),
      prisma.user_behaviors.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.recommendations.findMany({
        where: {
          userId,
          expiresAt: { gt: new Date() },
        },
      }),
    ]);

  if (!user) return;
  if (!userPreference?.enableRecommendations) return;

  // Generate different types of recommendations
  const recommendations: Prisma.recommendationsCreateManyInput[] = [];

  // Continue watching
  const continueWatching = await generateContinueWatching(userId, limit);
  recommendations.push(
    ...continueWatching.map((r) => ({ ...r, context, userId } as Prisma.recommendationsCreateManyInput))
  );

  // For you (personalized)
  const forYou = await generatePersonalizedRecommendations(
    userId,
    recentBehaviors,
    limit
  );
  recommendations.push(...forYou.map((r) => ({ ...r, context, userId } as Prisma.recommendationsCreateManyInput)));

  // Trending
  const trending = await generateTrendingRecommendations(limit);
  recommendations.push(...trending.map((r) => ({ ...r, context, userId } as Prisma.recommendationsCreateManyInput)));

  // Filter out already recommended items
  const existingEntityIds = new Set(
    existingRecommendations.map((r) => `${r.entityType}:${r.entityId}`)
  );

  const newRecommendations = recommendations.filter(
    (r) => !existingEntityIds.has(`${r.entityType}:${r.entityId}`)
  );

  // Apply diversity filter
  const diversifiedRecommendations = applyDiversityFilter(
    newRecommendations,
    userPreference?.recommendationDiversity || 0.3
  );

  // Save recommendations
  if (diversifiedRecommendations.length > 0) {
    await prisma.recommendations.createMany({
      data: diversifiedRecommendations.slice(0, limit * 3),
      skipDuplicates: true,
    });
  }
};

// Get personalized feed
export const getPersonalizedFeed = async (
  userId: string,
  page: number = 1,
  limit: number = 20
) => {
  // Try to get cached recommendations first
  const recommendations = await prisma.recommendations.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
      isDismissed: false,
    },
    orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
    skip: (page - 1) * limit,
    take: limit,
  });

  // If not enough recommendations, generate more
  if (recommendations.length < limit) {
    await generateRecommendations(userId, RecommendationContext.HOME_FEED, limit);

    return prisma.recommendations.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
        isDismissed: false,
      },
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  return recommendations;
};

// Get continue watching recommendations
export const getContinueWatching = async (
  userId: string,
  limit: number = 5
) => {
  return prisma.recommendations.findMany({
    where: {
      userId,
      type: RecommendationType.CONTINUE_WATCHING,
      expiresAt: { gt: new Date() },
      isDismissed: false,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
};

// Generate continue watching recommendations
const generateContinueWatching = async (
  userId: string,
  limit: number
): Promise<Partial<Prisma.recommendationsCreateManyInput>[]> => {
  // Find incomplete video progress
  const incompleteProgress = await prisma.video_progress.findMany({
    where: {
      userId,
      completed: false,
      percentage: { gt: 10, lt: 90 },
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });

  return incompleteProgress.map((p) => ({
    type: RecommendationType.CONTINUE_WATCHING,
    entityType: 'lesson',
    entityId: p.lessonId,
    score: 0.9, // High priority
    confidence: 1.0,
    reasons: ['Continue where you left off'],
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  }));
};

// Generate personalized recommendations using embeddings
const generatePersonalizedRecommendations = async (
  userId: string,
  behaviors: { entityType?: string | null; entityId?: string | null }[],
  limit: number
): Promise<Partial<Prisma.recommendationsCreateManyInput>[]> => {
  // Get user embedding
  let userEmbedding = await prisma.user_embeddings.findUnique({
    where: { userId },
  });

  if (!userEmbedding) {
    // Generate user embedding based on behavior
    userEmbedding = await generateUserEmbedding(userId);
  }

  if (!userEmbedding) return [];

  // Get content embeddings
  const contentEmbeddings = await prisma.content_embeddings.findMany({
    take: 100,
  });

  // Calculate similarity scores
  const userVector = userEmbedding.embedding as number[];
  const recommendations: Partial<Prisma.recommendationsCreateManyInput>[] = [];

  for (const content of contentEmbeddings) {
    const contentVector = content.embedding as number[];
    const similarity = cosineSimilarity(userVector, contentVector);

    // Filter out already interacted content
    const interacted = behaviors.some(
      (b) => b.entityType === content.entityType && b.entityId === content.entityId
    );

    if (!interacted && similarity > 0.7) {
      recommendations.push({
        type: RecommendationType.FOR_YOU,
        entityType: content.entityType,
        entityId: content.entityId,
        score: similarity,
        confidence: 0.8,
        reasons: ['Based on your interests'],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });
    }
  }

  return recommendations.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, limit);
};

// Generate trending recommendations
const generateTrendingRecommendations = async (
  limit: number
): Promise<Partial<Prisma.recommendationsCreateManyInput>[]> => {
  // Get most viewed content in last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const trendingPrograms = await prisma.programs.findMany({
    select: {
      id: true,
      title: true,
      _count: {
        select: {
          sessions: true,
        },
      },
    },
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
  });

  return trendingPrograms.map((p, index) => ({
    type: RecommendationType.TRENDING,
    entityType: 'program',
    entityId: p.id,
    score: 0.8 - index * 0.05, // Decreasing score by rank
    confidence: 0.9,
    reasons: ['Trending now'],
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  }));
};

// Generate user embedding
const generateUserEmbedding = async (userId: string) => {
  // Get user's behavior history
  const behaviors = await prisma.user_behaviors.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  if (behaviors.length === 0) return null;

  // Build text representation of user interests
  const interactionText = behaviors
    .filter((b) => b.entityType && b.entityId)
    .map((b) => `${b.eventType} ${b.entityType} ${b.entityId}`)
    .join('. ');

  if (!interactionText) return null;

  // Generate embedding
  const embedding = await createEmbedding(interactionText, userId);

  // Save embedding
  return prisma.user_embeddings.upsert({
    where: { userId },
    update: {
      embedding: embedding,
      model: 'text-embedding-ada-002',
      dimensions: embedding.length,
      basedOnBehaviors: behaviors.length,
      basedOnClasses: behaviors.filter((b) => b.entityType === 'class').length,
    },
    create: {
      userId,
      embedding: embedding,
      model: 'text-embedding-ada-002',
      dimensions: embedding.length,
      basedOnBehaviors: behaviors.length,
      basedOnClasses: behaviors.filter((b) => b.entityType === 'class').length,
    },
  });
};

// Calculate cosine similarity
const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const aVal = a[i] ?? 0;
    const bVal = b[i] ?? 0;
    dotProduct += aVal * bVal;
    normA += aVal * aVal;
    normB += bVal * bVal;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Apply diversity filter
const applyDiversityFilter = (
  recommendations: Partial<Prisma.recommendationsCreateManyInput>[],
  diversityFactor: number
): Prisma.recommendationsCreateManyInput[] => {
  const entityTypes = new Map<string, number>();
  const filtered: Prisma.recommendationsCreateManyInput[] = [];
  const maxPerType = Math.ceil(recommendations.length / 3);

  for (const rec of recommendations) {
    const entityType = rec.entityType || 'unknown';
    const currentCount = entityTypes.get(entityType) || 0;

    // Allow more diversity based on factor
    const threshold = maxPerType * (1 + diversityFactor);

    if (currentCount < threshold) {
      filtered.push(rec as Prisma.recommendationsCreateManyInput);
      entityTypes.set(entityType, currentCount + 1);
    }
  }

  return filtered;
};

// Record recommendation view
export const recordRecommendationView = async (recommendationId: string) => {
  return prisma.recommendations.update({
    where: { id: recommendationId },
    data: {
      isViewed: true,
      viewedAt: new Date(),
    },
  });
};

// Record recommendation click
export const recordRecommendationClick = async (recommendationId: string) => {
  return prisma.recommendations.update({
    where: { id: recommendationId },
    data: {
      isClicked: true,
      clickedAt: new Date(),
    },
  });
};

// Record recommendation dismiss
export const recordRecommendationDismiss = async (
  recommendationId: string,
  feedback?: RecommendationFeedback
) => {
  return prisma.recommendations.update({
    where: { id: recommendationId },
    data: {
      isDismissed: true,
      dismissedAt: new Date(),
      feedback,
    },
  });
};

// Get similar content
export const getSimilarContent = async (
  entityType: string,
  entityId: string,
  limit: number = 5
) => {
  const sourceEmbedding = await prisma.content_embeddings.findFirst({
    where: {
      entityType,
      entityId,
    },
  });

  if (!sourceEmbedding) return [];

  const allEmbeddings = await prisma.content_embeddings.findMany({
    where: {
      NOT: {
        AND: [{ entityType }, { entityId }],
      },
    },
  });

  const sourceVector = sourceEmbedding.embedding as number[];
  const similarities = allEmbeddings
    .map((e) => ({
      entityType: e.entityType,
      entityId: e.entityId,
      similarity: cosineSimilarity(sourceVector, e.embedding as number[]),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return similarities;
};

// Refresh all user recommendations (cron job)
export const refreshAllRecommendations = async () => {
  // Get active users (those with recent activity)
  const activeUsers = await prisma.user_behaviors.groupBy({
    by: ['userId'],
    where: {
      createdAt: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { userId: 'asc' },
    take: 100,
  });

  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
  };

  for (const user of activeUsers) {
    results.processed++;
    try {
      await generateRecommendations(
        user.userId,
        RecommendationContext.HOME_FEED,
        20
      );
      results.succeeded++;
    } catch (error) {
      results.failed++;
      console.error(`Failed to generate recommendations for ${user.userId}:`, error);
    }
  }

  return results;
};

// Clean up expired recommendations
export const cleanupExpiredRecommendations = async () => {
  const result = await prisma.recommendations.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });

  return result.count;
};
