/**
 * Notification Dispatcher
 * Coordinates notification sending with user preference checks
 * Acts as a facade for email, SMS, and push notification services
 */

import { NotificationType } from '@prisma/client';
import type { NotificationChannel } from './notificationPreferenceService';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { canSendNotification, getEligibleUsers, buildUnsubscribeUrl } from './notificationPreferenceService';
import { SmsMessageType } from '@prisma/client';
import { sendEmail, EmailPayload, EmailResult } from './emailService';
import { sendSms, SendSmsResult } from './smsService';
import { sendToUser, sendToUsers, NotificationPayload, SendResult } from './pushNotificationService';

export interface NotificationOptions {
  skipPreferenceCheck?: boolean; // For security alerts
  unsubscribeUrl?: string;
}

/**
 * Send email with preference check
 */
export async function sendEmailWithPreferences(
  userId: string,
  type: NotificationType,
  payload: EmailPayload,
  options: NotificationOptions = {},
): Promise<EmailResult> {
  // Security alerts always go through
  if (type !== 'SECURITY' && !options.skipPreferenceCheck) {
    const canSend = await canSendNotification(userId, 'EMAIL', type);
    if (!canSend) {
      logger.debug({ userId, type }, 'Email blocked by user preferences');
      return { delivered: false, reason: 'Blocked by user preferences' };
    }
  }

  // Add unsubscribe URL to email if not provided
  if (!options.unsubscribeUrl && type !== 'SECURITY') {
    const unsubscribeUrl = await buildUnsubscribeUrl(userId, type);
    // Append to HTML if present
    if (payload.html) {
      payload.html = appendUnsubscribeLink(payload.html, unsubscribeUrl);
    }
    if (payload.text) {
      payload.text += `\n\n---\nBildirim tercihlerinizi yonetmek icin: ${unsubscribeUrl}`;
    }
  }

  return sendEmail(payload);
}

/**
 * Send SMS with preference check
 */
export async function sendSmsWithPreferences(
  userId: string,
  phoneNumber: string,
  message: string,
  type: NotificationType,
  smsType: SmsMessageType = 'NOTIFICATION',
  options: NotificationOptions = {},
): Promise<SendSmsResult> {
  // Security alerts always go through
  if (type !== 'SECURITY' && !options.skipPreferenceCheck) {
    const canSend = await canSendNotification(userId, 'SMS', type);
    if (!canSend) {
      logger.debug({ userId, type }, 'SMS blocked by user preferences');
      return {
        success: false,
        logId: '',
        error: 'Blocked by user preferences',
      };
    }
  }

  return sendSms(phoneNumber, message, userId, smsType);
}

/**
 * Send push notification with preference check
 */
export async function sendPushWithPreferences(
  userId: string,
  type: NotificationType,
  payload: NotificationPayload,
  options: NotificationOptions = {},
): Promise<SendResult> {
  // Security alerts always go through
  if (type !== 'SECURITY' && !options.skipPreferenceCheck) {
    const canSend = await canSendNotification(userId, 'PUSH', type);
    if (!canSend) {
      logger.debug({ userId, type }, 'Push notification blocked by user preferences');
      return {
        success: false,
        successCount: 0,
        failureCount: 0,
        error: 'Blocked by user preferences',
      };
    }
  }

  return sendToUser(userId, payload);
}

/**
 * Send push notification to multiple users with preference filtering
 */
export async function sendPushToUsersWithPreferences(
  userIds: string[],
  type: NotificationType,
  payload: NotificationPayload,
): Promise<{ totalSuccess: number; totalFailure: number; filtered: number }> {
  // Get eligible users based on preferences
  const eligibleUserIds = await getEligibleUsers('PUSH', type, userIds);
  const filtered = userIds.length - eligibleUserIds.length;

  if (eligibleUserIds.length === 0) {
    logger.info({ type, filtered }, 'No eligible users for push notification');
    return { totalSuccess: 0, totalFailure: 0, filtered };
  }

  const result = await sendToUsers(eligibleUserIds, payload);

  logger.info(
    { type, total: userIds.length, eligible: eligibleUserIds.length, filtered },
    'Sent push notifications with preference filtering',
  );

  return {
    totalSuccess: result.totalSuccess,
    totalFailure: result.totalFailure,
    filtered,
  };
}

