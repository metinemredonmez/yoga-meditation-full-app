/**
 * AI Agent Admin Routes
 * Super Admin dashboard for managing AI agents, rules, templates, and analytics
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../utils/database';
import { authenticate, requireRoles } from '../../middleware/auth';
import { aiAgentService } from '../../services/aiAgentService';
import { logger } from '../../utils/logger';
import { AgentType, AgentChannel, AgentEventStatus } from '@prisma/client';

const router = Router();

// All routes require SUPER_ADMIN
router.use(authenticate);
router.use(requireRoles('SUPER_ADMIN'));

// ============================================
// Validation Schemas
// ============================================

const createRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  agentType: z.nativeEnum(AgentType),
  trigger: z.record(z.string(), z.any()), // Required Json field
  conditions: z.record(z.string(), z.any()).optional(),
  action: z.record(z.string(), z.any()), // Required Json field
  priority: z.number().min(0).max(10).default(0),
  cooldownHours: z.number().min(1).max(168).default(24),
  maxPerDay: z.number().min(1).max(10).default(1),
  isActive: z.boolean().default(true),
});

const updateRuleSchema = createRuleSchema.partial();

const createTemplateSchema = z.object({
  name: z.string().min(1),
  agentType: z.nativeEnum(AgentType),
  channel: z.nativeEnum(AgentChannel),
  titleTemplate: z.string().min(1),
  bodyTemplate: z.string().min(1),
  variables: z.array(z.string()).default([]),
  language: z.string().default('tr'),
  isActive: z.boolean().default(true),
});

const updateTemplateSchema = createTemplateSchema.partial();

const analyticsQuerySchema = z.object({
  startDate: z.string().transform((s) => new Date(s)),
  endDate: z.string().transform((s) => new Date(s)),
  agentType: z.nativeEnum(AgentType).optional(),
  channel: z.nativeEnum(AgentChannel).optional(),
});

const logsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  userId: z.string().optional(),
  agentType: z.nativeEnum(AgentType).optional(),
  channel: z.nativeEnum(AgentChannel).optional(),
  status: z.nativeEnum(AgentEventStatus).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const triggerAgentSchema = z.object({
  userId: z.string(),
  agentType: z.nativeEnum(AgentType).optional(),
});

// ============================================
// Dashboard Overview
// ============================================

/**
 * GET /api/admin/ai-agents/overview
 * Get AI Agent dashboard overview
 */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Today's stats
    const todayStats = await prisma.ai_agent_events.groupBy({
      by: ['channel'],
      where: { createdAt: { gte: today } },
      _count: true,
    });

    // Yesterday's stats for comparison
    const yesterdayStats = await prisma.ai_agent_events.groupBy({
      by: ['channel'],
      where: { createdAt: { gte: yesterday, lt: today } },
      _count: true,
    });

    // Agent performance
    const agentPerformance = await prisma.ai_agent_analytics.findMany({
      where: { date: { gte: weekAgo } },
      orderBy: { date: 'desc' },
    });

    // Calculate totals
    const todayTotal = todayStats.reduce((sum, s) => sum + s._count, 0);
    const yesterdayTotal = yesterdayStats.reduce((sum, s) => sum + s._count, 0);

    // Active rules count
    const activeRulesCount = await prisma.ai_agent_rules.count({
      where: { isActive: true },
    });

    // Active templates count
    const activeTemplatesCount = await prisma.ai_agent_templates.count({
      where: { isActive: true },
    });

    // Recent alerts (high priority events that failed)
    const recentAlerts = await prisma.ai_agent_events.findMany({
      where: {
        createdAt: { gte: weekAgo },
        OR: [
          { status: 'FAILED' },
          { priority: { gte: 2 } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    // Users at risk (high churn score)
    const usersAtRisk = await prisma.user_engagement_scores.count({
      where: { churnRisk: { gte: 70 } },
    });

    res.json({
      success: true,
      data: {
        today: {
          total: todayTotal,
          byChannel: todayStats.reduce((acc, s) => ({ ...acc, [s.channel]: s._count }), {}),
          changePercent: yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal * 100).toFixed(1) : 0,
        },
        weeklyPerformance: agentPerformance,
        activeRules: activeRulesCount,
        activeTemplates: activeTemplatesCount,
        usersAtRisk,
        recentAlerts,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get AI agent overview');
    res.status(500).json({ success: false, error: 'Failed to get overview' });
  }
});

// ============================================
// Rules Management
// ============================================

/**
 * GET /api/admin/ai-agents/rules
 * List all agent rules
 */
router.get('/rules', async (req: Request, res: Response) => {
  try {
    const rules = await prisma.ai_agent_rules.findMany({
      orderBy: [{ agentType: 'asc' }, { priority: 'desc' }],
    });

    res.json({
      success: true,
      data: rules,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to list agent rules');
    res.status(500).json({ success: false, error: 'Failed to list rules' });
  }
});

/**
 * GET /api/admin/ai-agents/rules/:id
 * Get single rule
 */
router.get('/rules/:id', async (req: Request, res: Response) => {
  try {
    const rule = await prisma.ai_agent_rules.findUnique({
      where: { id: req.params.id },
      include: {
        events: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!rule) {
      return res.status(404).json({ success: false, error: 'Rule not found' });
    }

    res.json({ success: true, data: rule });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get rule');
    res.status(500).json({ success: false, error: 'Failed to get rule' });
  }
});

/**
 * POST /api/admin/ai-agents/rules
 * Create new rule
 */
router.post('/rules', async (req: Request, res: Response) => {
  try {
    const parsed = createRuleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Invalid input', details: parsed.error.issues });
    }

    const rule = await prisma.ai_agent_rules.create({
      data: parsed.data as any,
    });

    logger.info({ ruleId: rule.id }, 'AI agent rule created');

    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    logger.error({ err: error }, 'Failed to create rule');
    res.status(500).json({ success: false, error: 'Failed to create rule' });
  }
});

/**
 * PUT /api/admin/ai-agents/rules/:id
 * Update rule
 */
router.put('/rules/:id', async (req: Request, res: Response) => {
  try {
    const parsed = updateRuleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Invalid input', details: parsed.error.issues });
    }

    const rule = await prisma.ai_agent_rules.update({
      where: { id: req.params.id },
      data: parsed.data as any,
    });

    res.json({ success: true, data: rule });
  } catch (error) {
    logger.error({ err: error }, 'Failed to update rule');
    res.status(500).json({ success: false, error: 'Failed to update rule' });
  }
});

/**
 * PATCH /api/admin/ai-agents/rules/:id/toggle
 * Toggle rule active status
 */
router.patch('/rules/:id/toggle', async (req: Request, res: Response) => {
  try {
    const rule = await prisma.ai_agent_rules.findUnique({
      where: { id: req.params.id },
    });

    if (!rule) {
      return res.status(404).json({ success: false, error: 'Rule not found' });
    }

    const updated = await prisma.ai_agent_rules.update({
      where: { id: req.params.id },
      data: { isActive: !rule.isActive },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    logger.error({ err: error }, 'Failed to toggle rule');
    res.status(500).json({ success: false, error: 'Failed to toggle rule' });
  }
});

/**
 * DELETE /api/admin/ai-agents/rules/:id
 * Delete rule
 */
router.delete('/rules/:id', async (req: Request, res: Response) => {
  try {
    await prisma.ai_agent_rules.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true, message: 'Rule deleted' });
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete rule');
    res.status(500).json({ success: false, error: 'Failed to delete rule' });
  }
});

// ============================================
// Templates Management
// ============================================

/**
 * GET /api/admin/ai-agents/templates
 * List all templates
 */
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const { agentType, channel, language } = req.query;

    const templates = await prisma.ai_agent_templates.findMany({
      where: {
        ...(agentType && { agentType: agentType as AgentType }),
        ...(channel && { channel: channel as AgentChannel }),
        ...(language && { language: language as string }),
      },
      orderBy: [{ agentType: 'asc' }, { name: 'asc' }],
    });

    res.json({ success: true, data: templates });
  } catch (error) {
    logger.error({ err: error }, 'Failed to list templates');
    res.status(500).json({ success: false, error: 'Failed to list templates' });
  }
});

/**
 * GET /api/admin/ai-agents/templates/:id
 * Get single template
 */
router.get('/templates/:id', async (req: Request, res: Response) => {
  try {
    const template = await prisma.ai_agent_templates.findUnique({
      where: { id: req.params.id },
    });

    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    res.json({ success: true, data: template });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get template');
    res.status(500).json({ success: false, error: 'Failed to get template' });
  }
});

/**
 * POST /api/admin/ai-agents/templates
 * Create new template
 */
router.post('/templates', async (req: Request, res: Response) => {
  try {
    const parsed = createTemplateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Invalid input', details: parsed.error.issues });
    }

    const template = await prisma.ai_agent_templates.create({
      data: parsed.data,
    });

    logger.info({ templateId: template.id }, 'AI agent template created');

    res.status(201).json({ success: true, data: template });
  } catch (error) {
    logger.error({ err: error }, 'Failed to create template');
    res.status(500).json({ success: false, error: 'Failed to create template' });
  }
});

/**
 * PUT /api/admin/ai-agents/templates/:id
 * Update template
 */
router.put('/templates/:id', async (req: Request, res: Response) => {
  try {
    const parsed = updateTemplateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Invalid input', details: parsed.error.issues });
    }

    const template = await prisma.ai_agent_templates.update({
      where: { id: req.params.id },
      data: parsed.data,
    });

    res.json({ success: true, data: template });
  } catch (error) {
    logger.error({ err: error }, 'Failed to update template');
    res.status(500).json({ success: false, error: 'Failed to update template' });
  }
});

/**
 * DELETE /api/admin/ai-agents/templates/:id
 * Delete template
 */
router.delete('/templates/:id', async (req: Request, res: Response) => {
  try {
    await prisma.ai_agent_templates.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete template');
    res.status(500).json({ success: false, error: 'Failed to delete template' });
  }
});

// ============================================
// Analytics
// ============================================

/**
 * GET /api/admin/ai-agents/analytics
 * Get agent analytics
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const parsed = analyticsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Invalid query', details: parsed.error.issues });
    }

    const { startDate, endDate, agentType, channel } = parsed.data;

    const analytics = await prisma.ai_agent_analytics.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        ...(agentType && { agentType }),
        ...(channel && { channel }),
      },
      orderBy: { date: 'desc' },
    });

    // Calculate aggregates
    const totals = analytics.reduce((acc, a) => ({
      sent: acc.sent + a.totalSent,
      delivered: acc.delivered + a.totalDelivered,
      opened: acc.opened + a.totalOpened,
      clicked: acc.clicked + a.totalClicked,
      failed: acc.failed + a.totalFailed,
    }), { sent: 0, delivered: 0, opened: 0, clicked: 0, failed: 0 });

    const rates = {
      deliveryRate: totals.sent > 0 ? (totals.delivered / totals.sent * 100).toFixed(2) : 0,
      openRate: totals.delivered > 0 ? (totals.opened / totals.delivered * 100).toFixed(2) : 0,
      clickRate: totals.opened > 0 ? (totals.clicked / totals.opened * 100).toFixed(2) : 0,
    };

    // Group by agent type
    const byAgentType = analytics.reduce((acc, a) => {
      const agentTypeKey = a.agentType || 'UNKNOWN';
      if (!acc[agentTypeKey]) {
        acc[agentTypeKey] = { sent: 0, opened: 0, clicked: 0 };
      }
      acc[agentTypeKey].sent += a.totalSent;
      acc[agentTypeKey].opened += a.totalOpened;
      acc[agentTypeKey].clicked += a.totalClicked;
      return acc;
    }, {} as Record<string, { sent: number; opened: number; clicked: number }>);

    res.json({
      success: true,
      data: {
        daily: analytics,
        totals,
        rates,
        byAgentType,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get analytics');
    res.status(500).json({ success: false, error: 'Failed to get analytics' });
  }
});

/**
 * GET /api/admin/ai-agents/analytics/:agentType
 * Get analytics for specific agent type
 */
router.get('/analytics/:agentType', async (req: Request, res: Response) => {
  try {
    const agentType = req.params.agentType as AgentType;
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const analytics = await prisma.ai_agent_analytics.findMany({
      where: {
        agentType,
        date: { gte: startDate },
      },
      orderBy: { date: 'desc' },
    });

    // Get recent events for this agent
    const recentEvents = await prisma.ai_agent_events.findMany({
      where: { agentType },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { firstName: true, email: true } },
      },
    });

    res.json({
      success: true,
      data: {
        analytics,
        recentEvents,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get agent analytics');
    res.status(500).json({ success: false, error: 'Failed to get agent analytics' });
  }
});

// ============================================
// Logs
// ============================================

/**
 * GET /api/admin/ai-agents/logs
 * Get agent event logs
 */
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const parsed = logsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Invalid query', details: parsed.error.issues });
    }

    const { page, limit, userId, agentType, channel, status, startDate, endDate } = parsed.data;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) where.userId = userId;
    if (agentType) where.agentType = agentType;
    if (channel) where.channel = channel;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.ai_agent_events.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          rule: { select: { name: true } },
        },
      }),
      prisma.ai_agent_events.count({ where }),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get logs');
    res.status(500).json({ success: false, error: 'Failed to get logs' });
  }
});

