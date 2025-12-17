import client, {
  Counter,
  Histogram,
  Gauge,
  Registry,
  collectDefaultMetrics,
} from 'prom-client';
import { Request, Response, NextFunction } from 'express';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

// ============================================
// Metrics Registry
// ============================================

const register = new Registry();

// Add default metrics (CPU, memory, etc.)
collectDefaultMetrics({
  register,
  prefix: 'yoga_app_',
});

// ============================================
// Custom Metrics
// ============================================

// HTTP Request Metrics
export const httpRequestsTotal = new Counter({
  name: 'yoga_app_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status_code'],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: 'yoga_app_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status_code'],
  buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestSize = new Histogram({
  name: 'yoga_app_http_request_size_bytes',
  help: 'HTTP request size in bytes',
  labelNames: ['method', 'path'],
  buckets: [100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
  registers: [register],
});

export const httpResponseSize = new Histogram({
  name: 'yoga_app_http_response_size_bytes',
  help: 'HTTP response size in bytes',
  labelNames: ['method', 'path'],
  buckets: [100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
  registers: [register],
});

// Active Connections
export const activeConnections = new Gauge({
  name: 'yoga_app_active_connections',
  help: 'Number of active connections',
  registers: [register],
});

// WebSocket Metrics
export const websocketConnectionsTotal = new Gauge({
  name: 'yoga_app_websocket_connections_total',
  help: 'Total number of active WebSocket connections',
  registers: [register],
});

export const websocketMessagesTotal = new Counter({
  name: 'yoga_app_websocket_messages_total',
  help: 'Total number of WebSocket messages',
  labelNames: ['type', 'direction'],
  registers: [register],
});

// Database Metrics
export const databaseQueryDuration = new Histogram({
  name: 'yoga_app_database_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

export const databaseConnectionsActive = new Gauge({
  name: 'yoga_app_database_connections_active',
  help: 'Number of active database connections',
  registers: [register],
});

export const databaseQueryErrors = new Counter({
  name: 'yoga_app_database_query_errors_total',
  help: 'Total number of database query errors',
  labelNames: ['operation', 'table', 'error_type'],
  registers: [register],
});

// Cache Metrics (Redis)
export const cacheHits = new Counter({
  name: 'yoga_app_cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
  registers: [register],
});

export const cacheMisses = new Counter({
  name: 'yoga_app_cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type'],
  registers: [register],
});

export const cacheOperationDuration = new Histogram({
  name: 'yoga_app_cache_operation_duration_seconds',
  help: 'Cache operation duration in seconds',
  labelNames: ['operation', 'cache_type'],
  buckets: [0.0001, 0.0005, 0.001, 0.005, 0.01, 0.025, 0.05, 0.1],
  registers: [register],
});

// Authentication Metrics
export const authLoginAttempts = new Counter({
  name: 'yoga_app_auth_login_attempts_total',
  help: 'Total number of login attempts',
  labelNames: ['status', 'provider'],
  registers: [register],
});

export const authTokensIssued = new Counter({
  name: 'yoga_app_auth_tokens_issued_total',
  help: 'Total number of tokens issued',
  labelNames: ['type'],
  registers: [register],
});

export const authActiveUsers = new Gauge({
  name: 'yoga_app_auth_active_users',
  help: 'Number of currently active users',
  registers: [register],
});

// Business Metrics
export const subscriptionsActive = new Gauge({
  name: 'yoga_app_subscriptions_active',
  help: 'Number of active subscriptions',
  labelNames: ['plan', 'status'],
  registers: [register],
});

export const paymentsTotal = new Counter({
  name: 'yoga_app_payments_total',
  help: 'Total number of payments processed',
  labelNames: ['status', 'provider', 'type'],
  registers: [register],
});

export const revenueTotal = new Counter({
  name: 'yoga_app_revenue_total',
  help: 'Total revenue in cents',
  labelNames: ['plan', 'provider'],
  registers: [register],
});

// Live Stream Metrics
export const liveStreamsActive = new Gauge({
  name: 'yoga_app_live_streams_active',
  help: 'Number of currently active live streams',
  registers: [register],
});

export const liveStreamParticipants = new Gauge({
  name: 'yoga_app_live_stream_participants',
  help: 'Total participants in active live streams',
  labelNames: ['stream_id'],
  registers: [register],
});

export const liveStreamDuration = new Histogram({
  name: 'yoga_app_live_stream_duration_seconds',
  help: 'Live stream duration in seconds',
  buckets: [300, 600, 900, 1800, 3600, 5400, 7200],
  registers: [register],
});

// Message Queue Metrics
export const messageQueuePublished = new Counter({
  name: 'yoga_app_mq_messages_published_total',
  help: 'Total messages published to queue',
  labelNames: ['queue', 'exchange'],
  registers: [register],
});

export const messageQueueConsumed = new Counter({
  name: 'yoga_app_mq_messages_consumed_total',
  help: 'Total messages consumed from queue',
  labelNames: ['queue', 'status'],
  registers: [register],
});

export const messageQueueDepth = new Gauge({
  name: 'yoga_app_mq_queue_depth',
  help: 'Current depth of message queue',
  labelNames: ['queue'],
  registers: [register],
});

// External API Metrics
export const externalApiCalls = new Counter({
  name: 'yoga_app_external_api_calls_total',
  help: 'Total external API calls',
  labelNames: ['service', 'endpoint', 'status'],
  registers: [register],
});

export const externalApiDuration = new Histogram({
  name: 'yoga_app_external_api_duration_seconds',
  help: 'External API call duration',
  labelNames: ['service', 'endpoint'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

// Error Metrics
export const errorsTotal = new Counter({
  name: 'yoga_app_errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'code', 'path'],
  registers: [register],
});

// ============================================
// Express Middleware
// ============================================

export function metricsMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = process.hrtime.bigint();
    const requestSize = parseInt(req.get('content-length') || '0', 10);

    // Increment active connections
    activeConnections.inc();

    // Record request size
    httpRequestSize.observe(
      { method: req.method, path: normalizePath(req.path) },
      requestSize,
    );

    // Track response
    res.on('finish', () => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1e9; // Convert to seconds
      const path = normalizePath(req.path);
      const statusCode = res.statusCode.toString();

      // Record metrics
      httpRequestsTotal.inc({
        method: req.method,
        path,
        status_code: statusCode,
      });

      httpRequestDuration.observe(
        { method: req.method, path, status_code: statusCode },
        duration,
      );

      const responseSize = parseInt(res.get('content-length') || '0', 10);
      httpResponseSize.observe(
        { method: req.method, path },
        responseSize,
      );

      // Decrement active connections
      activeConnections.dec();

      // Track errors
      if (res.statusCode >= 400) {
        errorsTotal.inc({
          type: res.statusCode >= 500 ? 'server' : 'client',
          code: statusCode,
          path,
        });
      }
    });

    next();
  };
}

// Normalize path to avoid high cardinality
function normalizePath(path: string): string {
  // Replace UUIDs
  path = path.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    ':id',
  );

  // Replace numeric IDs
  path = path.replace(/\/\d+/g, '/:id');

  // Limit path depth
  const parts = path.split('/').slice(0, 5);
  return parts.join('/') || '/';
}

// ============================================
// Metrics Endpoint Handler
// ============================================

export async function getMetrics(): Promise<string> {
  return register.metrics();
}

export function getContentType(): string {
  return register.contentType;
}

export function metricsHandler() {
  return async (_req: Request, res: Response) => {
    try {
      res.set('Content-Type', getContentType());
      res.send(await getMetrics());
    } catch (error) {
      logger.error({ error }, 'Failed to collect metrics');
      res.status(500).send('Error collecting metrics');
    }
  };
}

// ============================================
// Helper Functions
// ============================================

export function recordDatabaseQuery(
  operation: string,
  table: string,
  duration: number,
): void {
  databaseQueryDuration.observe({ operation, table }, duration);
}

export function recordDatabaseError(
  operation: string,
  table: string,
  errorType: string,
): void {
  databaseQueryErrors.inc({ operation, table, error_type: errorType });
}

export function recordCacheHit(cacheType: string = 'redis'): void {
  cacheHits.inc({ cache_type: cacheType });
}

export function recordCacheMiss(cacheType: string = 'redis'): void {
  cacheMisses.inc({ cache_type: cacheType });
}

export function recordCacheOperation(
  operation: string,
  duration: number,
  cacheType: string = 'redis',
): void {
  cacheOperationDuration.observe({ operation, cache_type: cacheType }, duration);
}

export function recordLogin(status: 'success' | 'failure', provider: string = 'email'): void {
  authLoginAttempts.inc({ status, provider });
}

export function recordTokenIssued(type: string = 'access'): void {
  authTokensIssued.inc({ type });
}

export function recordPayment(
  status: 'success' | 'failure' | 'refunded',
  provider: string,
  type: string,
  amount?: number,
): void {
  paymentsTotal.inc({ status, provider, type });
  if (status === 'success' && amount) {
    revenueTotal.inc({ plan: type, provider }, amount);
  }
}

export function recordExternalApiCall(
  service: string,
  endpoint: string,
  status: 'success' | 'failure',
  duration: number,
): void {
  externalApiCalls.inc({ service, endpoint, status });
  externalApiDuration.observe({ service, endpoint }, duration);
}

export function recordWebSocketMessage(
  type: string,
  direction: 'inbound' | 'outbound',
): void {
  websocketMessagesTotal.inc({ type, direction });
}

export function setWebSocketConnections(count: number): void {
  websocketConnectionsTotal.set(count);
}

export function setActiveLiveStreams(count: number): void {
  liveStreamsActive.set(count);
}

export function setStreamParticipants(streamId: string, count: number): void {
  liveStreamParticipants.set({ stream_id: streamId }, count);
}

export function recordMessagePublished(queue: string, exchange?: string): void {
  messageQueuePublished.inc({ queue, exchange: exchange || 'direct' });
}

export function recordMessageConsumed(queue: string, status: 'success' | 'failure'): void {
  messageQueueConsumed.inc({ queue, status });
}

export function setQueueDepth(queue: string, depth: number): void {
  messageQueueDepth.set({ queue }, depth);
}

// ============================================
// Subscription Metrics Update
// ============================================

export function updateSubscriptionMetrics(
  plan: string,
  status: string,
  count: number,
): void {
  subscriptionsActive.set({ plan, status }, count);
}

// ============================================
// Health Metrics
// ============================================

export const healthCheckStatus = new Gauge({
  name: 'yoga_app_health_check_status',
  help: 'Health check status (1 = healthy, 0 = unhealthy)',
  labelNames: ['component'],
  registers: [register],
});

export function setHealthStatus(component: string, healthy: boolean): void {
  healthCheckStatus.set({ component }, healthy ? 1 : 0);
}

// ============================================
// Reset Metrics (for testing)
// ============================================

export async function resetMetrics(): Promise<void> {
  register.resetMetrics();
  logger.info('Metrics reset');
}

// ============================================
// Get Registry
// ============================================

export function getRegistry(): Registry {
  return register;
}

export { client };
