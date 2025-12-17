import amqp from 'amqplib';
import type { Channel, ConsumeMessage, ChannelModel } from 'amqplib';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

// ============================================
// RabbitMQ Configuration
// ============================================

const rabbitmqConfig = {
  url: config.rabbitmq?.url || 'amqp://localhost:5672',
  heartbeat: 60,
  connectionTimeout: 10000,
};

// Using ChannelModel for amqplib connection type
let connection: ChannelModel | null = null;
let channel: Channel | null = null;

// ============================================
// Queues & Exchanges
// ============================================

export const EXCHANGES = {
  EVENTS: 'yoga.events',
  NOTIFICATIONS: 'yoga.notifications',
  TASKS: 'yoga.tasks',
  DEAD_LETTER: 'yoga.dead-letter',
} as const;

export const QUEUES = {
  // Email Queues
  EMAIL_SEND: 'email.send',
  EMAIL_BULK: 'email.bulk',

  // SMS Queues
  SMS_SEND: 'sms.send',
  SMS_OTP: 'sms.otp',

  // Push Notification Queues
  PUSH_SEND: 'push.send',
  PUSH_BULK: 'push.bulk',

  // Task Queues
  VIDEO_PROCESSING: 'task.video.processing',
  IMAGE_PROCESSING: 'task.image.processing',
  REPORT_GENERATION: 'task.report.generation',
  ANALYTICS_AGGREGATION: 'task.analytics.aggregation',

  // Webhook Queues
  WEBHOOK_DELIVERY: 'webhook.delivery',
  WEBHOOK_RETRY: 'webhook.retry',

  // Live Stream Queues
  STREAM_RECORDING: 'stream.recording',
  STREAM_TRANSCODING: 'stream.transcoding',

  // Dead Letter Queues
  DLQ_EMAIL: 'dlq.email',
  DLQ_SMS: 'dlq.sms',
  DLQ_PUSH: 'dlq.push',
  DLQ_TASK: 'dlq.task',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

// ============================================
// Connection Management
// ============================================

export async function connectRabbitMQ(): Promise<ChannelModel | null> {
  if (connection) {
    return connection;
  }

  try {
    const conn = await amqp.connect(rabbitmqConfig.url, {
      heartbeat: rabbitmqConfig.heartbeat,
      timeout: rabbitmqConfig.connectionTimeout,
    });

    connection = conn;

    conn.on('error', (err: Error) => {
      logger.error({ error: err }, 'RabbitMQ connection error');
    });

    conn.on('close', () => {
      logger.warn('RabbitMQ connection closed');
      connection = null;
      channel = null;
    });

    logger.info({ url: rabbitmqConfig.url.replace(/\/\/.*@/, '//***@') }, 'RabbitMQ connected');

    // Setup exchanges and queues
    await setupExchangesAndQueues();

    return connection;
  } catch (error) {
    logger.error({ error }, 'Failed to connect to RabbitMQ');
    throw error;
  }
}

export async function getChannel(): Promise<Channel> {
  if (channel) {
    return channel;
  }

  if (!connection) {
    await connectRabbitMQ();
  }

  if (!connection) {
    throw new Error('RabbitMQ connection not available');
  }

  const ch = await (connection as any).createChannel();
  channel = ch;

  ch.on('error', (err: Error) => {
    logger.error({ error: err }, 'RabbitMQ channel error');
  });

  ch.on('close', () => {
    logger.warn('RabbitMQ channel closed');
    channel = null;
  });

  // Set prefetch for fair dispatch
  await ch.prefetch(10);

  logger.info('RabbitMQ channel created');
  return ch;
}

// ============================================
// Setup Exchanges & Queues
// ============================================

async function setupExchangesAndQueues(): Promise<void> {
  const ch = await getChannel();

  // Create exchanges
  await ch.assertExchange(EXCHANGES.EVENTS, 'topic', { durable: true });
  await ch.assertExchange(EXCHANGES.NOTIFICATIONS, 'direct', { durable: true });
  await ch.assertExchange(EXCHANGES.TASKS, 'direct', { durable: true });
  await ch.assertExchange(EXCHANGES.DEAD_LETTER, 'direct', { durable: true });

  // Create queues with dead letter configuration
  const queueOptions = {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': EXCHANGES.DEAD_LETTER,
    },
  };

  // Email queues
  await ch.assertQueue(QUEUES.EMAIL_SEND, {
    ...queueOptions,
    arguments: { ...queueOptions.arguments, 'x-dead-letter-routing-key': QUEUES.DLQ_EMAIL },
  });
  await ch.assertQueue(QUEUES.EMAIL_BULK, queueOptions);

  // SMS queues
  await ch.assertQueue(QUEUES.SMS_SEND, {
    ...queueOptions,
    arguments: { ...queueOptions.arguments, 'x-dead-letter-routing-key': QUEUES.DLQ_SMS },
  });
  await ch.assertQueue(QUEUES.SMS_OTP, { durable: true, messageTtl: 300000 }); // 5 min TTL

  // Push notification queues
  await ch.assertQueue(QUEUES.PUSH_SEND, {
    ...queueOptions,
    arguments: { ...queueOptions.arguments, 'x-dead-letter-routing-key': QUEUES.DLQ_PUSH },
  });
  await ch.assertQueue(QUEUES.PUSH_BULK, queueOptions);

  // Task queues
  await ch.assertQueue(QUEUES.VIDEO_PROCESSING, {
    ...queueOptions,
    arguments: { ...queueOptions.arguments, 'x-dead-letter-routing-key': QUEUES.DLQ_TASK },
  });
  await ch.assertQueue(QUEUES.IMAGE_PROCESSING, queueOptions);
  await ch.assertQueue(QUEUES.REPORT_GENERATION, queueOptions);
  await ch.assertQueue(QUEUES.ANALYTICS_AGGREGATION, queueOptions);

  // Webhook queues
  await ch.assertQueue(QUEUES.WEBHOOK_DELIVERY, queueOptions);
  await ch.assertQueue(QUEUES.WEBHOOK_RETRY, {
    ...queueOptions,
    arguments: { ...queueOptions.arguments, 'x-message-ttl': 60000 }, // 1 min delay
  });

  // Stream queues
  await ch.assertQueue(QUEUES.STREAM_RECORDING, queueOptions);
  await ch.assertQueue(QUEUES.STREAM_TRANSCODING, queueOptions);

  // Dead letter queues
  await ch.assertQueue(QUEUES.DLQ_EMAIL, { durable: true });
  await ch.assertQueue(QUEUES.DLQ_SMS, { durable: true });
  await ch.assertQueue(QUEUES.DLQ_PUSH, { durable: true });
  await ch.assertQueue(QUEUES.DLQ_TASK, { durable: true });

  // Bind queues to exchanges
  await ch.bindQueue(QUEUES.EMAIL_SEND, EXCHANGES.NOTIFICATIONS, 'email');
  await ch.bindQueue(QUEUES.SMS_SEND, EXCHANGES.NOTIFICATIONS, 'sms');
  await ch.bindQueue(QUEUES.PUSH_SEND, EXCHANGES.NOTIFICATIONS, 'push');

  // Bind dead letter queues
  await ch.bindQueue(QUEUES.DLQ_EMAIL, EXCHANGES.DEAD_LETTER, QUEUES.DLQ_EMAIL);
  await ch.bindQueue(QUEUES.DLQ_SMS, EXCHANGES.DEAD_LETTER, QUEUES.DLQ_SMS);
  await ch.bindQueue(QUEUES.DLQ_PUSH, EXCHANGES.DEAD_LETTER, QUEUES.DLQ_PUSH);
  await ch.bindQueue(QUEUES.DLQ_TASK, EXCHANGES.DEAD_LETTER, QUEUES.DLQ_TASK);

  logger.info('RabbitMQ exchanges and queues setup complete');
}