/**
 * GET /api/admin/ai-agents/logs/:id
 * Get single log entry
 */
router.get('/logs/:id', async (req: Request, res: Response) => {
  try {
    const log = await prisma.ai_agent_events.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        rule: true,
      },
    });

    if (!log) {
      return res.status(404).json({ success: false, error: 'Log not found' });
    }

    res.json({ success: true, data: log });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get log');
    res.status(500).json({ success: false, error: 'Failed to get log' });
  }
});

// ============================================
// Manual Trigger
// ============================================

/**
 * POST /api/admin/ai-agents/trigger
 * Manually trigger agents for a user
 */
router.post('/trigger', async (req: Request, res: Response) => {
  try {
    const parsed = triggerAgentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Invalid input', details: parsed.error.issues });
    }

    const { userId, agentType } = parsed.data;

    // Verify user exists
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Process agents
    const messages = await aiAgentService.processAgents(userId);

    // Filter by agent type if specified
    const filteredMessages = agentType
      ? messages.filter((m) => aiAgentService.inferAgentType(m) === agentType)
      : messages;

    // Save events
    const savedEvents: string[] = [];
    for (const message of filteredMessages) {
      const type = aiAgentService.inferAgentType(message);
      const eventId = await aiAgentService.saveAgentEvent(userId, type, message);
      savedEvents.push(eventId);
    }

    logger.info({ userId, triggeredBy: (req as any).user.id, messageCount: filteredMessages.length }, 'Manual agent trigger');

    res.json({
      success: true,
      data: {
        userId,
        userName: user.firstName,
        messages: filteredMessages,
        eventIds: savedEvents,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to trigger agents');
    res.status(500).json({ success: false, error: 'Failed to trigger agents' });
  }
});

/**
 * POST /api/admin/ai-agents/batch-trigger
 * Trigger agents for multiple users
 */
router.post('/batch-trigger', async (req: Request, res: Response) => {
  try {
    const { limit = 100 } = req.body;

    const results = await aiAgentService.batchProcessAgents(limit);

    const summary = {
      usersProcessed: results.size,
      totalMessages: Array.from(results.values()).reduce((sum, msgs) => sum + msgs.length, 0),
    };

    logger.info({ ...summary, triggeredBy: (req as any).user.id }, 'Batch agent trigger');

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to batch trigger agents');
    res.status(500).json({ success: false, error: 'Failed to batch trigger agents' });
  }
});

// ============================================
// User Preferences Management
// ============================================

/**
 * GET /api/admin/ai-agents/users/:userId/preferences
 * Get user's agent preferences
 */
router.get('/users/:userId/preferences', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    const prefs = await aiAgentService.getUserPreferences(userId);
    const context = await aiAgentService.getUserContext(userId);

    res.json({
      success: true,
      data: {
        preferences: prefs,
        context,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get user preferences');
    res.status(500).json({ success: false, error: 'Failed to get preferences' });
  }
});

/**
 * GET /api/admin/ai-agents/users/:userId/events
 * Get user's agent events
 */
router.get('/users/:userId/events', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    const events = await prisma.ai_agent_events.findMany({
      where: { userId: req.params.userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { rule: { select: { name: true } } },
    });

    res.json({ success: true, data: events });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get user events');
    res.status(500).json({ success: false, error: 'Failed to get events' });
  }
});

// ============================================
// Engagement Scores
// ============================================

/**
 * GET /api/admin/ai-agents/engagement-scores
 * Get users by engagement/churn risk
 */
router.get('/engagement-scores', async (req: Request, res: Response) => {
  try {
    const { minChurnRisk = 0, maxChurnRisk = 100, limit = 50 } = req.query;

    const scores = await prisma.user_engagement_scores.findMany({
      where: {
        churnRisk: {
          gte: parseFloat(minChurnRisk as string),
          lte: parseFloat(maxChurnRisk as string),
        },
      },
      orderBy: { churnRisk: 'desc' },
      take: parseInt(limit as string),
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, subscriptionTier: true },
        },
      },
    });

    res.json({ success: true, data: scores });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get engagement scores');
    res.status(500).json({ success: false, error: 'Failed to get scores' });
  }
});

