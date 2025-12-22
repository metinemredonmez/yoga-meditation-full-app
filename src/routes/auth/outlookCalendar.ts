import { Router, Request, Response } from 'express';
import { prisma } from '../../utils/database';
import { authenticateToken } from '../../middleware/auth';
import { logger } from '../../utils/logger';
import axios from 'axios';

const router = Router();

// Microsoft OAuth endpoints
const MICROSOFT_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const MICROSOFT_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const MICROSOFT_GRAPH_URL = 'https://graph.microsoft.com/v1.0';

// Scopes for Outlook Calendar
const SCOPES = [
  'openid',
  'profile',
  'email',
  'offline_access',
  'Calendars.ReadWrite',
  'User.Read',
];

// GET /api/auth/outlook/calendar - Start OAuth flow
router.get('/', authenticateToken, (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const params = new URLSearchParams({
      client_id: process.env.OUTLOOK_CLIENT_ID!,
      response_type: 'code',
      redirect_uri: process.env.OUTLOOK_REDIRECT_URI!,
      scope: SCOPES.join(' '),
      state: userId,
      response_mode: 'query',
    });

    const authUrl = `${MICROSOFT_AUTH_URL}?${params.toString()}`;
    res.json({ success: true, authUrl });
  } catch (error) {
    logger.error({ err: error }, 'Failed to generate Outlook auth URL');
    res.status(500).json({ success: false, error: 'Failed to start OAuth flow' });
  }
});

