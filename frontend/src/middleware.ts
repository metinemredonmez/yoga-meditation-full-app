import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Cookie names (must match backend config)
const ACCESS_TOKEN_COOKIE = 'yoga_access_token';
const SESSION_INDICATOR_COOKIE = 'yoga_session_active';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/instructor'];

// Routes that should redirect to dashboard if already logged in
const authRoutes = ['/auth/sign-in', '/auth/sign-up'];

/**
 * Parse JWT to get role from HttpOnly cookie
 * Note: This is for route protection only - actual auth is verified by the backend
 */
function parseTokenRole(token: string): string | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return payload.role || 'STUDENT';
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  // Try to get the HttpOnly access token cookie
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  // Also check session indicator for auth status
  const hasSession = request.cookies.get(SESSION_INDICATOR_COOKIE)?.value === '1';

  const { pathname } = request.nextUrl;

  // Check if the route is protected or auth
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // Determine if user is authenticated (has token OR session indicator)
  const isAuthenticated = !!token || hasSession;

  // If trying to access protected route without authentication, redirect to login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/auth/sign-in', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated and trying to access auth routes, redirect to dashboard
  if (isAuthRoute && isAuthenticated) {
    // Try to get role from token for role-based redirect
    const role = token ? parseTokenRole(token) : null;
    const adminAllowedRoles = ['ADMIN', 'SUPER_ADMIN', 'TEACHER'];

    if (role && adminAllowedRoles.includes(role)) {
      return NextResponse.redirect(new URL('/dashboard/overview', request.url));
    } else if (role === 'INSTRUCTOR') {
      return NextResponse.redirect(new URL('/instructor', request.url));
    } else {
      // Default redirect for authenticated users
      return NextResponse.redirect(new URL('/dashboard/overview', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)'
  ]
};
