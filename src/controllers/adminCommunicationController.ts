import { Request, Response, NextFunction } from 'express';
import { MessageChannel, MessageCategory } from '@prisma/client';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import * as messageTemplateService from '../services/messageTemplateService';
import * as campaignService from '../services/campaignService';
import * as unifiedMessagingService from '../services/unifiedMessagingService';
import * as messageQueueService from '../services/messageQueueService';
import { triggerJob } from '../jobs/messageJobs';

// ============================================
// Message Templates
// ============================================

export async function listTemplates(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { channel, category, isActive } = req.query;

    const templates = await messageTemplateService.getAllTemplates({
      channel: channel as MessageChannel | undefined,
      category: category as MessageCategory | undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTemplate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id as string;

    const template = await messageTemplateService.getTemplateById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
      });
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
}

export async function createTemplate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const {
      name,
      slug,
      subject,
      bodyHtml,
      bodyText,
      bodyPush,
      bodySms,
      channel,
      category,
      variables,
      isActive,
    } = req.body;

    const template = await messageTemplateService.createTemplate({
      name,
      slug,
      subject,
      bodyHtml,
      bodyText,
      bodyPush,
      bodySms,
      channel,
      category,
      variables,
      isActive,
    });

    logger.info({ templateId: template.id, slug }, 'Template created by admin');

    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTemplate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id as string;
    const {
      name,
      subject,
      bodyHtml,
      bodyText,
      bodyPush,
      bodySms,
      variables,
      isActive,
    } = req.body;

    const template = await messageTemplateService.updateTemplate(id, {
      name,
      subject,
      bodyHtml,
      bodyText,
      bodyPush,
      bodySms,
      variables,
      isActive,
    });

    logger.info({ templateId: id }, 'Template updated by admin');

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTemplate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id as string;

    await messageTemplateService.deleteTemplate(id);

    logger.info({ templateId: id }, 'Template deleted by admin');

    res.json({
      success: true,
      message: 'Template deleted',
    });
  } catch (error) {
    next(error);
  }
}

