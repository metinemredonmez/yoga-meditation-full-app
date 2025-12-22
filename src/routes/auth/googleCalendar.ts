import { Router, Request, Response } from 'express';
import { google } from 'googleapis';
import { prisma } from '../../utils/database';
import { authenticateToken } from '../../middleware/auth';
import { logger } from '../../utils/logger';

const router = Router();

// Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CALENDAR_CLIENT_ID,
  process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
  process.env.GOOGLE_CALENDAR_REDIRECT_URI
);

// Scopes for Google Calendar
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
];

// GET /api/auth/google/calendar - Start OAuth flow
router.get('/', authenticateToken, (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Generate auth URL with state parameter (userId for callback)
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      state: userId, // Pass userId to callback
      prompt: 'consent', // Force consent to get refresh token
    });

    res.json({ success: true, authUrl });
  } catch (error) {
    logger.error({ err: error }, 'Failed to generate Google auth URL');
    res.status(500).json({ success: false, error: 'Failed to start OAuth flow' });
  }
});

// GET /api/auth/google/calendar/callback - OAuth callback
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state: userId } = req.query;

    if (!code || !userId) {
      return res.redirect(`${process.env.CORS_ORIGINS?.split(',')[0] || 'http://localhost:3000'}/instructor/settings?calendar=error&message=missing_params`);
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    // Get user email from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const googleEmail = userInfo.data.email;

    // Get current user integrations
    const user = await prisma.users.findUnique({
      where: { id: userId as string },
      select: { integrations: true },
    });

    const integrations = (user?.integrations as any) || {};

    // Store tokens in user's integrations
    integrations.googleCalendar = {
      connected: true,
      syncEnabled: true,
      email: googleEmail,
      connectedAt: new Date().toISOString(),
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
    };

    await prisma.users.update({
      where: { id: userId as string },
      data: { integrations },
    });

    logger.info({ userId, googleEmail }, 'Google Calendar connected successfully');

    // Redirect back to frontend settings page
    const frontendUrl = process.env.CORS_ORIGINS?.split(',')[0] || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/instructor/settings?tab=calendar&calendar=success`);
  } catch (error) {
    logger.error({ err: error }, 'Google Calendar OAuth callback failed');
    const frontendUrl = process.env.CORS_ORIGINS?.split(',')[0] || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/instructor/settings?tab=calendar&calendar=error`);
  }
});

// POST /api/auth/google/calendar/disconnect - Disconnect Google Calendar
router.post('/disconnect', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { integrations: true },
    });

    const integrations = (user?.integrations as any) || {};

    // Revoke token if exists
    if (integrations.googleCalendar?.accessToken) {
      try {
        await oauth2Client.revokeToken(integrations.googleCalendar.accessToken);
      } catch (e) {
        // Token might already be invalid, continue anyway
        logger.warn({ err: e }, 'Failed to revoke Google token');
      }
    }

    // Clear Google Calendar integration
    integrations.googleCalendar = { connected: false };

    await prisma.users.update({
      where: { id: userId },
      data: { integrations },
    });

    res.json({
      success: true,
      message: 'Google Calendar disconnected',
      data: {
        googleCalendar: { connected: false, email: null, syncEnabled: false },
        appleCalendar: {
          connected: !!integrations.appleCalendar?.connected,
          syncEnabled: integrations.appleCalendar?.syncEnabled || false,
        },
        outlook: {
          connected: !!integrations.outlook?.connected,
          email: integrations.outlook?.email || null,
          syncEnabled: integrations.outlook?.syncEnabled || false,
        },
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to disconnect Google Calendar');
    res.status(500).json({ success: false, error: 'Failed to disconnect' });
  }
});

// POST /api/auth/google/calendar/sync - Toggle sync
router.post('/sync', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { enabled } = req.body;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { integrations: true },
    });

    const integrations = (user?.integrations as any) || {};

    if (integrations.googleCalendar) {
      integrations.googleCalendar.syncEnabled = enabled;
    }

    await prisma.users.update({
      where: { id: userId },
      data: { integrations },
    });

    res.json({
      success: true,
      message: enabled ? 'Sync enabled' : 'Sync disabled',
      data: {
        googleCalendar: {
          connected: !!integrations.googleCalendar?.connected,
          email: integrations.googleCalendar?.email || null,
          syncEnabled: enabled,
        },
        appleCalendar: {
          connected: !!integrations.appleCalendar?.connected,
          syncEnabled: integrations.appleCalendar?.syncEnabled || false,
        },
        outlook: {
          connected: !!integrations.outlook?.connected,
          email: integrations.outlook?.email || null,
          syncEnabled: integrations.outlook?.syncEnabled || false,
        },
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to toggle Google Calendar sync');
    res.status(500).json({ success: false, error: 'Failed to toggle sync' });
  }
});

// Helper function to get authenticated calendar client for a user
export async function getGoogleCalendarClient(userId: string) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { integrations: true },
  });

  const integrations = (user?.integrations as any) || {};
  const googleCal = integrations.googleCalendar;

  if (!googleCal?.connected || !googleCal?.accessToken) {
    return null;
  }

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    process.env.GOOGLE_CALENDAR_REDIRECT_URI
  );

  client.setCredentials({
    access_token: googleCal.accessToken,
    refresh_token: googleCal.refreshToken,
    expiry_date: googleCal.expiryDate,
  });

  // Handle token refresh
  client.on('tokens', async (tokens) => {
    if (tokens.refresh_token) {
      integrations.googleCalendar.refreshToken = tokens.refresh_token;
    }
    integrations.googleCalendar.accessToken = tokens.access_token;
    integrations.googleCalendar.expiryDate = tokens.expiry_date;

    await prisma.users.update({
      where: { id: userId },
      data: { integrations },
    });
  });

  return google.calendar({ version: 'v3', auth: client });
}

// POST /api/auth/google/calendar/create-event - Create event in Google Calendar
router.post('/create-event', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { summary, description, startTime, endTime, location } = req.body;

    const calendar = await getGoogleCalendarClient(userId);

    if (!calendar) {
      return res.status(400).json({ success: false, error: 'Google Calendar not connected' });
    }

    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary,
        description,
        location,
        start: {
          dateTime: startTime,
          timeZone: 'Europe/Istanbul',
        },
        end: {
          dateTime: endTime,
          timeZone: 'Europe/Istanbul',
        },
      },
    });

    res.json({
      success: true,
      data: {
        eventId: event.data.id,
        htmlLink: event.data.htmlLink,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to create Google Calendar event');
    res.status(500).json({ success: false, error: 'Failed to create event' });
  }
});

export default router;
