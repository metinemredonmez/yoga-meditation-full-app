import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;
const KEY_LENGTH = 32;

// ENCRYPTION_KEY must be set separately from JWT secrets
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required for data encryption');
}

if (ENCRYPTION_KEY.length < 32) {
  throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
}

/**
 * Derives a key from the password using PBKDF2
 */
function deriveKey(salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, KEY_LENGTH, 'sha512');
}

/**
 * Encrypts a string using AES-256-GCM
 * Returns: salt:iv:authTag:encrypted (all base64 encoded)
 */
export function encrypt(text: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // Combine all parts
  return [
    salt.toString('base64'),
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted,
  ].join(':');
}

/**
 * Decrypts a string encrypted with the encrypt function
 */
export function decrypt(encryptedData: string): string {
  const parts = encryptedData.split(':');

  if (parts.length !== 4) {
    throw new Error('Invalid encrypted data format');
  }

  const [saltB64, ivB64, authTagB64, encrypted] = parts;

  const salt = Buffer.from(saltB64, 'base64');
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const key = deriveKey(salt);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Hash a value (one-way, for comparison)
 */
export function hash(text: string): string {
  return crypto
    .createHash('sha256')
    .update(text + ENCRYPTION_KEY)
    .digest('hex');
}

/**
 * Generate a random token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}
