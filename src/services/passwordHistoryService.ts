import { prisma } from '../utils/database';
import { comparePassword } from '../utils/password';
import { logger } from '../utils/logger';

const PASSWORD_HISTORY_COUNT = 5; // Remember last 5 passwords

/**
 * Check if a password was used before
 */
export async function isPasswordPreviouslyUsed(
  userId: string,
  newPassword: string
): Promise<boolean> {
  try {
    // Get recent password hashes
    const history = await prisma.password_history.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: PASSWORD_HISTORY_COUNT,
      select: { passwordHash: true },
    });

    // Check against each previous password
    for (const record of history) {
      const matches = await comparePassword(newPassword, record.passwordHash);
      if (matches) {
        logger.info({ userId }, 'Password reuse attempt detected');
        return true;
      }
    }

    return false;
  } catch (error) {
    logger.error({ err: error, userId }, 'Failed to check password history');
    // On error, allow the password change (fail-open for usability)
    return false;
  }
}

/**
 * Add current password to history before changing
 */
export async function addPasswordToHistory(
  userId: string,
  passwordHash: string
): Promise<void> {
  try {
    // Add new entry
    await prisma.password_history.create({
      data: {
        userId,
        passwordHash,
      },
    });

    // Clean up old entries (keep only last N)
    const oldEntries = await prisma.password_history.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: PASSWORD_HISTORY_COUNT,
      select: { id: true },
    });

    if (oldEntries.length > 0) {
      await prisma.password_history.deleteMany({
        where: {
          id: { in: oldEntries.map((e) => e.id) },
        },
      });
    }

    logger.debug({ userId }, 'Password added to history');
  } catch (error) {
    logger.error({ err: error, userId }, 'Failed to add password to history');
    // Don't fail the password change if history fails
  }
}

/**
 * Initialize password history for a new user (add their first password)
 */
export async function initializePasswordHistory(
  userId: string,
  passwordHash: string
): Promise<void> {
  try {
    await prisma.password_history.create({
      data: {
        userId,
        passwordHash,
      },
    });
  } catch (error) {
    logger.error({ err: error, userId }, 'Failed to initialize password history');
  }
}

/**
 * Clear password history (for account deletion)
 */
export async function clearPasswordHistory(userId: string): Promise<void> {
  try {
    await prisma.password_history.deleteMany({
      where: { userId },
    });
  } catch (error) {
    logger.error({ err: error, userId }, 'Failed to clear password history');
  }
}
