import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Cookie names (must match backend config)
const ACCESS_TOKEN_COOKIE = 'yoga_access_token';
const SESSION_INDICATOR_COOKIE = 'yoga_session_active';

// Role hierarchy with numeric levels
const ROLE_LEVELS: Record<string, number> = {
  STUDENT: 10,
  TEACHER: 50,
  INSTRUCTOR: 50, // Alias for TEACHER
  ADMIN: 80,
  SUPER_ADMIN: 100,
};

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/instructor', '/student', '/admin'];

// Routes that should redirect to dashboard if already logged in
const authRoutes = ['/auth/sign-in', '/auth/sign-up'];

// Route-based role restrictions (minimum role level required)
const routeRoleRequirements: Record<string, number> = {
  // ADMIN panel routes - ONLY ADMIN+ can access /dashboard
  '/admin': ROLE_LEVELS.ADMIN,
  '/dashboard': ROLE_LEVELS.ADMIN, // ALL dashboard routes require ADMIN

  // INSTRUCTOR routes (level 50) - instructors use /instructor path
  '/instructor': ROLE_LEVELS.TEACHER,
  '/instructor/classes': ROLE_LEVELS.TEACHER,
  '/instructor/programs': ROLE_LEVELS.TEACHER,
  '/instructor/meditations': ROLE_LEVELS.TEACHER,
  '/instructor/breathwork': ROLE_LEVELS.TEACHER,
  '/instructor/sleep-stories': ROLE_LEVELS.TEACHER,
  '/instructor/playlists': ROLE_LEVELS.TEACHER,
  '/instructor/podcasts': ROLE_LEVELS.TEACHER,
  '/instructor/live-streams': ROLE_LEVELS.TEACHER,
  '/instructor/calendar': ROLE_LEVELS.TEACHER,
  '/instructor/analytics': ROLE_LEVELS.TEACHER,
  '/instructor/students': ROLE_LEVELS.TEACHER,
  '/instructor/reviews': ROLE_LEVELS.TEACHER,
  '/instructor/profile': ROLE_LEVELS.TEACHER,
  '/instructor/billing': ROLE_LEVELS.TEACHER,
  '/instructor/notifications': ROLE_LEVELS.TEACHER,
  '/instructor/settings': ROLE_LEVELS.TEACHER,

  // STUDENT routes (level 10) - accessible to all authenticated users
  '/student': ROLE_LEVELS.STUDENT,
  '/student/profile': ROLE_LEVELS.STUDENT,
  '/student/billing': ROLE_LEVELS.STUDENT,
  '/student/favorites': ROLE_LEVELS.STUDENT,
  '/student/history': ROLE_LEVELS.STUDENT,
  '/student/goals': ROLE_LEVELS.STUDENT,
  '/student/notifications': ROLE_LEVELS.STUDENT,
  '/student/settings': ROLE_LEVELS.STUDENT,
};

/**
 * Parse JWT to get payload from HttpOnly cookie
 * Note: This is for route protection only - actual auth is verified by the backend
 */
function parseToken(token: string): { role: string; userId: string } | null {
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
    return {
      role: payload.role || 'STUDENT',
      userId: payload.userId || payload.id,
    };
  } catch {
    return null;
  }
}

function getRoleLevel(role: string): number {
  return ROLE_LEVELS[role] ?? 0;
}

function getRequiredRoleLevel(pathname: string): number {
  // Check exact match first
  if (routeRoleRequirements[pathname]) {
    return routeRoleRequirements[pathname];
  }

  // Check prefix matches (for nested routes)
  for (const [route, level] of Object.entries(routeRoleRequirements)) {
    if (pathname.startsWith(route + '/')) {
      return level;
    }
  }

  // Default: require TEACHER level for any dashboard route
  if (pathname.startsWith('/dashboard')) {
    return ROLE_LEVELS.TEACHER;
  }

  return 0;
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

  // If authenticated, check role-based access
  if (isProtectedRoute && isAuthenticated && token) {
    const tokenData = parseToken(token);
    if (tokenData) {
      const userLevel = getRoleLevel(tokenData.role);
      const requiredLevel = getRequiredRoleLevel(pathname);

      // TEACHER should NOT access /student routes - redirect to /instructor
      if (pathname.startsWith('/student') && (tokenData.role === 'TEACHER' || tokenData.role === 'INSTRUCTOR')) {
        return NextResponse.redirect(new URL('/instructor', request.url));
      }

      // ADMIN/SUPER_ADMIN should NOT access /student or /instructor - redirect to /dashboard
      if ((pathname.startsWith('/student') || pathname.startsWith('/instructor')) &&
          (tokenData.role === 'ADMIN' || tokenData.role === 'SUPER_ADMIN')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // Check if user has sufficient role level
      if (userLevel < requiredLevel) {
        // Redirect to appropriate page based on role
        if (userLevel >= ROLE_LEVELS.ADMIN) {
          // Admins go to dashboard
          return NextResponse.redirect(new URL('/dashboard', request.url));
        } else if (userLevel >= ROLE_LEVELS.TEACHER) {
          // Teachers/Instructors go to instructor panel
          return NextResponse.redirect(new URL('/instructor', request.url));
        } else {
          // Students and lower get redirected to student panel or unauthorized
          return NextResponse.redirect(new URL('/student', request.url));
        }
      }
    }
  }

  // If authenticated and trying to access auth routes, redirect to appropriate page
  if (isAuthRoute && isAuthenticated) {
    // Try to get role from token for role-based redirect
    const tokenData = token ? parseToken(token) : null;
    const role = tokenData?.role;

    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url));
    } else if (role === 'TEACHER' || role === 'INSTRUCTOR') {
      return NextResponse.redirect(new URL('/instructor', request.url));
    } else {
      // Default redirect for authenticated users (STUDENT goes to student panel)
      return NextResponse.redirect(new URL('/student', request.url));
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
