import { MessageChannel, MessageLogStatus, Prisma } from '@prisma/client';
import { prisma } from '../utils/database';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import * as emailService from './emailService';
import * as pushNotificationService from './pushNotificationService';
import { sendSms } from './smsService';
import { getMessaging, isFirebaseConfigured } from './firebaseService';

// ============================================
// NetGSM SMS Provider
// ============================================

interface NetGSMResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export function isNetGSMConfigured(): boolean {
  return !!(
    config.sms.netgsmUserCode &&
    config.sms.netgsmPassword &&
    config.sms.netgsmHeader
  );
}

async function sendSmsViaNetGSM(
  phoneNumber: string,
  message: string,
): Promise<NetGSMResponse> {
  if (!isNetGSMConfigured()) {
    return { success: false, error: 'NetGSM not configured' };
  }

  try {
    // NetGSM requires Turkish phone numbers in specific format
    const formattedPhone = phoneNumber.replace(/^\+90/, '').replace(/\D/g, '');

    const params = new URLSearchParams({
      usercode: config.sms.netgsmUserCode!,
      password: config.sms.netgsmPassword!,
      gsmno: formattedPhone,
      message: message,
      msgheader: config.sms.netgsmHeader!,
      filter: '0', // Normal sms
      startdate: '', // Immediate send
      stopdate: '',
    });

    const response = await fetch('https://api.netgsm.com.tr/sms/send/get', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const responseText = await response.text();

    // NetGSM response codes:
    // 00: Success (followed by message ID)
    // 20: Message content is empty
    // 30: Invalid credentials
    // 40: Invalid sender header
    // 50: Invalid recipient number
    // 60: Server error
    // 70: Insufficient balance

    if (responseText.startsWith('00')) {
      const messageId = responseText.split(' ')[1];
      logger.info({ phoneNumber: formattedPhone.slice(-4), messageId }, 'NetGSM SMS sent');
      return { success: true, messageId };
    }

    const errorCode = responseText.substring(0, 2);
    const errorMessages: Record<string, string> = {
      '20': 'Message content is empty',
      '30': 'Invalid credentials',
      '40': 'Invalid sender header',
      '50': 'Invalid recipient number',
      '60': 'Server error',
      '70': 'Insufficient balance',
    };

    const errorMessage = errorMessages[errorCode] || `Unknown error: ${responseText}`;
    logger.error({ errorCode, phoneNumber: formattedPhone.slice(-4) }, 'NetGSM SMS failed');
    return { success: false, error: errorMessage };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error }, 'NetGSM request failed');
    return { success: false, error: errorMessage };
  }
}

// ============================================
// OneSignal Push Provider
// ============================================

interface OneSignalResponse {
  success: boolean;
  notificationId?: string;
  error?: string;
}

// Cache for DB provider settings
let cachedProviderSettings: any = null;
let cacheTime = 0;
const CACHE_TTL = 60000; // 1 minute

async function getDbProviderSettings() {
  const now = Date.now();
  if (cachedProviderSettings && (now - cacheTime) < CACHE_TTL) {
    return cachedProviderSettings;
  }

  try {
    const dbConfig = await prisma.gamification_config.findUnique({
      where: { key: 'push_provider_settings' },
    });
    cachedProviderSettings = dbConfig?.value || null;
    cacheTime = now;
    return cachedProviderSettings;
  } catch {
    return null;
  }
}

export function isOneSignalConfigured(): boolean {
  return !!(config.push.onesignalAppId && config.push.onesignalRestApiKey);
}

async function getOneSignalCredentials(): Promise<{ appId: string; apiKey: string } | null> {
  // First check .env
  if (config.push.onesignalAppId && config.push.onesignalRestApiKey) {
    return {
      appId: config.push.onesignalAppId,
      apiKey: config.push.onesignalRestApiKey,
    };
  }

  // Then check DB (from admin UI)
  const dbSettings = await getDbProviderSettings();
  if (dbSettings?.providers) {
    const onesignal = dbSettings.providers.find((p: any) => p.provider === 'ONESIGNAL' && p.isEnabled && p.isConfigured);
    if (onesignal?.config?.appId && onesignal?.config?.apiKey) {
      return {
        appId: onesignal.config.appId,
        apiKey: onesignal.config.apiKey,
      };
    }
  }

  return null;
}

