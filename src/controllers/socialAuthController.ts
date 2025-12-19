import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import { prisma } from '../utils/database';
import { generateAccessToken, generateRefreshToken, JWTPayload } from '../utils/jwt';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { z } from 'zod';

// Validation schemas
const googleLoginSchema = z.object({
  idToken: z.string().min(1, 'ID token is required'),
});

const appleLoginSchema = z.object({
  identityToken: z.string().min(1, 'Identity token is required'),
  users: z
    .object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
    })
    .optional(),
});

// Initialize Google OAuth client
const googleClient = new OAuth2Client(config.google?.clientId);

/**
 * Google OAuth Login
 * Verifies the Google ID token and creates/updates user
 */
export async function googleLogin(req: Request, res: Response) {
  try {
    const { idToken } = googleLoginSchema.parse(req.body);

    if (!config.google?.clientId) {
      return res.status(500).json({ error: 'Google OAuth is not configured' });
    }

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.google.clientId,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const { sub: googleId, email, given_name, family_name, picture } = payload;

    if (!email) {
      return res.status(400).json({ error: 'Email not provided by Google' });
    }

    // Find or create user
    let user = await prisma.users.findUnique({ where: { googleId } });

    if (!user) {
      // Check if user exists with this email
      user = await prisma.users.findUnique({ where: { email } });

      if (user) {
        // Link Google account to existing user
        user = await prisma.users.update({
          where: { id: user.id },
          data: {
            googleId,
            avatarUrl: user.avatarUrl || picture,
            provider: user.provider || 'google',
          },
        });
        logger.info({ userId: user.id }, 'Linked Google account to existing user');
      } else {
        // Create new user
        user = await prisma.users.create({
          data: {
            email,
            googleId,
            firstName: given_name || '',
            lastName: family_name || '',
            avatarUrl: picture,
            provider: 'google',
            emailVerified: true,
            passwordHash: '', // Social login users don't have passwords
          },
        });
        logger.info({ userId: user.id }, 'Created new user via Google login');
      }
    } else {
      // Update last login
      user = await prisma.users.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          avatarUrl: user.avatarUrl || picture,
        },
      });
    }

    // Generate tokens
    const tokenPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      id: user.id,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Set cookies
    res.cookie(config.cookie.accessTokenName, accessToken, {
      httpOnly: true,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie(config.cookie.refreshTokenName, refreshToken, {
      httpOnly: true,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return res.json({
      users: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        provider: user.provider,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.issues });
    }

    logger.error({ err: error }, 'Google login failed');
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Apple OAuth Login
 * Verifies the Apple identity token and creates/updates user
 */
export async function appleLogin(req: Request, res: Response) {
  try {
    const { identityToken, users: appleUser } = appleLoginSchema.parse(req.body);

    if (!config.apple?.clientId) {
      return res.status(500).json({ error: 'Apple Sign In is not configured' });
    }

    // Verify the Apple identity token
    const payload = await appleSignin.verifyIdToken(identityToken, {
      audience: config.apple.clientId,
      ignoreExpiration: false,
    });

    const { sub: appleId, email } = payload;

    if (!email) {
      return res.status(400).json({ error: 'Email not provided by Apple' });
    }

    // Find or create user
    let user = await prisma.users.findUnique({ where: { appleId } });

    if (!user) {
      // Check if user exists with this email
      user = await prisma.users.findUnique({ where: { email } });

      if (user) {
        // Link Apple account to existing user
        user = await prisma.users.update({
          where: { id: user.id },
          data: {
            appleId,
            provider: user.provider || 'apple',
          },
        });
        logger.info({ userId: user.id }, 'Linked Apple account to existing user');
      } else {
        // Create new user
        // Note: Apple only provides name on first sign-in
        user = await prisma.users.create({
          data: {
            email,
            appleId,
            firstName: appleUser?.firstName || '',
            lastName: appleUser?.lastName || '',
            provider: 'apple',
            emailVerified: true,
            passwordHash: '', // Social login users don't have passwords
          },
        });
        logger.info({ userId: user.id }, 'Created new user via Apple login');
      }
    } else {
      // Update last login
      user = await prisma.users.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
        },
      });
    }

    // Generate tokens
    const tokenPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      id: user.id,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Set cookies
    res.cookie(config.cookie.accessTokenName, accessToken, {
      httpOnly: true,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie(config.cookie.refreshTokenName, refreshToken, {
      httpOnly: true,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return res.json({
      users: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        provider: user.provider,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.issues });
    }

    logger.error({ err: error }, 'Apple login failed');
    return res.status(500).json({ error: 'Authentication failed' });
  }
}
