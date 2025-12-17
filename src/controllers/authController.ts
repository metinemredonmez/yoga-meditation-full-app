import { Request, Response } from 'express';
import { ZodError } from 'zod';
import {
  refreshTokenBodySchema,
  logoutBodySchema,
  logoutAllBodySchema,
  revokeSessionParamsSchema,
} from '../validation/authSchemas';
import {
  refreshTokens,
  revokeToken,
  revokeAllUserTokens,
  revokeSession,
  getUserSessions,
  hashToken,
} from '../services/tokenService';
import { logger } from '../utils/logger';

export async function handleRefreshToken(req: Request, res: Response) {
  try {
    const payload = refreshTokenBodySchema.parse(req.body);
    const userAgent = req.headers['user-agent'];
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket.remoteAddress;

    const result = await refreshTokens(payload.refreshToken, userAgent, ipAddress);

    if (!result.success) {
      const statusCode = result.securityAlert ? 401 : 401;
      return res.status(statusCode).json({
        error: result.error,
        ...(result.securityAlert && {
          securityAlert: true,
          message: 'All sessions have been terminated for security.',
        }),
      });
    }

    return res.json({
      accessToken: result.tokens!.accessToken,
      refreshToken: result.tokens!.refreshToken,
      expiresIn: result.tokens!.expiresIn,
      tokenType: 'Bearer',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to refresh token');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleLogout(req: Request, res: Response) {
  try {
    const payload = logoutBodySchema.parse(req.body);

    const success = await revokeToken(payload.refreshToken);

    if (!success) {
      return res.status(400).json({ error: 'Invalid or already revoked token' });
    }

    return res.json({ message: 'Successfully logged out' });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to logout');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleLogoutAll(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    logoutAllBodySchema.parse(req.body);

    const count = await revokeAllUserTokens(req.user.userId);

    return res.json({
      message: 'Successfully logged out from all devices',
      sessionsRevoked: count,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to logout all');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleGetSessions(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get current token hash if provided in header for marking current session
    const authHeader = req.headers.authorization;
    let currentTokenHash: string | undefined;

    if (req.body.currentRefreshToken) {
      currentTokenHash = hashToken(req.body.currentRefreshToken);
    }

    const sessions = await getUserSessions(req.user.userId, currentTokenHash);

    return res.json({
      sessions: sessions.map((s) => ({
        id: s.familyId, // Use familyId as session identifier
        userAgent: s.userAgent,
        ipAddress: s.ipAddress,
        createdAt: s.createdAt,
        isCurrent: s.isCurrentSession,
      })),
      count: sessions.length,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get sessions');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleRevokeSession(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const params = revokeSessionParamsSchema.parse(req.params);

    const success = await revokeSession(req.user.userId, params.sessionId);

    if (!success) {
      return res.status(404).json({ error: 'Session not found or already revoked' });
    }

    return res.json({ message: 'Session revoked successfully' });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to revoke session');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
