import { randomBytes, createHmac, createHash, timingSafeEqual } from 'crypto';
import { config } from './config';

/**
 * Generate a random webhook secret
 */
export function generateWebhookSecret(): string {
  return randomBytes(config.webhook.secretLength).toString('hex');
}

/**
 * Hash a secret for storage in database
 */
export function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

/**
 * Create HMAC-SHA256 signature for webhook payload
 * Format: t=timestamp,v1=signature
 */
export function createSignature(payload: string, secret: string, timestamp?: number): string {
  const ts = timestamp ?? Math.floor(Date.now() / 1000);
  const signaturePayload = `${ts}.${payload}`;
  const signature = createHmac('sha256', secret).update(signaturePayload).digest('hex');
  return `t=${ts},v1=${signature}`;
}

/**
 * Verify webhook signature
 */
export function verifySignature(
  payload: string,
  signature: string,
  secret: string,
  toleranceSeconds: number = 300
): { valid: boolean; error?: string } {
  try {
    // Parse signature header
    const parts = signature.split(',');
    if (parts.length !== 2) {
      return { valid: false, error: 'Invalid signature format' };
    }

    const timestampPart = parts[0];
    const signaturePart = parts[1];

    if (!timestampPart?.startsWith('t=') || !signaturePart?.startsWith('v1=')) {
      return { valid: false, error: 'Invalid signature format' };
    }

    const timestamp = parseInt(timestampPart.substring(2), 10);
    const receivedSignature = signaturePart.substring(3);

    if (isNaN(timestamp)) {
      return { valid: false, error: 'Invalid timestamp' };
    }

    // Check timestamp tolerance (replay attack prevention)
    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - timestamp) > toleranceSeconds) {
      return { valid: false, error: 'Signature timestamp expired' };
    }

    // Calculate expected signature
    const signaturePayload = `${timestamp}.${payload}`;
    const expectedSignature = createHmac('sha256', secret).update(signaturePayload).digest('hex');

    // Timing-safe comparison
    const receivedBuffer = Buffer.from(receivedSignature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (receivedBuffer.length !== expectedBuffer.length) {
      return { valid: false, error: 'Signature mismatch' };
    }

    const isValid = timingSafeEqual(receivedBuffer, expectedBuffer);
    if (isValid) {
      return { valid: true };
    }
    return { valid: false, error: 'Signature mismatch' };
  } catch (error) {
    return { valid: false, error: 'Signature verification failed' };
  }
}

/**
 * Generate a unique delivery ID
 */
export function generateDeliveryId(): string {
  return `del_${randomBytes(16).toString('hex')}`;
}

export const webhookCrypto = {
  generateWebhookSecret,
  hashSecret,
  createSignature,
  verifySignature,
  generateDeliveryId,
};
