import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { config } from '../utils/config';

// ============================================
// Types
// ============================================

interface SendGridEvent {
  email: string;
  timestamp: number;
  'smtp-id': string;
  event: SendGridEventType;
  category?: string[];
  sg_event_id: string;
  sg_message_id: string;
  response?: string;
  attempt?: string;
  useragent?: string;
  ip?: string;
  url?: string;
  reason?: string;
  status?: string;
  type?: string;
  bounce_classification?: string;
}

type SendGridEventType =
  | 'processed'
  | 'deferred'
  | 'delivered'
  | 'open'
  | 'click'
  | 'bounce'
  | 'dropped'
  | 'spamreport'
  | 'unsubscribe'
  | 'group_unsubscribe'
  | 'group_resubscribe';

// ============================================
// Signature Verification
// ============================================

function verifySendGridSignature(req: Request): boolean {
  const webhookVerificationKey = config.sendgrid?.webhookVerificationKey;
  if (!webhookVerificationKey) {
    logger.warn('SendGrid webhook verification key not configured');
    return false;
  }

  const signature = req.headers['x-twilio-email-event-webhook-signature'] as string;
  const timestamp = req.headers['x-twilio-email-event-webhook-timestamp'] as string;

  if (!signature || !timestamp) {
    return false;
  }

  // Verify using ECDSA
  const payload = timestamp + JSON.stringify(req.body);

  try {
    const verifier = crypto.createVerify('SHA256');
    verifier.update(payload);
    return verifier.verify(webhookVerificationKey, signature, 'base64');
  } catch (error) {
    logger.error({ err: error }, 'SendGrid signature verification failed');
    return false;
  }
}

// ============================================
// Webhook Handler
// ============================================

/**
 * Handle SendGrid webhook events
 */
export async function handleSendGridWebhook(req: Request, res: Response) {
  try {
    // Verify signature in production
    if (config.NODE_ENV === 'production' && !verifySendGridSignature(req)) {
      logger.warn('Invalid SendGrid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const events = req.body as SendGridEvent[];

    if (!Array.isArray(events)) {
      return res.status(400).json({ error: 'Invalid payload format' });
    }

    logger.info({ eventCount: events.length }, 'SendGrid webhook received');

    // Process each event
    for (const event of events) {
      await processEvent(event);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error({ err: error }, 'SendGrid webhook processing failed');
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

// ============================================
// Event Processors
// ============================================

async function processEvent(event: SendGridEvent) {
  const { email, event: eventType, sg_message_id } = event;

  logger.info({
    email,
    eventType,
    messageId: sg_message_id
  }, 'Processing SendGrid event');

  switch (eventType) {
    case 'delivered':
      await handleDelivered(event);
      break;

    case 'open':
      await handleOpen(event);
      break;

    case 'click':
      await handleClick(event);
      break;

    case 'bounce':
      await handleBounce(event);
      break;

    case 'dropped':
      await handleDropped(event);
      break;

    case 'spamreport':
      await handleSpamReport(event);
      break;

    case 'unsubscribe':
    case 'group_unsubscribe':
      await handleUnsubscribe(event);
      break;

    case 'deferred':
      await handleDeferred(event);
      break;

    default:
      logger.info({ eventType }, 'Unhandled SendGrid event type');
  }
}

async function handleDelivered(event: SendGridEvent) {
  // Update email log if exists
  const emailLog = await prisma.emailLog.findFirst({
    where: { providerMessageId: event.sg_message_id }
  });

  if (emailLog) {
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(event.timestamp * 1000)
      }
    });

    logger.info({ emailLogId: emailLog.id }, 'Email marked as delivered');
  }
}

async function handleOpen(event: SendGridEvent) {
  const emailLog = await prisma.emailLog.findFirst({
    where: { providerMessageId: event.sg_message_id }
  });

  if (emailLog) {
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        openedAt: new Date(event.timestamp * 1000),
        openCount: { increment: 1 },
        metadata: {
          ...(emailLog.metadata as object || {}),
          lastOpenIp: event.ip,
          lastOpenUserAgent: event.useragent
        }
      }
    });

    logger.info({ emailLogId: emailLog.id }, 'Email open tracked');
  }
}

async function handleClick(event: SendGridEvent) {
  const emailLog = await prisma.emailLog.findFirst({
    where: { providerMessageId: event.sg_message_id }
  });

  if (emailLog) {
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        clickCount: { increment: 1 },
        metadata: {
          ...(emailLog.metadata as object || {}),
          lastClickUrl: event.url,
          lastClickIp: event.ip
        }
      }
    });

    logger.info({ emailLogId: emailLog.id, url: event.url }, 'Email click tracked');
  }
}

