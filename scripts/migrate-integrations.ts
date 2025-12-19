/**
 * Integration Migration Script
 * Migrates existing .env configuration to encrypted database storage
 *
 * Usage:
 *   npm run integrations:migrate
 *
 * This script:
 * 1. Reads existing .env values for known integrations
 * 2. Encrypts and stores them in integration_settings table
 * 3. Creates initial activation status
 */

import { prisma } from '../src/utils/database';
import { integrationEncryption } from '../src/services/integrationEncryptionService';
import { INTEGRATIONS, IntegrationCategory, IntegrationProvider } from '../src/config/integrations';
import dotenv from 'dotenv';

// Load .env
dotenv.config();

// Mapping of env variables to integration settings
const ENV_MAPPINGS: Record<string, { category: IntegrationCategory; provider: IntegrationProvider; key: string }[]> = {
  // Auth - Google
  GOOGLE_CLIENT_ID: [{ category: 'auth', provider: 'google', key: 'client_id' }],
  GOOGLE_CLIENT_SECRET: [{ category: 'auth', provider: 'google', key: 'client_secret' }],

  // Auth - Apple
  APPLE_CLIENT_ID: [{ category: 'auth', provider: 'apple', key: 'client_id' }],
  APPLE_TEAM_ID: [{ category: 'auth', provider: 'apple', key: 'team_id' }],
  APPLE_KEY_ID: [{ category: 'auth', provider: 'apple', key: 'key_id' }],
  APPLE_PRIVATE_KEY: [{ category: 'auth', provider: 'apple', key: 'private_key' }],

  // Push Notifications - Firebase
  FIREBASE_PROJECT_ID: [{ category: 'notification', provider: 'firebase', key: 'project_id' }],
  FIREBASE_CLIENT_EMAIL: [{ category: 'notification', provider: 'firebase', key: 'client_email' }],
  FIREBASE_PRIVATE_KEY: [{ category: 'notification', provider: 'firebase', key: 'private_key' }],

  // Push Notifications - OneSignal
  ONESIGNAL_APP_ID: [{ category: 'notification', provider: 'onesignal', key: 'app_id' }],
  ONESIGNAL_REST_API_KEY: [{ category: 'notification', provider: 'onesignal', key: 'rest_api_key' }],

  // SMS - Twilio
  TWILIO_ACCOUNT_SID: [{ category: 'sms', provider: 'twilio', key: 'account_sid' }],
  TWILIO_AUTH_TOKEN: [{ category: 'sms', provider: 'twilio', key: 'auth_token' }],
  TWILIO_PHONE_NUMBER: [{ category: 'sms', provider: 'twilio', key: 'phone_number' }],

  // SMS - NetGSM
  NETGSM_USER_CODE: [{ category: 'sms', provider: 'netgsm', key: 'user_code' }],
  NETGSM_PASSWORD: [{ category: 'sms', provider: 'netgsm', key: 'password' }],
  NETGSM_HEADER: [{ category: 'sms', provider: 'netgsm', key: 'header' }],

  // Email - SMTP
  SMTP_HOST: [{ category: 'email', provider: 'smtp', key: 'host' }],
  SMTP_PORT: [{ category: 'email', provider: 'smtp', key: 'port' }],
  SMTP_USER: [{ category: 'email', provider: 'smtp', key: 'user' }],
  SMTP_PASSWORD: [{ category: 'email', provider: 'smtp', key: 'password' }],
  SMTP_FROM_EMAIL: [{ category: 'email', provider: 'smtp', key: 'from_email' }],
  SMTP_FROM_NAME: [{ category: 'email', provider: 'smtp', key: 'from_name' }],

  // Email - SendGrid
  SENDGRID_API_KEY: [{ category: 'email', provider: 'sendgrid', key: 'api_key' }],
  SENDGRID_FROM_EMAIL: [{ category: 'email', provider: 'sendgrid', key: 'from_email' }],
  SENDGRID_FROM_NAME: [{ category: 'email', provider: 'sendgrid', key: 'from_name' }],

  // Payment - Stripe
  STRIPE_SECRET_KEY: [{ category: 'payment', provider: 'stripe', key: 'secret_key' }],
  STRIPE_PUBLISHABLE_KEY: [{ category: 'payment', provider: 'stripe', key: 'publishable_key' }],
  STRIPE_WEBHOOK_SECRET: [{ category: 'payment', provider: 'stripe', key: 'webhook_secret' }],

  // Payment - Iyzico
  IYZICO_API_KEY: [{ category: 'payment', provider: 'iyzico', key: 'api_key' }],
  IYZICO_SECRET_KEY: [{ category: 'payment', provider: 'iyzico', key: 'secret_key' }],
  IYZICO_BASE_URL: [{ category: 'payment', provider: 'iyzico', key: 'base_url' }],

  // Payment - Apple IAP
  APPLE_IAP_SHARED_SECRET: [{ category: 'payment', provider: 'apple_iap', key: 'shared_secret' }],
  APPLE_IAP_KEY_ID: [{ category: 'payment', provider: 'apple_iap', key: 'key_id' }],
  APPLE_IAP_ISSUER_ID: [{ category: 'payment', provider: 'apple_iap', key: 'issuer_id' }],

  // Payment - Google Play
  GOOGLE_PLAY_PACKAGE_NAME: [{ category: 'payment', provider: 'google_play', key: 'package_name' }],
  GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL: [{ category: 'payment', provider: 'google_play', key: 'service_account_email' }],
  GOOGLE_PLAY_PRIVATE_KEY: [{ category: 'payment', provider: 'google_play', key: 'private_key' }],

  // Storage - AWS S3
  AWS_ACCESS_KEY_ID: [{ category: 'storage', provider: 'aws_s3', key: 'access_key' }],
  AWS_SECRET_ACCESS_KEY: [{ category: 'storage', provider: 'aws_s3', key: 'secret_key' }],
  AWS_REGION: [{ category: 'storage', provider: 'aws_s3', key: 'region' }],
  AWS_S3_BUCKET: [{ category: 'storage', provider: 'aws_s3', key: 'bucket_name' }],
  S3_BUCKET_NAME: [{ category: 'storage', provider: 'aws_s3', key: 'bucket_name' }],
  S3_ACCESS_KEY_ID: [{ category: 'storage', provider: 'aws_s3', key: 'access_key' }],
  S3_SECRET_ACCESS_KEY: [{ category: 'storage', provider: 'aws_s3', key: 'secret_key' }],
  S3_REGION: [{ category: 'storage', provider: 'aws_s3', key: 'region' }],
  STORAGE_CDN_BASE_URL: [{ category: 'storage', provider: 'aws_s3', key: 'cdn_url' }],

  // Storage - Cloudinary
  CLOUDINARY_CLOUD_NAME: [{ category: 'storage', provider: 'cloudinary', key: 'cloud_name' }],
  CLOUDINARY_API_KEY: [{ category: 'storage', provider: 'cloudinary', key: 'api_key' }],
  CLOUDINARY_API_SECRET: [{ category: 'storage', provider: 'cloudinary', key: 'api_secret' }],

  // Streaming - Agora
  AGORA_APP_ID: [{ category: 'streaming', provider: 'agora', key: 'app_id' }],
  AGORA_APP_CERTIFICATE: [{ category: 'streaming', provider: 'agora', key: 'app_certificate' }],

  // Monitoring - Sentry
  SENTRY_DSN: [{ category: 'monitoring', provider: 'sentry', key: 'dsn' }],
  SENTRY_ENVIRONMENT: [{ category: 'monitoring', provider: 'sentry', key: 'environment' }],

  // Monitoring - Elasticsearch
  ELASTICSEARCH_URL: [{ category: 'monitoring', provider: 'elasticsearch', key: 'url' }],
  ELASTICSEARCH_USERNAME: [{ category: 'monitoring', provider: 'elasticsearch', key: 'username' }],
  ELASTICSEARCH_PASSWORD: [{ category: 'monitoring', provider: 'elasticsearch', key: 'password' }],
};

