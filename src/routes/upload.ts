import { Router, Request, Response } from 'express';
import { existsSync, mkdirSync, createWriteStream } from 'fs';
import { join, dirname } from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { config } from '../utils/config';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const LOCAL_UPLOAD_DIR = join(process.cwd(), 'uploads');

/**
 * Local file upload endpoint for development when S3 is not configured.
 * Accepts raw file body via PUT request (mimics S3 presigned URL behavior).
 */
router.put('/local/*', async (req: Request, res: Response) => {
  try {
    // Extract the key from the URL path (everything after /local/)
    const key = req.params[0];

    if (!key) {
      return res.status(400).json({ error: 'File key is required' });
    }

    const filePath = join(LOCAL_UPLOAD_DIR, key);
    const fileDir = dirname(filePath);

    // Create directory if it doesn't exist
    if (!existsSync(fileDir)) {
      mkdirSync(fileDir, { recursive: true });
    }

    // Stream the request body to file
    const writeStream = createWriteStream(filePath);

    req.pipe(writeStream);

    writeStream.on('finish', () => {
      logger.info({ key, path: filePath }, 'Local file uploaded successfully');
      res.status(200).json({
        success: true,
        message: 'File uploaded',
        url: `http://localhost:${config.PORT || 4000}/uploads/${key}`,
      });
    });

    writeStream.on('error', (error) => {
      logger.error({ err: error, key }, 'Failed to write local file');
      res.status(500).json({ error: 'Failed to write file' });
    });
  } catch (error) {
    logger.error({ err: error }, 'Local upload failed');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// Multer configuration for file uploads
// ============================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = join(LOCAL_UPLOAD_DIR, 'avatars');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    const filename = `${uuidv4()}.${ext}`;
    cb(null, filename);
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

/**
 * General file upload endpoint (multipart/form-data)
 * POST /api/upload
 */
router.post('/', authenticate, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const fileUrl = `http://localhost:${config.PORT || 4000}/uploads/avatars/${req.file.filename}`;

    logger.info({
      userId: req.user?.id,
      filename: req.file.filename,
      size: req.file.size,
    }, 'File uploaded successfully');

    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error) {
    logger.error({ err: error }, 'File upload failed');
    res.status(500).json({ success: false, error: 'File upload failed' });
  }
});

/**
 * Avatar upload endpoint
 * POST /api/upload/avatar
 */
router.post('/avatar', authenticate, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const fileUrl = `http://localhost:${config.PORT || 4000}/uploads/avatars/${req.file.filename}`;

    // Update user avatar in database
    const { prisma } = await import('../utils/database');
    await prisma.users.update({
      where: { id: req.user!.id },
      data: { avatarUrl: fileUrl },
    });

    logger.info({
      userId: req.user?.id,
      filename: req.file.filename,
    }, 'Avatar uploaded successfully');

    res.json({
      success: true,
      url: fileUrl,
      message: 'Avatar updated successfully',
    });
  } catch (error) {
    logger.error({ err: error }, 'Avatar upload failed');
    res.status(500).json({ success: false, error: 'Avatar upload failed' });
  }
});

export default router;