export async function testTemplate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id as string;
    const { testEmail, testUserId, variables } = req.body;

    const template = await messageTemplateService.getTemplateById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
      });
    }

    // Render template with test variables
    const rendered = await messageTemplateService.renderTemplate(id, {
      firstName: 'Test Kullanıcı',
      appUrl: 'https://app.yogaapp.com',
      ...variables,
    });

    // If test email provided, send it
    if (testEmail) {
      const result = await unifiedMessagingService.sendMessage({
        userId: testUserId || req.user!.id,
        channel: template.channel,
        subject: rendered.subject,
        body: rendered.bodyText || rendered.bodyPush || rendered.bodySms || '',
        bodyHtml: rendered.bodyHtml,
        templateId: id,
        metadata: { isTest: true },
      });

      return res.json({
        success: result.success,
        data: {
          rendered,
          sendResult: result,
        },
      });
    }

    res.json({
      success: true,
      data: { rendered },
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Campaigns
// ============================================

export async function listCampaigns(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { status, channel, page, limit } = req.query;

    const result = await campaignService.listCampaigns({
      status: status as any,
      channel: channel as MessageChannel | undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getCampaign(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id as string;

    const campaign = await campaignService.getCampaignById(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found',
      });
    }

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
}

export async function createCampaign(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const {
      name,
      description,
      templateId,
      targetAudience,
      channel,
      scheduledAt,
    } = req.body;

    const campaign = await campaignService.createCampaign({
      name,
      description,
      templateId,
      targetAudience,
      channel,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      createdById: req.user!.id as string,
    });

    logger.info({ campaignId: campaign.id, name }, 'Campaign created by admin');

    res.status(201).json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCampaign(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id as string;
    const {
      name,
      description,
      templateId,
      targetAudience,
      channel,
      scheduledAt,
    } = req.body;

    const campaign = await campaignService.updateCampaign(id, {
      name,
      description,
      templateId,
      targetAudience,
      channel,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
    });

    logger.info({ campaignId: id }, 'Campaign updated by admin');

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCampaign(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id as string;

    await campaignService.deleteCampaign(id);

    logger.info({ campaignId: id }, 'Campaign deleted by admin');

    res.json({
      success: true,
      message: 'Campaign deleted',
    });
  } catch (error) {
    next(error);
  }
}

export async function scheduleCampaign(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id as string;
    const { scheduledAt } = req.body;

    const campaign = await campaignService.scheduleCampaign(
      id as string,
      new Date(scheduledAt),
    );

    logger.info({ campaignId: id, scheduledAt }, 'Campaign scheduled by admin');

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
}

export async function executeCampaign(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id as string;

    const stats = await campaignService.executeCampaign(id);

    logger.info({ campaignId: id, stats }, 'Campaign executed by admin');

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

export async function pauseCampaign(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id as string;

    const campaign = await campaignService.pauseCampaign(id);

    logger.info({ campaignId: id }, 'Campaign paused by admin');

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
}

export async function resumeCampaign(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id as string;

    const campaign = await campaignService.resumeCampaign(id);

    logger.info({ campaignId: id }, 'Campaign resumed by admin');

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelCampaign(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id as string;

    const campaign = await campaignService.cancelCampaign(id);

    logger.info({ campaignId: id }, 'Campaign cancelled by admin');

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCampaignStats(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id as string;

    const stats = await campaignService.getCampaignStats(id);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTargetAudiencePreview(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const filters = req.body;

    const count = await campaignService.getTargetAudienceCount(filters);
    const preview = await campaignService.getTargetAudience(filters);

    res.json({
      success: true,
      data: {
        totalCount: count,
        sampleUserIds: preview.slice(0, 10),
      },
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Scheduled Messages
// ============================================

export async function listScheduledMessages(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { status, page, limit } = req.query;

    const pageNum = page ? parseInt(page as string) : 1;
    const limitNum = limit ? parseInt(limit as string) : 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) where.status = status;

    const [messages, total] = await Promise.all([
      prisma.scheduledMessage.findMany({
        where,
        include: {
          template: { select: { id: true, name: true, slug: true } },
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { scheduledAt: 'asc' },
        skip,
        take: limitNum,
      }),
      prisma.scheduledMessage.count({ where }),
    ]);

    res.json({
      success: true,
      data: messages,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelScheduledMessage(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id as string;

    await prisma.scheduledMessage.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    logger.info({ messageId: id }, 'Scheduled message cancelled by admin');

    res.json({
      success: true,
      message: 'Scheduled message cancelled',
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Statistics
// ============================================

export async function getCommunicationStats(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Message logs stats
    const [
      totalSent,
      totalDelivered,
      totalOpened,
      totalClicked,
      totalFailed,
      byChannel,
    ] = await Promise.all([
      prisma.messageLog.count({
        where: { status: { in: ['SENT', 'DELIVERED', 'OPENED', 'CLICKED'] } },
      }),
      prisma.messageLog.count({
        where: { status: { in: ['DELIVERED', 'OPENED', 'CLICKED'] } },
      }),
      prisma.messageLog.count({
        where: { status: { in: ['OPENED', 'CLICKED'] } },
      }),
      prisma.messageLog.count({
        where: { status: 'CLICKED' },
      }),
      prisma.messageLog.count({
        where: { status: 'FAILED' },
      }),
      prisma.messageLog.groupBy({
        by: ['channel'],
        _count: true,
      }),
    ]);

    // Campaign stats
    const [totalCampaigns, activeCampaigns, completedCampaigns] = await Promise.all([
      prisma.communicationCampaign.count(),
      prisma.communicationCampaign.count({
        where: { status: { in: ['DRAFT', 'SCHEDULED', 'IN_PROGRESS'] } },
      }),
      prisma.communicationCampaign.count({
        where: { status: 'COMPLETED' },
      }),
    ]);

    // Queue stats
    const queueStats = await messageQueueService.getQueueStats();

    res.json({
      success: true,
      data: {
        messages: {
          totalSent,
          totalDelivered,
          totalOpened,
          totalClicked,
          totalFailed,
          deliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
          openRate: totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0,
          clickRate: totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0,
          byChannel: byChannel.reduce((acc, item) => {
            acc[item.channel] = item._count;
            return acc;
          }, {} as Record<string, number>),
        },
        campaigns: {
          total: totalCampaigns,
          active: activeCampaigns,
          completed: completedCampaigns,
        },
        queues: queueStats,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getDailyStats(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { days = 30 } = req.query;
    const daysNum = parseInt(days as string);
    const startDate = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);

    const dailyStats = await prisma.messageLog.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: true,
    });

    // Group by day
    const statsByDay = dailyStats.reduce((acc, stat) => {
      const day = stat.createdAt.toISOString().split('T')[0]!;
      acc[day] = (acc[day] || 0) + stat._count;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: statsByDay,
    });
  } catch (error) {
    next(error);
  }
}

export async function getStatsByTemplate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const stats = await prisma.messageLog.groupBy({
      by: ['templateId'],
      _count: true,
      where: {
        templateId: { not: null },
      },
    });

    // Get template names
    const templateIds = stats.map((s) => s.templateId).filter(Boolean) as string[];
    const templates = await prisma.messageTemplate.findMany({
      where: { id: { in: templateIds } },
      select: { id: true, name: true, slug: true },
    });

    const templateMap = new Map(templates.map((t) => [t.id, t]));

    const result = stats.map((s) => ({
      template: templateMap.get(s.templateId!),
      count: s._count,
    }));

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getStatsByChannel(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const stats = await prisma.messageLog.groupBy({
      by: ['channel', 'status'],
      _count: true,
    });

    const result = stats.reduce((acc, stat) => {
      if (!acc[stat.channel]) {
        acc[stat.channel] = {};
      }
      acc[stat.channel]![stat.status] = stat._count;
      return acc;
    }, {} as Record<string, Record<string, number>>);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Jobs
// ============================================

export async function triggerJobHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const jobName = req.params.jobName as string;

    await triggerJob(jobName);

    logger.info({ jobName, triggeredBy: req.user!.id }, 'Job triggered manually');

    res.json({
      success: true,
      message: `Job ${jobName} triggered`,
    });
  } catch (error) {
    next(error);
  }
}
