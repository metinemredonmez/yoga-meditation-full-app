import { Request, Response } from 'express';
import { isGoogleConfigured, parseRTDN } from '../utils/googlePlay';
import { logger } from '../utils/logger';
import { handleGoogleNotification } from '../services/googlePlayService';

/**
 * Handle Google Play Real-time Developer Notifications (RTDN)
 *
 * Google sends notifications via Cloud Pub/Sub to this endpoint.
 * Documentation: https://developer.android.com/google/play/billing/rtdn-reference
 */
export async function handleGoogleWebhook(req: Request, res: Response) {
  if (!isGoogleConfigured()) {
    logger.warn('Google webhook received but Google Play is not configured');
    return res.status(400).json({ error: 'Google Play not configured' });
  }

  try {
    // Google Cloud Pub/Sub sends the message in this format
    const message = req.body.message;

    if (!message) {
      logger.warn('No message in Google webhook request');
      return res.status(400).json({ error: 'Missing message' });
    }

    // The data is base64 encoded
    const data = message.data;
    if (!data) {
      logger.warn('No data in Google webhook message');
      return res.status(400).json({ error: 'Missing message data' });
    }

    // Decode the base64 data
    const decodedData = Buffer.from(data, 'base64').toString('utf-8');

    let rtdn;
    try {
      rtdn = JSON.parse(decodedData);
    } catch (parseError) {
      logger.error({ err: parseError, data: decodedData }, 'Failed to parse Google RTDN data');
      return res.status(400).json({ error: 'Invalid JSON data' });
    }

    logger.info({ rtdn }, 'Google webhook received');

    // Process the notification
    const result = await handleGoogleNotification(rtdn);

    if (result.handled) {
      logger.info(
        { notificationType: result.notificationType },
        'Google webhook processed successfully'
      );
      // Return 200 to acknowledge receipt (prevents retry)
      return res.status(200).json({ success: true });
    } else {
      logger.warn('Google webhook could not be processed');
      // Still return 200 to prevent infinite retries for unhandled notifications
      return res.status(200).json({ success: true, handled: false });
    }
  } catch (error) {
    logger.error({ err: error }, 'Error processing Google webhook');
    // Return 500 to trigger retry
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

/**
 * Handle Google Play Voided Purchases
 *
 * This endpoint receives voided purchase notifications.
 * Can be used to revoke access for refunded purchases.
 */
export async function handleGoogleVoidedPurchases(req: Request, res: Response) {
  if (!isGoogleConfigured()) {
    logger.warn('Google voided purchases webhook received but Google Play is not configured');
    return res.status(400).json({ error: 'Google Play not configured' });
  }

  try {
    const { voidedPurchases } = req.body;

    if (!voidedPurchases || !Array.isArray(voidedPurchases)) {
      logger.warn('Invalid voided purchases payload');
      return res.status(400).json({ error: 'Invalid payload' });
    }

    logger.info({ count: voidedPurchases.length }, 'Google voided purchases received');

    for (const voidedPurchase of voidedPurchases) {
      const {
        purchaseToken,
        purchaseTimeMillis,
        voidedTimeMillis,
        orderId,
        voidedSource,
        voidedReason,
      } = voidedPurchase;

      logger.info(
        {
          purchaseToken,
          orderId,
          voidedSource,
          voidedReason,
          purchaseTime: purchaseTimeMillis ? new Date(parseInt(purchaseTimeMillis, 10)) : null,
          voidedTime: voidedTimeMillis ? new Date(parseInt(voidedTimeMillis, 10)) : null,
        },
        'Processing voided purchase'
      );

      // Create a synthetic RTDN to process the voided purchase
      const syntheticRtdn = {
        packageName: req.body.packageName,
        subscriptionNotification: {
          notificationType: 12, // SUBSCRIPTION_REVOKED
          purchaseToken,
          subscriptionId: voidedPurchase.productId,
        },
      };

      // Encode as base64 string as expected by handleGoogleNotification
      const encodedRtdn = Buffer.from(JSON.stringify(syntheticRtdn)).toString('base64');
      await handleGoogleNotification(encodedRtdn);
    }

    return res.status(200).json({ success: true, processed: voidedPurchases.length });
  } catch (error) {
    logger.error({ err: error }, 'Error processing Google voided purchases');
    return res.status(500).json({ error: 'Processing failed' });
  }
}

/**
 * Verify Google Cloud Pub/Sub push authentication
 *
 * This middleware verifies that the request comes from Google Cloud Pub/Sub
 */
export function verifyGooglePubSubAuth(req: Request, res: Response, next: Function) {
  // Google Cloud Pub/Sub includes an authorization header with a JWT token
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Missing or invalid authorization header in Google webhook');
    // In development, we might want to skip verification
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Skipping Google Pub/Sub auth verification in development');
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);

  // In production, you should verify the JWT token
  // The token is signed by Google and contains claims about the sender
  // For now, we just check that a token exists
  // TODO: Implement proper JWT verification using Google's public keys

  if (!token) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Token exists, proceed
  // In production, decode and verify the token
  next();
}
