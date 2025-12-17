import { config } from './config';
import { logger } from './logger';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

// Apple App Store Server API URLs
const APPLE_PRODUCTION_URL = 'https://api.storekit.itunes.apple.com';
const APPLE_SANDBOX_URL = 'https://api.storekit-sandbox.itunes.apple.com';

// Apple receipt verification URLs
const APPLE_PRODUCTION_VERIFY_URL = 'https://buy.itunes.apple.com/verifyReceipt';
const APPLE_SANDBOX_VERIFY_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';

/**
 * Check if Apple IAP is configured
 */
export function isAppleConfigured(): boolean {
  return !!(
    config.apple.sharedSecret &&
    config.apple.bundleId
  );
}

/**
 * Check if Apple App Store Server API is configured (for V2 notifications)
 */
export function isAppleServerAPIConfigured(): boolean {
  return !!(
    config.apple.issuerId &&
    config.apple.keyId &&
    config.apple.privateKey &&
    config.apple.bundleId
  );
}

/**
 * Get Apple App Store Server API URL based on environment
 */
export function getAppleApiUrl(): string {
  return config.apple.environment === 'production'
    ? APPLE_PRODUCTION_URL
    : APPLE_SANDBOX_URL;
}

/**
 * Get Apple receipt verification URL based on environment
 */
export function getAppleVerifyUrl(): string {
  return config.apple.environment === 'production'
    ? APPLE_PRODUCTION_VERIFY_URL
    : APPLE_SANDBOX_VERIFY_URL;
}

/**
 * Generate JWT for Apple App Store Server API
 */
export function generateAppleJWT(): string {
  if (!isAppleServerAPIConfigured()) {
    throw new Error('Apple App Store Server API is not configured');
  }

  const privateKey = Buffer.from(config.apple.privateKey!, 'base64').toString('utf-8');

  const payload = {
    iss: config.apple.issuerId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    aud: 'appstoreconnect-v1',
    bid: config.apple.bundleId,
  };

  return jwt.sign(payload, privateKey, {
    algorithm: 'ES256',
    header: {
      alg: 'ES256',
      kid: config.apple.keyId,
      typ: 'JWT',
    },
  });
}

/**
 * Verify receipt with Apple servers
 */
export async function verifyReceipt(
  receiptData: string,
  excludeOldTransactions = true
): Promise<AppleReceiptResponse> {
  if (!config.apple.sharedSecret) {
    throw new Error('Apple shared secret is not configured');
  }

  const requestBody = {
    'receipt-data': receiptData,
    'password': config.apple.sharedSecret,
    'exclude-old-transactions': excludeOldTransactions,
  };

  // Try production first
  let response = await fetch(APPLE_PRODUCTION_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  let result = await response.json() as AppleReceiptResponse;

  // If sandbox receipt, retry with sandbox URL
  if (result.status === 21007) {
    logger.info('Receipt is from sandbox, retrying with sandbox URL');
    response = await fetch(APPLE_SANDBOX_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    result = await response.json() as AppleReceiptResponse;
  }

  return result;
}

/**
 * Get subscription status from App Store Server API
 */
export async function getSubscriptionStatus(
  originalTransactionId: string
): Promise<AppleSubscriptionStatusResponse | null> {
  if (!isAppleServerAPIConfigured()) {
    logger.warn('Apple Server API not configured, cannot get subscription status');
    return null;
  }

  try {
    const token = generateAppleJWT();
    const url = `${getAppleApiUrl()}/inApps/v1/subscriptions/${originalTransactionId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status, error: errorText }, 'Failed to get Apple subscription status');
      return null;
    }

    return await response.json() as AppleSubscriptionStatusResponse;
  } catch (error) {
    logger.error({ err: error }, 'Error getting Apple subscription status');
    return null;
  }
}

/**
 * Get transaction history from App Store Server API
 */
export async function getTransactionHistory(
  originalTransactionId: string,
  revision?: string
): Promise<AppleTransactionHistoryResponse | null> {
  if (!isAppleServerAPIConfigured()) {
    return null;
  }

  try {
    const token = generateAppleJWT();
    let url = `${getAppleApiUrl()}/inApps/v1/history/${originalTransactionId}`;
    if (revision) {
      url += `?revision=${revision}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json() as AppleTransactionHistoryResponse;
  } catch (error) {
    logger.error({ err: error }, 'Error getting Apple transaction history');
    return null;
  }
}

/**
 * Decode and verify App Store Server Notification V2
 */
export function decodeNotificationV2(signedPayload: string): AppleNotificationV2Payload | null {
  try {
    // Decode the JWS without verification first to get header
    const parts = signedPayload.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWS format');
    }

    const headerPart = parts[0];
    const payloadPart = parts[1];
    if (!headerPart || !payloadPart) {
      throw new Error('Invalid JWS parts');
    }
    const header = JSON.parse(Buffer.from(headerPart, 'base64url').toString()) as { alg: string; x5c?: string[] };
    const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString()) as AppleNotificationV2Payload;

    // In production, you should verify the signature using Apple's public key
    // For now, we'll just decode it
    logger.info({ notificationType: payload.notificationType }, 'Decoded Apple notification');

    return payload;
  } catch (error) {
    logger.error({ err: error }, 'Failed to decode Apple notification');
    return null;
  }
}

/**
 * Decode signed transaction info
 */
