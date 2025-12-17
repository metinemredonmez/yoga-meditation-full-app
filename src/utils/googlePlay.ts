import { config } from './config';
import { logger } from './logger';
import { google } from 'googleapis';

// Singleton for Google API client
let androidPublisher: ReturnType<typeof google.androidpublisher> | null = null;

/**
 * Check if Google Play is configured
 */
export function isGoogleConfigured(): boolean {
  return !!(
    config.google.packageName &&
    config.google.serviceAccountEmail &&
    config.google.serviceAccountPrivateKey
  );
}

/**
 * Get Google Android Publisher client
 */
export async function getGooglePlayClient() {
  if (!isGoogleConfigured()) {
    throw new Error('Google Play configuration is missing');
  }

  if (androidPublisher) {
    return androidPublisher;
  }

  const privateKey = Buffer.from(
    config.google.serviceAccountPrivateKey!,
    'base64'
  ).toString('utf-8');

  const auth = new google.auth.JWT({
    email: config.google.serviceAccountEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });

  await auth.authorize();

  androidPublisher = google.androidpublisher({
    version: 'v3',
    auth,
  });

  logger.info('Google Play client initialized');
  return androidPublisher;
}

/**
 * Verify subscription purchase with Google Play
 */
export async function verifySubscription(
  subscriptionId: string,
  purchaseToken: string
): Promise<GoogleSubscriptionPurchase | null> {
  if (!isGoogleConfigured()) {
    throw new Error('Google Play is not configured');
  }

  try {
    const client = await getGooglePlayClient();
    const response = await client.purchases.subscriptions.get({
      packageName: config.google.packageName!,
      subscriptionId,
      token: purchaseToken,
    });

    return response.data as GoogleSubscriptionPurchase;
  } catch (error) {
    logger.error({ err: error, subscriptionId }, 'Failed to verify Google subscription');
    return null;
  }
}

/**
 * Verify one-time product purchase with Google Play
 */
export async function verifyProduct(
  productId: string,
  purchaseToken: string
): Promise<GoogleProductPurchase | null> {
  if (!isGoogleConfigured()) {
    throw new Error('Google Play is not configured');
  }

  try {
    const client = await getGooglePlayClient();
    const response = await client.purchases.products.get({
      packageName: config.google.packageName!,
      productId,
      token: purchaseToken,
    });

    return response.data as GoogleProductPurchase;
  } catch (error) {
    logger.error({ err: error, productId }, 'Failed to verify Google product purchase');
    return null;
  }
}

/**
 * Acknowledge a subscription purchase
 */
export async function acknowledgeSubscription(
  subscriptionId: string,
  purchaseToken: string
): Promise<boolean> {
  if (!isGoogleConfigured()) {
    return false;
  }

  try {
    const client = await getGooglePlayClient();
    await client.purchases.subscriptions.acknowledge({
      packageName: config.google.packageName!,
      subscriptionId,
      token: purchaseToken,
    });
    logger.info({ subscriptionId }, 'Google subscription acknowledged');
    return true;
  } catch (error) {
    logger.error({ err: error, subscriptionId }, 'Failed to acknowledge Google subscription');
    return false;
  }
}

/**
 * Acknowledge a product purchase
 */
export async function acknowledgeProduct(
  productId: string,
  purchaseToken: string
): Promise<boolean> {
  if (!isGoogleConfigured()) {
    return false;
  }

  try {
    const client = await getGooglePlayClient();
    await client.purchases.products.acknowledge({
      packageName: config.google.packageName!,
      productId,
      token: purchaseToken,
    });
    logger.info({ productId }, 'Google product acknowledged');
    return true;
  } catch (error) {
    logger.error({ err: error, productId }, 'Failed to acknowledge Google product');
    return false;
  }
}

/**
 * Cancel a subscription (revoke)
 */
export async function cancelSubscription(
  subscriptionId: string,
  purchaseToken: string
): Promise<boolean> {
  if (!isGoogleConfigured()) {
    return false;
  }

  try {
    const client = await getGooglePlayClient();
    await client.purchases.subscriptions.cancel({
      packageName: config.google.packageName!,
      subscriptionId,
      token: purchaseToken,
    });
    logger.info({ subscriptionId }, 'Google subscription cancelled');
    return true;
  } catch (error) {
    logger.error({ err: error, subscriptionId }, 'Failed to cancel Google subscription');
    return false;
  }
}