// ============================================
// Publisher
// ============================================

export interface PublishOptions {
  priority?: number;
  expiration?: string;
  persistent?: boolean;
  headers?: Record<string, any>;
  correlationId?: string;
}

export async function publishToQueue<T>(
  queue: QueueName,
  message: T,
  options: PublishOptions = {},
): Promise<boolean> {
  try {
    const ch = await getChannel();

    const messageBuffer = Buffer.from(
      JSON.stringify({
        ...message,
        timestamp: new Date().toISOString(),
      }),
    );

    const success = ch.sendToQueue(queue, messageBuffer, {
      persistent: options.persistent ?? true,
      priority: options.priority,
      expiration: options.expiration,
      headers: options.headers,
      correlationId: options.correlationId,
      contentType: 'application/json',
    });

    if (success) {
      logger.debug({ queue }, 'Message published to queue');
    }

    return success;
  } catch (error) {
    logger.error({ error, queue }, 'Failed to publish message to queue');
    throw error;
  }
}

export async function publishToExchange<T>(
  exchange: string,
  routingKey: string,
  message: T,
  options: PublishOptions = {},
): Promise<boolean> {
  try {
    const ch = await getChannel();

    const messageBuffer = Buffer.from(
      JSON.stringify({
        ...message,
        timestamp: new Date().toISOString(),
      }),
    );

    const success = ch.publish(exchange, routingKey, messageBuffer, {
      persistent: options.persistent ?? true,
      priority: options.priority,
      expiration: options.expiration,
      headers: options.headers,
      correlationId: options.correlationId,
      contentType: 'application/json',
    });

    if (success) {
      logger.debug({ exchange, routingKey }, 'Message published to exchange');
    }

    return success;
  } catch (error) {
    logger.error({ error, exchange, routingKey }, 'Failed to publish message to exchange');
    throw error;
  }
}

