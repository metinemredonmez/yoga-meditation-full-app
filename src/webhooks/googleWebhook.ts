import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { isGoogleConfigured, parseRTDN } from '../utils/googlePlay';
import { logger } from '../utils/logger';
import { handleGoogleNotification } from '../services/googlePlayService';
import { config } from '../utils/config';

// Initialize OAuth2Client for JWT verification
const oAuth2Client = new OAuth2Client();

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
 * Verify Google Cloud Pub/Sub JWT token
 *
 * Validates the JWT token sent by Google Cloud Pub/Sub using Google's public keys.
 * Returns the decoded payload if valid, null otherwise.
 */
async function verifyGooglePubSubToken(token: string): Promise<{
  valid: boolean;
  email?: string;
  error?: string;
}> {
  try {
    // Google Pub/Sub tokens should be verified against Google's public keys
    // The audience should be the URL of this endpoint
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: token,
      audience: config.google?.pubsubAudience || undefined,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return { valid: false, error: 'Empty token payload' };
    }

    // Verify the email claim matches expected service account
    const email = payload.email;

    // Google Pub/Sub push requests come from a service account
    // Format: service-PROJECT_NUMBER@gcp-sa-pubsub.iam.gserviceaccount.com
    if (email && !email.endsWith('@gcp-sa-pubsub.iam.gserviceaccount.com')) {
      logger.warn({ email }, 'Google Pub/Sub token email is not from Pub/Sub service account');
      // Allow through but log - could be configured differently
    }

    // Verify token is not expired (verifyIdToken already checks this)
    // Verify issuer
    const issuer = payload.iss;
    if (issuer !== 'https://accounts.google.com' && issuer !== 'accounts.google.com') {
      return { valid: false, error: `Invalid issuer: ${issuer}` };
    }

    return { valid: true, email };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ err: error }, 'Google Pub/Sub JWT verification failed');
    return { valid: false, error: errorMessage };
  }
}

/**
 * Verify Google Cloud Pub/Sub push authentication
 *
 * This middleware verifies that the request comes from Google Cloud Pub/Sub
 * using proper JWT verification with Google's public keys.
 */
export async function verifyGooglePubSubAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Google Cloud Pub/Sub includes an authorization header with a JWT token
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Missing or invalid authorization header in Google webhook');
    // In development, we might want to skip verification
    if (config.NODE_ENV === 'development') {
      logger.warn('Skipping Google Pub/Sub auth verification in development');
      return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.substring(7);

  if (!token) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  // Verify the JWT token using Google's public keys
  const verification = await verifyGooglePubSubToken(token);

  if (!verification.valid) {
    logger.warn({ error: verification.error }, 'Google Pub/Sub token verification failed');

    // In development, allow through with warning
    if (config.NODE_ENV === 'development') {
      logger.warn('Allowing unverified request in development mode');
      return next();
    }

    res.status(401).json({ error: 'Invalid token', details: verification.error });
    return;
  }

  logger.debug({ email: verification.email }, 'Google Pub/Sub token verified');
  next();
}
