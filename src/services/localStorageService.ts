import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure upload directories exist
const folders = ['videos', 'images', 'thumbnails', 'poses', 'podcasts'];
folders.forEach((folder) => {
  const dir = path.join(UPLOAD_DIR, folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

export type MediaFolder = 'videos' | 'images' | 'thumbnails' | 'poses' | 'podcasts';

interface SaveFileInput {
  file: Express.Multer.File;
  userId: string;
  folder?: MediaFolder;
}

interface SaveFileResponse {
  id: string;
  fileUrl: string;
  key: string;
  filename: string;
}

export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac'];

export function validateContentType(contentType: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(contentType);
}

export function buildLocalUrl(key: string): string {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:4000';
  return `${baseUrl}/uploads/${key}`;
}

export async function saveFileLocally({
  file,
  userId,
  folder = 'images',
}: SaveFileInput): Promise<SaveFileResponse> {
  const id = randomUUID();
  const extension = path.extname(file.originalname) || '.jpg';
  const filename = `${id}${extension}`;
  const key = `${folder}/${filename}`;
  const filePath = path.join(UPLOAD_DIR, folder, filename);

  // Ensure user folder exists
  const userDir = path.join(UPLOAD_DIR, folder);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }

  // Write file
  fs.writeFileSync(filePath, file.buffer);

  logger.info({ key, userId, size: file.size }, 'File saved locally');

  return {
    id,
    fileUrl: buildLocalUrl(key),
    key,
    filename: file.originalname,
  };
}

export async function deleteLocalFile(key: string): Promise<void> {
  const filePath = path.join(UPLOAD_DIR, key);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    logger.info({ key }, 'File deleted locally');
  }
}
