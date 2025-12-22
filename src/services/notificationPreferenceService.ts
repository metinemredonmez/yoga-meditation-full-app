/**
 * Notification Preference Service
 * Manages user notification preferences, quiet hours, and subscription tokens
 */

import { NotificationType, notification_preferences, Prisma } from '@prisma/client';

// Define NotificationChannel locally since it's not used by any Prisma model
export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
import crypto from 'crypto';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { config } from '../utils/config';
import { isWithinQuietHours, isValidTimezone } from '../utils/quietHours';

// Default preferences for new users
const DEFAULT_PREFERENCES: Omit<notification_preferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  emailEnabled: true,
  smsEnabled: false,
  pushEnabled: true,
  inAppEnabled: true,
  marketingEmails: false,
  marketingSms: false,
  challengeReminders: true,
  challengeUpdates: true,
  sessionReminders: true,
  weeklyProgress: true,
  newProgramAlerts: true,
  communityUpdates: false,
  paymentAlerts: true,
  securityAlerts: true,
  quietHoursEnabled: false,
  quietHoursStart: null,
  quietHoursEnd: null,
  timezone: config.notification.defaultTimezone,
};

// Mapping from NotificationType to preference field
const TYPE_TO_PREFERENCE_MAP: Record<NotificationType, keyof notification_preferences> = {
  MARKETING: 'marketingEmails', // Also check marketingSms for SMS channel
  CHALLENGE_REMINDER: 'challengeReminders',
  CHALLENGE_UPDATE: 'challengeUpdates',
  SESSION_REMINDER: 'sessionReminders',
  WEEKLY_PROGRESS: 'weeklyProgress',
  NEW_PROGRAM: 'newProgramAlerts',
  COMMUNITY: 'communityUpdates',
  PAYMENT: 'paymentAlerts',
  SECURITY: 'securityAlerts',
  PUSH: 'pushEnabled',
  INSTRUCTOR_BROADCAST: 'pushEnabled', // Instructor broadcasts use push channel
};

// Channel to preference field mapping
const CHANNEL_TO_PREFERENCE_MAP: Record<NotificationChannel, keyof notification_preferences> = {
  EMAIL: 'emailEnabled',
  SMS: 'smsEnabled',
  PUSH: 'pushEnabled',
  IN_APP: 'inAppEnabled',
};

export interface PreferenceUpdateInput {
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  pushEnabled?: boolean;
  inAppEnabled?: boolean;
  marketingEmails?: boolean;
  marketingSms?: boolean;
  challengeReminders?: boolean;
  challengeUpdates?: boolean;
  sessionReminders?: boolean;
  weeklyProgress?: boolean;
  newProgramAlerts?: boolean;
  communityUpdates?: boolean;
  paymentAlerts?: boolean;
  // securityAlerts is intentionally excluded - cannot be changed
  quietHoursEnabled?: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  timezone?: string;
}

export interface AvailableOption {
  key: string;
  label: string;
  description: string;
  category: 'channel' | 'marketing' | 'updates' | 'reminders' | 'quiet_hours';
  type: 'boolean' | 'time' | 'timezone';
  editable: boolean;
}

/**
 * Get user's notification preferences (creates default if not exists)
 */
export async function getPreferences(userId: string): Promise<notification_preferences> {
  let preferences = await prisma.notification_preferences.findUnique({
    where: { userId },
  });

  if (!preferences) {
    preferences = await prisma.notification_preferences.create({
      data: {
        userId,
        ...DEFAULT_PREFERENCES,
      },
    });
    logger.info({ userId }, 'Created default notification preferences');
  }

  return preferences;
}

/**
 * Update user's notification preferences
 */
export async function updatePreferences(
  userId: string,
  updates: PreferenceUpdateInput,
): Promise<notification_preferences> {
  // Ensure preferences exist
  await getPreferences(userId);

  // Remove securityAlerts from updates if present (it cannot be changed)
  const safeUpdates = { ...updates };
  delete (safeUpdates as Record<string, unknown>).securityAlerts;

  // Validate timezone if provided
  if (safeUpdates.timezone && !isValidTimezone(safeUpdates.timezone)) {
    throw new Error(`Invalid timezone: ${safeUpdates.timezone}`);
  }

  // Validate quiet hours times
  if (safeUpdates.quietHoursStart !== undefined || safeUpdates.quietHoursEnd !== undefined) {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (safeUpdates.quietHoursStart && !timeRegex.test(safeUpdates.quietHoursStart)) {
      throw new Error('Invalid quietHoursStart format. Expected HH:mm');
    }
    if (safeUpdates.quietHoursEnd && !timeRegex.test(safeUpdates.quietHoursEnd)) {
      throw new Error('Invalid quietHoursEnd format. Expected HH:mm');
    }
  }

  const preferences = await prisma.notification_preferences.update({
    where: { userId },
    data: safeUpdates as Prisma.notification_preferencesUpdateInput,
  });

  logger.info({ userId, updates: Object.keys(safeUpdates) }, 'Updated notification preferences');

  return preferences;
}

