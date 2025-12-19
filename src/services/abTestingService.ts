import { prisma } from '../utils/database';
import { getRedisClient } from '../utils/redis';
import { logger } from '../utils/logger';
import * as crypto from 'crypto';

// ============================================
// Types
// ============================================

interface Experiment {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: Variant[];
  targetAudience?: TargetAudience;
  startDate?: Date;
  endDate?: Date;
  metrics: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface Variant {
  id: string;
  name: string;
  weight: number; // 0-100 percentage
  config: Record<string, unknown>;
  isControl: boolean;
}

interface TargetAudience {
  percentage: number; // 0-100
  filters?: {
    subscriptionTier?: string[];
    registeredAfter?: Date;
    country?: string[];
    platform?: string[];
  };
}

interface ExperimentAssignment {
  experimentId: string;
  variantId: string;
  variantName: string;
  config: Record<string, unknown>;
}

interface ExperimentResult {
  experimentId: string;
  variantId: string;
  metric: string;
  value: number;
  sampleSize: number;
  timestamp: Date;
}

// ============================================
// Experiment Management
// ============================================

export async function createExperiment(data: {
  name: string;
  description: string;
  variants: Omit<Variant, 'id'>[];
  targetAudience?: TargetAudience;
  metrics: string[];
}): Promise<Experiment> {
  // TODO: Add experiment model to Prisma schema
  throw new Error('Experiment model not yet implemented in database schema');

  // const experiment = await prisma.experiments.create({
  //   data: {
  //     name: data.name,
  //     description: data.description,
  //     status: 'draft',
  //     variants: data.variants.map((v, i) => ({
  //       id: `variant-${i + 1}`,
  //       ...v
  //     })),
  //     targetAudience: data.targetAudience,
  //     metrics: data.metrics
  //   }
  // });

  // logger.info({ experimentId: experiment.id, name: experiment.name }, 'Experiment created');

  // return experiment as unknown as Experiment;
}

export async function startExperiment(experimentId: string): Promise<void> {
  // TODO: Add experiment model to Prisma schema
  throw new Error('Experiment model not yet implemented in database schema');

  // await prisma.experiments.update({
  //   where: { id: experimentId },
  //   data: {
  //     status: 'running',
  //     startDate: new Date()
  //   }
  // });

  // // Clear any cached assignments
  // const redis = getRedisClient();
  // if (redis) {
  //   const keys = await redis.keys(`ab:assignment:${experimentId}:*`);
  //   if (keys.length > 0) {
  //     await redis.del(...keys);
  //   }
  // }

  // logger.info({ experimentId }, 'Experiment started');
}

export async function stopExperiment(experimentId: string): Promise<void> {
  // TODO: Add experiment model to Prisma schema
  throw new Error('Experiment model not yet implemented in database schema');

  // await prisma.experiments.update({
  //   where: { id: experimentId },
  //   data: {
  //     status: 'completed',
  //     endDate: new Date()
  //   }
  // });

  // logger.info({ experimentId }, 'Experiment stopped');
}

export async function getExperiment(experimentId: string): Promise<Experiment | null> {
  // TODO: Add experiment model to Prisma schema
  throw new Error('Experiment model not yet implemented in database schema');

  // const experiment = await prisma.experiments.findUnique({
  //   where: { id: experimentId }
  // });

  // return experiment as unknown as Experiment | null;
}

export async function listExperiments(status?: string): Promise<Experiment[]> {
  // TODO: Add experiment model to Prisma schema
  throw new Error('Experiment model not yet implemented in database schema');

  // const experiments = await prisma.experiments.findMany({
  //   where: status ? { status } : undefined,
  //   orderBy: { createdAt: 'desc' }
  // });

  // return experiments as unknown as Experiment[];
}

// ============================================
// Variant Assignment
// ============================================

export async function getVariantAssignment(
  userId: string,
  experimentId: string
): Promise<ExperimentAssignment | null> {
  const redis = getRedisClient();
  const cacheKey = `ab:assignment:${experimentId}:${userId}`;

  // Check cache first
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      logger.warn({ err: e }, 'AB test cache read failed');
    }
  }

  // TODO: Add experiment models to Prisma schema
  return null;

  // Check database for existing assignment
  // const existing = await prisma.experiment_assignments.findUnique({
  //   where: {
  //     experimentId_userId: { experimentId, userId }
  //   }
  // });

  // if (existing) {
  //   const experiment = await getExperiment(experimentId);
  //   const variant = experiment?.variants.find(v => v.id === existing.variantId);

  //   if (variant) {
  //     const assignment: ExperimentAssignment = {
  //       experimentId,
  //       variantId: variant.id,
  //       variantName: variant.name,
  //       config: variant.config
  //     };

  //     // Cache assignment
  //     if (redis) {
  //       await redis.setex(cacheKey, 86400, JSON.stringify(assignment));
  //     }

  //     return assignment;
  //   }
  // }

  // // Get experiment and assign variant
  // const experiment = await getExperiment(experimentId);

  // if (!experiment || experiment.status !== 'running') {
  //   return null;
  // }

  // // Check if user is in target audience
  // if (!isUserInTargetAudience(userId, experiment.targetAudience)) {
  //   return null;
  // }

  // // Assign variant based on weights
  // const variant = assignVariant(userId, experimentId, experiment.variants);

  // if (!variant) {
  //   return null;
  // }

  // // Save assignment
  // await prisma.experiment_assignments.create({
  //   data: {
  //     experimentId,
  //     userId,
  //     variantId: variant.id,
  //     assignedAt: new Date()
  //   }
  // });

  // const assignment: ExperimentAssignment = {
  //   experimentId,
  //   variantId: variant.id,
  //   variantName: variant.name,
  //   config: variant.config
  // };

  // // Cache assignment
  // if (redis) {
  //   await redis.setex(cacheKey, 86400, JSON.stringify(assignment));
  // }

  // logger.debug({ userId, experimentId, variantId: variant.id }, 'User assigned to variant');

  // return assignment;
}

