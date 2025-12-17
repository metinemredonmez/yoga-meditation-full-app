import { DevicePlatform, NotificationStatus, Prisma } from '@prisma/client';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { getMessaging, isFirebaseConfigured } from './firebaseService';

const FCM_BATCH_LIMIT = 500;

export interface DeviceInfo {
  id: string;
  token: string;
  platform: DevicePlatform;
  deviceName: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export interface SendResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  logId?: string;
  error?: string;
}

export async function registerDevice(
  userId: string,
  token: string,
  platform: DevicePlatform,
  deviceName?: string,
): Promise<DeviceInfo> {
  // Upsert - aynı token varsa güncelle, yoksa oluştur
  const device = await prisma.deviceToken.upsert({
    where: { token },
    create: {
      userId,
      token,
      platform,
      deviceName: deviceName ?? null,
      isActive: true,
    },
    update: {
      userId, // Token başka kullanıcıya geçebilir (reinstall)
      platform,
      deviceName: deviceName ?? null,
      isActive: true,
      updatedAt: new Date(),
    },
  });

  logger.info({ userId, platform, deviceName }, 'Device registered for push notifications');

  return {
    id: device.id,
    token: device.token,
    platform: device.platform,
    deviceName: device.deviceName,
    isActive: device.isActive,
    createdAt: device.createdAt,
  };
}

export async function unregisterDevice(userId: string, token: string): Promise<boolean> {
  try {
    await prisma.deviceToken.deleteMany({
      where: {
        userId,
        token,
      },
    });

    logger.info({ userId, token: token.slice(0, 20) + '...' }, 'Device unregistered');
    return true;
  } catch {
    return false;
  }
}

export async function getUserDevices(userId: string): Promise<DeviceInfo[]> {
  const devices = await prisma.deviceToken.findMany({
    where: { userId, isActive: true },
    orderBy: { updatedAt: 'desc' },
  });

  return devices.map((d) => ({
    id: d.id,
    token: d.token,
    platform: d.platform,
    deviceName: d.deviceName,
    isActive: d.isActive,
    createdAt: d.createdAt,
  }));
}

async function createNotificationLog(
  userId: string,
  payload: NotificationPayload,
  status: NotificationStatus,
  errorMessage?: string,
): Promise<string> {
  const log = await prisma.notificationLog.create({
    data: {
      userId,
      title: payload.title,
      body: payload.body,
      data: payload.data ? (payload.data as Prisma.JsonObject) : Prisma.JsonNull,
      status,
      errorMessage: errorMessage ?? null,
      sentAt: status === 'SENT' ? new Date() : null,
    },
  });
  return log.id;
}

async function updateNotificationLog(
  logId: string,
  status: NotificationStatus,
  errorMessage?: string,
): Promise<void> {
  await prisma.notificationLog.update({
    where: { id: logId },
    data: {
      status,
      errorMessage: errorMessage ?? null,
      ...(status === 'SENT' && { sentAt: new Date() }),
    },
  });
}

export async function sendToUser(
  userId: string,
  payload: NotificationPayload,
): Promise<SendResult> {
  if (!isFirebaseConfigured()) {
    logger.warn({ userId }, 'Firebase not configured - notification skipped');
    return { success: false, successCount: 0, failureCount: 0, error: 'Firebase not configured' };
  }

  const messaging = getMessaging();
  if (!messaging) {
    return { success: false, successCount: 0, failureCount: 0, error: 'Firebase messaging unavailable' };
  }

  // Get user's active device tokens
  const devices = await prisma.deviceToken.findMany({
    where: { userId, isActive: true },
    select: { id: true, token: true },
  });

  if (devices.length === 0) {
    logger.info({ userId }, 'No active devices for user - notification skipped');
    return { success: true, successCount: 0, failureCount: 0 };
  }

  const tokens = devices.map((d) => d.token);
  const logId = await createNotificationLog(userId, payload, 'PENDING');

  try {
    // Send in batches if needed
    let successCount = 0;
    let failureCount = 0;
    const invalidTokens: string[] = [];

    for (let i = 0; i < tokens.length; i += FCM_BATCH_LIMIT) {
      const batch = tokens.slice(i, i + FCM_BATCH_LIMIT);

      const response = await messaging.sendEachForMulticast({
        tokens: batch,
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
        },
        ...(payload.data && { data: payload.data }),
      });

      successCount += response.successCount;
      failureCount += response.failureCount;

      // Collect invalid tokens for cleanup
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error) {
          const errorCode = resp.error.code;
          if (
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/registration-token-not-registered'
          ) {
            invalidTokens.push(batch[idx]!);
          }
        }
      });
    }

    // Deactivate invalid tokens
    if (invalidTokens.length > 0) {
      await prisma.deviceToken.updateMany({
        where: { token: { in: invalidTokens } },
        data: { isActive: false },
      });
      logger.info({ count: invalidTokens.length }, 'Deactivated invalid device tokens');
    }

    await updateNotificationLog(logId, successCount > 0 ? 'SENT' : 'FAILED');

    logger.info(
      { userId, successCount, failureCount, title: payload.title },
      'Push notification sent to user',
    );

    return { success: successCount > 0, successCount, failureCount, logId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await updateNotificationLog(logId, 'FAILED', errorMessage);

    logger.error({ err: error, userId }, 'Failed to send push notification');
    return { success: false, successCount: 0, failureCount: tokens.length, logId, error: errorMessage };
  }
}

