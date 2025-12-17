import { CampaignStatus, MessageChannel, Prisma, SubscriptionStatus, SubscriptionTier } from '@prisma/client';
import { prisma } from '../utils/database';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import * as messageTemplateService from './messageTemplateService';
import * as unifiedMessagingService from './unifiedMessagingService';

// ============================================
// Types
// ============================================

export interface CreateCampaignInput {
  name: string;
  description?: string;
  templateId: string;
  targetAudience?: TargetAudienceFilter;
  channel: MessageChannel;
  scheduledAt?: Date;
  createdById: string;
}

export interface TargetAudienceFilter {
  subscriptionStatus?: SubscriptionStatus[];
  subscriptionTier?: SubscriptionTier[];
  lastActiveFrom?: Date;
  lastActiveTo?: Date;
  registeredFrom?: Date;
  registeredTo?: Date;
  completedPrograms?: string[];
  engagementScoreMin?: number;
  engagementScoreMax?: number;
  excludeUserIds?: string[];
  includeUserIds?: string[];
}

export interface CampaignStats {
  id: string;
  name: string;
  status: CampaignStatus;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  startedAt: Date | null;
  completedAt: Date | null;
}

// ============================================
// Campaign CRUD
// ============================================

/**
 * Create a new campaign
 */
export async function createCampaign(input: CreateCampaignInput) {
  // Validate template exists
  const template = await prisma.messageTemplate.findUnique({
    where: { id: input.templateId },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  // Get target audience count
  const audienceCount = await getTargetAudienceCount(input.targetAudience);

  const campaign = await prisma.communicationCampaign.create({
    data: {
      name: input.name,
      description: input.description,
      templateId: input.templateId,
      targetAudience: (input.targetAudience || {}) as Prisma.InputJsonValue,
      channel: input.channel,
      scheduledAt: input.scheduledAt,
      status: input.scheduledAt ? 'SCHEDULED' : 'DRAFT',
      totalRecipients: audienceCount,
      createdById: input.createdById,
    },
    include: {
      template: true,
      createdBy: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  logger.info({ campaignId: campaign.id, name: campaign.name }, 'Campaign created');

  return campaign;
}

/**
 * Update a campaign
 */
export async function updateCampaign(
  id: string,
  input: Partial<CreateCampaignInput>,
) {
  const campaign = await prisma.communicationCampaign.findUnique({
    where: { id },
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
    throw new Error('Can only update draft or scheduled campaigns');
  }

  // Recalculate audience if filter changed
  let totalRecipients = campaign.totalRecipients;
  if (input.targetAudience) {
    totalRecipients = await getTargetAudienceCount(input.targetAudience);
  }

  const updateData: Prisma.CommunicationCampaignUpdateInput = {
    totalRecipients,
  };

  if (input.name) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.templateId) updateData.template = { connect: { id: input.templateId } };
  if (input.targetAudience) updateData.targetAudience = input.targetAudience as Prisma.InputJsonValue;
  if (input.channel) updateData.channel = input.channel;
  if (input.scheduledAt !== undefined) updateData.scheduledAt = input.scheduledAt;

  return prisma.communicationCampaign.update({
    where: { id },
    data: updateData,
    include: {
      template: true,
    },
  });
}

/**
 * Delete a campaign
 */
export async function deleteCampaign(id: string): Promise<void> {
  const campaign = await prisma.communicationCampaign.findUnique({
    where: { id },
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  if (campaign.status === 'IN_PROGRESS') {
    throw new Error('Cannot delete campaign in progress');
  }

  await prisma.communicationCampaign.delete({
    where: { id },
  });

  logger.info({ campaignId: id }, 'Campaign deleted');
}

/**
 * Get campaign by ID
 */
export async function getCampaignById(id: string) {
  return prisma.communicationCampaign.findUnique({
    where: { id },
    include: {
      template: true,
      createdBy: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });
}

/**
 * List campaigns with filters
 */
export async function listCampaigns(filters?: {
  status?: CampaignStatus;
  channel?: MessageChannel;
  createdById?: string;
  page?: number;
  limit?: number;
}) {
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const skip = (page - 1) * limit;

  const where: Prisma.CommunicationCampaignWhereInput = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.channel) where.channel = filters.channel;
  if (filters?.createdById) where.createdById = filters.createdById;

  const [campaigns, total] = await Promise.all([
    prisma.communicationCampaign.findMany({
      where,
      include: {
        template: {
          select: { id: true, name: true, slug: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.communicationCampaign.count({ where }),
  ]);

  return {
    items: campaigns,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ============================================
// Campaign Lifecycle
// ============================================

/**
 * Schedule a campaign
 */
export async function scheduleCampaign(id: string, scheduledAt: Date) {
  const campaign = await prisma.communicationCampaign.findUnique({
    where: { id },
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  if (campaign.status !== 'DRAFT') {
    throw new Error('Can only schedule draft campaigns');
  }

  if (scheduledAt <= new Date()) {
    throw new Error('Scheduled time must be in the future');
  }

  return prisma.communicationCampaign.update({
    where: { id },
    data: {
      scheduledAt,
      status: 'SCHEDULED',
    },
  });
}

/**
 * Execute a campaign immediately
 */
export async function executeCampaign(id: string): Promise<CampaignStats> {
  const campaign = await prisma.communicationCampaign.findUnique({
    where: { id },
    include: { template: true },
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
    throw new Error('Campaign cannot be executed in current status');
  }

  // Update status to in progress
  await prisma.communicationCampaign.update({
    where: { id },
    data: {
      status: 'IN_PROGRESS',
      startedAt: new Date(),
    },
  });

  logger.info({ campaignId: id, name: campaign.name }, 'Campaign execution started');

  try {
    // Get target audience
    const userIds = await getTargetAudience(campaign.targetAudience as TargetAudienceFilter);

    let sentCount = 0;
    let failedCount = 0;

    // Process in batches
    const BATCH_SIZE = 50;
    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      const batch = userIds.slice(i, i + BATCH_SIZE);

      const results = await Promise.all(
        batch.map(async (userId) => {
          try {
            // Check user preferences
            const canSend = await unifiedMessagingService.checkUserPreference(
              userId,
              campaign.template.category.toLowerCase(),
            );

            if (!canSend) {
              return { success: false, reason: 'opted_out' };
            }

            // Check quiet hours
            const isQuietHours = await unifiedMessagingService.isInQuietHours(userId);
            if (isQuietHours) {
              // Still count as sent, will be delivered later
              return { success: true };
            }

            // Get user data
            const user = await prisma.user.findUnique({
              where: { id: userId },
              select: { firstName: true, email: true },
            });

            if (!user) {
              return { success: false, reason: 'user_not_found' };
            }

            // Render template
            const variables = {
              firstName: user.firstName || 'Değerli Üyemiz',
              appUrl: config.notification?.frontendUrl || 'https://app.yogaapp.com',
            };

            const rendered = await messageTemplateService.renderTemplate(
              campaign.template.slug,
              variables,
            );

            // Send message
            const result = await unifiedMessagingService.sendMessage({
              userId,
              channel: campaign.channel,
              subject: rendered.subject,
              body: rendered.bodyText || rendered.bodyPush || rendered.bodySms || '',
              bodyHtml: rendered.bodyHtml,
              templateId: campaign.templateId,
              metadata: { campaignId: campaign.id },
            });

            return result;
          } catch (error) {
            logger.error({ error, userId, campaignId: id }, 'Failed to send campaign message');
            return { success: false, reason: 'error' };
          }
        }),
      );

      // Count results
      for (const result of results) {
        if (result.success) {
          sentCount++;
        } else {
          failedCount++;
        }
      }

      // Update progress
      await prisma.communicationCampaign.update({
        where: { id },
        data: { sentCount, failedCount },
      });
    }

    // Mark as completed
    await prisma.communicationCampaign.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        sentCount,
        failedCount,
      },
    });

    logger.info(
      { campaignId: id, sentCount, failedCount },
      'Campaign execution completed',
    );

    return getCampaignStats(id);
  } catch (error) {
    // Mark as failed
    await prisma.communicationCampaign.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    logger.error({ error, campaignId: id }, 'Campaign execution failed');
    throw error;
  }
}

/**
 * Pause a campaign
 */
export async function pauseCampaign(id: string) {
  const campaign = await prisma.communicationCampaign.findUnique({
    where: { id },
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  if (campaign.status !== 'IN_PROGRESS') {
    throw new Error('Can only pause campaigns in progress');
  }

  return prisma.communicationCampaign.update({
    where: { id },
    data: { status: 'PAUSED' },
  });
}

/**
 * Resume a campaign
 */
export async function resumeCampaign(id: string) {
  const campaign = await prisma.communicationCampaign.findUnique({
    where: { id },
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  if (campaign.status !== 'PAUSED') {
    throw new Error('Can only resume paused campaigns');
  }

  return prisma.communicationCampaign.update({
    where: { id },
    data: { status: 'IN_PROGRESS' },
  });
}

/**
 * Cancel a campaign
 */
export async function cancelCampaign(id: string) {
  const campaign = await prisma.communicationCampaign.findUnique({
    where: { id },
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  if (campaign.status === 'COMPLETED' || campaign.status === 'CANCELLED') {
    throw new Error('Campaign already completed or cancelled');
  }

  return prisma.communicationCampaign.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });
}

// ============================================
// Target Audience
// ============================================

/**
 * Get target audience user IDs based on filters
 */
export async function getTargetAudience(
  filters?: TargetAudienceFilter,
): Promise<string[]> {
  if (!filters) {
    // Return all users
    const users = await prisma.user.findMany({
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  // If specific user IDs are provided
  if (filters.includeUserIds && filters.includeUserIds.length > 0) {
    return filters.includeUserIds;
  }

  // Build user query
  const userWhere: Prisma.UserWhereInput = {};

  // Registration date filter
  if (filters.registeredFrom || filters.registeredTo) {
    userWhere.createdAt = {};
    if (filters.registeredFrom) userWhere.createdAt.gte = filters.registeredFrom;
    if (filters.registeredTo) userWhere.createdAt.lte = filters.registeredTo;
  }

  // Subscription tier filter
  if (filters.subscriptionTier && filters.subscriptionTier.length > 0) {
    userWhere.subscriptionTier = { in: filters.subscriptionTier };
  }

  // Exclude user IDs
  if (filters.excludeUserIds && filters.excludeUserIds.length > 0) {
    userWhere.id = { notIn: filters.excludeUserIds };
  }

  // Get initial user list
  let userIds = (
    await prisma.user.findMany({
      where: userWhere,
      select: { id: true },
    })
  ).map((u) => u.id);

  // Filter by subscription status
  if (filters.subscriptionStatus && filters.subscriptionStatus.length > 0) {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: { in: userIds },
        status: { in: filters.subscriptionStatus },
      },
      select: { userId: true },
    });
    const subUserIds = new Set(subscriptions.map((s) => s.userId));
    userIds = userIds.filter((id) => subUserIds.has(id));
  }

  // Filter by last active date
  if (filters.lastActiveFrom || filters.lastActiveTo) {
    const engagementWhere: Prisma.UserEngagementStatsWhereInput = {
      userId: { in: userIds },
    };

    if (filters.lastActiveFrom || filters.lastActiveTo) {
      engagementWhere.lastActiveAt = {};
      if (filters.lastActiveFrom) engagementWhere.lastActiveAt.gte = filters.lastActiveFrom;
      if (filters.lastActiveTo) engagementWhere.lastActiveAt.lte = filters.lastActiveTo;
    }

    const engagementStats = await prisma.userEngagementStats.findMany({
      where: engagementWhere,
      select: { userId: true },
    });
    const activeUserIds = new Set(engagementStats.map((s) => s.userId));
    userIds = userIds.filter((id) => activeUserIds.has(id));
  }

  // Filter by engagement score
  if (filters.engagementScoreMin !== undefined || filters.engagementScoreMax !== undefined) {
    const engagementWhere: Prisma.UserEngagementStatsWhereInput = {
      userId: { in: userIds },
    };

    const scoreFilter: { gte?: number; lte?: number } = {};
    if (filters.engagementScoreMin !== undefined) {
      scoreFilter.gte = filters.engagementScoreMin;
    }
    if (filters.engagementScoreMax !== undefined) {
      scoreFilter.lte = filters.engagementScoreMax;
    }
    engagementWhere.engagementScore = scoreFilter;

    const engagementStats = await prisma.userEngagementStats.findMany({
      where: engagementWhere,
      select: { userId: true },
    });
    const scoreUserIds = new Set(engagementStats.map((s) => s.userId));
    userIds = userIds.filter((id) => scoreUserIds.has(id));
  }

  // Filter by completed programs
  if (filters.completedPrograms && filters.completedPrograms.length > 0) {
    const completedProgress = await prisma.videoProgress.findMany({
      where: {
        userId: { in: userIds },
        lessonType: 'PROGRAM_SESSION',
        completed: true,
      },
      select: { userId: true },
    });
    const completedUserIds = new Set(completedProgress.map((p) => p.userId));
    userIds = userIds.filter((id) => completedUserIds.has(id));
  }

  return userIds;
}

/**
 * Get target audience count
 */
export async function getTargetAudienceCount(
  filters?: TargetAudienceFilter,
): Promise<number> {
  const userIds = await getTargetAudience(filters);
  return userIds.length;
}

// ============================================
// Campaign Stats
// ============================================

/**
 * Get campaign statistics
 */
export async function getCampaignStats(id: string): Promise<CampaignStats> {
  const campaign = await prisma.communicationCampaign.findUnique({
    where: { id },
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  // Calculate rates
  const deliveryRate =
    campaign.sentCount > 0
      ? (campaign.deliveredCount / campaign.sentCount) * 100
      : 0;

  const openRate =
    campaign.deliveredCount > 0
      ? (campaign.openedCount / campaign.deliveredCount) * 100
      : 0;

  const clickRate =
    campaign.openedCount > 0
      ? (campaign.clickedCount / campaign.openedCount) * 100
      : 0;

  return {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    totalRecipients: campaign.totalRecipients,
    sentCount: campaign.sentCount,
    failedCount: campaign.failedCount,
    deliveredCount: campaign.deliveredCount,
    openedCount: campaign.openedCount,
    clickedCount: campaign.clickedCount,
    deliveryRate: Math.round(deliveryRate * 100) / 100,
    openRate: Math.round(openRate * 100) / 100,
    clickRate: Math.round(clickRate * 100) / 100,
    startedAt: campaign.startedAt,
    completedAt: campaign.completedAt,
  };
}

/**
 * Process scheduled campaigns (called by cron job)
 */
export async function processScheduledCampaigns(): Promise<number> {
  const now = new Date();

  const dueCampaigns = await prisma.communicationCampaign.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledAt: { lte: now },
    },
  });

  let processedCount = 0;

  for (const campaign of dueCampaigns) {
    try {
      await executeCampaign(campaign.id);
      processedCount++;
    } catch (error) {
      logger.error({ error, campaignId: campaign.id }, 'Failed to execute scheduled campaign');
    }
  }

  if (processedCount > 0) {
    logger.info({ processedCount }, 'Processed scheduled campaigns');
  }

  return processedCount;
}
