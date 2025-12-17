import { Router } from 'express';
import multer from 'multer';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { generateUploadUrl, getMedia, getSignedMediaUrl } from '../controllers/mediaController';
import { uploadLocalFile } from '../controllers/localMediaController';

const router = Router();

// Multer configuration for local file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

/**
 * @openapi
 * /api/media/upload:
 *   post:
 *     tags:
 *       - Media
 *     summary: Generate a presigned URL for file upload to S3
 *     description: Returns a presigned URL that allows direct upload to S3. Only ADMIN and TEACHER roles can upload.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filename
 *               - contentType
 *             properties:
 *               filename:
 *                 type: string
 *                 example: "yoga-session-1.mp4"
 *               contentType:
 *                 type: string
 *                 example: "video/mp4"
 *               type:
 *                 type: string
 *                 enum: [video, image, thumbnail, pose]
 *                 default: video
 *                 description: Type of media being uploaded
 *     responses:
 *       201:
 *         description: Upload URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 upload:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Unique identifier for this upload
 *                     uploadUrl:
 *                       type: string
 *                       description: Presigned URL for direct S3 upload (PUT request)
 *                     fileUrl:
 *                       type: string
 *                       description: Public CDN URL after upload completes
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       description: When the upload URL expires
 *                     key:
 *                       type: string
 *                       description: S3 object key
 *       400:
 *         description: Invalid content type or validation error
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions (requires ADMIN or TEACHER role)
 */
// S3 presigned URL upload (requires S3 config)
router.post('/upload-s3', authenticateToken, requireRoles('ADMIN', 'TEACHER'), generateUploadUrl);

// Local file upload (no S3 required)
router.post('/upload', authenticateToken, requireRoles('ADMIN', 'TEACHER'), upload.single('file'), uploadLocalFile);

/**
 * @openapi
 * /api/media/{id}:
 *   get:
 *     tags:
 *       - Media
 *     summary: Get public media URL
 *     description: Returns the CDN URL for a media file. No authentication required for public media.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Media ID or S3 key
 *     responses:
 *       200:
 *         description: Media URL retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 fileUrl:
 *                   type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid media ID
 */
router.get('/:id', getMedia);

/**
 * @openapi
 * /api/media/{id}/signed:
 *   get:
 *     tags:
 *       - Media
 *     summary: Get signed download URL for private media
 *     description: Returns a time-limited signed URL for accessing private media files.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Media ID or S3 key
 *     responses:
 *       200:
 *         description: Signed URL generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 signedUrl:
 *                   type: string
 *                   description: Time-limited signed URL for download
 *                 expiresIn:
 *                   type: number
 *                   description: Seconds until the signed URL expires
 *       400:
 *         description: Invalid media ID
 *       401:
 *         description: Authentication required
 */
router.get('/:id/signed', authenticateToken, getSignedMediaUrl);

export default router;
