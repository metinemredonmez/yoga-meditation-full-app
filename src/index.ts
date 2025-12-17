import express, { type Express } from 'express';
import { config } from './utils/config';
import { httpLogger } from './middleware/logger';
import {
  corsMiddleware,
  helmetMiddleware,
  hppMiddleware,
  cookieParserMiddleware,
  csrfProtection,
  attachCsrfToken,
  trustProxy,
} from './middleware/security';
import { ipBlockerMiddleware } from './middleware/ipBlocker';
import { errorHandler, HttpError } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { getRedisClient, closeRedisConnection, testRedisConnection } from './utils/redis';

// Metrics and monitoring
import { metricsMiddleware, metricsHandler } from './services/metricsService';
import {
  initializeSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
  sentryUserMiddleware,
  flushSentry,
} from './services/sentryService';

// Import routes
import healthRoutes from './routes/health';
import userRoutes from './routes/user';
import adminRoutes from './routes/admin';
import adminProgramRoutes from './routes/adminProgram';
import adminReportRoutes from './routes/adminReport';
import adminChallengeRoutes from './routes/adminChallenge';
import adminPoseRoutes from './routes/adminPose';
import classRoutes from './routes/class';
import bookingRoutes from './routes/booking';
import paymentRoutes from './routes/payment';
import notificationRoutes from './routes/notification';
import programRoutes from './routes/program';
import tagRoutes from './routes/tag';
import searchRoutes from './routes/search';
import challengeRoutes from './routes/challenge';
import reminderRoutes from './routes/reminder';
import progressRoutes from './routes/progress';
import plannerRoutes from './routes/planner';
import poseRoutes from './routes/pose';
import subscriptionRoutes from './routes/subscription';
import mediaRoutes from './routes/media';
import passwordResetRoutes from './routes/passwordReset';
import videoProgressRoutes from './routes/videoProgress';
import pushNotificationRoutes from './routes/pushNotification';
import authRoutes from './routes/auth';
import favoriteRoutes from './routes/favorite';
import smsRoutes from './routes/sms';
import notificationPreferenceRoutes from './routes/notificationPreference';
import rateLimitRoutes from './routes/rateLimit';
import apiKeyRoutes from './routes/apiKey';
import cacheRoutes from './routes/cache';
import webhookRoutes from './routes/webhook';
import adminWebhookRoutes from './routes/adminWebhook';
import subscriptionPlanRoutes from './routes/subscriptionPlan';
import paymentWebhookRoutes from './routes/paymentWebhook';
import invoiceRoutes from './routes/invoice';
import payment2Routes from './routes/payment2';
import analyticsRoutes from './routes/analytics';
import adminCommunicationRoutes from './routes/adminCommunication';
import instructorRoutes from './routes/instructor';
import instructorPublicRoutes from './routes/instructorPublic';
import instructorUserRoutes from './routes/instructorUser';
import adminInstructorRoutes from './routes/adminInstructor';
import liveStreamRoutes from './routes/liveStream';
import adminLiveStreamRoutes from './routes/adminLiveStream';

// Sprint 20: Community & Social System Routes
import forumRoutes from './routes/forum';
import commentRoutes from './routes/comment';
import socialRoutes from './routes/social';
import messagingRoutes from './routes/messaging';
import groupRoutes from './routes/group';
import leaderboardRoutes from './routes/leaderboard';
import reportRoutes from './routes/report';

// Sprint 21: Gamification & Achievements System Routes
import gamificationRoutes from './routes/gamification';
import achievementRoutes from './routes/achievement';
import questRoutes from './routes/quest';
import eventRoutes from './routes/event';
import referralRoutes from './routes/referral';
import shopRoutes from './routes/shop';
import customizationRoutes from './routes/customization';
import dailyRewardRoutes from './routes/dailyReward';
import adminGamificationRoutes from './routes/adminGamification';

// Sprint 22: Multi-language (i18n) System Routes
import i18nRoutes from './routes/i18n';
import adminI18nRoutes from './routes/adminI18n';

// Sprint 23: Admin Dashboard API Routes
import adminDashboardRoutes from './routes/admin/index';

// Sprint 24: Content Management System Routes
import cmsRoutes from './routes/cms/index';

// Sprint 25: Podcast Module Routes
import podcastRoutes from './routes/podcast';
import adminPodcastRoutes from './routes/adminPodcast';

// Sprint 26: Mobile API Routes
import mobileRoutes from './routes/mobile';

// Sprint 26: Offline Sync Routes
import offlineSyncRoutes from './routes/offlineSync';

// Payment Integrations (Super Admin only)
import paymentIntegrationsRoutes from './routes/paymentIntegrations';

// External Webhooks (Iyzico, Twilio, SendGrid)
import externalWebhookRoutes from './webhooks/index';

import swaggerUi from 'swagger-ui-express';
import { createServer } from 'http';
import { swaggerSpec } from './config/swagger';
import type { Server } from 'http';
const app: Express = express();

// Initialize Sentry (must be early, before routes)
if (config.sentry?.enabled) {
  initializeSentry(app);
  app.use(sentryRequestHandler());
  app.use(sentryTracingHandler());
}

