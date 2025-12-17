import { MessageChannel, ScheduledMessageStatus, Prisma } from '@prisma/client';
import { prisma } from '../utils/database';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import * as messageTemplateService from './messageTemplateService';
import * as unifiedMessagingService from './unifiedMessagingService';

// ============================================
// Welcome Messages
// ============================================

/**
 * Send welcome message immediately after registration
 */
export async function sendWelcomeMessage(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, email: true },
  });

  if (!user) {
    logger.warn({ userId }, 'User not found for welcome message');
    return;
  }

  const variables = {
    firstName: user.firstName || 'Değerli Üyemiz',
    appUrl: config.notification.frontendUrl,
  };

  try {
    const rendered = await messageTemplateService.renderTemplate('welcome_email', variables);

    // Send email
    await unifiedMessagingService.sendMessage({
      userId,
      channel: 'EMAIL',
      subject: rendered.subject,
      body: rendered.bodyText || '',
      bodyHtml: rendered.bodyHtml,
      templateId: 'welcome_email',
    });

    // Send push notification
    if (rendered.bodyPush) {
      await unifiedMessagingService.sendMessage({
        userId,
        channel: 'PUSH',
        subject: 'Hoş Geldiniz!',
        body: rendered.bodyPush,
      });
    }

    logger.info({ userId }, 'Welcome message sent');
  } catch (error) {
    logger.error({ error, userId }, 'Failed to send welcome message');
  }
}

/**
 * Schedule onboarding sequence (Day 1, 3, 7)
 */
export async function scheduleOnboardingSequence(userId: string): Promise<void> {
  const template = await prisma.messageTemplate.findUnique({
    where: { slug: 'welcome_email' },
  });

  if (!template) {
    logger.warn('Welcome email template not found');
    return;
  }

  const now = new Date();

  // Day 3: Getting started tips
  const day3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  await scheduleMessage(userId, 'welcome_email', day3, 'EMAIL', {
    type: 'onboarding_day3',
  });

  // Day 7: Check-in
  const day7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  await scheduleMessage(userId, 'welcome_email', day7, 'EMAIL', {
    type: 'onboarding_day7',
  });

  logger.info({ userId }, 'Onboarding sequence scheduled');
}

// ============================================
// Trial Notifications
// ============================================

/**
 * Schedule trial reminder messages
 */
export async function scheduleTrialReminders(
  userId: string,
  trialEndDate: Date,
): Promise<void> {
  const now = new Date();
  const trialDays = Math.ceil((trialEndDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true },
  });

  // Send trial started message immediately
  await sendTrialStartedMessage(userId, trialDays, trialEndDate);

  // 3 days before trial ends
  const day3Before = new Date(trialEndDate.getTime() - 3 * 24 * 60 * 60 * 1000);
  if (day3Before > now) {
    await scheduleMessage(userId, 'trial_ending_3days', day3Before, 'EMAIL');
  }

  // 1 day before trial ends
  const day1Before = new Date(trialEndDate.getTime() - 1 * 24 * 60 * 60 * 1000);
  if (day1Before > now) {
    await scheduleMessage(userId, 'trial_ending_1day', day1Before, 'EMAIL');
  }

  // Trial expired (scheduled for end date)
  await scheduleMessage(userId, 'trial_expired', trialEndDate, 'EMAIL');

  logger.info({ userId, trialEndDate }, 'Trial reminders scheduled');
}

/**
 * Send trial started message
 */
async function sendTrialStartedMessage(
  userId: string,
  trialDays: number,
  trialEndDate: Date,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true },
  });

  const variables = {
    firstName: user?.firstName || 'Değerli Üyemiz',
    trialDays: trialDays.toString(),
    trialEndDate: trialEndDate.toLocaleDateString('tr-TR'),
    appUrl: config.notification.frontendUrl,
  };

  try {
    const rendered = await messageTemplateService.renderTemplate('trial_started', variables);

    await unifiedMessagingService.sendMessage({
      userId,
      channel: 'EMAIL',
      subject: rendered.subject,
      body: rendered.bodyText || '',
      bodyHtml: rendered.bodyHtml,
    });

    logger.info({ userId }, 'Trial started message sent');
  } catch (error) {
    logger.error({ error, userId }, 'Failed to send trial started message');
  }
}

// ============================================
// Subscription Lifecycle
// ============================================

/**
 * Send subscription started notification
 */
