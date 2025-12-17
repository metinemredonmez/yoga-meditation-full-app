import Redis from 'ioredis';
import { config } from './config';
import { logger } from './logger';

let redisClient: Redis | null = null;
let isConnected = false;

export function getRedisClient(): Redis | null {
  if (redisClient) {
    return redisClient;
  }

  try {
    const redisUrl = config.redis.url;

    const redisOptions: Record<string, unknown> = {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
      connectTimeout: 10000,
      enableOfflineQueue: false,
    };

    if (config.redis.password) {
      redisOptions.password = config.redis.password;
    }

    redisClient = new Redis(redisUrl, redisOptions);

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
      isConnected = true;
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
      isConnected = true;
    });

    redisClient.on('error', (err) => {
      logger.error({ err }, 'Redis client error');
      isConnected = false;
    });

    redisClient.on('close', () => {
      logger.warn('Redis client connection closed');
      isConnected = false;
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis client reconnecting');
    });

    return redisClient;
  } catch (error) {
    logger.error({ error }, 'Failed to create Redis client');
    return null;
  }
}

export function isRedisConnected(): boolean {
  return isConnected && redisClient !== null && redisClient.status === 'ready';
}

export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis connection closed gracefully');
    } catch (error) {
      logger.error({ error }, 'Error closing Redis connection');
      redisClient.disconnect();
    } finally {
      redisClient = null;
      isConnected = false;
    }
  }
}

export async function testRedisConnection(): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    const pong = await client.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}
