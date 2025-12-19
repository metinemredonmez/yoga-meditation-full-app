import { Request, Response } from 'express';
import { z } from 'zod';
import {
  setup2FA,
  verify2FASetup,
  verify2FAToken,
  disable2FA,
  regenerateBackupCodes,
  is2FAEnabled,
  getRemainingBackupCodesCount,
} from '../services/twoFactorService';
import { logger } from '../utils/logger';

const tokenSchema = z.object({
  token: z.string().min(6).max(8),
});

const disableSchema = z.object({
  password: z.string().min(1),
});

/**
 * Get 2FA status
 */
export async function getStatus(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const enabled = await is2FAEnabled(req.user.userId);
    const remainingBackupCodes = enabled
      ? await getRemainingBackupCodesCount(req.user.userId)
      : 0;

    return res.json({
      enabled,
      remainingBackupCodes,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get 2FA status');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Initialize 2FA setup
 */
export async function initSetup(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await setup2FA(req.user.userId);

    return res.json({
      qrCodeUrl: result.qrCodeUrl,
      secret: result.secret, // For manual entry
      backupCodes: result.backupCodes,
      message: 'Scan the QR code with your authenticator app, then verify with a code',
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to setup 2FA');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Verify and complete 2FA setup
 */
export async function verifySetup(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { token } = tokenSchema.parse(req.body);
    const result = await verify2FASetup(req.user.userId, token);

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    return res.json({ message: result.message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid token format' });
    }

    logger.error({ err: error }, 'Failed to verify 2FA setup');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Verify 2FA token (for login)
 */
export async function verify(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { token } = tokenSchema.parse(req.body);
    const result = await verify2FAToken(req.user.userId, token);

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    return res.json({ success: true, message: result.message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid token format' });
    }

    logger.error({ err: error }, 'Failed to verify 2FA token');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Disable 2FA
 */
export async function disableTwoFactor(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { password } = disableSchema.parse(req.body);
    const result = await disable2FA(req.user.userId, password);

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    return res.json({ message: result.message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Password is required' });
    }

    logger.error({ err: error }, 'Failed to disable 2FA');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Regenerate backup codes
 */
export async function regenerateCodes(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const backupCodes = await regenerateBackupCodes(req.user.userId);

    return res.json({
      backupCodes,
      message: 'New backup codes generated. Please save them securely.',
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to regenerate backup codes');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
