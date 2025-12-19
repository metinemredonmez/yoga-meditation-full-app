import crypto from 'crypto';
import { prisma } from '../utils/database';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  JWTPayload,
} from '../utils/jwt';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface SessionInfo {
  id: string;
  familyId: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  isCurrentSession: boolean;
}

export interface RefreshResult {
  success: boolean;
  tokens?: TokenPair;
  error?: string;
  securityAlert?: boolean;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateFamilyId(): string {
  return crypto.randomUUID();
}

function parseExpiresIn(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 30 * 24 * 60 * 60 * 1000; // default 30 days

  const value = parseInt(match[1]!, 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 30 * 24 * 60 * 60 * 1000;
  }
}

export async function createTokenPair(
  payload: JWTPayload,
  userAgent?: string,
  ipAddress?: string,
  existingFamilyId?: string,
): Promise<TokenPair> {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  const hashedToken = hashToken(refreshToken);
  const familyId = existingFamilyId || generateFamilyId();

  const refreshExpiresMs = parseExpiresIn(config.JWT_REFRESH_EXPIRES_IN);
  const expiresAt = new Date(Date.now() + refreshExpiresMs);

  // Enforce max sessions limit
  await enforceMaxSessions(payload.userId, familyId);

  // Store the refresh token
  await prisma.refresh_tokens.create({
    data: {
      userId: payload.userId,
      token: hashedToken,
      familyId,
      expiresAt,
      userAgent: userAgent ?? null,
      ipAddress: ipAddress ?? null,
    },
  });

  logger.info(
    { userId: payload.userId, familyId },
    'New refresh token created',
  );

  // Return access token expiry in seconds (for client)
  const accessExpiresMs = parseExpiresIn(config.JWT_ACCESS_EXPIRES_IN);
  const expiresIn = Math.floor(accessExpiresMs / 1000);

  return { accessToken, refreshToken, expiresIn };
}

async function enforceMaxSessions(
  userId: string,
  currentFamilyId: string,
): Promise<void> {
  const maxSessions = config.refreshToken.maxSessions;

  // Count active sessions (unique families)
  const activeFamilies = await prisma.refresh_tokens.groupBy({
    by: ['familyId'],
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    _count: true,
  });

  // Exclude current family from count
  const otherFamilies = activeFamilies.filter(
    (f) => f.familyId !== currentFamilyId,
  );

  if (otherFamilies.length >= maxSessions) {
    // Revoke oldest sessions to make room
    const familiesToRevoke = otherFamilies
      .slice(0, otherFamilies.length - maxSessions + 1)
      .map((f) => f.familyId);

    if (familiesToRevoke.length > 0) {
      await prisma.refresh_tokens.updateMany({
        where: {
          userId,
          familyId: { in: familiesToRevoke },
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
          revokedReason: 'max_sessions_exceeded',
        },
      });

      logger.info(
        { userId, revokedFamilies: familiesToRevoke.length },
        'Revoked old sessions due to max sessions limit',
      );
    }
  }
}

export async function refreshTokens(
  refreshToken: string,
  userAgent?: string,
  ipAddress?: string,
): Promise<RefreshResult> {
  try {
    // Verify the JWT signature and expiry
    const payload = verifyRefreshToken(refreshToken);
    const hashedToken = hashToken(refreshToken);

    // Find the token in database
    const storedToken = await prisma.refresh_tokens.findUnique({
      where: { token: hashedToken },
      include: { users: true },
    });

    if (!storedToken) {
      logger.warn({ userId: payload.userId }, 'Refresh token not found in database');
      return { success: false, error: 'Invalid refresh token' };
    }

    // Check if token has been revoked
    if (storedToken.revokedAt) {
      // TOKEN REUSE DETECTION
      if (config.refreshToken.reuseDetection) {
        logger.error(
          { userId: storedToken.userId, familyId: storedToken.familyId },
          'SECURITY ALERT: Revoked refresh token reuse detected!',
        );

        // Revoke all tokens in this family
        await revokeTokenFamily(storedToken.familyId, 'token_reuse_detected');

        return {
          success: false,
          error: 'Security violation detected. All sessions revoked.',
          securityAlert: true,
        };
      }

      return { success: false, error: 'Refresh token has been revoked' };
    }

    // Check expiry
    if (storedToken.expiresAt < new Date()) {
      return { success: false, error: 'Refresh token has expired' };
    }

    // TOKEN ROTATION
    if (config.refreshToken.rotationEnabled) {
      // Revoke current token
      await prisma.refresh_tokens.update({
        where: { id: storedToken.id },
        data: {
          revokedAt: new Date(),
          revokedReason: 'rotated',
        },
      });

      // Create new token pair with same family
      const newPayload: JWTPayload = {
        id: storedToken.userId,
        userId: storedToken.userId,
        email: storedToken.users.email,
        role: storedToken.users.role,
      };

      const tokens = await createTokenPair(
        newPayload,
        userAgent,
        ipAddress,
        storedToken.familyId,
      );

      // Link the new token to old one
      const newHashedToken = hashToken(tokens.refreshToken);
      await prisma.refresh_tokens.update({
        where: { token: hashedToken },
        data: { replacedByToken: newHashedToken },
      });

      logger.info(
        { userId: storedToken.userId, familyId: storedToken.familyId },
        'Refresh token rotated successfully',
      );

      return { success: true, tokens };
    }

    // No rotation - just issue new access token
    const newPayload: JWTPayload = {
      id: storedToken.userId,
      userId: storedToken.userId,
      email: storedToken.users.email,
      role: storedToken.users.role,
    };

    const accessToken = generateAccessToken(newPayload);
    const accessExpiresMs = parseExpiresIn(config.JWT_ACCESS_EXPIRES_IN);

    return {
      success: true,
      tokens: {
        accessToken,
        refreshToken, // Return same refresh token
        expiresIn: Math.floor(accessExpiresMs / 1000),
      },
    };
  } catch (error) {
    logger.error({ err: error }, 'Failed to refresh tokens');
    return { success: false, error: 'Invalid refresh token' };
  }
}

export async function revokeToken(refreshToken: string): Promise<boolean> {
  try {
    const hashedToken = hashToken(refreshToken);

    const result = await prisma.refresh_tokens.updateMany({
      where: {
        token: hashedToken,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokedReason: 'user_logout',
      },
    });

    return result.count > 0;
  } catch (error) {
    logger.error({ err: error }, 'Failed to revoke token');
    return false;
  }
}

export async function revokeTokenFamily(
  familyId: string,
  reason: string,
): Promise<number> {
  const result = await prisma.refresh_tokens.updateMany({
    where: {
      familyId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
      revokedReason: reason,
    },
  });

  logger.info({ familyId, count: result.count, reason }, 'Token family revoked');

  return result.count;
}

export async function revokeAllUserTokens(
  userId: string,
  reason = 'user_revoke_all',
): Promise<number> {
  const result = await prisma.refresh_tokens.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
      revokedReason: reason,
    },
  });

  logger.info({ userId, count: result.count }, 'All user tokens revoked');

  return result.count;
}

