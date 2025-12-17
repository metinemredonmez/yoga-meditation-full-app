import { randomBytes, createHash } from 'crypto';
import { prisma } from '../utils/database';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

export interface ApiKeyPermission {
  resource: string;
  actions: ('read' | 'write' | 'delete')[];
}

export interface CreateApiKeyInput {
  userId: string;
  name: string;
  permissions: string[];
  rateLimit?: number;
  expiresAt?: Date | null;
}

export interface ApiKeyValidationResult {
  valid: boolean;
  keyId?: string;
  userId?: string;
  permissions?: string[];
  rateLimit?: number;
  expired?: boolean;
  revoked?: boolean;
}

const API_KEY_LENGTH = 32;

export function generateApiKey(isLive: boolean = true): string {
  const prefix = isLive ? config.apiKey.prefixLive : config.apiKey.prefixTest;
  const randomPart = randomBytes(API_KEY_LENGTH).toString('base64url');
  return `${prefix}${randomPart}`;
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export function getKeyPrefix(key: string): string {
  // Return first 12 characters (prefix + first few chars of random part)
  return key.substring(0, 12) + '...';
}

export async function createApiKey(input: CreateApiKeyInput): Promise<{
  key: string;
  keyId: string;
  prefix: string;
}> {
  const isLive = config.NODE_ENV === 'production';
  const plainKey = generateApiKey(isLive);
  const hashedKey = hashApiKey(plainKey);

  try {
    const apiKey = await prisma.apiKey.create({
      data: {
        userId: input.userId,
        name: input.name,
        key: hashedKey,
        permissions: input.permissions,
        rateLimit: input.rateLimit || 60,
        expiresAt: input.expiresAt ?? null,
      },
    });

    logger.info({ userId: input.userId, keyId: apiKey.id, name: input.name }, 'API key created');

    return {
      key: plainKey, // Return plain key only once during creation
      keyId: apiKey.id,
      prefix: getKeyPrefix(plainKey),
    };
  } catch (error) {
    logger.error({ error, userId: input.userId }, 'Error creating API key');
    throw error;
  }
}

export async function validateApiKey(plainKey: string): Promise<ApiKeyValidationResult> {
  if (!plainKey) {
    return { valid: false };
  }

  // Check if key has valid prefix
  const isValidPrefix =
    plainKey.startsWith(config.apiKey.prefixLive) ||
    plainKey.startsWith(config.apiKey.prefixTest);

  if (!isValidPrefix) {
    return { valid: false };
  }

  const hashedKey = hashApiKey(plainKey);

  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: { key: hashedKey },
      select: {
        id: true,
        userId: true,
        permissions: true,
        rateLimit: true,
        isActive: true,
        expiresAt: true,
      },
    });

    if (!apiKey) {
      return { valid: false };
    }

    if (!apiKey.isActive) {
      return { valid: false, revoked: true };
    }

    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      return { valid: false, expired: true };
    }

    // Update usage stats asynchronously
    updateApiKeyUsage(apiKey.id).catch((err) => {
      logger.error({ error: err, keyId: apiKey.id }, 'Error updating API key usage');
    });

    return {
      valid: true,
      keyId: apiKey.id,
      userId: apiKey.userId,
      permissions: apiKey.permissions as string[],
      rateLimit: apiKey.rateLimit,
    };
  } catch (error) {
    logger.error({ error }, 'Error validating API key');
    return { valid: false };
  }
}

export async function revokeApiKey(keyId: string, userId: string): Promise<boolean> {
  try {
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        userId, // Ensure user owns this key
      },
    });

    if (!apiKey) {
      return false;
    }

    await prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });

    logger.info({ keyId, userId }, 'API key revoked');
    return true;
  } catch (error) {
    logger.error({ error, keyId, userId }, 'Error revoking API key');
    return false;
  }
}

export async function listUserApiKeys(userId: string): Promise<{
  id: string;
  name: string;
  prefix: string;
  permissions: string[];
  rateLimit: number;
  isActive: boolean;
  lastUsedAt: Date | null;
  usageCount: number;
  expiresAt: Date | null;
  createdAt: Date;
}[]> {
  try {
    const keys = await prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        key: true,
        permissions: true,
        rateLimit: true,
        isActive: true,
        lastUsedAt: true,
        usageCount: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Don't return the full hash, just indicate it exists
    return keys.map((key) => ({
      id: key.id,
      name: key.name,
      prefix: `${config.apiKey.prefixLive}***`, // Don't expose any part of the key
      permissions: key.permissions as string[],
      rateLimit: key.rateLimit,
      isActive: key.isActive,
      lastUsedAt: key.lastUsedAt,
      usageCount: key.usageCount,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
    }));
  } catch (error) {
    logger.error({ error, userId }, 'Error listing API keys');
    return [];
  }
}

export async function updateApiKeyUsage(keyId: string): Promise<void> {
  try {
    await prisma.apiKey.update({
      where: { id: keyId },
      data: {
        lastUsedAt: new Date(),
        usageCount: { increment: 1 },
      },
    });
  } catch (error) {
    // Non-critical error, just log it
    logger.warn({ error, keyId }, 'Error updating API key usage');
  }
}

export async function rotateApiKey(
  keyId: string,
  userId: string
): Promise<{ key: string; keyId: string; prefix: string } | null> {
  try {
    // Get the old key
    const oldKey = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        userId,
        isActive: true,
      },
    });

    if (!oldKey) {
      return null;
    }

    // Create new key with same settings
    const newKeyResult = await createApiKey({
      userId,
      name: oldKey.name,
      permissions: oldKey.permissions as string[],
      rateLimit: oldKey.rateLimit,
      expiresAt: oldKey.expiresAt,
    });

    // Revoke old key
    await prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });

    logger.info({ oldKeyId: keyId, newKeyId: newKeyResult.keyId, userId }, 'API key rotated');

    return newKeyResult;
  } catch (error) {
    logger.error({ error, keyId, userId }, 'Error rotating API key');
    return null;
  }
}

export async function getApiKeyUsage(
  keyId: string,
  userId: string
): Promise<{
  keyId: string;
  name: string;
  usageCount: number;
  lastUsedAt: Date | null;
  createdAt: Date;
  rateLimit: number;
  isActive: boolean;
} | null> {
  try {
    const key = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        userId,
      },
      select: {
        id: true,
        name: true,
        usageCount: true,
        lastUsedAt: true,
        createdAt: true,
        rateLimit: true,
        isActive: true,
      },
    });

    if (!key) {
      return null;
    }

    return {
      keyId: key.id,
      name: key.name,
      usageCount: key.usageCount,
      lastUsedAt: key.lastUsedAt,
      createdAt: key.createdAt,
      rateLimit: key.rateLimit,
      isActive: key.isActive,
    };
  } catch (error) {
    logger.error({ error, keyId, userId }, 'Error getting API key usage');
    return null;
  }
}

export function hasPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  // Check for wildcard permission
  if (userPermissions.includes('*')) {
    return true;
  }

  // Check exact match
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  // Parse permission (format: action:resource, e.g., "read:programs")
  const [action, resource] = requiredPermission.split(':');

  // Check for resource wildcard (e.g., "read:*" allows "read:programs")
  if (userPermissions.includes(`${action}:*`)) {
    return true;
  }

  // Check for action wildcard on resource (e.g., "*:programs" allows "read:programs")
  if (userPermissions.includes(`*:${resource}`)) {
    return true;
  }

  return false;
}
