import type { Request, Response, NextFunction, RequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';
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

export const helmetMiddleware: RequestHandler = helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}) as unknown as RequestHandler;

export const hppMiddleware: RequestHandler = hpp() as unknown as RequestHandler;

export const cookieParserMiddleware: RequestHandler = cookieParser();

const enableCsrf = config.NODE_ENV === 'production';

const csrfOptions = {
  cookie: {
    key: config.CSRF_COOKIE_NAME,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: config.SESSION_COOKIE_SECURE,
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
};

export const csrfProtection: RequestHandler = enableCsrf
  ? (csrf(csrfOptions) as unknown as RequestHandler)
  : (_req: Request, _res: Response, next: NextFunction) => next();

export const attachCsrfToken: RequestHandler = (req, res, next) => {
  if (!enableCsrf) {
    return next();
  }

  try {
    const token = req.csrfToken();
    res.cookie(config.CSRF_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.SESSION_COOKIE_SECURE,
    });
    res.setHeader(config.CSRF_HEADER_NAME, token);
  } catch (error) {
    // Token generation is only available for non-mutating requests.
  }

  return next();
};

export const trustProxy = config.TRUST_PROXY;
