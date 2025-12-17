import crypto from 'crypto';

/**
 * Generate a random numeric OTP code
 * @param length - Length of the OTP code (default: 6)
 * @returns Numeric OTP string
 */
export function generateOtp(length = 6): string {
  // Generate random bytes and convert to decimal digits
  const max = Math.pow(10, length) - 1;
  const min = Math.pow(10, length - 1);

  // Use crypto for secure random number generation
  const randomBytes = crypto.randomBytes(4);
  const randomNumber = randomBytes.readUInt32BE(0);

  // Scale to our range
  const code = min + (randomNumber % (max - min + 1));

  return code.toString().padStart(length, '0');
}

/**
 * Hash an OTP code using SHA-256
 * @param code - The OTP code to hash
 * @returns SHA-256 hash of the code
 */
export function hashOtp(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Verify an OTP code against a hash
 * @param code - The OTP code to verify
 * @param hash - The stored hash to compare against
 * @returns true if the code matches the hash
 */
export function verifyOtpHash(code: string, hash: string): boolean {
  const codeHash = hashOtp(code);
  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(codeHash), Buffer.from(hash));
  } catch {
    return false;
  }
}

/**
 * Format phone number to E.164 format
 * Examples:
 *   - 5551234567 -> +905551234567 (assumes TR)
 *   - 05551234567 -> +905551234567
 *   - +905551234567 -> +905551234567
 *   - +15551234567 -> +15551234567 (US)
 * @param phoneNumber - Phone number to format
 * @param defaultCountryCode - Default country code (default: '90' for Turkey)
 * @returns E.164 formatted phone number
 */
export function formatPhoneNumber(phoneNumber: string, defaultCountryCode = '90'): string {
  // Remove all non-digit characters except leading +
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');

  // If already starts with +, return as is (assume already E.164)
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // Remove leading zeros
  cleaned = cleaned.replace(/^0+/, '');

  // If starts with country code, add +
  if (cleaned.startsWith(defaultCountryCode)) {
    return `+${cleaned}`;
  }

  // Otherwise, prepend default country code
  return `+${defaultCountryCode}${cleaned}`;
}

/**
 * Validate E.164 phone number format
 * @param phoneNumber - Phone number to validate
 * @returns true if valid E.164 format
 */
export function isValidE164(phoneNumber: string): boolean {
  // E.164 format: + followed by 1-15 digits
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
}

/**
 * Mask phone number for display (privacy)
 * @param phoneNumber - Phone number to mask
 * @returns Masked phone number (e.g., +90***1234)
 */
export function maskPhoneNumber(phoneNumber: string): string {
  if (phoneNumber.length < 8) {
    return phoneNumber.slice(0, 3) + '***';
  }

  const prefix = phoneNumber.slice(0, 3);
  const suffix = phoneNumber.slice(-4);
  const maskLength = phoneNumber.length - 7;
  const mask = '*'.repeat(maskLength);

  return `${prefix}${mask}${suffix}`;
}
