import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

// Extract phone number from request body for rate limiting key
function getPhoneKey(req: Request): string {
  const phoneNumber = req.body?.phoneNumber;
  if (phoneNumber && typeof phoneNumber === 'string') {
    // Normalize: remove non-digits except leading +
    return phoneNumber.replace(/[^\d+]/g, '');
  }
  // Fallback to IP
  return req.ip || req.socket.remoteAddress || 'unknown';
}

// OTP send rate limiter: 1 per minute per phone number
export const otpSendRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1,
  keyGenerator: getPhoneKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many OTP requests',
    message: 'Please wait 1 minute before requesting another OTP',
    retryAfter: 60,
  },
  handler: (req: Request, res: Response) => {
    logger.warn(
      { phoneNumber: req.body?.phoneNumber, ip: req.ip },
      'OTP send rate limit exceeded',
    );
    res.status(429).json({
      error: 'Too many OTP requests',
      message: 'Please wait 1 minute before requesting another OTP',
      retryAfter: 60,
    });
  },
  skip: (req: Request) => {
    // Skip rate limiting for internal/test requests if needed
    return false;
  },
});

// OTP hourly rate limiter: 5 per hour per phone number
export const otpHourlyRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyGenerator: getPhoneKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Hourly OTP limit exceeded',
    message: 'You have exceeded the maximum number of OTP requests. Please try again later.',
    retryAfter: 3600,
  },
  handler: (req: Request, res: Response) => {
    logger.warn(
      { phoneNumber: req.body?.phoneNumber, ip: req.ip },
      'OTP hourly rate limit exceeded',
    );
    res.status(429).json({
      error: 'Hourly OTP limit exceeded',
      message: 'You have exceeded the maximum number of OTP requests. Please try again later.',
      retryAfter: 3600,
    });
  },
});

// OTP verification rate limiter: prevent brute force
// 5 attempts per 15 minutes per phone number
export const otpVerifyRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  keyGenerator: getPhoneKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many verification attempts',
    message: 'Too many failed verification attempts. Please wait 15 minutes.',
    retryAfter: 900,
  },
  handler: (req: Request, res: Response) => {
    logger.warn(
      { phoneNumber: req.body?.phoneNumber, ip: req.ip },
      'OTP verification rate limit exceeded',
    );
    res.status(429).json({
      error: 'Too many verification attempts',
      message: 'Too many failed verification attempts. Please wait 15 minutes.',
      retryAfter: 900,
    });
  },
});

// General SMS endpoint rate limiter (by IP)
export const smsGeneralRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    message: 'Please slow down and try again later.',
  },
});