// ============================================
// Consumer
// ============================================

export type MessageHandler<T = any> = (
  message: T,
  msg: ConsumeMessage,
) => Promise<void>;

export async function consumeQueue<T>(
  queue: QueueName,
  handler: MessageHandler<T>,
  options: { noAck?: boolean } = {},
): Promise<string> {
  const ch = await getChannel();

  const { consumerTag } = await ch.consume(
    queue,
    async (msg) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString()) as T;
        await handler(content, msg);

        if (!options.noAck) {
          ch.ack(msg);
        }

        logger.debug({ queue }, 'Message consumed successfully');
      } catch (error) {
        logger.error({ error, queue }, 'Failed to process message');

        if (!options.noAck) {
          // Reject and requeue on failure (will go to DLQ if max retries exceeded)
          const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) + 1;

          if (retryCount >= 3) {
            // Send to dead letter queue
            ch.nack(msg, false, false);
          } else {
            // Requeue with retry count
            ch.nack(msg, false, true);
          }
        }
      }
    },
    { noAck: options.noAck ?? false },
  );

  logger.info({ queue, consumerTag }, 'Consumer started');
  return consumerTag;
}

// ============================================
// Helper Functions
// ============================================

export async function queueEmail(
  to: string,
  subject: string,
  body: string,
  options?: { templateId?: string; data?: Record<string, any> },
): Promise<boolean> {
  return publishToQueue(QUEUES.EMAIL_SEND, {
    to,
    subject,
    body,
    ...options,
  });
}

export async function queueSMS(
  to: string,
  message: string,
  options?: { priority?: number },
): Promise<boolean> {
  return publishToQueue(QUEUES.SMS_SEND, { to, message }, options);
}

export async function queuePushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>,
): Promise<boolean> {
  return publishToQueue(QUEUES.PUSH_SEND, {
    userId,
    title,
    body,
    data,
  });
}

export async function queueVideoProcessing(
  videoId: string,
  inputUrl: string,
  outputFormat: string,
  options?: Record<string, any>,
): Promise<boolean> {
  return publishToQueue(QUEUES.VIDEO_PROCESSING, {
    videoId,
    inputUrl,
    outputFormat,
    ...options,
  });
}

export async function queueWebhookDelivery(
  webhookId: string,
  url: string,
  payload: Record<string, any>,
  headers?: Record<string, string>,
): Promise<boolean> {
  return publishToQueue(QUEUES.WEBHOOK_DELIVERY, {
    webhookId,
    url,
    payload,
    headers,
  });
}

// ============================================
// Health Check
// ============================================

export async function checkRabbitMQHealth(): Promise<boolean> {
  try {
    if (!connection) {
      return false;
    }

    const ch = await getChannel();
    await ch.checkQueue(QUEUES.EMAIL_SEND);
    return true;
  } catch {
    return false;
  }
}

export async function getQueueStats(queue: QueueName): Promise<{
  messageCount: number;
  consumerCount: number;
}> {
  const ch = await getChannel();
  const result = await ch.checkQueue(queue);

  return {
    messageCount: result.messageCount,
    consumerCount: result.consumerCount,
  };
}

// ============================================
// Shutdown
// ============================================

export async function disconnectRabbitMQ(): Promise<void> {
  try {
    if (channel) {
      await channel.close();
      channel = null;
      logger.info('RabbitMQ channel closed');
    }

    if (connection) {
      await (connection as any).close();
      connection = null;
      logger.info('RabbitMQ connection closed');
    }
  } catch (error) {
    logger.error({ error }, 'Error disconnecting RabbitMQ');
  }
}