export async function sendSubscriptionStarted(
  userId: string,
  planName: string,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true },
  });

  const variables = {
    firstName: user?.firstName || 'Değerli Üyemiz',
    planName,
    appUrl: config.notification.frontendUrl,
  };

  try {
    const rendered = await messageTemplateService.renderTemplate('subscription_started', variables);

    await unifiedMessagingService.sendMessage({
      userId,
      channel: 'EMAIL',
      subject: rendered.subject,
      body: rendered.bodyText || '',
      bodyHtml: rendered.bodyHtml,
    });

    if (rendered.bodyPush) {
      await unifiedMessagingService.sendMessage({
        userId,
        channel: 'PUSH',
        subject: 'Premium Aktif!',
        body: rendered.bodyPush,
      });
    }

    logger.info({ userId, planName }, 'Subscription started message sent');
  } catch (error) {
    logger.error({ error, userId }, 'Failed to send subscription started message');
  }
}

/**
 * Schedule renewal reminder (7 days before)
 */
export async function scheduleRenewalReminder(
  userId: string,
  renewalDate: Date,
  planName: string,
  amount: string,
): Promise<void> {
  const reminderDate = new Date(renewalDate.getTime() - 7 * 24 * 60 * 60 * 1000);

  if (reminderDate <= new Date()) {
    return; // Don't schedule if too late
  }

  await scheduleMessage(userId, 'subscription_renewing', reminderDate, 'EMAIL', {
    planName,
    renewalDate: renewalDate.toLocaleDateString('tr-TR'),
    amount,
  });

  logger.info({ userId, renewalDate }, 'Renewal reminder scheduled');
}

/**
 * Send subscription cancelled notification
 */
export async function sendSubscriptionCancelled(
  userId: string,
  endDate: Date,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true },
  });

  const variables = {
    firstName: user?.firstName || 'Değerli Üyemiz',
    endDate: endDate.toLocaleDateString('tr-TR'),
    appUrl: config.notification.frontendUrl,
  };

  try {
    const rendered = await messageTemplateService.renderTemplate('subscription_cancelled', variables);

    await unifiedMessagingService.sendMessage({
      userId,
      channel: 'EMAIL',
      subject: rendered.subject,
      body: rendered.bodyText || '',
      bodyHtml: rendered.bodyHtml,
    });

    logger.info({ userId }, 'Subscription cancelled message sent');
  } catch (error) {
    logger.error({ error, userId }, 'Failed to send subscription cancelled message');
  }
}

/**
 * Send subscription expired notification
 */
export async function sendSubscriptionExpired(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true },
  });

  const variables = {
    firstName: user?.firstName || 'Değerli Üyemiz',
    appUrl: config.notification.frontendUrl,
  };

  try {
    const rendered = await messageTemplateService.renderTemplate('subscription_expired', variables);

    await unifiedMessagingService.sendMessage({
      userId,
      channel: 'EMAIL',
      subject: rendered.subject,
      body: rendered.bodyText || '',
      bodyHtml: rendered.bodyHtml,
    });

    if (rendered.bodyPush) {
      await unifiedMessagingService.sendMessage({
        userId,
        channel: 'PUSH',
        subject: 'Premium Sona Erdi',
        body: rendered.bodyPush,
      });
    }

    logger.info({ userId }, 'Subscription expired message sent');
  } catch (error) {
    logger.error({ error, userId }, 'Failed to send subscription expired message');
  }
}

// ============================================
// Payment Notifications
// ============================================

/**
 * Send payment failed notification
 */
export async function sendPaymentFailed(
  userId: string,
  attemptNumber: number,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true },
  });

  const variables = {
    firstName: user?.firstName || 'Değerli Üyemiz',
    attemptNumber: attemptNumber.toString(),
    appUrl: config.notification.frontendUrl,
  };

  try {
    const rendered = await messageTemplateService.renderTemplate('payment_failed', variables);

    await unifiedMessagingService.sendMessage({
      userId,
      channel: 'EMAIL',
      subject: rendered.subject,
      body: rendered.bodyText || '',
      bodyHtml: rendered.bodyHtml,
    });

    if (rendered.bodyPush) {
      await unifiedMessagingService.sendMessage({
        userId,
        channel: 'PUSH',
        subject: 'Ödeme Başarısız',
        body: rendered.bodyPush,
      });
    }

    logger.info({ userId, attemptNumber }, 'Payment failed message sent');
  } catch (error) {
    logger.error({ error, userId }, 'Failed to send payment failed message');
  }
}

/**
 * Send payment retry scheduled notification
 */
