import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import crypto from 'crypto';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { encrypt, decrypt } from '../utils/encryption';

const APP_NAME = 'YogaApp';
const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_LENGTH = 8;

interface SetupResult {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

interface VerifyResult {
  success: boolean;
  message: string;
}

/**
 * Generate a new 2FA secret and QR code for setup
 */
export async function setup2FA(userId: string): Promise<SetupResult> {
  // Get user email for the QR code label
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Generate secret
  const secret = authenticator.generateSecret();

  // Generate OTP Auth URL
  const otpAuthUrl = authenticator.keyuri(user.email, APP_NAME, secret);

  // Generate QR code as data URL
  const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);

  // Generate backup codes
  const backupCodes = generateBackupCodes();

  // Store encrypted secret temporarily (not verified yet)
  // The secret will only be saved permanently after verification
  await prisma.users.update({
    where: { id: userId },
    data: {
      twoFactorSecret: encrypt(secret),
      twoFactorVerifiedAt: null, // Not verified yet
      twoFactorEnabled: false,
    },
  });

  // Store hashed backup codes
  await prisma.two_factor_backup_codes.deleteMany({
    where: { userId },
  });

  await prisma.two_factor_backup_codes.createMany({
    data: backupCodes.map((code) => ({
      userId,
      code: hashBackupCode(code),
    })),
  });

  logger.info({ userId }, '2FA setup initiated');

  return {
    secret,
    qrCodeUrl,
    backupCodes,
  };
}

/**
 * Verify 2FA token and enable 2FA
 */
export async function verify2FASetup(userId: string, token: string): Promise<VerifyResult> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  });

  if (!user || !user.twoFactorSecret) {
    return { success: false, message: '2FA setup not initiated' };
  }

  if (user.twoFactorEnabled) {
    return { success: false, message: '2FA is already enabled' };
  }

  const secret = decrypt(user.twoFactorSecret);
  const isValid = authenticator.verify({ token, secret });

  if (!isValid) {
    return { success: false, message: 'Invalid verification code' };
  }

  // Enable 2FA
  await prisma.users.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
      twoFactorVerifiedAt: new Date(),
    },
  });

  logger.info({ userId }, '2FA enabled successfully');

  return { success: true, message: '2FA has been enabled successfully' };
}

/**
 * Verify 2FA token during login
 */
export async function verify2FAToken(userId: string, token: string): Promise<VerifyResult> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  });

  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return { success: false, message: '2FA is not enabled' };
  }

  const secret = decrypt(user.twoFactorSecret);
  const isValid = authenticator.verify({ token, secret });

  if (isValid) {
    return { success: true, message: 'Verification successful' };
  }

  // Check backup codes
  const backupResult = await verifyBackupCode(userId, token);
  if (backupResult.success) {
    return backupResult;
  }

  return { success: false, message: 'Invalid verification code' };
}

/**
 * Verify a backup code
 */
async function verifyBackupCode(userId: string, code: string): Promise<VerifyResult> {
  const hashedCode = hashBackupCode(code.replace(/-/g, ''));

  const backupCode = await prisma.two_factor_backup_codes.findFirst({
    where: {
      userId,
      code: hashedCode,
      usedAt: null,
    },
  });

  if (!backupCode) {
    return { success: false, message: 'Invalid backup code' };
  }

  // Mark backup code as used
  await prisma.two_factor_backup_codes.update({
    where: { id: backupCode.id },
    data: { usedAt: new Date() },
  });

  logger.info({ userId }, 'Backup code used for 2FA');

  return { success: true, message: 'Backup code verified successfully' };
}

/**
 * Disable 2FA
 */
export async function disable2FA(userId: string, password: string): Promise<VerifyResult> {
  const { comparePassword } = await import('../utils/password');

  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { passwordHash: true, twoFactorEnabled: true },
  });

  if (!user) {
    return { success: false, message: 'User not found' };
  }

  if (!user.twoFactorEnabled) {
    return { success: false, message: '2FA is not enabled' };
  }

  const validPassword = await comparePassword(password, user.passwordHash);
  if (!validPassword) {
    return { success: false, message: 'Invalid password' };
  }

  // Disable 2FA
  await prisma.$transaction([
    prisma.users.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorVerifiedAt: null,
      },
    }),
    prisma.two_factor_backup_codes.deleteMany({
      where: { userId },
    }),
  ]);

  logger.info({ userId }, '2FA disabled');

  return { success: true, message: '2FA has been disabled' };
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(userId: string): Promise<string[]> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true },
  });

  if (!user?.twoFactorEnabled) {
    throw new Error('2FA is not enabled');
  }

  // Generate new backup codes
  const backupCodes = generateBackupCodes();

  // Replace old codes
  await prisma.$transaction([
    prisma.two_factor_backup_codes.deleteMany({
      where: { userId },
    }),
    prisma.two_factor_backup_codes.createMany({
      data: backupCodes.map((code) => ({
        userId,
        code: hashBackupCode(code),
      })),
    }),
  ]);

  logger.info({ userId }, 'Backup codes regenerated');

  return backupCodes;
}

/**
 * Check if user has 2FA enabled
 */
export async function is2FAEnabled(userId: string): Promise<boolean> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true },
  });

  return user?.twoFactorEnabled ?? false;
}

/**
 * Get remaining backup codes count
 */
export async function getRemainingBackupCodesCount(userId: string): Promise<number> {
  return prisma.two_factor_backup_codes.count({
    where: {
      userId,
      usedAt: null,
    },
  });
}

// Helper functions

function generateBackupCodes(): string[] {
  const codes: string[] = [];

  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    const code = crypto.randomBytes(BACKUP_CODE_LENGTH / 2).toString('hex').toUpperCase();
    // Format as XXXX-XXXX
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }

  return codes;
}

function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code.replace(/-/g, '')).digest('hex');
}