// Trust proxy configuration (e.g., when running behind load balancers)
app.set('trust proxy', trustProxy);

// Core middleware
app.use(httpLogger);
app.use(helmetMiddleware);
app.use(hppMiddleware);
app.disable('x-powered-by');
app.use(corsMiddleware);
app.use(cookieParserMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Metrics middleware (Prometheus)
if (config.metrics?.enabled) {
  app.use(metricsMiddleware());
  app.get(config.metrics.path || '/metrics', metricsHandler());
  logger.info({ path: config.metrics.path }, 'Prometheus metrics enabled');
}

// IP blocker middleware - must be early in the chain
app.use(ipBlockerMiddleware);

app.use(csrfProtection);
app.use(attachCsrfToken);

// Sentry user context middleware (after auth middleware)
if (config.sentry?.enabled) {
  app.use(sentryUserMiddleware());
}

// Routes
const swaggerRouter = express.Router();
swaggerRouter.use(...(swaggerUi.serve as unknown as express.RequestHandler[]));
swaggerRouter.get('/', swaggerUi.setup(swaggerSpec, { explorer: true }) as unknown as express.RequestHandler);

app.use('/api/docs', swaggerRouter);
app.use('/api/health', healthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin/programs', adminProgramRoutes);
app.use('/api/admin/reports', adminReportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/challenges', adminChallengeRoutes);
app.use('/api/admin/poses', adminPoseRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/poses', poseRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/progress/video', videoProgressRoutes);
app.use('/api/push', pushNotificationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/notification-preferences', notificationPreferenceRoutes);
app.use('/api/admin/rate-limit', rateLimitRoutes);
app.use('/api/admin/cache', cacheRoutes);
app.use('/api/admin/webhooks', adminWebhookRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/plans', subscriptionPlanRoutes);
app.use('/api/payment-webhooks', paymentWebhookRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments-v2', payment2Routes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin/communication', adminCommunicationRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/instructors', instructorPublicRoutes);
app.use('/api/me/instructors', instructorUserRoutes);
app.use('/api/admin/instructors', adminInstructorRoutes);
app.use('/api/live-streams', liveStreamRoutes);
app.use('/api/admin/live-streams', adminLiveStreamRoutes);

// Sprint 20: Community & Social System
app.use('/api/forum', forumRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/reports', reportRoutes);

// Sprint 21: Gamification & Achievements System
app.use('/api/gamification', gamificationRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/customization', customizationRoutes);
app.use('/api/daily-rewards', dailyRewardRoutes);
app.use('/api/admin/gamification', adminGamificationRoutes);

// Sprint 22: Multi-language (i18n) System
app.use('/api/i18n', i18nRoutes);
app.use('/api/admin/i18n', adminI18nRoutes);

// Sprint 23: Admin Dashboard API
app.use('/api/admin/dashboard', adminDashboardRoutes);

// Sprint 24: Content Management System
app.use('/api/cms', cmsRoutes);

// Sprint 25: Podcast Module
app.use('/api/podcasts', podcastRoutes);
app.use('/api/admin/podcasts', adminPodcastRoutes);

// Sprint 26: Mobile API
app.use('/api/mobile', mobileRoutes);

// Sprint 26: Offline Sync
app.use('/api/offline', offlineSyncRoutes);

// Payment Integrations (Super Admin only)
app.use('/api/admin/payment-integrations', paymentIntegrationsRoutes);

// External Webhooks (Iyzico, Twilio, SendGrid) - No auth required
app.use('/webhooks', externalWebhookRoutes);

// Create HTTP server for Socket.IO
const httpServer: Server = createServer(app);

async function start() {
  try {
    // Initialize Redis connection
    const redisClient = getRedisClient();
    if (redisClient) {
      const isConnected = await testRedisConnection();
      if (isConnected) {
        logger.info('Redis connection established');

        // Optional: Warm cache on startup
        if (config.cache.warmOnStart) {
          const { warmAll } = await import('./services/cacheWarmingService');
          logger.info('Warming cache on startup...');
          const result = await warmAll();
          if (result.success) {
            logger.info({ warmed: result.warmed, durationMs: result.duration }, 'Cache warmed successfully');
          } else {
            logger.warn({ errors: result.errors }, 'Cache warming completed with errors');
          }
        }
      } else {
        logger.warn('Redis connection failed - using in-memory rate limiting and no caching');
      }
    } else {
      logger.warn('Redis client not initialized - using in-memory rate limiting and no caching');
    }

    // Initialize webhook system
    if (config.webhook.enabled) {
      const { initializeWebhookEventListeners } = await import('./services/webhookEventEmitter');
      const { startWebhookProcessor } = await import('./jobs/webhookProcessor');

      initializeWebhookEventListeners();
      startWebhookProcessor();
      logger.info('Webhook system initialized');
    }

    // Initialize analytics jobs (cron)
    const { initializeAnalyticsJobs } = await import('./jobs/analyticsJob');
    initializeAnalyticsJobs();
    logger.info('Analytics jobs initialized');

    // Initialize message jobs (cron)
    const { initializeMessageJobs } = await import('./jobs/messageJobs');
    initializeMessageJobs();
    logger.info('Message jobs initialized');

    // Initialize message queues (Bull)
    const { initializeQueues } = await import('./services/messageQueueService');
    initializeQueues();
    logger.info('Message queues initialized');

    // Initialize default message templates
    const { initializeDefaultTemplates } = await import('./services/messageTemplateService');
    await initializeDefaultTemplates();
    logger.info('Default message templates initialized');

    // Initialize instructor jobs (cron)
    const { initializeInstructorJobs } = await import('./jobs/instructorJobs');
    initializeInstructorJobs();
    logger.info('Instructor jobs initialized');

    // Initialize live stream Socket.IO
    const { initializeSocketServer } = await import('./services/liveStreamSocketService');
    initializeSocketServer(httpServer);
    logger.info('Live stream Socket.IO initialized');

    // Initialize live stream cron jobs
    const { initializeLiveStreamJobs } = await import('./jobs/liveStreamCronJobs');
    initializeLiveStreamJobs();
    logger.info('Live stream jobs initialized');

    // Initialize gamification jobs (Sprint 21)
    const { initializeGamificationJobs } = await import('./jobs/gamificationJobs');
    initializeGamificationJobs();
    logger.info('Gamification jobs initialized');

    // Initialize Kafka (if enabled)
    if (config.kafka?.enabled) {
      const { initializeKafka, getProducer } = await import('./services/kafkaService');
      initializeKafka();
      await getProducer();
      logger.info('Kafka initialized');
    }

    // Initialize RabbitMQ (if enabled)
    if (config.rabbitmq?.enabled) {
      const { connectRabbitMQ } = await import('./services/rabbitmqService');
      await connectRabbitMQ();
      logger.info('RabbitMQ initialized');
    }

    // Initialize Elasticsearch indices (if enabled)
    if (config.elasticsearch?.enabled) {
      const { createAllIndices } = await import('./services/elasticsearchService');
      await createAllIndices();
      logger.info('Elasticsearch indices initialized');
    }

    // 404 handler (after all routes)
    app.use((req, res, next) => {
      next(new HttpError(404, 'Route not found', {
        path: req.originalUrl,
        method: req.method,
      }));
    });

    // Sentry error handler (must be before custom error handler)
    if (config.sentry?.enabled) {
      app.use(sentryErrorHandler());
    }

    // Error handler
    app.use(errorHandler);

    httpServer.listen(config.PORT, () => {
      logger.info({ port: config.PORT, env: config.NODE_ENV }, '🧘‍♀️ Yoga app server running');
      logger.info(`🔗 Health check: http://localhost:${config.PORT}/api/health`);
      logger.info(`📘 Swagger UI: http://localhost:${config.PORT}/api/docs`);
      logger.info(`📡 Live Stream WebSocket: ws://localhost:${config.PORT}/live-stream`);
      if (config.metrics?.enabled) {
        logger.info(`📊 Prometheus Metrics: http://localhost:${config.PORT}${config.metrics.path}`);
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start application');
    process.exit(1);
  }
}

// Only start server if not in test environment
if (config.NODE_ENV !== 'test') {
  void start();
}

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  logger.info(`${signal} signal received: closing HTTP server`);

  // Stop webhook processor
  if (config.webhook.enabled) {
    const { stopWebhookProcessor } = await import('./jobs/webhookProcessor');
    stopWebhookProcessor();
  }

  // Stop analytics jobs
  const { stopAnalyticsJobs } = await import('./jobs/analyticsJob');
  stopAnalyticsJobs();

  // Stop message jobs
  const { stopMessageJobs } = await import('./jobs/messageJobs');
  stopMessageJobs();

  // Stop live stream jobs
  const { stopLiveStreamJobs } = await import('./jobs/liveStreamCronJobs');
  stopLiveStreamJobs();

  // Stop gamification jobs
  const { stopGamificationJobs } = await import('./jobs/gamificationJobs');
  stopGamificationJobs();

  // Close Socket.IO
  const { closeSocketServer } = await import('./services/liveStreamSocketService');
  closeSocketServer();

  // Close message queues
  const { closeQueues } = await import('./services/messageQueueService');
  await closeQueues();

  // Close Kafka (if enabled)
  if (config.kafka?.enabled) {
    const { disconnectKafka } = await import('./services/kafkaService');
    await disconnectKafka();
    logger.info('Kafka disconnected');
  }

  // Close RabbitMQ (if enabled)
  if (config.rabbitmq?.enabled) {
    const { disconnectRabbitMQ } = await import('./services/rabbitmqService');
    await disconnectRabbitMQ();
    logger.info('RabbitMQ disconnected');
  }

  // Close Elasticsearch (if enabled)
  if (config.elasticsearch?.enabled) {
    const { closeElasticsearch } = await import('./services/elasticsearchService');
    await closeElasticsearch();
    logger.info('Elasticsearch disconnected');
  }

  // Flush Sentry events (if enabled)
  if (config.sentry?.enabled) {
    await flushSentry();
    logger.info('Sentry flushed');
  }

  // Close Redis connection
  await closeRedisConnection();

  if (httpServer) {
    httpServer.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
