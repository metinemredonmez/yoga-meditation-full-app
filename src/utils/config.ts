import { z } from 'zod';
import * as dotenv from 'dotenv';
dotenv.config();

const booleanFromEnv = (value: unknown, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return fallback;

  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes'].includes(normalized)) return true;
  if (['0', 'false', 'no'].includes(normalized)) return false;
  return fallback;
};

const optionalString = z.preprocess((val) => {
  if (typeof val === 'string' && val.trim() === '') {
    return undefined;
  }
  return val;
}, z.string().optional());

const configSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  API_BASE_URL: optionalString, // Production API URL for Swagger
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  JWT_ISSUER: z.string().default('yoga-app'),
  JWT_AUDIENCE: z.string().default('yoga-app-users'),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  BCRYPT_ROUNDS: z.coerce.number().default(10),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60 * 1000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(5),
  CSRF_COOKIE_NAME: z.string().default('yoga_csrf'),
  CSRF_HEADER_NAME: z.string().default('x-csrf-token'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  TRUST_PROXY: z.string().default('false'),
  SESSION_COOKIE_SECURE: z.string().default('false'),
  SMTP_HOST: optionalString,
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: optionalString,
  SMTP_PASSWORD: optionalString,
  SMTP_FROM: optionalString,
  PUSH_PROVIDER_API_KEY: optionalString,
  PUSH_PROVIDER_APP_ID: optionalString,
  FIREBASE_PROJECT_ID: optionalString,
  FIREBASE_CLIENT_EMAIL: optionalString,
  FIREBASE_PRIVATE_KEY: optionalString,
  // Twilio SMS Configuration
  TWILIO_ACCOUNT_SID: optionalString,
  TWILIO_AUTH_TOKEN: optionalString,
  TWILIO_PHONE_NUMBER: optionalString,
  TWILIO_MESSAGING_SERVICE_SID: optionalString,
  // SendGrid Configuration
  SENDGRID_API_KEY: optionalString,
  SENDGRID_WEBHOOK_VERIFICATION_KEY: optionalString,
  SMS_ENABLED: z.string().default('false'),
  OTP_EXPIRY_MINUTES: z.coerce.number().default(5),
  OTP_MAX_ATTEMPTS: z.coerce.number().default(3),
  // Legacy SMS config (deprecated)
  SMS_TWILIO_SID: optionalString,
  SMS_TWILIO_TOKEN: optionalString,
  SMS_TWILIO_FROM: optionalString,
  // NetGSM SMS Configuration
  NETGSM_USER_CODE: optionalString,
  NETGSM_PASSWORD: optionalString,
  NETGSM_HEADER: optionalString,
  SMS_PROVIDER: z.enum(['twilio', 'netgsm', 'auto']).default('auto'),
  // OneSignal Push Notification Configuration
  ONESIGNAL_APP_ID: optionalString,
  ONESIGNAL_REST_API_KEY: optionalString,
  PUSH_PROVIDER: z.enum(['firebase', 'onesignal', 'auto']).default('auto'),
  // Stripe Configuration
  STRIPE_SECRET_KEY: optionalString,
  STRIPE_PUBLISHABLE_KEY: optionalString,
  STRIPE_WEBHOOK_SECRET: optionalString,
  STRIPE_API_VERSION: z.string().default('2023-10-16'),

  // Apple In-App Purchase Configuration
  APPLE_SHARED_SECRET: optionalString,
  APPLE_BUNDLE_ID: optionalString,
  APPLE_ISSUER_ID: optionalString,
  APPLE_KEY_ID: optionalString,
  APPLE_PRIVATE_KEY: optionalString, // Base64 encoded
  APPLE_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),

  // Google Play Billing Configuration
  GOOGLE_PACKAGE_NAME: optionalString,
  GOOGLE_SERVICE_ACCOUNT_EMAIL: optionalString,
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: optionalString, // Base64 encoded
  // Google Pub/Sub JWT Verification (for webhook authentication)
  GOOGLE_PUBSUB_AUDIENCE: optionalString, // Your webhook endpoint URL
  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,

  // Payment Settings
  PAYMENT_SUCCESS_URL: z.string().default('http://localhost:3000/payment/success'),
  PAYMENT_CANCEL_URL: z.string().default('http://localhost:3000/payment/cancel'),
  PAYMENT_CURRENCY: z.string().default('TRY'),
  SUBSCRIPTION_GRACE_PERIOD_DAYS: z.coerce.number().default(3),
  OFFLINE_DOWNLOAD_EXPIRY_DAYS: z.coerce.number().default(30),
  MAX_OFFLINE_DOWNLOADS: z.coerce.number().default(10),

  // Legacy - to be deprecated
  PAYPAL_CLIENT_ID: optionalString,
  PAYPAL_CLIENT_SECRET: optionalString,
  IYZICO_API_KEY: optionalString,
  IYZICO_SECRET_KEY: optionalString,
  S3_BUCKET_NAME: optionalString,
  S3_ACCESS_KEY_ID: optionalString,
  S3_SECRET_ACCESS_KEY: optionalString,
  S3_REGION: optionalString,
  STORAGE_CDN_BASE_URL: optionalString,
  STORAGE_SIGNED_URL_TTL_SECONDS: z.coerce.number().optional(),
  // Refresh Token Configuration
  REFRESH_TOKEN_ROTATION_ENABLED: z.string().default('true'),
  REFRESH_TOKEN_REUSE_DETECTION: z.string().default('true'),
  REFRESH_TOKEN_MAX_SESSIONS: z.coerce.number().default(5),
  // Cookie Configuration
  COOKIE_DOMAIN: optionalString,
  COOKIE_SECURE: z.string().default('false'),
  COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('lax'),
  ACCESS_TOKEN_COOKIE_NAME: z.string().default('yoga_access_token'),
  REFRESH_TOKEN_COOKIE_NAME: z.string().default('yoga_refresh_token'),
  // Notification Preferences
  DEFAULT_TIMEZONE: z.string().default('Europe/Istanbul'),
  UNSUBSCRIBE_TOKEN_SECRET: z.string().min(32, 'UNSUBSCRIBE_TOKEN_SECRET must be at least 32 characters'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  // Redis Configuration
  REDIS_URL: optionalString,
  REDIS_PASSWORD: optionalString,
  // Rate Limiting
  RATE_LIMIT_ENABLED: z.string().default('true'),
  RATE_LIMIT_TRUST_PROXY: z.string().default('true'),
  RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS: z.string().default('false'),
  // API Keys
  API_KEY_PREFIX_LIVE: z.string().default('yk_live_'),
  API_KEY_PREFIX_TEST: z.string().default('yk_test_'),
  // Cache Configuration
  CACHE_ENABLED: z.string().default('true'),
  CACHE_DEFAULT_TTL: z.coerce.number().default(300),
  CACHE_PROGRAMS_TTL: z.coerce.number().default(600),
  CACHE_POSES_TTL: z.coerce.number().default(3600),
  CACHE_TAGS_TTL: z.coerce.number().default(86400),
  CACHE_USER_TTL: z.coerce.number().default(300),
  CACHE_STATS_TTL: z.coerce.number().default(60),
  CACHE_WARM_ON_START: z.string().default('false'),
  CACHE_DEBUG: z.string().default('false'),
  // Webhook Configuration
  WEBHOOK_ENABLED: z.string().default('true'),
  WEBHOOK_TIMEOUT_MS: z.coerce.number().default(10000),
  WEBHOOK_MAX_RETRIES: z.coerce.number().default(5),
  WEBHOOK_RETRY_DELAYS: z.string().default('60,300,900,3600,86400'),
  WEBHOOK_SECRET_LENGTH: z.coerce.number().default(32),
  WEBHOOK_SIGNATURE_HEADER: z.string().default('X-Webhook-Signature'),
  WEBHOOK_QUEUE_INTERVAL_MS: z.coerce.number().default(30000),
  WEBHOOK_RETRY_INTERVAL_MS: z.coerce.number().default(300000),
  // Agora Configuration (Live Streaming)
  AGORA_APP_ID: optionalString,
  AGORA_APP_CERTIFICATE: optionalString,
  AGORA_CUSTOMER_ID: optionalString,
  AGORA_CUSTOMER_SECRET: optionalString,
  AGORA_RECORDING_BUCKET: optionalString,
  AGORA_RECORDING_ACCESS_KEY: optionalString,
  AGORA_RECORDING_SECRET_KEY: optionalString,
  AGORA_RECORDING_REGION: z.string().default('eu'),
  // Live Stream Settings
  LIVE_STREAM_MAX_PARTICIPANTS: z.coerce.number().default(100),
  LIVE_STREAM_RECORDING_ENABLED: z.string().default('true'),
  LIVE_STREAM_CHAT_RATE_LIMIT: z.coerce.number().default(10),

  // Kafka Configuration
  KAFKA_BROKERS: optionalString,
  KAFKA_CLIENT_ID: z.string().default('yoga-app'),
  KAFKA_GROUP_ID: z.string().default('yoga-app-group'),
  KAFKA_ENABLED: z.string().default('false'),

  // RabbitMQ Configuration
  RABBITMQ_URL: optionalString,
  RABBITMQ_ENABLED: z.string().default('false'),

  // Elasticsearch Configuration
  ELASTICSEARCH_URL: optionalString,
  ELASTICSEARCH_INDEX_PREFIX: z.string().default('yoga'),
  ELASTICSEARCH_ENABLED: z.string().default('false'),

  // Sentry Configuration
  SENTRY_DSN: optionalString,
  SENTRY_RELEASE: optionalString,
  SENTRY_ENABLED: z.string().default('false'),

  // Prometheus Metrics Configuration
  METRICS_ENABLED: z.string().default('true'),
  METRICS_PATH: z.string().default('/metrics'),
});

