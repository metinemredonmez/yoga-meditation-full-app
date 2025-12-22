import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

// Transporter - lazy initialization
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    if (!config.SMTP_HOST) {
      throw new Error('SMTP_HOST is not configured');
    }

    transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT ?? 587,
      secure: config.SMTP_PORT === 465, // true for 465, false for other ports
      auth:
        config.SMTP_USER && config.SMTP_PASSWORD
          ? {
              user: config.SMTP_USER,
              pass: config.SMTP_PASSWORD,
            }
          : undefined,
    });

    logger.info(
      {
        host: config.SMTP_HOST,
        port: config.SMTP_PORT ?? 587,
        secure: config.SMTP_PORT === 465,
        hasAuth: !!(config.SMTP_USER && config.SMTP_PASSWORD),
      },
      'SMTP transporter initialized',
    );
  }

  return transporter;
}

export interface EmailPayload {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResult {
  delivered: boolean;
  messageId?: string;
  reason?: string;
}

const DEFAULT_FROM = config.SMTP_FROM ?? 'Yoga App <noreply@yogaapp.com>';

export async function sendEmail({
  to,
  subject,
  text,
  html,
  from = DEFAULT_FROM,
  replyTo,
}: EmailPayload): Promise<EmailResult> {
  // Check if SMTP is configured
  if (!config.SMTP_HOST) {
    // In development, log email content to console for testing
    logger.info(
      {
        to,
        subject,
        from,
        textPreview: text?.substring(0, 200),
      },
      '📧 DEV MODE: Email would be sent (SMTP not configured)',
    );

    // Log the full email content in development
    console.log('\n' + '='.repeat(60));
    console.log('📧 EMAIL PREVIEW (SMTP not configured)');
    console.log('='.repeat(60));
    console.log(`To: ${Array.isArray(to) ? to.join(', ') : to}`);
    console.log(`Subject: ${subject}`);
    console.log(`From: ${from}`);
    console.log('-'.repeat(60));
    console.log('Text Content:');
    console.log(text || '(no text content)');
    console.log('='.repeat(60) + '\n');

    return {
      delivered: true, // Return true so the flow continues in dev
      reason: 'SMTP not configured - logged to console',
      messageId: `dev-${Date.now()}`,
    };
  }

  try {
    const transport = getTransporter();

    const info = await transport.sendMail({
      from,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      text,
      html,
      replyTo,
    });

    logger.info(
      {
        messageId: info.messageId,
        to,
        subject,
        accepted: info.accepted,
        rejected: info.rejected,
      },
      'Email sent successfully',
    );

    return {
      delivered: true,
      messageId: info.messageId,
    };
  } catch (error) {
    logger.error(
      {
        err: error,
        to,
        subject,
      },
      'Failed to send email',
    );

    return {
      delivered: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function verifyConnection(): Promise<boolean> {
  if (!config.SMTP_HOST) {
    logger.warn('SMTP not configured - cannot verify connection');
    return false;
  }

  try {
    const transport = getTransporter();
    await transport.verify();
    logger.info('SMTP connection verified successfully');
    return true;
  } catch (error) {
    logger.error({ err: error }, 'SMTP connection verification failed');
    return false;
  }
}

// Email template helpers
export function sendWelcomeEmail(to: string, firstName: string): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: 'Welcome to Yoga App! 🧘',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Yoga App</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #6B46C1; margin-bottom: 10px;">Welcome to Yoga App</h1>
        </div>

        <p>Hi ${firstName || 'there'},</p>

        <p>Welcome to Yoga App! We're excited to have you join our community.</p>

        <p>With Yoga App, you can:</p>
        <ul>
          <li>Access hundreds of yoga sessions for all levels</li>
          <li>Join challenges and track your progress</li>
          <li>Create your personalized practice schedule</li>
          <li>Learn new poses with detailed instructions</li>
        </ul>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard"
             style="background-color: #6B46C1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Start Your Journey
          </a>
        </div>

        <p>If you have any questions, feel free to reach out to our support team.</p>

        <p>Namaste,<br>The Yoga App Team</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #888; text-align: center;">
          You received this email because you signed up for Yoga App.
        </p>
      </body>
      </html>
    `,
    text: `
Welcome to Yoga App!

Hi ${firstName || 'there'},

Welcome to Yoga App! We're excited to have you join our community.

With Yoga App, you can:
- Access hundreds of yoga sessions for all levels
- Join challenges and track your progress
- Create your personalized practice schedule
- Learn new poses with detailed instructions

Start your journey: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard

If you have any questions, feel free to reach out to our support team.

Namaste,
The Yoga App Team
    `,
  });
}

export function sendPasswordResetEmail(
  to: string,
  firstName: string,
  resetUrl: string,
  expiryHours = 1,
): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: 'Reset Your Password - Yoga App',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #6B46C1; margin-bottom: 10px;">Password Reset Request</h1>
        </div>

        <p>Hi ${firstName || 'there'},</p>

        <p>You requested to reset your password for your Yoga App account. Click the button below to set a new password:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background-color: #6B46C1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>

        <p style="color: #666; font-size: 14px;">This link will expire in ${expiryHours} hour(s).</p>

        <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>

        <p>Namaste,<br>The Yoga App Team</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #888; text-align: center;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color: #6B46C1;">${resetUrl}</a>
        </p>
      </body>
      </html>
    `,
    text: `
Password Reset Request

Hi ${firstName || 'there'},

You requested to reset your password for your Yoga App account.

Reset your password using this link:
${resetUrl}

This link will expire in ${expiryHours} hour(s).

If you didn't request this password reset, you can safely ignore this email.

Namaste,
The Yoga App Team
    `,
  });
}

export function sendReminderEmail(
  to: string,
  firstName: string,
  sessionTitle: string,
  scheduledTime: Date,
): Promise<EmailResult> {
  const formattedTime = scheduledTime.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return sendEmail({
    to,
    subject: `Reminder: ${sessionTitle} - Yoga App`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Session Reminder</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #6B46C1; margin-bottom: 10px;">Session Reminder</h1>
        </div>

        <p>Hi ${firstName || 'there'},</p>

        <p>This is a friendly reminder about your upcoming yoga session:</p>

        <div style="background-color: #f7f7f7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #6B46C1; margin: 0 0 10px 0;">${sessionTitle}</h2>
          <p style="margin: 0; color: #666;">📅 ${formattedTime}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/planner"
             style="background-color: #6B46C1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View My Schedule
          </a>
        </div>

        <p>Get ready to practice and enjoy your session!</p>

        <p>Namaste,<br>The Yoga App Team</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #888; text-align: center;">
          You received this reminder because you scheduled this session in Yoga App.
        </p>
      </body>
      </html>
    `,
    text: `
Session Reminder

Hi ${firstName || 'there'},

This is a friendly reminder about your upcoming yoga session:

${sessionTitle}
📅 ${formattedTime}

View your schedule: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/planner

Get ready to practice and enjoy your session!

Namaste,
The Yoga App Team
    `,
  });
}

export function sendChallengeCompletedEmail(
  to: string,
  firstName: string,
  challengeTitle: string,
  completedDays: number,
): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: `🎉 Congratulations! You completed ${challengeTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Challenge Completed!</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #6B46C1; margin-bottom: 10px;">🎉 Challenge Completed!</h1>
        </div>

        <p>Hi ${firstName || 'there'},</p>

        <p>Congratulations! You've successfully completed the <strong>${challengeTitle}</strong> challenge!</p>

        <div style="background-color: #f0fff4; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #48BB78;">
          <h2 style="color: #2F855A; margin: 0 0 10px 0;">🏆 Achievement Unlocked</h2>
          <p style="margin: 0; font-size: 24px; font-weight: bold; color: #2F855A;">${completedDays} Days</p>
          <p style="margin: 5px 0 0 0; color: #666;">of dedicated practice</p>
        </div>

        <p>Your dedication and commitment to your yoga practice is truly inspiring. Keep up the amazing work!</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/challenges"
             style="background-color: #6B46C1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Explore More Challenges
          </a>
        </div>

        <p>Namaste,<br>The Yoga App Team</p>
      </body>
      </html>
    `,
    text: `
🎉 Challenge Completed!

Hi ${firstName || 'there'},

Congratulations! You've successfully completed the ${challengeTitle} challenge!

🏆 Achievement Unlocked
${completedDays} Days of dedicated practice

Your dedication and commitment to your yoga practice is truly inspiring. Keep up the amazing work!

Explore more challenges: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/challenges

Namaste,
The Yoga App Team
    `,
  });
}