/**
 * Reset preferences to defaults
 */
export async function resetToDefaults(userId: string): Promise<notification_preferences> {
  await getPreferences(userId);

  const preferences = await prisma.notification_preferences.update({
    where: { userId },
    data: DEFAULT_PREFERENCES,
  });

  logger.info({ userId }, 'Reset notification preferences to defaults');

  return preferences;
}

/**
 * Check if a notification can be sent to a user via a specific channel and type
 */
export async function canSendNotification(
  userId: string,
  channel: NotificationChannel,
  type: NotificationType,
): Promise<boolean> {
  const preferences = await getPreferences(userId);

  // Security alerts are always sent
  if (type === 'SECURITY') {
    return true;
  }

  // Check channel enabled
  const channelField = CHANNEL_TO_PREFERENCE_MAP[channel];
  if (!preferences[channelField]) {
    return false;
  }

  // Check type preference
  const typeField = TYPE_TO_PREFERENCE_MAP[type];

  // Special handling for marketing on SMS channel
  if (type === 'MARKETING' && channel === 'SMS') {
    if (!preferences.marketingSms) {
      return false;
    }
  } else if (type === 'MARKETING' && channel === 'EMAIL') {
    if (!preferences.marketingEmails) {
      return false;
    }
  } else {
    if (!preferences[typeField]) {
      return false;
    }
  }

  // Check quiet hours for push and SMS (not email or in-app)
  if ((channel === 'PUSH' || channel === 'SMS') && preferences.quietHoursEnabled) {
    if (isWithinQuietHours(preferences.quietHoursStart, preferences.quietHoursEnd, preferences.timezone)) {
      logger.debug(
        { userId, channel, type },
        'Notification blocked due to quiet hours',
      );
      return false;
    }
  }

  return true;
}

/**
 * Check if user is currently in quiet hours
 */
export async function isQuietHours(userId: string): Promise<boolean> {
  const preferences = await getPreferences(userId);

  if (!preferences.quietHoursEnabled) {
    return false;
  }

  return isWithinQuietHours(
    preferences.quietHoursStart,
    preferences.quietHoursEnd,
    preferences.timezone,
  );
}

/**
 * Get users eligible to receive a specific notification type on a channel
 */
export async function getEligibleUsers(
  channel: NotificationChannel,
  type: NotificationType,
  userIds?: string[],
): Promise<string[]> {
  const channelField = CHANNEL_TO_PREFERENCE_MAP[channel];
  const typeField = TYPE_TO_PREFERENCE_MAP[type];

  // Build query conditions
  const where: Prisma.notification_preferencesWhereInput = {};

  // Set channel condition
  if (channelField === 'emailEnabled') where.emailEnabled = true;
  else if (channelField === 'smsEnabled') where.smsEnabled = true;
  else if (channelField === 'pushEnabled') where.pushEnabled = true;
  else if (channelField === 'inAppEnabled') where.inAppEnabled = true;

  // Security alerts skip type check
  if (type !== 'SECURITY') {
    // Special handling for marketing
    if (type === 'MARKETING') {
      if (channel === 'SMS') {
        where.marketingSms = true;
      } else if (channel === 'EMAIL') {
        where.marketingEmails = true;
      }
    } else if (typeField) {
      // Set type condition explicitly
      if (typeField === 'challengeReminders') where.challengeReminders = true;
      else if (typeField === 'challengeUpdates') where.challengeUpdates = true;
      else if (typeField === 'sessionReminders') where.sessionReminders = true;
      else if (typeField === 'weeklyProgress') where.weeklyProgress = true;
      else if (typeField === 'newProgramAlerts') where.newProgramAlerts = true;
      else if (typeField === 'communityUpdates') where.communityUpdates = true;
      else if (typeField === 'paymentAlerts') where.paymentAlerts = true;
    }
  }

  // Filter by specific user IDs if provided
  if (userIds && userIds.length > 0) {
    where.userId = { in: userIds };
  }

  const preferences = await prisma.notification_preferences.findMany({
    where,
    select: { userId: true, quietHoursEnabled: true, quietHoursStart: true, quietHoursEnd: true, timezone: true },
  });

  // Filter out users in quiet hours for push/SMS
  if (channel === 'PUSH' || channel === 'SMS') {
    return preferences
      .filter((p) => {
        if (!p.quietHoursEnabled) return true;
        return !isWithinQuietHours(p.quietHoursStart, p.quietHoursEnd, p.timezone);
      })
      .map((p) => p.userId);
  }

  return preferences.map((p) => p.userId);
}

