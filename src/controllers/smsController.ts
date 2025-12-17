import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { OtpPurpose } from '@prisma/client';
import {
  sendOtpBodySchema,
  verifyOtpBodySchema,
  resendOtpBodySchema,
  updatePhoneBodySchema,
  verifyPhoneBodySchema,
  twilioWebhookBodySchema,
} from '../validation/smsSchemas';
import {
  sendOtp,
  verifyOtp,
  resendOtp,
  isSmsConfigured,
  updateSmsStatus,
} from '../services/smsService';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { formatPhoneNumber, maskPhoneNumber } from '../utils/otp';

export async function handleSendOtp(req: Request, res: Response) {
  try {
    const payload = sendOtpBodySchema.parse(req.body);

    const result = await sendOtp(
      payload.phoneNumber,
      payload.purpose as OtpPurpose,
    );

    if (!result.success) {
      return res.status(400).json({
        error: result.message,
        ...(result.error && { details: result.error }),
      });
    }

    return res.json({
      message: result.message,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to send OTP');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleVerifyOtp(req: Request, res: Response) {
  try {
    const payload = verifyOtpBodySchema.parse(req.body);

    const result = await verifyOtp(
      payload.phoneNumber,
      payload.code,
      payload.purpose as OtpPurpose,
    );

    if (!result.success) {
      return res.status(400).json({
        error: result.message,
        ...(result.attemptsRemaining !== undefined && {
          attemptsRemaining: result.attemptsRemaining,
        }),
      });
    }

    return res.json({
      message: result.message,
      verified: true,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to verify OTP');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleResendOtp(req: Request, res: Response) {
  try {
    const payload = resendOtpBodySchema.parse(req.body);

    const result = await resendOtp(
      payload.phoneNumber,
      payload.purpose as OtpPurpose,
    );

    if (!result.success) {
      return res.status(429).json({
        error: result.message,
      });
    }

    return res.json({
      message: result.message,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to resend OTP');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleVerifyPhone(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = verifyPhoneBodySchema.parse(req.body);

    // Get user's phone number
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { phoneNumber: true, phoneVerified: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.phoneNumber) {
      return res.status(400).json({ error: 'No phone number to verify. Please add a phone number first.' });
    }

    if (user.phoneVerified) {
      return res.status(400).json({ error: 'Phone number is already verified' });
    }

    // Verify OTP
    const result = await verifyOtp(
      user.phoneNumber,
      payload.code,
      'PHONE_VERIFY',
    );

    if (!result.success) {
      return res.status(400).json({
        error: result.message,
        ...(result.attemptsRemaining !== undefined && {
          attemptsRemaining: result.attemptsRemaining,
        }),
      });
    }

    // Update user's phone verification status
    await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        phoneVerified: true,
        phoneVerifiedAt: new Date(),
      },
    });

    logger.info(
      { userId: req.user.userId, phoneNumber: maskPhoneNumber(user.phoneNumber) },
      'Phone verified successfully',
    );

    return res.json({
      message: 'Phone number verified successfully',
      verified: true,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to verify phone');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleUpdatePhone(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = updatePhoneBodySchema.parse(req.body);
    const formattedPhone = formatPhoneNumber(payload.phoneNumber);

    // Check if phone is already in use by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        phoneNumber: formattedPhone,
        id: { not: req.user.userId },
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Phone number is already in use' });
    }

    // Update phone number (reset verification)
    await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        phoneNumber: formattedPhone,
        phoneVerified: false,
        phoneVerifiedAt: null,
      },
    });

    // Send OTP to new number
    const otpResult = await sendOtp(formattedPhone, 'PHONE_VERIFY', req.user.userId);

    logger.info(
      { userId: req.user.userId, phoneNumber: maskPhoneNumber(formattedPhone) },
      'Phone number updated',
    );

    return res.json({
      message: 'Phone number updated. Verification code sent.',
      phoneNumber: maskPhoneNumber(formattedPhone),
      otpSent: otpResult.success,
      ...(otpResult.expiresAt && { otpExpiresAt: otpResult.expiresAt }),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Failed to update phone');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleSendPhoneVerification(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user's phone number
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { phoneNumber: true, phoneVerified: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.phoneNumber) {
      return res.status(400).json({ error: 'No phone number to verify. Please add a phone number first.' });
    }

    if (user.phoneVerified) {
      return res.status(400).json({ error: 'Phone number is already verified' });
    }

    // Send OTP
    const result = await sendOtp(user.phoneNumber, 'PHONE_VERIFY', req.user.userId);

    if (!result.success) {
      return res.status(400).json({
        error: result.message,
      });
    }

    return res.json({
      message: result.message,
      phoneNumber: maskPhoneNumber(user.phoneNumber),
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to send phone verification');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleGetSmsStatus(req: Request, res: Response) {
  try {
    const configured = isSmsConfigured();

    return res.json({
      configured,
      message: configured
        ? 'SMS service is enabled'
        : 'SMS service is not configured',
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get SMS status');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Twilio webhook handler for delivery status updates
export async function handleTwilioWebhook(req: Request, res: Response) {
  try {
    const payload = twilioWebhookBodySchema.parse(req.body);

    const statusMap: Record<string, 'delivered' | 'failed' | 'undelivered'> = {
      delivered: 'delivered',
      undelivered: 'undelivered',
      failed: 'failed',
    };

    const mappedStatus = statusMap[payload.MessageStatus];

    if (mappedStatus) {
      await updateSmsStatus(
        payload.MessageSid,
        mappedStatus,
        payload.ErrorCode,
        payload.ErrorMessage,
      );
    }

    // Twilio expects 200 response
    return res.status(200).send();
  } catch (error) {
    logger.error({ err: error }, 'Failed to process Twilio webhook');
    // Still return 200 to prevent retries
    return res.status(200).send();
  }
}
