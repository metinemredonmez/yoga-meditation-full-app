import { Kafka, Producer, Consumer, EachMessagePayload, logLevel } from 'kafkajs';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

// ============================================
// Kafka Configuration
// ============================================

const kafkaConfig = {
  brokers: config.kafka?.brokers || ['localhost:29092'],
  clientId: config.kafka?.clientId || 'yoga-app',
  groupId: config.kafka?.groupId || 'yoga-app-group',
};

let kafka: Kafka | null = null;
let producer: Producer | null = null;
let consumer: Consumer | null = null;

// ============================================
// Topics
// ============================================

export const KAFKA_TOPICS = {
  // User Events
  USER_REGISTERED: 'user.registered',
  USER_LOGIN: 'user.login',
  USER_PROFILE_UPDATED: 'user.profile.updated',

  // Subscription Events
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_RENEWED: 'subscription.renewed',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
  SUBSCRIPTION_EXPIRED: 'subscription.expired',

  // Payment Events
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',

  // Progress Events
  PROGRAM_STARTED: 'program.started',
  PROGRAM_COMPLETED: 'program.completed',
  SESSION_COMPLETED: 'session.completed',
  CHALLENGE_JOINED: 'challenge.joined',
  CHALLENGE_COMPLETED: 'challenge.completed',

  // Live Stream Events
  STREAM_STARTED: 'stream.started',
  STREAM_ENDED: 'stream.ended',
  STREAM_PARTICIPANT_JOINED: 'stream.participant.joined',
  STREAM_PARTICIPANT_LEFT: 'stream.participant.left',

  // Notification Events
  NOTIFICATION_SEND: 'notification.send',
  EMAIL_SEND: 'email.send',
  SMS_SEND: 'sms.send',
  PUSH_SEND: 'push.send',

  // Analytics Events
  ANALYTICS_EVENT: 'analytics.event',
  ANALYTICS_PAGEVIEW: 'analytics.pageview',

  // Webhook Events
  WEBHOOK_DELIVERY: 'webhook.delivery',
} as const;

export type KafkaTopic = (typeof KAFKA_TOPICS)[keyof typeof KAFKA_TOPICS];

// ============================================
// Initialize Kafka
// ============================================

export function initializeKafka(): Kafka {
  if (kafka) {
    return kafka;
  }

  kafka = new Kafka({
    clientId: kafkaConfig.clientId,
    brokers: kafkaConfig.brokers,
    logLevel: config.NODE_ENV === 'production' ? logLevel.ERROR : logLevel.WARN,
    retry: {
      initialRetryTime: 100,
      retries: 8,
    },
  });

  logger.info({ brokers: kafkaConfig.brokers }, 'Kafka client initialized');
  return kafka;
}

// ============================================
// Producer
// ============================================

export async function getProducer(): Promise<Producer> {
  if (producer) {
    return producer;
  }

  if (!kafka) {
    initializeKafka();
  }

  producer = kafka!.producer({
    allowAutoTopicCreation: true,
    transactionTimeout: 30000,
  });

  await producer.connect();
  logger.info('Kafka producer connected');

  return producer;
}

export async function sendMessage<T>(
  topic: KafkaTopic,
  message: T,
  key?: string,
): Promise<void> {
  try {
    const prod = await getProducer();

    await prod.send({
      topic,
      messages: [
        {
          key: key || undefined,
          value: JSON.stringify({
            ...message,
            timestamp: new Date().toISOString(),
            source: 'yoga-app',
          }),
          headers: {
            'content-type': 'application/json',
          },
        },
      ],
    });

    logger.debug({ topic, key }, 'Kafka message sent');
  } catch (error) {
    logger.error({ error, topic }, 'Failed to send Kafka message');
    throw error;
  }
}

export async function sendBatchMessages<T>(
  topic: KafkaTopic,
  messages: Array<{ key?: string; value: T }>,
): Promise<void> {
  try {
    const prod = await getProducer();

    await prod.send({
      topic,
      messages: messages.map((msg) => ({
        key: msg.key || undefined,
        value: JSON.stringify({
          ...msg.value,
          timestamp: new Date().toISOString(),
          source: 'yoga-app',
        }),
      })),
    });

    logger.debug({ topic, count: messages.length }, 'Kafka batch messages sent');
  } catch (error) {
    logger.error({ error, topic }, 'Failed to send Kafka batch messages');
    throw error;
  }
}

// ============================================
// Consumer
// ============================================

type MessageHandler = (payload: EachMessagePayload) => Promise<void>;

const messageHandlers: Map<string, MessageHandler[]> = new Map();

export async function getConsumer(): Promise<Consumer> {
  if (consumer) {
    return consumer;
  }

  if (!kafka) {
    initializeKafka();
  }

  consumer = kafka!.consumer({
    groupId: kafkaConfig.groupId,
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
  });

  await consumer.connect();
  logger.info({ groupId: kafkaConfig.groupId }, 'Kafka consumer connected');

  return consumer;
}

