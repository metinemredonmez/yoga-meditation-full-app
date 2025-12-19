import type { Request, Response, NextFunction, RequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import { doubleCsrf } from 'csrf-csrf';
import { config } from '../utils/config';

const allowedOrigins = new Set(config.CORS_ORIGINS);

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
});

// Parse allowed origins for CSP
const cspConnectSrc = ["'self'", ...Array.from(allowedOrigins)];

export const helmetMiddleware: RequestHandler = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // React needs unsafe-inline for some features
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: cspConnectSrc,
      mediaSrc: ["'self'", "https:", "blob:"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: config.NODE_ENV === 'production' ? [] : null,
    },
  },
  // Cross-Origin policies
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // Other security headers
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hsts: config.NODE_ENV === 'production' ? {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  } : false,
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
}) as unknown as RequestHandler;

export const hppMiddleware: RequestHandler = hpp() as unknown as RequestHandler;

export const cookieParserMiddleware: RequestHandler = cookieParser();

// CSRF Protection using csrf-csrf (double submit cookie pattern)
const csrfSecret = process.env.CSRF_SECRET || config.JWT_ACCESS_SECRET;

const {
  doubleCsrfProtection,
  generateCsrfToken,
} = doubleCsrf({
  getSecret: () => csrfSecret,
  getSessionIdentifier: (req) => (req as any).session?.id || req.ip || 'anonymous',
  cookieName: config.CSRF_COOKIE_NAME,
  cookieOptions: {
    httpOnly: true,
    sameSite: config.cookie.sameSite,
    secure: config.cookie.secure,
    path: '/',
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});

// Disable CSRF in development for easier testing
export const csrfProtection: RequestHandler = config.NODE_ENV === 'production'
  ? doubleCsrfProtection
  : ((_req, _res, next) => next());

export const attachCsrfToken: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = generateCsrfToken(req, res);
    res.setHeader(config.CSRF_HEADER_NAME, token);
  } catch {
    // Token generation may fail for some requests, that's ok
  }
  return next();
};

export const trustProxy = config.TRUST_PROXY;