/**
 * Bulk check eligibility for multiple users
 */
export async function bulkCheckEligibility(
  userIds: string[],
  channel: NotificationChannel,
  type: NotificationType,
): Promise<Map<string, boolean>> {
  const eligibleUserIds = await getEligibleUsers(channel, type, userIds);
  const eligibleSet = new Set(eligibleUserIds);

  const result = new Map<string, boolean>();
  for (const userId of userIds) {
    result.set(userId, eligibleSet.has(userId));
  }

  return result;
}

/**
 * Generate unsubscribe token for a user
 */
export async function generateUnsubscribeToken(
  userId: string,
  type?: NotificationType,
): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHmac('sha256', config.notification.unsubscribeTokenSecret)
    .update(token)
    .digest('hex');

  await prisma.unsubscribe_tokens.create({
    data: {
      userId,
      token: hashedToken,
      notificationType: type ?? null,
      expiresAt: null, // Never expires
    },
  });

  logger.info({ userId, type }, 'Generated unsubscribe token');

  return token;
}

/**
 * Unsubscribe using token
 */
export async function unsubscribeByToken(
  token: string,
  type?: NotificationType,
): Promise<{ success: boolean; message: string }> {
  const hashedToken = crypto
    .createHmac('sha256', config.notification.unsubscribeTokenSecret)
    .update(token)
    .digest('hex');

  const tokenRecord = await prisma.unsubscribe_tokens.findUnique({
    where: { token: hashedToken },
    include: { users: true },
  });

  if (!tokenRecord) {
    return { success: false, message: 'Invalid or expired unsubscribe token' };
  }

  if (tokenRecord.usedAt) {
    return { success: false, message: 'This unsubscribe link has already been used' };
  }

  if (tokenRecord.expiresAt && tokenRecord.expiresAt < new Date()) {
    return { success: false, message: 'This unsubscribe link has expired' };
  }

  // Mark token as used
  await prisma.unsubscribe_tokens.update({
    where: { id: tokenRecord.id },
    data: { usedAt: new Date() },
  });

  // Determine what to unsubscribe
  const effectiveType = type ?? tokenRecord.notificationType;

  // Get or create preferences
  await getPreferences(tokenRecord.userId);

  // Update preferences based on type
  const updates: Prisma.notification_preferencesUpdateInput = {};

  if (effectiveType) {
    // Unsubscribe from specific type
    switch (effectiveType) {
      case 'MARKETING':
        updates.marketingEmails = false;
        updates.marketingSms = false;
        break;
      case 'CHALLENGE_REMINDER':
        updates.challengeReminders = false;
        break;
      case 'CHALLENGE_UPDATE':
        updates.challengeUpdates = false;
        break;
      case 'SESSION_REMINDER':
        updates.sessionReminders = false;
        break;
      case 'WEEKLY_PROGRESS':
        updates.weeklyProgress = false;
        break;
      case 'NEW_PROGRAM':
        updates.newProgramAlerts = false;
        break;
      case 'COMMUNITY':
        updates.communityUpdates = false;
        break;
      case 'PAYMENT':
        updates.paymentAlerts = false;
        break;
      case 'SECURITY':
        // Cannot unsubscribe from security alerts
        return { success: false, message: 'Cannot unsubscribe from security alerts' };
    }
  } else {
    // Unsubscribe from all marketing
    updates.marketingEmails = false;
    updates.marketingSms = false;
  }

  await prisma.notification_preferences.update({
    where: { userId: tokenRecord.userId },
    data: updates,
  });

  logger.info(
    { userId: tokenRecord.userId, type: effectiveType },
    'User unsubscribed via token',
  );

  return {
    success: true,
    message: effectiveType
      ? `Successfully unsubscribed from ${effectiveType.toLowerCase().replace('_', ' ')} notifications`
      : 'Successfully unsubscribed from marketing notifications',
  };
}

/**
 * Resubscribe to notification type
 */