async function handleBounce(event: SendGridEvent) {
  const emailLog = await prisma.emailLog.findFirst({
    where: { providerMessageId: event.sg_message_id }
  });

  if (emailLog) {
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: 'BOUNCED',
        errorMessage: event.reason,
        metadata: {
          ...(emailLog.metadata as object || {}),
          bounceType: event.type,
          bounceClassification: event.bounce_classification
        }
      }
    });

    logger.info({
      emailLogId: emailLog.id,
      bounceType: event.type,
      reason: event.reason
    }, 'Email bounced');
  }

  // Update user's email validity status
  const user = await prisma.user.findFirst({
    where: { email: event.email }
  });

  if (user) {
    // Mark email as potentially invalid after hard bounces
    if (event.type === 'hard' || event.bounce_classification === 'Invalid Addresses') {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: false,
          metadata: {
            ...(user.metadata as object || {}),
            emailBounced: true,
            emailBounceDate: new Date().toISOString(),
            emailBounceReason: event.reason
          }
        }
      });

      logger.warn({ userId: user.id, email: event.email }, 'User email marked as invalid due to hard bounce');
    }
  }
}

async function handleDropped(event: SendGridEvent) {
  const emailLog = await prisma.emailLog.findFirst({
    where: { providerMessageId: event.sg_message_id }
  });

  if (emailLog) {
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: 'FAILED',
        errorMessage: event.reason
      }
    });

    logger.warn({
      emailLogId: emailLog.id,
      reason: event.reason
    }, 'Email dropped');
  }
}

async function handleSpamReport(event: SendGridEvent) {
  logger.warn({ email: event.email }, 'Spam report received');

  // Find user and update preferences
  const user = await prisma.user.findFirst({
    where: { email: event.email }
  });

  if (user) {
    // Update notification preferences to disable marketing emails
    await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: {
        marketingEmails: false,
        metadata: {
          spamReportDate: new Date().toISOString()
        }
      },
      create: {
        userId: user.id,
        marketingEmails: false,
        metadata: {
          spamReportDate: new Date().toISOString()
        }
      }
    });

    logger.info({ userId: user.id }, 'User unsubscribed from marketing due to spam report');
  }
}

async function handleUnsubscribe(event: SendGridEvent) {
  logger.info({ email: event.email }, 'Unsubscribe request received');

  const user = await prisma.user.findFirst({
    where: { email: event.email }
  });

  if (user) {
    await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: {
        marketingEmails: false,
        metadata: {
          unsubscribeDate: new Date().toISOString(),
          unsubscribeSource: 'sendgrid'
        }
      },
      create: {
        userId: user.id,
        marketingEmails: false,
        metadata: {
          unsubscribeDate: new Date().toISOString(),
          unsubscribeSource: 'sendgrid'
        }
      }
    });

    logger.info({ userId: user.id }, 'User unsubscribed from marketing emails');
  }
}

async function handleDeferred(event: SendGridEvent) {
  const emailLog = await prisma.emailLog.findFirst({
    where: { providerMessageId: event.sg_message_id }
  });

  if (emailLog) {
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: 'PENDING',
        metadata: {
          ...(emailLog.metadata as object || {}),
          deferredAt: new Date().toISOString(),
          deferredReason: event.response,
          deferredAttempt: event.attempt
        }
      }
    });

    logger.info({
      emailLogId: emailLog.id,
      attempt: event.attempt
    }, 'Email delivery deferred');
  }
}

// ============================================
// Inbound Email Handler (optional)
// ============================================

interface SendGridInboundEmail {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments?: number;
}

/**
 * Handle incoming emails via SendGrid Inbound Parse
 */
export async function handleInboundEmail(req: Request, res: Response) {
  try {
    const email = req.body as SendGridInboundEmail;

    logger.info({
      from: email.from,
      to: email.to,
      subject: email.subject
    }, 'Inbound email received');

    // Store incoming email
    await prisma.emailLog.create({
      data: {
        direction: 'INBOUND',
        to: email.to,
        from: email.from,
        subject: email.subject,
        body: email.text || email.html,
        status: 'RECEIVED',
        provider: 'SENDGRID'
      }
    });

    // You can add custom logic here to:
    // - Parse support tickets
    // - Handle auto-replies
    // - Route to specific handlers based on recipient

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error({ err: error }, 'Inbound email processing failed');
    res.status(500).json({ error: 'Processing failed' });
  }
}
