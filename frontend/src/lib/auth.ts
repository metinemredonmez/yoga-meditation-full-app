'use client';

// User session state (in-memory, populated from server response)
interface UserSession {
  userId: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'INSTRUCTOR' | 'ADMIN' | 'SUPER_ADMIN';
  firstName?: string;
  lastName?: string;
  subscriptionTier?: 'FREE' | 'PREMIUM' | 'FAMILY' | null;
  subscriptionExpiresAt?: string | null;
}

let currentSession: UserSession | null = null;

// Session indicator cookie name (non-sensitive, just to check if logged in)
const SESSION_INDICATOR_KEY = 'yoga_session_active';

/**
 * Set session from login/signup response
 * The actual tokens are stored as HttpOnly cookies by the server
 */
export function setSession(user: UserSession) {
  currentSession = user;
  // Set a simple indicator cookie (non-sensitive) for SSR/middleware checks
  if (typeof document !== 'undefined') {
    // Don't use secure flag on localhost
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const secureFlag = isLocalhost ? '' : 'secure;';
    document.cookie = `${SESSION_INDICATOR_KEY}=1; path=/; max-age=${30 * 24 * 60 * 60}; ${secureFlag} samesite=lax`;
  }
}

/**
 * Get current user session from memory
 */
export function getSession(): UserSession | null {
  return currentSession;
}

/**
 * Clear session and redirect to login
 */
export async function clearSession() {
  currentSession = null;
  // Clear the indicator cookie
  if (typeof document !== 'undefined') {
    document.cookie = `${SESSION_INDICATOR_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }

  // Call logout API to clear HttpOnly cookies on server
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
  try {
    await fetch(`${apiBaseUrl}/api/users/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout API error:', error);
  }

  if (typeof window !== 'undefined') {
    window.location.href = '/auth/sign-in';
  }
}

/**
 * Check if user appears to be authenticated
 * Note: This only checks the indicator cookie, actual auth is verified by the server
 */
export function isAuthenticated(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes(`${SESSION_INDICATOR_KEY}=1`);
}

/**
 * Get current user from session
 */
export function getCurrentUser(): UserSession | null {
  return currentSession;
}

/**
 * Check if user has specific role
 */
export function hasRole(role: UserSession['role']): boolean {
  return currentSession?.role === role;
}

/**
 * Check if user is admin
 */
export function isAdmin(): boolean {
  return currentSession?.role === 'ADMIN';
}

/**
 * Check if user is instructor/teacher
 */
export function isInstructor(): boolean {
  return currentSession?.role === 'TEACHER' || currentSession?.role === 'ADMIN' || currentSession?.role === 'SUPER_ADMIN';
}

/**
 * Check if user has premium subscription
 */
export function isPremium(): boolean {
  // Admins and instructors always have premium access
  if (currentSession?.role === 'ADMIN' || currentSession?.role === 'SUPER_ADMIN' || currentSession?.role === 'INSTRUCTOR' || currentSession?.role === 'TEACHER') {
    return true;
  }
  return currentSession?.subscriptionTier === 'PREMIUM' || currentSession?.subscriptionTier === 'FAMILY';
}

/**
 * Get user's subscription tier
 */
export function getSubscriptionTier(): 'FREE' | 'PREMIUM' | 'FAMILY' | null {
  return currentSession?.subscriptionTier || 'FREE';
}

/**
 * Check if user can access premium content
 * Returns true if user is premium or admin/instructor
 */
export function canAccessPremiumContent(): boolean {
  return isPremium();
}

// Legacy exports for backwards compatibility during migration
// TODO: Remove these after full migration
export function getAccessToken(): string | null {
  // HttpOnly cookies are not accessible from JS - return null
  // The browser will automatically include them in requests
  return null;
}

export function setAccessToken(_token: string): void {
  // No-op: tokens are now HttpOnly cookies set by server
  console.warn('setAccessToken is deprecated - tokens are now HttpOnly cookies');
}

export function parseToken(_token: string): UserSession | null {
  // No-op: tokens are now HttpOnly cookies, not accessible from JS
  console.warn('parseToken is deprecated - use getSession() instead');
  return null;
}
