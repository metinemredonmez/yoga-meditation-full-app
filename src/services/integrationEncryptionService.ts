import crypto from 'crypto';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get encryption key from environment
 * Uses ENCRYPTION_KEY which should be 32 bytes (64 hex chars)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required for integration settings');
  }

  if (key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters');
  }

  // Use first 32 bytes if key is longer
  return Buffer.from(key.slice(0, 32), 'utf8');
}

/**
 * Encrypt sensitive integration settings
 * Returns format: iv:authTag:encryptedData (all hex encoded)
 */
export function encryptValue(plainText: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    logger.error({ err: error }, 'Failed to encrypt integration value');
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt sensitive integration settings
 * Expects format: iv:authTag:encryptedData (all hex encoded)
 */
export function decryptValue(encryptedText: string): string {
  try {
    const parts = encryptedText.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted format');
    }

    const ivHex = parts[0];
    const authTagHex = parts[1];
    const encrypted = parts[2];

    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error('Invalid encrypted format');
    }

    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    logger.error({ err: error }, 'Failed to decrypt integration value');
    throw new Error('Decryption failed');
  }
}

/**
 * Check if a value looks like it's already encrypted
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(':');
  if (parts.length !== 3) return false;

  // Check if all parts are valid hex
  return parts.every((part) => /^[0-9a-fA-F]+$/.test(part));
}

/**
 * Mask sensitive value for display (show only first/last few chars)
 */
export function maskValue(value: string, showChars: number = 4): string {
  if (!value || value.length <= showChars * 2) {
    return '••••••••';
  }

  const first = value.slice(0, showChars);
  const last = value.slice(-showChars);
  const maskLength = Math.min(value.length - showChars * 2, 8);

  return `${first}${'•'.repeat(maskLength)}${last}`;
}

export const integrationEncryption = {
  encrypt: encryptValue,
  decrypt: decryptValue,
  isEncrypted,
  maskValue,
};