/**
 * Refund a subscription
 */
export async function refundSubscription(
  subscriptionId: string,
  purchaseToken: string
): Promise<boolean> {
  if (!isGoogleConfigured()) {
    return false;
  }

  try {
    const client = await getGooglePlayClient();
    await client.purchases.subscriptions.refund({
      packageName: config.google.packageName!,
      subscriptionId,
      token: purchaseToken,
    });
    logger.info({ subscriptionId }, 'Google subscription refunded');
    return true;
  } catch (error) {
    logger.error({ err: error, subscriptionId }, 'Failed to refund Google subscription');
    return false;
  }
}

/**
 * Defer a subscription billing
 */
export async function deferSubscription(
  subscriptionId: string,
  purchaseToken: string,
  expectedExpiryTimeMillis: string,
  desiredExpiryTimeMillis: string
): Promise<GoogleDeferralResponse | null> {
  if (!isGoogleConfigured()) {
    return null;
  }

  try {
    const client = await getGooglePlayClient();
    const response = await client.purchases.subscriptions.defer({
      packageName: config.google.packageName!,
      subscriptionId,
      token: purchaseToken,
      requestBody: {
        deferralInfo: {
          expectedExpiryTimeMillis,
          desiredExpiryTimeMillis,
        },
      },
    });
    logger.info({ subscriptionId }, 'Google subscription deferred');
    return response.data as GoogleDeferralResponse;
  } catch (error) {
    logger.error({ err: error, subscriptionId }, 'Failed to defer Google subscription');
    return null;
  }
}

/**
 * Parse Google Play Real-time Developer Notification
 */
export function parseRTDN(data: string): GoogleRTDN | null {
  try {
    const decoded = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
    return decoded as GoogleRTDN;
  } catch (error) {
    logger.error({ err: error }, 'Failed to parse Google RTDN');
    return null;
  }
}

/**
 * Get subscription status string
 */
export function getSubscriptionStatusString(
  paymentState: number | undefined,
  cancelReason: number | undefined,
  acknowledgementState: number | undefined
): GoogleSubscriptionStatus {
  if (cancelReason !== undefined) {
    switch (cancelReason) {
      case 0:
        return 'CANCELLED_BY_USER';
      case 1:
        return 'CANCELLED_BY_SYSTEM';
      case 2:
        return 'REPLACED_WITH_NEW_SUBSCRIPTION';
      case 3:
        return 'CANCELLED_BY_DEVELOPER';
      default:
        return 'CANCELLED';
    }
  }

  switch (paymentState) {
    case 0:
      return 'PAYMENT_PENDING';
    case 1:
      return 'PAYMENT_RECEIVED';
    case 2:
      return 'FREE_TRIAL';
    case 3:
      return 'PENDING_DEFERRED_UPGRADE_DOWNGRADE';
    default:
      return 'UNKNOWN';
  }
}

// Google Play types
export interface GoogleSubscriptionPurchase {
  kind: string;
  startTimeMillis?: string;
  expiryTimeMillis?: string;
  autoResumeTimeMillis?: string;
  autoRenewing?: boolean;
  priceCurrencyCode?: string;
  priceAmountMicros?: string;
  introductoryPriceInfo?: {
    introductoryPriceCurrencyCode: string;
    introductoryPriceAmountMicros: string;
    introductoryPricePeriod: string;
    introductoryPriceCycles: number;
  };
  countryCode?: string;
  developerPayload?: string;
  paymentState?: number;
  cancelReason?: number;
  userCancellationTimeMillis?: string;
  cancelSurveyResult?: {
    cancelSurveyReason: number;
    userInputCancelReason?: string;
  };
  orderId?: string;
  linkedPurchaseToken?: string;
  purchaseType?: number;
  acknowledgementState?: number;
  priceChange?: {
    newPrice: {
      priceMicros: string;
      currency: string;
    };
    state: number;
  };
  profileName?: string;
  emailAddress?: string;
  givenName?: string;
  familyName?: string;
  profileId?: string;
  externalAccountId?: string;
  obfuscatedExternalAccountId?: string;
  obfuscatedExternalProfileId?: string;
  promotionType?: number;
  promotionCode?: string;
}

