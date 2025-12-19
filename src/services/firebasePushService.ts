import * as admin from 'firebase-admin';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { prisma } from '../utils/database';

// Initialize Firebase Admin SDK
let firebaseApp: admin.app.App | null = null;

export function initializeFirebase(): boolean {
  if (firebaseApp) return true;

  try {
    const serviceAccount = config.FIREBASE_SERVICE_ACCOUNT;

    if (!serviceAccount) {
      logger.warn('Firebase service account not configured');
      return false;
    }

    // Parse service account if it's a string (from env variable)
    const credentials = typeof serviceAccount === 'string'
      ? JSON.parse(serviceAccount)
      : serviceAccount;

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(credentials),
      projectId: credentials.project_id
    });

    logger.info({ projectId: credentials.project_id }, 'Firebase Admin SDK initialized');
    return true;
  } catch (error) {
    logger.error({ err: error }, 'Failed to initialize Firebase Admin SDK');
    return false;
  }
}

// ============================================
// Core Push Notification Functions
// ============================================

interface PushNotificationPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  badge?: number;
  sound?: string;
  channelId?: string; // Android notification channel
  priority?: 'high' | 'normal';
}

interface MulticastPayload {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export async function sendPushToDevice(payload: PushNotificationPayload): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  if (!firebaseApp) {
    if (!initializeFirebase()) {
      return { success: false, error: 'Firebase not initialized' };
    }
  }

  try {
    const message: admin.messaging.Message = {
      token: payload.token,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl
      },
      data: payload.data,
      android: {
        priority: payload.priority || 'high',
        notification: {
          channelId: payload.channelId || 'default',
          sound: payload.sound || 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK'
        }
      },
      apns: {
        headers: {
          'apns-priority': payload.priority === 'high' ? '10' : '5'
        },
        payload: {
          aps: {
            badge: payload.badge,
            sound: payload.sound || 'default',
            contentAvailable: true
          }
        }
      }
    };

    const response = await admin.messaging().send(message);
    logger.info({ messageId: response }, 'Push notification sent');

    return { success: true, messageId: response };
  } catch (error: unknown) {
    const err = error as Error & { code?: string };
    logger.error({ err, errorCode: err.code }, 'Failed to send push notification');

    // Handle invalid tokens
    if (err.code === 'messaging/registration-token-not-registered' ||
        err.code === 'messaging/invalid-registration-token') {
      await removeInvalidToken(payload.token);
    }

    return { success: false, error: err.message };
  }
}

export async function sendPushToMultipleDevices(payload: MulticastPayload): Promise<{
  successCount: number;
  failureCount: number;
  failedTokens: string[];
}> {
  if (!firebaseApp) {
    if (!initializeFirebase()) {
      return { successCount: 0, failureCount: payload.tokens.length, failedTokens: payload.tokens };
    }
  }

  if (payload.tokens.length === 0) {
    return { successCount: 0, failureCount: 0, failedTokens: [] };
  }

  try {
    const message: admin.messaging.MulticastMessage = {
      tokens: payload.tokens,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl
      },
      data: payload.data,
      android: {
        priority: 'high',
        notification: {
          channelId: 'default',
          sound: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            contentAvailable: true
          }
        }
      }
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    const failedTokens: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        failedTokens.push(payload.tokens[idx]);
        // Remove invalid tokens
        const errorCode = resp.error?.code;
        if (errorCode === 'messaging/registration-token-not-registered' ||
            errorCode === 'messaging/invalid-registration-token') {
          removeInvalidToken(payload.tokens[idx]);
        }
      }
    });

    logger.info({
      successCount: response.successCount,
      failureCount: response.failureCount
    }, 'Multicast push notification sent');

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      failedTokens
    };
  } catch (error) {
    logger.error({ err: error }, 'Failed to send multicast push notification');
    return { successCount: 0, failureCount: payload.tokens.length, failedTokens: payload.tokens };
  }
}

// ============================================
// Topic-based Notifications
// ============================================

export async function sendPushToTopic(
  topic: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!firebaseApp) {
    if (!initializeFirebase()) {
      return { success: false, error: 'Firebase not initialized' };
    }
  }

  try {
    const message: admin.messaging.Message = {
      topic,
      notification: { title, body },
      data,
      android: { priority: 'high' },
      apns: {
        payload: { aps: { sound: 'default' } }
      }
    };

    const response = await admin.messaging().send(message);
    logger.info({ topic, messageId: response }, 'Topic push notification sent');

    return { success: true, messageId: response };
  } catch (error) {
    logger.error({ err: error, topic }, 'Failed to send topic push notification');
    return { success: false, error: (error as Error).message };
  }
}

export async function subscribeToTopic(tokens: string[], topic: string): Promise<boolean> {
  if (!firebaseApp) {
    if (!initializeFirebase()) return false;
  }

  try {
    const response = await admin.messaging().subscribeToTopic(tokens, topic);
    logger.info({ topic, successCount: response.successCount }, 'Subscribed to topic');
    return response.failureCount === 0;
  } catch (error) {
    logger.error({ err: error, topic }, 'Failed to subscribe to topic');
    return false;
  }
}

