import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { DevicePlatform } from '@prisma/client';
import {
  registerDeviceBodySchema,
  unregisterDeviceBodySchema,
  sendTestNotificationBodySchema,
} from '../validation/pushNotificationSchemas';
import {
  registerDevice,
  unregisterDevice,
  getUserDevices,
  sendToUser,
} from '../services/pushNotificationService';
import { isFirebaseConfigured } from '../services/firebaseService';
import { logger } from '../utils/logger';

export async function handleRegisterDevice(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = registerDeviceBodySchema.parse(req.body);

    const device = await registerDevice(
      req.user.userId,
      payload.token,
      payload.platform as DevicePlatform,
      payload.deviceName,
    );

    return res.status(201).json({
      message: 'Device registered successfully',
      device: {
        id: device.id,
        platform: device.platform,
        deviceName: device.deviceName,
        isActive: device.isActive,
        createdAt: device.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to register device');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleUnregisterDevice(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = unregisterDeviceBodySchema.parse(req.body);

    const success = await unregisterDevice(req.user.userId, payload.token);

    if (!success) {
      return res.status(404).json({ error: 'Device not found' });
    }

    return res.status(204).send();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to unregister device');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleGetDevices(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const devices = await getUserDevices(req.user.userId);

    return res.json({
      devices: devices.map((d) => ({
        id: d.id,
        platform: d.platform,
        deviceName: d.deviceName,
        isActive: d.isActive,
        createdAt: d.createdAt,
      })),
      count: devices.length,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get devices');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleSendTestNotification(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if Firebase is configured
    if (!isFirebaseConfigured()) {
      return res.status(503).json({
        error: 'Push notifications are not configured',
        message: 'Firebase credentials are missing. Contact administrator.',
      });
    }

    const payload = sendTestNotificationBodySchema.parse(req.body);

    const result = await sendToUser(req.user.userId, {
      title: payload.title,
      body: payload.body,
      ...(payload.data && { data: payload.data }),
    });

    if (!result.success && result.successCount === 0) {
      // Check if user has no devices
      const devices = await getUserDevices(req.user.userId);
      if (devices.length === 0) {
        return res.status(400).json({
          error: 'No registered devices',
          message: 'You need to register a device first to receive push notifications.',
        });
      }

      return res.status(500).json({
        error: 'Failed to send notification',
        message: result.error,
      });
    }

    return res.json({
      message: 'Test notification sent',
      result: {
        success: result.success,
        successCount: result.successCount,
        failureCount: result.failureCount,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to send test notification');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleGetNotificationStatus(req: Request, res: Response) {
  try {
    const configured = isFirebaseConfigured();

    return res.json({
      configured,
      message: configured
        ? 'Push notifications are enabled'
        : 'Push notifications are not configured',
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get notification status');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