export async function revokeSession(
  userId: string,
  familyId: string,
): Promise<boolean> {
  const result = await prisma.refresh_tokens.updateMany({
    where: {
      userId,
      familyId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
      revokedReason: 'user_revoke_session',
    },
  });

  return result.count > 0;
}

export async function getUserSessions(
  userId: string,
  currentTokenHash?: string,
): Promise<SessionInfo[]> {
  // Get all active token families
  const tokens = await prisma.refresh_tokens.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      familyId: true,
      token: true,
      userAgent: true,
      ipAddress: true,
      createdAt: true,
    },
    distinct: ['familyId'],
  });

  return tokens.map((t) => ({
    id: t.id,
    familyId: t.familyId,
    userAgent: t.userAgent,
    ipAddress: t.ipAddress,
    createdAt: t.createdAt,
    isCurrentSession: currentTokenHash ? t.token === currentTokenHash : false,
  }));
}

export async function cleanupExpiredTokens(): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Delete tokens that are both expired and revoked more than 30 days ago
  const result = await prisma.refresh_tokens.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: thirtyDaysAgo } },
        {
          revokedAt: { lt: thirtyDaysAgo },
        },
      ],
    },
  });

  if (result.count > 0) {
    logger.info({ count: result.count }, 'Cleaned up expired refresh tokens');
  }

  return result.count;
}

export { hashToken };
