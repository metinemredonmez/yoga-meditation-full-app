import { Request, Response } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { prisma } from '../utils/database';
import { sendEmail } from '../services/emailService';
import { sendPushNotification } from '../services/pushService';
import { sendSms } from '../services/smsService';
import { reminderSchema } from '../validation/reminderSchemas';

const testNotificationSchema = z.object({
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  deviceToken: z.string().optional(),
  message: z.string().default('Test notification from Yoga App'),
  subject: z.string().default('Yoga App Notification'),
});

export async function sendTestNotification(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = testNotificationSchema.parse(req.body ?? {});

    if (!payload.email && !payload.phoneNumber && !payload.deviceToken) {
      return res.status(400).json({ error: 'Provide at least one contact: email, phoneNumber or deviceToken' });
    }

    const deliveries: string[] = [];

    if (payload.email) {
      await sendEmail({ to: payload.email, subject: payload.subject, text: payload.message });
      deliveries.push('email');
    }

    if (payload.phoneNumber) {
      await sendSms(payload.phoneNumber, payload.message, req.user.userId, 'NOTIFICATION');
      deliveries.push('sms');
    }

    if (payload.deviceToken) {
      await sendPushNotification({ deviceToken: payload.deviceToken, title: payload.subject, body: payload.message });
      deliveries.push('push');
    }

    await prisma.audit_logs.create({
      data: {
        userId: req.user.userId,
        actorRole: req.user.role,
        action: 'notification.test',
        metadata: {
          channels: deliveries,
        },
      },
    });

    return res.json({
      message: 'Notification dispatched',
      channels: deliveries,
      preview: payload.message,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Send test notification failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function scheduleReminder(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = reminderSchema.parse(req.body);

    if (!payload.classId && !payload.programSessionId) {
      return res.status(400).json({ error: 'Provide classId or programSessionId' });
    }

    const sendAt = payload.sendAt ? new Date(payload.sendAt) : new Date(Date.now() + 60 * 60 * 1000);

    logger.info(
      {
        userId: req.user.userId,
        ...payload,
        sendAt,
      },
      'Reminder scheduled (mock queue)',
    );

    await prisma.audit_logs.create({
      data: {
        userId: req.user.userId,
        actorRole: req.user.role,
        action: 'reminder.schedule',
        metadata: {
          ...payload,
          sendAt,
        },
      },
    });

    return res.status(201).json({ message: 'Reminder scheduled', sendAt });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to schedule reminder');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
