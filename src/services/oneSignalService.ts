import axios from 'axios';
import { logger } from '../utils/logger';

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;
const ONESIGNAL_API_URL = 'https://onesignal.com/api/v1';

interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  userIds?: string[]; // external_user_ids
  segments?: string[]; // e.g., ['All', 'Subscribed Users']
  filters?: any[];
}

/**
 * Send push notification via OneSignal
 */
export async function sendPushNotification(payload: PushNotificationPayload): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    logger.warn('OneSignal not configured - skipping push notification');
    return { success: false, error: 'OneSignal not configured' };
  }

  try {
    const notificationData: any = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: payload.title, tr: payload.title },
      contents: { en: payload.body, tr: payload.body },
      data: payload.data || {},
    };

    // Target by external user IDs (our user IDs)
    if (payload.userIds && payload.userIds.length > 0) {
      notificationData.include_external_user_ids = payload.userIds;
      notificationData.channel_for_external_user_ids = 'push';
    }
    // Target by segments
    else if (payload.segments && payload.segments.length > 0) {
      notificationData.included_segments = payload.segments;
    }
    // Target by filters
    else if (payload.filters && payload.filters.length > 0) {
      notificationData.filters = payload.filters;
    }
    // Default to all subscribed users
    else {
      notificationData.included_segments = ['Subscribed Users'];
    }

    const response = await axios.post(
      `${ONESIGNAL_API_URL}/notifications`,
      notificationData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
        },
      }
    );

    logger.info({ notificationId: response.data.id, recipients: response.data.recipients }, 'Push notification sent via OneSignal');

    return {
      success: true,
      id: response.data.id,
    };
  } catch (error: any) {
    logger.error({ error: error.response?.data || error.message }, 'Failed to send push notification via OneSignal');
    return {
      success: false,
      error: error.response?.data?.errors?.[0] || error.message,
    };
  }
}

/**
 * Send push notification to specific users by their user IDs
 */
export async function sendPushToUsers(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<{ success: boolean; id?: string; error?: string }> {
  return sendPushNotification({
    title,
    body,
    data,
    userIds,
  });
}

/**
 * Send push notification to all users
 */
export async function sendPushToAll(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<{ success: boolean; id?: string; error?: string }> {
  return sendPushNotification({
    title,
    body,
    data,
    segments: ['All'],
  });
}

/**
 * Send push notification to subscribed users only
 */
export async function sendPushToSubscribed(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<{ success: boolean; id?: string; error?: string }> {
  return sendPushNotification({
    title,
    body,
    data,
    segments: ['Subscribed Users'],
  });
}

/**
 * Get notification status from OneSignal
 */
export async function getNotificationStatus(notificationId: string): Promise<any> {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    return null;
  }

  try {
    const response = await axios.get(
      `${ONESIGNAL_API_URL}/notifications/${notificationId}?app_id=${ONESIGNAL_APP_ID}`,
      {
        headers: {
          'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    logger.error({ error: error.response?.data || error.message }, 'Failed to get notification status');
    return null;
  }
}

/**
 * Check if OneSignal is configured
 */
export function isOneSignalConfigured(): boolean {
  return !!(ONESIGNAL_APP_ID && ONESIGNAL_REST_API_KEY);
}
