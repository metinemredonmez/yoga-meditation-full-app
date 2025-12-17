import type { JWTPayload } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      subscription?: {
        id: string;
        plan: string;
        status: string;
        cancelAtPeriodEnd: boolean;
        currentPeriodEnd: Date | null;
      };
    }
  }
}

export {};
