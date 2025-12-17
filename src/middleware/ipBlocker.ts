import { Request, Response, NextFunction } from 'express';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { isIPBlocked } from '../services/rateLimiterService';

const TRUSTED_PROXIES = [
  '127.0.0.1',
  '::1',
  '10.0.0.0/8',
  '172.16.0.0/12',
  '192.168.0.0/16',
];

function isPrivateIP(ip: string): boolean {
  // Check if IP is in private range
  const parts = ip.split('.');
  if (parts.length !== 4) {
    return ip === '::1' || ip === '127.0.0.1';
  }

  const first = parseInt(parts[0] ?? '0', 10);
  const second = parseInt(parts[1] ?? '0', 10);

  // 10.0.0.0/8
  if (first === 10) return true;
  // 172.16.0.0/12
  if (first === 172 && second >= 16 && second <= 31) return true;
  // 192.168.0.0/16
  if (first === 192 && second === 168) return true;
  // 127.0.0.0/8 (localhost)
  if (first === 127) return true;

  return false;
}

function getClientIP(req: Request): string {
  if (config.rateLimitConfig.trustProxy) {
    // X-Forwarded-For header can contain multiple IPs
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const rawIps = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor;

      // Get the first non-trusted proxy IP (leftmost is the original client)
      const ipList = rawIps?.split(',') ?? [];
      for (const ip of ipList) {
        const trimmedIP = ip.trim();
        // Skip private IPs (trusted proxies)
        if (!isPrivateIP(trimmedIP)) {
          return trimmedIP;
        }
      }
      // If all IPs are private, use the first one
      const firstIp = ipList[0];
      if (firstIp) {
        return firstIp.trim();
      }
    }

    // X-Real-IP header (set by nginx)
    const realIP = req.headers['x-real-ip'];
    if (realIP && typeof realIP === 'string') {
      return realIP.trim();
    }

    // CF-Connecting-IP header (Cloudflare)
    const cfIP = req.headers['cf-connecting-ip'];
    if (cfIP && typeof cfIP === 'string') {
      return cfIP.trim();
    }

    // True-Client-IP header (Akamai, Cloudflare Enterprise)
    const trueClientIP = req.headers['true-client-ip'];
    if (trueClientIP && typeof trueClientIP === 'string') {
      return trueClientIP.trim();
    }
  }

  return req.ip ?? req.socket.remoteAddress ?? 'unknown';
}

export async function ipBlockerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const clientIP = getClientIP(req);

  // Skip blocking for localhost/private IPs in development
  if (config.NODE_ENV === 'development' && isPrivateIP(clientIP)) {
    next();
    return;
  }

  try {
    const blocked = await isIPBlocked(clientIP);

    if (blocked) {
      logger.warn({ ip: clientIP, path: req.path }, 'Blocked IP attempted access');

      res.status(403).json({
        error: 'Forbidden',
        message: 'Your IP address has been blocked.',
      });
      return;
    }

    // Store client IP for later use
    (req as any).clientIP = clientIP;

    next();
  } catch (error) {
    logger.error({ error, ip: clientIP }, 'IP blocker middleware error');
    // Allow request on error to prevent blocking legitimate users
    next();
  }
}

// Export helper function for other middlewares
export { getClientIP };