type RawConfig = z.infer<typeof configSchema>;

function parseTrustProxy(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;

  const numeric = Number(value);
  if (!Number.isNaN(numeric)) {
    return numeric;
  }

  return value;
}

function loadConfig() {
  try {
    const raw = configSchema.parse(process.env) as RawConfig;

    const corsOrigins = raw.CORS_ORIGINS
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);

    return {
      ...raw,
      CORS_ORIGINS: corsOrigins,
      SESSION_COOKIE_SECURE: booleanFromEnv(raw.SESSION_COOKIE_SECURE, false),
      TRUST_PROXY: parseTrustProxy(raw.TRUST_PROXY),
      isProduction: raw.NODE_ENV === 'production',
      rateLimit: {
        windowMs: raw.RATE_LIMIT_WINDOW_MS,
        max: raw.RATE_LIMIT_MAX,
      },
      authRateLimit: {
        windowMs: raw.AUTH_RATE_LIMIT_WINDOW_MS,
        max: raw.AUTH_RATE_LIMIT_MAX,
      },
      refreshToken: {
        rotationEnabled: booleanFromEnv(raw.REFRESH_TOKEN_ROTATION_ENABLED, true),
        reuseDetection: booleanFromEnv(raw.REFRESH_TOKEN_REUSE_DETECTION, true),
        maxSessions: raw.REFRESH_TOKEN_MAX_SESSIONS,
      },
      cookie: {
        domain: raw.COOKIE_DOMAIN,
        secure: booleanFromEnv(raw.COOKIE_SECURE, raw.NODE_ENV === 'production'),
        sameSite: raw.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
        accessTokenName: raw.ACCESS_TOKEN_COOKIE_NAME,
        refreshTokenName: raw.REFRESH_TOKEN_COOKIE_NAME,
      },
      sms: {
        enabled: booleanFromEnv(raw.SMS_ENABLED, false),
        provider: raw.SMS_PROVIDER,
        twilioAccountSid: raw.TWILIO_ACCOUNT_SID,
        twilioAuthToken: raw.TWILIO_AUTH_TOKEN,
        twilioPhoneNumber: raw.TWILIO_PHONE_NUMBER,
        twilioMessagingServiceSid: raw.TWILIO_MESSAGING_SERVICE_SID,
        netgsmUserCode: raw.NETGSM_USER_CODE,
        netgsmPassword: raw.NETGSM_PASSWORD,
        netgsmHeader: raw.NETGSM_HEADER,
        otpExpiryMinutes: raw.OTP_EXPIRY_MINUTES,
        otpMaxAttempts: raw.OTP_MAX_ATTEMPTS,
      },
      sendgrid: {
        apiKey: raw.SENDGRID_API_KEY,
        webhookVerificationKey: raw.SENDGRID_WEBHOOK_VERIFICATION_KEY,
      },
      push: {
        provider: raw.PUSH_PROVIDER,
        onesignalAppId: raw.ONESIGNAL_APP_ID,
        onesignalRestApiKey: raw.ONESIGNAL_REST_API_KEY,
      },
      notification: {
        defaultTimezone: raw.DEFAULT_TIMEZONE,
        unsubscribeTokenSecret: raw.UNSUBSCRIBE_TOKEN_SECRET,
        frontendUrl: raw.FRONTEND_URL,
      },
      redis: {
        url: raw.REDIS_URL || 'redis://localhost:6379',
        password: raw.REDIS_PASSWORD,
      },
      rateLimitConfig: {
        enabled: booleanFromEnv(raw.RATE_LIMIT_ENABLED, true),
        trustProxy: booleanFromEnv(raw.RATE_LIMIT_TRUST_PROXY, true),
        skipSuccessfulRequests: booleanFromEnv(raw.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS, false),
      },
      apiKey: {
        prefixLive: raw.API_KEY_PREFIX_LIVE,
        prefixTest: raw.API_KEY_PREFIX_TEST,
      },
      cache: {
        enabled: booleanFromEnv(raw.CACHE_ENABLED, true),
        defaultTTL: raw.CACHE_DEFAULT_TTL,
        programsTTL: raw.CACHE_PROGRAMS_TTL,
        posesTTL: raw.CACHE_POSES_TTL,
        tagsTTL: raw.CACHE_TAGS_TTL,
        userTTL: raw.CACHE_USER_TTL,
        statsTTL: raw.CACHE_STATS_TTL,
        warmOnStart: booleanFromEnv(raw.CACHE_WARM_ON_START, false),
        debug: booleanFromEnv(raw.CACHE_DEBUG, false),
      },
      webhook: {
        enabled: booleanFromEnv(raw.WEBHOOK_ENABLED, true),
        timeoutMs: raw.WEBHOOK_TIMEOUT_MS,
        maxRetries: raw.WEBHOOK_MAX_RETRIES,
        retryDelays: raw.WEBHOOK_RETRY_DELAYS.split(',').map(Number),
        secretLength: raw.WEBHOOK_SECRET_LENGTH,
        signatureHeader: raw.WEBHOOK_SIGNATURE_HEADER,
        queueIntervalMs: raw.WEBHOOK_QUEUE_INTERVAL_MS,
        retryIntervalMs: raw.WEBHOOK_RETRY_INTERVAL_MS,
      },
      stripe: {
        secretKey: raw.STRIPE_SECRET_KEY,
        publishableKey: raw.STRIPE_PUBLISHABLE_KEY,
        webhookSecret: raw.STRIPE_WEBHOOK_SECRET,
        apiVersion: raw.STRIPE_API_VERSION as '2023-10-16',
      },
      apple: {
        sharedSecret: raw.APPLE_SHARED_SECRET,
        bundleId: raw.APPLE_BUNDLE_ID,
        issuerId: raw.APPLE_ISSUER_ID,
        keyId: raw.APPLE_KEY_ID,
        privateKey: raw.APPLE_PRIVATE_KEY,
        environment: raw.APPLE_ENVIRONMENT,
        clientId: raw.APPLE_BUNDLE_ID, // For Apple Sign In, use bundle ID as client ID
      },
      google: {
        packageName: raw.GOOGLE_PACKAGE_NAME,
        serviceAccountEmail: raw.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        serviceAccountPrivateKey: raw.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
        pubsubAudience: raw.GOOGLE_PUBSUB_AUDIENCE,
        clientId: raw.GOOGLE_CLIENT_ID,
        clientSecret: raw.GOOGLE_CLIENT_SECRET,
      },
      payment: {
        successUrl: raw.PAYMENT_SUCCESS_URL,
        cancelUrl: raw.PAYMENT_CANCEL_URL,
        currency: raw.PAYMENT_CURRENCY,
        gracePeriodDays: raw.SUBSCRIPTION_GRACE_PERIOD_DAYS,
        offlineDownloadExpiryDays: raw.OFFLINE_DOWNLOAD_EXPIRY_DAYS,
        maxOfflineDownloads: raw.MAX_OFFLINE_DOWNLOADS,
      },
      agora: {
        appId: raw.AGORA_APP_ID,
        appCertificate: raw.AGORA_APP_CERTIFICATE,
        customerId: raw.AGORA_CUSTOMER_ID,
        customerSecret: raw.AGORA_CUSTOMER_SECRET,
        recordingBucket: raw.AGORA_RECORDING_BUCKET,
        recordingAccessKey: raw.AGORA_RECORDING_ACCESS_KEY,
        recordingSecretKey: raw.AGORA_RECORDING_SECRET_KEY,
        recordingRegion: raw.AGORA_RECORDING_REGION,
      },
      liveStream: {
        maxParticipants: raw.LIVE_STREAM_MAX_PARTICIPANTS,
        recordingEnabled: booleanFromEnv(raw.LIVE_STREAM_RECORDING_ENABLED, true),
        chatRateLimit: raw.LIVE_STREAM_CHAT_RATE_LIMIT,
      },
      kafka: {
        enabled: booleanFromEnv(raw.KAFKA_ENABLED, false),
        brokers: raw.KAFKA_BROKERS?.split(',').map((b) => b.trim()) || ['localhost:29092'],
        clientId: raw.KAFKA_CLIENT_ID,
        groupId: raw.KAFKA_GROUP_ID,
      },
      rabbitmq: {
        enabled: booleanFromEnv(raw.RABBITMQ_ENABLED, false),
        url: raw.RABBITMQ_URL || 'amqp://localhost:5672',
      },
      elasticsearch: {
        enabled: booleanFromEnv(raw.ELASTICSEARCH_ENABLED, false),
        url: raw.ELASTICSEARCH_URL || 'http://localhost:9200',
        indexPrefix: raw.ELASTICSEARCH_INDEX_PREFIX,
      },
      sentry: {
        enabled: booleanFromEnv(raw.SENTRY_ENABLED, false),
        dsn: raw.SENTRY_DSN,
        release: raw.SENTRY_RELEASE,
      },
      metrics: {
        enabled: booleanFromEnv(raw.METRICS_ENABLED, true),
        path: raw.METRICS_PATH,
      },
    };
  } catch (error) {
    console.error('Invalid environment configuration:', error);
    process.exit(1);
  }
}

export const config = loadConfig();