export async function sendToUsers(
  userIds: string[],
  payload: NotificationPayload,
): Promise<{ totalSuccess: number; totalFailure: number; results: Map<string, SendResult> }> {
  const results = new Map<string, SendResult>();
  let totalSuccess = 0;
  let totalFailure = 0;

  // Process users in parallel with limit
  const PARALLEL_LIMIT = 10;
  for (let i = 0; i < userIds.length; i += PARALLEL_LIMIT) {
    const batch = userIds.slice(i, i + PARALLEL_LIMIT);
    const batchResults = await Promise.all(
      batch.map(async (userId) => {
        const result = await sendToUser(userId, payload);
        return { userId, result };
      }),
    );

    batchResults.forEach(({ userId, result }) => {
      results.set(userId, result);
      totalSuccess += result.successCount;
      totalFailure += result.failureCount;
    });
  }

  return { totalSuccess, totalFailure, results };
}

export async function sendToTopic(
  topic: string,
  payload: NotificationPayload,
): Promise<SendResult> {
  if (!isFirebaseConfigured()) {
    logger.warn({ topic }, 'Firebase not configured - topic notification skipped');
    return { success: false, successCount: 0, failureCount: 0, error: 'Firebase not configured' };
  }

  const messaging = getMessaging();
  if (!messaging) {
    return { success: false, successCount: 0, failureCount: 0, error: 'Firebase messaging unavailable' };
  }

  try {
    const response = await messaging.send({
      topic,
      notification: {
        title: payload.title,
        body: payload.body,
        ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
      },
      ...(payload.data && { data: payload.data }),
    });

    logger.info({ topic, messageId: response, title: payload.title }, 'Topic notification sent');

    return { success: true, successCount: 1, failureCount: 0 };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ err: error, topic }, 'Failed to send topic notification');
    return { success: false, successCount: 0, failureCount: 1, error: errorMessage };
  }
}

export async function subscribeToTopic(tokens: string[], topic: string): Promise<boolean> {
  if (!isFirebaseConfigured()) {
    logger.warn({ topic }, 'Firebase not configured - subscription skipped');
    return false;
  }

  const messaging = getMessaging();
  if (!messaging) {
    return false;
  }

  try {
    const response = await messaging.subscribeToTopic(tokens, topic);
    logger.info(
      { topic, successCount: response.successCount, failureCount: response.failureCount },
      'Subscribed to topic',
    );
    return response.successCount > 0;
  } catch (error) {
    logger.error({ err: error, topic }, 'Failed to subscribe to topic');
    return false;
  }
}

export async function unsubscribeFromTopic(tokens: string[], topic: string): Promise<boolean> {
  if (!isFirebaseConfigured()) {
    logger.warn({ topic }, 'Firebase not configured - unsubscription skipped');
    return false;
  }

  const messaging = getMessaging();
  if (!messaging) {
    return false;
  }

  try {
    const response = await messaging.unsubscribeFromTopic(tokens, topic);
    logger.info(
      { topic, successCount: response.successCount, failureCount: response.failureCount },
      'Unsubscribed from topic',
    );
    return response.successCount > 0;
  } catch (error) {
    logger.error({ err: error, topic }, 'Failed to unsubscribe from topic');
    return false;
  }
}

// Helper: Get notification history for a user
export async function getUserNotificationHistory(
  userId: string,
  limit = 50,
): Promise<{
  id: string;
  title: string;
  body: string;
  status: NotificationStatus;
  sentAt: Date | null;
  createdAt: Date;
}[]> {
  const logs = await prisma.notificationLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      body: true,
      status: true,
      sentAt: true,
      createdAt: true,
    },
  });

  return logs;
}