export async function getAllAssignments(userId: string): Promise<ExperimentAssignment[]> {
  // TODO: Add experiment models to Prisma schema
  return [];

  // const runningExperiments = await listExperiments('running');
  // const assignments: ExperimentAssignment[] = [];

  // for (const experiment of runningExperiments) {
  //   const assignment = await getVariantAssignment(userId, experiment.id);
  //   if (assignment) {
  //     assignments.push(assignment);
  //   }
  // }

  // return assignments;
}

function assignVariant(userId: string, experimentId: string, variants: Variant[]): Variant | null {
  // Use deterministic hash for consistent assignment
  const hash = crypto
    .createHash('md5')
    .update(`${userId}:${experimentId}`)
    .digest('hex');

  // Convert hash to number between 0-100
  const hashValue = parseInt(hash.substring(0, 8), 16) % 100;

  // Find variant based on cumulative weights
  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (hashValue < cumulative) {
      return variant;
    }
  }

  // Default to first variant if something goes wrong
  return variants[0] || null;
}

async function isUserInTargetAudience(
  userId: string,
  targetAudience?: TargetAudience
): Promise<boolean> {
  if (!targetAudience) return true;

  // Check percentage
  if (targetAudience.percentage < 100) {
    const hash = crypto.createHash('md5').update(userId).digest('hex');
    const hashValue = parseInt(hash.substring(0, 8), 16) % 100;
    if (hashValue >= targetAudience.percentage) {
      return false;
    }
  }

  // Check filters
  if (targetAudience.filters) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        createdAt: true
      }
    });

    if (!user) return false;

    const { subscriptionTier, registeredAfter } = targetAudience.filters;

    if (subscriptionTier && !subscriptionTier.includes(user.subscriptionTier)) {
      return false;
    }

    if (registeredAfter && user.createdAt < registeredAfter) {
      return false;
    }
  }

  return true;
}

// ============================================
// Event Tracking & Results
// ============================================

export async function trackExperimentEvent(
  userId: string,
  experimentId: string,
  eventName: string,
  value: number = 1
): Promise<void> {
  // TODO: Add experiment models to Prisma schema
  return;

  // // Get user's assignment
  // const assignment = await getVariantAssignment(userId, experimentId);

  // if (!assignment) {
  //   return;
  // }

  // try {
  //   await prisma.experiment_events.create({
  //     data: {
  //       experimentId,
  //       variantId: assignment.variantId,
  //       userId,
  //       eventName,
  //       value,
  //       createdAt: new Date()
  //     }
  //   });

  //   // Increment counter in Redis for real-time stats
  //   const redis = getRedisClient();
  //   if (redis) {
  //     const key = `ab:events:${experimentId}:${assignment.variantId}:${eventName}`;
  //     await redis.incrbyfloat(key, value);
  //   }
  // } catch (error) {
  //   logger.error({ err: error, experimentId, eventName }, 'Failed to track experiment event');
  // }
}

