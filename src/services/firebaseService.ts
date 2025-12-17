import admin from 'firebase-admin';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

let firebaseApp: admin.app.App | null = null;

export function isFirebaseConfigured(): boolean {
  return !!(
    config.FIREBASE_PROJECT_ID &&
    config.FIREBASE_CLIENT_EMAIL &&
    config.FIREBASE_PRIVATE_KEY
  );
}

export function initializeFirebase(): admin.app.App | null {
  if (firebaseApp) {
    return firebaseApp;
  }

  if (!isFirebaseConfigured()) {
    logger.warn('Firebase configuration is missing - push notifications will be disabled');
    return null;
  }

  try {
    // Handle escaped newlines in private key from env
    const privateKey = config.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!config.FIREBASE_PROJECT_ID || !config.FIREBASE_CLIENT_EMAIL || !privateKey) {
      logger.warn('Firebase configuration incomplete');
      return null;
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.FIREBASE_PROJECT_ID,
        clientEmail: config.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });

    logger.info(
      { projectId: config.FIREBASE_PROJECT_ID },
      'Firebase Admin SDK initialized successfully',
    );

    return firebaseApp;
  } catch (error) {
    logger.error({ err: error }, 'Failed to initialize Firebase Admin SDK');
    return null;
  }
}

export function getFirebaseApp(): admin.app.App | null {
  if (!firebaseApp) {
    return initializeFirebase();
  }
  return firebaseApp;
}

export function getMessaging(): admin.messaging.Messaging | null {
  const app = getFirebaseApp();
  if (!app) {
    return null;
  }
  return admin.messaging(app);
}
