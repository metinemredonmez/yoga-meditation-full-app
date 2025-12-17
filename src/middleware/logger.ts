import pinoHttp from 'pino-http';
import { logger } from '../utils/logger';

export const httpLogger = pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url?.startsWith('/api/health') ?? false,
  },
  customProps: (req) => ({
    requestId: (req as unknown as { id?: string }).id,
  }),
});