export async function resubscribe(
  userId: string,
  type: NotificationType,
): Promise<{ success: boolean; message: string }> {
  if (type === 'SECURITY') {
    return { success: true, message: 'Security alerts are always enabled' };
  }

  const updates: Prisma.notification_preferencesUpdateInput = {};

  switch (type) {
    case 'MARKETING':
      updates.marketingEmails = true;
      break;
    case 'CHALLENGE_REMINDER':
      updates.challengeReminders = true;
      break;
    case 'CHALLENGE_UPDATE':
      updates.challengeUpdates = true;
      break;
    case 'SESSION_REMINDER':
      updates.sessionReminders = true;
      break;
    case 'WEEKLY_PROGRESS':
      updates.weeklyProgress = true;
      break;
    case 'NEW_PROGRAM':
      updates.newProgramAlerts = true;
      break;
    case 'COMMUNITY':
      updates.communityUpdates = true;
      break;
    case 'PAYMENT':
      updates.paymentAlerts = true;
      break;
  }

  await getPreferences(userId);
  await prisma.notification_preferences.update({
    where: { userId },
    data: updates,
  });

  logger.info({ userId, type }, 'User resubscribed to notification type');

  return {
    success: true,
    message: `Successfully resubscribed to ${type.toLowerCase().replace('_', ' ')} notifications`,
  };
}

/**
 * Get available preference options for frontend
 */
export function getAvailableOptions(): AvailableOption[] {
  return [
    // Channels
    { key: 'emailEnabled', label: 'Email Notifications', description: 'Receive notifications via email', category: 'channel', type: 'boolean', editable: true },
    { key: 'smsEnabled', label: 'SMS Notifications', description: 'Receive notifications via SMS', category: 'channel', type: 'boolean', editable: true },
    { key: 'pushEnabled', label: 'Push Notifications', description: 'Receive push notifications on your device', category: 'channel', type: 'boolean', editable: true },
    { key: 'inAppEnabled', label: 'In-App Notifications', description: 'Show notifications within the app', category: 'channel', type: 'boolean', editable: true },

    // Marketing
    { key: 'marketingEmails', label: 'Marketing Emails', description: 'Receive promotional emails and offers', category: 'marketing', type: 'boolean', editable: true },
    { key: 'marketingSms', label: 'Marketing SMS', description: 'Receive promotional SMS messages', category: 'marketing', type: 'boolean', editable: true },

    // Updates
    { key: 'challengeUpdates', label: 'Challenge Updates', description: 'Get notified about challenge progress and results', category: 'updates', type: 'boolean', editable: true },
    { key: 'weeklyProgress', label: 'Weekly Progress', description: 'Receive weekly progress summaries', category: 'updates', type: 'boolean', editable: true },
    { key: 'newProgramAlerts', label: 'New Programs', description: 'Get notified about new yoga programs', category: 'updates', type: 'boolean', editable: true },
    { key: 'communityUpdates', label: 'Community Updates', description: 'Receive community news and updates', category: 'updates', type: 'boolean', editable: true },
    { key: 'paymentAlerts', label: 'Payment Alerts', description: 'Get notified about payments and billing', category: 'updates', type: 'boolean', editable: true },
    { key: 'securityAlerts', label: 'Security Alerts', description: 'Important security notifications (always enabled)', category: 'updates', type: 'boolean', editable: false },

    // Reminders
    { key: 'challengeReminders', label: 'Challenge Reminders', description: 'Daily reminders for active challenges', category: 'reminders', type: 'boolean', editable: true },
    { key: 'sessionReminders', label: 'Session Reminders', description: 'Reminders for scheduled yoga sessions', category: 'reminders', type: 'boolean', editable: true },

    // Quiet Hours
    { key: 'quietHoursEnabled', label: 'Quiet Hours', description: 'Pause notifications during specified hours', category: 'quiet_hours', type: 'boolean', editable: true },
    { key: 'quietHoursStart', label: 'Start Time', description: 'When quiet hours begin (HH:mm)', category: 'quiet_hours', type: 'time', editable: true },
    { key: 'quietHoursEnd', label: 'End Time', description: 'When quiet hours end (HH:mm)', category: 'quiet_hours', type: 'time', editable: true },
    { key: 'timezone', label: 'Timezone', description: 'Your timezone for quiet hours', category: 'quiet_hours', type: 'timezone', editable: true },
  ];
}

/**
 * Create default preferences for a new user (called during registration)
 */
export async function createDefaultPreferences(userId: string): Promise<notification_preferences> {
  const existing = await prisma.notification_preferences.findUnique({
    where: { userId },
  });

  if (existing) {
    return existing;
  }

  const preferences = await prisma.notification_preferences.create({
    data: {
      userId,
      ...DEFAULT_PREFERENCES,
    },
  });

  logger.info({ userId }, 'Created default notification preferences for new user');

  return preferences;
}

/**
 * Build unsubscribe URL for email templates
 */
export async function buildUnsubscribeUrl(
  userId: string,
  type?: NotificationType,
): Promise<string> {
  const token = await generateUnsubscribeToken(userId, type);
  const baseUrl = config.notification.frontendUrl;
  const typeParam = type ? `&type=${type}` : '';
  return `${baseUrl}/unsubscribe?token=${token}${typeParam}`;
}
