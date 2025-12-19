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
  generateToken,
} = doubleCsrf({
  getSecret: () => csrfSecret,
  cookieName: config.CSRF_COOKIE_NAME,
  cookieOptions: {
    httpOnly: true,
    sameSite: config.cookie.sameSite,
    secure: config.cookie.secure,
    path: '/',
  },
  getTokenFromRequest: (req) => {
    // Check header first, then body
    return (req.headers[config.CSRF_HEADER_NAME.toLowerCase()] as string) ||
           (req.body?._csrf as string);
  },
});

// Enable CSRF in all environments (was only production before)
export const csrfProtection: RequestHandler = doubleCsrfProtection;

export const attachCsrfToken: RequestHandler = (req, res, next) => {
  try {
    const token = generateToken(req, res);
    res.setHeader(config.CSRF_HEADER_NAME, token);
  } catch {
    // Token generation may fail for some requests, that's ok
  }
  return next();
};

export const trustProxy = config.TRUST_PROXY;