export async function getExperimentResults(experimentId: string): Promise<{
  experiment: Experiment;
  results: {
    variantId: string;
    variantName: string;
    metrics: Record<string, {
      total: number;
      count: number;
      average: number;
    }>;
    sampleSize: number;
  }[];
  winner?: string;
  confidence?: number;
}> {
  // TODO: Add experiment models to Prisma schema
  throw new Error('Experiment model not yet implemented in database schema');

  // const experiment = await getExperiment(experimentId);

  // if (!experiment) {
  //   throw new Error('Experiment not found');
  // }

  // const results = [];

  // for (const variant of experiment.variants) {
  //   // Get assignment count
  //   const sampleSize = await prisma.experiment_assignments.count({
  //     where: { experimentId, variantId: variant.id }
  //   });

  //   // Get metrics
  //   const metricsData: Record<string, { total: number; count: number; average: number }> = {};

  //   for (const metric of experiment.metrics) {
  //     const events = await prisma.experiment_events.aggregate({
  //       where: {
  //         experimentId,
  //         variantId: variant.id,
  //         eventName: metric
  //       },
  //       _sum: { value: true },
  //       _count: true
  //     });

  //     const total = events._sum.value || 0;
  //     const count = events._count || 0;

  //     metricsData[metric] = {
  //       total,
  //       count,
  //       average: count > 0 ? total / count : 0
  //     };
  //   }

  //   results.push({
  //     variantId: variant.id,
  //     variantName: variant.name,
  //     metrics: metricsData,
  //     sampleSize
  //   });
  // }

  // // Simple winner detection (variant with highest conversion)
  // // In production, use statistical significance testing
  // let winner: string | undefined;
  // let highestConversion = 0;

  // const primaryMetric = experiment.metrics[0];
  // if (primaryMetric) {
  //   for (const result of results) {
  //     const conversion = result.metrics[primaryMetric]?.average || 0;
  //     if (conversion > highestConversion) {
  //       highestConversion = conversion;
  //       winner = result.variantId;
  //     }
  //   }
  // }

  // return {
  //   experiment,
  //   results,
  //   winner,
  //   confidence: undefined // Would need proper statistical analysis
  // };
}

// ============================================
// Feature Flags Integration
// ============================================

export async function getFeatureFlag(
  flagName: string,
  userId?: string,
  defaultValue: boolean = false
): Promise<boolean> {
  const redis = getRedisClient();

  // TODO: Uncomment when experiment models are added
  // // Check if there's an experiment for this feature
  // const experiment = await prisma.experiments.findFirst({
  //   where: {
  //     name: flagName,
  //     status: 'running'
  //   }
  // });

  // if (experiment && userId) {
  //   const assignment = await getVariantAssignment(userId, experiment.id);
  //   if (assignment) {
  //     return (assignment.config.enabled as boolean) ?? defaultValue;
  //   }
  // }

  // Check feature flag directly
  if (redis) {
    const value = await redis.get(`feature:${flagName}`);
    if (value !== null) {
      return value === 'true';
    }
  }

  // Check database
  const flag = await prisma.feature_flags.findUnique({
    where: { key: flagName }
  });

  return flag?.isEnabled ?? defaultValue;
}

export async function setFeatureFlag(flagName: string, enabled: boolean): Promise<void> {
  await prisma.feature_flags.upsert({
    where: { key: flagName },
    create: {
      key: flagName,
      name: flagName,
      isEnabled: enabled
    },
    update: { isEnabled: enabled }
  });

  const redis = getRedisClient();
  if (redis) {
    await redis.set(`feature:${flagName}`, enabled.toString());
  }

  logger.info({ flagName, enabled }, 'Feature flag updated');
}

export type { Experiment, Variant, ExperimentAssignment, ExperimentResult };