export async function sendPaymentRetryScheduled(
  userId: string,
  retryDate: Date,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true },
  });

  const variables = {
    firstName: user?.firstName || 'Değerli Üyemiz',
    retryDate: retryDate.toLocaleDateString('tr-TR'),
    appUrl: config.notification.frontendUrl,
  };

  try {
    const rendered = await messageTemplateService.renderTemplate('payment_retry', variables);

    await unifiedMessagingService.sendMessage({
      userId,
      channel: 'EMAIL',
      subject: rendered.subject,
      body: rendered.bodyText || '',
      bodyHtml: rendered.bodyHtml,
    });

    logger.info({ userId, retryDate }, 'Payment retry scheduled message sent');
  } catch (error) {
    logger.error({ error, userId }, 'Failed to send payment retry scheduled message');
  }
}

/**
 * Send payment success notification
 */
export async function sendPaymentSuccess(
  userId: string,
  amount: string,
  invoiceUrl?: string,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true },
  });

  const variables = {
    firstName: user?.firstName || 'Değerli Üyemiz',
    amount,
    invoiceUrl: invoiceUrl || '#',
  };

  try {
    const rendered = await messageTemplateService.renderTemplate('payment_success', variables);

    await unifiedMessagingService.sendMessage({
      userId,
      channel: 'EMAIL',
      subject: rendered.subject,
      body: rendered.bodyText || '',
      bodyHtml: rendered.bodyHtml,
    });

    logger.info({ userId, amount }, 'Payment success message sent');
  } catch (error) {
    logger.error({ error, userId }, 'Failed to send payment success message');
  }
}

// ============================================
// Engagement Messages
// ============================================

/**
 * Send weekly digest
 */
export async function sendWeeklyDigest(
  userId: string,
  digestData: {
    completedSessions: number;
    totalMinutes: number;
    currentStreak: number;
    newContent?: string;
    recommendations?: string;
  },
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true },
  });

  // Get date range
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekRange = `${startDate.toLocaleDateString('tr-TR')} - ${endDate.toLocaleDateString('tr-TR')}`;

  const variables = {
    firstName: user?.firstName || 'Değerli Üyemiz',
    weekRange,
    completedSessions: digestData.completedSessions.toString(),
    totalMinutes: digestData.totalMinutes.toString(),
    currentStreak: digestData.currentStreak.toString(),
    newContent: digestData.newContent || '',
    recommendations: digestData.recommendations || '',
    appUrl: config.notification.frontendUrl,
  };

  try {
    const rendered = await messageTemplateService.renderTemplate('weekly_digest', variables);

    await unifiedMessagingService.sendMessage({
      userId,
      channel: 'EMAIL',
      subject: rendered.subject,
      body: rendered.bodyText || '',
      bodyHtml: rendered.bodyHtml,
    });

    logger.info({ userId }, 'Weekly digest sent');
  } catch (error) {
    logger.error({ error, userId }, 'Failed to send weekly digest');
  }
}

/**
 * Send monthly digest
 */
export async function sendMonthlyDigest(
  userId: string,
  digestData: {
    monthName: string;
    completedSessions: number;
    totalMinutes: number;
    longestStreak: number;
    programsStarted: number;
    achievements?: string;
    yearlyMinutes: number;
  },
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true },
  });

  const variables = {
    firstName: user?.firstName || 'Değerli Üyemiz',
    monthName: digestData.monthName,
    completedSessions: digestData.completedSessions.toString(),
    totalMinutes: digestData.totalMinutes.toString(),
    longestStreak: digestData.longestStreak.toString(),
    programsStarted: digestData.programsStarted.toString(),
    achievements: digestData.achievements || '',
    yearlyMinutes: digestData.yearlyMinutes.toString(),
    appUrl: config.notification.frontendUrl,
  };

  try {
    const rendered = await messageTemplateService.renderTemplate('monthly_digest', variables);

    await unifiedMessagingService.sendMessage({
      userId,
      channel: 'EMAIL',
      subject: rendered.subject,
      body: rendered.bodyText || '',
      bodyHtml: rendered.bodyHtml,
    });

    logger.info({ userId }, 'Monthly digest sent');
  } catch (error) {
    logger.error({ error, userId }, 'Failed to send monthly digest');
  }
}

/**
 * Send inactivity reminder
 */