/**
 * POST /api/admin/ai-agents/engagement-scores/recalculate
 * Recalculate engagement scores for all users
 */
router.post('/engagement-scores/recalculate', async (req: Request, res: Response) => {
  try {
    const { limit = 100 } = req.body;

    // Get users to recalculate
    const users = await prisma.users.findMany({
      where: { isActive: true },
      select: { id: true },
      take: limit,
    });

    let updated = 0;
    for (const user of users) {
      try {
        const context = await aiAgentService.getUserContext(user.id);
        if (!context) continue;

        // Calculate scores
        const activityScore = Math.max(0, 100 - context.daysSinceActive * 5);
        const streakScore = Math.min(100, context.streakDays * 3);
        const contentScore = Math.min(100, context.totalMinutes / 10);

        let churnRisk = 0;
        if (context.daysSinceActive > 7) churnRisk += 30;
        if (context.daysSinceActive > 14) churnRisk += 30;
        if (context.daysSinceActive > 30) churnRisk += 40;
        if (context.streakDays === 0) churnRisk += 10;
        if (context.subscriptionTier === 'FREE') churnRisk += 10;

        const overallScore = (activityScore + streakScore + contentScore) / 3;

        await prisma.user_engagement_scores.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            overallScore,
            activityScore,
            streakScore,
            contentScore,
            churnRisk: Math.min(100, churnRisk),
            lastCalculatedAt: new Date(),
          },
          update: {
            overallScore,
            activityScore,
            streakScore,
            contentScore,
            churnRisk: Math.min(100, churnRisk),
            lastCalculatedAt: new Date(),
          },
        });

        updated++;
      } catch (err) {
        logger.error({ err, userId: user.id }, 'Failed to calculate engagement score');
      }
    }

    res.json({
      success: true,
      data: { usersProcessed: users.length, updated },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to recalculate scores');
    res.status(500).json({ success: false, error: 'Failed to recalculate scores' });
  }
});

export default router;
