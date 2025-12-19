import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as playlistController from '../controllers/playlistController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== USER PLAYLISTS ====================

// GET /api/playlists - Get all accessible playlists
router.get('/', playlistController.getPlaylists);

// GET /api/playlists/me - Get user's own playlists
router.get('/me', playlistController.getMyPlaylists);

// GET /api/playlists/saved - Get user's saved playlists
router.get('/saved', playlistController.getSavedPlaylists);

// GET /api/playlists/featured - Get featured playlists
router.get('/featured', playlistController.getFeaturedPlaylists);

// GET /api/playlists/system - Get system playlists
router.get('/system', playlistController.getSystemPlaylists);

// GET /api/playlists/:id - Get single playlist with items
router.get('/:id', playlistController.getPlaylist);

// POST /api/playlists - Create playlist
router.post('/', playlistController.createPlaylist);

// PUT /api/playlists/:id - Update playlist
router.put('/:id', playlistController.updatePlaylist);

// DELETE /api/playlists/:id - Delete playlist
router.delete('/:id', playlistController.deletePlaylist);

// ==================== PLAYLIST ITEMS ====================

// POST /api/playlists/:id/items - Add item to playlist
router.post('/:id/items', playlistController.addPlaylistItem);

// PUT /api/playlists/:id/items/:itemId - Update item in playlist
router.put('/:id/items/:itemId', playlistController.updatePlaylistItem);

// DELETE /api/playlists/:id/items/:itemId - Remove item from playlist
router.delete('/:id/items/:itemId', playlistController.removePlaylistItem);

// PUT /api/playlists/:id/items/reorder - Reorder items in playlist
router.put('/:id/items/reorder', playlistController.reorderPlaylistItems);

// ==================== SAVE/UNSAVE ====================

// POST /api/playlists/:id/save - Save playlist
router.post('/:id/save', playlistController.savePlaylist);

// DELETE /api/playlists/:id/save - Unsave playlist
router.delete('/:id/save', playlistController.unsavePlaylist);

// ==================== PLAY TRACKING ====================

// POST /api/playlists/:id/play - Track playlist play
router.post('/:id/play', playlistController.playPlaylist);

export default router;