export async function sendInactivityReminder(
  userId: string,
  daysSinceActive: number,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true },
  });

  let templateSlug: string;
  if (daysSinceActive >= 30) {
    templateSlug = 'inactivity_30days';
  } else if (daysSinceActive >= 14) {
    templateSlug = 'inactivity_14days';
  } else {
    templateSlug = 'inactivity_7days';
  }

  const variables = {
    firstName: user?.firstName || 'Değerli Üyemiz',
    appUrl: config.notification.frontendUrl,
  };

  try {
    const rendered = await messageTemplateService.renderTemplate(templateSlug, variables);

    await unifiedMessagingService.sendMessage({
      userId,
      channel: 'EMAIL',
      subject: rendered.subject,
      body: rendered.bodyText || '',
      bodyHtml: rendered.bodyHtml,
    });

    if (rendered.bodyPush) {
      await unifiedMessagingService.sendMessage({
        userId,
        channel: 'PUSH',
        subject: 'Seni Özledik!',
        body: rendered.bodyPush,
      });
    }

    logger.info({ userId, daysSinceActive }, 'Inactivity reminder sent');
  } catch (error) {
    logger.error({ error, userId }, 'Failed to send inactivity reminder');
  }
}

// ============================================
// Content & Challenge Messages
// ============================================

/**
 * Send challenge reminder
 */
export async function sendChallengeReminder(
  userId: string,
  challengeId: string,
  challengeName: string,
  progress: number,
  targetDays: number,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true },
  });

  const variables = {
    firstName: user?.firstName || 'Değerli Üyemiz',
    challengeName,
    challengeId,
    progress: progress.toString(),
    targetDays: targetDays.toString(),
    appUrl: config.notification.frontendUrl,
  };

  try {
    const rendered = await messageTemplateService.renderTemplate('challenge_reminder', variables);

    await unifiedMessagingService.sendMessage({
      userId,
      channel: 'EMAIL',
      subject: rendered.subject,
      body: rendered.bodyText || '',
      bodyHtml: rendered.bodyHtml,
    });

    if (rendered.bodyPush) {
      await unifiedMessagingService.sendMessage({
        userId,
        channel: 'PUSH',
        subject: 'Challenge Hatırlatması',
        body: rendered.bodyPush,
      });
    }

    logger.info({ userId, challengeId }, 'Challenge reminder sent');
  } catch (error) {
    logger.error({ error, userId }, 'Failed to send challenge reminder');
  }
}

/**
 * Send challenge completed notification
 */
export async function sendChallengeCompleted(
  userId: string,
  challengeName: string,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true },
  });

  const variables = {
    firstName: user?.firstName || 'Değerli Üyemiz',
    challengeName,
    appUrl: config.notification.frontendUrl,
  };

  try {
    const rendered = await messageTemplateService.renderTemplate('challenge_completed', variables);

    await unifiedMessagingService.sendMessage({
      userId,
      channel: 'EMAIL',
      subject: rendered.subject,
      body: rendered.bodyText || '',
      bodyHtml: rendered.bodyHtml,
    });

    if (rendered.bodyPush) {
      await unifiedMessagingService.sendMessage({
        userId,
        channel: 'PUSH',
        subject: 'Tebrikler!',
        body: rendered.bodyPush,
      });
    }

    logger.info({ userId, challengeName }, 'Challenge completed message sent');
  } catch (error) {
    logger.error({ error, userId }, 'Failed to send challenge completed message');
  }
}

/**
 * Send new content notification
 */
export async function sendNewContentNotification(
  userId: string,
  contentType: string,
  contentId: string,
  contentTitle: string,
  contentDescription?: string,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true },
  });

  const variables = {
    firstName: user?.firstName || 'Değerli Üyemiz',
    contentType,
    contentId,
    contentTitle,
    contentDescription: contentDescription || '',
    appUrl: config.notification.frontendUrl,
  };

  try {
    const rendered = await messageTemplateService.renderTemplate('new_content_available', variables);

    await unifiedMessagingService.sendMessage({
      userId,
      channel: 'EMAIL',
      subject: rendered.subject,
      body: rendered.bodyText || '',
      bodyHtml: rendered.bodyHtml,
    });

    if (rendered.bodyPush) {
      await unifiedMessagingService.sendMessage({
        userId,
        channel: 'PUSH',
        subject: 'Yeni İçerik',
        body: rendered.bodyPush,
      });
    }

    logger.info({ userId, contentType, contentId }, 'New content notification sent');
  } catch (error) {
    logger.error({ error, userId }, 'Failed to send new content notification');
  }
}

// ============================================
// Scheduling Helpers
// ============================================

