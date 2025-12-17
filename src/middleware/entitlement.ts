import { NextFunction, Request, Response } from 'express';
import { prisma } from '../utils/database';

export async function requireActiveSubscription(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const now = new Date();
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: req.user.userId,
      status: 'ACTIVE',
      OR: [
        { cancelAtPeriodEnd: false },
        { currentPeriodEnd: { gte: now } },
      ],
    },
    include: {
      plan: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  if (!subscription) {
    return res.status(402).json({ error: 'Active subscription required to access this resource' });
  }

  req.subscription = {
    id: subscription.id,
    plan: subscription.planId,
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    currentPeriodEnd: subscription.currentPeriodEnd,
  };

  return next();
}