/**
 * Send multi-channel notification
 */
export async function sendMultiChannelNotification(
  userId: string,
  type: NotificationType,
  notification: {
    email?: EmailPayload;
    sms?: { phoneNumber: string; message: string; type?: SmsMessageType };
    push?: NotificationPayload;
  },
  options: NotificationOptions = {},
): Promise<{
  email?: EmailResult;
  sms?: SendSmsResult;
  push?: SendResult;
}> {
  const results: {
    email?: EmailResult;
    sms?: SendSmsResult;
    push?: SendResult;
  } = {};

  const promises: Promise<void>[] = [];

  if (notification.email) {
    const emailPayload = notification.email;
    promises.push(
      sendEmailWithPreferences(userId, type, emailPayload, options).then((result) => {
        results.email = result;
      }),
    );
  }

  if (notification.sms) {
    const smsPayload = notification.sms;
    promises.push(
      sendSmsWithPreferences(
        userId,
        smsPayload.phoneNumber,
        smsPayload.message,
        type,
        smsPayload.type ?? 'NOTIFICATION',
        options,
      ).then((result) => {
        results.sms = result;
      }),
    );
  }

  if (notification.push) {
    const pushPayload = notification.push;
    promises.push(
      sendPushWithPreferences(userId, type, pushPayload, options).then((result) => {
        results.push = result;
      }),
    );
  }

  await Promise.all(promises);

  return results;
}

/**
 * Send security alert (bypasses all preferences)
 */
export async function sendSecurityAlert(
  userId: string,
  notification: {
    email?: EmailPayload;
    sms?: { phoneNumber: string; message: string };
    push?: NotificationPayload;
  },
): Promise<{
  email?: EmailResult;
  sms?: SendSmsResult;
  push?: SendResult;
}> {
  return sendMultiChannelNotification(userId, 'SECURITY', notification, {
    skipPreferenceCheck: true,
  });
}

/**
 * Helper: Append unsubscribe link to HTML email
 */
function appendUnsubscribeLink(html: string, unsubscribeUrl: string): string {
  const unsubscribeHtml = `
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="font-size: 12px; color: #888; text-align: center;">
      <a href="${unsubscribeUrl}" style="color: #888;">Bildirim tercihlerini yonet</a>
    </p>
  `;

  // Try to insert before closing body tag
  if (html.includes('</body>')) {
    return html.replace('</body>', `${unsubscribeHtml}</body>`);
  }

  // Otherwise append
  return html + unsubscribeHtml;
}

/**
 * Get user's email for notifications
 */
export async function getUserEmail(userId: string): Promise<string | null> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  return user?.email ?? null;
}

/**
 * Get user's phone for notifications
 */
export async function getUserPhone(userId: string): Promise<string | null> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { phoneNumber: true },
  });
  return user?.phoneNumber ?? null;
}

/**
 * Send notification to user on all their preferred channels
 */
export async function notifyUser(
  userId: string,
  type: NotificationType,
  content: {
    title: string;
    body: string;
    emailSubject?: string;
    emailHtml?: string;
  },
): Promise<void> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { email: true, phoneNumber: true, firstName: true },
  });

  if (!user) {
    logger.warn({ userId }, 'User not found for notification');
    return;
  }

  const emailPayload: EmailPayload = {
    to: user.email,
    subject: content.emailSubject || content.title,
    text: content.body,
  };
  if (content.emailHtml) {
    emailPayload.html = content.emailHtml;
  }

  await sendMultiChannelNotification(userId, type, {
    email: emailPayload,
    ...(user.phoneNumber && {
      sms: {
        phoneNumber: user.phoneNumber,
        message: `${content.title}: ${content.body}`.slice(0, 160),
      },
    }),
    push: {
      title: content.title,
      body: content.body,
    },
  });
}
