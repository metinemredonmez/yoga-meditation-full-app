import { Router } from 'express';
import type { Request, Response } from 'express';
import * as playlistService from '../../services/playlistService';
import {
  adminCreatePlaylistSchema,
  adminUpdatePlaylistSchema,
  adminPlaylistFiltersSchema,
  addPlaylistItemSchema,
} from '../../validation/playlistSchemas';

type AuthenticatedRequest = Request;

const router = Router();

// Note: Authentication and admin check is done in parent router (admin/index.ts)

// ==================== PLAYLIST MANAGEMENT ====================

// GET /api/admin/playlists/stats - Get playlist stats (MUST be before /:id)
router.get('/stats', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await playlistService.getPlaylistStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/playlists - Get all playlists
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = adminPlaylistFiltersSchema.parse(req.query);
    const result = await playlistService.getAdminPlaylists(filters);
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/playlists/:id - Get single playlist
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Playlist ID is required' });
    }
    // Use admin version to get full details
    const playlist = await playlistService.getPlaylist('admin', id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }
    res.json(playlist);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/playlists - Create system/curated playlist
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const input = adminCreatePlaylistSchema.parse(req.body);
    const playlist = await playlistService.adminCreatePlaylist(input);
    res.status(201).json(playlist);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/playlists/:id - Update playlist
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Playlist ID is required' });
    }
    const input = adminUpdatePlaylistSchema.parse(req.body);
    const playlist = await playlistService.adminUpdatePlaylist(id, input);
    res.json(playlist);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/playlists/:id - Delete playlist
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Playlist ID is required' });
    }
    await playlistService.adminDeletePlaylist(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PLAYLIST ITEMS ====================

// POST /api/admin/playlists/:id/items - Add item to playlist
router.post('/:id/items', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: playlistId } = req.params;
    if (!playlistId) {
      return res.status(400).json({ error: 'Playlist ID is required' });
    }
    const input = addPlaylistItemSchema.parse(req.body);
    const item = await playlistService.adminAddPlaylistItem(playlistId, input);
    res.status(201).json(item);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/playlists/:id/items/:itemId - Remove item from playlist
router.delete('/:id/items/:itemId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: playlistId, itemId } = req.params;
    if (!playlistId || !itemId) {
      return res.status(400).json({ error: 'Playlist ID and Item ID are required' });
    }
    await playlistService.adminRemovePlaylistItem(playlistId, itemId);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