interface MigrationResult {
  category: string;
  provider: string;
  key: string;
  status: 'created' | 'updated' | 'skipped';
  envVar: string;
}

async function migrateIntegrations(): Promise<void> {
  console.log('🚀 Integration Migration Script');
  console.log('================================\n');

  // Check encryption key
  if (!process.env.ENCRYPTION_KEY) {
    console.error('❌ ENCRYPTION_KEY ortam degiskeni gerekli!');
    console.log('');
    console.log('.env dosyasina ekleyin:');
    console.log('  ENCRYPTION_KEY=your-32-character-secret-key-here');
    process.exit(1);
  }

  const results: MigrationResult[] = [];
  const dryRun = process.argv.includes('--dry-run');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - Degisiklik yapilmayacak\n');
  }

  // Process each env mapping
  for (const [envVar, mappings] of Object.entries(ENV_MAPPINGS)) {
    const value = process.env[envVar];

    if (!value) {
      continue;
    }

    for (const mapping of mappings) {
      const { category, provider, key } = mapping;

      // Check if setting already exists
      const existing = await prisma.integration_settings.findUnique({
        where: {
          category_provider_key: { category, provider, key },
        },
      });

      if (existing) {
        results.push({
          category,
          provider,
          key,
          status: 'skipped',
          envVar,
        });
        continue;
      }

      if (!dryRun) {
        // Encrypt and store
        const encryptedValue = integrationEncryption.encrypt(value);

        await prisma.integration_settings.create({
          data: {
            category,
            provider,
            key,
            value: encryptedValue,
            isEncrypted: true,
            isActive: true,
          },
        });
      }

      results.push({
        category,
        provider,
        key,
        status: 'created',
        envVar,
      });
    }
  }

  // Print results
  console.log('📊 Migration Sonuclari:');
  console.log('------------------------\n');

  // Group by category/provider
  const grouped: Record<string, MigrationResult[]> = {};
  for (const result of results) {
    const groupKey = `${result.category}/${result.provider}`;
    if (!grouped[groupKey]) {
      grouped[groupKey] = [];
    }
    grouped[groupKey].push(result);
  }

  for (const [groupKey, groupResults] of Object.entries(grouped)) {
    console.log(`📦 ${groupKey}`);
    for (const r of groupResults) {
      const icon = r.status === 'created' ? '✅' : r.status === 'updated' ? '🔄' : '⏭️';
      console.log(`   ${icon} ${r.key} (${r.envVar}) - ${r.status}`);
    }
    console.log('');
  }

  // Summary
  const created = results.filter((r) => r.status === 'created').length;
  const updated = results.filter((r) => r.status === 'updated').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;

  console.log('📈 Ozet:');
  console.log(`   Olusturulan: ${created}`);
  console.log(`   Guncellenen: ${updated}`);
  console.log(`   Atlanan (mevcut): ${skipped}`);
  console.log('');

  if (dryRun) {
    console.log('ℹ️  Gercek migration icin --dry-run olmadan calistirin');
  } else {
    // Log the migration
    await prisma.integration_logs.create({
      data: {
        category: 'system',
        provider: 'migration',
        action: 'env_migration',
        status: 'success',
        message: `Migrated ${created} new settings, skipped ${skipped} existing`,
        metadata: { results },
      },
    });

    console.log('✅ Migration tamamlandi!');
  }
}

migrateIntegrations()
  .catch((error) => {
    console.error('❌ Migration hatasi:', error.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
