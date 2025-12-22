import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

// Check if S3 is configured
const isS3Configured = !!(config.S3_ACCESS_KEY_ID && config.S3_SECRET_ACCESS_KEY && config.S3_BUCKET_NAME);

// Local upload directory for development
const LOCAL_UPLOAD_DIR = join(process.cwd(), 'uploads');

// Ensure local upload directory exists
if (!isS3Configured) {
  if (!existsSync(LOCAL_UPLOAD_DIR)) {
    mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
  }
  logger.info('S3 not configured, using local file storage at: ' + LOCAL_UPLOAD_DIR);
}

// S3 Client - lazy initialization
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    if (!isS3Configured) {
      throw new Error(
        'S3 configuration is missing. Please set S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, and S3_BUCKET_NAME',
      );
    }

    s3Client = new S3Client({
      region: config.S3_REGION ?? 'eu-central-1',
      credentials: {
        accessKeyId: config.S3_ACCESS_KEY_ID!,
        secretAccessKey: config.S3_SECRET_ACCESS_KEY!,
      },
    });
  }
  return s3Client;
}

export type MediaFolder = 'videos' | 'images' | 'thumbnails' | 'poses' | 'podcasts';

interface SignedUrlInput {
  filename: string;
  contentType: string;
  userId: string;
  folder?: MediaFolder;
}

interface UploadUrlResponse {
  id: string;
  uploadUrl: string;
  fileUrl: string;
  expiresAt: Date;
  key: string;
}

// Allowed content types
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac'];

/**
 * Validate content type against allowed types
 */
export function validateContentType(contentType: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(contentType);
}

/**
 * Build CDN or S3 URL for a given key
 */
export function buildCdnUrl(key: string): string {
  if (config.STORAGE_CDN_BASE_URL) {
    return `${config.STORAGE_CDN_BASE_URL.replace(/\/$/, '')}/${key}`;
  }

  if (config.S3_BUCKET_NAME) {
    return `https://${config.S3_BUCKET_NAME}.s3.${config.S3_REGION ?? 'eu-central-1'}.amazonaws.com/${key}`;
  }

  return `https://cdn.mock-storage.local/${key}`;
}

/**
 * Create a presigned URL for direct client upload to S3
 * Falls back to local file upload endpoint in development when S3 is not configured
 */
export async function createSignedUploadUrl({
  filename,
  contentType,
  userId,
  folder = 'videos',
}: SignedUrlInput): Promise<UploadUrlResponse> {
  const id = randomUUID();
  const extension = filename.split('.').pop() || '';
  const key = `${folder}/${userId}/${id}${extension ? '.' + extension : ''}`;
  const expiresIn = config.STORAGE_SIGNED_URL_TTL_SECONDS ?? 600;
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  // Use local file storage in development when S3 is not configured
  if (!isS3Configured) {
    // Create folder structure
    const folderPath = join(LOCAL_UPLOAD_DIR, folder, userId);
    if (!existsSync(folderPath)) {
      mkdirSync(folderPath, { recursive: true });
    }

    // Return local upload URL
    const uploadUrl = `http://localhost:${config.PORT || 4000}/api/upload/local/${key}`;
    const fileUrl = `http://localhost:${config.PORT || 4000}/uploads/${key}`;

    logger.info(
      {
        id,
        userId,
        filename,
        contentType,
        key,
        folder,
        mode: 'local',
      },
      'Generated local upload URL (S3 not configured)',
    );

    return {
      id,
      uploadUrl,
      fileUrl,
      expiresAt,
      key,
    };
  }

  // Use S3 for production
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: config.S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    Metadata: {
      userid: userId,
      originalfilename: filename,
      uploadedat: new Date().toISOString(),
    },
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn });
  const fileUrl = buildCdnUrl(key);

  logger.info(
    {
      id,
      userId,
      filename,
      contentType,
      key,
      folder,
      mode: 's3',
    },
    'Generated presigned upload URL',
  );

  return {
    id,
    uploadUrl,
    fileUrl,
    expiresAt,
    key,
  };
}

/**
 * Create a presigned URL for downloading private files
 */
export async function createSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: config.S3_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Delete a file from S3
 */
export async function deleteFile(key: string): Promise<void> {
  const client = getS3Client();
  const command = new DeleteObjectCommand({
    Bucket: config.S3_BUCKET_NAME,
    Key: key,
  });

  await client.send(command);
  logger.info({ key }, 'File deleted from S3');
}

/**
 * Get media download URL (backward compatibility)
 */
export function getMediaDownloadUrl(id: string): string {
  return buildCdnUrl(id);
}

/**
 * Upload file buffer directly to S3
 */
export async function uploadFile(key: string, buffer: Buffer, contentType: string): Promise<void> {
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: config.S3_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await client.send(command);
  logger.info({ key, contentType, size: buffer.length }, 'File uploaded to S3');
}

/**
 * Get signed download URL (alias for createSignedDownloadUrl)
 */
export { createSignedDownloadUrl as getSignedUrl };

/**
 * Download file from S3 and return as Buffer
 */
export async function downloadFile(key: string): Promise<Buffer> {
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: config.S3_BUCKET_NAME,
    Key: key,
  });

  const response = await client.send(command);
  const stream = response.Body as NodeJS.ReadableStream;

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }

  return Buffer.concat(chunks);
}
