import Bull, { Queue, Job } from 'bull';
import { MessageChannel } from '@prisma/client';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import * as unifiedMessagingService from './unifiedMessagingService';
import * as emailService from './emailService';
import { sendSms } from './smsService';
import * as pushNotificationService from './pushNotificationService';

// ============================================
// Queue Definitions
// ============================================

interface EmailJobData {
  userId: string;
  to: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  templateId?: string;
  metadata?: Record<string, unknown>;
}

interface PushJobData {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  templateId?: string;
}

interface SmsJobData {
  userId: string;
  phoneNumber: string;
  message: string;
  templateId?: string;
}

interface InAppJobData {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  templateId?: string;
}

// ============================================
// Queue Configuration
// ============================================

const defaultJobOptions: Bull.JobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000, // 5 seconds initial delay
  },
  removeOnComplete: 100, // Keep last 100 completed jobs
  removeOnFail: 1000, // Keep last 1000 failed jobs
};

// Rate limiting: jobs per hour
const RATE_LIMITS = {
  email: 100,
  push: 1000,
  sms: 50,
  inApp: 10000,
};

// ============================================
// Queue Instances
// ============================================

let emailQueue: Queue<EmailJobData> | null = null;
let pushQueue: Queue<PushJobData> | null = null;
let smsQueue: Queue<SmsJobData> | null = null;
let inAppQueue: Queue<InAppJobData> | null = null;

/**
 * Initialize all message queues
 */
export function initializeQueues(): void {
  const redisConfig = {
    redis: config.redis.url,
  };

  // Email Queue
  emailQueue = new Bull<EmailJobData>('email-queue', redisConfig);
  emailQueue.process(async (job: Job<EmailJobData>) => {
    return processEmailJob(job.data);
  });

  emailQueue.on('completed', (job) => {
    logger.debug({ jobId: job.id, userId: job.data.userId }, 'Email job completed');
  });

  emailQueue.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, error }, 'Email job failed');
  });

  // Push Queue
  pushQueue = new Bull<PushJobData>('push-queue', redisConfig);
  pushQueue.process(async (job: Job<PushJobData>) => {
    return processPushJob(job.data);
  });

  pushQueue.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, error }, 'Push job failed');
  });

  // SMS Queue
  smsQueue = new Bull<SmsJobData>('sms-queue', redisConfig);
  smsQueue.process(async (job: Job<SmsJobData>) => {
    return processSmsJob(job.data);
  });

  smsQueue.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, error }, 'SMS job failed');
  });

  // In-App Queue
  inAppQueue = new Bull<InAppJobData>('inapp-queue', redisConfig);
  inAppQueue.process(async (job: Job<InAppJobData>) => {
    return processInAppJob(job.data);
  });

  inAppQueue.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, error }, 'In-app job failed');
  });

  logger.info('Message queues initialized');
}

/**
 * Close all queues
 */
export async function closeQueues(): Promise<void> {
  const closePromises: Promise<void>[] = [];

  if (emailQueue) closePromises.push(emailQueue.close());
  if (pushQueue) closePromises.push(pushQueue.close());
  if (smsQueue) closePromises.push(smsQueue.close());
  if (inAppQueue) closePromises.push(inAppQueue.close());

  await Promise.all(closePromises);
  logger.info('Message queues closed');
}

// ============================================
// Job Processors
// ============================================

async function processEmailJob(data: EmailJobData): Promise<{ success: boolean }> {
  try {
    await emailService.sendEmail({
      to: data.to,
      subject: data.subject,
      text: data.body,
      html: data.bodyHtml || data.body,
    });

    logger.info({ userId: data.userId, subject: data.subject }, 'Email sent via queue');
    return { success: true };
  } catch (error) {
    logger.error({ error, userId: data.userId }, 'Email job processing failed');
    throw error;
  }
}

async function processPushJob(data: PushJobData): Promise<{ success: boolean }> {
  try {
    const result = await pushNotificationService.sendToUser(data.userId, {
      title: data.title,
      body: data.body,
      data: data.data,
    });

    if (!result.success) {
      throw new Error(result.error || 'Push notification failed');
    }

    logger.info({ userId: data.userId, title: data.title }, 'Push sent via queue');
    return { success: true };
  } catch (error) {
    logger.error({ error, userId: data.userId }, 'Push job processing failed');
    throw error;
  }
}

async function processSmsJob(data: SmsJobData): Promise<{ success: boolean }> {
  try {
    const result = await sendSms(data.phoneNumber, data.message, data.userId, 'NOTIFICATION');

    if (!result.success) {
      throw new Error(result.error || 'SMS sending failed');
    }

    logger.info({ userId: data.userId }, 'SMS sent via queue');
    return { success: true };
  } catch (error) {
    logger.error({ error, userId: data.userId }, 'SMS job processing failed');
    throw error;
  }
}

async function processInAppJob(data: InAppJobData): Promise<{ success: boolean }> {
  try {
    await unifiedMessagingService.sendMessage({
      userId: data.userId,
      channel: 'IN_APP',
      subject: data.title,
      body: data.body,
      data: data.data,
      templateId: data.templateId,
    });

    logger.info({ userId: data.userId, title: data.title }, 'In-app notification created via queue');
    return { success: true };
  } catch (error) {
    logger.error({ error, userId: data.userId }, 'In-app job processing failed');
    throw error;
  }
}

// ============================================
// Queue Methods
// ============================================

/**
 * Add email to queue
 */