export async function subscribe(
  topic: KafkaTopic,
  handler: MessageHandler,
): Promise<void> {
  const cons = await getConsumer();

  // Add handler to list
  const handlers = messageHandlers.get(topic) || [];
  handlers.push(handler);
  messageHandlers.set(topic, handlers);

  // Subscribe to topic
  await cons.subscribe({ topic, fromBeginning: false });

  logger.info({ topic }, 'Subscribed to Kafka topic');
}

export async function startConsumer(): Promise<void> {
  const cons = await getConsumer();

  await cons.run({
    eachMessage: async (payload) => {
      const { topic, partition, message } = payload;

      try {
        const handlers = messageHandlers.get(topic) || [];

        for (const handler of handlers) {
          await handler(payload);
        }

        logger.debug(
          { topic, partition, offset: message.offset },
          'Kafka message processed',
        );
      } catch (error) {
        logger.error(
          { error, topic, partition, offset: message.offset },
          'Failed to process Kafka message',
        );
      }
    },
  });

  logger.info('Kafka consumer started');
}

// ============================================
// Event Publishing Helpers
// ============================================

export async function publishUserEvent(
  eventType: 'registered' | 'login' | 'profile_updated',
  userId: string,
  data?: Record<string, any>,
): Promise<void> {
  const topicMap = {
    registered: KAFKA_TOPICS.USER_REGISTERED,
    login: KAFKA_TOPICS.USER_LOGIN,
    profile_updated: KAFKA_TOPICS.USER_PROFILE_UPDATED,
  };

  await sendMessage(topicMap[eventType], {
    eventType,
    userId,
    ...data,
  }, userId);
}

export async function publishPaymentEvent(
  eventType: 'completed' | 'failed' | 'refunded',
  paymentId: string,
  userId: string,
  data?: Record<string, any>,
): Promise<void> {
  const topicMap = {
    completed: KAFKA_TOPICS.PAYMENT_COMPLETED,
    failed: KAFKA_TOPICS.PAYMENT_FAILED,
    refunded: KAFKA_TOPICS.PAYMENT_REFUNDED,
  };

  await sendMessage(topicMap[eventType], {
    eventType,
    paymentId,
    userId,
    ...data,
  }, userId);
}

export async function publishSubscriptionEvent(
  eventType: 'created' | 'renewed' | 'cancelled' | 'expired',
  subscriptionId: string,
  userId: string,
  data?: Record<string, any>,
): Promise<void> {
  const topicMap = {
    created: KAFKA_TOPICS.SUBSCRIPTION_CREATED,
    renewed: KAFKA_TOPICS.SUBSCRIPTION_RENEWED,
    cancelled: KAFKA_TOPICS.SUBSCRIPTION_CANCELLED,
    expired: KAFKA_TOPICS.SUBSCRIPTION_EXPIRED,
  };

  await sendMessage(topicMap[eventType], {
    eventType,
    subscriptionId,
    userId,
    ...data,
  }, userId);
}

export async function publishStreamEvent(
  eventType: 'started' | 'ended' | 'participant_joined' | 'participant_left',
  streamId: string,
  data?: Record<string, any>,
): Promise<void> {
  const topicMap = {
    started: KAFKA_TOPICS.STREAM_STARTED,
    ended: KAFKA_TOPICS.STREAM_ENDED,
    participant_joined: KAFKA_TOPICS.STREAM_PARTICIPANT_JOINED,
    participant_left: KAFKA_TOPICS.STREAM_PARTICIPANT_LEFT,
  };

  await sendMessage(topicMap[eventType], {
    eventType,
    streamId,
    ...data,
  }, streamId);
}

export async function publishAnalyticsEvent(
  eventName: string,
  userId: string | null,
  properties?: Record<string, any>,
): Promise<void> {
  await sendMessage(KAFKA_TOPICS.ANALYTICS_EVENT, {
    eventName,
    userId,
    properties,
    sessionId: properties?.sessionId,
  }, userId || undefined);
}

export async function publishNotification(
  type: 'email' | 'sms' | 'push',
  userId: string,
  data: Record<string, any>,
): Promise<void> {
  const topicMap = {
    email: KAFKA_TOPICS.EMAIL_SEND,
    sms: KAFKA_TOPICS.SMS_SEND,
    push: KAFKA_TOPICS.PUSH_SEND,
  };

  await sendMessage(topicMap[type], {
    type,
    userId,
    ...data,
  }, userId);
}

// ============================================
// Shutdown
// ============================================

export async function disconnectKafka(): Promise<void> {
  try {
    if (producer) {
      await producer.disconnect();
      producer = null;
      logger.info('Kafka producer disconnected');
    }

    if (consumer) {
      await consumer.disconnect();
      consumer = null;
      logger.info('Kafka consumer disconnected');
    }

    kafka = null;
  } catch (error) {
    logger.error({ error }, 'Error disconnecting Kafka');
  }
}

// ============================================
// Health Check
// ============================================

export async function checkKafkaHealth(): Promise<boolean> {
  try {
    if (!kafka) {
      return false;
    }

    const admin = kafka.admin();
    await admin.connect();
    await admin.listTopics();
    await admin.disconnect();

    return true;
  } catch {
    return false;
  }
}
