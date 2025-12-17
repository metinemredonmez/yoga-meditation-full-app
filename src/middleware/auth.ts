import { Request, Response, NextFunction } from 'express';
import type { JWTPayload } from '../utils/jwt';
import { verifyAccessToken } from '../utils/jwt';
import { getAccessTokenFromCookies } from '../utils/cookies';

/**
 * Extract access token from request
 * Priority: 1. Authorization header, 2. HttpOnly cookie
 */
function extractAccessToken(req: Request): string | undefined {
  // First try Authorization header (for mobile apps and API clients)
  const authHeader = req.headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Then try HttpOnly cookie (for web clients)
  if (req.cookies) {
    return getAccessTokenFromCookies(req.cookies);
  }

  return undefined;
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const token = extractAccessToken(req);

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  return next();
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super Admin access required' });
  }

  return next();
}

export function requireRoles(...allowedRoles: JWTPayload['role'][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    return next();
  };
}

// Alias for backwards compatibility
export const authenticate = authenticateToken;
export const authorize = requireRoles;

// Optional authentication - doesn't require token but attaches user if present
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractAccessToken(req);

  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
    } catch (error) {
      // Token invalid, but we continue without user
    }
  }

  return next();
}

// Export AuthRequest type for controllers
export interface AuthRequest extends Request {
  user?: JWTPayload;
}
