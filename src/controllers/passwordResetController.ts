import { Request, Response } from 'express';
import {
  requestPasswordReset,
  validateResetToken,
  resetPassword,
} from '../services/passwordResetService';
import { logger } from '../utils/logger';

export async function handleRequestReset(req: Request, res: Response) {
  try {
    const { email } = req.body;

    const result = await requestPasswordReset(email);

    return res.json(result);
  } catch (error) {
    logger.error({ err: error }, 'Failed to process password reset request');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleValidateToken(req: Request, res: Response) {
  try {
    const token = req.params.token;

    if (!token) {
      return res.status(400).json({ valid: false, error: 'Token is required' });
    }

    const result = await validateResetToken(token);

    return res.json({ valid: result.valid });
  } catch (error) {
    logger.error({ err: error }, 'Failed to validate reset token');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleResetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body;

    const result = await resetPassword(token, newPassword);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    logger.error({ err: error }, 'Failed to reset password');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
