import twilio from 'twilio';
import { OtpPurpose, SmsMessageType, SmsStatus } from '@prisma/client';
import { prisma } from '../utils/database';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import {
  generateOtp,
  hashOtp,
  verifyOtpHash,
  formatPhoneNumber,
  maskPhoneNumber,
} from '../utils/otp';

let twilioClient: twilio.Twilio | null = null;

export interface SendSmsResult {
  success: boolean;
  logId: string;
  twilioSid?: string;
  error?: string;
}

export interface OtpResult {
  success: boolean;
  message: string;
  expiresAt?: Date;
  attemptsRemaining?: number;
  error?: string;
}

export interface SmsLogEntry {
  id: string;
  phoneNumber: string;
  message: string;
  messageType: SmsMessageType;
  status: SmsStatus;
  sentAt: Date | null;
  createdAt: Date;
}

export interface PaginatedSmsLogs {
  items: SmsLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Check if SMS/Twilio is properly configured
 */
export function isSmsConfigured(): boolean {
  return !!(
    config.sms.enabled &&
    config.sms.twilioAccountSid &&
    config.sms.twilioAuthToken &&
    (config.sms.twilioPhoneNumber || config.sms.twilioMessagingServiceSid)
  );
}

/**
 * Get or create Twilio client
 */
function getTwilioClient(): twilio.Twilio | null {
  if (twilioClient) {
    return twilioClient;
  }

  if (!isSmsConfigured()) {
    logger.warn('Twilio SMS is not configured - SMS will be simulated');
    return null;
  }

  twilioClient = twilio(
    config.sms.twilioAccountSid,
    config.sms.twilioAuthToken,
  );

  return twilioClient;
}

/**
 * Send SMS message
 */
export async function sendSms(
  phoneNumber: string,
  message: string,
  userId?: string,
  messageType: SmsMessageType = 'NOTIFICATION',
): Promise<SendSmsResult> {
  const formattedPhone = formatPhoneNumber(phoneNumber);

  // Create SMS log entry
  const smsLog = await prisma.sms_logs.create({
    data: {
      userId: userId ?? null,
      phoneNumber: formattedPhone,
      message,
      messageType,
      status: 'PENDING',
    },
  });

  const client = getTwilioClient();

  // If not configured, simulate success (dev mode)
  if (!client) {
    logger.info(
      { phoneNumber: maskPhoneNumber(formattedPhone), messageType },
      'SMS simulated (Twilio not configured)',
    );

    await prisma.sms_logs.update({
      where: { id: smsLog.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        twilioSid: `SIMULATED_${Date.now()}`,
      },
    });

    return {
      success: true,
      logId: smsLog.id,
      twilioSid: `SIMULATED_${Date.now()}`,
    };
  }

  try {
    const messageOptions: {
      to: string;
      body: string;
      from?: string;
      messagingServiceSid?: string;
    } = {
      to: formattedPhone,
      body: message,
    };

    // Use messaging service if available, otherwise use phone number
    if (config.sms.twilioMessagingServiceSid) {
      messageOptions.messagingServiceSid = config.sms.twilioMessagingServiceSid;
    } else if (config.sms.twilioPhoneNumber) {
      messageOptions.from = config.sms.twilioPhoneNumber;
    }

    const twilioMessage = await client.messages.create(messageOptions);

    await prisma.sms_logs.update({
      where: { id: smsLog.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        twilioSid: twilioMessage.sid,
      },
    });

    logger.info(
      {
        phoneNumber: maskPhoneNumber(formattedPhone),
        twilioSid: twilioMessage.sid,
        messageType,
      },
      'SMS sent successfully',
    );

    return {
      success: true,
      logId: smsLog.id,
      twilioSid: twilioMessage.sid,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = (error as { code?: string })?.code;

    await prisma.sms_logs.update({
      where: { id: smsLog.id },
      data: {
        status: 'FAILED',
        errorCode: errorCode ?? null,
        errorMessage,
      },
    });

    logger.error(
      { err: error, phoneNumber: maskPhoneNumber(formattedPhone) },
      'Failed to send SMS',
    );

    return {
      success: false,
      logId: smsLog.id,
      error: errorMessage,
    };
  }
}

/**
 * Send OTP code
 */
export async function sendOtp(
  phoneNumber: string,
  purpose: OtpPurpose,
  userId?: string,
): Promise<OtpResult> {
  const formattedPhone = formatPhoneNumber(phoneNumber);

  // Invalidate any existing OTPs for this phone and purpose
  await prisma.otp_verifications.updateMany({
    where: {
      phoneNumber: formattedPhone,
      purpose,
      verifiedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: {
      expiresAt: new Date(), // Expire immediately
    },
  });

  // Generate new OTP
  const otpCode = generateOtp(6);
  const hashedCode = hashOtp(otpCode);
  const expiresAt = new Date(Date.now() + config.sms.otpExpiryMinutes * 60 * 1000);

  // Store OTP
  await prisma.otp_verifications.create({
    data: {
      phoneNumber: formattedPhone,
      code: hashedCode,
      purpose,
      maxAttempts: config.sms.otpMaxAttempts,
      expiresAt,
    },
  });

  // Build message based on purpose
  let message: string;
  switch (purpose) {
    case 'PHONE_VERIFY':
      message = `Yoga App telefon dogrulama kodunuz: ${otpCode}. ${config.sms.otpExpiryMinutes} dakika gecerlidir.`;
      break;
    case 'LOGIN':
      message = `Yoga App giris kodunuz: ${otpCode}. ${config.sms.otpExpiryMinutes} dakika gecerlidir.`;
      break;
    case 'PASSWORD_RESET':
      message = `Yoga App sifre sifirlama kodunuz: ${otpCode}. ${config.sms.otpExpiryMinutes} dakika gecerlidir.`;
      break;
    default:
      message = `Dogrulama kodunuz: ${otpCode}. ${config.sms.otpExpiryMinutes} dakika gecerlidir.`;
  }

  // Send SMS
  const smsResult = await sendSms(formattedPhone, message, userId, 'OTP');

  if (!smsResult.success) {
    return {
      success: false,
      message: 'Failed to send OTP',
      ...(smsResult.error && { error: smsResult.error }),
    };
  }

  logger.info(
    { phoneNumber: maskPhoneNumber(formattedPhone), purpose },
    'OTP sent successfully',
  );

  return {
    success: true,
    message: 'OTP sent successfully',
    expiresAt,
  };
}

/**
 * Verify OTP code
 */
export async function verifyOtp(
  phoneNumber: string,
  code: string,
  purpose: OtpPurpose,
): Promise<OtpResult> {
  const formattedPhone = formatPhoneNumber(phoneNumber);

  // Find the most recent valid OTP for this phone and purpose
  const otpRecord = await prisma.otp_verifications.findFirst({
    where: {
      phoneNumber: formattedPhone,
      purpose,
      verifiedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord) {
    logger.warn(
      { phoneNumber: maskPhoneNumber(formattedPhone), purpose },
      'No valid OTP found',
    );
    return {
      success: false,
      message: 'Invalid or expired OTP',
    };
  }

  // Check attempts
  if (otpRecord.attempts >= otpRecord.maxAttempts) {
    logger.warn(
      { phoneNumber: maskPhoneNumber(formattedPhone), purpose },
      'OTP max attempts exceeded',
    );
    return {
      success: false,
      message: 'Maximum attempts exceeded. Please request a new OTP.',
      attemptsRemaining: 0,
    };
  }

  // Increment attempts
  await prisma.otp_verifications.update({
    where: { id: otpRecord.id },
    data: { attempts: { increment: 1 } },
  });

  // Verify code
  const isValid = verifyOtpHash(code, otpRecord.code);

  if (!isValid) {
    const attemptsRemaining = otpRecord.maxAttempts - otpRecord.attempts - 1;
    logger.warn(
      { phoneNumber: maskPhoneNumber(formattedPhone), purpose, attemptsRemaining },
      'Invalid OTP code',
    );
    return {
      success: false,
      message: 'Invalid OTP code',
      attemptsRemaining,
    };
  }

  // Mark as verified
  await prisma.otp_verifications.update({
    where: { id: otpRecord.id },
    data: { verifiedAt: new Date() },
  });

  logger.info(
    { phoneNumber: maskPhoneNumber(formattedPhone), purpose },
    'OTP verified successfully',
  );

  return {
    success: true,
    message: 'OTP verified successfully',
  };
}

/**
 * Resend OTP (with rate limiting check)
 */
export async function resendOtp(
  phoneNumber: string,
  purpose: OtpPurpose,
  userId?: string,
): Promise<OtpResult> {
  const formattedPhone = formatPhoneNumber(phoneNumber);

  // Check for recent OTP sends (rate limit: 1 per minute)
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const recentOtp = await prisma.otp_verifications.findFirst({
    where: {
      phoneNumber: formattedPhone,
      purpose,
      createdAt: { gt: oneMinuteAgo },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (recentOtp) {
    const waitSeconds = Math.ceil(
      (recentOtp.createdAt.getTime() + 60 * 1000 - Date.now()) / 1000,
    );
    return {
      success: false,
      message: `Please wait ${waitSeconds} seconds before requesting a new OTP`,
    };
  }

  // Check hourly limit (max 5 per hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const hourlyCount = await prisma.otp_verifications.count({
    where: {
      phoneNumber: formattedPhone,
      purpose,
      createdAt: { gt: oneHourAgo },
    },
  });

  if (hourlyCount >= 5) {
    return {
      success: false,
      message: 'Too many OTP requests. Please try again later.',
    };
  }

  // Send new OTP
  return sendOtp(formattedPhone, purpose, userId);
}

/**
 * Send welcome SMS
 */
export async function sendWelcomeSms(
  phoneNumber: string,
  firstName: string,
  userId?: string,
): Promise<SendSmsResult> {
  const name = firstName || 'degerli uyemiz';
  const message = `Hos geldiniz ${name}! Yoga App ailesine katildiginiz icin tesekkur ederiz. Saglikli ve huzurlu gunler dileriz.`;

  return sendSms(phoneNumber, message, userId, 'NOTIFICATION');
}

/**
 * Send reminder SMS
 */
export async function sendReminderSms(
  phoneNumber: string,
  reminderText: string,
  userId?: string,
): Promise<SendSmsResult> {
  const message = `Yoga App Hatirlatma: ${reminderText}`;

  return sendSms(phoneNumber, message, userId, 'REMINDER');
}

/**
 * Send challenge reminder SMS
 */
export async function sendChallengeReminderSms(
  phoneNumber: string,
  challengeName: string,
  daysLeft: number,
  userId?: string,
): Promise<SendSmsResult> {
  const message = daysLeft === 1
    ? `${challengeName} yarismasi icin son 1 gun! Bugunku antrenmanini tamamlamayi unutma.`
    : `${challengeName} yarismasinda ${daysLeft} gun kaldi! Devam et, basariyorsun!`;

  return sendSms(phoneNumber, message, userId, 'REMINDER');
}

/**
 * Get SMS send history for a user
 */
export async function getSmsSendHistory(
  userId: string,
  pagination: { page?: number; limit?: number } = {},
): Promise<PaginatedSmsLogs> {
  const page = pagination.page || 1;
  const limit = pagination.limit || 20;
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.sms_logs.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        phoneNumber: true,
        message: true,
        messageType: true,
        status: true,
        sentAt: true,
        createdAt: true,
      },
    }),
    prisma.sms_logs.count({ where: { userId } }),
  ]);

  // Mask phone numbers in response
  const maskedLogs = logs.map((log) => ({
    ...log,
    phoneNumber: maskPhoneNumber(log.phoneNumber),
  }));

  return {
    items: maskedLogs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Update SMS delivery status (for Twilio webhook)
 */
export async function updateSmsStatus(
  twilioSid: string,
  status: 'delivered' | 'failed' | 'undelivered',
  errorCode?: string,
  errorMessage?: string,
): Promise<void> {
  const smsLog = await prisma.sms_logs.findFirst({
    where: { twilioSid },
  });

  if (!smsLog) {
    logger.warn({ twilioSid }, 'SMS log not found for status update');
    return;
  }

  const newStatus: SmsStatus = status === 'delivered' ? 'DELIVERED' : 'FAILED';

  await prisma.sms_logs.update({
    where: { id: smsLog.id },
    data: {
      status: newStatus,
      ...(status === 'delivered' && { deliveredAt: new Date() }),
      ...(errorCode && { errorCode }),
      ...(errorMessage && { errorMessage }),
    },
  });

  logger.info({ twilioSid, status: newStatus }, 'SMS status updated');
}

/**
 * Clean up expired OTP records
 */
export async function cleanupExpiredOtps(): Promise<number> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const result = await prisma.otp_verifications.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: sevenDaysAgo } },
        { verifiedAt: { lt: sevenDaysAgo } },
      ],
    },
  });

  if (result.count > 0) {
    logger.info({ count: result.count }, 'Cleaned up expired OTP records');
  }

  return result.count;
}