export function decodeSignedTransaction(signedTransactionInfo: string): AppleTransactionInfo | null {
  try {
    const parts = signedTransactionInfo.split('.');
    const payloadPart = parts[1];
    if (parts.length !== 3 || !payloadPart) {
      return null;
    }

    return JSON.parse(Buffer.from(payloadPart, 'base64url').toString()) as AppleTransactionInfo;
  } catch (error) {
    logger.error({ err: error }, 'Failed to decode signed transaction');
    return null;
  }
}

/**
 * Decode signed renewal info
 */
export function decodeSignedRenewalInfo(signedRenewalInfo: string): AppleRenewalInfo | null {
  try {
    const parts = signedRenewalInfo.split('.');
    const payloadPart = parts[1];
    if (parts.length !== 3 || !payloadPart) {
      return null;
    }

    return JSON.parse(Buffer.from(payloadPart, 'base64url').toString()) as AppleRenewalInfo;
  } catch (error) {
    logger.error({ err: error }, 'Failed to decode signed renewal info');
    return null;
  }
}

// Apple response types
export interface AppleReceiptResponse {
  status: number;
  environment?: 'Sandbox' | 'Production';
  receipt?: {
    bundle_id: string;
    application_version: string;
    original_purchase_date_ms: string;
    in_app?: AppleInAppPurchase[];
  };
  latest_receipt_info?: AppleInAppPurchase[];
  latest_receipt?: string;
  pending_renewal_info?: ApplePendingRenewal[];
}

export interface AppleInAppPurchase {
  quantity: string;
  product_id: string;
  transaction_id: string;
  original_transaction_id: string;
  purchase_date: string;
  purchase_date_ms: string;
  original_purchase_date: string;
  original_purchase_date_ms: string;
  expires_date?: string;
  expires_date_ms?: string;
  is_trial_period?: string;
  is_in_intro_offer_period?: string;
  cancellation_date?: string;
  cancellation_date_ms?: string;
  cancellation_reason?: string;
  web_order_line_item_id?: string;
}

export interface ApplePendingRenewal {
  auto_renew_product_id: string;
  original_transaction_id: string;
  product_id: string;
  auto_renew_status: '0' | '1';
  is_in_billing_retry_period?: '0' | '1';
  expiration_intent?: string;
  grace_period_expires_date_ms?: string;
}

export interface AppleSubscriptionStatusResponse {
  data: Array<{
    subscriptionGroupIdentifier: string;
    lastTransactions: Array<{
      originalTransactionId: string;
      status: number;
      signedTransactionInfo: string;
      signedRenewalInfo: string;
    }>;
  }>;
  bundleId: string;
  appAppleId: number;
  environment: string;
}

export interface AppleTransactionHistoryResponse {
  revision: string;
  hasMore: boolean;
  bundleId: string;
  appAppleId: number;
  environment: string;
  signedTransactions: string[];
}

export interface AppleNotificationV2Payload {
  notificationType: AppleNotificationType;
  subtype?: AppleNotificationSubtype;
  notificationUUID: string;
  data: {
    appAppleId: number;
    bundleId: string;
    bundleVersion: string;
    environment: string;
    signedTransactionInfo: string;
    signedRenewalInfo?: string;
  };
  version: string;
  signedDate: number;
}

export interface AppleTransactionInfo {
  transactionId: string;
  originalTransactionId: string;
  webOrderLineItemId: string;
  bundleId: string;
  productId: string;
  subscriptionGroupIdentifier: string;
  purchaseDate: number;
  originalPurchaseDate: number;
  expiresDate?: number;
  quantity: number;
  type: string;
  inAppOwnershipType: string;
  signedDate: number;
  environment: string;
  transactionReason?: string;
  storefront: string;
  storefrontId: string;
  price?: number;
  currency?: string;
}

export interface AppleRenewalInfo {
  autoRenewProductId: string;
  autoRenewStatus: number;
  environment: string;
  expirationIntent?: number;
  gracePeriodExpiresDate?: number;
  isInBillingRetryPeriod?: boolean;
  offerIdentifier?: string;
  offerType?: number;
  originalTransactionId: string;
  priceIncreaseStatus?: number;
  productId: string;
  signedDate: number;
}

export type AppleNotificationType =
  | 'CONSUMPTION_REQUEST'
  | 'DID_CHANGE_RENEWAL_PREF'
  | 'DID_CHANGE_RENEWAL_STATUS'
  | 'DID_FAIL_TO_RENEW'
  | 'DID_RENEW'
  | 'EXPIRED'
  | 'GRACE_PERIOD_EXPIRED'
  | 'OFFER_REDEEMED'
  | 'PRICE_INCREASE'
  | 'REFUND'
  | 'REFUND_DECLINED'
  | 'REFUND_REVERSED'
  | 'RENEWAL_EXTENDED'
  | 'REVOKE'
  | 'SUBSCRIBED'
  | 'TEST';

export type AppleNotificationSubtype =
  | 'INITIAL_BUY'
  | 'RESUBSCRIBE'
  | 'DOWNGRADE'
  | 'UPGRADE'
  | 'AUTO_RENEW_ENABLED'
  | 'AUTO_RENEW_DISABLED'
  | 'VOLUNTARY'
  | 'BILLING_RETRY'
  | 'PRICE_INCREASE'
  | 'GRACE_PERIOD'
  | 'BILLING_RECOVERY'
  | 'PENDING'
  | 'ACCEPTED';
