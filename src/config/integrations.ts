/**
 * Integration Configuration
 * Defines all supported 3rd party integrations and their required fields
 */

export interface IntegrationField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'textarea' | 'number' | 'email' | 'url';
  required: boolean;
  placeholder?: string;
  description?: string;
}

export interface IntegrationDefinition {
  name: string;
  icon: string;
  description: string;
  fields: IntegrationField[];
  testable: boolean;
  docsUrl?: string;
}

export type IntegrationCategory =
  | 'auth'
  | 'notification'
  | 'sms'
  | 'email'
  | 'payment'
  | 'storage'
  | 'streaming'
  | 'monitoring'
  | 'ai';

export type IntegrationProvider = string;

export const INTEGRATIONS: Record<
  IntegrationCategory,
  Record<string, IntegrationDefinition>
> = {
  // ============================================
  // Authentication
  // ============================================
  auth: {
    google: {
      name: 'Google OAuth',
      icon: 'google',
      description: 'Google ile giriş yapma özelliği',
      docsUrl: 'https://console.cloud.google.com/apis/credentials',
      testable: false,
      fields: [
        {
          key: 'client_id',
          label: 'Client ID',
          type: 'text',
          required: true,
          placeholder: 'xxxx.apps.googleusercontent.com',
          description: 'Google Cloud Console\'dan alınan Client ID',
        },
        {
          key: 'client_secret',
          label: 'Client Secret',
          type: 'password',
          required: true,
          description: 'Google Cloud Console\'dan alınan Secret',
        },
      ],
    },
    apple: {
      name: 'Apple Sign In',
      icon: 'apple',
      description: 'Apple ile giriş yapma özelliği',
      docsUrl: 'https://developer.apple.com/sign-in-with-apple/',
      testable: false,
      fields: [
        {
          key: 'client_id',
          label: 'Bundle ID / Service ID',
          type: 'text',
          required: true,
          placeholder: 'com.yourcompany.app',
          description: 'iOS app için Bundle ID, web için Service ID',
        },
        {
          key: 'team_id',
          label: 'Team ID',
          type: 'text',
          required: true,
          placeholder: 'XXXXXXXXXX',
          description: 'Apple Developer hesabındaki Team ID',
        },
        {
          key: 'key_id',
          label: 'Key ID',
          type: 'text',
          required: true,
          placeholder: 'XXXXXXXXXX',
          description: 'Oluşturulan Sign In with Apple key\'in ID\'si',
        },
        {
          key: 'private_key',
          label: 'Private Key',
          type: 'textarea',
          required: true,
          placeholder: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
          description: '.p8 dosyasının içeriği',
        },
      ],
    },
  },

  // ============================================
  // Push Notifications
  // ============================================
  notification: {
    firebase: {
      name: 'Firebase Cloud Messaging',
      icon: 'firebase',
      description: 'Firebase ile push bildirim gönderme',
      docsUrl: 'https://console.firebase.google.com/',
      testable: true,
      fields: [
        {
          key: 'project_id',
          label: 'Project ID',
          type: 'text',
          required: true,
          placeholder: 'your-project-id',
          description: 'Firebase Console\'daki Project ID',
        },
        {
          key: 'client_email',
          label: 'Client Email',
          type: 'text',
          required: true,
          placeholder: 'firebase-adminsdk-xxx@project.iam.gserviceaccount.com',
          description: 'Service Account email adresi',
        },
        {
          key: 'private_key',
          label: 'Private Key',
          type: 'textarea',
          required: true,
          placeholder: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
          description: 'Service Account JSON\'dan private_key değeri',
        },
      ],
    },
    onesignal: {
      name: 'OneSignal',
      icon: 'bell',
      description: 'OneSignal ile push bildirim gönderme',
      docsUrl: 'https://onesignal.com/',
      testable: false,
      fields: [
        {
          key: 'app_id',
          label: 'App ID',
          type: 'text',
          required: true,
          placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
          description: 'OneSignal Dashboard\'dan App ID',
        },
        {
          key: 'rest_api_key',
          label: 'REST API Key',
          type: 'password',
          required: true,
          description: 'OneSignal Dashboard\'dan REST API Key',
        },
      ],
    },
  },

  // ============================================
  // SMS
  // ============================================
  sms: {
    twilio: {
      name: 'Twilio',
      icon: 'phone',
      description: 'Twilio ile SMS/OTP gönderme',
      docsUrl: 'https://console.twilio.com/',
      testable: true,
      fields: [
        {
          key: 'account_sid',
          label: 'Account SID',
          type: 'text',
          required: true,
          placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
          description: 'Twilio Console\'dan Account SID',
        },
        {
          key: 'auth_token',
          label: 'Auth Token',
          type: 'password',
          required: true,
          description: 'Twilio Console\'dan Auth Token',
        },
        {
          key: 'phone_number',
          label: 'Phone Number',
          type: 'text',
          required: true,
          placeholder: '+15551234567',
          description: 'SMS gönderilecek Twilio numarası',
        },
        {
          key: 'messaging_service_sid',
          label: 'Messaging Service SID (Optional)',
          type: 'text',
          required: false,
          placeholder: 'MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
          description: 'Opsiyonel: Messaging Service kullanmak için',
        },
      ],
    },
    netgsm: {
      name: 'NetGSM',
      icon: 'phone',
      description: 'NetGSM ile SMS gönderme (Türkiye)',
      docsUrl: 'https://www.netgsm.com.tr/',
      testable: false,
      fields: [
        {
          key: 'user_code',
          label: 'Kullanıcı Kodu',
          type: 'text',
          required: true,
          description: 'NetGSM kullanıcı kodu',
        },
        {
          key: 'password',
          label: 'Şifre',
          type: 'password',
          required: true,
          description: 'NetGSM şifresi',
        },
        {
          key: 'header',
          label: 'Başlık',
          type: 'text',
          required: true,
          placeholder: 'YOGAAPP',
          description: 'SMS gönderici adı (başlık)',
        },
      ],
    },
  },

  // ============================================
  // Email
  // ============================================
  email: {
    smtp: {
      name: 'SMTP',
      icon: 'mail',
      description: 'SMTP sunucusu ile email gönderme',
      testable: true,
      fields: [
        {
          key: 'host',
          label: 'Host',
          type: 'text',
          required: true,
          placeholder: 'smtp.example.com',
          description: 'SMTP sunucu adresi',
        },
        {
          key: 'port',
          label: 'Port',
          type: 'number',
          required: true,
          placeholder: '587',
          description: 'SMTP port (genellikle 587 veya 465)',
        },
        {
          key: 'user',
          label: 'Username',
          type: 'text',
          required: true,
          description: 'SMTP kullanıcı adı',
        },
        {
          key: 'password',
          label: 'Password',
          type: 'password',
          required: true,
          description: 'SMTP şifresi',
        },
        {
          key: 'from_email',
          label: 'From Email',
          type: 'email',
          required: true,
          placeholder: 'noreply@example.com',
          description: 'Gönderen email adresi',
        },
        {
          key: 'from_name',
          label: 'From Name',
          type: 'text',
          required: false,
          placeholder: 'Yoga App',
          description: 'Gönderen adı',
        },
      ],
    },
    sendgrid: {
      name: 'SendGrid',
      icon: 'mail',
      description: 'SendGrid API ile email gönderme',
      docsUrl: 'https://sendgrid.com/',
      testable: true,
      fields: [
        {
          key: 'api_key',
          label: 'API Key',
          type: 'password',
          required: true,
          placeholder: 'SG.xxxx',
          description: 'SendGrid API anahtarı',
        },
        {
          key: 'from_email',
          label: 'From Email',
          type: 'email',
          required: true,
          placeholder: 'noreply@example.com',
          description: 'Gönderen email (verified domain)',
        },
        {
          key: 'from_name',
          label: 'From Name',
          type: 'text',
          required: false,
          placeholder: 'Yoga App',
          description: 'Gönderen adı',
        },
      ],
    },
  },

  // ============================================
  // Payment
  // ============================================
  payment: {
    stripe: {
      name: 'Stripe',
      icon: 'credit-card',
      description: 'Stripe ile ödeme alma',
      docsUrl: 'https://dashboard.stripe.com/',
      testable: true,
      fields: [
        {
          key: 'secret_key',
          label: 'Secret Key',
          type: 'password',
          required: true,
          placeholder: 'sk_test_xxx veya sk_live_xxx',
          description: 'Stripe Secret Key',
        },
        {
          key: 'publishable_key',
          label: 'Publishable Key',
          type: 'text',
          required: true,
          placeholder: 'pk_test_xxx veya pk_live_xxx',
          description: 'Frontend için Publishable Key',
        },
        {
          key: 'webhook_secret',
          label: 'Webhook Secret',
          type: 'password',
          required: true,
          placeholder: 'whsec_xxx',
          description: 'Webhook imza doğrulama için secret',
        },
      ],
    },
    iyzico: {
      name: 'Iyzico',
      icon: 'credit-card',
      description: 'Iyzico ile ödeme alma (Türkiye)',
      docsUrl: 'https://merchant.iyzipay.com/',
      testable: false,
      fields: [
        {
          key: 'api_key',
          label: 'API Key',
          type: 'password',
          required: true,
          description: 'Iyzico API Key',
        },
        {
          key: 'secret_key',
          label: 'Secret Key',
          type: 'password',
          required: true,
          description: 'Iyzico Secret Key',
        },
        {
          key: 'base_url',
          label: 'Base URL',
          type: 'url',
          required: true,
          placeholder: 'https://sandbox-api.iyzipay.com',
          description: 'API URL (sandbox veya production)',
        },
      ],
    },
    apple_iap: {
      name: 'Apple In-App Purchase',
      icon: 'apple',
      description: 'Apple uygulama içi satın alma',
      docsUrl: 'https://appstoreconnect.apple.com/',
      testable: false,
      fields: [
        {
          key: 'bundle_id',
          label: 'Bundle ID',
          type: 'text',
          required: true,
          placeholder: 'com.yourcompany.app',
          description: 'iOS uygulama Bundle ID',
        },
        {
          key: 'shared_secret',
          label: 'Shared Secret',
          type: 'password',
          required: true,
          description: 'App Store Connect\'ten alınan secret',
        },
        {
          key: 'issuer_id',
          label: 'Issuer ID',
          type: 'text',
          required: false,
          description: 'App Store Connect API için Issuer ID',
        },
        {
          key: 'key_id',
          label: 'Key ID',
          type: 'text',
          required: false,
          description: 'App Store Connect API Key ID',
        },
        {
          key: 'private_key',
          label: 'Private Key',
          type: 'textarea',
          required: false,
          description: 'API Key private key (.p8)',
        },
      ],
    },
    google_play: {
      name: 'Google Play Billing',
      icon: 'google',
      description: 'Google Play uygulama içi satın alma',
      docsUrl: 'https://play.google.com/console/',
      testable: false,
      fields: [
        {
          key: 'package_name',
          label: 'Package Name',
          type: 'text',
          required: true,
          placeholder: 'com.yourcompany.app',
          description: 'Android uygulama package name',
        },
        {
          key: 'service_account_email',
          label: 'Service Account Email',
          type: 'text',
          required: true,
          placeholder: 'xxx@xxx.iam.gserviceaccount.com',
          description: 'Google Cloud Service Account email',
        },
        {
          key: 'service_account_private_key',
          label: 'Service Account Private Key',
          type: 'textarea',
          required: true,
          description: 'Service Account JSON\'dan private_key',
        },
      ],
    },
  },

  // ============================================
  // Storage
  // ============================================
  storage: {
    aws_s3: {
      name: 'AWS S3',
      icon: 'cloud',
      description: 'Amazon S3 ile dosya depolama',
      docsUrl: 'https://console.aws.amazon.com/s3/',
      testable: true,
      fields: [
        {
          key: 'bucket',
          label: 'Bucket Name',
          type: 'text',
          required: true,
          placeholder: 'my-bucket',
          description: 'S3 bucket adı',
        },
        {
          key: 'region',
          label: 'Region',
          type: 'text',
          required: true,
          placeholder: 'eu-central-1',
          description: 'AWS region',
        },
        {
          key: 'access_key',
          label: 'Access Key ID',
          type: 'text',
          required: true,
          placeholder: 'AKIAXXXXXXXXXXXXXXXX',
          description: 'IAM Access Key ID',
        },
        {
          key: 'secret_key',
          label: 'Secret Access Key',
          type: 'password',
          required: true,
          description: 'IAM Secret Access Key',
        },
        {
          key: 'cdn_url',
          label: 'CDN URL (Optional)',
          type: 'url',
          required: false,
          placeholder: 'https://cdn.example.com',
          description: 'CloudFront veya CDN URL',
        },
      ],
    },
    cloudinary: {
      name: 'Cloudinary',
      icon: 'image',
      description: 'Cloudinary ile medya yönetimi',
      docsUrl: 'https://cloudinary.com/console/',
      testable: false,
      fields: [
        {
          key: 'cloud_name',
          label: 'Cloud Name',
          type: 'text',
          required: true,
          description: 'Cloudinary cloud name',
        },
        {
          key: 'api_key',
          label: 'API Key',
          type: 'text',
          required: true,
          description: 'Cloudinary API Key',
        },
        {
          key: 'api_secret',
          label: 'API Secret',
          type: 'password',
          required: true,
          description: 'Cloudinary API Secret',
        },
      ],
    },
  },

  // ============================================
  // Live Streaming
  // ============================================
  streaming: {
    agora: {
      name: 'Agora',
      icon: 'video',
      description: 'Agora ile canlı yayın',
      docsUrl: 'https://console.agora.io/',
      testable: false,
      fields: [
        {
          key: 'app_id',
          label: 'App ID',
          type: 'text',
          required: true,
          description: 'Agora App ID',
        },
        {
          key: 'app_certificate',
          label: 'App Certificate',
          type: 'password',
          required: true,
          description: 'Agora App Certificate (token generation için)',
        },
        {
          key: 'customer_id',
          label: 'Customer ID (Optional)',
          type: 'text',
          required: false,
          description: 'REST API için Customer ID',
        },
        {
          key: 'customer_secret',
          label: 'Customer Secret (Optional)',
          type: 'password',
          required: false,
          description: 'REST API için Customer Secret',
        },
      ],
    },
  },

  // ============================================
  // AI Services
  // ============================================
  ai: {
    openai: {
      name: 'OpenAI',
      icon: '🤖',
      description: 'ChatGPT ve GPT modelleri ile AI özellikleri',
      docsUrl: 'https://platform.openai.com/',
      testable: true,
      fields: [
        {
          key: 'api_key',
          label: 'API Key',
          type: 'password',
          required: true,
          placeholder: 'sk-xxx',
          description: 'OpenAI API anahtarı',
        },
        {
          key: 'organization_id',
          label: 'Organization ID (Optional)',
          type: 'text',
          required: false,
          placeholder: 'org-xxx',
          description: 'OpenAI organizasyon ID',
        },
        {
          key: 'model',
          label: 'Default Model',
          type: 'text',
          required: false,
          placeholder: 'gpt-4o-mini',
          description: 'Varsayılan GPT modeli',
        },
      ],
    },
    elevenlabs: {
      name: 'ElevenLabs',
      icon: '🎙️',
      description: 'AI ile ses sentezi (Text-to-Speech)',
      docsUrl: 'https://elevenlabs.io/',
      testable: true,
      fields: [
        {
          key: 'api_key',
          label: 'API Key',
          type: 'password',
          required: true,
          description: 'ElevenLabs API anahtarı',
        },
        {
          key: 'voice_id',
          label: 'Default Voice ID',
          type: 'text',
          required: false,
          placeholder: '21m00Tcm4TlvDq8ikWAM',
          description: 'Varsayılan ses ID',
        },
        {
          key: 'model_id',
          label: 'Model ID',
          type: 'text',
          required: false,
          placeholder: 'eleven_multilingual_v2',
          description: 'TTS model ID',
        },
      ],
    },
    anthropic: {
      name: 'Anthropic (Claude)',
      icon: '🧠',
      description: 'Claude AI modelleri',
      docsUrl: 'https://console.anthropic.com/',
      testable: true,
      fields: [
        {
          key: 'api_key',
          label: 'API Key',
          type: 'password',
          required: true,
          placeholder: 'sk-ant-xxx',
          description: 'Anthropic API anahtarı',
        },
        {
          key: 'model',
          label: 'Default Model',
          type: 'text',
          required: false,
          placeholder: 'claude-3-5-sonnet-20241022',
          description: 'Varsayılan Claude modeli',
        },
      ],
    },
  },

  // ============================================
  // Monitoring
  // ============================================
  monitoring: {
    sentry: {
      name: 'Sentry',
      icon: 'alert-triangle',
      description: 'Sentry ile hata takibi',
      docsUrl: 'https://sentry.io/',
      testable: false,
      fields: [
        {
          key: 'dsn',
          label: 'DSN',
          type: 'text',
          required: true,
          placeholder: 'https://xxx@xxx.ingest.sentry.io/xxx',
          description: 'Sentry DSN URL',
        },
        {
          key: 'environment',
          label: 'Environment',
          type: 'text',
          required: false,
          placeholder: 'production',
          description: 'Environment tag',
        },
      ],
    },
    elasticsearch: {
      name: 'Elasticsearch',
      icon: 'search',
      description: 'Elasticsearch ile arama ve log',
      testable: true,
      fields: [
        {
          key: 'url',
          label: 'URL',
          type: 'url',
          required: true,
          placeholder: 'http://localhost:9200',
          description: 'Elasticsearch URL',
        },
        {
          key: 'username',
          label: 'Username (Optional)',
          type: 'text',
          required: false,
          description: 'Basic auth kullanıcı adı',
        },
        {
          key: 'password',
          label: 'Password (Optional)',
          type: 'password',
          required: false,
          description: 'Basic auth şifresi',
        },
        {
          key: 'index_prefix',
          label: 'Index Prefix',
          type: 'text',
          required: false,
          placeholder: 'yoga',
          description: 'Index ön eki',
        },
      ],
    },
  },
};

/**
 * Get category display name
 */
export const CATEGORY_NAMES: Record<IntegrationCategory, string> = {
  auth: 'Kimlik Doğrulama',
  notification: 'Push Bildirimler',
  sms: 'SMS',
  email: 'Email',
  payment: 'Ödeme',
  storage: 'Dosya Depolama',
  streaming: 'Canlı Yayın',
  monitoring: 'İzleme & Log',
  ai: 'Yapay Zeka',
};

/**
 * Get category icon
 */
export const CATEGORY_ICONS: Record<IntegrationCategory, string> = {
  auth: 'key',
  notification: 'bell',
  sms: 'smartphone',
  email: 'mail',
  payment: 'credit-card',
  storage: 'cloud',
  streaming: 'video',
  monitoring: 'activity',
  ai: 'cpu',
};