export async function unsubscribeFromTopic(tokens: string[], topic: string): Promise<boolean> {
  if (!firebaseApp) {
    if (!initializeFirebase()) return false;
  }

  try {
    const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
    logger.info({ topic, successCount: response.successCount }, 'Unsubscribed from topic');
    return response.failureCount === 0;
  } catch (error) {
    logger.error({ err: error, topic }, 'Failed to unsubscribe from topic');
    return false;
  }
}

// ============================================
// User-specific Push Functions
// ============================================

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ sent: number; failed: number }> {
  // Get user's registered devices
  const devices = await prisma.userDevice.findMany({
    where: { userId, isActive: true },
    select: { token: true }
  });

  if (devices.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const tokens = devices.map(d => d.token);
  const result = await sendPushToMultipleDevices({ tokens, title, body, data });

  return { sent: result.successCount, failed: result.failureCount };
}

export async function sendPushToUsers(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ sent: number; failed: number }> {
  // Get all devices for these users
  const devices = await prisma.userDevice.findMany({
    where: { userId: { in: userIds }, isActive: true },
    select: { token: true }
  });

  if (devices.length === 0) {
    return { sent: 0, failed: 0 };
  }

  // Firebase has a limit of 500 tokens per multicast
  const tokens = devices.map(d => d.token);
  const chunks = chunkArray(tokens, 500);

  let totalSent = 0;
  let totalFailed = 0;

  for (const chunk of chunks) {
    const result = await sendPushToMultipleDevices({ tokens: chunk, title, body, data });
    totalSent += result.successCount;
    totalFailed += result.failureCount;
  }

  return { sent: totalSent, failed: totalFailed };
}

export async function sendPushByRole(
  role: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ sent: number; failed: number }> {
  // Get all users with this role
  const users = await prisma.user.findMany({
    where: { role: role as 'USER' | 'TEACHER' | 'ADMIN', isActive: true },
    select: { id: true }
  });

  if (users.length === 0) {
    return { sent: 0, failed: 0 };
  }

  return sendPushToUsers(users.map(u => u.id), title, body, data);
}

// ============================================
// Notification Templates
// ============================================

export async function sendWelcomeNotification(userId: string): Promise<void> {
  await sendPushToUser(userId, 'Hoş Geldiniz! 🧘', 'Yoga yolculuğunuza başlayın. İlk dersiniz sizi bekliyor!', {
    type: 'welcome',
    screen: 'home'
  });
}

export async function sendClassReminderNotification(
  userId: string,
  className: string,
  minutesUntil: number
): Promise<void> {
  await sendPushToUser(
    userId,
    'Ders Hatırlatması',
    `"${className}" dersiniz ${minutesUntil} dakika sonra başlıyor!`,
    { type: 'class_reminder', screen: 'class' }
  );
}

export async function sendChallengeUpdateNotification(
  userId: string,
  challengeTitle: string,
  progress: number
): Promise<void> {
  await sendPushToUser(
    userId,
    'Challenge Güncelleme 🏆',
    `"${challengeTitle}" - %${progress} tamamlandı! Devam edin!`,
    { type: 'challenge_update', screen: 'challenges' }
  );
}

export async function sendAchievementNotification(
  userId: string,
  achievementName: string,
  xpReward: number
): Promise<void> {
  await sendPushToUser(
    userId,
    'Yeni Başarı Kazandınız! 🎉',
    `"${achievementName}" başarısını açtınız! +${xpReward} XP`,
    { type: 'achievement', screen: 'profile' }
  );
}

export async function sendStreakReminderNotification(userId: string, currentStreak: number): Promise<void> {
  await sendPushToUser(
    userId,
    'Streak\'inizi Koruyun! 🔥',
    `${currentStreak} günlük streak'iniz var! Bugün pratik yapın.`,
    { type: 'streak_reminder', screen: 'home' }
  );
}

export async function sendNewEpisodeNotification(
  podcastTitle: string,
  episodeTitle: string
): Promise<void> {
  // Send to all subscribers of this podcast
  await sendPushToTopic(
    `podcast_${podcastTitle.toLowerCase().replace(/\s/g, '_')}`,
    'Yeni Bölüm 🎙️',
    `${podcastTitle}: "${episodeTitle}" yayında!`,
    { type: 'new_episode', screen: 'podcasts' }
  );
}

// ============================================
// Helper Functions
// ============================================

async function removeInvalidToken(token: string): Promise<void> {
  try {
    await prisma.userDevice.updateMany({
      where: { token },
      data: { isActive: false }
    });
    logger.info('Marked invalid device token as inactive');
  } catch (error) {
    logger.error({ err: error }, 'Failed to mark invalid token');
  }
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Export types
export type { PushNotificationPayload, MulticastPayload };
