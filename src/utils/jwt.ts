import jwt from 'jsonwebtoken';
import type { UserRole } from '@prisma/client';
import { config } from './config';

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId?: string;
  id: string;
}

const accessTokenSecret: jwt.Secret = config.JWT_ACCESS_SECRET;

const signOptions: jwt.SignOptions = {
  expiresIn: config.JWT_ACCESS_EXPIRES_IN as NonNullable<jwt.SignOptions['expiresIn']>,
  issuer: config.JWT_ISSUER,
  audience: config.JWT_AUDIENCE,
};

const refreshTokenSecret: jwt.Secret = config.JWT_REFRESH_SECRET;

const refreshSignOptions: jwt.SignOptions = {
  expiresIn: config.JWT_REFRESH_EXPIRES_IN as NonNullable<jwt.SignOptions['expiresIn']>,
  issuer: `${config.JWT_ISSUER}:refresh`,
  audience: config.JWT_AUDIENCE,
};

const verifyOptions: jwt.VerifyOptions = {
  issuer: config.JWT_ISSUER,
  audience: config.JWT_AUDIENCE,
};

const refreshVerifyOptions: jwt.VerifyOptions = {
  issuer: `${config.JWT_ISSUER}:refresh`,
  audience: config.JWT_AUDIENCE,
};

export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, accessTokenSecret, signOptions);
}

export function verifyAccessToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, accessTokenSecret, verifyOptions) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, refreshTokenSecret, refreshSignOptions);
}

export function verifyRefreshToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, refreshTokenSecret, refreshVerifyOptions) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// Temporary alias for legacy usage; will be removed once all call-sites adopt the new helpers.
export const generateToken = generateAccessToken;
export const verifyToken = verifyAccessToken;
