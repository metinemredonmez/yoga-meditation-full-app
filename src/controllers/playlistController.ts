import type { Request, Response } from 'express';
import * as playlistService from '../services/playlistService';
import {
  createPlaylistSchema,
  updatePlaylistSchema,
  playlistFiltersSchema,
  addPlaylistItemSchema,
  updatePlaylistItemSchema,
  reorderPlaylistItemsSchema,
  featuredPlaylistsSchema,
} from '../validation/playlistSchemas';

type AuthenticatedRequest = Request & { user?: { id: string } };

// ==================== USER PLAYLISTS ====================

export async function getPlaylists(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const filters = playlistFiltersSchema.parse(req.query);
    const result = await playlistService.getUserPlaylists(userId, filters);
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function getMyPlaylists(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const filters = playlistFiltersSchema.parse(req.query);
    const result = await playlistService.getMyPlaylists(userId, filters);
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function getPlaylist(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Playlist ID is required' });
    }
    const playlist = await playlistService.getPlaylist(userId, id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }
    res.json(playlist);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function createPlaylist(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const input = createPlaylistSchema.parse(req.body);
    const playlist = await playlistService.createPlaylist(userId, input);
    res.status(201).json(playlist);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function updatePlaylist(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Playlist ID is required' });
    }
    const input = updatePlaylistSchema.parse(req.body);
    const playlist = await playlistService.updatePlaylist(userId, id, input);
    res.json(playlist);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    if (error.message === 'Playlist not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function deletePlaylist(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Playlist ID is required' });
    }
    await playlistService.deletePlaylist(userId, id);
    res.status(204).send();
  } catch (error: any) {
    if (error.message === 'Playlist not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

// ==================== PLAYLIST ITEMS ====================

export async function addPlaylistItem(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { id: playlistId } = req.params;
    if (!playlistId) {
      return res.status(400).json({ error: 'Playlist ID is required' });
    }
    const input = addPlaylistItemSchema.parse(req.body);
    const item = await playlistService.addPlaylistItem(userId, playlistId, input);
    res.status(201).json(item);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    if (error.message === 'Playlist not found' || error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function updatePlaylistItem(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { id: playlistId, itemId } = req.params;
    if (!playlistId || !itemId) {
      return res.status(400).json({ error: 'Playlist ID and Item ID are required' });
    }
    const input = updatePlaylistItemSchema.parse(req.body);
    const item = await playlistService.updatePlaylistItem(userId, playlistId, itemId, input);
    res.json(item);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function removePlaylistItem(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { id: playlistId, itemId } = req.params;
    if (!playlistId || !itemId) {
      return res.status(400).json({ error: 'Playlist ID and Item ID are required' });
    }
    await playlistService.removePlaylistItem(userId, playlistId, itemId);
    res.status(204).send();
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function reorderPlaylistItems(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { id: playlistId } = req.params;
    if (!playlistId) {
      return res.status(400).json({ error: 'Playlist ID is required' });
    }
    const input = reorderPlaylistItemsSchema.parse(req.body);
    const items = await playlistService.reorderPlaylistItems(userId, playlistId, input);
    res.json(items);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    if (error.message === 'Playlist not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

// ==================== SAVE/UNSAVE ====================

export async function savePlaylist(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { id: playlistId } = req.params;
    if (!playlistId) {
      return res.status(400).json({ error: 'Playlist ID is required' });
    }
    const saved = await playlistService.savePlaylist(userId, playlistId);
    res.status(201).json(saved);
  } catch (error: any) {
    if (error.message === 'Playlist not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Playlist already saved') {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function unsavePlaylist(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { id: playlistId } = req.params;
    if (!playlistId) {
      return res.status(400).json({ error: 'Playlist ID is required' });
    }
    await playlistService.unsavePlaylist(userId, playlistId);
    res.status(204).send();
  } catch (error: any) {
    if (error.message === 'Playlist not saved') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function getSavedPlaylists(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await playlistService.getSavedPlaylists(userId, page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// ==================== FEATURED & SYSTEM ====================

export async function getFeaturedPlaylists(req: AuthenticatedRequest, res: Response) {
  try {
    const query = featuredPlaylistsSchema.parse(req.query);
    const playlists = await playlistService.getFeaturedPlaylists(query);
    res.json(playlists);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function getSystemPlaylists(req: AuthenticatedRequest, res: Response) {
  try {
    const contentType = req.query.contentType as string | undefined;
    const playlists = await playlistService.getSystemPlaylists(contentType);
    res.json(playlists);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// ==================== PLAY TRACKING ====================

export async function playPlaylist(req: AuthenticatedRequest, res: Response) {
  try {
    const { id: playlistId } = req.params;
    if (!playlistId) {
      return res.status(400).json({ error: 'Playlist ID is required' });
    }
    await playlistService.incrementPlayCount(playlistId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
