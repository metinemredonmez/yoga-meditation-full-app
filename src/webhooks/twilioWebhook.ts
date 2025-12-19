import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { config } from '../utils/config';

// ============================================
// Types
// ============================================

interface TwilioSMSStatusCallback {
  MessageSid: string;
  MessageStatus: 'queued' | 'failed' | 'sent' | 'delivered' | 'undelivered';
  To: string;
  From: string;
  ErrorCode?: string;
  ErrorMessage?: string;
  AccountSid: string;
}

interface TwilioVoiceStatusCallback {
  CallSid: string;
  CallStatus: 'queued' | 'ringing' | 'in-progress' | 'completed' | 'busy' | 'failed' | 'no-answer' | 'canceled';
  To: string;
  From: string;
  Duration?: string;
  CallDuration?: string;
}

// ============================================
// Signature Verification
// ============================================

function verifyTwilioSignature(req: Request): boolean {
  const authToken = config.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    logger.warn('Twilio auth token not configured');
    return false;
  }

  const twilioSignature = req.headers['x-twilio-signature'] as string;
  if (!twilioSignature) {
    return false;
  }

  // Build the full URL
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['host'];
  const url = `${protocol}://${host}${req.originalUrl}`;

  // Sort and concatenate POST parameters
  const sortedParams = Object.keys(req.body)
    .sort()
    .reduce((acc, key) => acc + key + req.body[key], '');

  const data = url + sortedParams;

  const expectedSignature = crypto
    .createHmac('sha1', authToken)
    .update(data)
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(twilioSignature),
    Buffer.from(expectedSignature)
  );
}

// ============================================
// Webhook Handlers
// ============================================

/**
 * Handle SMS status callback
 */
export async function handleSMSStatusCallback(req: Request, res: Response) {
  try {
    // Verify signature in production
    if (config.NODE_ENV === 'production' && !verifyTwilioSignature(req)) {
      logger.warn('Invalid Twilio signature');
      return res.status(401).send('Invalid signature');
    }

    const callback = req.body as TwilioSMSStatusCallback;

    logger.info({
      messageSid: callback.MessageSid,
      status: callback.MessageStatus,
      to: callback.To
    }, 'Twilio SMS status callback received');

    // Find and update SMS log
    const smsLog = await prisma.sms_logs.findFirst({
      where: { twilioSid: callback.MessageSid }
    });

    if (smsLog) {
      const updateData: any = {
        status: mapTwilioStatus(callback.MessageStatus)
      };

      if (callback.MessageStatus === 'delivered') {
        updateData.deliveredAt = new Date();
      }

      if (callback.ErrorCode) {
        updateData.errorCode = callback.ErrorCode;
        updateData.errorMessage = callback.ErrorMessage;
      }

      await prisma.sms_logs.update({
        where: { id: smsLog.id },
        data: updateData
      });

      logger.info({ smsLogId: smsLog.id, status: callback.MessageStatus }, 'SMS log updated');
    } else {
      logger.warn({ messageSid: callback.MessageSid }, 'SMS log not found for status callback');
    }

    // Twilio expects a TwiML response or empty 200
    res.status(200).send('<Response></Response>');
  } catch (error) {
    logger.error({ err: error }, 'Twilio SMS status callback failed');
    res.status(500).send('Error processing callback');
  }
}

/**
 * Handle Voice status callback
 */
export async function handleVoiceStatusCallback(req: Request, res: Response) {
  try {
    if (config.NODE_ENV === 'production' && !verifyTwilioSignature(req)) {
      return res.status(401).send('Invalid signature');
    }

    const callback = req.body as TwilioVoiceStatusCallback;

    logger.info({
      callSid: callback.CallSid,
      status: callback.CallStatus,
      duration: callback.Duration
    }, 'Twilio Voice status callback received');

    // Update call log if you have one
    // await prisma.callLog.update(...)

    res.status(200).send('<Response></Response>');
  } catch (error) {
    logger.error({ err: error }, 'Twilio Voice status callback failed');
    res.status(500).send('Error processing callback');
  }
}

/**
 * Handle incoming SMS (if needed)
 */
export async function handleIncomingSMS(req: Request, res: Response) {
  try {
    if (config.NODE_ENV === 'production' && !verifyTwilioSignature(req)) {
      return res.status(401).send('Invalid signature');
    }

    const { From, Body, MessageSid } = req.body;

    logger.info({ from: From, messageSid: MessageSid }, 'Incoming SMS received');

    // Store incoming message
    await prisma.sms_logs.create({
      data: {
        phoneNumber: From,
        message: Body,
        messageType: 'NOTIFICATION',
        status: 'DELIVERED',
        twilioSid: MessageSid,
        sentAt: new Date(),
        deliveredAt: new Date()
      }
    });

    // Auto-reply if needed
    res.type('text/xml');
    res.send(`
      <Response>
        <Message>Mesajiniz alindi. Tesekkurler!</Message>
      </Response>
    `);
  } catch (error) {
    logger.error({ err: error }, 'Incoming SMS processing failed');
    res.status(500).send('<Response></Response>');
  }
}

// ============================================
// Helpers
// ============================================

function mapTwilioStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'queued': 'PENDING',
    'sent': 'SENT',
    'delivered': 'DELIVERED',
    'failed': 'FAILED',
    'undelivered': 'FAILED'
  };

  return statusMap[status] || 'UNKNOWN';
}
