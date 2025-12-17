import { Request, Response } from 'express';
import { isAppleConfigured } from '../utils/appleIAP';
import { logger } from '../utils/logger';
import { handleAppleNotification } from '../services/appleIAPService';

/**
 * Handle Apple App Store Server Notifications V2
 *
 * Apple sends notifications to this endpoint when subscription events occur.
 * Documentation: https://developer.apple.com/documentation/appstoreservernotifications
 */
export async function handleAppleWebhook(req: Request, res: Response) {
  if (!isAppleConfigured()) {
    logger.warn('Apple webhook received but Apple IAP is not configured');
    return res.status(400).json({ error: 'Apple IAP not configured' });
  }

  try {
    // Apple sends the signed payload in the request body
    const { signedPayload } = req.body;

    if (!signedPayload) {
      logger.warn('No signedPayload in Apple webhook request');
      return res.status(400).json({ error: 'Missing signedPayload' });
    }

    logger.info('Apple webhook received');

    // Process the notification
    const result = await handleAppleNotification(signedPayload);

    if (result.handled) {
      logger.info({ notificationType: result.notificationType }, 'Apple webhook processed successfully');
      return res.status(200).json({ success: true });
    } else {
      logger.warn('Apple webhook could not be processed');
      return res.status(400).json({ error: 'Could not process notification' });
    }
  } catch (error) {
    logger.error({ err: error }, 'Error processing Apple webhook');
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

/**
 * Handle Apple App Store Server Notifications V1 (Legacy)
 *
 * This handler is for backwards compatibility with V1 notifications.
 * New implementations should use V2 (handleAppleWebhook).
 */
export async function handleAppleWebhookV1(req: Request, res: Response) {
  if (!isAppleConfigured()) {
    logger.warn('Apple V1 webhook received but Apple IAP is not configured');
    return res.status(400).json({ error: 'Apple IAP not configured' });
  }

  try {
    const notification = req.body;

    if (!notification || !notification.notification_type) {
      logger.warn('Invalid Apple V1 webhook payload');
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const notificationType = notification.notification_type;
    logger.info({ notificationType }, 'Apple V1 webhook received');

    // V1 notifications have different structure
    // We log them but recommend migrating to V2
    logger.warn(
      { notificationType },
      'Apple V1 notifications are deprecated. Please migrate to App Store Server Notifications V2.'
    );

    // Handle V1 notification types
    switch (notificationType) {
      case 'INITIAL_BUY':
        logger.info('V1: Initial purchase detected');
        break;
      case 'CANCEL':
        logger.info('V1: Subscription cancelled');
        break;
      case 'RENEWAL':
        logger.info('V1: Subscription renewed');
        break;
      case 'INTERACTIVE_RENEWAL':
        logger.info('V1: Interactive renewal');
        break;
      case 'DID_CHANGE_RENEWAL_PREF':
        logger.info('V1: Renewal preference changed');
        break;
      case 'DID_CHANGE_RENEWAL_STATUS':
        logger.info('V1: Renewal status changed');
        break;
      case 'DID_FAIL_TO_RENEW':
        logger.info('V1: Renewal failed');
        break;
      case 'DID_RECOVER':
        logger.info('V1: Subscription recovered');
        break;
      case 'REFUND':
        logger.info('V1: Refund processed');
        break;
      default:
        logger.info({ notificationType }, 'V1: Unknown notification type');
    }

    // For V1 notifications, we need to verify the receipt to get current status
    // This is handled separately by client apps calling our verify endpoint

    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error({ err: error }, 'Error processing Apple V1 webhook');
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