/**
 * Schedule a message for later delivery
 */
export async function scheduleMessage(
  userId: string,
  templateSlug: string,
  scheduledAt: Date,
  channel: MessageChannel,
  metadata?: Record<string, unknown>,
): Promise<string> {
  const template = await prisma.messageTemplate.findUnique({
    where: { slug: templateSlug },
  });

  if (!template) {
    throw new Error(`Template not found: ${templateSlug}`);
  }

  const scheduled = await prisma.scheduledMessage.create({
    data: {
      templateId: template.id,
      userId,
      scheduledAt,
      channel,
      metadata: (metadata || {}) as Prisma.InputJsonValue,
      status: 'PENDING',
    },
  });

  logger.info({ userId, templateSlug, scheduledAt }, 'Message scheduled');

  return scheduled.id;
}

/**
 * Cancel a scheduled message
 */
export async function cancelScheduledMessage(messageId: string): Promise<void> {
  await prisma.scheduledMessage.update({
    where: { id: messageId },
    data: { status: 'CANCELLED' },
  });

  logger.info({ messageId }, 'Scheduled message cancelled');
}

/**
 * Cancel all scheduled messages for a user by template
 */
export async function cancelUserScheduledMessages(
  userId: string,
  templateSlug?: string,
): Promise<number> {
  const where: { userId: string; status: ScheduledMessageStatus; template?: { slug: string } } = {
    userId,
    status: 'PENDING',
  };

  if (templateSlug) {
    where.template = { slug: templateSlug };
  }

  const result = await prisma.scheduledMessage.updateMany({
    where,
    data: { status: 'CANCELLED' },
  });

  logger.info({ userId, templateSlug, count: result.count }, 'Scheduled messages cancelled');

  return result.count;
}

/**
 * Process due scheduled messages (called by cron job)
 */
export async function processScheduledMessages(): Promise<number> {
  const now = new Date();

  // Get all pending messages that are due
  const dueMessages = await prisma.scheduledMessage.findMany({
    where: {
      status: 'PENDING',
      scheduledAt: { lte: now },
    },
    include: {
      template: true,
      user: {
        select: { id: true, firstName: true, email: true },
      },
    },
    take: 100, // Process in batches
  });

  let processedCount = 0;

  for (const message of dueMessages) {
    try {
      // Check user preferences and quiet hours
      const canSend = await unifiedMessagingService.checkUserPreference(
        message.userId,
        message.template.category.toLowerCase(),
      );

      const isQuietHours = await unifiedMessagingService.isInQuietHours(message.userId);

      if (!canSend) {
        await prisma.scheduledMessage.update({
          where: { id: message.id },
          data: {
            status: 'CANCELLED',
            errorMessage: 'User opted out of this message type',
          },
        });
        continue;
      }

      if (isQuietHours) {
        // Reschedule for later
        const newScheduledAt = new Date(now.getTime() + 8 * 60 * 60 * 1000); // +8 hours
        await prisma.scheduledMessage.update({
          where: { id: message.id },
          data: { scheduledAt: newScheduledAt },
        });
        continue;
      }

      // Render template with metadata as variables
      const variables = {
        firstName: message.user.firstName || 'Değerli Üyemiz',
        appUrl: config.notification.frontendUrl,
        ...(message.metadata as Record<string, unknown> || {}),
      };

      const rendered = await messageTemplateService.renderTemplate(message.template.slug, variables);

      // Send message
      const result = await unifiedMessagingService.sendMessage({
        userId: message.userId,
        channel: message.channel,
        subject: rendered.subject,
        body: rendered.bodyText || rendered.bodyPush || rendered.bodySms || '',
        bodyHtml: rendered.bodyHtml,
        templateId: message.templateId,
      });

      await prisma.scheduledMessage.update({
        where: { id: message.id },
        data: {
          status: result.success ? 'SENT' : 'FAILED',
          sentAt: result.success ? new Date() : null,
          errorMessage: result.error || null,
          attempts: { increment: 1 },
        },
      });

      if (result.success) {
        processedCount++;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await prisma.scheduledMessage.update({
        where: { id: message.id },
        data: {
          status: 'FAILED',
          errorMessage,
          attempts: { increment: 1 },
        },
      });

      logger.error({ error, messageId: message.id }, 'Failed to process scheduled message');
    }
  }

  if (processedCount > 0) {
    logger.info({ processedCount }, 'Processed scheduled messages');
  }

  return processedCount;
}