async function sendPushViaOneSignal(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<OneSignalResponse> {
  const credentials = await getOneSignalCredentials();

  if (!credentials) {
    return { success: false, error: 'OneSignal not configured' };
  }

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials.apiKey}`,
      },
      body: JSON.stringify({
        app_id: credentials.appId,
        include_external_user_ids: userIds,
        headings: { en: title },
        contents: { en: body },
        data: data || {},
      }),
    });

    const result = await response.json() as { id?: string; errors?: unknown[] };

    if (response.ok && result.id) {
      logger.info({ notificationId: result.id, recipientCount: userIds.length }, 'OneSignal push sent');
      return { success: true, notificationId: result.id };
    }

    const errorMessage = result.errors ? JSON.stringify(result.errors) : 'Unknown error';
    logger.error({ errors: result.errors }, 'OneSignal push failed');
    return { success: false, error: errorMessage };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error }, 'OneSignal request failed');
    return { success: false, error: errorMessage };
  }
}

// ============================================
// Unified Message Sending
// ============================================

export interface SendMessageOptions {
  userId: string;
  channel: MessageChannel;
  subject?: string;
  body: string;
  bodyHtml?: string;
  templateId?: string;
  data?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface SendMessageResult {
  success: boolean;
  logId: string;
  provider?: string;
  error?: string;
}

/**
 * Get the preferred SMS provider based on config and availability
 */
function getSmsProvider(): 'twilio' | 'netgsm' | null {
  const provider = config.sms.provider;

  if (provider === 'twilio') {
    return config.sms.twilioAccountSid ? 'twilio' : null;
  }

  if (provider === 'netgsm') {
    return isNetGSMConfigured() ? 'netgsm' : null;
  }

  // Auto: prefer NetGSM for Turkish numbers, Twilio for international
  if (isNetGSMConfigured()) return 'netgsm';
  if (config.sms.twilioAccountSid) return 'twilio';
  return null;
}

/**
 * Get the preferred Push provider based on config and availability
 * Checks both .env and database (admin UI) settings
 */
async function getPushProvider(): Promise<'firebase' | 'onesignal' | null> {
  const provider = config.push.provider;

  // Check DB settings first for enabled providers
  const dbSettings = await getDbProviderSettings();
  if (dbSettings?.providers) {
    const firebaseDb = dbSettings.providers.find((p: any) => p.provider === 'FIREBASE' && p.isEnabled && p.isConfigured);
    const onesignalDb = dbSettings.providers.find((p: any) => p.provider === 'ONESIGNAL' && p.isEnabled && p.isConfigured);

    if (provider === 'firebase' && (firebaseDb || isFirebaseConfigured())) {
      return 'firebase';
    }
    if (provider === 'onesignal' && (onesignalDb || isOneSignalConfigured())) {
      return 'onesignal';
    }

    // Auto mode: prefer what's enabled in DB, then .env
    if (provider === 'auto') {
      if (firebaseDb || isFirebaseConfigured()) return 'firebase';
      if (onesignalDb || isOneSignalConfigured()) return 'onesignal';
    }
  }

  // Fallback to .env only
  if (provider === 'firebase') {
    return isFirebaseConfigured() ? 'firebase' : null;
  }

  if (provider === 'onesignal') {
    return isOneSignalConfigured() ? 'onesignal' : null;
  }

  // Auto: prefer Firebase, fallback to OneSignal
  if (isFirebaseConfigured()) return 'firebase';
  if (isOneSignalConfigured()) return 'onesignal';
  return null;
}

/**
 * Send a message through the specified channel
 */
export async function sendMessage(options: SendMessageOptions): Promise<SendMessageResult> {
  const { userId, channel, subject, body, bodyHtml, templateId, data, metadata } = options;

  // Create message log
  const messageLog = await prisma.message_logs.create({
    data: {
      userId,
      templateId,
      channel,
      subject,
      body,
      status: 'PENDING',
      metadata: (metadata || {}) as Prisma.InputJsonValue,
    },
  });

  try {
    let result: SendMessageResult = {
      success: false,
      logId: messageLog.id,
      error: 'Channel not supported',
    };

    switch (channel) {
      case 'EMAIL':
        result = await sendEmailMessage(userId, subject || '', body, bodyHtml, messageLog.id);
        break;
      case 'PUSH':
        result = await sendPushMessage(userId, subject || '', body, data, messageLog.id);
        break;
      case 'SMS':
        result = await sendSmsMessage(userId, body, messageLog.id);
        break;
      case 'IN_APP':
        result = await sendInAppMessage(userId, subject || '', body, data, messageLog.id);
        break;
    }

    // Update message log
    await prisma.message_logs.update({
      where: { id: messageLog.id },
      data: {
        status: result.success ? 'SENT' : 'FAILED',
        sentAt: result.success ? new Date() : null,
        errorMessage: result.error || null,
      },
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await prisma.message_logs.update({
      where: { id: messageLog.id },
      data: {
        status: 'FAILED',
        errorMessage,
      },
    });

    logger.error({ error, userId, channel }, 'Failed to send message');

    return {
      success: false,
      logId: messageLog.id,
      error: errorMessage,
    };
  }
}

/**
 * Send Email
 */
async function sendEmailMessage(
  userId: string,
  subject: string,
  bodyText: string,
  bodyHtml?: string,
  logId?: string,
): Promise<SendMessageResult> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { email: true, firstName: true },
  });

  if (!user) {
    return { success: false, logId: logId || '', error: 'User not found' };
  }

  try {
    await emailService.sendEmail({
      to: user.email,
      subject,
      text: bodyText,
      html: bodyHtml || bodyText,
    });

    return { success: true, logId: logId || '', provider: 'smtp' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, logId: logId || '', error: errorMessage };
  }
}

/**
 * Send Push Notification
 */
async function sendPushMessage(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
  logId?: string,
): Promise<SendMessageResult> {
  const provider = await getPushProvider();

  if (!provider) {
    logger.warn({ userId }, 'No push provider configured - notification simulated');
    return { success: true, logId: logId || '', provider: 'simulated' };
  }

  if (provider === 'onesignal') {
    const result = await sendPushViaOneSignal([userId], title, body, data);
    return {
      success: result.success,
      logId: logId || '',
      provider: 'onesignal',
      error: result.error,
    };
  }

  // Firebase
  const result = await pushNotificationService.sendToUser(userId, { title, body, data });
  return {
    success: result.success,
    logId: logId || '',
    provider: 'firebase',
    error: result.error,
  };
}

/**
 * Send SMS
 */
async function sendSmsMessage(
  userId: string,
  body: string,
  logId?: string,
): Promise<SendMessageResult> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { phoneNumber: true },
  });

  if (!user?.phoneNumber) {
    return { success: false, logId: logId || '', error: 'User has no phone number' };
  }

  const provider = getSmsProvider();

  if (!provider) {
    logger.warn({ userId }, 'No SMS provider configured - SMS simulated');
    return { success: true, logId: logId || '', provider: 'simulated' };
  }

  if (provider === 'netgsm') {
    const result = await sendSmsViaNetGSM(user.phoneNumber, body);
    return {
      success: result.success,
      logId: logId || '',
      provider: 'netgsm',
      error: result.error,
    };
  }

  // Twilio
  const result = await sendSms(user.phoneNumber, body, userId, 'NOTIFICATION');
  return {
    success: result.success,
    logId: logId || '',
    provider: 'twilio',
    error: result.error,
  };
}

/**
 * Send In-App Notification
 */
async function sendInAppMessage(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
  logId?: string,
): Promise<SendMessageResult> {
  // In-app notifications are stored in NotificationLog and shown in the app
  await prisma.notification_logs.create({
    data: {
      userId,
      title,
      body,
      data: data || {},
      status: 'DELIVERED',
      sentAt: new Date(),
    },
  });

  return { success: true, logId: logId || '', provider: 'in_app' };
}

/**
 * Send message to multiple users
 */
export async function sendMessageToUsers(
  userIds: string[],
  channel: MessageChannel,
  subject: string | undefined,
  body: string,
  options?: {
    bodyHtml?: string;
    templateId?: string;
    data?: Record<string, string>;
    metadata?: Record<string, unknown>;
  },
): Promise<{ successCount: number; failureCount: number; results: SendMessageResult[] }> {
  const results: SendMessageResult[] = [];
  let successCount = 0;
  let failureCount = 0;

  // Process in batches
  const BATCH_SIZE = 50;
  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map((userId) =>
        sendMessage({
          userId,
          channel,
          subject,
          body,
          bodyHtml: options?.bodyHtml,
          templateId: options?.templateId,
          data: options?.data,
          metadata: options?.metadata,
        }),
      ),
    );

    for (const result of batchResults) {
      results.push(result);
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
    }
  }

  return { successCount, failureCount, results };
}

/**
 * Check user preferences before sending
 */
export async function checkUserPreference(
  userId: string,
  category: string,
): Promise<boolean> {
  const preference = await prisma.user_message_preferences.findUnique({
    where: { userId },
  });

  if (!preference) {
    // Default to allowing if no preference set
    return true;
  }

  // Map category to preference field
  const categoryMap: Record<string, keyof typeof preference> = {
    welcome: 'welcomeEmail',
    trial: 'trialReminders',
    subscriptions: 'subscriptionAlerts',
    payments: 'paymentAlerts',
    weekly_digest: 'weeklyDigest',
    monthly_digest: 'monthlyDigest',
    inactivity: 'inactivityReminders',
    challenge: 'challengeReminders',
    content: 'newContentAlerts',
    promotional: 'promotionalMessages',
  };

  const fieldName = categoryMap[category.toLowerCase()];
  if (fieldName && typeof preference[fieldName] === 'boolean') {
    return preference[fieldName] as boolean;
  }

  return true;
}

/**
 * Check if user is in quiet hours
 */
export async function isInQuietHours(userId: string): Promise<boolean> {
  const preference = await prisma.user_message_preferences.findUnique({
    where: { userId },
  });

  if (!preference?.quietHoursEnabled || !preference.quietHoursStart || !preference.quietHoursEnd) {
    return false;
  }

  const timezone = preference.timezone || config.notification.defaultTimezone;

  // Get current time in user's timezone
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const timeStr = formatter.format(now);
  const [hours, minutes] = timeStr.split(':').map(Number);
  const currentMinutes = (hours ?? 0) * 60 + (minutes ?? 0);

  const [startHour, startMin] = preference.quietHoursStart.split(':').map(Number);
  const [endHour, endMin] = preference.quietHoursEnd.split(':').map(Number);
  const startMinutes = (startHour ?? 0) * 60 + (startMin ?? 0);
  const endMinutes = (endHour ?? 0) * 60 + (endMin ?? 0);

  // Handle overnight quiet hours (e.g., 22:00 - 08:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Get message stats for a user
 */
export async function getUserMessageStats(userId: string): Promise<{
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  byChannel: Record<string, number>;
}> {
  const logs = await prisma.message_logs.findMany({
    where: { userId },
    select: {
      channel: true,
      status: true,
    },
  });

  const stats = {
    totalSent: 0,
    totalDelivered: 0,
    totalOpened: 0,
    totalClicked: 0,
    byChannel: {} as Record<string, number>,
  };

  for (const log of logs) {
    stats.byChannel[log.channel] = (stats.byChannel[log.channel] || 0) + 1;

    if (log.status === 'SENT' || log.status === 'DELIVERED' || log.status === 'OPENED' || log.status === 'CLICKED') {
      stats.totalSent++;
    }
    if (log.status === 'DELIVERED' || log.status === 'OPENED' || log.status === 'CLICKED') {
      stats.totalDelivered++;
    }
    if (log.status === 'OPENED' || log.status === 'CLICKED') {
      stats.totalOpened++;
    }
    if (log.status === 'CLICKED') {
      stats.totalClicked++;
    }
  }

  return stats;
}

/**
 * Update message log when email is opened
 */
export async function trackEmailOpen(logId: string): Promise<void> {
  await prisma.message_logs.update({
    where: { id: logId },
    data: {
      status: 'OPENED',
      openedAt: new Date(),
    },
  });
}

/**
 * Update message log when link is clicked
 */
export async function trackEmailClick(logId: string): Promise<void> {
  await prisma.message_logs.update({
    where: { id: logId },
    data: {
      status: 'CLICKED',
      clickedAt: new Date(),
    },
  });
}
