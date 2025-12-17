import { Request, Response, NextFunction } from 'express';
import * as eventService from '../services/eventService';
import { HttpError } from '../middleware/errorHandler';

// ============================================
// Public Queries
// ============================================

export async function getActiveEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const events = await eventService.getActiveEvents();

    res.json({
      success: true,
      events,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAllEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const { upcoming, past, isActive } = req.query;

    const events = await eventService.getAllEvents({
      upcoming: upcoming === 'true',
      past: past === 'true',
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });

    res.json({
      success: true,
      events,
    });
  } catch (error) {
    next(error);
  }
}

export async function getEventById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id!;
    const event = await eventService.getEventById(id);

    if (!event) {
      throw new HttpError(404, 'Event not found');
    }

    res.json({
      success: true,
      event,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// User Participation
// ============================================

export async function joinEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const eventId = req.params.id!;

    const result = await eventService.joinEvent(userId, eventId);

    if (!result.success) {
      throw new HttpError(400, result.message || 'Failed to join event');
    }

    res.json({
      success: true,
      message: 'Joined event successfully',
      participant: result.participant,
    });
  } catch (error) {
    next(error);
  }
}

export async function leaveEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const eventId = req.params.id!;

    const result = await eventService.leaveEvent(userId, eventId);

    if (!result.success) {
      throw new HttpError(400, result.message || 'Failed to leave event');
    }

    res.json({
      success: true,
      message: 'Left event successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function getEventProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const eventId = req.params.id!;

    const progress = await eventService.getEventProgress(userId, eventId);

    if (!progress) {
      throw new HttpError(404, 'Not participating in this event');
    }

    res.json({
      success: true,
      progress,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Leaderboard
// ============================================

export async function getEventLeaderboard(req: Request, res: Response, next: NextFunction) {
  try {
    const eventId = req.params.id!;
    const { page, limit } = req.query;

    const result = await eventService.getEventLeaderboard(eventId, {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    // Add current user's rank if authenticated
    if (req.user) {
      const userRank = await eventService.getUserEventRank(req.user.id, eventId);
      (result as any).currentUserRank = userRank;
    }

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Rewards
// ============================================

export async function claimEventRewards(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const eventId = req.params.id!;

    const result = await eventService.claimEventRewards(userId, eventId);

    if (!result.success) {
      throw new HttpError(400, result.message || 'Failed to claim rewards');
    }

    res.json({
      success: true,
      tier: result.tier,
      rewards: result.rewards,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// User History
// ============================================

export async function getEventHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const history = await eventService.getEventHistory(userId);

    res.json({
      success: true,
      events: history,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Admin Functions
// ============================================

export async function createEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const event = await eventService.createEvent(req.body);

    res.status(201).json({
      success: true,
      event,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id!;
    const event = await eventService.updateEvent(id, req.body);

    res.json({
      success: true,
      event,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id!;
    await eventService.deleteEvent(id);

    res.json({
      success: true,
      message: 'Event deleted',
    });
  } catch (error) {
    next(error);
  }
}

export async function getEventStats(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id!;
    const stats = await eventService.getEventStats(id);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
}