// GET /api/auth/outlook/calendar/callback - OAuth callback
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state: userId, error: oauthError } = req.query;

    const frontendUrl = process.env.CORS_ORIGINS?.split(',')[0] || 'http://localhost:3000';

    if (oauthError) {
      logger.error({ oauthError }, 'Outlook OAuth error');
      return res.redirect(`${frontendUrl}/instructor/settings?tab=calendar&calendar=error`);
    }

    if (!code || !userId) {
      return res.redirect(`${frontendUrl}/instructor/settings?tab=calendar&calendar=error&message=missing_params`);
    }

    // Exchange code for tokens
    const tokenResponse = await axios.post(
      MICROSOFT_TOKEN_URL,
      new URLSearchParams({
        client_id: process.env.OUTLOOK_CLIENT_ID!,
        client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
        code: code as string,
        redirect_uri: process.env.OUTLOOK_REDIRECT_URI!,
        grant_type: 'authorization_code',
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Get user info from Microsoft Graph
    const userResponse = await axios.get(`${MICROSOFT_GRAPH_URL}/me`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const outlookEmail = userResponse.data.mail || userResponse.data.userPrincipalName;

    // Get current user integrations
    const user = await prisma.users.findUnique({
      where: { id: userId as string },
      select: { integrations: true },
    });

    const integrations = (user?.integrations as any) || {};

    // Store tokens in user's integrations
    integrations.outlook = {
      connected: true,
      syncEnabled: true,
      email: outlookEmail,
      connectedAt: new Date().toISOString(),
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: new Date(Date.now() + expires_in * 1000).toISOString(),
    };

    await prisma.users.update({
      where: { id: userId as string },
      data: { integrations },
    });

    logger.info({ userId, outlookEmail }, 'Outlook Calendar connected successfully');

    res.redirect(`${frontendUrl}/instructor/settings?tab=calendar&calendar=outlook_success`);
  } catch (error) {
    logger.error({ err: error }, 'Outlook Calendar OAuth callback failed');
    const frontendUrl = process.env.CORS_ORIGINS?.split(',')[0] || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/instructor/settings?tab=calendar&calendar=error`);
  }
});

// POST /api/auth/outlook/calendar/disconnect - Disconnect Outlook Calendar
router.post('/disconnect', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { integrations: true },
    });

    const integrations = (user?.integrations as any) || {};

    // Clear Outlook integration
    integrations.outlook = { connected: false };

    await prisma.users.update({
      where: { id: userId },
      data: { integrations },
    });

    res.json({
      success: true,
      message: 'Outlook Calendar disconnected',
      data: {
        googleCalendar: {
          connected: !!integrations.googleCalendar?.connected,
          email: integrations.googleCalendar?.email || null,
          syncEnabled: integrations.googleCalendar?.syncEnabled || false,
        },
        appleCalendar: {
          connected: !!integrations.appleCalendar?.connected,
          syncEnabled: integrations.appleCalendar?.syncEnabled || false,
        },
        outlook: { connected: false, email: null, syncEnabled: false },
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to disconnect Outlook Calendar');
    res.status(500).json({ success: false, error: 'Failed to disconnect' });
  }
});

// POST /api/auth/outlook/calendar/sync - Toggle sync
router.post('/sync', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { enabled } = req.body;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { integrations: true },
    });

    const integrations = (user?.integrations as any) || {};

    if (integrations.outlook) {
      integrations.outlook.syncEnabled = enabled;
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
          syncEnabled: integrations.googleCalendar?.syncEnabled || false,
        },
        appleCalendar: {
          connected: !!integrations.appleCalendar?.connected,
          syncEnabled: integrations.appleCalendar?.syncEnabled || false,
        },
        outlook: {
          connected: !!integrations.outlook?.connected,
          email: integrations.outlook?.email || null,
          syncEnabled: enabled,
        },
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to toggle Outlook Calendar sync');
    res.status(500).json({ success: false, error: 'Failed to toggle sync' });
  }
});

// Helper function to refresh Outlook token
async function refreshOutlookToken(userId: string): Promise<string | null> {
  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { integrations: true },
    });

    const integrations = (user?.integrations as any) || {};
    const outlook = integrations.outlook;

    if (!outlook?.refreshToken) {
      return null;
    }

    const tokenResponse = await axios.post(
      MICROSOFT_TOKEN_URL,
      new URLSearchParams({
        client_id: process.env.OUTLOOK_CLIENT_ID!,
        client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
        refresh_token: outlook.refreshToken,
        grant_type: 'refresh_token',
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    integrations.outlook.accessToken = access_token;
    if (refresh_token) {
      integrations.outlook.refreshToken = refresh_token;
    }
    integrations.outlook.expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    await prisma.users.update({
      where: { id: userId },
      data: { integrations },
    });

    return access_token;
  } catch (error) {
    logger.error({ err: error }, 'Failed to refresh Outlook token');
    return null;
  }
}

// POST /api/auth/outlook/calendar/create-event - Create event in Outlook Calendar
router.post('/create-event', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { summary, description, startTime, endTime, location } = req.body;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { integrations: true },
    });

    const integrations = (user?.integrations as any) || {};
    const outlook = integrations.outlook;

    if (!outlook?.connected || !outlook?.accessToken) {
      return res.status(400).json({ success: false, error: 'Outlook Calendar not connected' });
    }

    let accessToken = outlook.accessToken;

    // Check if token is expired and refresh if needed
    if (new Date(outlook.expiresAt) < new Date()) {
      accessToken = await refreshOutlookToken(userId);
      if (!accessToken) {
        return res.status(401).json({ success: false, error: 'Failed to refresh token' });
      }
    }

    const eventResponse = await axios.post(
      `${MICROSOFT_GRAPH_URL}/me/events`,
      {
        subject: summary,
        body: {
          contentType: 'HTML',
          content: description || '',
        },
        start: {
          dateTime: startTime,
          timeZone: 'Europe/Istanbul',
        },
        end: {
          dateTime: endTime,
          timeZone: 'Europe/Istanbul',
        },
        location: location ? { displayName: location } : undefined,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({
      success: true,
      data: {
        eventId: eventResponse.data.id,
        webLink: eventResponse.data.webLink,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to create Outlook Calendar event');
    res.status(500).json({ success: false, error: 'Failed to create event' });
  }
});

export default router;
