import { Response, CookieOptions } from 'express';
import { config } from './config';

// Cookie expiry times
const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Get base cookie options for secure HttpOnly cookies
 */
function getBaseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    path: '/',
    ...(config.cookie.domain && { domain: config.cookie.domain }),
  };
}

/**
 * Set access token as HttpOnly cookie
 */
export function setAccessTokenCookie(res: Response, token: string): void {
  res.cookie(config.cookie.accessTokenName, token, {
    ...getBaseCookieOptions(),
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });
}

/**
 * Set refresh token as HttpOnly cookie
 */
export function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie(config.cookie.refreshTokenName, token, {
    ...getBaseCookieOptions(),
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

/**
 * Set both access and refresh tokens as HttpOnly cookies
 */
export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string
): void {
  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken);
}

/**
 * Clear all auth cookies (for logout)
 */
export function clearAuthCookies(res: Response): void {
  const clearOptions: CookieOptions = {
    ...getBaseCookieOptions(),
    maxAge: 0,
  };

  res.cookie(config.cookie.accessTokenName, '', clearOptions);
  res.cookie(config.cookie.refreshTokenName, '', clearOptions);
}

/**
 * Get access token from request cookies
 */
export function getAccessTokenFromCookies(cookies: Record<string, string>): string | undefined {
  return cookies?.[config.cookie.accessTokenName];
}

/**
 * Get refresh token from request cookies
 */
export function getRefreshTokenFromCookies(cookies: Record<string, string>): string | undefined {
  return cookies?.[config.cookie.refreshTokenName];
}
