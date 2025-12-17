import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { FavoriteType } from '@prisma/client';
import {
  addFavoriteBodySchema,
  removeFavoriteBodySchema,
  toggleFavoriteBodySchema,
  getFavoritesQuerySchema,
  checkFavoriteParamsSchema,
  bulkCheckFavoritesBodySchema,
} from '../validation/favoriteSchemas';
import {
  addFavorite,
  removeFavorite,
  toggleFavorite,
  isFavorite,
  getUserFavorites,
  getFavoriteCounts,
  bulkCheckFavorites,
  checkItemExists,
} from '../services/favoriteService';
import { logger } from '../utils/logger';

export async function handleAddFavorite(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = addFavoriteBodySchema.parse(req.body);

    // Check if item exists
    const exists = await checkItemExists(payload.itemId, payload.itemType as FavoriteType);
    if (!exists) {
      return res.status(404).json({
        error: 'Item not found',
        message: `${payload.itemType} with id ${payload.itemId} does not exist`,
      });
    }

    const favorite = await addFavorite(
      req.user.userId,
      payload.itemId,
      payload.itemType as FavoriteType,
    );

    return res.status(201).json({
      message: 'Added to favorites',
      favorite,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to add favorite');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleRemoveFavorite(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = removeFavoriteBodySchema.parse(req.body);

    await removeFavorite(
      req.user.userId,
      payload.itemId,
      payload.itemType as FavoriteType,
    );

    // Always return 204, even if not found
    return res.status(204).send();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to remove favorite');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleToggleFavorite(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = toggleFavoriteBodySchema.parse(req.body);

    // Check if item exists before toggling on
    const exists = await checkItemExists(payload.itemId, payload.itemType as FavoriteType);
    if (!exists) {
      return res.status(404).json({
        error: 'Item not found',
        message: `${payload.itemType} with id ${payload.itemId} does not exist`,
      });
    }

    const result = await toggleFavorite(
      req.user.userId,
      payload.itemId,
      payload.itemType as FavoriteType,
    );

    return res.json({
      isFavorite: result.isFavorite,
      message: result.isFavorite ? 'Added to favorites' : 'Removed from favorites',
      ...(result.favorite && { favorite: result.favorite }),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to toggle favorite');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleGetFavorites(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const query = getFavoritesQuerySchema.parse(req.query);

    const result = await getUserFavorites(
      req.user.userId,
      query.itemType as FavoriteType | undefined,
      { page: query.page, limit: query.limit },
    );

    return res.json({
      favorites: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to get favorites');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleGetFavoritesByType(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { itemType } = checkFavoriteParamsSchema.pick({ itemType: true }).parse(req.params);
    const query = getFavoritesQuerySchema.omit({ itemType: true }).parse(req.query);

    const result = await getUserFavorites(
      req.user.userId,
      itemType as FavoriteType,
      { page: query.page, limit: query.limit },
    );

    return res.json({
      favorites: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to get favorites by type');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleCheckFavorite(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const params = checkFavoriteParamsSchema.parse(req.params);

    const favorite = await isFavorite(
      req.user.userId,
      params.itemId,
      params.itemType as FavoriteType,
    );

    return res.json({ isFavorite: favorite });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to check favorite');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleGetFavoriteCounts(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const counts = await getFavoriteCounts(req.user.userId);

    return res.json({ counts });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get favorite counts');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleBulkCheckFavorites(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = bulkCheckFavoritesBodySchema.parse(req.body);

    const results = await bulkCheckFavorites(
      req.user.userId,
      payload.items.map((item) => ({
        itemId: item.itemId,
        itemType: item.itemType as FavoriteType,
      })),
    );

    // Convert Map to array of results
    const favorites = payload.items.map((item) => ({
      itemId: item.itemId,
      itemType: item.itemType,
      isFavorite: results.get(`${item.itemType}:${item.itemId}`) || false,
    }));

    return res.json({ favorites });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to bulk check favorites');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
