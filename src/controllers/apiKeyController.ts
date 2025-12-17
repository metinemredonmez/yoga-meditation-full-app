import { Request, Response, NextFunction } from 'express';
import {
  createApiKey,
  listUserApiKeys,
  revokeApiKey,
  rotateApiKey,
  getApiKeyUsage,
} from '../services/apiKeyService';
import { logger } from '../utils/logger';

export async function handleCreateApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    const { name, permissions, rateLimit, expiresAt } = req.body;

    const result = await createApiKey({
      userId,
      name,
      permissions: permissions || ['read:*'],
      rateLimit,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    logger.info({ userId, keyId: result.keyId, name }, 'API key created');

    res.status(201).json({
      success: true,
      data: {
        keyId: result.keyId,
        key: result.key,
        prefix: result.prefix,
        name,
        permissions: permissions || ['read:*'],
        rateLimit: rateLimit || 60,
      },
      message: 'API key created successfully. Save this key securely - it will not be shown again.',
    });
  } catch (error) {
    logger.error({ error }, 'Error creating API key');
    next(error);
  }
}

export async function handleListApiKeys(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    const keys = await listUserApiKeys(userId);

    res.json({
      success: true,
      data: keys,
      count: keys.length,
    });
  } catch (error) {
    logger.error({ error }, 'Error listing API keys');
    next(error);
  }
}

export async function handleRevokeApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { keyId } = req.params;

    if (!userId || !keyId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    const success = await revokeApiKey(keyId, userId);

    if (success) {
      logger.info({ userId, keyId }, 'API key revoked');
      res.json({
        success: true,
        message: 'API key has been revoked.',
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'API key not found or you do not have permission to revoke it.',
      });
    }
  } catch (error) {
    logger.error({ error }, 'Error revoking API key');
    next(error);
  }
}

export async function handleRotateApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { keyId } = req.params;

    if (!userId || !keyId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    const result = await rotateApiKey(keyId, userId);

    if (result) {
      logger.info({ userId, oldKeyId: keyId, newKeyId: result.keyId }, 'API key rotated');
      res.json({
        success: true,
        data: {
          keyId: result.keyId,
          key: result.key,
          prefix: result.prefix,
        },
        message: 'API key rotated successfully. Old key has been revoked. Save the new key securely.',
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'API key not found or you do not have permission to rotate it.',
      });
    }
  } catch (error) {
    logger.error({ error }, 'Error rotating API key');
    next(error);
  }
}

export async function handleGetApiKeyUsage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { keyId } = req.params;

    if (!userId || !keyId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    const usage = await getApiKeyUsage(keyId, userId);

    if (usage) {
      res.json({
        success: true,
        data: usage,
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'API key not found or you do not have permission to view it.',
      });
    }
  } catch (error) {
    logger.error({ error }, 'Error getting API key usage');
    next(error);
  }
}
