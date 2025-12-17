import { Request, Response, NextFunction } from 'express';
import {
  createEndpoint,
  updateEndpoint,
  deleteEndpoint,
  getEndpoint,
  listEndpoints,
  testEndpoint,
  rotateSecret,
  enableEndpoint,
  disableEndpoint,
  getAvailableEvents,
} from '../services/webhookService';
import {
  listDeliveries,
  getDeliveryStatus,
  retryDelivery,
  cancelDelivery,
  getDeliveryStats,
} from '../services/webhookDeliveryService';
import { eventDescriptions } from '../validation/webhookSchemas';
import { logger } from '../utils/logger';

/**
 * Create a new webhook endpoint
 */
export async function handleCreateEndpoint(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { name, url, events } = req.body;

    const endpoint = await createEndpoint({
      userId,
      name,
      url,
      events,
    });

    res.status(201).json({
      success: true,
      data: endpoint,
      message: 'Webhook endpoint created. Please save the secret - it will not be shown again.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing webhook endpoint
 */
export async function handleUpdateEndpoint(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const endpointId = req.params.endpointId as string;
    const updates = req.body;

    const endpoint = await updateEndpoint(endpointId, userId, updates);

    res.json({
      success: true,
      data: endpoint,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a webhook endpoint
 */
export async function handleDeleteEndpoint(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const endpointId = req.params.endpointId as string;

    await deleteEndpoint(endpointId, userId);

    res.json({
      success: true,
      message: 'Webhook endpoint deleted',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single webhook endpoint
 */
export async function handleGetEndpoint(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const endpointId = req.params.endpointId as string;

    const endpoint = await getEndpoint(endpointId, userId);

    if (!endpoint) {
      res.status(404).json({
        success: false,
        error: 'Webhook endpoint not found',
      });
      return;
    }

    res.json({
      success: true,
      data: endpoint,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List all webhook endpoints for the current user
 */
export async function handleListEndpoints(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;

    const endpoints = await listEndpoints(userId);

    res.json({
      success: true,
      data: endpoints,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Test a webhook endpoint
 */
export async function handleTestEndpoint(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const endpointId = req.params.endpointId as string;

    const delivery = await testEndpoint(endpointId, userId);

    res.json({
      success: true,
      data: delivery,
      message: 'Test webhook queued for delivery',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Rotate the secret for a webhook endpoint
 */
export async function handleRotateSecret(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const endpointId = req.params.endpointId as string;

    const result = await rotateSecret(endpointId, userId);

    res.json({
      success: true,
      data: result,
      message: 'Secret rotated. Please save the new secret - it will not be shown again.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Enable a webhook endpoint
 */
export async function handleEnableEndpoint(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const endpointId = req.params.endpointId as string;

    const endpoint = await enableEndpoint(endpointId, userId);

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
 * Disable a webhook endpoint
 */
export async function handleDisableEndpoint(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const endpointId = req.params.endpointId as string;

    const endpoint = await disableEndpoint(endpointId, userId);

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
 * List deliveries for an endpoint
 */
export async function handleListDeliveries(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const endpointId = req.params.endpointId as string;
    const { status, event, page, limit, startDate, endDate } = req.query;

    // Verify endpoint ownership
    const endpoint = await getEndpoint(endpointId, userId);
    if (!endpoint) {
      res.status(404).json({
        success: false,
        error: 'Webhook endpoint not found',
      });
      return;
    }

    const result = await listDeliveries(endpointId, {
      status: status as any,
      event: event as any,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.json({
      success: true,
      data: result.deliveries,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get delivery status
 */
export async function handleGetDelivery(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const deliveryId = req.params.deliveryId as string;

    const delivery = await getDeliveryStatus(deliveryId);

    if (!delivery) {
      res.status(404).json({
        success: false,
        error: 'Delivery not found',
      });
      return;
    }

    // Verify endpoint ownership
    const endpoint = await getEndpoint(delivery.endpointId, userId);
    if (!endpoint) {
      res.status(404).json({
        success: false,
        error: 'Delivery not found',
      });
      return;
    }

    res.json({
      success: true,
      data: delivery,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retry a failed delivery
 */
export async function handleRetryDelivery(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const deliveryId = req.params.deliveryId as string;

    const delivery = await getDeliveryStatus(deliveryId);

    if (!delivery) {
      res.status(404).json({
        success: false,
        error: 'Delivery not found',
      });
      return;
    }

    // Verify endpoint ownership
    const endpoint = await getEndpoint(delivery.endpointId, userId);
    if (!endpoint) {
      res.status(404).json({
        success: false,
        error: 'Delivery not found',
      });
      return;
    }

    const success = await retryDelivery(deliveryId);

    res.json({
      success: true,
      data: { retried: success },
      message: success ? 'Delivery retry initiated' : 'Could not retry delivery',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cancel a pending delivery
 */
export async function handleCancelDelivery(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const deliveryId = req.params.deliveryId as string;

    const delivery = await getDeliveryStatus(deliveryId);

    if (!delivery) {
      res.status(404).json({
        success: false,
        error: 'Delivery not found',
      });
      return;
    }

    // Verify endpoint ownership
    const endpoint = await getEndpoint(delivery.endpointId, userId);
    if (!endpoint) {
      res.status(404).json({
        success: false,
        error: 'Delivery not found',
      });
      return;
    }

    const success = await cancelDelivery(deliveryId);

    res.json({
      success: true,
      data: { cancelled: success },
      message: success ? 'Delivery cancelled' : 'Could not cancel delivery (may not be pending)',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get delivery statistics for an endpoint
 */
export async function handleGetDeliveryStats(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const endpointId = req.params.endpointId as string;

    // Verify endpoint ownership
    const endpoint = await getEndpoint(endpointId, userId);
    if (!endpoint) {
      res.status(404).json({
        success: false,
        error: 'Webhook endpoint not found',
      });
      return;
    }

    const stats = await getDeliveryStats(endpointId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get available webhook events
 */
export async function handleGetAvailableEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const events = getAvailableEvents();

    const eventsWithDescriptions = events.map((event) => ({
      event,
      description: eventDescriptions[event],
    }));

    res.json({
      success: true,
      data: eventsWithDescriptions,
    });
  } catch (error) {
    next(error);
  }
}

export const webhookController = {
  handleCreateEndpoint,
  handleUpdateEndpoint,
  handleDeleteEndpoint,
  handleGetEndpoint,
  handleListEndpoints,
  handleTestEndpoint,
  handleRotateSecret,
  handleEnableEndpoint,
  handleDisableEndpoint,
  handleListDeliveries,
  handleGetDelivery,
  handleRetryDelivery,
  handleCancelDelivery,
  handleGetDeliveryStats,
  handleGetAvailableEvents,
};