export async function queueEmail(
  data: EmailJobData,
  options?: { delay?: number; priority?: number },
): Promise<Job<EmailJobData> | null> {
  if (!emailQueue) {
    logger.warn('Email queue not initialized, sending directly');
    await processEmailJob(data);
    return null;
  }

  return emailQueue.add(data, {
    ...defaultJobOptions,
    delay: options?.delay,
    priority: options?.priority,
  });
}

/**
 * Add push notification to queue
 */
export async function queuePush(
  data: PushJobData,
  options?: { delay?: number; priority?: number },
): Promise<Job<PushJobData> | null> {
  if (!pushQueue) {
    logger.warn('Push queue not initialized, sending directly');
    await processPushJob(data);
    return null;
  }

  return pushQueue.add(data, {
    ...defaultJobOptions,
    delay: options?.delay,
    priority: options?.priority,
  });
}

/**
 * Add SMS to queue
 */
export async function queueSms(
  data: SmsJobData,
  options?: { delay?: number; priority?: number },
): Promise<Job<SmsJobData> | null> {
  if (!smsQueue) {
    logger.warn('SMS queue not initialized, sending directly');
    await processSmsJob(data);
    return null;
  }

  return smsQueue.add(data, {
    ...defaultJobOptions,
    delay: options?.delay,
    priority: options?.priority,
  });
}

/**
 * Add in-app notification to queue
 */
export async function queueInApp(
  data: InAppJobData,
  options?: { delay?: number; priority?: number },
): Promise<Job<InAppJobData> | null> {
  if (!inAppQueue) {
    logger.warn('In-app queue not initialized, sending directly');
    await processInAppJob(data);
    return null;
  }

  return inAppQueue.add(data, {
    ...defaultJobOptions,
    delay: options?.delay,
    priority: options?.priority,
  });
}

/**
 * Schedule a message for a specific channel
 */
export async function scheduleMessage(
  channel: MessageChannel,
  payload: {
    userId: string;
    subject?: string;
    body: string;
    bodyHtml?: string;
    to?: string;
    phoneNumber?: string;
    data?: Record<string, string>;
    templateId?: string;
    metadata?: Record<string, unknown>;
  },
  delay: number, // Delay in milliseconds
): Promise<void> {
  switch (channel) {
    case 'EMAIL':
      if (!payload.to) {
        throw new Error('Email address required for EMAIL channel');
      }
      await queueEmail(
        {
          userId: payload.userId,
          to: payload.to,
          subject: payload.subject || '',
          body: payload.body,
          bodyHtml: payload.bodyHtml,
          templateId: payload.templateId,
          metadata: payload.metadata,
        },
        { delay },
      );
      break;

    case 'PUSH':
      await queuePush(
        {
          userId: payload.userId,
          title: payload.subject || '',
          body: payload.body,
          data: payload.data,
          templateId: payload.templateId,
        },
        { delay },
      );
      break;

    case 'SMS':
      if (!payload.phoneNumber) {
        throw new Error('Phone number required for SMS channel');
      }
      await queueSms(
        {
          userId: payload.userId,
          phoneNumber: payload.phoneNumber,
          message: payload.body,
          templateId: payload.templateId,
        },
        { delay },
      );
      break;

    case 'IN_APP':
      await queueInApp(
        {
          userId: payload.userId,
          title: payload.subject || '',
          body: payload.body,
          data: payload.data,
          templateId: payload.templateId,
        },
        { delay },
      );
      break;
  }

  logger.info({ channel, userId: payload.userId, delay }, 'Message scheduled in queue');
}

// ============================================
// Queue Stats
// ============================================

export interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

/**
 * Get stats for all queues
 */
export async function getQueueStats(): Promise<QueueStats[]> {
  const stats: QueueStats[] = [];

  const queues = [
    { name: 'email', queue: emailQueue },
    { name: 'push', queue: pushQueue },
    { name: 'sms', queue: smsQueue },
    { name: 'inApp', queue: inAppQueue },
  ];

  for (const { name, queue } of queues) {
    if (queue) {
      const counts = await queue.getJobCounts();
      const isPaused = await queue.isPaused();

      stats.push({
        name,
        waiting: counts.waiting,
        active: counts.active,
        completed: counts.completed,
        failed: counts.failed,
        delayed: counts.delayed,
        paused: isPaused,
      });
    }
  }

  return stats;
}

/**
 * Pause a specific queue
 */
export async function pauseQueue(queueName: string): Promise<void> {
  const queue = getQueueByName(queueName);
  if (queue) {
    await queue.pause();
    logger.info({ queueName }, 'Queue paused');
  }
}

/**
 * Resume a specific queue
 */
export async function resumeQueue(queueName: string): Promise<void> {
  const queue = getQueueByName(queueName);
  if (queue) {
    await queue.resume();
    logger.info({ queueName }, 'Queue resumed');
  }
}

/**
 * Clean old jobs from a queue
 */
export async function cleanQueue(
  queueName: string,
  status: 'completed' | 'failed' | 'delayed' | 'wait' | 'active',
  age: number = 24 * 60 * 60 * 1000, // Default: 24 hours
): Promise<void> {
  const queue = getQueueByName(queueName);
  if (queue) {
    await queue.clean(age, status);
    logger.info({ queueName, status, age }, 'Queue cleaned');
  }
}

function getQueueByName(name: string): Queue | null {
  switch (name) {
    case 'email':
      return emailQueue;
    case 'push':
      return pushQueue;
    case 'sms':
      return smsQueue;
    case 'inApp':
      return inAppQueue;
    default:
      return null;
  }
}
