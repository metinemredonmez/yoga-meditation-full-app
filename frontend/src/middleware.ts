import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Cookie names (must match backend config)
const ACCESS_TOKEN_COOKIE = 'yoga_access_token';
const SESSION_INDICATOR_COOKIE = 'yoga_session_active';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/instructor'];

// Routes that require ADMIN role
const adminRoutes = ['/dashboard'];

// Routes that require INSTRUCTOR role
const instructorRoutes = ['/instructor'];

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

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  const isInstructorRoute = instructorRoutes.some(route => pathname.startsWith(route));

  // If trying to access protected route without token, redirect to login
  if (isProtectedRoute && !token && !hasSession) {
    const loginUrl = new URL('/auth/sign-in', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access control (only if we can read the token)
  if (token) {
    const role = parseTokenRole(token);

    // Admin routes - only ADMIN can access
    if (isAdminRoute && role !== 'ADMIN') {
      // If instructor trying to access admin, redirect to instructor portal
      if (role === 'INSTRUCTOR') {
        return NextResponse.redirect(new URL('/instructor', request.url));
      }
      // Students and others redirect to home
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Instructor routes - ADMIN and INSTRUCTOR can access
    if (isInstructorRoute && role !== 'ADMIN' && role !== 'INSTRUCTOR') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // If trying to access auth route with token, redirect based on role
    if (isAuthRoute) {
      if (role === 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard/overview', request.url));
      } else if (role === 'INSTRUCTOR') {
        return NextResponse.redirect(new URL('/instructor', request.url));
      } else {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  } else if (hasSession && isAuthRoute) {
    // Has session indicator but can't read token - redirect to home
    // The actual auth check will happen on page load via API call
    return NextResponse.redirect(new URL('/', request.url));
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
