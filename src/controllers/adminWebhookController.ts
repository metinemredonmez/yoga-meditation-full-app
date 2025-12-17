import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/database';
import {
  getDeliveryStats,
  purgeOldDeliveries,
} from '../services/webhookDeliveryService';
import {
  triggerQueueProcessing,
  triggerRetryProcessing,
  isProcessorRunning,
} from '../jobs/webhookProcessor';
import { logger } from '../utils/logger';

/**
 * List all webhook endpoints (admin view)
 */
export async function handleAdminListEndpoints(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, isActive, page = 1, limit = 20 } = req.query;

    const where = {
      ...(userId && { userId: userId as string }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
    };

    const [endpoints, total] = await Promise.all([
      prisma.webhookEndpoint.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          _count: {
            select: { deliveries: true },
          },
        },
      }),
      prisma.webhookEndpoint.count({ where }),
    ]);

    const safeEndpoints = endpoints.map((endpoint) => {
      const { secret: _, ...rest } = endpoint;
      return {
        ...rest,
        deliveryCount: endpoint._count.deliveries,
      };
    });

    res.json({
      success: true,
      data: safeEndpoints,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a specific endpoint (admin view)
 */
export async function handleAdminGetEndpoint(req: Request, res: Response, next: NextFunction) {
  try {
    const endpointId = req.params.endpointId as string;

    const endpoint = await prisma.webhookEndpoint.findUnique({
      where: { id: endpointId },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        _count: {
          select: { deliveries: true },
        },
      },
    });

    if (!endpoint) {
      res.status(404).json({
        success: false,
        error: 'Webhook endpoint not found',
      });
      return;
    }

    const { secret: _, ...safeEndpoint } = endpoint;

    res.json({
      success: true,
      data: {
        ...safeEndpoint,
        deliveryCount: endpoint._count.deliveries,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Force disable an endpoint (admin)
 */
export async function handleAdminDisableEndpoint(req: Request, res: Response, next: NextFunction) {
  try {
    const endpointId = req.params.endpointId as string;

    const endpoint = await prisma.webhookEndpoint.update({
      where: { id: endpointId },
      data: { isActive: false },
    });

    logger.info({ endpointId, adminId: req.user!.userId }, 'Admin disabled webhook endpoint');

    res.json({
      success: true,
      data: endpoint,
      message: 'Webhook endpoint disabled',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Force enable an endpoint (admin)
 */
export async function handleAdminEnableEndpoint(req: Request, res: Response, next: NextFunction) {
  try {
    const endpointId = req.params.endpointId as string;

    const endpoint = await prisma.webhookEndpoint.update({
      where: { id: endpointId },
      data: {
        isActive: true,
        failureCount: 0, // Reset failure count
      },
    });

    logger.info({ endpointId, adminId: req.user!.userId }, 'Admin enabled webhook endpoint');

    res.json({
      success: true,
      data: endpoint,
      message: 'Webhook endpoint enabled',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete an endpoint (admin)
 */
export async function handleAdminDeleteEndpoint(req: Request, res: Response, next: NextFunction) {
  try {
    const endpointId = req.params.endpointId as string;

    await prisma.webhookEndpoint.delete({
      where: { id: endpointId },
    });

    logger.info({ endpointId, adminId: req.user!.userId }, 'Admin deleted webhook endpoint');

    res.json({
      success: true,
      message: 'Webhook endpoint deleted',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List all deliveries (admin view)
 */
export async function handleAdminListDeliveries(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, event, endpointId, userId, page = 1, limit = 20, startDate, endDate } = req.query;

    const where = {
      ...(status && { status: status as any }),
      ...(event && { event: event as any }),
      ...(endpointId && { endpointId: endpointId as string }),
      ...(userId && { endpoint: { userId: userId as string } }),
      ...(startDate && { createdAt: { gte: new Date(startDate as string) } }),
      ...(endDate && { createdAt: { lte: new Date(endDate as string) } }),
    };

    const [deliveries, total] = await Promise.all([
      prisma.webhookDelivery.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          endpoint: {
            select: { id: true, name: true, url: true, userId: true },
          },
        },
      }),
      prisma.webhookDelivery.count({ where }),
    ]);

    res.json({
      success: true,
      data: deliveries,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get global delivery statistics
 */
export async function handleAdminGetStats(req: Request, res: Response, next: NextFunction) {
  try {
    const [deliveryStats, endpointStats, recentFailures] = await Promise.all([
      getDeliveryStats(),
      prisma.webhookEndpoint.groupBy({
        by: ['isActive'],
        _count: true,
      }),
      prisma.webhookEndpoint.findMany({
        where: {
          failureCount: { gt: 0 },
        },
        orderBy: { failureCount: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          url: true,
          failureCount: true,
          lastFailureAt: true,
          isActive: true,
          user: {
            select: { id: true, email: true },
          },
        },
      }),
    ]);

    const endpointCounts = endpointStats.reduce(
      (acc, item) => {
        if (item.isActive) {
          acc.active = item._count;
        } else {
          acc.inactive = item._count;
        }
        return acc;
      },
      { active: 0, inactive: 0 }
    );

    res.json({
      success: true,
      data: {
        deliveries: deliveryStats,
        endpoints: endpointCounts,
        endpointsWithFailures: recentFailures,
        processorRunning: isProcessorRunning(),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Purge old deliveries
 */
export async function handleAdminPurgeDeliveries(req: Request, res: Response, next: NextFunction) {
  try {
    const { daysOld = 30 } = req.body;

    const purged = await purgeOldDeliveries(Number(daysOld));

    logger.info({ purged, daysOld, adminId: req.user!.userId }, 'Admin purged webhook deliveries');

    res.json({
      success: true,
      data: { purged },
      message: `Purged ${purged} delivery records older than ${daysOld} days`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Manually trigger queue processing
 */
export async function handleAdminTriggerProcessing(req: Request, res: Response, next: NextFunction) {
  try {
    const processed = await triggerQueueProcessing();

    logger.info({ processed, adminId: req.user!.userId }, 'Admin triggered queue processing');

    res.json({
      success: true,
      data: { processed },
      message: `Processed ${processed} deliveries`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Manually trigger retry processing
 */
export async function handleAdminTriggerRetry(req: Request, res: Response, next: NextFunction) {
  try {
    const retried = await triggerRetryProcessing();

    logger.info({ retried, adminId: req.user!.userId }, 'Admin triggered retry processing');

    res.json({
      success: true,
      data: { retried },
      message: `Retried ${retried} failed deliveries`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get processor status
 */
export async function handleAdminGetProcessorStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const running = isProcessorRunning();

    res.json({
      success: true,
      data: {
        running,
        status: running ? 'active' : 'stopped',
      },
    });
  } catch (error) {
    next(error);
  }
}

export const adminWebhookController = {
  handleAdminListEndpoints,
  handleAdminGetEndpoint,
  handleAdminDisableEndpoint,
  handleAdminEnableEndpoint,
  handleAdminDeleteEndpoint,
  handleAdminListDeliveries,
  handleAdminGetStats,
  handleAdminPurgeDeliveries,
  handleAdminTriggerProcessing,
  handleAdminTriggerRetry,
  handleAdminGetProcessorStatus,
};