export interface GoogleProductPurchase {
  kind: string;
  purchaseTimeMillis?: string;
  purchaseState?: number;
  consumptionState?: number;
  developerPayload?: string;
  orderId?: string;
  purchaseType?: number;
  acknowledgementState?: number;
  purchaseToken?: string;
  productId?: string;
  quantity?: number;
  obfuscatedExternalAccountId?: string;
  obfuscatedExternalProfileId?: string;
  regionCode?: string;
}

export interface GoogleDeferralResponse {
  newExpiryTimeMillis: string;
}

export interface GoogleRTDN {
  version: string;
  packageName: string;
  eventTimeMillis: string;
  subscriptionNotification?: GoogleSubscriptionNotification;
  oneTimeProductNotification?: GoogleOneTimeProductNotification;
  testNotification?: GoogleTestNotification;
}

export interface GoogleSubscriptionNotification {
  version: string;
  notificationType: GoogleSubscriptionNotificationType;
  purchaseToken: string;
  subscriptionId: string;
}

export interface GoogleOneTimeProductNotification {
  version: string;
  notificationType: GoogleOneTimeProductNotificationType;
  purchaseToken: string;
  sku: string;
}

export interface GoogleTestNotification {
  version: string;
}

export type GoogleSubscriptionNotificationType =
  | 1  // SUBSCRIPTION_RECOVERED
  | 2  // SUBSCRIPTION_RENEWED
  | 3  // SUBSCRIPTION_CANCELED
  | 4  // SUBSCRIPTION_PURCHASED
  | 5  // SUBSCRIPTION_ON_HOLD
  | 6  // SUBSCRIPTION_IN_GRACE_PERIOD
  | 7  // SUBSCRIPTION_RESTARTED
  | 8  // SUBSCRIPTION_PRICE_CHANGE_CONFIRMED
  | 9  // SUBSCRIPTION_DEFERRED
  | 10 // SUBSCRIPTION_PAUSED
  | 11 // SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED
  | 12 // SUBSCRIPTION_REVOKED
  | 13 // SUBSCRIPTION_EXPIRED
  | 20; // SUBSCRIPTION_PENDING_PURCHASE_CANCELED

export type GoogleOneTimeProductNotificationType =
  | 1  // ONE_TIME_PRODUCT_PURCHASED
  | 2; // ONE_TIME_PRODUCT_CANCELED

export type GoogleSubscriptionStatus =
  | 'PAYMENT_PENDING'
  | 'PAYMENT_RECEIVED'
  | 'FREE_TRIAL'
  | 'PENDING_DEFERRED_UPGRADE_DOWNGRADE'
  | 'CANCELLED_BY_USER'
  | 'CANCELLED_BY_SYSTEM'
  | 'REPLACED_WITH_NEW_SUBSCRIPTION'
  | 'CANCELLED_BY_DEVELOPER'
  | 'CANCELLED'
  | 'UNKNOWN';

export const GOOGLE_NOTIFICATION_TYPES = {
  SUBSCRIPTION_RECOVERED: 1,
  SUBSCRIPTION_RENEWED: 2,
  SUBSCRIPTION_CANCELED: 3,
  SUBSCRIPTION_PURCHASED: 4,
  SUBSCRIPTION_ON_HOLD: 5,
  SUBSCRIPTION_IN_GRACE_PERIOD: 6,
  SUBSCRIPTION_RESTARTED: 7,
  SUBSCRIPTION_PRICE_CHANGE_CONFIRMED: 8,
  SUBSCRIPTION_DEFERRED: 9,
  SUBSCRIPTION_PAUSED: 10,
  SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED: 11,
  SUBSCRIPTION_REVOKED: 12,
  SUBSCRIPTION_EXPIRED: 13,
  SUBSCRIPTION_PENDING_PURCHASE_CANCELED: 20,
} as const;
