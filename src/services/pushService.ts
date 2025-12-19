import { config } from '../utils/config';
import { logger } from '../utils/logger';

interface PushPayload {
  deviceToken: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendPushNotification({ deviceToken, title, body, data }: PushPayload) {
  if (!config.PUSH_PROVIDER_API_KEY) {
    logger.warn({ title }, 'Push provider key missing; push notification skipped');
    return { delivered: false, reason: 'Push provider not configured' } as const;
  }

  logger.info(
    {
      title,
      body,
      hasData: !!data,
    },
    'Pretending to send push notification (placeholder)',
  );

  return {
    delivered: true,
    message: 'Push notification enqueued (mock)',
  } as const;
}
