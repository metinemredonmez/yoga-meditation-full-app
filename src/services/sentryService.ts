import * as Sentry from '@sentry/node';
import { Express, Request, Response, NextFunction } from 'express';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

// ============================================
// Sentry Configuration
// ============================================

let isInitialized = false;

export function initializeSentry(app?: Express): void {
  if (isInitialized) {
    return;
  }

  const dsn = config.sentry?.dsn;

  if (!dsn) {
    logger.warn('Sentry DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: config.NODE_ENV,
    release: config.sentry?.release || `yoga-app@${process.env.npm_package_version || '1.0.0'}`,

    // Performance monitoring
    tracesSampleRate: config.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Profiling
    profilesSampleRate: config.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Integrations
    integrations: [
      // Auto-instrument HTTP requests
      Sentry.httpIntegration(),
      // Express middleware integration
      ...(app ? [Sentry.expressIntegration()] : []),
      // Postgres/Prisma integration
      Sentry.prismaIntegration(),
    ],

    // Filter sensitive data
    beforeSend(event, hint) {
      // Filter out sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-api-key'];
      }

      // Filter out sensitive body data
      if (event.request?.data) {
        const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
        for (const field of sensitiveFields) {
          if (typeof event.request.data === 'object' && event.request.data !== null && field in event.request.data) {
            (event.request.data as Record<string, unknown>)[field] = '[REDACTED]';
          }
        }
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      'ECONNRESET',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'Network request failed',
      'AbortError',
      'Request aborted',
      /^4\d\d$/, // 4xx errors
    ],

    // Additional tags
    initialScope: {
      tags: {
        service: 'yoga-app-backend',
        nodeVersion: process.version,
      },
    },
  });

  isInitialized = true;
  logger.info({ environment: config.NODE_ENV }, 'Sentry initialized');
}

// ============================================
// Express Middleware
// ============================================

export function sentryRequestHandler() {
  // In newer Sentry SDK, request handling is automatic via expressIntegration
  // This is a passthrough middleware for compatibility
  return (_req: Request, _res: Response, next: NextFunction) => next();
}

export function sentryTracingHandler() {
  // In newer Sentry SDK, tracing is automatic via expressIntegration
  // This is a passthrough middleware for compatibility
  return (_req: Request, _res: Response, next: NextFunction) => next();
}

export function sentryErrorHandler() {
  return Sentry.expressErrorHandler({
    shouldHandleError(error: any) {
      // Capture all 5xx errors and some 4xx errors
      if (error.status) {
        return error.status >= 500 || error.status === 429;
      }
      return true;
    },
  });
}

// ============================================
// Error Capturing
// ============================================

export function captureException(
  error: Error,
  context?: {
    user?: { id: string; email?: string };
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    level?: Sentry.SeverityLevel;
  },
): string {
  if (!isInitialized) {
    logger.error({ error }, 'Error captured but Sentry not initialized');
    return '';
  }

  return Sentry.withScope((scope) => {
    if (context?.user) {
      scope.setUser({
        id: context.user.id,
        email: context.user.email,
      });
    }

    if (context?.tags) {
      for (const [key, value] of Object.entries(context.tags)) {
        scope.setTag(key, value);
      }
    }

    if (context?.extra) {
      for (const [key, value] of Object.entries(context.extra)) {
        scope.setExtra(key, value);
      }
    }

    if (context?.level) {
      scope.setLevel(context.level);
    }

    return Sentry.captureException(error);
  });
}

export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  },
): string {
  if (!isInitialized) {
    logger.info({ message }, 'Message captured but Sentry not initialized');
    return '';
  }

  return Sentry.withScope((scope) => {
    if (context?.tags) {
      for (const [key, value] of Object.entries(context.tags)) {
        scope.setTag(key, value);
      }
    }

    if (context?.extra) {
      for (const [key, value] of Object.entries(context.extra)) {
        scope.setExtra(key, value);
      }
    }

    return Sentry.captureMessage(message, level);
  });
}

// ============================================
// User Context
// ============================================

export function setUser(user: {
  id: string;
  email?: string;
  username?: string;
  role?: string;
}): void {
  if (!isInitialized) return;

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  });
}

export function clearUser(): void {
  if (!isInitialized) return;
  Sentry.setUser(null);
}

// ============================================
// Breadcrumbs
// ============================================

export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>,
  level: Sentry.SeverityLevel = 'info',
): void {
  if (!isInitialized) return;

  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level,
    timestamp: Date.now() / 1000,
  });
}

// ============================================
// Transactions & Spans
// ============================================

export function startTransaction(
  name: string,
  op: string,
  data?: Record<string, any>,
): Sentry.Span | undefined {
  if (!isInitialized) return undefined;

  return Sentry.startInactiveSpan({
    name,
    op,
    attributes: data,
  });
}

export function startSpan<T>(
  name: string,
  op: string,
  callback: () => T,
): T {
  if (!isInitialized) {
    return callback();
  }

  return Sentry.startSpan(
    { name, op },
    callback,
  );
}

// ============================================
// Tags & Context
// ============================================

export function setTag(key: string, value: string): void {
  if (!isInitialized) return;
  Sentry.setTag(key, value);
}

export function setTags(tags: Record<string, string>): void {
  if (!isInitialized) return;
  Sentry.setTags(tags);
}

export function setExtra(key: string, value: any): void {
  if (!isInitialized) return;
  Sentry.setExtra(key, value);
}

export function setContext(name: string, context: Record<string, any>): void {
  if (!isInitialized) return;
  Sentry.setContext(name, context);
}

// ============================================
// Express Middleware for User Context
// ============================================

export function sentryUserMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    if ((req as any).user) {
      setUser({
        id: (req as any).user.userId,
        email: (req as any).user.email,
        role: (req as any).user.role,
      });
    }
    next();
  };
}

// ============================================
// Async Error Wrapper
// ============================================

export function wrapAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureException(error as Error);
      throw error;
    }
  }) as T;
}

// ============================================
// Health Check
// ============================================

export function isSentryInitialized(): boolean {
  return isInitialized;
}

// ============================================
// Flush & Close
// ============================================

export async function flushSentry(timeout: number = 2000): Promise<boolean> {
  if (!isInitialized) return true;
  return Sentry.flush(timeout);
}

export async function closeSentry(timeout: number = 2000): Promise<boolean> {
  if (!isInitialized) return true;
  return Sentry.close(timeout);
}
