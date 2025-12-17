import { Request, Response, NextFunction } from 'express';
import * as titleService from '../services/titleService';
import * as avatarFrameService from '../services/avatarFrameService';
import { HttpError } from '../middleware/errorHandler';

// ============================================
// Titles
// ============================================

export async function getTitles(req: Request, res: Response, next: NextFunction) {
  try {
    const { rarity } = req.query;

    const titles = await titleService.getTitles({
      rarity: rarity as any,
    });

    res.json({
      success: true,
      titles,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTitleById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id!;
    const title = await titleService.getTitleById(id);

    if (!title) {
      throw new HttpError(404, 'Title not found');
    }

    res.json({
      success: true,
      title,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserTitles(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const titles = await titleService.getUserTitles(userId);

    res.json({
      success: true,
      titles,
    });
  } catch (error) {
    next(error);
  }
}

export async function equipTitle(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const titleId = req.params.id!;

    const result = await titleService.equipTitle(userId, titleId);

    if (!result.success) {
      throw new HttpError(400, result.message || 'Failed to equip title');
    }

    res.json({
      success: true,
      message: 'Title equipped',
    });
  } catch (error) {
    next(error);
  }
}

export async function unequipTitle(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;

    await titleService.unequipTitle(userId);

    res.json({
      success: true,
      message: 'Title unequipped',
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Avatar Frames
// ============================================

export async function getFrames(req: Request, res: Response, next: NextFunction) {
  try {
    const frames = await avatarFrameService.getFrames();

    res.json({
      success: true,
      frames,
    });
  } catch (error) {
    next(error);
  }
}

export async function getFrameById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id!;
    const frame = await avatarFrameService.getFrameById(id);

    if (!frame) {
      throw new HttpError(404, 'Frame not found');
    }

    res.json({
      success: true,
      frame,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserFrames(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const frames = await avatarFrameService.getUserFrames(userId);

    res.json({
      success: true,
      frames,
    });
  } catch (error) {
    next(error);
  }
}

export async function equipFrame(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const frameId = req.params.id!;

    const result = await avatarFrameService.equipFrame(userId, frameId);

    if (!result.success) {
      throw new HttpError(400, result.message || 'Failed to equip frame');
    }

    res.json({
      success: true,
      message: 'Frame equipped',
    });
  } catch (error) {
    next(error);
  }
}

export async function unequipFrame(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;

    await avatarFrameService.unequipFrame(userId);

    res.json({
      success: true,
      message: 'Frame unequipped',
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Admin Functions - Titles
// ============================================

export async function createTitle(req: Request, res: Response, next: NextFunction) {
  try {
    const title = await titleService.createTitle(req.body);

    res.status(201).json({
      success: true,
      title,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTitle(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id!;
    const title = await titleService.updateTitle(id, req.body);

    res.json({
      success: true,
      title,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTitle(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id!;
    await titleService.deleteTitle(id);

    res.json({
      success: true,
      message: 'Title deleted',
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Admin Functions - Frames
// ============================================

export async function createFrame(req: Request, res: Response, next: NextFunction) {
  try {
    const frame = await avatarFrameService.createFrame(req.body);

    res.status(201).json({
      success: true,
      frame,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateFrame(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id!;
    const frame = await avatarFrameService.updateFrame(id, req.body);

    res.json({
      success: true,
      frame,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteFrame(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id!;
    await avatarFrameService.deleteFrame(id);

    res.json({
      success: true,
      message: 'Frame deleted',
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// Admin - Grant Unlocks
// ============================================

export async function grantTitle(req: Request, res: Response, next: NextFunction) {
  try {
    const targetUserId = req.params.userId!;
    const { titleId } = req.body;

    const result = await titleService.unlockTitle(targetUserId, titleId);

    if (!result.success) {
      throw new HttpError(400, result.message || 'Failed to grant title');
    }

    res.json({
      success: true,
      message: 'Title granted',
    });
  } catch (error) {
    next(error);
  }
}

export async function grantFrame(req: Request, res: Response, next: NextFunction) {
  try {
    const targetUserId = req.params.userId!;
    const { frameId } = req.body;

    const result = await avatarFrameService.unlockFrame(targetUserId, frameId);

    if (!result.success) {
      throw new HttpError(400, result.message || 'Failed to grant frame');
    }

    res.json({
      success: true,
      message: 'Frame granted',
    });
  } catch (error) {
    next(error);
  }
}
