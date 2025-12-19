import crypto from 'crypto';
import { prisma } from '../utils/database';
import { hashPassword } from '../utils/password';
import { sendPasswordResetEmail } from './emailService';
import { logger } from '../utils/logger';
import { isPasswordPreviouslyUsed, addPasswordToHistory } from './passwordHistoryService';

const TOKEN_EXPIRY_HOURS = 1;
const TOKEN_BYTES = 32;

function generateSecureToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export interface RequestResetResult {
  success: boolean;
  message: string;
}

export interface ResetPasswordResult {
  success: boolean;
  message: string;
}

export async function requestPasswordReset(email: string): Promise<RequestResetResult> {
  const user = await prisma.users.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, email: true, firstName: true },
  });

  // Always return success to prevent email enumeration
  if (!user) {
    logger.info({ email }, 'Password reset requested for non-existent email');
    return {
      success: true,
      message: 'If an account exists with this email, a reset link has been sent.',
    };
  }

  // Invalidate any existing tokens for this user
  await prisma.password_reset_tokens.updateMany({
    where: {
      userId: user.id,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: {
      expiresAt: new Date(), // Expire immediately
    },
  });

  // Generate new token
  const rawToken = generateSecureToken();
  const hashedToken = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.password_reset_tokens.create({
    data: {
      userId: user.id,
      token: hashedToken,
      expiresAt,
    },
  });

  // Build reset URL (frontend should handle this)
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${rawToken}`;

  // Send email using the template helper
  const emailResult = await sendPasswordResetEmail(
    user.email,
    user.firstName || '',
    resetUrl,
    TOKEN_EXPIRY_HOURS,
  );

  logger.info(
    { userId: user.id, emailDelivered: emailResult.delivered },
    'Password reset email sent',
  );

  return {
    success: true,
    message: 'If an account exists with this email, a reset link has been sent.',
  };
}

export async function validateResetToken(token: string): Promise<{ valid: boolean; userId?: string }> {
  const hashedToken = hashToken(token);

  const resetToken = await prisma.password_reset_tokens.findUnique({
    where: { token: hashedToken },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      usedAt: true,
    },
  });

  if (!resetToken) {
    return { valid: false };
  }

  if (resetToken.usedAt) {
    return { valid: false };
  }

  if (resetToken.expiresAt < new Date()) {
    return { valid: false };
  }

  return { valid: true, userId: resetToken.userId };
}

export async function resetPassword(token: string, newPassword: string): Promise<ResetPasswordResult> {
  const validation = await validateResetToken(token);

  if (!validation.valid || !validation.userId) {
    return {
      success: false,
      message: 'Invalid or expired reset token.',
    };
  }

  // Check password history - prevent reuse of last 5 passwords
  const wasUsedBefore = await isPasswordPreviouslyUsed(validation.userId, newPassword);
  if (wasUsedBefore) {
    return {
      success: false,
      message: 'You cannot reuse any of your last 5 passwords. Please choose a different password.',
    };
  }

  // Get current password hash for history
  const user = await prisma.users.findUnique({
    where: { id: validation.userId },
    select: { passwordHash: true },
  });

  const hashedToken = hashToken(token);
  const hashedPassword = await hashPassword(newPassword);

  // Add current password to history before changing
  if (user) {
    await addPasswordToHistory(validation.userId, user.passwordHash);
  }

  // Use transaction to ensure atomicity
  await prisma.$transaction([
    // Update user password
    prisma.users.update({
      where: { id: validation.userId },
      data: { passwordHash: hashedPassword },
    }),
    // Mark token as used
    prisma.password_reset_tokens.update({
      where: { token: hashedToken },
      data: { usedAt: new Date() },
    }),
  ]);

  logger.info({ userId: validation.userId }, 'Password reset completed');

  return {
    success: true,
    message: 'Password has been reset successfully.',
  };
}

// Cleanup expired tokens (can be run as a cron job)
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.password_reset_tokens.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { usedAt: { not: null } },
      ],
    },
  });

  logger.info({ deletedCount: result.count }, 'Cleaned up expired password reset tokens');
  return result.count;
}
