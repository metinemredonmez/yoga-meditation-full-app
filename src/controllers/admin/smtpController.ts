import type { Request, Response } from 'express';
import { config } from '../../utils/config';
import { sendEmail, verifyConnection } from '../../services/emailService';
import { logger } from '../../utils/logger';

/**
 * Get SMTP configuration status (not credentials)
 */
export async function getSmtpStatus(req: Request, res: Response) {
  try {
    const configured = !!config.SMTP_HOST;

    res.json({
      configured,
      host: configured ? config.SMTP_HOST : undefined,
      port: configured ? (config.SMTP_PORT ?? 587) : undefined,
      hasAuth: configured ? !!(config.SMTP_USER && config.SMTP_PASSWORD) : undefined,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to get SMTP status');
    res.status(500).json({ error: 'Failed to get SMTP status' });
  }
}

/**
 * Send a test email
 */
export async function sendTestEmail(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const result = await sendEmail({
      to: email,
      subject: 'Yoga App - Test E-postası',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test E-postası</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #6B46C1; margin-bottom: 10px;">Test E-postası</h1>
          </div>

          <p>Merhaba,</p>

          <p>Bu, Yoga App admin panelinden gönderilen bir test e-postasıdır.</p>

          <div style="background-color: #f0fff4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #48BB78;">
            <p style="margin: 0; color: #2F855A; font-weight: bold;">E-posta sisteminiz çalışıyor!</p>
          </div>

          <p>SMTP ayarlarınız doğru yapılandırılmış ve e-postalar başarıyla gönderilebiliyor.</p>

          <p>Namaste,<br>Yoga App Sistemi</p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #888; text-align: center;">
            Bu e-posta Yoga App admin panelinden gönderilmiştir.
          </p>
        </body>
        </html>
      `,
      text: `
Test E-postası

Merhaba,

Bu, Yoga App admin panelinden gönderilen bir test e-postasıdır.

E-posta sisteminiz çalışıyor!

SMTP ayarlarınız doğru yapılandırılmış ve e-postalar başarıyla gönderilebiliyor.

Namaste,
Yoga App Sistemi
      `,
    });

    if (result.delivered) {
      logger.info({ email, messageId: result.messageId }, 'Test email sent');

      // Check if it was logged to console (dev mode)
      if (result.reason?.includes('logged to console')) {
        return res.json({
          success: true,
          message: 'Test e-postası konsola yazıldı (SMTP yapılandırılmadı - dev mode)',
          devMode: true,
        });
      }

      return res.json({
        success: true,
        message: 'Test e-postası başarıyla gönderildi!',
        messageId: result.messageId,
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.reason || 'E-posta gönderilemedi',
      });
    }
  } catch (error) {
    logger.error({ err: error }, 'Failed to send test email');
    res.status(500).json({ error: 'Failed to send test email' });
  }
}

/**
 * Verify SMTP connection
 */
export async function verifySmtpConnection(req: Request, res: Response) {
  try {
    if (!config.SMTP_HOST) {
      return res.status(400).json({
        success: false,
        error: 'SMTP yapılandırılmadı',
      });
    }

    const isValid = await verifyConnection();

    if (isValid) {
      return res.json({
        success: true,
        message: 'SMTP bağlantısı başarılı!',
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'SMTP bağlantısı başarısız',
      });
    }
  } catch (error) {
    logger.error({ err: error }, 'Failed to verify SMTP connection');
    res.status(500).json({ error: 'Failed to verify SMTP connection' });
  }
}
