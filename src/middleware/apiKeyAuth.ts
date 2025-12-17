import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { validateApiKey, hasPermission } from '../services/apiKeyService';

declare global {
  namespace Express {
    interface Request {
      apiKeyId?: string;
      apiKeyUserId?: string;
      apiKeyPermissions?: string[];
      apiKeyRateLimit?: number;
    }
  }
}

function extractApiKey(req: Request): string | null {
  // Check Authorization header (Bearer token format)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer yk_')) {
    return authHeader.substring(7); // Remove "Bearer " prefix
  }

  // Check X-API-Key header
  const xApiKey = req.headers['x-api-key'];
  if (xApiKey && typeof xApiKey === 'string' && xApiKey.startsWith('yk_')) {
    return xApiKey;
  }

  return null;
}

export async function apiKeyAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apiKey = extractApiKey(req);

  if (!apiKey) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'API key is required. Provide it via Authorization header (Bearer yk_...) or X-API-Key header.',
    });
    return;
  }

  try {
    const validation = await validateApiKey(apiKey);

    if (!validation.valid) {
      if (validation.expired) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'API key has expired.',
        });
        return;
      }

      if (validation.revoked) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'API key has been revoked.',
        });
        return;
      }

      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid API key.',
      });
      return;
    }

    // Attach API key info to request
    if (validation.keyId) req.apiKeyId = validation.keyId;
    if (validation.userId) req.apiKeyUserId = validation.userId;
    if (validation.permissions) req.apiKeyPermissions = validation.permissions;
    if (validation.rateLimit) req.apiKeyRateLimit = validation.rateLimit;

    logger.debug({
      keyId: validation.keyId,
      userId: validation.userId,
      path: req.path,
    }, 'API key authenticated');

    next();
  } catch (error) {
    logger.error({ error }, 'API key authentication error');
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error validating API key.',
    });
  }
}

export function requireApiKeyPermission(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userPermissions = req.apiKeyPermissions;

    if (!userPermissions) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'API key permissions not found.',
      });
      return;
    }

    // Check if user has ALL required permissions
    const hasAllPermissions = requiredPermissions.every((permission) =>
      hasPermission(userPermissions, permission)
    );

    if (!hasAllPermissions) {
      logger.warn({
        keyId: req.apiKeyId,
        requiredPermissions,
        userPermissions,
        path: req.path,
      }, 'API key permission denied');

      res.status(403).json({
        error: 'Forbidden',
        message: `API key does not have required permissions: ${requiredPermissions.join(', ')}`,
      });
      return;
    }

    next();
  };
}

export function requireApiKeyPermissionAny(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userPermissions = req.apiKeyPermissions;

    if (!userPermissions) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'API key permissions not found.',
      });
      return;
    }

    // Check if user has ANY of the required permissions
    const hasAnyPermission = requiredPermissions.some((permission) =>
      hasPermission(userPermissions, permission)
    );

    if (!hasAnyPermission) {
      logger.warn({
        keyId: req.apiKeyId,
        requiredPermissions,
        userPermissions,
        path: req.path,
      }, 'API key permission denied');

      res.status(403).json({
        error: 'Forbidden',
        message: `API key requires one of these permissions: ${requiredPermissions.join(', ')}`,
      });
      return;
    }

    next();
  };
}

// Optional API key auth - doesn't fail if no key provided
export async function optionalApiKeyAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apiKey = extractApiKey(req);

  if (!apiKey) {
    // No API key provided, continue without it
    next();
    return;
  }

  try {
    const validation = await validateApiKey(apiKey);

    if (validation.valid) {
      if (validation.keyId) req.apiKeyId = validation.keyId;
      if (validation.userId) req.apiKeyUserId = validation.userId;
      if (validation.permissions) req.apiKeyPermissions = validation.permissions;
      if (validation.rateLimit) req.apiKeyRateLimit = validation.rateLimit;
    }

    next();
  } catch (error) {
    logger.error({ error }, 'Optional API key validation error');
    // Continue without API key on error
    next();
  }
}
